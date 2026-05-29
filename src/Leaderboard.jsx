import { useState, useEffect } from "react";
import { subscribeScores } from "./firebase.js";

const MODES = [
  { id:"klassiek",   emoji:"&#x1F9E0;", naam:"Klassiek" },
  { id:"kleur",      emoji:"&#x1F3A8;", naam:"Kleur" },
  { id:"flits",      emoji:"&#x26A1;",  naam:"Flits" },
  { id:"omgekeerd",  emoji:"&#x1F504;", naam:"Omgekeerd" },
  { id:"oplopend",   emoji:"&#x1F4C8;", naam:"Oplopend" },
  { id:"codebreker", emoji:"&#x1F513;", naam:"Code Breker" },
  { id:"simon",      emoji:"&#x1F3B5;", naam:"Simon" },
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
      <h2 className="screen-title">&#x1F3C6; Scorebord</h2>

      <div style={{
        display:"flex", gap:6, width:"100%", maxWidth:400,
        overflowX:"auto", paddingBottom:4
      }}>
        {MODES.map(function(m) {
          var active = m.id === activeMode;
          return (
            <button key={m.id} onClick={function() { setActiveMode(m.id); }} style={{
              padding:"7px 12px", borderRadius:20, border:"none",
              cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap",
              background: active ? "#A855F7" : "rgba(255,255,255,0.08)",
              color: active ? "#fff" : "rgba(255,255,255,0.5)",
              boxShadow: active ? "0 0 20px rgba(168,85,247,0.4)" : "none",
              transition:"all 0.15s"
            }}>
              <span dangerouslySetInnerHTML={{__html: m.emoji}}/> {m.naam}
            </button>
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
                {i < 3 ? ["&#x1F947;","&#x1F948;","&#x1F949;"][i] : (i+1)+"."}
              </span>
              <div className="score-info">
                <span className="score-name">{s.name} {isMe ? "&#x1F448;" : ""}</span>
                <span className="score-sub">
                  {activeMode === "simon" ? s.maxDigits+" reeks" : s.maxDigits+" cijfers"}
                </span>
              </div>
              <span className="score-val">{s.score} pts</span>
            </div>
          );
        })}
      </div>

      <div className="bottom-bar">
        <button className="btn-ghost" onClick={onBack}>&#x2190; Terug</button>
      </div>
    </div>
  );
}
