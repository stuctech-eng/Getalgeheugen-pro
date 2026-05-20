import { useState } from "react";

export default function KleurSettings({ onStart, onBack }) {
  const [cijfers, setCijfers] = useState(true);

  var factor   = cijfers ? 1.0 : 1.5;
  var moeilijk = cijfers ? "🟡 Normaal — ×1.0 punten" : "🔴 Moeilijk — ×1.5 punten";

  return (
    <div className="screen center" style={{gap:16}}>
      <h2 className="screen-title">🎨 Kleur modus</h2>
      <p style={{fontSize:13, opacity:0.5, textAlign:"center"}}>
        Onthoud de kleur van elk cijfer
      </p>

      <div style={{width:"100%", maxWidth:360, display:"flex", flexDirection:"column", gap:10}}>

        <div className="setting-row">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div className="setting-label">🔢 Cijfers op knoppen</div>
              <div style={{fontSize:12, opacity:0.4}}>Getallen zichtbaar op invoerknoppen</div>
            </div>
            <button onClick={function() { setCijfers(!cijfers); }} style={{
              width:52, height:28, borderRadius:14,
              background: cijfers ? "#A855F7" : "rgba(255,255,255,0.15)",
              border:"none", cursor:"pointer", position:"relative",
              transition:"background 0.2s"
            }}>
              <div style={{
                position:"absolute", top:3,
                left: cijfers ? 26 : 4,
                width:22, height:22, borderRadius:"50%",
                background:"#fff", transition:"left 0.2s"
              }}/>
            </button>
          </div>
        </div>

        <div style={{
          padding:"14px 18px", borderRadius:16,
          background:"rgba(168,85,247,0.1)",
          border:"1px solid rgba(168,85,247,0.3)",
          textAlign:"center"
        }}>
          <div style={{fontSize:16, fontWeight:700}}>{moeilijk}</div>
        </div>

      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={function() {
          onStart({ cijfers, factor });
        }}>🎨 Starten</button>
        <button className="btn-ghost" onClick={onBack}>← Terug</button>
      </div>
    </div>
  );
}
