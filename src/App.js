import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Importar el contexto
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import ResalePage from './components/ResalePage';
import LoginPage from './components/LoginPage';
import UserAccountPage from './components/UserAccountPage';
import Footer from './components/Footer'; // Importar el Footer
import './styles/Navigation.css'; // Importar los estilos del menú
import { useState } from 'react'; // Importar useState para manejar el estado del menú

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
        <Link to="/" className="navigation-title">FastPass</Link>
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
        <div>
          <Navigation />
          <Switch>
            <Route exact path="/" component={HomePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/events" component={EventsPage} />
            <Route path="/resale" component={ResalePage} />
            <Route path="/account" component={UserAccountPage} />
          </Switch>
          <Footer /> {/* Agregar el Footer aquí */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
