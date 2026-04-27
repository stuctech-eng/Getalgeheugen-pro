import { collection, addDoc, getDocs, orderBy, query, limit, where, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export function submitScore(uid, name, score, maxDigits) {
  if (!uid || score <= 0) return Promise.resolve(false);

  // Check if player already has a score
  return getDocs(query(
    collection(db, "leaderboard_global"),
    where("uid", "==", uid)
  )).then(function(snap) {
    if (!snap.empty) {
      var existing = snap.docs[0].data();
      // Only save if better score
      if (score <= existing.score) return false;
      // Delete old entry first
      return snap.docs[0].ref.delete().then(function() {
        return true;
      });
    }
    return true;
  }).then(function(shouldSave) {
    if (!shouldSave) return false;
    return addDoc(collection(db, "leaderboard_global"), {
      uid: uid,
      name: name,
      score: score,
      maxDigits: maxDigits,
      createdAt: serverTimestamp()
    }).then(function() {
      return true;
    });
  }).catch(function(e) {
    console.error("submitScore failed:", e);
    return false;
  });
}

export function getTopScores() {
  return getDocs(query(
    collection(db, "leaderboard_global"),
    orderBy("score", "desc"),
    limit(20)
  )).then(function(snap) {
    return snap.docs.map(function(d) { return d.data(); });
  }).catch(function(e) {
    console.error("getTopScores failed:", e);
    return [];
  });
}
