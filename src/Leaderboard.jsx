import { useState, useEffect } from "react";
import { getScores } from "./firebase.js";

export default function Leaderboard({ onBack }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    getScores().then(function(data) {
      setScores(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← Terug</button>
      <h2 className="screen-title">🏆 Scorebord</h2>
      {loading && <p className="loading">Laden...</p>}
      {!loading && scores.length === 0 && <p className="loading">Nog geen scores</p>}
      <div className="board-wrap">
        {scores.map(function(s, i) {
          return (
            <div key={i} className="score-row" style={{background: i % 2 === 0 ? "rgba(255,255,255,0.05)" : "transparent"}}>
              <span className="score-rank">{i < 3 ? ["🥇","🥈","🥉"][i] : (i + 1) + "."}</span>
              <span className="score-name">{s.name}</span>
              <span className="score-val">{s.score} cijfers</span>
              <span className="score-date">{s.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
