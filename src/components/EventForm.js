import React from "react";
import "../styles/AddEvent.css";

/**
 * Props esperadas:
 * - mode: "add" | "edit"
 * - form: objeto con campos
 * - setForm: fn
 * - handleChange: fn(e)
 * - handleSubmit: fn(e)
 * - loading: bool
 * - success: string
 * - error: string
 * - onCancel: fn()
 * - isEdit?: bool
 */
export default function EventForm(props) {
  const {
    mode,
    form,
    handleChange,
    handleSubmit,
    loading,
    success,
    error,
    onCancel,
  } = props;

  const isLaunch = !!form.isUpcomingLaunch;
  const vipDisabled = form.venueId === "salon-51";

  return (
    <form className="add-event-form" onSubmit={handleSubmit}>
      {/* Nombre */}
      <div className="add-event-form-row">
        <label htmlFor="name">Nombre del evento</label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Nombre del evento"
          required
        />
      </div>

      {/* Venue */}
      <div className="add-event-form-row">
        <label htmlFor="venueId">Sede / Venue</label>
        <select
          id="venueId"
          name="venueId"
          value={form.venueId}
          onChange={handleChange}
        >
          <option value="auditorio-itiz">Auditorio ITIZ</option>
          <option value="salon-51">Salón 51</option>
          {/* Agrega más opciones si necesitas */}
        </select>
      </div>

      {/* Imagen */}
      <div className="add-event-form-row">
        <label htmlFor="imageUrl">URL de la imagen</label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="https://…"
        />
      </div>

      {/* Lanzamiento próximo */}
      <div className="add-event-form-row checkbox-row">
        <input
          id="isUpcomingLaunch"
          name="isUpcomingLaunch"
          type="checkbox"
          checked={isLaunch}
          onChange={handleChange}
        />
        <label htmlFor="isUpcomingLaunch" style={{ margin: 0 }}>
          ¿Lanzamiento próximo? (solo se guardan Nombre, Venue e Imagen)
        </label>
      </div>

      {/* Campos condicionales: solo si NO es lanzamiento */}
      {!isLaunch && (
        <>
          {/* Fecha */}
          <div className="add-event-form-row">
            <label htmlFor="date">Fecha y hora principal</label>
            <input
              id="date"
              name="date"
              type="datetime-local"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Límite por usuario */}
          <div className="add-event-form-row">
            <label htmlFor="ticketLimitPerUser">Límite de boletos por usuario</label>
            <input
              id="ticketLimitPerUser"
              name="ticketLimitPerUser"
              type="number"
              min="1"
              value={form.ticketLimitPerUser}
              onChange={handleChange}
            />
          </div>

          {/* Precios */}
          <div className="add-event-form-row">
            <label>Precios</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                name="ticketPricingGeneral"
                type="number"
                min="0"
                value={form.ticketPricing?.General ?? 0}
                onChange={handleChange}
                placeholder="General"
              />
              <input
                name="ticketPricingVIP"
                type="number"
                min="0"
                value={vipDisabled ? 0 : (form.ticketPricing?.VIP ?? 0)}
                onChange={handleChange}
                placeholder="VIP"
                disabled={vipDisabled}
                title={vipDisabled ? "VIP no aplica para esta sede" : "Precio VIP"}
              />
            </div>
          </div>

          {/* Reventa */}
          <div className="add-event-form-row checkbox-row">
            <input
              id="allowResale"
              name="allowResale"
              type="checkbox"
              checked={!!form.allowResale}
              onChange={handleChange}
            />
            <label htmlFor="allowResale" style={{ margin: 0 }}>
              Permitir reventa
            </label>
          </div>
        </>
      )}

      {/* Feedback */}
      {error && <div className="add-event-error">{error}</div>}
      {success && <div className="add-event-success">{success}</div>}

      {/* Botones */}
      <button
        type="submit"
        className="add-event-btn add-event-btn-blue"
        disabled={loading}
      >
        {loading ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear evento"}
      </button>

      <button
        type="button"
        className="add-event-btn add-event-btn-gray"
        onClick={onCancel}
        disabled={loading}
      >
        Cancelar
      </button>
    </form>
  );
}