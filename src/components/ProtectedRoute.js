import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

// Uso: <ProtectedRoute path="/account" component={UserAccountPage} />
export default function ProtectedRoute({ component: Component, ...rest }) {
  const { user, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) {
          // Puedes personalizar este loader leve para el estado inicial de auth
          return (
            <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
              Resolviendo sesión...
            </div>
          );
        }
        if (!user) {
          // Reemplaza la entrada del historial para que el back no regrese a /account
          return (
            <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
          );
        }
        return <Component {...props} />;
      }}
    />
  );
}
