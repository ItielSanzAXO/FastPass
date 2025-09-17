import { db } from "../firebaseConfig.js";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function deleteTicketsForEvent(eventId) {
  if (!eventId) throw new Error("Se requiere el eventId para eliminar boletos");
  const ticketsRef = collection(db, "tickets");
  const q = query(ticketsRef, where("eventId", "==", eventId));
  const snapshot = await getDocs(q);
  const batchDeletes = [];
  snapshot.forEach(ticketDoc => {
    batchDeletes.push(deleteDoc(doc(db, "tickets", ticketDoc.id)));
  });
  await Promise.all(batchDeletes);
}
