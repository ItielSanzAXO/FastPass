import React, { useState } from 'react';

function ResalePage() {
  const [tickets, setTickets] = useState([]);
  const [price, setPrice] = useState('');

  const handleResale = () => {
    if (price) {
      setTickets([...tickets, { id: tickets.length + 1, price }]);
      setPrice('');
    }
  };

  return (
    <div style={{ padding: '20px', color: '#1e9ade' }}>
      <h1>Reventa de Boletos</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="number"
          placeholder="Establece tu precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', fontSize: '16px', border: '1px solid #6995bb', borderRadius: '5px' }}
        />
        <button 
          onClick={handleResale} 
          style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#6995bb', color: '#eefbff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Agregar Boleto a Reventa
        </button>
      </div>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {tickets.map(ticket => (
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
            Boleto #{ticket.id} - ${ticket.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ResalePage;
