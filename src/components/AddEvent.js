// --- IMPORTS ---
import React, { useState, useEffect } from "react";
import AdminLoginForm from "./AdminLoginForm.js";
import EventForm from "./EventForm.js";
import { db } from "../firebaseConfig.js";
import { doc, setDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { useHistory } from "react-router-dom";
import "../styles/AddEvent.css";

// --- STATE INICIAL ---
const initialState = {
  name: "",
  venueId: "auditorio-itiz",
  allowResale: false,
  ticketLimitPerUser: 1,
  ticketPricing: { General: 0, VIP: 0 },
  imageUrl: "",
  date: "" // string para el input type="datetime-local"
};

// --- HELPERS ---
const toTimestamp = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : Timestamp.fromDate(d);
};

const fromTimestampToLocalInput = (ts) => {
  if (!ts) return "";
  const dateObj = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(dateObj.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  const mm = pad(dateObj.getMonth() + 1);
  const dd = pad(dateObj.getDate());
  const hh = pad(dateObj.getHours());
  const mi = pad(dateObj.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

// --- COMPONENTE ---
function AddEvent() {
  // Login/Admin
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Cerrar sesión
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setLoginAttempts(0);
  };

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

  // --- Login admin ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const adminsRef = collection(db, "admins");
      const snapshot = await getDocs(adminsRef);
      let found = false;
      snapshot.forEach((docu) => {
        const data = docu.data();
        if (data.email === loginEmail && data.password === loginPassword) {
          found = true;
        }
      });
      if (found) {
        setIsLoggedIn(true);
        setLoginAttempts(0);
      } else {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        setLoginError("Usuario o contraseña incorrectos");
        if (next >= 3) history.push("/");
      }
    } catch {
      setLoginError("Error de conexión");
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

  // --- Editar ---
  const handleEdit = (event) => {
    setEditId(event.id);
    setEditForm({
      name: event.name || "",
      venueId: event.venueId || "auditorio-itiz",
      allowResale: !!event.allowResale,
      ticketLimitPerUser: Number(event.ticketLimitPerUser || 1),
      ticketPricing: event.ticketPricing || { General: 0, VIP: 0 },
      imageUrl: event.imageUrl || "",
      date: fromTimestampToLocalInput(event.date || "")
    });
    setEditSuccess("");
    setEditError("");
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setEditForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "ticketPricingGeneral") {
      setEditForm((prev) => ({ ...prev, ticketPricing: { ...prev.ticketPricing, General: Number(value) } }));
    } else if (name === "ticketPricingVIP") {
      setEditForm((prev) => ({ ...prev, ticketPricing: { ...prev.ticketPricing, VIP: Number(value) } }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSuccess("");
    setEditError("");
    try {
      const payload = {
        ...editForm,
        ticketLimitPerUser: Number(editForm.ticketLimitPerUser || 1),
        ticketPricing: {
          General: Number(editForm.ticketPricing?.General || 0),
          VIP: editForm.venueId === "salon-51" ? 0 : Number(editForm.ticketPricing?.VIP || 0)
        },
        date: toTimestamp(editForm.date)
      };
      await setDoc(doc(db, "events", editId), payload, { merge: true });
      setEditSuccess("Evento editado correctamente ✅");
      setEditId(null);
    } catch (err) {
      setEditError("Error al editar evento: " + err.message);
    }
  };

  // --- Agregar ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "ticketPricingGeneral") {
      setForm((prev) => ({ ...prev, ticketPricing: { ...prev.ticketPricing, General: Number(value) } }));
    } else if (name === "ticketPricingVIP") {
      setForm((prev) => ({ ...prev, ticketPricing: { ...prev.ticketPricing, VIP: Number(value) } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        ticketLimitPerUser: Number(form.ticketLimitPerUser || 1),
        ticketPricing: {
          General: Number(form.ticketPricing?.General || 0),
          VIP: form.venueId === "salon-51" ? 0 : Number(form.ticketPricing?.VIP || 0)
        },
        date: toTimestamp(form.date)
      };
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
    <div className="add-event-main-bg" style={{ position: 'relative' }}>
      {isLoggedIn && (
        <button
          className="add-event-logout-btn"
          style={{
            position: "absolute",
            top: 24,
            right: 32
          }}
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      )}
      <div className="add-event-card-central">
        {/* ...existing code... */}
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
            {/* ...existing code... */}
            {!action ? (
              <div className="add-event-actions">
                <h2 className="add-event-title">¿Qué deseas hacer?</h2>
                <div className="add-event-actions-btns">
                  <button className="add-event-btn add-event-btn-green" onClick={() => setAction("add")}>Agregar evento</button>
                  <button className="add-event-btn add-event-btn-blue" onClick={() => setAction("edit")}>Editar evento</button>
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
                {/* Si NO se está editando, mostrar las cards. Si SÍ se está editando, mostrar solo el form */}
                {!editId ? (
                  <>
                    <div className="add-event-list-grid">
                      {events.map(ev => (
                        <div key={ev.id} className="add-event-card">
                          <div className="add-event-card-header">
                            <span className="add-event-card-title">{ev.name}</span>
                            <span className="add-event-card-id">ID: {ev.id}</span>
                          </div>
                          <div className="add-event-card-date">
                            <span>Fecha principal: {ev.date ? (ev.date.seconds ? new Date(ev.date.seconds * 1000).toLocaleString() : ev.date) : "Sin fecha"}</span>
                          </div>
                          <button className="add-event-btn add-event-btn-blue add-event-card-edit" onClick={() => handleEdit(ev)}>
                            ✏️ Editar
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="add-event-btn add-event-btn-gray" onClick={() => setAction("")}>Volver</button>
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
