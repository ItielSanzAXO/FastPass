import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { useAuth } from '../context/AuthContext'; // Importar el contexto
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

function LoginPage() {
  const { login } = useAuth();
  const history = useHistory(); // Hook para redirección

  const handleLogin = async () => {
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

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', color: '#1e9ade' }}>
      <h1>Iniciar Sesión en FastPass</h1>
      <button 
        onClick={handleLogin} 
        style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#6995bb', color: '#eefbff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Iniciar sesión con Google
      </button>
    </div>
  );
}

export default LoginPage;
