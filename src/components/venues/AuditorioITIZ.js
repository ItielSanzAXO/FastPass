import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import '../../styles/AuditorioITIZ.css';

function formatFirebaseTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000);
  return format(date, 'dd/MM/yyyy HH:mm');
}

function AuditorioITIZ({ event }) {
  const [tickets, setTickets] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const ticketLimit = event.ticketLimitPerUser || 3; // Límite de boletos por usuario

  useEffect(() => {
    if (!event.date) return; // Si no hay fecha, no realizar ninguna acción

    const fetchTickets = async () => {
      try {
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('eventId', '==', event.id));
        const querySnapshot = await getDocs(q);
        const fetchedTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTickets(fetchedTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, [event.id, event.date]);

  if (!event.date) {
    return (
      <div className="text-center text-gray-600 py-10">
        <h2 className="text-2xl font-semibold mb-4">El evento aún no está disponible para la venta de boletos</h2>
        <p>Por favor, vuelve más tarde.</p>
      </div>
    );
  }

  const toggleSeatSelection = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats((prevSelected) => prevSelected.filter((id) => id !== seatId));
    } else if (selectedSeats.length < ticketLimit) {
      setSelectedSeats((prevSelected) => [...prevSelected, seatId]);
    }
  };

  const renderZone = (zone) => {
    const zoneTickets = tickets.filter(ticket => ticket.zone === zone);
    const rows = [...new Set(zoneTickets.map(ticket => ticket.seat.match(/^[A-Z](\d{2})/)[1]))].sort();

    return (
      <div className="zone" key={zone}>
        <div className="zone-label">Zona {zone}</div>
        {rows.map(row => (
          <div className="row" key={row}>
            {zoneTickets
              .filter(ticket => ticket.seat.startsWith(`${zone}${row}`))
              .sort((a, b) => a.seat.localeCompare(b.seat))
              .map(ticket => (
                <div
                  key={ticket.id}
                  className={`seat ${ticket.isAvailable ? 'available' : 'occupied'} ${selectedSeats.includes(ticket.id) ? 'selected' : ''} ${ticket.type === 'VIP' ? 'vip' : 'general'}`}
                  onClick={() => ticket.isAvailable && toggleSeatSelection(ticket.id)}
                >
                  {ticket.seat.slice(-2)}
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  };

  const renderSecondFloor = () => (
    <div className="second-floor">
      <div id="zone-e" className="flex flex-col items-center">
        {renderZone('E')}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mapa del Auditorio */}
      <div className="lg:w-2/3 bg-white rounded-xl shadow-lg p-6 relative">
        <h2 className="text-xl font-semibold mb-4 text-center">Selección de Asientos</h2>
        <div className="auditorium-container">
          <div className="stage">ESCENARIO</div>
          <div className="zones">
            {['A', 'B', 'C'].map(renderZone)}
            <div className="zone-centered">{renderZone('D')}</div>
          </div>
          {renderSecondFloor()}
        </div>
      </div>

      {/* Panel de Información y Compra */}
      <div className="lg:w-1/3">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detalles del Evento</h2>
          <div className="mb-4">
            <h3 className="font-medium text-indigo-700">{event.name}</h3>
            <p className="text-gray-600">Fecha y Hora: {formatFirebaseTimestamp(event.date) || 'Fecha no disponible'}</p>
            <p className="text-gray-600">Lugar: Auditorio ITIZ</p>
          </div>
          <div className="border-t border-gray-200 pt-1">
            <h3 className="font-medium mb-2">Precios por zona:</h3>
            <ul className="text-sm text-gray-600">
              <li className="mb-1">VIP (Primeras 4 filas A, B, C): ${event.ticketPricing?.VIP || 'N/A'}</li>
              <li>General (Resto de zonas): ${event.ticketPricing?.General || 'N/A'}</li>
              <li>Limite de boletos: {event.ticketLimitPerUser} por usuario</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Tu Selección</h2>
          <div className="text-gray-500 italic mb-4">
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Aún no has seleccionado asientos'}
          </div>
          <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400" disabled={selectedSeats.length === 0}>
            Comprar Boletos
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuditorioITIZ;