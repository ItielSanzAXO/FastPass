// --- IMPORTS ---
import React, { useState, useEffect } from "react";
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
    <div className="add-event-main-bg">
      <div className="add-event-card-central">
        {!isLoggedIn ? (
          <form className="add-event-form add-event-form-login" onSubmit={handleLogin}>
            <h2 className="add-event-title">Acceso Administrador</h2>
            <div className="add-event-form-row">
              <label>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            </div>
            <div className="add-event-form-row">
              <label>Contraseña</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            </div>
            <button className="add-event-btn add-event-btn-blue" type="submit">Iniciar sesión</button>
            {loginError && <div className="add-event-error">{loginError}</div>}
          </form>
        ) : (
          <>
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
                <form className="add-event-form" onSubmit={handleSubmit}>
                  <div className="add-event-form-row">
                    <label>Nombre del evento</label>
                    <input name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="add-event-form-row">
                    <label>Venue</label>
                    <select name="venueId" value={form.venueId} onChange={handleChange} required>
                      <option value="auditorio-itiz">Auditorio ITIZ</option>
                      <option value="duela-itiz">Duela ITIZ</option>
                      <option value="salon-51">Salon 51</option>
                    </select>
                  </div>
                  <div className="add-event-form-row">
                    <label>Fecha y hora principal</label>
                    <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required />
                  </div>
                  <div className="add-event-form-row">
                    <label>URL de la imagen</label>
                    <input name="imageUrl" value={form.imageUrl} onChange={handleChange} required placeholder="https://..." />
                  </div>
                  <div className="add-event-form-row">
                    <label>Límite de boletos por usuario</label>
                    <input name="ticketLimitPerUser" type="number" min="1" value={form.ticketLimitPerUser} onChange={handleChange} required />
                  </div>
                  <div className="add-event-form-row">
                    <label>Precio General</label>
                    <input name="ticketPricingGeneral" type="number" min="0" value={form.ticketPricing.General} onChange={handleChange} required />
                  </div>
                  {form.venueId !== "salon-51" && (
                    <div className="add-event-form-row">
                      <label>Precio VIP</label>
                      <input name="ticketPricingVIP" type="number" min="0" value={form.ticketPricing.VIP} onChange={handleChange} />
                    </div>
                  )}
                  <div className="add-event-form-row">
                    <label>
                      <input name="allowResale" type="checkbox" checked={form.allowResale} onChange={handleChange} /> Permitir reventa
                    </label>
                  </div>
                  <button className="add-event-btn add-event-btn-blue" type="submit" disabled={loading}>
                    {loading ? "Agregando..." : "Agregar Evento"}
                  </button>
                </form>
                {success && <div className="add-event-success">{success}</div>}
                {error && <div className="add-event-error">{error}</div>}
                <button className="add-event-btn add-event-btn-gray" onClick={() => setAction("")}>Volver</button>
              </div>
            )}

            {action === "edit" && (
              <div className="add-event-form-section">
                <h2 className="add-event-title">Editar Evento</h2>
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
                {editId && (
                  <form className="add-event-form" onSubmit={handleEditSubmit}>
                    <div className="add-event-form-row">
                      <label>Nombre del evento</label>
                      <input name="name" value={editForm.name} onChange={handleEditChange} required />
                    </div>
                    <div className="add-event-form-row">
                      <label>Venue</label>
                      <select name="venueId" value={editForm.venueId} onChange={handleEditChange} required>
                        <option value="auditorio-itiz">Auditorio ITIZ</option>
                        <option value="duela-itiz">Duela ITIZ</option>
                        <option value="salon-51">Salon 51</option>
                      </select>
                    </div>
                    <div className="add-event-form-row">
                      <label>Fecha y hora principal</label>
                      <input type="datetime-local" name="date" value={editForm.date} onChange={handleEditChange} required />
                    </div>
                    <div className="add-event-form-row">
                      <label>URL de la imagen</label>
                      <input name="imageUrl" value={editForm.imageUrl} onChange={handleEditChange} required />
                    </div>
                    <div className="add-event-form-row">
                      <label>Límite de boletos por usuario</label>
                      <input name="ticketLimitPerUser" type="number" min="1" value={editForm.ticketLimitPerUser} onChange={handleEditChange} required />
                    </div>
                    <div className="add-event-form-row">
                      <label>Precio General</label>
                      <input name="ticketPricingGeneral" type="number" min="0" value={editForm.ticketPricing.General} onChange={handleEditChange} required />
                    </div>
                    {editForm.venueId !== "salon-51" && (
                      <div className="add-event-form-row">
                        <label>Precio VIP</label>
                        <input name="ticketPricingVIP" type="number" min="0" value={editForm.ticketPricing.VIP} onChange={handleEditChange} />
                      </div>
                    )}
                    <div className="add-event-form-row">
                      <label>
                        <input name="allowResale" type="checkbox" checked={editForm.allowResale} onChange={handleEditChange} /> Permitir reventa
                      </label>
                    </div>
                    <button className="add-event-btn add-event-btn-blue" type="submit">Guardar cambios</button>
                    <button className="add-event-btn add-event-btn-gray" type="button" onClick={() => setEditId(null)}>Cancelar</button>
                    {editSuccess && <div className="add-event-success">{editSuccess}</div>}
                    {editError && <div className="add-event-error">{editError}</div>}
                  </form>
                )}
                <button className="add-event-btn add-event-btn-gray" onClick={() => setAction("")}>Volver</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AddEvent;
