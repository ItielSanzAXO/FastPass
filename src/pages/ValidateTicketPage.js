import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './ValidateTicketPage.css';



function ValidateTicketPage() {
  const { eventId, ticketId } = useParams();
  const [status, setStatus] = useState('checking');
  const [ticket, setTicket] = useState(null);
  // eventId y ticketId ya vienen separados por la URL

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
  // Ya no validamos que el eventId de la URL coincida con el del ticket
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
    <div className="validate-container">
      <h1>Validación de Boleto</h1>
      {status === 'checking' && <p>Verificando boleto...</p>}
      {status === 'no-id' && <p>No se proporcionó un ID de boleto.</p>}
      {status === 'not-found' && <p>Boleto no encontrado.</p>}
      {status === 'error' && <p>Ocurrió un error al validar el boleto.</p>}
      {status === 'used' && <p className="validate-alert-danger">¡Este boleto ya fue usado!</p>}
      {status === 'no-owner' && <p className="validate-alert-warning">Boleto no comprado</p>}
      {status === 'valid' && (
        <>
          <p className="validate-alert-success">¡Boleto válido!</p>
          <button onClick={handleApprove} className="validate-button">
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
