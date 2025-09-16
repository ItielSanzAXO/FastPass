import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import '../styles/TicketModal.css';


function formatDate(date) {
  if (!date) return 'Por definir';
  if (typeof date === 'string') return date;
  if (date.seconds) {
    const d = new Date(date.seconds * 1000);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return 'Por definir';
}

function TicketModal({ isOpen, onClose, ticket, userName }) {
  if (!isOpen || !ticket) return null;

  // URL del boleto
  // Liga única del boleto para validación en localhost
  const ticketUrl = `http://fastpass-91ef9.web.app/validate?id=${ticket.id}`;

  return (
    <div className="ticket-modal-overlay">
      <div className="ticket-modal-content">
        <button className="ticket-modal-close" onClick={onClose}>X</button>
        <h2>{ticket.eventName}</h2>
        <p><strong>Fecha:</strong> {formatDate(ticket.date)}</p>
  <p><strong>Lugar:</strong> {ticket.venue ? ticket.venue : 'Por definir'}</p>
        <p><strong>Acceso:</strong> {ticket.type || 'General'}</p>
        <p><strong>Nombre:</strong> {userName}</p>
        <p><strong>Asiento:</strong> {ticket.seat}</p>
        <p><strong>Zona:</strong> {ticket.zone}</p>
        <div className="ticket-modal-qr">
          <QRCodeCanvas value={ticketUrl} size={180} />
        </div>
      </div>
    </div>
  );
}

export default TicketModal;
