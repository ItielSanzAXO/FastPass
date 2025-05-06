import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; // Importar useHistory para redirección
import { getAuth, signOut } from 'firebase/auth'; // Importar signOut para cerrar sesión

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
    // Verificar si el token de acceso está disponible
    const token = localStorage.getItem('googleAccessToken');
    if (!token) {
      console.error('No se encontró el token de acceso. Redirigiendo a la página de inicio de sesión.');
      history.push('/login'); // Redirigir si no hay token
      return;
    }

    // Obtener datos del usuario desde la API de Google
    const fetchGoogleUserInfo = async () => {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${token}`, // Token almacenado tras iniciar sesión
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserInfo({
            name: data.name,
            profilePic: data.picture,
          });
        } else {
          console.error('Error al obtener los datos del usuario:', response.statusText);
          history.push('/login'); // Redirigir si hay un error
        }
      } catch (error) {
        console.error('Error al conectar con la API de Google:', error);
        history.push('/login'); // Redirigir si hay un error
      }
    };

    fetchGoogleUserInfo();

    // Simulación de boletos comprados por el usuario
    const fetchedUserTickets = [
      { id: 1, event: 'Concierto 1', price: 50 },
      { id: 2, event: 'Concierto 2', price: 75 },
    ];
    setUserTickets(fetchedUserTickets);
  }, [history]);

  const handleSellTicket = (ticketId) => {
    const ticketToSell = userTickets.find(ticket => ticket.id === ticketId);
    if (ticketToSell) {
      setResaleTickets([...resaleTickets, ticketToSell]);
      setUserTickets(userTickets.filter(ticket => ticket.id !== ticketId));
      alert(`El boleto para ${ticketToSell.event} se ha puesto en reventa.`);
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
            src={userInfo.profilePic} 
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
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {userTickets.map(ticket => (
          <li 
            key={ticket.id} 
            style={{ 
              padding: '10px', 
              margin: '10px 0', 
              border: '1px solid #6995bb', 
              borderRadius: '5px', 
              backgroundColor: '#eefbff' 
            }}
          >
            {ticket.event} - ${ticket.price}
            <button 
              onClick={() => handleSellTicket(ticket.id)} 
              style={{ 
                marginLeft: '10px', 
                padding: '5px 10px', 
                backgroundColor: '#6995bb', 
                color: '#eefbff', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}
            >
              Poner en Reventa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserAccountPage;
