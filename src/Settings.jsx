import { useState } from "react";

export default function Settings({ settings, onSave, onBack }) {
  const [s, setS] = useState(Object.assign({}, settings));

  var rows = [
    {label:"Weergave tijd",          key:"showTime",    min:1000, max:5000, step:500,  fmt:function(v){return (v/1000).toFixed(1)+"s";}},
    {label:"Start cijfers",          key:"startDigits", min:2,    max:5,    step:1,    fmt:function(v){return v;}},
    {label:"Goed voor level-up",     key:"winsUp",      min:2,    max:6,    step:1,    fmt:function(v){return v;}},
    {label:"Fouten voor level-down", key:"failsDown",   min:1,    max:5,    step:1,    fmt:function(v){return v;}},
  ];

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack} style={{alignSelf:"flex-start"}}>← Terug</button>
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
        </div>

        {rows.map(function(r) {
          return (
            <div key={r.key} className="setting-row">
              <div className="setting-label">
                {r.label} <span className="setting-hint">{r.fmt(s[r.key])}</span>
              </div>
              <input type="range" min={r.min} max={r.max} step={r.step} value={s[r.key]}
                style={{width:"100%", accentColor:"#A855F7", cursor:"pointer"}}
                onChange={function(e) {
                  var key = r.key;
                  var nc = Object.assign({}, s);
                  nc[key] = +e.target.value;
                  setS(nc);
                }} />
            </div>
          );
        })}
      </div>

      <button className="btn-primary" onClick={function() { onSave(s); }}>✅ Opslaan</button>
    </div>
  );
}
