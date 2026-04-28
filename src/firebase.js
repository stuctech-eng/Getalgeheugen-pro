import { db } from "./lib/firebase.js";
import {
  collection, addDoc, getDocs,
  query, where, deleteDoc, serverTimestamp
} from "firebase/firestore";

// Sla score op -- gekoppeld aan uid
export async function saveScore(uid, name, score, maxDigits) {
  if (!uid || score <= 0) return;
  try {
    // Check bestaande score voor dit device
    var snap = await getDocs(query(
      collection(db, "scores"),
      where("uid", "==", uid)
    ));

    if (!snap.empty) {
      var old = snap.docs[0].data().score || 0;
      if (score <= old) return; // Niet beter
      await deleteDoc(snap.docs[0].ref); // Verwijder oude
    }

    await addDoc(collection(db, "scores"), {
      uid: uid,
      name: name,
      score: score,
      maxDigits: maxDigits,
      createdAt: serverTimestamp()
    });
  } catch(e) {
    console.error("saveScore failed:", e);
  }
}

// Naam updaten op scorebord
export async function updateScoreName(uid, newName) {
  try {
    var snap = await getDocs(query(
      collection(db, "scores"),
      where("uid", "==", uid)
    ));
    if (!snap.empty) {
      var ref = snap.docs[0].ref;
      var data = snap.docs[0].data();
      await deleteDoc(ref);
      await addDoc(collection(db, "scores"), {
        uid: uid,
        name: newName,
        score: data.score,
        maxDigits: data.maxDigits,
        createdAt: data.createdAt
      });
    }
  } catch(e) {
    console.error("updateScoreName failed:", e);
  }
}
