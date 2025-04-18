import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Importar el contexto
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import ResalePage from './components/ResalePage';
import LoginPage from './components/LoginPage';
import UserAccountPage from './components/UserAccountPage';

function Navigation() {
  const { user } = useAuth(); // Obtener el estado del usuario
  const isLoggedIn = !!user; // Verificar si el usuario está autenticado con Gooogle

  return (
    <nav style={{ padding: '10px', backgroundColor: '#1e9ade', marginBottom: '20px' }}>
      <Link to="/" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Inicio</Link>
      {!isLoggedIn ? (
        <Link to="/login" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Iniciar Sesión</Link>
      ) : (
        <Link to="/account" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Mi Cuenta</Link>
      )}
      <Link to="/events" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Eventos</Link>
      <Link to="/resale" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Reventa</Link>
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
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
