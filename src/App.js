import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js'; // Importar el contexto
import HomePage from './components/HomePage.js';
import EventsPage from './components/EventsPage.js';
import EventDetail from './components/EventDetail.js'; // Importar EventDetail
import ResalePage from './components/ResalePage.js';
import LoginPage from './components/LoginPage.js';
import UserAccountPage from './components/UserAccountPage.js';
import Footer from './components/Footer.js'; // Importar el Footer
import './styles/Navigation.css'; // Importar los estilos del menú
import { useState } from 'react'; // Importar useState para manejar el estado del menú
import logo from './assets/FastPassBG.png'; // Importar el logo
import './App.css'; // Importar los estilos de la aplicación

function Navigation() {
  const { user } = useAuth(); // Obtener el estado del usuario
  const isLoggedIn = !!user; // Verificar si el usuario está autenticado con Google
  const [menuOpen, setMenuOpen] = useState(false); // Estado para manejar el menú

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false); // Cerrar el menú al hacer clic en un enlace
  };

  return (
    <nav className="navigation-container">
      <div className="navigation-logo">
        <Link to="/" className="navigation-title">
          <img 
            src={logo} 
            alt="Logo" 
            className="logo" 
            style={{ 
              width: '65px', 
              height: 'auto', 
              paddingTop: '5px',
              borderRadius: '10px' // Aplicar border-radius a toda la imagen
            }} 
          />
        </Link>
      </div>
      <button className="hamburger-button" onClick={toggleMenu}>
        {menuOpen ? '✖' : '☰'} {/* Cambiar entre abrir y cerrar */}
      </button>
      <div className={`navigation-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/events" className="navigation-link" onClick={closeMenu}>Eventos</Link>
        <Link to="/resale" className="navigation-link" onClick={closeMenu}>Reventa</Link>
        {!isLoggedIn ? (
          <Link to="/login" className="navigation-link" onClick={closeMenu}>Iniciar Sesión</Link>
        ) : (
          <Link to="/account" className="navigation-link" onClick={closeMenu}>Mi Cuenta</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <div style={{ flex: 1 }}>
            <Switch>
              <Route path="/" exact component={HomePage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/events" component={EventsPage} />
              <Route path="/event/:eventId" component={EventDetail} />
              <Route path="/resale" component={ResalePage} />
              <Route path="/account" component={UserAccountPage} />
            </Switch>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
