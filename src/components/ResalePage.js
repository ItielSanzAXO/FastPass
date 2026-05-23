import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig.js';
import { useAuth } from '../context/AuthContext.js';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import '../styles/ResalePage.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://fastpass-backend.vercel.app';
const CREATE_SESSION_URL = `${API_BASE}/api/create-checkout-session`;

function ResalePage() {
  const [resaleTickets, setResaleTickets] = useState([]);
  const [processingTicketId, setProcessingTicketId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Obtener boletos en reventa desde Firestore
    const fetchResaleTickets = async () => {
      try {
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('forResale', '==', true));
        const querySnapshot = await getDocs(q);

        // Map + filtro de ownerUid válido
        const filteredTickets = querySnapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
              id: docSnapshot.id,
              eventId: data.eventId,
              price: data.resalePrice || data.price || 0,
              zone: data.zone || data.seatZone || 'General',
              ...data,
            };
          })
          .filter(
            (ticket) =>
              ticket.ownerUid !== null &&
              ticket.ownerUid !== undefined &&
              ticket.ownerUid !== ''
          );

        // Traer datos de eventos relacionados
        const eventIds = [...new Set(filteredTickets.map((t) => t.eventId).filter(Boolean))];
        const eventDataMap = {};
        await Promise.all(
          eventIds.map(async (eventId) => {
            try {
              const eventDoc = await getDoc(doc(db, 'events', eventId));
              if (eventDoc.exists()) {
                eventDataMap[eventId] = eventDoc.data();
              }
            } catch {
              // Si falla, omitimos
            }
          })
        );

        // Unir datos de evento a cada ticket
        const fetchedResaleTickets = filteredTickets.map((ticket) => {
          const eventData = eventDataMap[ticket.eventId] || {};
          return {
            ...ticket,
            eventName: eventData.name || 'Evento',
            eventDate: eventData.date || null, // puede ser Timestamp o null
            eventImageUrl: eventData.imageUrl || '',
          };
        });

        setResaleTickets(fetchedResaleTickets);
      } catch (error) {
        console.error('Error al obtener boletos en reventa:', error);
      }
    };

    fetchResaleTickets();
  }, []);

  const handleBuyTicket = async (ticket) => {
    if (!user?.uid) {
      alert('Debes iniciar sesión para comprar en reventa.');
      return;
    }

    if (user.uid === ticket.ownerUid) {
      alert('No puedes comprar tu propio boleto en reventa.');
      return;
    }

    try {
      setProcessingTicketId(ticket.id);

      const amount = Number(ticket.resalePrice || ticket.price || 0);
      const successUrl = `${window.location.origin}/payment-success`;
      const cancelUrl = window.location.href;

      localStorage.setItem(
        'fastpass_pending_purchase',
        JSON.stringify({
          mode: 'resale',
          ticketId: ticket.id,
          eventId: ticket.eventId,
          zone: ticket.zone || 'General',
          ticketCount: 1,
          userUid: user.uid,
          sellerUid: ticket.ownerUid,
          price: amount,
          eventName: ticket.eventName || 'Boleto en reventa',
        })
      );

      const res = await fetch(CREATE_SESSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: amount,
          eventName: ticket.eventName || 'Boleto en reventa',
          zone: ticket.zone || 'General',
          ticketCount: 1,
          seats: [ticket.seat || ticket.id],
          successUrl,
          cancelUrl,
        }),
      });

      const data = await res.json();
      if (!data.ok || !data.url) {
        throw new Error(data.error || 'No se pudo iniciar el pago de reventa.');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Error al iniciar compra en reventa:', error);
      localStorage.removeItem('fastpass_pending_purchase');
      alert(error.message || 'No se pudo iniciar el pago.');
      setProcessingTicketId(null);
    }
  };

  return (
    <div className="resale-global-container">
      <h1 className="resale-title">Boletos en Reventa</h1>
      <ul className="resale-list">
        {resaleTickets.length === 0 ? (
          <li className="resale-empty">No hay boletos en reventa disponibles.</li>
        ) : (
          resaleTickets.map((ticket) => (
            <li
              className="resale-ticket-card"
              key={ticket.id}
              style={
                ticket.eventImageUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(28, 28, 28, 0.72), rgba(28, 28, 28, 0.72)), url('${ticket.eventImageUrl}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }
                  : undefined
              }
            >
              <div className="resale-ticket-info">
                <div className="resale-event-name">
                  {ticket.eventName || ticket.event}
                </div>

                <div className="resale-zone-date">
                  <span className="resale-zone">
                    Zona: {ticket.zone || ticket.seatZone || 'General'}
                  </span>
                  <span className="resale-date">
                    Fecha:{' '}
                    {ticket.eventDate ? formatEventDate(ticket.eventDate) : 'Por definir'}
                  </span>
                </div>

                <div className="resale-price">
                  Precio: <b>${ticket.resalePrice || ticket.price}</b>
                </div>
              </div>

              <button
                className="resale-buy-btn"
                onClick={() => handleBuyTicket(ticket)}
                disabled={processingTicketId === ticket.id}
              >
                {processingTicketId === ticket.id ? 'Procesando...' : 'Comprar'}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

// Formatea el campo date (Timestamp Firestore, objeto con seconds, Date o string)
function formatEventDate(date) {
  try {
    if (!date) return 'Por definir';

    // Timestamp real de Firestore
    if (date instanceof Timestamp) {
      const jsDate = date.toDate();
      return toLocaleMx(jsDate);
    }

    // Objeto tipo { seconds, nanoseconds }
    if (typeof date === 'object' && typeof date.seconds === 'number') {
      const jsDate = new Date(date.seconds * 1000);
      return toLocaleMx(jsDate);
    }

    // String o Date
    const jsDate = new Date(date);
    if (!isNaN(jsDate.getTime())) {
      return toLocaleMx(jsDate);
    }
  } catch {
    // ignore
  }
  return 'Por definir';
}

function toLocaleMx(jsDate) {
  return jsDate.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Mexico_City',
  });
}

export default ResalePage;
