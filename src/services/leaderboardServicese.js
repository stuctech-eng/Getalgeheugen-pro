import {
  collection, addDoc, getDocs,
  orderBy, query, limit, serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase.js";

export async function submitScore(uid, name, score, maxDigits) {
  if (!uid || score <= 0) return false;
  try {
    await addDoc(collection(db, "leaderboard_global"), {
      uid: uid,
      name: name,
      score: score,
      maxDigits: maxDigits,
      createdAt: serverTimestamp()
    });
    return true;
  } catch(e) {
    console.error("submitScore failed:", e);
    return false;
  }
}

export async function getTopScores() {
  try {
    var q = query(
      collection(db, "leaderboard_global"),
      orderBy("score", "desc"),
      limit(20)
    );
    var snap = await getDocs(q);
    return snap.docs.map(function(d) { return d.data(); });
  } catch(e) {
    console.error("getTopScores failed:", e);
    return [];
  }
}
