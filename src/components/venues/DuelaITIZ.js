import React, { useState } from 'react';
import PaymentPopup from './PaymentPopup.js';
import styles from '../../styles/DuelaITIZ.module.css';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import { db } from '../../firebaseConfig.js';
import { doc, getDoc, setDoc, writeBatch, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

function formatFirebaseTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000);
  return format(date, 'dd/MM/yyyy HH:mm');
}


const DuelaITIZ = ({ event }) => {
  const { user } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState(null);
  const ticketLimit = event.ticketLimitPerUser || 3;
  const [showPayment, setShowPayment] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null); // 'success' | 'error' | null
  const [purchaseError, setPurchaseError] = useState('');

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


  const handleConfirmPurchase = async () => {
    if (!user?.uid || !selectedZone || ticketCount === 0) {
      setPurchaseStatus('error');
      setPurchaseError('Faltan datos para la compra.');
      return;
    }
    try {
      // Buscar tickets disponibles en la zona seleccionada
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, where('eventId', '==', event.id), where('zone', '==', selectedZone), where('isAvailable', '==', true));
      const querySnapshot = await getDocs(q);
  let availableTickets = querySnapshot.docs; // No filtrar por forResale
      // Ordenar por seat numérico ascendente
      availableTickets = availableTickets.sort((a, b) => {
        const seatA = parseInt(a.data().seat.replace(/\D/g, ''));
        const seatB = parseInt(b.data().seat.replace(/\D/g, ''));
        return seatA - seatB;
      });
      if (availableTickets.length < ticketCount) {
        setPurchaseStatus('error');
        setPurchaseError('No hay suficientes boletos disponibles en esta zona.');
        return;
      }
      // Tomar los primeros N tickets disponibles
      const ticketsToBuy = availableTickets.slice(0, ticketCount);
      console.log('Boletos asignados al usuario:', ticketsToBuy.map(t => ({
        id: t.id,
        seat: t.data().seat,
        zone: t.data().zone,
        isAvailable: t.data().isAvailable
      })));
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
      setPurchaseStatus('success');
      setPurchaseError('');
      setTicketCount(0);
      setSelectedZone(null);
    } catch (error) {
      setPurchaseStatus('error');
      setPurchaseError('Ocurrió un error al procesar la compra.');
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      {showPayment && (
        <PaymentPopup
          selectedSeats={[`${selectedZone} x${ticketCount}`]}
          onClose={() => {
            setShowPayment(false);
            setPurchaseStatus(null);
            setPurchaseError('');
          }}
          onConfirm={handleConfirmPurchase}
          isFree={
            (selectedZone && (event.ticketPricing?.[selectedZone] === 0 || event.ticketPricing?.[selectedZone] === 'Gratis'))
          }
          purchaseStatus={purchaseStatus}
          errorMsg={purchaseError}
        />
      )}
      {/* Mapa de la Duela */}
      <div className={styles.layout}>
        <div className={styles.zones}>
          <h2 className={styles.stage}>Mapa de la Duela</h2>
          {/* VIP */}
          <div
            className={`${styles.zone} ${styles.vip} ${selectedZone === 'VIP' ? styles.active : ''}`}
            onClick={() => setSelectedZone('VIP')}
          >
            VIP
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
              <p>Lugar: Duela ITIZ</p>
            </div>
            <hr className={styles.divider} />
            <h3>Precios por zona:</h3>
            <ul className={styles.priceList}>
              <li>VIP: {event.ticketPricing?.VIP === 0 ? 'Gratis' : `$${event.ticketPricing?.VIP || 'N/A'}`}</li>
              <li>General: {event.ticketPricing?.General === 0 ? 'Gratis' : `$${event.ticketPricing?.General || 'N/A'}`}</li>
            </ul>
            <h2>Tu Selección</h2>
            <div className={styles.counter}>
              <button onClick={decrement} disabled={ticketCount === 0}>-</button>
              <span>{ticketCount}</span>
              <button onClick={increment} disabled={ticketCount >= ticketLimit}>+</button>
            </div>
            <p className={styles.limit}>
              {selectedZone ? `Zona seleccionada: ${selectedZone}` : 'Selecciona una zona (VIP o General)'}
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

export default DuelaITIZ;
