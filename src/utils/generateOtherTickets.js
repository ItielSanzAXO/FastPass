import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

const generateExpoIngenieriasTickets = async () => {
  try {
    for (let i = 1; i <= 250; i++) {
      const seatId = `EXPO-GEN-${String(i).padStart(3, "0")}`;
      const ticketRef = doc(db, "tickets", seatId);
      const exists = await getDoc(ticketRef);

      if (!exists.exists()) {
        await setDoc(ticketRef, {
          eventId: "expo-ingenierias",
          venueId: "duela-itiz",
          zone: "General",
          seat: seatId,
          type: "General",
          price: 0,
          ownerUid: null,
          isAvailable: true,
          forResale: false
        });
        console.log(`🎟️ Ticket ${seatId} creado`);
      } else {
        console.log(`⏩ Ticket ${seatId} ya existe`);
      }
    }

    console.log("✅ Boletos de Expo Ingenierías generados.");
  } catch (error) {
    console.error("❌ Error generando boletos:", error);
  }
};

generateExpoIngenieriasTickets();
