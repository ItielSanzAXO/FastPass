import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../firebaseConfig.js';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import '../styles/UserAccountPage.css';
import TicketModal from './TicketModal.js';

function UserAccountPage() {
  const [userTickets, setUserTickets] = useState([]);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [userInfo, setUserInfo] = useState({ name: '', profilePic: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const fetchFirebaseUserInfo = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        setUserInfo({
          name: currentUser.displayName || '',
          profilePic: currentUser.photoURL || '',
          uid: currentUser.uid, // Usar el UID de Firebase Authentication
        });
      } else {
        console.error('No se encontró un usuario autenticado en Firebase.');
        history.push('/login');
      }
    };

    fetchFirebaseUserInfo();
  }, [history]);

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

        alert(`El boleto para ${ticketToSell.eventName} se ha puesto en reventa.`);
      } catch (error) {
        console.error('Error al actualizar el boleto en Firestore:', error);
        alert('Hubo un error al intentar poner el boleto en reventa.');
      }
    }
  };

  const handleToggleResale = async (ticketId) => {
    const ticketToToggle = userTickets.find(ticket => ticket.id === ticketId);
    if (ticketToToggle) {
      try {
        const ticketDocRef = doc(db, 'tickets', ticketId);
        const newForResaleStatus = !ticketToToggle.forResale;

        await updateDoc(ticketDocRef, {
          forResale: newForResaleStatus,
        });

        const updatedTickets = userTickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, forResale: newForResaleStatus } : ticket
        );

        setUserTickets(updatedTickets);

        alert(
          newForResaleStatus
            ? `El boleto para ${ticketToToggle.eventName} se ha puesto en reventa.`
            : `El boleto para ${ticketToToggle.eventName} se ha quitado de reventa.`
        );
      } catch (error) {
        console.error('Error al actualizar el estado de reventa en Firestore:', error);
        alert('Hubo un error al intentar cambiar el estado de reventa del boleto.');
      }
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth); // Cerrar sesión en Firebase
      localStorage.removeItem('googleAccessToken'); // Eliminar el token de acceso
      history.push('/login'); // Redirigir a la página de inicio de sesión
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
      <h1>Mis Boletos</h1>
      <ul className="user-account-tickets-list">
        {userTickets.map(ticket => (
          <li
            key={ticket.id}
            className="user-account-ticket-item"
          >
            <h3 className="user-account-ticket-title">{ticket.eventName}</h3>
            <p className="user-account-ticket-info">Precio: ${ticket.price}</p>
            <p className="user-account-ticket-info">Zona: {ticket.zone}</p>
            <p className="user-account-ticket-info">Asiento: {ticket.seat}</p>
            <button
              onClick={() => handleToggleResale(ticket.id)}
              className={`user-account-resale-btn${ticket.forResale ? ' resale' : ''}`}
            >
              {ticket.forResale ? 'Quitar de Reventa' : 'Poner en Reventa'}
            </button>
            <button
              onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
              className="user-account-resale-btn"
              style={{ marginLeft: '10px', background: '#1e9ade' }}
            >
              Ver boleto
            </button>
          </li>
        ))}
      </ul>
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticket={selectedTicket}
        userName={userInfo.name}
      />
    </div>
  );
}

export default UserAccountPage;
