import { useState } from "react";

export default function SimonSettings({ onStart, onBack }) {
  const [snelheid,    setSnelheid]    = useState(false);
  const [tijdsdruk,   setTijdsdruk]   = useState(false);
  const [shuffle,     setShuffle]     = useState(false);
  const [moeilijk,    setMoeilijk]    = useState(1);

  var moeilijkFactor = moeilijk === 3 ? 1.5 : moeilijk === 2 ? 1.2 : 1.0;
  var factor = 1.0
    * moeilijkFactor
    * (snelheid  ? 1.3 : 1.0)
    * (tijdsdruk ? 1.4 : 1.0)
    * (shuffle   ? 1.6 : 1.0);

  function Toggle({ value, onChange }) {
    return (
      <button onClick={function() { onChange(!value); }} style={{
        width:52, height:28, borderRadius:14,
        background: value ? "#A855F7" : "rgba(255,255,255,0.15)",
        border:"none", cursor:"pointer", position:"relative",
        transition:"background 0.2s", flexShrink:0
      }}>
        <div style={{
          position:"absolute", top:3,
          left: value ? 26 : 4,
          width:22, height:22, borderRadius:"50%",
          background:"#fff", transition:"left 0.2s"
        }}/>
      </button>
    );
  }

  return (
    <div className="screen center" style={{gap:16}}>
      <div style={{fontSize:48}}>🎵</div>
      <h2 className="screen-title">Simon</h2>
      <p style={{fontSize:13, opacity:0.5, textAlign:"center", marginTop:-8}}>
        Onthoud de volgorde op kleur
      </p>

      <div style={{width:"100%", maxWidth:360, display:"flex", flexDirection:"column", gap:10}}>

        {/* Moeilijkheid */}
        <div className="setting-row">
          <div className="setting-label" style={{marginBottom:10}}>🎯 Moeilijkheid</div>
          <div style={{display:"flex", gap:8}}>
            {[1,2,3].map(function(n) {
              var labels = ["Makkelijk","Normaal","Zwaar"];
              var descs  = ["Start bij 1 · +1","Start bij 2 · +1","Start bij 3 · +2"];
              var active = moeilijk === n;
              return (
                <button key={n} onClick={function(){ setMoeilijk(n); }} style={{
                  flex:1, padding:"10px 6px", borderRadius:14,
                  border: active ? "2px solid #A855F7" : "1.5px solid rgba(255,255,255,0.1)",
                  background: active ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                  color:"#fff", cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:4
                }}>
                  <span style={{fontSize:18, fontWeight:900, color: active ? "#A855F7" : "#fff"}}>{n}</span>
                  <span style={{fontSize:11, fontWeight:700}}>{labels[n-1]}</span>
                  <span style={{fontSize:10, opacity:0.45}}>{descs[n-1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Snelheid */}
        <div className="setting-row">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div className="setting-label">⚡ Snelheid</div>
              <div style={{fontSize:12, opacity:0.4}}>Reeks versnelt naarmate langer — ×1.3</div>
            </div>
            <Toggle value={snelheid} onChange={setSnelheid}/>
          </div>
        </div>

        {/* Tijdsdruk */}
        <div className="setting-row">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div className="setting-label">⏱ Tijdsdruk</div>
              <div style={{fontSize:12, opacity:0.4}}>Timer per invoer — ×1.4</div>
            </div>
            <Toggle value={tijdsdruk} onChange={setTijdsdruk}/>
          </div>
        </div>

        {/* Shuffle */}
        <div className="setting-row">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div className="setting-label">🔀 Shuffle</div>
              <div style={{fontSize:12, opacity:0.4}}>Knoppen wisselen van positie — ×1.6</div>
            </div>
            <Toggle value={shuffle} onChange={setShuffle}/>
          </div>
        </div>

        {/* Factor display */}
        <div style={{
          padding:"14px 18px", borderRadius:16,
          background: factor > 2 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)",
          border: factor > 2 ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
          textAlign:"center", transition:"all 0.3s"
        }}>
          <div style={{fontSize:22, fontWeight:900, color: factor > 2 ? "#A855F7" : "#fff"}}>
            ×{factor.toFixed(2)} punten
          </div>
          <div style={{fontSize:12, opacity:0.4, marginTop:4}}>
            {factor >= 4.0  ? "🔥 Extreem!" :
             factor >= 2.5  ? "💀 Heel moeilijk" :
             factor >= 1.8  ? "😤 Uitdagend" :
             factor > 1.0   ? "😊 Iets moeilijker" :
             "😌 Standaard"}
          </div>
        </div>

      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={function() {
          onStart({ snelheid, tijdsdruk, shuffle, moeilijkheid: moeilijk, factor });
        }}>🎵 Spelen</button>
        <button className="btn-ghost" onClick={onBack}>← Terug</button>
      </div>
    </div>
  );
}
