import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', color: '#1e9ade' }}>
      <h1>Bienvenido a FastPass</h1>
      <p>Tu solución digital para boletos de eventos y conciertos.</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/events" style={{ margin: '0 10px', textDecoration: 'none' }}>
          <button style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#6995bb', color: '#eefbff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Ver Eventos
          </button>
        </Link>
        <Link to="/resale" style={{ margin: '0 10px', textDecoration: 'none' }}>
          <button style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#e6f4f1', color: '#1e9ade', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Reventa de Boletos
          </button>
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
