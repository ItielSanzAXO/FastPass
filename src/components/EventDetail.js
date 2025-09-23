import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig.js';
import { doc, getDoc } from 'firebase/firestore';
import AuditorioITIZ from './venues/AuditorioITIZ.js';
import DuelaITIZ from './venues/DuelaITIZ.js';
import Salon51 from './venues/Salon51.js';
import NotFound from './NotFound.js';
import '../styles/PaymentPopup.css';
import '../styles/EventDetail.css';

const venueComponents = {
  'auditorio-itiz': AuditorioITIZ,
  'duela-itiz': DuelaITIZ,
  'salon-51': Salon51,
};

function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const MIN_LOADING_MS = 5000; // mantener el loader al menos 5s

  useEffect(() => {
    let isMounted = true;
    let hideTimer = null;
    setEvent(null);
    setLoading(true);

    const start = Date.now();

    const fetchEvent = async () => {
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          if (isMounted) setEvent({ id: eventId, ...eventData }); // Asegurarse de incluir el ID del evento
        } else {
          console.error('Evento no encontrado');
        }
      } catch (error) {
        console.error('Error al cargar el evento:', error);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        if (isMounted) {
          hideTimer = setTimeout(() => {
            if (isMounted) setLoading(false);
          }, remaining);
        }
      }
    };

    fetchEvent();

    return () => {
      isMounted = false;
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="popup-overlay">
        <div className="popup-content">
          <h2>Cargando evento</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
            <div className="loader-circle" />
          </div>
          <p>Por favor espera...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return <NotFound />;
  }

  const VenueComponent = venueComponents[event.venueId] || AuditorioITIZ; // Default to AuditorioITIZ

  if (!VenueComponent) {
    return <p>Venue no soportado.</p>;
  }

  return <VenueComponent event={event} />;
}

export default EventDetail;