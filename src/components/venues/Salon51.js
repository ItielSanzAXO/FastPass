import React, { useState } from 'react';
import PaymentPopup from './PaymentPopup.js';
import styles from '../../styles/Salon51.module.css';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import { db } from '../../firebaseConfig.js';
import { doc, getDoc, setDoc, writeBatch, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

function formatFirebaseTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000);
  return format(date, 'dd/MM/yyyy HH:mm');
}

const Salon51 = ({ event }) => {
  const { user } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState(null);
  const ticketLimit = event.ticketLimitPerUser || 3;
  const [showPayment, setShowPayment] = useState(false);
  // const [loading, setLoading] = useState(false);

  const increment = () => {
    if (ticketCount < ticketLimit) {
      setTicketCount(ticketCount + 1);
    }
  };

  const decrement = () => {
    if (ticketCount > 0) {
      setTicketCount(ticketCount - 1);
    }
  };

  // Lógica de compra real
  const handleConfirmPurchase = async () => {
    if (!user?.uid || !selectedZone || ticketCount === 0) return;
  // setLoading(true);
    try {
      // Mostrar valores para depuración
      console.log('event.id:', event.id);
      console.log('selectedZone:', selectedZone);
      // Buscar tickets disponibles en la zona seleccionada
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, where('eventId', '==', event.id), where('zone', '==', selectedZone), where('isAvailable', '==', true));
      const querySnapshot = await getDocs(q);
      let availableTickets = querySnapshot.docs.filter(docSnap => docSnap.data().forResale !== false);
      console.log('Boletos encontrados:', availableTickets.map(doc => ({
        id: doc.id,
        eventId: doc.data().eventId,
        zone: doc.data().zone,
        isAvailable: doc.data().isAvailable,
        forResale: doc.data().forResale,
        seat: doc.data().seat
      })));
      // Ordenar por seat numérico ascendente
      availableTickets = availableTickets.sort((a, b) => {
        const seatA = parseInt(a.data().seat.replace(/\D/g, ''));
        const seatB = parseInt(b.data().seat.replace(/\D/g, ''));
        return seatA - seatB;
      });
      if (availableTickets.length < ticketCount) {
        alert('No hay suficientes boletos disponibles en esta zona.');
  // setLoading(false);
        return;
      }
      // Tomar los primeros N tickets disponibles
      const ticketsToBuy = availableTickets.slice(0, ticketCount);
      const batch = writeBatch(db);
      // Asegurar documento de usuario
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, { tickets: [] });
      }
      // Actualizar cada ticket
      ticketsToBuy.forEach(ticketDoc => {
        batch.update(ticketDoc.ref, {
          isAvailable: false,
          ownerUid: user.uid,
          forResale: false
        });
      });
      batch.update(userRef, {
        tickets: arrayUnion(...ticketsToBuy.map(t => t.id)),
      });
      await batch.commit();
      setShowPayment(false);
      setTicketCount(0);
      setSelectedZone(null);
  // alert('¡Compra realizada!');
    } catch (error) {
  // alert('Error al procesar la compra.');
      console.error(error);
    }
  // setLoading(false);
  };

  return (
    <div className={styles.container}>
      {showPayment && (
        <PaymentPopup
          selectedSeats={[`${selectedZone} x${ticketCount}`]}
          onClose={() => setShowPayment(false)}
          onConfirm={handleConfirmPurchase}
          isFree={
            (selectedZone && (event.ticketPricing?.[selectedZone] === 0 || event.ticketPricing?.[selectedZone] === 'Gratis'))
          }
        />
      )}
      {/* Mapa del Salón */}
      <div className={styles.layout}>
        <div className={styles.zones}>
          <h2 className={styles.stage}>Mapa del Salón 51</h2>
          {/* Escenario */}
          <div className={styles.stageArea}>
            <h3 className={styles.stageText}>Escenario</h3>
          </div>
          {/* General */}
          <div
            className={`${styles.zone} ${styles.general} ${selectedZone === 'General' ? styles.active : ''}`}
            onClick={() => setSelectedZone('General')}
          >
            General
          </div>
        </div>
        {/* Panel de info y compra */}
        <div className={styles.sidePanel}>
          <div className={styles.card}>
            <h2>Detalles del Evento</h2>
            <div>
              <h3 className={styles.eventName}>{event.name}</h3>
              <p>Fecha y Hora: {formatFirebaseTimestamp(event.date) || 'Fecha no disponible'}</p>
              <p>Lugar: Salón 51</p>
            </div>
            <hr className={styles.divider} />
            <h3>Precios por zona:</h3>
            <ul className={styles.priceList}>
              <li>General: {event.ticketPricing?.General === 0 ? 'Gratis' : `$${event.ticketPricing?.General || 'N/A'}`}</li>
            </ul>
            <h2>Tu Selección</h2>
            <div className={styles.counter}>
              <button onClick={decrement} disabled={ticketCount === 0}>-</button>
              <span>{ticketCount}</span>
              <button onClick={increment} disabled={ticketCount >= ticketLimit}>+</button>
            </div>
            <p className={styles.limit}>
              {selectedZone ? `Zona seleccionada: ${selectedZone}` : 'Selecciona una zona (General)'}
            </p>
            <p className={styles.limit}>Máximo permitido: {ticketLimit} boletos</p>
            <button
              className={styles.buyButton}
              disabled={ticketCount === 0 || !selectedZone || !user}
              onClick={() => setShowPayment(true)}
            >
              {user
                ? selectedZone
                  ? `Comprar boletos ${selectedZone}`
                  : 'Selecciona una zona'
                : 'Inicia sesión para comprar boletos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Salon51;