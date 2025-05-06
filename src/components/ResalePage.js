import React, { useState, useEffect } from 'react';

const globalStyles = {
  fontFamily: 'Disket Mono, monospace',
  color: '#1e9ade',
};

function ResalePage() {
  const [resaleTickets, setResaleTickets] = useState([]);

  useEffect(() => {
    // Simulación de datos de boletos en reventa desde una base de datos
    const fetchedResaleTickets = [
      { id: 1, event: 'Concierto 1', price: 50 },
      { id: 2, event: 'Concierto 2', price: 75 },
    ];
    setResaleTickets(fetchedResaleTickets);
  }, []);

  const handleBuyTicket = (ticketId) => {
    alert(`Has comprado el boleto con ID: ${ticketId}`);
    // Aquí puedes agregar la lógica para procesar la compra
  };

  return (
    <div style={{ ...globalStyles, padding: '20px' }}>
      <h1>Boletos en Reventa</h1>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {resaleTickets.map(ticket => (
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
              onClick={() => handleBuyTicket(ticket.id)} 
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
              Comprar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ResalePage;
