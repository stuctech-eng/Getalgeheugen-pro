import { db } from "./lib/firebase.js";
import {
  collection, addDoc, getDocs,
  query, where, orderBy, limit,
  onSnapshot, deleteDoc, serverTimestamp
} from "firebase/firestore";

export function getCollection(mode) {
  var map = {
    "klassiek":   "scores_klassiek",
    "kleur":      "scores_kleur",
    "flits":      "scores_flits",
    "omgekeerd":  "scores_omgekeerd",
    "oplopend":   "scores_oplopend",
    "codebreker": "scores_codebreker",
    "simon":      "scores_simon"
  };
  return map[mode] || "scores_klassiek";
}

export async function saveScore(uid, name, score, maxDigits, mode) {
  if (!uid) return;
  var col = getCollection(mode || "klassiek");
  try {
    var snap = await getDocs(query(
      collection(db, col),
      where("uid", "==", uid)
    ));
    if (!snap.empty) {
      var old = snap.docs[0].data().score || 0;
      if (score <= old) return;
      await deleteDoc(snap.docs[0].ref);
    }
    await addDoc(collection(db, col), {
      uid:       uid,
      name:      name,
      score:     score,
      maxDigits: maxDigits,
      mode:      mode || "klassiek",
      createdAt: serverTimestamp()
    });
  } catch(e) {
    console.error("saveScore failed:", e);
  }
}

export function subscribeScores(mode, callback) {
  var col = getCollection(mode || "klassiek");
  var q = query(
    collection(db, col),
    orderBy("score", "desc"),
    limit(20)
  );
  return onSnapshot(q, function(snap) {
    var data = snap.docs.map(function(d) {
      return Object.assign({ id: d.id }, d.data());
    });
    callback(data);
  }, function(err) {
    console.error("subscribeScores failed:", err);
    callback([]);
  });
}

export async function updateScoreName(uid, newName) {
  var cols = [
    "scores_klassiek","scores_kleur","scores_flits",
    "scores_omgekeerd","scores_oplopend","scores_codebreker","scores_simon"
  ];
  for (var i = 0; i < cols.length; i++) {
    try {
      var snap = await getDocs(query(
        collection(db, cols[i]),
        where("uid", "==", uid)
      ));
      if (!snap.empty) {
        var ref  = snap.docs[0].ref;
        var data = snap.docs[0].data();
        await deleteDoc(ref);
        await addDoc(collection(db, cols[i]), {
          uid:       uid,
          name:      newName,
          score:     data.score,
          maxDigits: data.maxDigits,
          mode:      data.mode,
          createdAt: data.createdAt
        });
      }
    } catch(e) { console.error("updateScoreName failed:", e); }
  }
}
