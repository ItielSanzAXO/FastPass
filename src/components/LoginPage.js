import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { useAuth } from '../context/AuthContext'; // Importar el contexto

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAwF8kzPatb6xXLckVEaAvdLKgbhjVXMsY",
  authDomain: "fastpass-91ef9.firebaseapp.com",
  projectId: "fastpass-91ef9",
  storageBucket: "fastpass-91ef9.appspot.com",
  messagingSenderId: "798388642518",
  appId: "1:798388642518:web:065dd5ac82f1f09225df77",
  measurementId: "G-GFSSKCSFF2"
};

// Inicializar Firebase
initializeApp(firebaseConfig);

function LoginPage() {
  const { login } = useAuth();

  const handleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      login(result.user); // Guardar el usuario en el contexto
      console.log('Usuario autenticado:', result.user);
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
