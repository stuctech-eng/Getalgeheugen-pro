import { useState, useEffect } from "react";
import { useAuth } from "./auth/useAuth.js";
import { db } from "./lib/firebase.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import Game from "./Game.jsx";
import Leaderboard from "./Leaderboard.jsx";
import Settings from "./Settings.jsx";

const COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];

const VERSION = "5.2.0";

const DEFAULT_SETTINGS = {
  difficultyMod: 0,
  winsUp: 3,
  showMode: "together"
};

function loadSettings() {
  try {
    var s = localStorage.getItem("gg_settings");
    return s ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(s)) : DEFAULT_SETTINGS;
  } catch(e) { return DEFAULT_SETTINGS; }
}

function loadPlayer() {
  try { return localStorage.getItem("gg_player") || ""; } catch(e) { return ""; }
}

export default function App() {
  const { uid, ready } = useAuth();

  const [screen, setScreen]       = useState("loading");
  const [player, setPlayer]       = useState(loadPlayer);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [settings, setSettings]   = useState(loadSettings);
  const [result, setResult]       = useState(null);
  const [bestScore, setBestScore] = useState(null);

  useEffect(function() {
    if (!ready) return;
    if (!uid) { setScreen("error"); return; }
    var saved = loadPlayer();
    if (saved) {
      setPlayer(saved);
      setScreen("menu");
    } else {
      setScreen("name");
    }
  }, [ready, uid]);

  // Beste score ophalen
  useEffect(function() {
    if (!uid) return;
    getDocs(query(
      collection(db, "scores"),
      where("uid", "==", uid)
    )).then(function(snap) {
      if (!snap.empty) {
        setBestScore(snap.docs[0].data());
      }
    });
  }, [uid]);

  function handleNameSave() {
    var name = nameInput.trim();
    if (name.length < 2) { setNameError("Minimaal 2 tekens"); return; }
    if (name.length > 12) { setNameError("Maximaal 12 tekens"); return; }
    setPlayer(name);
    try { localStorage.setItem("gg_player", name); } catch(e) {}
    setScreen("menu");
  }

  function saveSettings(s) {
    setSettings(s);
    try { localStorage.setItem("gg_settings", JSON.stringify(s)); } catch(e) {}
    setScreen("menu");
  }

  function handleGameOver(res) {
    // Update beste score als nieuw record
    if (!bestScore || res.score > bestScore.score) {
      setBestScore({ score: res.score, maxDigits: res.maxDigits });
    }
    setResult(res);
    setScreen("result");
  }

  if (screen === "loading") return (
    <div className="screen center">
      <div className="loading-spinner"/>
      <p style={{opacity:0.4, marginTop:16}}>Laden...</p>
    </div>
  );

  if (screen === "error") return (
    <div className="screen center">
      <p style={{fontSize:40}}>⚠️</p>
      <p style={{opacity:0.6, textAlign:"center"}}>
        Verbinding mislukt.<br/>Controleer je internet.
      </p>
      <button className="btn-primary"
        onClick={function() { window.location.reload(); }}>
        🔄 Opnieuw proberen
      </button>
    </div>
  );

  if (screen === "name") return (
    <div className="screen center">
      <div className="logo">
        {["3","7","2","8"].map(function(n, i) {
          return (
            <div key={i} className="logo-card" style={{
              background: "linear-gradient(135deg," + COLORS[i][0] + "," + COLORS[i][1] + ")",
              transform: "rotate(" + [-12,0,-7,10][i] + "deg)",
              left: i * 52
            }}>{n}</div>
          );
        })}
      </div>
      <h1>Getal<span className="accent">Geheugen</span></h1>
      <p className="sub">Welkom! Kies je spelernaam</p>
      <div style={{width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:8}}>
        <input className="name-input"
          placeholder="Jouw naam (2-12 tekens)"
          value={nameInput} maxLength={12}
          onChange={function(e) { setNameInput(e.target.value); setNameError(""); }}
          onKeyDown={function(e) { if (e.key === "Enter") handleNameSave(); }} />
        {nameError && (
          <p style={{color:"#F87171", fontSize:13, textAlign:"center"}}>{nameError}</p>
        )}
        <button className="btn-primary" onClick={handleNameSave}>
          🚀 Spelen
        </button>
      </div>
      <p className="version">v{VERSION}</p>
    </div>
  );

  if (screen === "game") return (
    <Game uid={uid} player={player} settings={settings}
      onMenu={function() { setScreen("menu"); }}
      onGameOver={handleGameOver} />
  );

  if (screen === "scores") return (
    <Leaderboard uid={uid}
      onBack={function() { setScreen("menu"); }} />
  );

  if (screen === "settings") return (
    <Settings
      settings={settings}
      player={player}
      uid={uid}
      onSave={saveSettings}
      onNameChange={function(newName) {
        setPlayer(newName);
        try { localStorage.setItem("gg_player", newName); } catch(e) {}
      }}
      onBack={function() { setScreen("menu"); }} />
  );

  if (screen === "result") return (
    <div className="screen center">
      <div style={{fontSize:72}}>
        {result && result.maxDigits >= 6 ? "🏆" : result && result.maxDigits >= 4 ? "🎯" : "💪"}
      </div>
      <h2 style={{fontSize:26, fontWeight:900, textAlign:"center"}}>
        Goed gedaan, {player}!
      </h2>
      <div className="result-stats">
        <div className="stat-card">
          <div className="stat-num">{result && result.score}</div>
          <div className="stat-label">Punten</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{result && result.maxDigits}</div>
          <div className="stat-label">Max cijfers</div>
        </div>
      </div>
      <button className="btn-primary" onClick={function() { setScreen("game"); }}>🔁 Opnieuw</button>
      <button className="btn-ghost" onClick={function() { setScreen("scores"); }}>🏆 Scorebord</button>
      <button className="btn-ghost" onClick={function() { setScreen("menu"); }}>🏠 Menu</button>
    </div>
  );

  return (
    <div className="screen center">
      <div className="logo">
        {["3","7","2","8"].map(function(n, i) {
          return (
            <div key={i} className="logo-card" style={{
              background: "linear-gradient(135deg," + COLORS[i][0] + "," + COLORS[i][1] + ")",
              transform: "rotate(" + [-12,0,-7,10][i] + "deg)",
              left: i * 52
            }}>{n}</div>
          );
        })}
      </div>
      <h1>Getal<span className="accent">Geheugen</span></h1>
      <p className="sub">Welkom, <span className="accent">{player}</span>!</p>
      {bestScore && (
        <div className="best-score-badge">
          🏆 Beste: {bestScore.score} pts -- {bestScore.maxDigits} cijfers
        </div>
      )}
      <button className="btn-primary" onClick={function() { setScreen("game"); }}>🎮 Spelen</button>
      <button className="btn-ghost" onClick={function() { setScreen("scores"); }}>🏆 Scorebord</button>
      <button className="btn-ghost" onClick={function() { setScreen("settings"); }}>⚙️ Instellingen</button>
      <p className="version">v{VERSION}</p>
    </div>
  );
}
