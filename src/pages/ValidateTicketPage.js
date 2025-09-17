import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';



function ValidateTicketPage() {
  const { eventAndTicketId } = useParams();
  const [status, setStatus] = useState('checking');
  const [ticket, setTicket] = useState(null);
  // Separar eventId y ticketId
  let eventId = null;
  let ticketId = null;
  if (eventAndTicketId) {
    const parts = eventAndTicketId.split('-');
    if (parts.length >= 2) {
      eventId = parts[0];
      ticketId = parts.slice(1).join('-');
    }
  }

  const [ownerName, setOwnerName] = useState(null);

  useEffect(() => {
    const validateTicket = async () => {
      if (!ticketId || !eventId) {
        setStatus('no-id');
        return;
      }
      try {
        // Aquí podrías validar que el ticket pertenezca al evento si lo necesitas
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);
        if (!ticketSnap.exists()) {
          setStatus('not-found');
          return;
        }
        const ticketData = ticketSnap.data();
        setTicket(ticketData);
        if (ticketData.eventId !== eventId) {
          setStatus('not-found');
          return;
        }
        // Validar si el boleto tiene dueño
        if (!ticketData.ownerUid) {
          setStatus('no-owner');
          setOwnerName(null);
          return;
        }
        // Buscar nombre del dueño si existe ownerUid
        try {
          const userRef = doc(db, 'users', ticketData.ownerUid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setOwnerName(userData.name || userData.displayName || ticketData.ownerUid);
          } else {
            setOwnerName(ticketData.ownerUid);
          }
        } catch {
          setOwnerName(ticketData.ownerUid);
        }
        if (ticketData.use === true) {
          setStatus('used');
        } else {
          setStatus('valid');
        }
      } catch (e) {
        setStatus('error');
      }
    };
    validateTicket();
  }, [ticketId, eventId]);

  const handleApprove = async () => {
    if (!ticketId) return;
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, { use: true });
      setStatus('used');
    } catch (e) {
      setStatus('error');
    }
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Disket Mono, monospace', textAlign: 'center' }}>
      <h1>Validación de Boleto</h1>
      {status === 'checking' && <p>Verificando boleto...</p>}
      {status === 'no-id' && <p>No se proporcionó un ID de boleto.</p>}
      {status === 'not-found' && <p>Boleto no encontrado.</p>}
      {status === 'error' && <p>Ocurrió un error al validar el boleto.</p>}
      {status === 'used' && <p style={{ color: 'red', fontWeight: 'bold' }}>¡Este boleto ya fue usado!</p>}
      {status === 'no-owner' && <p style={{ color: 'orange', fontWeight: 'bold' }}>Boleto no comprado</p>}
      {status === 'valid' && (
        <>
          <p style={{ color: 'green', fontWeight: 'bold' }}>¡Boleto válido!</p>
          <button onClick={handleApprove} style={{ padding: '12px 24px', fontSize: 18, background: '#1e9ade', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Aprobar acceso
          </button>
        </>
      )}
      {ticket && status !== 'no-owner' && (
        <div style={{ marginTop: 24, fontSize: 18 }}>
          <p><strong>ID Evento:</strong> {eventId}</p>
          <p><strong>ID Ticket:</strong> {ticketId}</p>
          <p><strong>Zona:</strong> {ticket.zone}</p>
          <p><strong>Asiento:</strong> {ticket.seat}</p>
          <p><strong>Precio:</strong> ${ticket.price}</p>
          {ownerName && <p><strong>Dueño:</strong> {ownerName}</p>}
        </div>
      )}
    </div>
  );
}

export default ValidateTicketPage;
