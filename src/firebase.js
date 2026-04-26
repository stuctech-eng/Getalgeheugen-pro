import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs,
  orderBy, query, limit, where, deleteDoc, doc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCQBfeCQZnES6ix4YcMoBxZPeF8gn7eF4",
  authDomain: "getalgeheugen.firebaseapp.com",
  projectId: "getalgeheugen",
  storageBucket: "getalgeheugen.firebasestorage.app",
  messagingSenderId: "140215190929",
  appId: "1:140215190929:web:67efac98ec28a5ec3f8630"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveScore(name, maxDigits, score) {
  // Only save if score > 0
  if (score <= 0) return;

  try {
    // Check if player already has a score
    var q = query(
      collection(db, "scores"),
      where("name", "==", name)
    );
    var snap = await getDocs(q);

    if (!snap.empty) {
      // Player exists -- only update if better score
      var existing = snap.docs[0];
      var oldScore = existing.data().score || 0;
      if (score <= oldScore) return; // Not a new record

      // Delete old score
      await deleteDoc(doc(db, "scores", existing.id));
    }

    // Save new best score
    await addDoc(collection(db, "scores"), {
      name: name,
      maxDigits: maxDigits,
      score: score,
      date: new Date().toLocaleDateString("nl-NL"),
      timestamp: Date.now()
    });

  } catch(e) {
    console.error("Score opslaan mislukt:", e);
  }
}

export async function getScores() {
  try {
    var q = query(
      collection(db, "scores"),
      orderBy("score", "desc"),
      limit(20)
    );
    var snap = await getDocs(q);
    return snap.docs.map(function(d) { return d.data(); });
  } catch(e) {
    console.error("Scores ophalen mislukt:", e);
    return [];
  }
}
