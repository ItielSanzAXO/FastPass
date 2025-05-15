import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc
} from "firebase/firestore";

// ⚠️ Usa directamente tus variables de entorno si ya tienes `.env`
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función principal
async function importInitialData() {
  try {
    // VENUES
    await setDoc(doc(db, "venues", "auditorio-itiz"), {
      name: "Auditorio ITIZ",
      type: "Auditorio",
      zones: ["A", "B", "C", "D", "E"],
      capacity: 204
    });

    await setDoc(doc(db, "venues", "duela-itiz"), {
      name: "Duela ITIZ",
      type: "Espacio Múltiple",
      zones: ["VIP", "General"],
      capacity: 200
    });

    await setDoc(doc(db, "venues", "salon-51"), {
      name: "Sal\u00F3n 51",
      type: "Bar",
      zones: ["General"],
      capacity: 120
    });

    // EVENTS
    await setDoc(doc(db, "events", "serbia"), {
      name: "SERBIA",
      venueId: "auditorio-itiz",
      allowResale: true,
      ticketLimitPerUser: 3,
      ticketPricing: {
        VIP: 800,
        General: 600
      }
    });

    await setDoc(doc(db, "events", "university-day"), {
      name: "University Day",
      venueId: "duela-itiz",
      allowResale: false,
      ticketLimitPerUser: 3,
      ticketPricing: {
        VIP: 500,
        General: 350
      }
    });

    await setDoc(doc(db, "events", "mar-indigo"), {
      name: "Mar Indigo",
      venueId: "salon-51",
      allowResale: true,
      ticketLimitPerUser: 3,
      ticketPricing: {
        General: 300
      }
    });

    console.log("✅ Datos importados correctamente");
  } catch (error) {
    console.error("❌ Error al importar datos:", error);
  }
}

// Ejecutar al correr el archivo
importInitialData();
