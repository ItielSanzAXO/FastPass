import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig.js';
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

function ResalePage() {
  const [resaleTickets, setResaleTickets] = useState([]);

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
          };
        });

        setResaleTickets(fetchedResaleTickets);
      } catch (error) {
        console.error('Error al obtener boletos en reventa:', error);
      }
    };

    fetchResaleTickets();
  }, []);

  const handleBuyTicket = (ticketId) => {
    alert(`Has comprado el boleto con ID: ${ticketId}`);
    // TODO: lógica real de compra
  };

  return (
    <div className="resale-global-container">
      <h1 className="resale-title">Boletos en Reventa</h1>
      <ul className="resale-list">
        {resaleTickets.length === 0 ? (
          <li className="resale-empty">No hay boletos en reventa disponibles.</li>
        ) : (
          resaleTickets.map((ticket) => (
            <li className="resale-ticket-card" key={ticket.id}>
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
                onClick={() => handleBuyTicket(ticket.id)}
              >
                Comprar
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
