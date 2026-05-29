import { useState } from "react";

export default function SimonSettings({ onStart, onBack }) {
  const [snelheid,  setSnelheid]  = useState(false);
  const [tijdsdruk, setTijdsdruk] = useState(false);
  const [shuffle,   setShuffle]   = useState(false);

  var factor = 1.0
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
      <div style={{fontSize:48}}>&#x1F3B5;</div>
      <h2 className="screen-title">Simon</h2>
      <p style={{fontSize:13, opacity:0.5, textAlign:"center", marginTop:-8}}>
        Onthoud de volgorde op kleur
      </p>

      <div style={{width:"100%", maxWidth:360, display:"flex", flexDirection:"column", gap:10}}>

        {/* Snelheid */}
        <div className="setting-row">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div className="setting-label">&#x26A1; Snelheid</div>
              <div style={{fontSize:12, opacity:0.4}}>Reeks versnelt naarmate langer — &#x00D7;1.3</div>
            </div>
            <Toggle value={snelheid} onChange={setSnelheid}/>
          </div>
        </div>

        {/* Tijdsdruk */}
        <div className="setting-row">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div className="setting-label">&#x23F1; Tijdsdruk</div>
              <div style={{fontSize:12, opacity:0.4}}>Timer per invoer — &#x00D7;1.4</div>
            </div>
            <Toggle value={tijdsdruk} onChange={setTijdsdruk}/>
          </div>
        </div>

        {/* Shuffle */}
        <div className="setting-row">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div className="setting-label">&#x1F500; Shuffle</div>
              <div style={{fontSize:12, opacity:0.4}}>Knoppen wisselen van positie — &#x00D7;1.6</div>
            </div>
            <Toggle value={shuffle} onChange={setShuffle}/>
          </div>
        </div>

        {/* Factor display */}
        <div style={{
          padding:"14px 18px", borderRadius:16,
          background: factor > 2 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)",
          border: factor > 2 ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
          textAlign:"center",
          transition:"all 0.3s"
        }}>
          <div style={{fontSize:22, fontWeight:900, color: factor > 2 ? "#A855F7" : "#fff"}}>
            &#x00D7;{factor.toFixed(2)} punten
          </div>
          <div style={{fontSize:12, opacity:0.4, marginTop:4}}>
            {factor >= 2.91 ? "&#x1F525; Maximaal!" :
             factor >= 2.0  ? "Heel moeilijk" :
             factor >= 1.5  ? "Uitdagend" :
             factor > 1.0   ? "Iets moeilijker" :
             "Standaard"}
          </div>
        </div>

      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={function() {
          onStart({ snelheid, tijdsdruk, shuffle, factor });
        }}>&#x1F3B5; Spelen</button>
        <button className="btn-ghost" onClick={onBack}>&#x2190; Terug</button>
      </div>
    </div>
  );
}
