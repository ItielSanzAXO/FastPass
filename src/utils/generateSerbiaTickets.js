import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Distribución actualizada del Auditorio ITIZ
const zones = {
  A: [5, 5, 5, 5, 6, 6],
  B: [8, 8, 9, 9, 9, 10],
  C: [5, 5, 5, 5, 6, 6],
  D: [14, 14, 14, 14, 14],
  E: [14, 14, 14, 14, 14, 14, 14]
};

const VIP_ZONES = ["A", "B", "C"];
const VIP_ROWS = [0, 1, 2, 3]; // filas 1 a 4

const getSeatId = (zone, row, seat) => {
  const rowStr = String(row + 1).padStart(2, "0");
  const seatStr = String(seat + 1).padStart(2, "0");
  return `${zone}${rowStr}${seatStr}`;
};

const generateSerbiaTickets = async () => {
  const eventId = "serbia";
  const venueId = "auditorio-itiz";
  const pricing = { VIP: 800, General: 600 };

  try {
    for (const [zone, rowLayout] of Object.entries(zones)) {
      for (let rowIndex = 0; rowIndex < rowLayout.length; rowIndex++) {
        const seatsInRow = rowLayout[rowIndex];
        for (let seatIndex = 0; seatIndex < seatsInRow; seatIndex++) {
          const seatId = getSeatId(zone, rowIndex, seatIndex);
          const isVIP =
            VIP_ZONES.includes(zone) && VIP_ROWS.includes(rowIndex);

          const ticketData = {
            eventId,
            venueId,
            zone,
            seat: seatId,
            type: isVIP ? "VIP" : "General",
            price: isVIP ? pricing.VIP : pricing.General,
            ownerUid: null,
            isAvailable: true,
            forResale: false
          };

          const ticketRef = doc(db, "tickets", seatId);
          const exists = await getDoc(ticketRef);

          if (!exists.exists()) {
            await setDoc(ticketRef, ticketData);
            console.log(`✅ Ticket ${seatId} generado`);
          } else {
            console.log(`⏩ Ticket ${seatId} ya existe, se omite`);
          }
        }
      }
    }

    console.log("🎫 Boletos para SERBIA generados con protección contra sobrescritura ✅");
  } catch (error) {
    console.error("❌ Error al generar boletos:", error);
  }
};

generateSerbiaTickets();
