import React from "react";

function EventForm({
  mode = "add", // "add" o "edit"
  form,
  setForm,
  handleChange,
  handleSubmit,
  loading,
  success,
  error,
  onCancel,
  isEdit = false
}) {
  return (
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
      <div className="add-event-form-row checkbox-row">
        <label htmlFor={isEdit ? "allowResale-edit" : "allowResale-add"} style={{margin:0}}>Permitir reventa</label>
        <input
          name="allowResale"
          type="checkbox"
          checked={form.allowResale}
          onChange={handleChange}
          id={isEdit ? "allowResale-edit" : "allowResale-add"}
        />
      </div>
      <button className="add-event-btn add-event-btn-blue" type="submit" disabled={loading}>
        {loading ? (mode === "add" ? "Agregando..." : "Guardando...") : mode === "add" ? "Agregar Evento" : "Guardar cambios"}
      </button>
      {success && <div className="add-event-success">{success}</div>}
      {error && <div className="add-event-error">{error}</div>}
      {onCancel && (
        <button className="add-event-btn add-event-btn-gray" type="button" onClick={onCancel}>
          Volver
        </button>
      )}
    </form>
  );
}

export default EventForm;
