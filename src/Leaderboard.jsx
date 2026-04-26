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
    <div className="screen" style={{paddingBottom:100}}>
      <h2 className="screen-title">🏆 Scorebord</h2>
      <p style={{fontSize:12,opacity:0.4}}>Alle spelers wereldwijd</p>
      {loading && <p className="loading">Laden...</p>}
      {!loading && scores.length === 0 && (
        <p className="loading">Nog geen scores -- speel een potje!</p>
      )}
      <div className="board-wrap">
        {scores.map(function(s, i) {
          return (
            <div key={i} className="score-row" style={{
              background: i < 3 ? "rgba(168,85,247,0.12)" : i % 2 === 0 ? "rgba(255,255,255,0.04)" : "transparent"
            }}>
              <span className="score-rank">{i < 3 ? ["🥇","🥈","🥉"][i] : (i+1)+"."}</span>
              <div className="score-info">
                <span className="score-name">{s.name}</span>
                <span className="score-sub">{s.maxDigits} cijfers</span>
              </div>
              <span className="score-val">{s.score} pts</span>
              <span className="score-date">{s.date}</span>
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
