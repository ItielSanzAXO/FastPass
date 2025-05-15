import { db } from '../firebaseConfig.node.js';

/**
 * Valida la integridad de los datos en Firestore.
 * Verifica que los eventos tengan un venueId válido y que los boletos estén configurados correctamente.
 */
export const validateFirestoreData = async () => {
  try {
    // Validar eventos
    const { getDocs, collection } = await import('firebase/firestore');
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const validVenues = ['auditorio-itiz', 'duela-itiz', 'salon-51'];
    const invalidEvents = events.filter(event => !validVenues.includes(event.venueId));

    if (invalidEvents.length > 0) {
      console.warn('Eventos con venueId inválido:', invalidEvents);
    } else {
      console.log('Todos los eventos tienen un venueId válido.');
    }

    // Validar boletos
    const ticketsSnapshot = await getDocs(collection(db, 'tickets'));
    const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const invalidTickets = tickets.filter(ticket => !ticket.eventId || !ticket.zone || !ticket.seat);

    if (invalidTickets.length > 0) {
      console.warn('Boletos con datos incompletos:', invalidTickets);
    } else {
      console.log('Todos los boletos están configurados correctamente.');
    }
  } catch (error) {
    console.error('Error al validar los datos en Firestore:', error);
  }
};