import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../../styles/AuditorioITIZ.css'; // Asegúrate de tener este archivo CSS para estilos

function AuditorioITIZ({ event }) {
  const [tickets, setTickets] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('eventId', '==', event.name));
        const querySnapshot = await getDocs(q);
        const fetchedTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTickets(fetchedTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, [event.name]);

  const toggleSeatSelection = (seatId) => {
    setSelectedSeats((prevSelected) =>
      prevSelected.includes(seatId)
        ? prevSelected.filter((id) => id !== seatId)
        : [...prevSelected, seatId]
    );
  };

  const renderZone = (zone) => {
    const zoneTickets = tickets.filter(ticket => ticket.zone === zone);
  
    // Obtener filas únicas (por número de fila real, no por string parcial)
    const rows = [...new Set(zoneTickets.map(ticket => {
      const match = ticket.seat.match(/^[A-Z](\d{2})/);
      return match ? match[1] : "00";
    }))].sort();
  
    return (
      <div className="zone" key={zone}>
        <h3>Zona {zone}</h3>
        {rows.map(row => (
          <div className="row" key={row}>
            {zoneTickets
              .filter(ticket => ticket.seat.startsWith(`${zone}${row}`))
              .sort((a, b) => a.seat.localeCompare(b.seat))
              .map(ticket => (
                <button
                  key={ticket.id}
                  className={`seat ${ticket.isAvailable ? 'available' : 'sold'} ${selectedSeats.includes(ticket.id) ? 'selected' : ''}`}
                  onClick={() => ticket.isAvailable && toggleSeatSelection(ticket.id)}
                  disabled={!ticket.isAvailable}
                >
                  {ticket.seat.slice(-2)} {/* Muestra solo el número de asiento */}
                </button>
              ))}
          </div>
        ))}
      </div>
    );
  };
  

  return (
    <div className="venue-container">
      <h1>{event.name} - Auditorio ITIZ</h1>
      <div className="venue-layout">
        <div className="stage">ESCENARIO</div>
        <div className="zones">
          {['A', 'B', 'C', 'D', 'E'].map(renderZone)}
        </div>
      </div>
      <div className="event-details">
        <h2>Detalles del Evento</h2>
        <p>Fecha: {event.date}</p>
        <p>Hora: {event.time}</p>
        <p>Lugar: {event.venueId}</p>
        <h3>Precios por zona:</h3>
        <ul>
          <li>VIP: ${event.ticketPricing.VIP}</li>
          <li>General: ${event.ticketPricing.General}</li>
        </ul>
        <h3>Tu Selección</h3>
        <p>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Aún no has seleccionado asientos'}</p>
        <button className="buy-tickets-button" disabled={selectedSeats.length === 0}>Comprar Boletos</button>
      </div>
    </div>
  );
}

export default AuditorioITIZ;