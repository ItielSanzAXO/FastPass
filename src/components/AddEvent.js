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
  serverTimestamp,
} from "firebase/firestore";
import { generateTicketsForEvent } from "../utils/generateTicketsForEvent.js";
import { deleteTicketsForEvent } from "../utils/deleteTicketsForEvent.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { useHistory } from "react-router-dom";
import "../styles/AddEvent.css";

// --- Helpers / Estado inicial ---
const initialState = {
  name: "",
  venueId: "",
  allowResale: false,
  ticketLimitPerUser: 1,
  ticketPricing: { General: 0, VIP: 0 },
  imageUrl: "",
  isUpcomingLaunch: false, // ⬅️ flag para lanzamientos
  date: "", // 'YYYY-MM-DDTHH:mm'
};

const initialVenueState = {
  id: "",
  name: "",
  type: "",
  capacity: "",
  zones: "General",
  layoutType: "salon-51",
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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- COMPONENTE ---
function AddEvent() {
  // Popup para éxito y mensajes
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });
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
  const [venues, setVenues] = useState([]);

  // Editar
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(initialState);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

  // Agregar
  const [form, setForm] = useState(initialState);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [venueForm, setVenueForm] = useState(initialVenueState);
  const [venueError, setVenueError] = useState("");
  const [venueLoading, setVenueLoading] = useState(false);

  const history = useHistory();

  // --- Cerrar sesión ---
  const handleLogout = async () => {
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setLoginAttempts(0);
    try {
      await signOut(getAuth());
    } catch (e) {
      console.warn("[AUTH] Error al cerrar sesión:", e?.message || e);
    }
    // Evitar volver con back al panel
    history.replace("/");
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

      const venuesSnap = await getDocs(collection(db, "venues"));
      const venueList = [];
      venuesSnap.forEach((d) => venueList.push({ id: d.id, ...d.data() }));
      venueList.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
      setVenues(venueList);

      if (venueList.length > 0) {
        setForm((prev) => ({
          ...prev,
          venueId: prev.venueId || venueList[0].id,
        }));
      }
    })();
  }, [isLoggedIn, action]);

  const selectedVenue = venues.find((venue) => venue.id === form.venueId) || null;
  const selectedEditVenue = venues.find((venue) => venue.id === editForm.venueId) || null;

  // Permitir refrescar la lista manualmente desde el botón "Editar evento"
  const handleShowEditList = () => {
    setAction("edit");
  };

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenueForm((prev) => ({
      ...prev,
      [name]: name === "id" ? slugify(value) : value,
    }));
  };

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    setVenueError("");
    setVenueLoading(true);

    try {
      const venueId = slugify(venueForm.id || venueForm.name);
      if (!venueId) throw new Error("El ID o nombre del venue es obligatorio.");
      if (!venueForm.name.trim()) throw new Error("El nombre del venue es obligatorio.");

      const payload = {
        name: venueForm.name.trim(),
        type: venueForm.type.trim() || "Venue",
        capacity: Number(venueForm.capacity || 0),
        zones: venueForm.zones
          .split(",")
          .map((zone) => zone.trim())
          .filter(Boolean),
        layoutType: venueForm.layoutType,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "venues", venueId), payload, { merge: true });

      const newVenue = { id: venueId, ...payload };
      setVenues((prev) => [...prev.filter((venue) => venue.id !== venueId), newVenue].sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id))));
      setForm((prev) => ({ ...prev, venueId: prev.venueId || venueId }));
      setVenueForm(initialVenueState);
      setPopupMsg("Venue guardado correctamente ✅");
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        setPopupMsg("");
      }, 1500);
    } catch (err) {
      setVenueError(err.message || "No se pudo guardar el venue.");
    } finally {
      setVenueLoading(false);
    }
  };

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
  // Mostrar popup de confirmación antes de eliminar
  const handleDelete = (id, name) => {
    setConfirmDelete({ show: true, id, name });
  };

  // Confirmar eliminación desde el popup
  const confirmDeleteEvent = async () => {
    const { id } = confirmDelete;
    setConfirmDelete({ show: false, id: null, name: "" });
    try {
      await deleteTicketsForEvent(id);
      await deleteDoc(doc(db, "events", id));
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setPopupMsg("Evento eliminado correctamente ✅");
      setShowPopup(true);
      if (editId === id) setEditId(null);
      setTimeout(() => {
        setShowPopup(false);
        setPopupMsg("");
      }, 1500);
    } catch (err) {
      setPopupMsg("Error al eliminar evento: " + err.message);
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        setPopupMsg("");
      }, 2000);
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
      // Recargar eventos después de guardar cambios
      const snap = await getDocs(collection(db, "events"));
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setEvents(list);
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
  // setSuccess eliminado, ya no se usa
    setError("");
    setLoading(true);

    if (!form.name || !form.name.trim()) {
      setError("El nombre del evento es obligatorio.");
      setLoading(false);
      return;
    }

    try {
      // Usar solo el valor de la casilla para isUpcomingLaunch
      const isLaunch = form.isUpcomingLaunch === true;

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
              selectedVenue?.layoutType === "salon-51"
                ? 0
                : Number(form.ticketPricing?.VIP || 0),
          },
          date: toTimestamp(form.date),
          isUpcomingLaunch: false,
        };
      }

      const docId = form.name.trim().replace(/\s+/g, "-").toLowerCase();
      await setDoc(doc(db, "events", docId), payload);

      // Generar boletos solo si NO es lanzamiento próximo
      if (!isLaunch) {
        await generateTicketsForEvent({
          eventId: docId,
          venueId: form.venueId,
          pricing: {
            general: Number(form.ticketPricing?.General || 0),
            vip: Number(form.ticketPricing?.VIP || 0),
          },
          forResale: form.allowResale || false,
        });
      }

      setForm(initialState);
      setShowPopup(true); // Mostrar popup
      setTimeout(() => {
        setShowPopup(false);
        setAction("edit"); // Mostrar la lista de eventos (grid)
      }, 1500);
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
                    onClick={handleShowEditList}
                  >
                    Editar evento
                  </button>
                  <button
                    className="add-event-btn add-event-btn-gray"
                    onClick={() => setAction("venues")}
                  >
                    Administrar venues
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
                  venues={venues}
                  selectedVenue={selectedVenue}
                  // success eliminado del render normal
                  error={error}
                  onCancel={() => setAction("")}
                />
              </div>
            )}

            {action === "venues" && (
              <div className="add-event-form-section">
                <h2 className="add-event-title">Administrar Venues</h2>
                <form className="add-event-form" onSubmit={handleVenueSubmit}>
                  <div className="add-event-form-row">
                    <label htmlFor="venue-id">ID del venue</label>
                    <input
                      id="venue-id"
                      name="id"
                      type="text"
                      value={venueForm.id}
                      onChange={handleVenueChange}
                      placeholder="auditorio-centro"
                    />
                  </div>
                  <div className="add-event-form-row">
                    <label htmlFor="venue-name">Nombre del venue</label>
                    <input
                      id="venue-name"
                      name="name"
                      type="text"
                      value={venueForm.name}
                      onChange={handleVenueChange}
                      placeholder="Auditorio Centro"
                      required
                    />
                  </div>
                  <div className="add-event-form-row">
                    <label htmlFor="venue-type">Tipo</label>
                    <input
                      id="venue-type"
                      name="type"
                      type="text"
                      value={venueForm.type}
                      onChange={handleVenueChange}
                      placeholder="Auditorio, Arena, Foro..."
                    />
                  </div>
                  <div className="add-event-form-row">
                    <label htmlFor="venue-capacity">Capacidad</label>
                    <input
                      id="venue-capacity"
                      name="capacity"
                      type="number"
                      min="0"
                      value={venueForm.capacity}
                      onChange={handleVenueChange}
                      placeholder="500"
                    />
                  </div>
                  <div className="add-event-form-row">
                    <label htmlFor="venue-zones">Zonas (separadas por coma)</label>
                    <input
                      id="venue-zones"
                      name="zones"
                      type="text"
                      value={venueForm.zones}
                      onChange={handleVenueChange}
                      placeholder="VIP, General"
                    />
                  </div>
                  <div className="add-event-form-row">
                    <label htmlFor="venue-layout-type">Layout reutilizable</label>
                    <select
                      id="venue-layout-type"
                      name="layoutType"
                      value={venueForm.layoutType}
                      onChange={handleVenueChange}
                    >
                      <option value="auditorio-itiz">Auditorio ITIZ</option>
                      <option value="duela-itiz">Duela ITIZ</option>
                      <option value="salon-51">Salón 51</option>
                    </select>
                  </div>

                  {venueError && <div className="add-event-error">{venueError}</div>}

                  <button className="add-event-btn add-event-btn-green" type="submit" disabled={venueLoading}>
                    {venueLoading ? "Guardando..." : "Guardar venue"}
                  </button>
                  <button className="add-event-btn add-event-btn-gray" type="button" onClick={() => setAction("")}>Volver</button>
                </form>

                <div className="add-event-venues-list">
                  {venues.map((venue) => (
                    <div className="add-event-venue-item" key={venue.id}>
                      <strong>{venue.name}</strong>
                      <span>ID: {venue.id}</span>
                      <span>Tipo: {venue.type || "Venue"}</span>
                      <span>Layout: {venue.layoutType || venue.id}</span>
                      <span>Zonas: {(venue.zones || []).join(", ") || "Sin zonas"}</span>
                    </div>
                  ))}
                </div>
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
                      venues={venues}
                      selectedVenue={selectedEditVenue}
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
            {/* Popups globales para confirmación y éxito/error */}
            {showPopup && (
              <div className="add-event-popup-overlay">
                <div className="add-event-popup-modal">
                  {popupMsg || "Evento agregado correctamente ✅"}
                </div>
              </div>
            )}
            {confirmDelete.show && (
              <div className="add-event-popup-overlay">
                <div className="add-event-popup-modal" style={{maxWidth: 340, textAlign: 'center'}}>
                  <div style={{marginBottom: 18}}>
                    ¿Seguro que quieres eliminar el evento <b>"{confirmDelete.name}"</b>?<br/>Esta acción no se puede deshacer.
                  </div>
                  <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
                    <button className="add-event-btn add-event-btn-red" onClick={confirmDeleteEvent}>
                      Sí, eliminar
                    </button>
                    <button className="add-event-btn add-event-btn-gray" onClick={() => setConfirmDelete({ show: false, id: null, name: "" })}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AddEvent;