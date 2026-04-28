import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export function submitScore(uid, name, score, maxDigits) {
  if (!uid || score <= 0) return Promise.resolve(false);

  return getDocs(query(
    collection(db, "leaderboard_global"),
    where("uid", "==", uid)
  )).then(function(snap) {
    if (!snap.empty) {
      var existing = snap.docs[0].data();
      if (score <= existing.score) return false;
      return snap.docs[0].ref.delete().then(function() {
        return addDoc(collection(db, "leaderboard_global"), {
          uid: uid,
          name: name,
          score: score,
          maxDigits: maxDigits,
          createdAt: serverTimestamp()
        });
      }).then(function() { return true; });
    }
    return addDoc(collection(db, "leaderboard_global"), {
      uid: uid,
      name: name,
      score: score,
      maxDigits: maxDigits,
      createdAt: serverTimestamp()
    }).then(function() { return true; });
  }).catch(function(e) {
    console.error("submitScore failed:", e);
    return false;
  });
}

export function getTopScores() {
  return getDocs(
    collection(db, "leaderboard_global")
  ).then(function(snap) {
    var scores = snap.docs.map(function(d) { return d.data(); });
    scores.sort(function(a, b) { return b.score - a.score; });
    return scores.slice(0, 20);
  }).catch(function(e) {
    console.error("getTopScores failed:", e);
    return [];
  });
}
