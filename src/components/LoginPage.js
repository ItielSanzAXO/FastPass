import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

initializeApp(firebaseConfig);

function LoginPage() {
  const handleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
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
