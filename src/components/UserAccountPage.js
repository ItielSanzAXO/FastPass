import React, { useState, useEffect } from 'react';

function UserAccountPage() {
  const [userTickets, setUserTickets] = useState([]);
  const [resaleTickets, setResaleTickets] = useState([]);

  useEffect(() => {
    // Simulación de boletos comprados por el usuario
    const fetchedUserTickets = [
      { id: 1, event: 'Concierto 1', price: 50 },
      { id: 2, event: 'Concierto 2', price: 75 },
    ];
    setUserTickets(fetchedUserTickets);
  }, []);

  const handleSellTicket = (ticketId) => {
    const ticketToSell = userTickets.find(ticket => ticket.id === ticketId);
    if (ticketToSell) {
      setResaleTickets([...resaleTickets, ticketToSell]);
      setUserTickets(userTickets.filter(ticket => ticket.id !== ticketId));
      alert(`El boleto para ${ticketToSell.event} se ha puesto en reventa.`);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#1e9ade' }}>
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
