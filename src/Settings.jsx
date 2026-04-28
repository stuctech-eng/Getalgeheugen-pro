import { useState } from "react";

const DIFFICULTY_LEVELS = [
  { label: "🧘 Zen",       mod: 0.4,  desc: "+40% tijd -- ×0.6 punten" },
  { label: "🟢 Makkelijk", mod: 0.2,  desc: "+20% tijd -- ×0.8 punten" },
  { label: "🟡 Normaal",   mod: 0,    desc: "Standaard -- ×1.0 punten" },
  { label: "🔴 Moeilijk",  mod: -0.2, desc: "-20% tijd -- ×1.4 punten" },
  { label: "⚡ Pro",       mod: -0.4, desc: "-40% tijd -- ×2.0 punten" },
];

export default function Settings({ settings, onSave, onBack }) {
  const [s, setS] = useState(Object.assign({}, settings));

  var currentDiff = DIFFICULTY_LEVELS.find(function(d) {
    return d.mod === s.difficultyMod;
  }) || DIFFICULTY_LEVELS[2];

  return (
    <div className="screen" style={{paddingTop:60, paddingBottom:140}}>
      <h2 className="screen-title">⚙️ Instellingen</h2>

      <div className="settings-box">

        <div className="setting-row">
          <div className="setting-label">Weergave modus</div>
          <div className="mode-btns">
            <button
              className={"mode-btn" + (s.showMode === "together" ? " mode-active" : "")}
              onClick={function() { setS(Object.assign({}, s, {showMode:"together"})); }}>
              🎴 Tegelijk
            </button>
            <button
              className={"mode-btn" + (s.showMode === "sequential" ? " mode-active" : "")}
              onClick={function() { setS(Object.assign({}, s, {showMode:"sequential"})); }}>
              1️⃣ Één voor één
            </button>
          </div>
          <div className="setting-hint-small">
            {s.showMode === "sequential" ? "Moeilijker -- ×1.5 punten bonus" : "Standaard modus"}
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label">Moeilijkheidsgraad</div>
          <div className="diff-btns">
            {DIFFICULTY_LEVELS.map(function(d) {
              return (
                <button key={d.mod}
                  className={"diff-btn" + (s.difficultyMod === d.mod ? " diff-active" : "")}
                  onClick={function() { setS(Object.assign({}, s, {difficultyMod: d.mod})); }}>
                  {d.label}
                </button>
              );
            })}
          </div>
          <div className="setting-hint-small">{currentDiff.desc}</div>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            Goed voor level-up <span className="setting-hint">{s.winsUp}</span>
          </div>
          <input type="range" min={2} max={6} step={1} value={s.winsUp}
            style={{width:"100%", accentColor:"#A855F7", cursor:"pointer"}}
            onChange={function(e) { setS(Object.assign({}, s, {winsUp: +e.target.value})); }} />
        </div>

      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={function() { onSave(s); }}>✅ Opslaan</button>
        <button className="btn-ghost" onClick={onBack}>← Terug</button>
      </div>
    </div>
  );
}
