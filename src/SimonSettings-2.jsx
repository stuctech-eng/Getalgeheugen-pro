import { useState } from "react";

export default function SimonSettings({ onStart, onBack }) {
  const [snelheid,  setSnelheid]  = useState(false);
  const [tijdsdruk, setTijdsdruk] = useState(false);
  const [shuffle,   setShuffle]   = useState(false);
  const [moeilijk,  setMoeilijk]  = useState(1);

  var moeilijkFactor = moeilijk === 3 ? 1.5 : moeilijk === 2 ? 1.2 : 1.0;
  var factor = 1.0
    * moeilijkFactor
    * (snelheid  ? 1.3 : 1.0)
    * (tijdsdruk ? 1.4 : 1.0)
    * (shuffle   ? 1.6 : 1.0);

  function Toggle({ value, onChange }) {
    return (
      <button onClick={function() { onChange(!value); }} style={{
        width:48, height:26, borderRadius:13,
        background: value ? "#A855F7" : "rgba(255,255,255,0.15)",
        border:"none", cursor:"pointer", position:"relative",
        transition:"background 0.2s", flexShrink:0
      }}>
        <div style={{
          position:"absolute", top:3,
          left: value ? 23 : 3,
          width:20, height:20, borderRadius:"50%",
          background:"#fff", transition:"left 0.2s"
        }}/>
      </button>
    );
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100dvh", overflow:"hidden",
      paddingTop:"env(safe-area-inset-top)",
      paddingBottom:"env(safe-area-inset-bottom)",
      background:"#0D1136", color:"#fff",
      fontFamily:"Arial, sans-serif"
    }}>

      {/* Titel — compact */}
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        paddingTop:16, paddingBottom:8, flexShrink:0
      }}>
        <div style={{fontSize:36}}>🎵</div>
        <h2 style={{fontSize:22, fontWeight:900, margin:"4px 0 2px"}}>Simon</h2>
        <p style={{fontSize:12, opacity:0.4, margin:0}}>Onthoud de volgorde op kleur</p>
      </div>

      {/* Instellingen — flex-groeien */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        gap:8, padding:"0 16px", overflow:"hidden"
      }}>

        {/* Moeilijkheid */}
        <div className="setting-row" style={{padding:"10px 14px"}}>
          <div style={{fontSize:12, fontWeight:700, opacity:0.6, marginBottom:8}}>🎯 Moeilijkheid</div>
          <div style={{display:"flex", gap:8}}>
            {[1,2,3].map(function(n) {
              var labels = ["Makkelijk","Normaal","Zwaar"];
              var descs  = ["Start 1 · +1","Start 2 · +1","Start 3 · +2"];
              var active = moeilijk === n;
              return (
                <button key={n} onClick={function(){ setMoeilijk(n); }} style={{
                  flex:1, padding:"8px 4px", borderRadius:12,
                  border: active ? "2px solid #A855F7" : "1.5px solid rgba(255,255,255,0.1)",
                  background: active ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                  color:"#fff", cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2
                }}>
                  <span style={{fontSize:16, fontWeight:900, color: active ? "#A855F7" : "#fff"}}>{n}</span>
                  <span style={{fontSize:11, fontWeight:700}}>{labels[n-1]}</span>
                  <span style={{fontSize:10, opacity:0.4}}>{descs[n-1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Snelheid */}
        <div className="setting-row" style={{padding:"10px 14px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:14, fontWeight:700}}>⚡ Snelheid</div>
              <div style={{fontSize:11, opacity:0.4, marginTop:2}}>Reeks versnelt naarmate langer — ×1.3</div>
            </div>
            <Toggle value={snelheid} onChange={setSnelheid}/>
          </div>
        </div>

        {/* Tijdsdruk */}
        <div className="setting-row" style={{padding:"10px 14px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:14, fontWeight:700}}>⏱ Tijdsdruk</div>
              <div style={{fontSize:11, opacity:0.4, marginTop:2}}>Timer per invoer — ×1.4</div>
            </div>
            <Toggle value={tijdsdruk} onChange={setTijdsdruk}/>
          </div>
        </div>

        {/* Shuffle */}
        <div className="setting-row" style={{padding:"10px 14px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:14, fontWeight:700}}>🔀 Shuffle</div>
              <div style={{fontSize:11, opacity:0.4, marginTop:2}}>Knoppen wisselen van positie — ×1.6</div>
            </div>
            <Toggle value={shuffle} onChange={setShuffle}/>
          </div>
        </div>

        {/* Factor */}
        <div style={{
          padding:"10px 14px", borderRadius:16,
          background: factor > 2 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)",
          border: factor > 2 ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
          textAlign:"center", transition:"all 0.3s"
        }}>
          <div style={{fontSize:20, fontWeight:900, color: factor > 2 ? "#A855F7" : "#fff"}}>
            ×{factor.toFixed(2)} punten
          </div>
          <div style={{fontSize:11, opacity:0.4, marginTop:2}}>
            {factor >= 4.0 ? "🔥 Extreem!" :
             factor >= 2.5 ? "💀 Heel moeilijk" :
             factor >= 1.8 ? "😤 Uitdagend" :
             factor > 1.0  ? "😊 Iets moeilijker" :
             "😌 Standaard"}
          </div>
        </div>

      </div>

      {/* Knoppen onderaan */}
      <div style={{
        display:"flex", flexDirection:"column", gap:8,
        padding:"10px 16px 12px", flexShrink:0
      }}>
        <button className="btn-primary" onClick={function() {
          onStart({ snelheid, tijdsdruk, shuffle, moeilijkheid: moeilijk, factor });
        }}>🎵 Spelen</button>
        <button className="btn-ghost" onClick={onBack}>← Terug</button>
      </div>

    </div>
  );
}
