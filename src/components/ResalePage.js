
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

const globalStyles = {
  fontFamily: 'Disket Mono, monospace',
  color: '#1e9ade',
};

function ResalePage() {
  const [resaleTickets, setResaleTickets] = useState([]);


  useEffect(() => {
    // Obtener boletos en reventa desde Firestore
    const fetchResaleTickets = async () => {
      try {
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('forResale', '==', true));
        const querySnapshot = await getDocs(q);
        const fetchedResaleTickets = querySnapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            event: data.eventName || 'Evento',
            price: data.resalePrice || data.price || 0,
            ...data,
          };
        });
        setResaleTickets(fetchedResaleTickets);
      } catch (error) {
        console.error('Error al obtener boletos en reventa:', error);
      }
    };
    fetchResaleTickets();
  }, []);

  const handleBuyTicket = (ticketId) => {
    alert(`Has comprado el boleto con ID: ${ticketId}`);
    // Aquí puedes agregar la lógica para procesar la compra
  };

  return (
    <div style={{ ...globalStyles, padding: '20px' }}>
      <h1>Boletos en Reventa</h1>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {resaleTickets.length === 0 ? (
          <li>No hay boletos en reventa disponibles.</li>
        ) : (
          resaleTickets.map(ticket => (
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
              {ticket.eventName || ticket.event} - ${ticket.resalePrice || ticket.price}
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
          ))
        )}
      </ul>
    </div>
  );
}

export default ResalePage;
