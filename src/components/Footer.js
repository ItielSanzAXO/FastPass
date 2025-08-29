import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const globalStyles = {
  fontFamily: 'Disket Mono, monospace',
  color: '#1e9ade',
};

function Footer() {
  return (
    <footer style={{ ...globalStyles, textAlign: 'center', padding: '10px', backgroundColor: '#282c34', color: '#fff' }}>
      <div className="footer-links">
        <Link to="/HelpPage">Ayuda</Link>
        <Link to="/About">Sobre Nosotros</Link>
        <Link to="/Contact">Contacto</Link>
      </div>
      <p>© 2025 FastPass. Todos los derechos reservados.</p>
    </footer>
  );
}

export default Footer;
