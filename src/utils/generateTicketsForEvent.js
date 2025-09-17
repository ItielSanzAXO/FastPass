import { db } from "../firebaseConfig.js";
import { doc, writeBatch } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Reglas de generación de boletos por venue
export async function generateTicketsForEvent({ eventId, venueId, pricing, forResale = false, eventName }) {
  if (!eventId || !venueId || !pricing) throw new Error("Faltan datos requeridos para generar boletos");

  // Log de autenticación
  const auth = getAuth();
  const user = auth.currentUser;
  console.log("[generateTicketsForEvent] Usuario autenticado:", user ? user.email : null, user ? user.uid : null);

  // Prefijos por venue
  let venuePrefix = "GEN";
  if (venueId === "auditorio-itiz") venuePrefix = "AUIT";
  else if (venueId === "duela-itiz") venuePrefix = "DUIT";
  else if (venueId === "salon-51") venuePrefix = "S51";

  // Usar los primeros 4 caracteres del eventId como sufijo identificador
  const eventSuffix = (eventId || "EVNT").replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase().padEnd(4, "-");

  // Utilidad para hacer batch writes de hasta 500 tickets
  async function batchWriteTickets(tickets) {
    const batchSize = 500;
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = tickets.slice(i, i + batchSize);
      chunk.forEach(({ id, ticketData }) => {
        batch.set(doc(db, "tickets", id), ticketData);
      });
      try {
        await batch.commit();
        console.log(`[generateTicketsForEvent] Batch de ${chunk.length} tickets guardado correctamente.`);
      } catch (err) {
        console.error(`[generateTicketsForEvent] Error al guardar batch:`, err);
        throw err;
      }
    }
  }

  let tickets = [];

  if (venueId === "salon-51") {
    // 300 boletos generales
    for (let i = 1; i <= 300; i++) {
      const seat = String(i).padStart(3, "0");
      const id = `${venuePrefix}${eventSuffix}-${seat}`;
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
      tickets.push({ id, ticketData });
    }
    await batchWriteTickets(tickets);
  } else if (venueId === "duela-itiz") {
    // 50 VIP, 200 generales
    for (let i = 1; i <= 250; i++) {
      const isVIP = i <= 50;
      const seat = String(i).padStart(3, "0");
      const id = `${venuePrefix}${eventSuffix}-${seat}`;
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
      tickets.push({ id, ticketData });
    }
    await batchWriteTickets(tickets);
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
    for (const [zone, rowLayout] of Object.entries(zones)) {
      for (let rowIndex = 0; rowIndex < rowLayout.length; rowIndex++) {
        const seatsInRow = rowLayout[rowIndex];
        for (let seatIndex = 0; seatIndex < seatsInRow; seatIndex++) {
          // Fila y asiento en formato 2 dígitos
          const fila = String(rowIndex + 1).padStart(2, "0");
          const asiento = String(seatIndex + 1).padStart(2, "0");
          const seat = `${zone}${fila}${asiento}`;
          const id = `${venuePrefix}${eventSuffix}-${seat}`;
          const isVIP = VIP_ZONES.includes(zone) && VIP_ROWS.includes(rowIndex);
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
          tickets.push({ id, ticketData });
        }
      }
    }
    await batchWriteTickets(tickets);
  } else {
    throw new Error("Venue no soportado para generación automática de boletos");
  }
}
