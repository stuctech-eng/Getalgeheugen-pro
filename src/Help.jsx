import { audio } from "./audio.js";

export default function Help({ onBack }) {
  return (
    <div className="screen" style={{paddingBottom:100}}>
      <h2 className="screen-title">❓ Hoe werkt het</h2>

      <div className="help-wrap">

        <div className="help-section">
          <div className="help-title">🎯 Doel</div>
          <div className="help-text">
            Onthoud de cijfers die je ziet en typ ze daarna in de juiste volgorde.
            Hoe meer cijfers je onthoudt, hoe hoger je scoort!
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">⏱️ Kijktijd</div>
          <div className="help-text">
            De cijfers verschijnen kort op het scherm. Hoe hoger je niveau,
            hoe iets meer tijd je krijgt -- want er zijn meer cijfers te onthouden.
            Standaard: 4 cijfers = 3 seconden.
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">⌨️ Invoertijd</div>
          <div className="help-text">
            Na het zien heb je beperkte tijd om in te typen.
            De balk telt af -- groen naar rood.
            Hoe sneller je typt, hoe meer bonuspunten!
            Te laat = automatisch fout.
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">❤️ Levens</div>
          <div className="help-text">
            Je hebt 3 levens. Elke fout (of te laat) kost er één.
            Alle levens op = game over en je score wordt opgeslagen.
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">⭐ Level omhoog</div>
          <div className="help-text">
            3x goed op rij → je gaat naar het volgende niveau met een extra cijfer.
            De kijktijd past zich automatisch aan.
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">🏆 Punten</div>
          <div className="help-rows">
            <div className="help-row"><span>🎯 Basispunten</span><span>Cijfers × 10</span></div>
            <div className="help-row"><span>⚡ Snelheidsbonus</span><span>Minder kijktijd = meer</span></div>
            <div className="help-row"><span>⌨️ Invoerbonus</span><span>Sneller typen = meer</span></div>
            <div className="help-row"><span>🔥 Streakbonus</span><span>3op rij ×1.5 -- 5 op rij ×2.0 -- 7 op rij ×3.0</span></div>
            <div className="help-row"><span>🎴 Één voor één</span><span>×1.5 (moeilijker)</span></div>
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">⚡ Moeilijkheidsgraad</div>
          <div className="help-rows">
            <div className="help-row"><span>🧘 Zen</span><span>+40% tijd -- ×0.6 punten</span></div>
            <div className="help-row"><span>🟢 Makkelijk</span><span>+20% tijd -- ×0.8 punten</span></div>
            <div className="help-row"><span>🟡 Normaal</span><span>Standaard -- ×1.0 punten</span></div>
            <div className="help-row"><span>🔴 Moeilijk</span><span>-20% tijd -- ×1.4 punten</span></div>
            <div className="help-row"><span>⚡ Pro</span><span>-40% tijd -- ×2.0 punten</span></div>
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">💡 Tips</div>
          <div className="help-text">
            • Spreek de cijfers hardop uit terwijl je kijkt{"\n"}
            • Groepeer cijfers -- bijv. 7-3-8 als "738"{"\n"}
            • Gebruik één voor één modus om te oefenen{"\n"}
            • Hogere streak = veel meer punten{"\n"}
            • Typ snel voor invoerbonus
          </div>
        </div>

      </div>

      <div className="bottom-bar">
        <button className="btn-ghost" onClick={onBack}>← Terug</button>
      </div>
    </div>
  );
}
