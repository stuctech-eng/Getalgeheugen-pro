import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export async function getUser(uid) {
  try {
    var snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data();
    return null;
  } catch(e) {
    console.error("getUser failed:", e);
    return null;
  }
}

export async function createUser(uid, name) {
  try {
    await setDoc(doc(db, "users", uid), {
      name: name.trim(),
      bestScore: 0,
      bestMaxDigits: 0,
      createdAt: serverTimestamp()
    });
    return true;
  } catch(e) {
    console.error("createUser failed:", e);
    return false;
  }
}

export async function updateBestScore(uid, score, maxDigits) {
  try {
    await updateDoc(doc(db, "users", uid), {
      bestScore: score,
      bestMaxDigits: maxDigits
    });
    return true;
  } catch(e) {
    console.error("updateBestScore failed:", e);
    return false;
  }
}

export async function updateName(uid, name) {
  try {
    await updateDoc(doc(db, "users", uid), {
      name: name.trim()
    });
    return true;
  } catch(e) {
    console.error("updateName failed:", e);
    return false;
  }
}
