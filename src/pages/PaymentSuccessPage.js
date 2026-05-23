import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { db } from '../firebaseConfig.js';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import '../styles/PaymentSuccessPage.css';

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function createTraceId() {
  return `ps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function PaymentSuccessPage() {
  const history = useHistory();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error' | 'notickets' | 'limitreached' | 'permissions'

  useEffect(() => {
    const processPurchase = async () => {
      const traceId = createTraceId();
      const lockKey = 'fp_payment_success_lock';
      const lockRaw = sessionStorage.getItem(lockKey);
      const now = Date.now();

      if (lockRaw) {
        try {
          const lock = JSON.parse(lockRaw);
          if (now - Number(lock.ts || 0) < 120000) {
            console.log(`[PaymentSuccess][${traceId}] lock_active_skip`, lock);
            return;
          }
        } catch {
          // ignore malformed lock
        }
      }

      sessionStorage.setItem(lockKey, JSON.stringify({ ts: now, traceId }));
      const log = (step, payload) => {
        console.log(`[PaymentSuccess][${traceId}] ${step}`, payload || '');
      };

      const warn = (step, payload) => {
        console.warn(`[PaymentSuccess][${traceId}] ${step}`, payload || '');
      };

      const errorLog = (step, payload) => {
        console.error(`[PaymentSuccess][${traceId}] ${step}`, payload || '');
      };

      try {
        const stored = localStorage.getItem('fastpass_pending_purchase');
        log('pending_purchase_raw', stored);

        if (!stored) {
          warn('missing_pending_purchase');
          sessionStorage.removeItem(lockKey);
          setStatus('error');
          return;
        }

        const parsed = JSON.parse(stored);
        const { mode, eventId, zone, ticketCount, userUid, seats } = parsed;
        log('parsed_pending_purchase', {
          mode,
          eventId,
          zone,
          ticketCount,
          userUid,
          hasSeats: Array.isArray(seats),
          seatsCount: Array.isArray(seats) ? seats.length : 0,
        });

        if (mode === 'resale') {
          const { ticketId, sellerUid, price } = parsed;
          log('resale_mode_detected', { ticketId, sellerUid, price });

          if (!eventId || !userUid || !ticketId || !sellerUid || sellerUid === userUid) {
            warn('resale_invalid_payload', { eventId, userUid, ticketId, sellerUid });
            localStorage.removeItem('fastpass_pending_purchase');
            sessionStorage.removeItem(lockKey);
            setStatus('error');
            return;
          }

          const ticketRef = doc(db, 'tickets', ticketId);
          const ticketSnap = await getDoc(ticketRef);
          if (!ticketSnap.exists()) {
            warn('resale_ticket_not_found', { ticketId });
            localStorage.removeItem('fastpass_pending_purchase');
            sessionStorage.removeItem(lockKey);
            setStatus('notickets');
            return;
          }

          const ticketData = ticketSnap.data();
          const isStillForResale = ticketData.forResale === true;
          const hasSameSeller = ticketData.ownerUid === sellerUid;
          log('resale_ticket_state', {
            ticketId,
            ownerUid: ticketData.ownerUid,
            forResale: ticketData.forResale,
            isStillForResale,
            hasSameSeller,
          });

          if (!isStillForResale || !hasSameSeller) {
            warn('resale_ticket_state_invalid', { ticketId, isStillForResale, hasSameSeller });
            localStorage.removeItem('fastpass_pending_purchase');
            sessionStorage.removeItem(lockKey);
            setStatus('notickets');
            return;
          }

          const grossAmount = roundMoney(price || ticketData.resalePrice || ticketData.price || 0);
          const platformFee = roundMoney(grossAmount * 0.1);
          const netAmount = roundMoney(Math.max(0, grossAmount - platformFee));

          const buyerRef = doc(db, 'users', userUid);
          const sellerRef = doc(db, 'users', sellerUid);
          const movementRef = doc(collection(db, 'wallet_movements'));
          log('resale_amounts', { grossAmount, platformFee, netAmount });

          const resaleBatch = writeBatch(db);
          resaleBatch.update(ticketRef, {
            ownerUid: userUid,
            forResale: false,
            isAvailable: false,
          });
          resaleBatch.set(
            buyerRef,
            { tickets: arrayUnion(ticketId) },
            { merge: true }
          );
          resaleBatch.set(
            sellerRef,
            {
              tickets: arrayRemove(ticketId),
              walletPending: increment(netAmount),
              walletTotalSold: increment(1),
            },
            { merge: true }
          );
          resaleBatch.set(movementRef, {
            type: 'resale_credit',
            status: 'credited',
            ticketId,
            eventId,
            buyerUid: userUid,
            sellerUid,
            grossAmount,
            platformFee,
            netAmount,
            createdAt: serverTimestamp(),
          });

          log('resale_batch_commit_start', { ticketId, buyerUid: userUid, sellerUid });
          await resaleBatch.commit();
          log('resale_batch_commit_ok', { ticketId, movementId: movementRef.id });

          localStorage.removeItem('fastpass_pending_purchase');
          sessionStorage.removeItem(lockKey);
          setStatus('success');
          return;
        }

        if (!eventId || !zone || !ticketCount || !userUid) {
          warn('normal_invalid_payload', { eventId, zone, ticketCount, userUid });
          sessionStorage.removeItem(lockKey);
          setStatus('error');
          return;
        }

        const ticketsRef = collection(db, 'tickets');
        let ticketsToBuy = [];
        const requestedCount = Array.isArray(seats) && seats.length > 0 ? seats.length : Number(ticketCount);

        const eventSnap = await getDoc(doc(db, 'events', eventId));
        const eventLimit = eventSnap.exists()
          ? Number(eventSnap.data()?.ticketLimitPerUser || 3)
          : 3;
        log('event_limit_loaded', { eventId, eventExists: eventSnap.exists(), eventLimit });

        const ownedQ = query(
          ticketsRef,
          where('eventId', '==', eventId),
          where('ownerUid', '==', userUid)
        );
        const ownedSnap = await getDocs(ownedQ);
        const alreadyOwned = ownedSnap.size;

        if (alreadyOwned + requestedCount > eventLimit) {
          warn('normal_limit_reached', {
            eventId,
            userUid,
            alreadyOwned,
            requestedCount,
            eventLimit,
          });
          localStorage.removeItem('fastpass_pending_purchase');
          sessionStorage.removeItem(lockKey);
          setStatus('limitreached');
          return;
        }

        // 🔹 CASO 1: Venue con asiento específico (Auditorio)
        if (Array.isArray(seats) && seats.length > 0) {
          log('normal_assign_exact_seats_start', { seats });

          for (const seat of seats) {
            const q = query(
              ticketsRef,
              where('eventId', '==', eventId),
              where('zone', '==', zone),
              where('seat', '==', seat),
              where('isAvailable', '==', true)
            );

            const snap = await getDocs(q);

            if (!snap.empty) {
              ticketsToBuy.push(snap.docs[0]);
            }
          }

          if (ticketsToBuy.length < seats.length) {
            warn('normal_missing_requested_seats', {
              requestedSeats: seats.length,
              foundSeats: ticketsToBuy.length,
            });
            sessionStorage.removeItem(lockKey);
            setStatus('notickets');
            return;
          }
        } else {
          // 🔹 CASO 2: otros venues (solo zona + cantidad)
          const q = query(
            ticketsRef,
            where('eventId', '==', eventId),
            where('zone', '==', zone),
            where('isAvailable', '==', true)
          );

          const querySnapshot = await getDocs(q);

          // ❗ OJO: aquí ya NO filtramos por forResale
          let availableTickets = querySnapshot.docs;

          log(
            'normal_available_tickets',
            availableTickets.map((d) => ({
              id: d.id,
              eventId: d.data().eventId,
              zone: d.data().zone,
              seat: d.data().seat,
              isAvailable: d.data().isAvailable,
              forResale: d.data().forResale,
            }))
          );

          // ordenar por número de asiento si aplica
          availableTickets = availableTickets.sort((a, b) => {
            const seatA = parseInt((a.data().seat || '').replace(/\D/g, ''), 10);
            const seatB = parseInt((b.data().seat || '').replace(/\D/g, ''), 10);
            return seatA - seatB;
          });

          if (availableTickets.length < ticketCount) {
            warn('normal_not_enough_tickets', {
              availableCount: availableTickets.length,
              requestedCount: ticketCount,
            });
            sessionStorage.removeItem(lockKey);
            setStatus('notickets');
            return;
          }

          ticketsToBuy = availableTickets.slice(0, ticketCount);
        }

        // 2) Batch para actualizar tickets + usuario
        const batch = writeBatch(db);

        ticketsToBuy.forEach((tDoc) => {
          batch.update(tDoc.ref, {
            isAvailable: false,
            ownerUid: userUid,
            forResale: false,
          });
        });

        const userRef = doc(db, 'users', userUid);
        batch.set(
          userRef,
          {
            tickets: arrayUnion(...ticketsToBuy.map((t) => t.id)),
          },
          { merge: true }
        );

        log('normal_batch_commit_start', { ticketsToAssign: ticketsToBuy.map((t) => t.id) });
        await batch.commit();
        log('normal_batch_commit_ok', { ticketsToAssign: ticketsToBuy.map((t) => t.id) });

        // 3) Limpiar localStorage
        localStorage.removeItem('fastpass_pending_purchase');
        sessionStorage.removeItem(lockKey);

        setStatus('success');
      } catch (err) {
        errorLog('unhandled_error', {
          message: err?.message,
          code: err?.code,
          name: err?.name,
          stack: err?.stack,
        });
        sessionStorage.removeItem(lockKey);
        if (err?.code === 'permission-denied') {
          setStatus('permissions');
        } else {
          setStatus('error');
        }
      }
    };

    processPurchase();
  }, []);

  const goToAccount = () => history.push('/account');
  const goToEvents = () => history.push('/events'); // ajusta esta ruta a como la tengas

  return (
    <div className="payment-success-container" style={{ marginTop: '80px' }}>
      <div className="payment-card">
        <div className={`status-icon status-${status}`} aria-hidden>
          {status === 'processing' && <div className="spinner" />}
          {status === 'success' && (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="var(--success)" />
              <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {status === 'notickets' && (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#f59e0b" />
              <path d="M12 8v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {status === 'error' && (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="var(--danger)" />
              <path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div className="status-content">
          {status === 'processing' && (
            <>
              <h2 className="status-title">Procesando tu compra...</h2>
              <p className="status-desc">Por favor espera un momento mientras asignamos tus boletos.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h2 className="status-title">¡Pago exitoso!</h2>
              <p className="status-desc">Tus boletos han sido asignados a tu cuenta.</p>
              <div className="actions">
                <button className="primary-btn" onClick={goToAccount}>Ver mis boletos</button>
                <button className="ghost-btn" onClick={goToEvents}>Ver otros eventos</button>
              </div>
            </>
          )}

          {status === 'notickets' && (
            <>
              <h2 className="status-title">Pago aprobado, pero sin boletos disponibles</h2>
              <p className="status-desc">
                El pago se realizó, pero no encontramos suficientes boletos disponibles en la zona seleccionada.
                Contacta al administrador.
              </p>
              <div className="actions">
                <button className="primary-btn" onClick={goToEvents}>Ver otros eventos</button>
              </div>
            </>
          )}

          {status === 'limitreached' && (
            <>
              <h2 className="status-title">Límite de boletos alcanzado</h2>
              <p className="status-desc">
                Ya alcanzaste el número máximo de boletos permitidos para este evento.
              </p>
              <div className="actions">
                <button className="primary-btn" onClick={goToEvents}>Ver otros eventos</button>
              </div>
            </>
          )}

          {status === 'permissions' && (
            <>
              <h2 className="status-title">Faltan permisos en Firestore</h2>
              <p className="status-desc">
                El pago se procesó, pero las reglas actuales de Firestore bloquearon la asignación.
                Actualiza reglas y vuelve a intentar.
              </p>
              <div className="actions">
                <button className="primary-btn" onClick={goToEvents}>Volver a eventos</button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className="status-title">Ups, algo salió mal</h2>
              <p className="status-desc">
                No pudimos completar la asignación de tus boletos. Intenta de nuevo o contacta soporte.
              </p>
              <div className="actions">
                <button className="primary-btn" onClick={goToEvents}>Volver a eventos</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
