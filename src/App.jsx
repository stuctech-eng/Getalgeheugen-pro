import { useState } from "react";
import Game from "./Game.jsx";
import Leaderboard from "./Leaderboard.jsx";
import Settings from "./Settings.jsx";

const COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];

const VERSION = "2.0.0";

const DEFAULT_SETTINGS = {
  showTime: 3000,
  startDigits: 2,
  winsUp: 3,
  failsDown: 2,
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
  const [screen, setScreen]       = useState("login");
  const [player, setPlayer]       = useState(loadPlayer);
  const [name, setName]           = useState(loadPlayer);
  const [settings, setSettings]   = useState(loadSettings);
  const [result, setResult]       = useState(null);

  function login() {
    if (!name.trim()) return;
    var n = name.trim();
    setPlayer(n);
    try { localStorage.setItem("gg_player", n); } catch(e) {}
    setScreen("menu");
  }

  function saveSettings(s) {
    setSettings(s);
    try { localStorage.setItem("gg_settings", JSON.stringify(s)); } catch(e) {}
    setScreen("menu");
  }

  function handleGameOver(res) {
    setResult(res);
    setScreen("result");
  }

  if (screen === "login") return (
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
      <p className="sub">Train je werkgeheugen</p>
      <input className="name-input" placeholder="Voer je naam in..."
        value={name} maxLength={20}
        onChange={function(e) { setName(e.target.value); }}
        onKeyDown={function(e) { if (e.key === "Enter") login(); }} />
      <button className="btn-primary" onClick={login}>🚀 Spelen</button>
      <p className="version">v{VERSION}</p>
    </div>
  );

  if (screen === "game") return (
    <Game player={player} settings={settings}
      onMenu={function() { setScreen("menu"); }}
      onGameOver={handleGameOver} />
  );

  if (screen === "scores") return (
    <Leaderboard onBack={function() { setScreen("menu"); }} />
  );

  if (screen === "settings") return (
    <Settings settings={settings} onSave={saveSettings}
      onBack={function() { setScreen("menu"); }} />
  );

  if (screen === "result") return (
    <div className="screen center">
      <div className="result-emoji">
        {result && result.maxDigits >= 7 ? "🏆" : result && result.maxDigits >= 5 ? "🥈" : "🎯"}
      </div>
      <h2 className="result-title">Goed gedaan,<br/>{player}!</h2>
      <div className="result-stats">
        <div className="stat-card">
          <div className="stat-num">{result ? result.maxDigits : 0}</div>
          <div className="stat-label">Max cijfers</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{result ? result.score : 0}</div>
          <div className="stat-label">Score</div>
        </div>
      </div>
      <p style={{fontSize:13,opacity:0.5,textAlign:"center"}}>
        Score = cijfers × streak bonus per ronde
      </p>
      <button className="btn-primary" onClick={function() { setScreen("game"); }}>🔁 Opnieuw</button>
      <button className="btn-ghost"   onClick={function() { setScreen("scores"); }}>🏆 Scorebord</button>
      <button className="btn-ghost"   onClick={function() { setScreen("menu"); }}>🏠 Menu</button>
    </div>
  );

  return (
    <div className="screen center">
      <h1>Welkom<br/><span className="accent">{player}</span></h1>
      <button className="btn-primary" onClick={function() { setScreen("game"); }}>🎮 Spelen</button>
      <button className="btn-ghost"   onClick={function() { setScreen("scores"); }}>🏆 Scorebord</button>
      <button className="btn-ghost"   onClick={function() { setScreen("settings"); }}>⚙️ Instellingen</button>
      <button className="btn-ghost"   onClick={function() {
        try { localStorage.removeItem("gg_player"); } catch(e) {}
        setName(""); setScreen("login");
      }}>👤 Wissel speler</button>
      <p className="version">v{VERSION}</p>
    </div>
  );
}
