import React, { useEffect } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, getRedirectResult } from 'firebase/auth'; // Importar getRedirectResult
import { initializeApp } from 'firebase/app';
import { useAuth } from '../context/AuthContext.js'; // Importar el contexto
import { useHistory } from 'react-router-dom'; // Importar useHistory para redirección

// Configuración de Firebase usando variables de entorno o funciones
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || window.firebaseConfig.custom.api_key,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || window.firebaseConfig.custom.auth_domain,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || window.firebaseConfig.custom.project_id,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || window.firebaseConfig.custom.storage_bucket,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || window.firebaseConfig.custom.messaging_sender_id,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || window.firebaseConfig.custom.app_id,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || window.firebaseConfig.custom.measurement_id,
};

// Inicializar Firebase
initializeApp(firebaseConfig);

const globalStyles = {
  fontFamily: 'Disket Mono, monospace',
  color: '#1e9ade',
};

function LoginPage() {
  const { login } = useAuth();
  const history = useHistory(); // Hook para redirección
  // ...existing code...

  useEffect(() => {
    const auth = getAuth();
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential.accessToken; // Obtener el token de acceso
          localStorage.setItem('googleAccessToken', token); // Guardar el token en localStorage
          login(result.user); // Guardar el usuario en el contexto
          console.log('Usuario autenticado tras redirección:', result.user);
          history.push('/account'); // Redirigir a la página de cuenta
        }
      } catch (error) {
        console.error('Error al manejar el resultado de la redirección:', error);
      }
    };

    handleRedirectResult();
  }, [login, history]);

  // Login con Google
  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken; // Obtener el token de acceso
      localStorage.setItem('googleAccessToken', token); // Guardar el token en localStorage
      login(result.user); // Guardar el usuario en el contexto
      console.log('Usuario autenticado:', result.user);
      history.push('/account'); // Redirigir a la página de cuenta
    } catch (error) {
      console.error('Error durante la autenticación:', error);
    }
  };

  // Login con Apple 
  const handleAppleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      'https://appleid.apple.com/auth/authorize',
      'AppleLogin',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <div style={{ ...globalStyles, textAlign: 'center', marginTop: '50px' }}>
      <h1>Iniciar Sesión en FastPass</h1>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
        {/* Botón Apple */}
        <button
          onClick={handleAppleLogin}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '12px 28px', fontSize: '17px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '260px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {/* Apple SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M16.365 1.43c0 1.14-.93 2.07-2.07 2.07-.03-1.17.96-2.07 2.07-2.07zm1.77 4.36c-.06-.06-1.32-.63-2.73-.63-1.08 0-2.07.39-2.73.39-.69 0-1.77-.39-2.91-.39-2.31 0-4.44 1.44-5.64 3.66-2.4 4.17-.6 10.34 1.71 13.73 1.14 1.68 2.49 3.57 4.29 3.5 1.74-.07 2.4-1.13 4.5-1.13 2.1 0 2.7 1.13 4.5 1.09 1.8-.04 2.94-1.68 4.05-3.36.69-1.02.96-1.53 1.5-2.67-3.93-1.5-4.53-7.13-.66-8.91-.42-1.68-1.62-3.19-3.38-3.41zm-3.66-2.67c.36-.45.6-1.08.54-1.71-.6.03-1.26.39-1.65.87-.36.45-.63 1.11-.54 1.74.66.06 1.29-.36 1.65-.9z" />
            </svg>
            Iniciar sesión con Apple
          </span>
        </button>
        {/* Botón Google */}
        <button
          onClick={handleGoogleLogin}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '12px 28px', fontSize: '17px', backgroundColor: '#fff', color: '#444', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', width: '260px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {/* Google SVG */}
            <svg width="22" height="22" viewBox="0 0 48 48" style={{ marginRight: '8px' }}>
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.23 9.19 3.25l6.85-6.85C36.13 2.34 30.4 0 24 0 14.61 0 6.36 5.74 2.44 14.09l7.98 6.21C12.13 13.16 17.62 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.75H24v9.02h12.44c-.54 2.91-2.18 5.38-4.65 7.04l7.2 5.59C43.98 37.36 46.1 31.44 46.1 24.5z"/>
                <path fill="#FBBC05" d="M10.42 28.3c-.48-1.44-.76-2.97-.76-4.55s.28-3.11.76-4.55l-7.98-6.21C.86 16.98 0 20.36 0 24c0 3.64.86 7.02 2.44 10.01l7.98-6.21z"/>
                <path fill="#EA4335" d="M24 48c6.4 0 12.13-2.11 16.64-5.76l-7.2-5.59c-2.01 1.35-4.59 2.15-7.44 2.15-6.38 0-11.87-3.66-14.58-8.8l-7.98 6.21C6.36 42.26 14.61 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </g>
            </svg>
            Iniciar sesión con Google
          </span>
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
