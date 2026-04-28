import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export function getUser(uid) {
  return getDoc(doc(db, "users", uid)).then(function(snap) {
    if (snap.exists()) return snap.data();
    return null;
  }).catch(function() { return null; });
}

export function createUser(uid, name) {
  return setDoc(doc(db, "users", uid), {
    name: name.trim(),
    bestScore: 0,
    bestMaxDigits: 0,
    createdAt: serverTimestamp()
  }).then(function() {
    return true;
  }).catch(function() { return false; });
}

export function updateBestScore(uid, score, maxDigits) {
  return getDoc(doc(db, "users", uid)).then(function(snap) {
    if (!snap.exists()) return false;
    var old = snap.data().bestScore || 0;
    if (score <= old) return false;
    return updateDoc(doc(db, "users", uid), {
      bestScore: score,
      bestMaxDigits: maxDigits
    }).then(function() { return true; });
  }).catch(function() { return false; });
}

export function updateName(uid, name) {
  return updateDoc(doc(db, "users", uid), {
    name: name.trim()
  }).then(function() {
    return true;
  }).catch(function() { return false; });
}
