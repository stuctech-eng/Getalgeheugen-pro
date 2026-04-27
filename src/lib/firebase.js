import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCQBfeCQZnES6ix4YcMoBxZPeF8gn7eF4",
  authDomain: "getalgeheugen.firebaseapp.com",
  projectId: "getalgeheugen",
  storageBucket: "getalgeheugen.firebasestorage.app",
  messagingSenderId: "140215190929",
  appId: "1:140215190929:web:67efac98ec28a5ec3f8630"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
