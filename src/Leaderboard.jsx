import { useState, useEffect } from "react";
import { subscribeScores } from "./firebase.js";

const MODES = [
  { id:"klassiek",  emoji:"🧠", naam:"Klassiek" },
  { id:"kleur",     emoji:"🎨", naam:"Kleur" },
  { id:"flits",     emoji:"⚡", naam:"Flits" },
];

export default function Leaderboard({ uid, onBack }) {
  const [activeMode, setActiveMode] = useState("klassiek");
  const [scores, setScores]         = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(function() {
    setLoading(true);
    var unsub = subscribeScores(activeMode, function(data) {
      setScores(data);
      setLoading(false);
    });
    return function() { unsub(); };
  }, [activeMode]);

  return (
    <div className="screen" style={{paddingBottom:100}}>
      <h2 className="screen-title">🏆 Scorebord</h2>

      {/* Modus tabs */}
      <div style={{
        display:"flex", gap:8, width:"100%", maxWidth:400,
        overflowX:"auto", paddingBottom:4
      }}>
        {MODES.map(function(m) {
          var active = m.id === activeMode;
          return (
            <button key={m.id} onClick={function() { setActiveMode(m.id); }} style={{
              padding:"8px 16px", borderRadius:20, border:"none",
              cursor:"pointer", fontSize:13, fontWeight:700, whiteSpace:"nowrap",
              background: active ? "#A855F7" : "rgba(255,255,255,0.08)",
              color: active ? "#fff" : "rgba(255,255,255,0.5)",
              boxShadow: active ? "0 0 20px rgba(168,85,247,0.4)" : "none",
              transition:"all 0.15s"
            }}>{m.emoji} {m.naam}</button>
          );
        })}
      </div>

      {loading && <p className="loading">Laden...</p>}
      {!loading && scores.length === 0 && (
        <p className="loading">Nog geen scores — speel een potje!</p>
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
              borderRadius:14, marginBottom:6
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
