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
  arrayUnion,
} from 'firebase/firestore';
import '../styles/PaymentSuccessPage.css';

function PaymentSuccessPage() {
  const history = useHistory();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error' | 'notickets'

  useEffect(() => {
    const processPurchase = async () => {
      try {
        const stored = localStorage.getItem('fastpass_pending_purchase');
        console.log('stored pending purchase:', stored);

        if (!stored) {
          setStatus('error');
          return;
        }

        const { eventId, zone, ticketCount, userUid, seats } = JSON.parse(stored);

        if (!eventId || !zone || !ticketCount || !userUid) {
          setStatus('error');
          return;
        }

        const ticketsRef = collection(db, 'tickets');
        let ticketsToBuy = [];

        // 🔹 CASO 1: Venue con asiento específico (Auditorio)
        if (Array.isArray(seats) && seats.length > 0) {
          console.log('Asignando por seats exactos:', seats);

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
            console.warn('No se encontraron todos los asientos solicitados');
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

          console.log(
            'Boletos disponibles en success:',
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

        await batch.commit();

        // 3) Limpiar localStorage
        localStorage.removeItem('fastpass_pending_purchase');

        setStatus('success');
      } catch (err) {
        console.error('Error procesando compra en PaymentSuccessPage:', err);
        setStatus('error');
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
