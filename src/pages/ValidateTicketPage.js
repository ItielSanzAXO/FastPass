import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ValidateTicketPage() {
  const query = useQuery();
  const [status, setStatus] = useState('checking');
  const [ticket, setTicket] = useState(null);
  const ticketId = query.get('id');

  useEffect(() => {
    const validateTicket = async () => {
      if (!ticketId) {
        setStatus('no-id');
        return;
      }
      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);
        if (!ticketSnap.exists()) {
          setStatus('not-found');
          return;
        }
        const ticketData = ticketSnap.data();
        setTicket(ticketData);
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
  }, [ticketId]);

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
      {status === 'valid' && (
        <>
          <p style={{ color: 'green', fontWeight: 'bold' }}>¡Boleto válido!</p>
          <button onClick={handleApprove} style={{ padding: '12px 24px', fontSize: 18, background: '#1e9ade', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Aprobar acceso
          </button>
        </>
      )}
      {ticket && (
        <div style={{ marginTop: 24, fontSize: 18 }}>
          <p><strong>ID:</strong> {ticketId}</p>
          <p><strong>Zona:</strong> {ticket.zone}</p>
          <p><strong>Asiento:</strong> {ticket.seat}</p>
          <p><strong>Precio:</strong> ${ticket.price}</p>
        </div>
      )}
    </div>
  );
}

export default ValidateTicketPage;
