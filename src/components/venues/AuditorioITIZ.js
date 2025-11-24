import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig.js';
import { collection, query, where, doc, arrayUnion, writeBatch, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import '../../styles/AuditorioITIZ.css';
import { useAuth } from '../../context/AuthContext.js';
import PaymentPopup from './PaymentPopup.js';
import VerifyCodeModal from '../VerifyCodeModal.js';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://fastpass-backend.vercel.app';

function formatFirebaseTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000);
  return format(date, 'dd/MM/yyyy HH:mm');
}

function AuditorioITIZ({ event }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [isStartingVerification, setIsStartingVerification] = useState(false);
  const [startVerificationError, setStartVerificationError] = useState(null);
  const ticketLimit = event.ticketLimitPerUser || 3; // Límite de boletos por usuario

  useEffect(() => {
    if (!event.date) return;

    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('eventId', '==', event.id));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updatedTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(updatedTickets);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar
  }, [event.id, event.date]);

  if (!event.date) {
    return (
      <div className="text-center text-gray-600 py-10">
        <h2 className="text-2xl font-semibold mb-4">El evento aún no está disponible para la venta de boletos</h2>
        <p>Por favor, vuelve más tarde.</p>
        <button
          className="custom-button"
          onClick={() => window.location.href = '/'}
        >
          Ir al Inicio
        </button>
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

  const handlePurchase = () => {
    // Iniciar verificación por correo antes de mostrar la pasarela
    startVerification();
  };

  const startVerification = async () => {
  if (!user?.email || !user?.uid) {
    alert('Debes iniciar sesión con un correo válido para comprar.');
    return;
  }

  setIsStartingVerification(true);
  setStartVerificationError(null);
  try {
    const res = await fetch(`${API_BASE}/api/start-payment-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, uid: user.uid }),
    });

    const data = await res.json();      // 👈 lee siempre el JSON
    console.log("start-payment-verification:", data);

    if (!data.ok) {
      throw new Error(data.error || 'No se pudo enviar el código');
    }

    const vid = data.verificationId;
    setVerificationId(vid);
    setShowVerifyModal(true);
  } catch (err) {
    console.error('start-verification error', err);
    setStartVerificationError(err.message || 'No se pudo iniciar la verificación');
    alert('No se pudo enviar el código. Intenta nuevamente.');
  } finally {
    setIsStartingVerification(false);
  }
};


  const confirmPurchase = async () => {
    if (!selectedSeats.length) {
      alert('No has seleccionado ningún asiento.');
      return;
    }

    if (!user?.uid) {
      alert('Debes iniciar sesión para realizar una compra.');
      return;
    }

    try {
      // Verificar si el documento del usuario existe
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Crear el documento del usuario si no existe
        await setDoc(userRef, { tickets: [] });
      }

      // Validar que todos los IDs en selectedSeats existen en tickets
      const validSeats = selectedSeats.every(seatId => tickets.some(ticket => ticket.id === seatId));
      if (!validSeats) {
        alert('Uno o más boletos seleccionados no existen o ya no están disponibles.');
        return;
      }

      const batch = writeBatch(db);

      selectedSeats.forEach((seatId) => {
        const ticketRef = doc(db, 'tickets', seatId);
        batch.update(ticketRef, {
          isAvailable: false,
          ownerUid: user.uid,
          forResale: false
        });
      });

      batch.update(userRef, {
        tickets: arrayUnion(...selectedSeats),
      });

      await batch.commit();

      // Actualizar el estado local
      const updatedTickets = tickets.map(ticket => {
        if (selectedSeats.includes(ticket.id)) {
          return { ...ticket, isAvailable: false, ownerUid: user.uid };
        }
        return ticket;
      });

      setTickets(updatedTickets);
      setSelectedSeats([]);
      setShowPopup(false);

  // alert('Compra realizada con éxito.');
    } catch (error) {
      console.error('Error al procesar la compra:', error);

      if (error.code === 'permission-denied') {
    // alert('No tienes permisos para realizar esta operación.');
      } else if (error.code === 'not-found') {
    // alert('Uno o más boletos seleccionados no existen.');
      } else {
    // alert('Hubo un error al procesar la compra. Inténtalo de nuevo.');
      }
    }
  };

  const renderZone = (zone) => {
    const zoneTickets = tickets.filter(ticket => ticket.zone === zone);
    // Filtrar y advertir sobre asientos con formato inesperado
    const rows = [...new Set(zoneTickets.map(ticket => {
      const match = ticket.seat && ticket.seat.match(/^[A-Z](\d{2})/);
      if (!match) {
        console.warn(`Formato inesperado en seat: '${ticket.seat}' (ticket id: ${ticket.id})`);
        return null;
      }
      return match[1];
    }).filter(Boolean))].sort();

    return (
      <div className="zone" key={zone}>
        <div className="zone-label">Zona {zone}</div>
        {rows.map(row => (
          <div className="row" key={row}>
            {zoneTickets
              .filter(ticket => ticket.seat && ticket.seat.startsWith(`${zone}${row}`))
              .sort((a, b) => a.seat.localeCompare(b.seat))
              .map(ticket => {
                console.log(`Asiento ${ticket.seat}: ${ticket.isAvailable ? 'Disponible' : 'No disponible'}`);
                return (
                  <div
                    key={ticket.id}
                    className={`seat ${ticket.isAvailable ? 'available' : 'unavailable'} ${selectedSeats.includes(ticket.id) ? 'selected' : ''} ${ticket.type === 'VIP' ? 'vip' : 'general'}`}
                    onClick={() => ticket.isAvailable && toggleSeatSelection(ticket.id)}
                  >
                    {ticket.seat ? ticket.seat.slice(-2) : '?'}
                  </div>
                );
              })}
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

  // Mostrar el seat en vez del id en la selección
  const selectedSeatLabels = selectedSeats
    .map(id => {
      const ticket = tickets.find(t => t.id === id);
      return ticket ? ticket.seat : id;
    })
    .join(', ');

  // Array de etiquetas (PaymentPopup espera un array de strings)
  const selectedSeatsArray = selectedSeats.map(id => {
    const ticket = tickets.find(t => t.id === id);
    return ticket ? ticket.seat : id;
  });

  // Calcular precio total sumando por boleto según su tipo/zone
  const totalPrice = selectedSeats.reduce((sum, id) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return sum;
    const perTicket = ticket.type === 'VIP' ? (event.ticketPricing?.VIP || 0) : (event.ticketPricing?.General || 0);
    return sum + perTicket;
  }, 0);

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
            {selectedSeats.length > 0 ? selectedSeatLabels : 'Aún no has seleccionado asientos'}
          </div>
          <button
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400"
            disabled={selectedSeats.length === 0 || !user || isStartingVerification}
            onClick={handlePurchase}
          >
            {isStartingVerification ? 'Enviando código...' : (
              user
                ? selectedSeats.length > 0
                  ? `Comprar boletos para ${selectedSeats.length} asientos`
                  : 'Selecciona asientos'
                : 'Inicia sesión para comprar boletos')}
          </button>
          {startVerificationError && (
            <p style={{ color: '#ff6b6b', marginTop: 8, fontSize: 14 }}>{startVerificationError}</p>
          )}
        </div>
      </div>

      {/* Payment Popup */}
      {showPopup && (
        <PaymentPopup
          selectedSeats={selectedSeatsArray}
          onClose={() => setShowPopup(false)}
          onConfirm={confirmPurchase}
          isFree={totalPrice === 0}
          price={totalPrice}
          eventName={event.name}
          zone={selectedSeats.length === 0 ? null : (tickets.find(t => t.id === selectedSeats[0])?.zone || null)}
          ticketCount={selectedSeats.length}
          eventId={event.id}
          userUid={user?.uid}
          seats={selectedSeats}
        />
      )}

      {/* Modal para verificar código enviado por correo */}
      <VerifyCodeModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        verificationId={verificationId}
        uid={user?.uid}
        onVerified={() => {
          setShowVerifyModal(false);
          setShowPopup(true);
        }}
      />
    </div>
  );
}

export default AuditorioITIZ;