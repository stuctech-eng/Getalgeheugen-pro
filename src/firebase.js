    import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, limit } from "firebase/firestore";

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
  try {
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
    return snap.docs.map(function(doc) { return doc.data(); });
  } catch(e) {
    console.error("Scores ophalen mislukt:", e);
    return [];
  }
}
