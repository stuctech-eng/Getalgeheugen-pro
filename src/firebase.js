import { db } from "./lib/firebase.js";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, serverTimestamp } from "firebase/firestore";

export async function saveScore(name, score, maxDigits) {
  if (!name || score <= 0) return;
  try {
    // Check bestaande score
    var snap = await getDocs(query(
      collection(db, "scores"),
      where("name", "==", name)
    ));

    if (!snap.empty) {
      var old = snap.docs[0].data().score || 0;
      if (score <= old) return; // Niet beter
      await deleteDoc(snap.docs[0].ref); // Verwijder oude
    }

    await addDoc(collection(db, "scores"), {
      name: name,
      score: score,
      maxDigits: maxDigits,
      createdAt: serverTimestamp()
    });
  } catch(e) {
    console.error("saveScore failed:", e);
  }
}
