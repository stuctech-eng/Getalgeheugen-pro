import { useState, useRef } from "react";
import Game from "./Game.jsx";
import Leaderboard from "./Leaderboard.jsx";

const COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];

export default function App() {
  const [screen, setScreen] = useState("login");
  const [player, setPlayer] = useState("");
  const [name, setName] = useState("");

  function login() {
    if (!name.trim()) return;
    setPlayer(name.trim());
    setScreen("menu");
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
      <input
        className="name-input"
        placeholder="Voer je naam in..."
        value={name}
        maxLength={20}
        onChange={function(e) { setName(e.target.value); }}
        onKeyDown={function(e) { if (e.key === "Enter") login(); }}
      />
      <button className="btn-primary" onClick={login}>🚀 Spelen</button>
    </div>
  );

  if (screen === "game") return (
    <Game
      player={player}
      onMenu={function() { setScreen("menu"); }}
      onGameOver={function() { setScreen("menu"); }}
    />
  );

  if (screen === "scores") return (
    <Leaderboard onBack={function() { setScreen("menu"); }} />
  );

  return (
    <div className="screen center">
      <h1>Welkom<br/><span className="accent">{player}</span></h1>
      <button className="btn-primary" onClick={function() { setScreen("game"); }}>🎮 Spelen</button>
      <button className="btn-ghost" onClick={function() { setScreen("scores"); }}>🏆 Scorebord</button>
      <button className="btn-ghost" onClick={function() { setScreen("login"); }}>👤 Wissel speler</button>
    </div>
  );
}
