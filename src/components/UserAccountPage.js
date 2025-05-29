import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; // Importar useHistory para redirección
import { getAuth, signOut } from 'firebase/auth'; // Importar signOut para cerrar sesión
import { db } from '../firebaseConfig.js';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';

const globalStyles = {
  fontFamily: 'Disket Mono, monospace',
  color: '#1e9ade',
};

function UserAccountPage() {
  const [userTickets, setUserTickets] = useState([]);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [userInfo, setUserInfo] = useState({ name: '', profilePic: '' });
  const history = useHistory(); // Hook para redirección

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

            return {
              id: docSnapshot.id,
              ...ticketData,
              eventName: eventDoc.exists() ? eventDoc.data().name : 'Evento desconocido',
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
    <div style={{ ...globalStyles, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={userInfo.profilePic || null} 
            alt="Foto de perfil" 
            style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} 
          />
          <h2>Bienvenido, {userInfo.name}</h2>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ padding: '10px 20px', backgroundColor: '#d9534f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>
      <h1>Mis Boletos</h1>
      <ul style={{ 
        listStyleType: 'none', 
        padding: 0, 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {userTickets.map(ticket => (
          <li 
            key={ticket.id} 
            style={{ 
              padding: '15px', 
              border: '2px solid #6995bb', 
              borderRadius: '10px', 
              backgroundColor: '#eefbff', 
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
              transition: 'transform 0.2s', 
              cursor: 'pointer' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'
            }
          >
            <h3 style={{ margin: '0 0 10px', color: '#1e9ade' }}>{ticket.eventName}</h3>
            <p style={{ margin: '0 0 5px', color: '#333' }}>Evento: {ticket.event}</p>
            <p style={{ margin: '0 0 5px', color: '#333' }}>Precio: ${ticket.price}</p>
            <p style={{ margin: '0 0 5px', color: '#333' }}>Zona: {ticket.zone}</p>
            <p style={{ margin: '0 0 5px', color: '#333' }}>Asiento: {ticket.seat}</p>
            <button 
              onClick={() => handleToggleResale(ticket.id)} 
              style={{ 
                marginTop: '10px', 
                padding: '10px 15px', 
                backgroundColor: ticket.forResale ? '#d9534f' : '#6995bb', 
                color: '#eefbff', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer', 
                fontWeight: 'bold' 
              }}
            >
              {ticket.forResale ? 'Quitar de Reventa' : 'Poner en Reventa'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserAccountPage;
