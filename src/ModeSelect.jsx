import { audio } from "./audio.js";

const MODES = [
  {
    id: "klassiek",
    emoji: "🧠",
    naam: "Klassiek",
    desc: "Onthoud de cijfers"
  },
  {
    id: "kleur",
    emoji: "🎨",
    naam: "Kleur",
    desc: "Onthoud de kleuren"
  },
  {
    id: "flits",
    emoji: "⚡",
    naam: "Flits",
    desc: "Super korte kijktijd",
    soon: true
  },
  {
    id: "omgekeerd",
    emoji: "🔄",
    naam: "Omgekeerd",
    desc: "Invoer in omgekeerde volgorde",
    soon: true
  },
  {
    id: "oplopend",
    emoji: "📈",
    naam: "Oplopend",
    desc: "Van klein naar groot invoeren",
    soon: true
  }
];

export default function ModeSelect({ onSelect, onBack, lastMode }) {
  return (
    <div className="screen" style={{paddingBottom:100}}>
      <h2 className="screen-title">🎮 Kies modus</h2>
      <p style={{fontSize:12, opacity:0.4}}>Elke modus heeft eigen scorebord</p>

      <div style={{width:"100%", maxWidth:400, display:"flex", flexDirection:"column", gap:10}}>
        {MODES.map(function(m) {
          var isLast = m.id === lastMode;
          return (
            <button key={m.id}
              disabled={m.soon}
              onClick={function() {
                if (m.soon) return;
                audio.pop();
                onSelect(m.id);
              }}
              style={{
                width:"100%", padding:"16px 20px",
                borderRadius:18,
                border: isLast
                  ? "2px solid #A855F7"
                  : "1.5px solid rgba(255,255,255,0.1)",
                background: isLast
                  ? "rgba(168,85,247,0.15)"
                  : m.soon
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(255,255,255,0.06)",
                color: m.soon ? "rgba(255,255,255,0.3)" : "#fff",
                cursor: m.soon ? "default" : "pointer",
                display:"flex", alignItems:"center", gap:16,
                transition:"all 0.15s"
              }}>
              <span style={{fontSize:32}}>{m.emoji}</span>
              <div style={{flex:1, textAlign:"left"}}>
                <div style={{fontSize:17, fontWeight:700}}>
                  {m.naam}
                  {isLast && <span style={{fontSize:11, color:"#A855F7", marginLeft:8}}>← laatst gespeeld</span>}
                  {m.soon && <span style={{fontSize:11, opacity:0.4, marginLeft:8}}>binnenkort</span>}
                </div>
                <div style={{fontSize:12, opacity:0.5, marginTop:2}}>{m.desc}</div>
              </div>
              {!m.soon && <span style={{fontSize:20, opacity:0.4}}>›</span>}
            </button>
          );
        })}
      </div>

      <div className="bottom-bar">
        <button className="btn-ghost" onClick={onBack}>← Terug</button>
      </div>
    </div>
  );
}
