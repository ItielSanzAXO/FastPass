import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig.js';
import { doc, getDoc } from 'firebase/firestore';
import AuditorioITIZ from './venues/AuditorioITIZ.js';
import DuelaITIZ from './venues/DuelaITIZ.js';
import Salon51 from './venues/Salon51.js';

const venueComponents = {
  'auditorio-itiz': AuditorioITIZ,
  'duela-itiz': DuelaITIZ,
  'salon-51': Salon51,
};

function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          setEvent({ id: eventId, ...eventData }); // Asegurarse de incluir el ID del evento
        } else {
          console.error('Evento no encontrado');
        }
      } catch (error) {
        console.error('Error al cargar el evento:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!event) {
    return <p>Evento no encontrado.</p>;
  }

  const VenueComponent = venueComponents[event.venueId] || AuditorioITIZ; // Default to AuditorioITIZ

  if (!VenueComponent) {
    return <p>Venue no soportado.</p>;
  }

  return <VenueComponent event={event} />;
}

export default EventDetail;