import { useState, useEffect } from "react";
import { db } from "./lib/firebase.js";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

export default function Leaderboard({ uid, onBack }) {
  const [scores, setScores]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {

    const q = query(
      collection(db, "leaderboard_global"),
      orderBy("score", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      function(snapshot) {
        const data = snapshot.docs.map(function(doc) {
          return { id: doc.id, ...doc.data() };
        });

        console.log("LIVE DATA:", data);

        setScores(data);
        setLoading(false);
      },
      function(error) {
        console.error("FIRESTORE ERROR:", error);
        alert("Firestore error: " + error.message);
        setLoading(false);
      }
    );

    return function() {
      unsubscribe();
    };

  }, []);

  return (
    <div className="screen" style={{paddingBottom:100}}>
      <h2 className="screen-title">🏆 Scorebord</h2>
      <p style={{fontSize:12, opacity:0.4}}>Top 20 wereldwijd</p>

      {loading && <p className="loading">Laden...</p>}
      {!loading && scores.length === 0 && (
        <p className="loading">Nog geen scores -- speel een potje!</p>
      )}

      <div className="board-wrap">
        {scores.map(function(s, i) {
          var isMe = s.uid === uid;
          return (
            <div key={s.id} className="score-row" style={{
              background: isMe
                ? "rgba(168,85,247,0.2)"
                : i < 3 ? "rgba(255,255,255,0.07)"
                : i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
              border: isMe ? "1px solid rgba(168,85,247,0.4)" : "1px solid transparent",
              borderRadius: 14, marginBottom: 6
            }}>
              <span className="score-rank">
                {i < 3 ? ["🥇","🥈","🥉"][i] : (i+1)+"."}
              </span>
              <div className="score-info">
                <span className="score-name">{s.name} {isMe ? "👈" : ""}</span>
                <span className="score-sub">{s.maxDigits} cijfers</span>
              </div>
              <span className="score-val">{s.score} pts</span>
            </div>
          );
        })}
      </div>

      <div className="bottom-bar">
        <button className="btn-ghost" onClick={onBack}>← Terug</button>
      </div>
    </div>
  );
}