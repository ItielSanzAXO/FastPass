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
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
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
  isUpcomingLaunch: false, // ⬅️ flag para lanzamientos
  date: "", // 'YYYY-MM-DDTHH:mm'
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Firestore Timestamp | Date | string -> 'YYYY-MM-DDTHH:mm' local
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

// 'YYYY-MM-DDTHH:mm' -> Firestore Timestamp
function toTimestamp(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

// --- COMPONENTE ---
function AddEvent() {
  // Sesión (para logs)
  const [user, setUser] = useState(null);
  useEffect(() => {
    const auth = getAuth();
    setUser(auth.currentUser);
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);
  // Logs de sesión (usa `user` y quita el warning)
  useEffect(() => {
    if (user) {
      console.log("[AUTH] Sesión activa:", { uid: user.uid, email: user.email });
    } else {
      console.log("[AUTH] Sesión: null");
    }
  }, [user]);

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

  // --- Login admin (Google + verificación en /admins por email) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    const auth = getAuth();
    let current = auth.currentUser;

    if (!current) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        current = result.user;
      } catch {
        setLoginError("Debes iniciar sesión con Google para continuar");
        return;
      }
    }

    console.log("[DEBUG] Usuario autenticado:", current?.email);

    try {
      const adminDoc = await getDoc(doc(db, "admins", current.email));
      if (!adminDoc.exists()) {
        setLoginError("No tienes permisos de administrador");
        console.log("[DEBUG] No está en /admins:", current.email);
        return;
      }
      const data = adminDoc.data();
      if (data.password !== loginPassword) {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        setLoginError("Contraseña incorrecta");
        if (next >= 3) history.push("/");
        console.log("[DEBUG] Password incorrecto para:", current.email);
        return;
      }
      setIsLoggedIn(true);
      setLoginAttempts(0);
      console.log("[DEBUG] Login admin OK:", current.email);
    } catch (err) {
      setLoginError("Error de conexión");
      console.log("[DEBUG] Error al validar admin:", err);
    }
  };

  // --- Cargar eventos ---
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
      isUpcomingLaunch: !!event.isUpcomingLaunch,
      date: fromTimestampToLocalInput(event.date || ""),
    });
    setEditSuccess("");
    setEditError("");
  };

  // --- Eliminar evento ---
  const handleDelete = async (id, name) => {
    const ok = window.confirm(
      `¿Seguro que quieres eliminar el evento "${name}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "events", id));
      setEvents((prev) => prev.filter((e) => e.id !== id));
      alert("Evento eliminado correctamente ✅");
      if (editId === id) setEditId(null);
    } catch (err) {
      alert("Error al eliminar evento: " + err.message);
    }
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

    if (!editForm.name || !editForm.name.trim()) {
      setEditError("El nombre del evento es obligatorio.");
      return;
    }

    const isLaunch = editForm.isUpcomingLaunch === true;
    if (!isLaunch) {
      if (!editForm.date || isNaN(new Date(editForm.date).getTime())) {
        setEditError("La fecha es obligatoria y debe ser válida.");
        return;
      }
    }

    try {
      let payload;
      if (isLaunch) {
        payload = {
          name: editForm.name.trim(),
          venueId: editForm.venueId,
          imageUrl: editForm.imageUrl,
          isUpcomingLaunch: true,
        };
      } else {
        payload = {
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
          isUpcomingLaunch: false,
        };
      }

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

    if (!form.name || !form.name.trim()) {
      setError("El nombre del evento es obligatorio.");
      setLoading(false);
      return;
    }

    try {
      const isLaunch =
        form.isUpcomingLaunch === true
          ? true
          : window.confirm(
              "¿Es un lanzamiento próximo? (Aceptar = Sí; se guardará solo Nombre, Venue e Imagen)"
            );

      let payload;
      if (isLaunch) {
        payload = {
          name: form.name.trim(),
          venueId: form.venueId,
          imageUrl: form.imageUrl,
          isUpcomingLaunch: true,
        };
      } else {
        if (!form.date || isNaN(new Date(form.date).getTime())) {
          setError("La fecha es obligatoria y debe ser válida.");
          setLoading(false);
          return;
        }
        payload = {
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
          isUpcomingLaunch: false,
        };
      }

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
                          <div
                            key={ev.id}
                            className={`add-event-card ${ev.imageUrl ? "has-bg" : ""}`}
                            style={ev.imageUrl ? { backgroundImage: `url(${ev.imageUrl})` } : undefined}
                          >
                            {/* overlay solo si hay imagen */}
                            {ev.imageUrl && <div className="add-event-card-overlay" />}

                            {/* contenido */}
                            <div className="add-event-card-content">
                              <div className="add-event-card-header">
                                <div className="add-event-card-title">
                                  <strong>Evento:</strong> {`"${ev.name || "Sin nombre"}"`}
                                </div>
                                {/* ID oculto */}
                              </div>

                              {ev.isUpcomingLaunch && (
                                <div className="add-event-badge">Lanzamiento próximo</div>
                              )}

                              <div className="add-event-card-date">
                                <span>
                                  Fecha principal:{" "}
                                  {ev.date
                                    ? ev.date.seconds
                                      ? new Date(ev.date.seconds * 1000).toLocaleString()
                                      : String(ev.date)
                                    : "Sin fecha"}
                                </span>
                              </div>

                              <div className="add-event-card-actions">
                                <button
                                  className="add-event-btn add-event-btn-blue add-event-card-edit"
                                  onClick={() => handleEdit(ev)}
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  className="add-event-btn add-event-btn-red add-event-card-delete"
                                  onClick={() => handleDelete(ev.id, ev.name)}
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </div>
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
                    <button
                      className="add-event-btn add-event-btn-red"
                      onClick={() => handleDelete(editId, editForm.name || editId)}
                      style={{ marginTop: 12 }}
                    >
                      🗑️ Eliminar este evento
                    </button>
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