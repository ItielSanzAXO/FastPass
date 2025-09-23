import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Página no encontrada</p>
        <p className="notfound-text">
          La ruta que intentaste visitar no existe. Puede que el enlace esté roto o la página haya sido movida.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-button">Ir al inicio</Link>
          <Link to="/events" className="notfound-link">Ver eventos</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
