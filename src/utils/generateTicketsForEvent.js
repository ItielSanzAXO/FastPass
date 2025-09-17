import { db } from "../firebaseConfig.js";
import { doc, setDoc } from "firebase/firestore";

// Reglas de generación de boletos por venue
export async function generateTicketsForEvent({ eventId, venueId, pricing, forResale = false, eventName }) {
  if (!eventId || !venueId || !pricing) throw new Error("Faltan datos requeridos para generar boletos");

  // Obtener prefijo de 4 letras del nombre del evento (mayúsculas, sin espacios ni caracteres especiales)
  let prefix = "EVNT";
  if (eventName && typeof eventName === "string") {
    prefix = eventName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase().padEnd(4, "-");
  }

  if (venueId === "salon-51") {
    // 300 boletos generales
    for (let i = 1; i <= 300; i++) {
      const seat = `${prefix}-${String(i).padStart(3, "0")}`;
      const ticketData = {
        eventId,
        venueId,
        seat,
        type: "General",
        zone: "General",
        price: pricing.general,
        ownerUid: null,
        isAvailable: true,
        forResale,
      };
      await setDoc(doc(db, "tickets", seat), ticketData);
    }
  } else if (venueId === "duela-itiz") {
    // 50 VIP, 200 generales
    for (let i = 1; i <= 250; i++) {
      const isVIP = i <= 50;
      const seat = `${prefix}-${String(i).padStart(3, "0")}`;
      const ticketData = {
        eventId,
        venueId,
        seat,
        type: isVIP ? "VIP" : "General",
        zone: isVIP ? "VIP" : "General",
        price: isVIP ? pricing.vip : pricing.general,
        ownerUid: null,
        isAvailable: true,
        forResale,
      };
      await setDoc(doc(db, "tickets", seat), ticketData);
    }
  } else if (venueId === "auditorio-itiz") {
    // Zonas y filas según tu lógica
    const zones = {
      A: [5, 5, 5, 5, 6, 6],
      B: [8, 8, 9, 9, 9, 10],
      C: [5, 5, 5, 5, 6, 6],
      D: [14, 14, 14, 14, 14],
      E: [14, 14, 14, 14, 14, 14, 14],
    };
    const VIP_ZONES = ["A", "B", "C"];
    const VIP_ROWS = [0, 1, 2, 3];
    let count = 1;
    for (const [zone, rowLayout] of Object.entries(zones)) {
      for (let rowIndex = 0; rowIndex < rowLayout.length; rowIndex++) {
        const seatsInRow = rowLayout[rowIndex];
        for (let seatIndex = 0; seatIndex < seatsInRow; seatIndex++) {
          const isVIP = VIP_ZONES.includes(zone) && VIP_ROWS.includes(rowIndex);
          const seat = `${prefix}-${String(count).padStart(3, "0")}`;
          const ticketData = {
            eventId,
            venueId,
            seat,
            type: isVIP ? "VIP" : "General",
            zone,
            price: isVIP ? pricing.vip : pricing.general,
            ownerUid: null,
            isAvailable: true,
            forResale,
          };
          await setDoc(doc(db, "tickets", seat), ticketData);
          count++;
        }
      }
    }
  } else {
    throw new Error("Venue no soportado para generación automática de boletos");
  }
}
