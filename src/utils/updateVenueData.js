import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const updateVenue = async () => {
  try {
    await updateDoc(doc(db, "venues", "auditorio-itiz"), {
      capacity: 285
    });

    console.log("🏟️ Venue 'auditorio-itiz' actualizado correctamente con nueva capacidad.");
  } catch (error) {
    console.error("❌ Error al actualizar venue:", error);
  }
};

updateVenue();
