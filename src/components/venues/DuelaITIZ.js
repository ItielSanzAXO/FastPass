import React, { useEffect, useState } from 'react';
import PaymentPopup from './PaymentPopup.js';
import VerifyCodeModal from '../VerifyCodeModal.js';
import styles from '../../styles/DuelaITIZ.module.css';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import { db } from '../../firebaseConfig.js';
import { useHistory } from 'react-router-dom';

import { doc, getDoc, setDoc, writeBatch, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://fastpass-backend.vercel.app';
const START_VERIFICATION_URL = `${API_BASE}/api/start-payment-verification`;
const BYPASS_PAYMENT_CODE = process.env.REACT_APP_BYPASS_PAYMENT_CODE === '1';

function formatFirebaseTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000);
  return format(date, 'dd/MM/yyyy HH:mm');
}


const DuelaITIZ = ({ event }) => {
  const history = useHistory();
  const { user } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState(null);
  const ticketLimit = event.ticketLimitPerUser || 3;
  const [showPayment, setShowPayment] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [isStartingVerification, setIsStartingVerification] = useState(false);
  const [startVerificationError, setStartVerificationError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState(null); // 'success' | 'error' | null
  const [purchaseError, setPurchaseError] = useState('');
  const [userOwnedCount, setUserOwnedCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);

  const remainingTickets = Math.max(0, ticketLimit - userOwnedCount);

  useEffect(() => {
    const fetchUserOwnedCount = async () => {
      if (!user?.uid || !event?.id) {
        setUserOwnedCount(0);
        return;
      }

      try {
        const ticketsRef = collection(db, 'tickets');
        const ownedQ = query(
          ticketsRef,
          where('eventId', '==', event.id),
          where('ownerUid', '==', user.uid)
        );
        const ownedSnap = await getDocs(ownedQ);
        setUserOwnedCount(ownedSnap.size);
      } catch (err) {
        console.error('Error obteniendo boletos del usuario para este evento:', err);
        setUserOwnedCount(0);
      }
    };

    fetchUserOwnedCount();
  }, [user?.uid, event?.id]);

  useEffect(() => {
    if (ticketCount > remainingTickets) {
      setTicketCount(remainingTickets);
    }
  }, [ticketCount, remainingTickets]);

  useEffect(() => {
    if (user && remainingTickets <= 0) {
      setShowLimitPopup(true);
    } else {
      setShowLimitPopup(false);
    }
  }, [user, remainingTickets]);

  const increment = () => {
    if (ticketCount < remainingTickets) {
      setTicketCount(ticketCount + 1);
    }
  };

  const decrement = () => {
    if (ticketCount > 0) {
      setTicketCount(ticketCount - 1);
    }
  };

  const startVerification = async () => {
    if (remainingTickets <= 0) {
      setStartVerificationError('Ya alcanzaste el límite de boletos para este evento.');
      return;
    }

    if (BYPASS_PAYMENT_CODE) {
      setShowPayment(true);
      return;
    }

    if (!user?.email || !user?.uid) {
      setStartVerificationError('Debes iniciar sesión con un correo válido para comprar.');
      return;
    }
    setIsStartingVerification(true);
    setStartVerificationError(null);
    try {
      const res = await fetch(START_VERIFICATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, uid: user.uid }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || data?.detail || `Error iniciando verificación (status ${res.status})`);
      }

      const vid = data.verificationId || data.id || data.verification_id || null;
      setVerificationId(vid);
      setShowVerifyModal(true);
    } catch (err) {
      console.error('start-verification error', err);
      const rawMsg = String(err?.message || '');
      const msg = rawMsg.toLowerCase();
      const shouldBypass = msg.includes('unauthorized') || msg.includes('server error');

      if (shouldBypass) {
        setStartVerificationError(null);
        setShowPayment(true);
        return;
      }

      setStartVerificationError(rawMsg || 'No se pudo iniciar la verificación');
    } finally {
      setIsStartingVerification(false);
    }
  };


  const handleConfirmPurchase = async () => {
    if (!user?.uid || !selectedZone || ticketCount === 0) {
      setPurchaseStatus('error');
      setPurchaseError('Faltan datos para la compra.');
      return;
    }
    try {
      const ownedQ = query(
        collection(db, 'tickets'),
        where('eventId', '==', event.id),
        where('ownerUid', '==', user.uid)
      );
      const ownedSnapshot = await getDocs(ownedQ);
      const currentOwned = ownedSnapshot.size;

      if (currentOwned + ticketCount > ticketLimit) {
        setPurchaseStatus('error');
        setPurchaseError(`Límite alcanzado. Ya tienes ${currentOwned} boleto(s) para este evento.`);
        return;
      }

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
      setUserOwnedCount((prev) => prev + ticketsToBuy.length);
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
      {showLimitPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Límite alcanzado</h2>
            <p>
              Alcanzaste el límite de boletos por cuenta para este evento.
              Si crees que es un error, por favor comunícate con soporte.
            </p>
            <button
              onClick={() => {
                setShowLimitPopup(false);
                history.push('/');
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

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
          price={(event.ticketPricing?.[selectedZone] || 0) * ticketCount}
          eventName={event.name}
          zone={selectedZone}
          ticketCount={ticketCount}
          eventId={event.id}
          userUid={user?.uid}
          seats={[]}
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
              <button onClick={increment} disabled={ticketCount >= remainingTickets}>+</button>
            </div>
            <p className={styles.limit}>
              {selectedZone ? `Zona seleccionada: ${selectedZone}` : 'Selecciona una zona (VIP o General)'}
            </p>
            <p className={styles.limit}>Máximo permitido: {ticketLimit} boletos</p>
            <button
              className={styles.buyButton}
              disabled={ticketCount === 0 || !selectedZone || !user || isStartingVerification || remainingTickets <= 0}
              onClick={() => startVerification()}
            >
              {isStartingVerification ? 'Enviando código...' : (
                user
                  ? selectedZone
                    ? `Comprar boletos ${selectedZone}`
                    : 'Selecciona una zona'
                  : 'Inicia sesión para comprar boletos')}
            </button>
            {startVerificationError && (
              <p style={{ color: '#ff6b6b', marginTop: 8, fontSize: 14 }}>{startVerificationError}</p>
            )}
          </div>
        </div>
      </div>
      {showVerifyModal && (
        <VerifyCodeModal
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          verificationId={verificationId}
          uid={user?.uid}
          onVerified={() => {
            setShowVerifyModal(false);
            setShowPayment(true);
          }}
        />
      )}
    </div>
  );
};

export default DuelaITIZ;
