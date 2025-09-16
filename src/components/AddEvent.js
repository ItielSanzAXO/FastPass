// --- IMPORTS ---
import React, { useState, useEffect } from "react";
import AdminLoginForm from "./AdminLoginForm.js";
import EventForm from "./EventForm.js";
import { db } from "../firebaseConfig.js";
import {
  doc,
  setDoc,
  collection,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useHistory } from "react-router-dom";
import "../styles/AddEvent.css";

// --- Helpers / Estado inicial ---
const initialState = {
  name: "",
  venueId: "auditorio-itiz",
  allowResale: false,
  ticketLimitPerUser: 1,
  ticketPricing: { General: 0, VIP: 0 },
  imageUrl: "",
  // Para inputs <input type="datetime-local" />
  date: "", // 'YYYY-MM-DDTHH:mm'
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Convierte Firestore Timestamp | Date | string a 'YYYY-MM-DDTHH:mm' (local)
function fromTimestampToLocalInput(value) {
  if (!value) return "";
  let d;
  if (value instanceof Timestamp) {
    d = value.toDate();
  } else if (value?.seconds && typeof value.seconds === "number") {
    d = new Date(value.seconds * 1000);
  } else if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string") {
    const tmp = new Date(value);
    if (!isNaN(tmp.getTime())) d = tmp;
  }
  if (!d || isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const MM = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

// Convierte 'YYYY-MM-DDTHH:mm' a Firestore Timestamp
function toTimestamp(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

// --- COMPONENTE ---
function AddEvent() {
  // Estado para el usuario autenticado
  const [user, setUser] = useState(null);

  // Actualizar usuario autenticado al montar el componente o cuando cambie el login
  useEffect(() => {
    const auth = getAuth();
    setUser(auth.currentUser);
    // Listener para cambios de autenticación
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);
  // Login/Admin
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Acciones / datos
  const [action, setAction] = useState("");
  const [events, setEvents] = useState([]);

  // Editar
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(initialState);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

  // Agregar
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const history = useHistory();

  // --- Cerrar sesión ---
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setLoginAttempts(0);
    const auth = getAuth();
    auth.signOut();
  };

  // --- Login admin seguro con Google + password en colección admins ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    const auth = getAuth();
    let user = auth.currentUser;

    // Si no hay usuario autenticado, solicitar Google Sign-In
    if (!user) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      } catch (err) {
        setLoginError("Debes iniciar sesión con Google para continuar");
        return;
      }
    }

    console.log("[DEBUG] Usuario autenticado con Firebase Auth:", user?.email);

    // Validar permisos en colección admins
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.email));
      if (!adminDoc.exists()) {
        setLoginError("No tienes permisos de administrador");
        console.log(
          "[DEBUG] El email autenticado no está en la colección admins:",
          user.email
        );
        return;
      }
      const data = adminDoc.data();
      if (data.password !== loginPassword) {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        setLoginError("Contraseña incorrecta");
        if (next >= 3) history.push("/");
        console.log("[DEBUG] Password incorrecto para:", user.email);
        return;
      }
      setIsLoggedIn(true);
      setLoginAttempts(0);
      console.log("[DEBUG] Login de admin exitoso para:", user.email);
    } catch (err) {
      setLoginError("Error de conexión");
      console.log("[DEBUG] Error al validar admin:", err);
    }
  };

  // --- Cargar eventos cuando hay login ---
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      const snap = await getDocs(collection(db, "events"));
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setEvents(list);
    })();
  }, [isLoggedIn]);

  // --- Seleccionar evento a editar ---
  const handleEdit = (event) => {
    setEditId(event.id);
    setEditForm({
      name: event.name || "",
      venueId: event.venueId || "auditorio-itiz",
      allowResale: !!event.allowResale,
      ticketLimitPerUser: Number(event.ticketLimitPerUser || 1),
      ticketPricing: event.ticketPricing || { General: 0, VIP: 0 },
      imageUrl: event.imageUrl || "",
      date: fromTimestampToLocalInput(event.date || ""),
    });
    setEditSuccess("");
    setEditError("");
  };

  // --- Cambios en formulario de edición ---
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setEditForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "ticketPricingGeneral") {
      setEditForm((prev) => ({
        ...prev,
        ticketPricing: { ...prev.ticketPricing, General: Number(value) },
      }));
    } else if (name === "ticketPricingVIP") {
      setEditForm((prev) => ({
        ...prev,
        ticketPricing: { ...prev.ticketPricing, VIP: Number(value) },
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- Confirmar edición ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSuccess("");
    setEditError("");
    // Validación básica de campos obligatorios
    if (!editForm.name || !editForm.name.trim()) {
      setEditError("El nombre del evento es obligatorio.");
      return;
    }
    if (!editForm.date || isNaN(new Date(editForm.date).getTime())) {
      setEditError("La fecha es obligatoria y debe ser válida.");
      return;
    }
    try {
      if (user && user.email) {
        console.log('Email autenticado (edit):', user.email);
      } else {
        console.log('No hay usuario autenticado (edit)');
      }
      const payload = {
        ...editForm,
        ticketLimitPerUser: Number(editForm.ticketLimitPerUser || 1),
        ticketPricing: {
          General: Number(editForm.ticketPricing?.General || 0),
          VIP:
            editForm.venueId === "salon-51"
              ? 0
              : Number(editForm.ticketPricing?.VIP || 0),
        },
        date: toTimestamp(editForm.date),
      };
  console.log('Payload enviado a Firestore (edit):', payload);
      await setDoc(doc(db, "events", editId), payload, { merge: true });
      setEditSuccess("Evento editado correctamente ✅");
      setEditId(null);
    } catch (err) {
      setEditError("Error al editar evento: " + err.message);
    }
  };

  // --- Cambios en formulario de alta ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "ticketPricingGeneral") {
      setForm((prev) => ({
        ...prev,
        ticketPricing: { ...prev.ticketPricing, General: Number(value) },
      }));
    } else if (name === "ticketPricingVIP") {
      setForm((prev) => ({
        ...prev,
        ticketPricing: { ...prev.ticketPricing, VIP: Number(value) },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- Confirmar alta ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);
    // Validación básica de campos obligatorios
    if (!form.name || !form.name.trim()) {
      setError("El nombre del evento es obligatorio.");
      setLoading(false);
      return;
    }
    if (!form.date || isNaN(new Date(form.date).getTime())) {
      setError("La fecha es obligatoria y debe ser válida.");
      setLoading(false);
      return;
    }
    try {
      if (user && user.email) {
        console.log('Email autenticado (add):', user.email);
      } else {
        console.log('No hay usuario autenticado (add)');
      }
      const payload = {
        ...form,
        ticketLimitPerUser: Number(form.ticketLimitPerUser || 1),
        ticketPricing: {
          General: Number(form.ticketPricing?.General || 0),
          VIP:
            form.venueId === "salon-51"
              ? 0
              : Number(form.ticketPricing?.VIP || 0),
        },
        date: toTimestamp(form.date),
      };
  console.log('Payload enviado a Firestore (add):', payload);
      const docId = form.name.trim().replace(/\s+/g, "-").toLowerCase();
      await setDoc(doc(db, "events", docId), payload);
      setSuccess("Evento agregado correctamente ✅");
      setForm(initialState);
    } catch (err) {
      setError("Error al agregar evento: " + err.message);
    }
    setLoading(false);
  };

  // --- Render ---
  return (
    <div className="add-event-main-bg" style={{ position: "relative" }}>
      {isLoggedIn && (
        <button
          className="add-event-logout-btn"
          style={{ position: "absolute", top: 24, right: 32 }}
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      )}

      <div className="add-event-card-central">
        {!isLoggedIn ? (
          <AdminLoginForm
            loginEmail={loginEmail}
            setLoginEmail={setLoginEmail}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            handleLogin={handleLogin}
            loginError={loginError}
          />
        ) : (
          <>
            {!action ? (
              <div className="add-event-actions">
                <h2 className="add-event-title">¿Qué deseas hacer?</h2>
                <div className="add-event-actions-btns">
                  <button
                    className="add-event-btn add-event-btn-green"
                    onClick={() => setAction("add")}
                  >
                    Agregar evento
                  </button>
                  <button
                    className="add-event-btn add-event-btn-blue"
                    onClick={() => setAction("edit")}
                  >
                    Editar evento
                  </button>
                </div>
              </div>
            ) : null}

            {action === "add" && (
              <div className="add-event-form-section">
                <h2 className="add-event-title">Agregar Evento</h2>
                <EventForm
                  mode="add"
                  form={form}
                  setForm={setForm}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  success={success}
                  error={error}
                  onCancel={() => setAction("")}
                />
              </div>
            )}

            {action === "edit" && (
              <div className="add-event-form-section">
                <h2 className="add-event-title">Editar Evento</h2>
                {!editId ? (
                  <>
                    <div className="add-event-list-grid">
                      {events.map((ev) => (
                        <div key={ev.id} className="add-event-card">
                          <div className="add-event-card-header">
                            <span className="add-event-card-title">
                              {ev.name}
                            </span>
                            <span className="add-event-card-id">
                              ID: {ev.id}
                            </span>
                          </div>
                          <div className="add-event-card-date">
                            <span>
                              Fecha principal:{" "}
                              {ev.date
                                ? ev.date.seconds
                                  ? new Date(
                                      ev.date.seconds * 1000
                                    ).toLocaleString()
                                  : String(ev.date)
                                : "Sin fecha"}
                            </span>
                          </div>
                          <button
                            className="add-event-btn add-event-btn-blue add-event-card-edit"
                            onClick={() => handleEdit(ev)}
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="add-event-btn add-event-btn-gray"
                      onClick={() => setAction("")}
                    >
                      Volver
                    </button>
                  </>
                ) : (
                  <>
                    <EventForm
                      mode="edit"
                      form={editForm}
                      setForm={setEditForm}
                      handleChange={handleEditChange}
                      handleSubmit={handleEditSubmit}
                      loading={false}
                      success={editSuccess}
                      error={editError}
                      onCancel={() => setEditId(null)}
                      isEdit={true}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AddEvent;
