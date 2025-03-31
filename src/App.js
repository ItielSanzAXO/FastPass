import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import ResalePage from './components/ResalePage';
import LoginPage from './components/LoginPage';

function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: '10px', backgroundColor: '#1e9ade', marginBottom: '20px' }}>
          <Link to="/" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Inicio</Link>
          <Link to="/login" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Iniciar Sesión</Link>
          <Link to="/events" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Eventos</Link>
          <Link to="/resale" style={{ margin: '0 10px', color: '#eefbff', textDecoration: 'none' }}>Reventa</Link>
        </nav>
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/events" component={EventsPage} />
          <Route path="/resale" component={ResalePage} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
