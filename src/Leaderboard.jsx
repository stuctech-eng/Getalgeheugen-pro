import { useState, useEffect, useCallback } from "react";
import { getTopScores } from "./services/leaderboardService.js";

export default function Leaderboard({ uid, onBack }) {
  const [scores, setScores]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadScores() {
    return getTopScores().then(function(data) {
      setScores(data);
      setLoading(false);
      setRefreshing(false);
    });
  }

  useEffect(function() {
    loadScores();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadScores();
  }

  return (
    <div className="screen" style={{paddingBottom:100}}>
      <div style={{display:"flex", alignItems:"center", gap:12, width:"100%", maxWidth:400}}>
        <h2 className="screen-title" style={{flex:1}}>🏆 Scorebord</h2>
        <button
          onClick={handleRefresh}
          style={{
            background:"rgba(168,85,247,0.15)",
            border:"1px solid rgba(168,85,247,0.3)",
            borderRadius:12, padding:"8px 14px",
            color:"#A855F7", fontSize:20, cursor:"pointer",
            animation: refreshing ? "spin 0.8s linear infinite" : "none"
          }}>
          🔄
        </button>
      </div>

      <p style={{fontSize:12, opacity:0.4}}>Top 20 wereldwijd</p>

      {loading && <p className="loading">Laden...</p>}
      {!loading && scores.length === 0 && (
        <p className="loading">Nog geen scores -- speel een potje!</p>
      )}

      <div className="board-wrap">
        {scores.map(function(s, i) {
          var isMe = s.uid === uid;
          return (
            <div key={i} className="score-row" style={{
              background: isMe
                ? "rgba(168,85,247,0.2)"
                : i < 3 ? "rgba(255,255,255,0.07)" : i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
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
