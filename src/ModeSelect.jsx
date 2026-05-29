import { audio } from "./audio.js";

const MODES = [
  { id:"klassiek",   emoji:"&#x1F9E0;", naam:"Klassiek",    desc:"Onthoud de cijfers" },
  { id:"kleur",      emoji:"&#x1F3A8;", naam:"Kleur",        desc:"Onthoud de kleuren — &#x00D7;1.0 tot &#x00D7;1.5 punten" },
  { id:"flits",      emoji:"&#x26A1;",  naam:"Flits",        desc:"0.5 seconde kijktijd — &#x00D7;2.5 punten" },
  { id:"omgekeerd",  emoji:"&#x1F504;", naam:"Omgekeerd",    desc:"Invoer in omgekeerde volgorde — &#x00D7;1.8 punten" },
  { id:"oplopend",   emoji:"&#x1F4C8;", naam:"Oplopend",     desc:"Van klein naar groot invoeren — &#x00D7;1.6 punten" },
  { id:"codebreker", emoji:"&#x1F513;", naam:"Code Breker",  desc:"Raad de geheime code — &#x00D7;2.0 punten" },
  { id:"simon",      emoji:"&#x1F3B5;", naam:"Simon",        desc:"Onthoud de kleurvolgorde — tot &#x00D7;2.91 punten" },
];

export default function ModeSelect({ onSelect, onBack, lastMode }) {
  return (
    <div className="screen" style={{paddingBottom:100}}>
      <h2 className="screen-title">&#x1F3AE; Kies modus</h2>
      <p style={{fontSize:12, opacity:0.4}}>Elke modus heeft eigen scorebord</p>

      <div style={{width:"100%", maxWidth:400, display:"flex", flexDirection:"column", gap:10}}>
        {MODES.map(function(m) {
          var isLast = m.id === lastMode;
          return (
            <button key={m.id}
              onClick={function() { audio.pop(); onSelect(m.id); }}
              style={{
                width:"100%", padding:"16px 20px",
                borderRadius:18,
                border: isLast ? "2px solid #A855F7" : "1.5px solid rgba(255,255,255,0.1)",
                background: isLast ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.06)",
                color:"#fff", cursor:"pointer",
                display:"flex", alignItems:"center", gap:16,
                transition:"all 0.15s"
              }}>
              <span style={{fontSize:32}} dangerouslySetInnerHTML={{__html: m.emoji}}/>
              <div style={{flex:1, textAlign:"left"}}>
                <div style={{fontSize:17, fontWeight:700}}>
                  {m.naam}
                  {isLast && <span style={{fontSize:11, color:"#A855F7", marginLeft:8}}>&#x2190; laatst gespeeld</span>}
                </div>
                <div style={{fontSize:12, opacity:0.5, marginTop:2}} dangerouslySetInnerHTML={{__html: m.desc}}/>
              </div>
              <span style={{fontSize:20, opacity:0.4}}>&#x203A;</span>
            </button>
          );
        })}
      </div>

      <div className="bottom-bar">
        <button className="btn-ghost" onClick={onBack}>&#x2190; Terug</button>
      </div>
    </div>
  );
}
