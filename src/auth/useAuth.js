import { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase.js";

export function useAuth() {
  const [uid, setUid]     = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(function() {
    var unsub = onAuthStateChanged(auth, function(user) {
      if (user) {
        setUid(user.uid);
        setReady(true);
      } else {
        signInAnonymously(auth).catch(function() {
          setReady(true);
        });
      }
    });
    return function() { unsub(); };
  }, []);

  return { uid, ready };
}
