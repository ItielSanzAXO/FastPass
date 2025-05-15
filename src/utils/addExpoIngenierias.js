import { db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const addExpoIngenierias = async () => {
  try {
    await setDoc(doc(db, "events", "expo-ingenierias"), {
      name: "Expo Ingenierías",
      venueId: "duela-itiz",
      allowResale: false,
      ticketLimitPerUser: 3,
      ticketPricing: {
        General: 0
      },
      dates: ["2025-05-22", "2025-05-23"]
    });

    console.log("📚 Evento 'Expo Ingenierías' agregado correctamente.");
  } catch (error) {
    console.error("❌ Error al agregar evento:", error);
  }
};

addExpoIngenierias();
