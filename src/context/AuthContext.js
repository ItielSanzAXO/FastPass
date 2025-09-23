import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // indica si estamos resolviendo la sesión inicial

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser); // Actualizar el estado del usuario

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          uid: currentUser.uid, // Guardar el UID del usuario
          email: currentUser.email,
          displayName: currentUser.displayName,
          tickets: [],
        }, { merge: true }); // Crear o actualizar el documento del usuario
      }

      setLoading(false); // Termina la carga inicial tras resolver el estado de auth
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}