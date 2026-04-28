import { useState, useEffect } from "react";
import { useAuth } from "./auth/useAuth.js";
import { getUser, createUser } from "./services/userService.js";
import { submitScore } from "./services/leaderboardService.js";
import Game from "./Game.jsx";
import Leaderboard from "./Leaderboard.jsx";
import Settings from "./Settings.jsx";
import Result from "./Result.jsx";
import Help from "./Help.jsx";

const COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];

const VERSION = "4.3.0";

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

export default function App() {
  const { uid, ready } = useAuth();

  const [screen, setScreen]       = useState("loading");
  const [player, setPlayer]       = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [settings, setSettings]   = useState(loadSettings);
  const [result, setResult]       = useState(null);
  const [creating, setCreating]   = useState(false);

  useEffect(function() {
    if (!ready) return;
    if (!uid) { setScreen("error"); return; }
    getUser(uid).then(function(user) {
      if (user) {
        setPlayer(user);
        // Sync scorebord bij app start
        if (user.bestScore > 0) {
          submitScore(uid, user.name, user.bestScore, user.bestMaxDigits);
        }
        setScreen("menu");
      } else {
        setScreen("name");
      }
    });
  }, [ready, uid]);

  function handleCreateUser() {
    var name = nameInput.trim();
    if (name.length < 2) { setNameError("Minimaal 2 tekens"); return; }
    if (name.length > 12) { setNameError("Maximaal 12 tekens"); return; }
    setCreating(true);
    setNameError("");
    createUser(uid, name).then(function(ok) {
      if (ok) {
        setPlayer({ name: name, bestScore: 0, bestMaxDigits: 0 });
        setScreen("menu");
      } else {
        setNameError("Opslaan mislukt, probeer opnieuw");
      }
      setCreating(false);
    });
  }

  function saveSettings(s) {
    setSettings(s);
    try { localStorage.setItem("gg_settings", JSON.stringify(s)); } catch(e) {}
    setScreen("menu");
  }

  function handleGameOver(res) {
    if (res.score > 0) {
      setPlayer(function(p) {
        return Object.assign({}, p, {
          bestScore: Math.max((p && p.bestScore) || 0, res.score),
          bestMaxDigits: Math.max((p && p.bestMaxDigits) || 0, res.maxDigits)
        });
      });
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
          onKeyDown={function(e) { if (e.key === "Enter") handleCreateUser(); }} />
        {nameError && (
          <p style={{color:"#F87171", fontSize:13, textAlign:"center"}}>{nameError}</p>
        )}
        <button className="btn-primary"
          style={{opacity: creating ? 0.6 : 1}}
          onClick={handleCreateUser}>
          {creating ? "Opslaan..." : "🚀 Spelen"}
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
      key={Date.now()}
      onBack={function() { setScreen("menu"); }} />
  );

  if (screen === "settings") return (
    <Settings uid={uid} player={player} settings={settings}
      onSave={saveSettings}
      onNameChange={function(newName) {
        setPlayer(function(p) { return Object.assign({}, p, {name: newName}); });
      }}
      onBack={function() { setScreen("menu"); }} />
  );

  if (screen === "help") return (
    <Help onBack={function() { setScreen("menu"); }} />
  );

  if (screen === "result") return (
    <Result
      result={result}
      player={player}
      onPlay={function() { setScreen("game"); }}
      onMenu={function() { setScreen("menu"); }}
      onScores={function() { setScreen("scores"); }} />
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
      <p className="sub">Welkom, <span className="accent">{player && player.name}</span>!</p>
      {player && player.bestScore > 0 && (
        <div className="best-score-badge">
          🏆 Beste score: {player.bestScore} pts -- {player.bestMaxDigits} cijfers
        </div>
      )}
      <button className="btn-primary"
        onClick={function() { setScreen("game"); }}>🎮 Spelen</button>
      <button className="btn-ghost"
        onClick={function() { setScreen("scores"); }}>🏆 Scorebord</button>
      <button className="btn-ghost"
        onClick={function() { setScreen("settings"); }}>⚙️ Instellingen</button>
      <button className="btn-ghost"
        onClick={function() { setScreen("help"); }}>❓ Help</button>
      <p className="version">v{VERSION}</p>
    </div>
  );
}
