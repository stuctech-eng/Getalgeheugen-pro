import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export function getUser(uid) {
  return getDoc(doc(db, "users", uid)).then(function(snap) {
    if (snap.exists()) return snap.data();
    return null;
  }).catch(function(e) {
    console.error("getUser failed:", e);
    return null;
  });
}

export function createUser(uid, name) {
  return setDoc(doc(db, "users", uid), {
    name: name.trim(),
    bestScore: 0,
    bestMaxDigits: 0,
    createdAt: serverTimestamp()
  }).then(function() {
    return true;
  }).catch(function(e) {
    console.error("createUser failed:", e);
    return false;
  });
}

export function updateBestScore(uid, score, maxDigits) {
  return getDoc(doc(db, "users", uid)).then(function(snap) {
    if (!snap.exists()) return false;
    var current = snap.data();
    var oldBest = current.bestScore || 0;
    if (score <= oldBest) return false;
    return updateDoc(doc(db, "users", uid), {
      bestScore: score,
      bestMaxDigits: maxDigits
    }).then(function() {
      return true;
    });
  }).catch(function(e) {
    console.error("updateBestScore failed:", e);
    return false;
  });
}

export function updateName(uid, name) {
  return updateDoc(doc(db, "users", uid), {
    name: name.trim()
  }).then(function() {
    return true;
  }).catch(function(e) {
    console.error("updateName failed:", e);
    return false;
  });
}
