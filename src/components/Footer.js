import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="homepage-footer">
      <div className="footer-links">
        <Link to="/help">Ayuda</Link>
        <Link to="/about">Sobre Nosotros</Link>
        <Link to="/contact">Contacto</Link>
      </div>
      <p>© 2025 FastPass. Todos los derechos reservados.</p>
    </footer>
  );
}

export default Footer;
