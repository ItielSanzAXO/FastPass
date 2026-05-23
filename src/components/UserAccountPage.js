import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../firebaseConfig.js';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import '../styles/UserAccountPage.css';
import TicketModal from './TicketModal.js';
import GeeTest from 'react-geetest-v4'; 
import NotificationPopup from './NotificationPopup.js';


function UserAccountPage() {
  const [userTickets, setUserTickets] = useState([]);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [userInfo, setUserInfo] = useState({ name: '', profilePic: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '' });
  const [walletSummary, setWalletSummary] = useState({ pending: 0, totalSold: 0, withdrawn: 0 });
  const [walletMovements, setWalletMovements] = useState([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  
  const history = useHistory();


  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserInfo({
        name: currentUser.displayName || '',
        profilePic: currentUser.photoURL || '',
        uid: currentUser.uid,
      });
    }
  }, []);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!userInfo.uid) return;

      try {
        const userRef = doc(db, 'users', userInfo.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setWalletSummary({
            pending: Number(userData.walletPending || 0),
            totalSold: Number(userData.walletTotalSold || 0),
            withdrawn: Number(userData.walletWithdrawn || 0),
          });
        }

        const movementsRef = collection(db, 'wallet_movements');
        const q = query(movementsRef, where('sellerUid', '==', userInfo.uid));
        const movementSnapshot = await getDocs(q);
        const movementList = movementSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        movementList.sort((a, b) => {
          const aTs = a.createdAt?.seconds || 0;
          const bTs = b.createdAt?.seconds || 0;
          return bTs - aTs;
        });

        setWalletMovements(movementList);
      } catch (error) {
        console.error('Error al obtener datos de wallet:', error);
      }
    };

    fetchWalletData();
  }, [userInfo.uid]);

  useEffect(() => {
    const fetchUserTickets = async () => {
      try {
        console.log('UID del usuario:', userInfo.uid); // Verificar el UID del usuario

        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('ownerUid', '==', userInfo.uid));
        const querySnapshot = await getDocs(q);

        console.log('Resultados de la consulta:', querySnapshot.docs); // Verificar los resultados de la consulta


        const fetchedTickets = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const ticketData = docSnapshot.data();
            const eventDocRef = doc(db, 'events', ticketData.eventId);
            const eventDoc = await getDoc(eventDocRef);

            let eventName = 'Evento desconocido';
            let eventDate = '';
            let venueId = '';
            let eventImageUrl = '';
            let ticketPricing = {};
            if (eventDoc.exists()) {
              const eventData = eventDoc.data();
              eventName = eventData.name || eventName;
              eventDate = eventData.date || eventData.fecha || '';
              venueId = eventData.venueId || '';
              eventImageUrl = eventData.imageUrl || '';
              ticketPricing = eventData.ticketPricing || {};
            }

            // Obtener datos del venue si hay venueId
            let venueName = '';
            let venueType = '';
            let venueCapacity = '';
            let venueZones = [];
            if (venueId) {
              try {
                const venueDocRef = doc(db, 'venues', venueId);
                const venueDoc = await getDoc(venueDocRef);
                if (venueDoc.exists()) {
                  const venueData = venueDoc.data();
                  venueName = venueData.name || '';
                  venueType = venueData.type || '';
                  venueCapacity = venueData.capacity || '';
                  venueZones = venueData.zones || [];
                }
              } catch (e) {
                console.error('Error obteniendo venue:', e);
              }
            }

            // Lógica para determinar el acceso
            let access = 'General';
            const zone = (ticketData.zone || '').toUpperCase();
            if (venueName.toLowerCase().includes('auditorio')) {
              if (["A", "B", "C", "D"].includes(zone)) {
                access = 'VIP';
              }
            } else if (venueName.toLowerCase().includes('duela')) {
              if (zone === 'VIP') {
                access = 'VIP';
              }
            } else if (venueName.toLowerCase().includes('salon 51')) {
              access = 'General';
            }

            return {
              id: docSnapshot.id,
              ...ticketData,
              eventName,
              date: eventDate,
              eventImageUrl,
              ticketPricing,
              venue: venueName,
              venueType,
              venueCapacity,
              venueZones,
              access,
            };
          })
        );

        console.log('Boletos obtenidos:', fetchedTickets); // Mostrar boletos en la consola
        setUserTickets(fetchedTickets);
      } catch (error) {
        console.error('Error al obtener los boletos del usuario:', error);
      }
    };

    if (userInfo.uid) {
      fetchUserTickets();
    } else {
      console.warn('El UID del usuario está vacío.'); // Advertencia si el UID está vacío
    }
  }, [userInfo.uid]);

  // eslint-disable-next-line no-unused-vars
  const handleSellTicket = async (ticketId) => {
    const ticketToSell = userTickets.find(ticket => ticket.id === ticketId);
    if (ticketToSell) {
      try {
        const ticketDocRef = doc(db, 'tickets', ticketId);
        await updateDoc(ticketDocRef, {
          forResale: true,
          isAvailable: false,
        });

        setResaleTickets([...resaleTickets, ticketToSell]);
        setUserTickets(userTickets.filter(ticket => ticket.id !== ticketId));

        setNotification({ isOpen: true, title: '¡Listo!', message: `El boleto para ${ticketToSell.eventName} se ha puesto en reventa.` });
      } catch (error) {
        console.error('Error al actualizar el boleto en Firestore:', error);
        setNotification({ isOpen: true, title: 'Error', message: 'Hubo un error al intentar poner el boleto en reventa.' });
      }
    }
  };

  const handleToggleResale = async (ticket) => {
    try {
      const ticketDocRef = doc(db, "tickets", ticket.id);
      const newForResaleStatus = !ticket.forResale;

      await updateDoc(ticketDocRef, {
        forResale: newForResaleStatus,
      });

      const updatedTickets = userTickets.map((t) =>
        t.id === ticket.id ? { ...t, forResale: newForResaleStatus } : t
      );

      setUserTickets(updatedTickets);

      setNotification({
        isOpen: true,
        title: newForResaleStatus ? '¡Listo!' : 'Actualizado',
        message: newForResaleStatus
          ? `El boleto para ${ticket.eventName} se ha puesto en reventa.`
          : `El boleto para ${ticket.eventName} se ha quitado de reventa.`
      });
    } catch (error) {
      console.error(
        "Error al actualizar el estado de reventa en Firestore:",
        error
      );
      setNotification({ isOpen: true, title: 'Error', message: 'Hubo un error al intentar cambiar el estado de reventa del boleto.' });
    }
  };

  // URL del backend que verifica la respuesta de GeeTest
  const VERIFY_URL = "https://fastpass-backend.vercel.app/api/verify-geetest";

  // Handler: recibe resultado del captcha y, si es válido, llama a handleToggleResale
  const handleCaptchaForTicket = async (result, ticket) => {
    try {
      console.log("Resultado bruto de GeeTest:", result);

      const resp = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result), // GeeTest ya trae captcha_output, etc.
      });

      const data = await resp.json();
      console.log("Respuesta backend GeeTest:", data);

      if (data.ok) {
        // Puzzle validado: ejecutar la lógica de reventa
        await handleToggleResale(ticket);
      } else {
        setNotification({ isOpen: true, title: 'Error de verificación', message: 'No se pudo verificar el puzzle en el servidor. Intenta de nuevo.' });
      }
    } catch (e) {
      console.error("Error llamando al backend GeeTest:", e);
      setNotification({ isOpen: true, title: 'Error', message: 'Error al verificar el puzzle en el servidor.' });
    }
  };


  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth); // Cerrar sesión en Firebase
      localStorage.removeItem('googleAccessToken'); // Eliminar el token de acceso
  // Reemplazar historial para que el back no regrese a /account tras logout
  history.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleWithdrawWallet = async () => {
    const amount = roundMoney(walletSummary.pending);
    if (amount <= 0 || !userInfo.uid) {
      setNotification({ isOpen: true, title: 'Sin saldo', message: 'No tienes saldo pendiente para retirar.' });
      return;
    }

    try {
      setIsWithdrawing(true);

      const userRef = doc(db, 'users', userInfo.uid);
      const withdrawalRef = doc(collection(db, 'withdrawal_requests'));
      const movementRef = doc(collection(db, 'wallet_movements'));

      const batch = writeBatch(db);
      batch.update(userRef, {
        walletPending: 0,
        walletWithdrawn: increment(amount),
      });
      batch.set(withdrawalRef, {
        userUid: userInfo.uid,
        amount,
        status: 'paid',
        note: 'Retiro simulado (proyecto escolar)',
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp(),
      });
      batch.set(movementRef, {
        type: 'withdrawal_request',
        status: 'paid',
        sellerUid: userInfo.uid,
        grossAmount: amount,
        platformFee: 0,
        netAmount: -amount,
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      setWalletSummary((prev) => ({
        ...prev,
        pending: 0,
        withdrawn: roundMoney(prev.withdrawn + amount),
      }));

      setWalletMovements((prev) => [
        {
          id: movementRef.id,
          type: 'withdrawal_request',
          status: 'paid',
          grossAmount: amount,
          platformFee: 0,
          netAmount: -amount,
          createdAt: new Date(),
        },
        ...prev,
      ]);

      setNotification({ isOpen: true, title: 'Retiro simulado', message: `Se retiraron $${amount} de tu saldo.` });
    } catch (error) {
      console.error('Error al simular retiro:', error);
      setNotification({ isOpen: true, title: 'Error', message: 'No se pudo procesar el retiro simulado.' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="user-account-container">
      <div className="user-account-header">
        <div className="user-account-profile">
          <img
            src={userInfo.profilePic || null}
            alt="Foto de perfil"
            className="user-account-profile-pic"
          />
          <h2>Bienvenido, {userInfo.name}</h2>
        </div>
        <button
          onClick={handleLogout}
          className="user-account-logout-btn"
        >
          Cerrar Sesión
        </button>
      </div>
      <section className="wallet-summary-section">
        <button
          type="button"
          className="wallet-toggle-btn"
          onClick={() => setWalletOpen((prev) => !prev)}
          aria-expanded={walletOpen}
          aria-controls="wallet-panel"
        >
          <span>Mi Saldo</span>
          <span className="wallet-toggle-meta">Pendiente: ${formatMoney(walletSummary.pending)}</span>
          <span className={`wallet-toggle-icon${walletOpen ? ' open' : ''}`}>▾</span>
        </button>

        {walletOpen && (
          <div id="wallet-panel" className="wallet-panel">
            <div className="wallet-cards">
              <article className="wallet-card">
                <p className="wallet-label">Saldo pendiente</p>
                <p className="wallet-value">${formatMoney(walletSummary.pending)}</p>
              </article>
              <article className="wallet-card">
                <p className="wallet-label">Ventas completadas</p>
                <p className="wallet-value">{walletSummary.totalSold}</p>
              </article>
              <article className="wallet-card">
                <p className="wallet-label">Total retirado</p>
                <p className="wallet-value">${formatMoney(walletSummary.withdrawn)}</p>
              </article>
            </div>
            <button
              className="wallet-withdraw-btn"
              disabled={isWithdrawing || walletSummary.pending <= 0}
              onClick={handleWithdrawWallet}
            >
              {isWithdrawing ? 'Procesando...' : 'Retirar saldo (simulado)'}
            </button>

            <div className="wallet-movements">
              <h3>Últimos movimientos</h3>
              {walletMovements.length === 0 ? (
                <p className="wallet-empty">Aún no tienes movimientos.</p>
              ) : (
                <ul className="wallet-movement-list">
                  {walletMovements.slice(0, 8).map((movement) => (
                    <li className="wallet-movement-item" key={movement.id}>
                      <span>{formatWalletMovementType(movement.type)}</span>
                      <span>{formatMoneyDate(movement.createdAt)}</span>
                      <span className={Number(movement.netAmount || 0) < 0 ? 'movement-negative' : 'movement-positive'}>
                        {Number(movement.netAmount || 0) < 0 ? '-' : '+'}${formatMoney(Math.abs(Number(movement.netAmount || 0)))}
                      </span>
                      <span>{movement.status || 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
      <h1>Mis Boletos</h1>
      <ul className="user-account-tickets-list">
        {userTickets.map(ticket => (
          <li
            key={ticket.id}
            className="user-account-ticket-item ticket-bg-image"
            style={ticket.eventImageUrl ? {
              backgroundImage: `linear-gradient(rgba(40,40,40,0.7), rgba(40,40,40,0.7)), url('${ticket.eventImageUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              color: '#fff',
              position: 'relative'
            } : {}}
          >
            <div className="ticket-bg-overlay">
              <h3 className="user-account-ticket-title">{ticket.eventName}</h3>
              <p className="user-account-ticket-info">Precio: ${ticket.price}</p>
              <p className="user-account-ticket-info">Zona: {ticket.zone}</p>
              <p className="user-account-ticket-info">Asiento: {ticket.seat}</p>
              <GeeTest
                captchaId="5a589307d9f26d84b6308457c7dbc837"
                product="bind"
                onSuccess={(result) => handleCaptchaForTicket(result, ticket)}
              >
                <button
                  type="button"
                  className={`user-account-resale-btn${ticket.forResale ? ' resale' : ''}`}
                >
                  {ticket.forResale ? 'Quitar de Reventa' : 'Poner en Reventa'}
                </button>
              </GeeTest>
              <button
                onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
                className="user-account-resale-btn"
                style={{ marginLeft: '10px', background: '#1e9ade' }}
              >
                Ver boleto
              </button>
            </div>
          </li>
        ))}
      </ul>
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticket={selectedTicket}
        userName={userInfo.name}
      />
      <NotificationPopup
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMoneyDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  if (dateValue?.seconds) {
    return new Date(dateValue.seconds * 1000).toLocaleString('es-MX');
  }
  if (dateValue instanceof Date) {
    return dateValue.toLocaleString('es-MX');
  }
  return 'Sin fecha';
}

function formatWalletMovementType(type) {
  if (type === 'resale_credit') return 'Venta de reventa';
  if (type === 'withdrawal_request') return 'Retiro';
  return 'Movimiento';
}

export default UserAccountPage;
