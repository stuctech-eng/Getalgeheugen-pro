import { useState, useEffect } from "react";
import { audio } from "./audio.js";

function Counter({ target, duration }) {
  const [val, setVal] = useState(0);
  useEffect(function() {
    if (!target || target === 0) { setVal(0); return; }
    var start = Date.now();
    var tmr = setInterval(function() {
      var elapsed = Date.now() - start;
      var pct = Math.min(1, elapsed / duration);
      var eased = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(eased * target));
      if (pct >= 1) clearInterval(tmr);
    }, 16);
    return function() { clearInterval(tmr); };
  }, [target, duration]);
  return <span>{val}</span>;
}

export default function Result({ result, player, onPlay, onMenu, onScores }) {
  const [step, setStep] = useState(0);

  var r        = result || {};
  var base     = r.basePoints  || 0;
  var speed    = r.speedBonus  || 0;
  var input    = r.inputBonus  || 0;
  var streak   = r.streakBonus || 0;
  var total    = r.score       || 0;
  var maxD     = r.maxDigits   || 0;
  var isRecord = r.isNewRecord || false;
  var showSpeed = speed > 0;

  useEffect(function() {
    var delays = [400, 1300, 2100, 2900, 3700, 4500, 5200];
    var timers = [];

    timers.push(setTimeout(function() { setStep(1); audio.pop(); }, delays[0]));
    timers.push(setTimeout(function() {
      if (showSpeed) { setStep(2); audio.pop(); }
      else { setStep(3); audio.pop(); }
    }, delays[1]));
    timers.push(setTimeout(function() {
      if (showSpeed) { setStep(3); audio.pop(); }
      else { setStep(4); audio.pop(); }
    }, delays[2]));
    timers.push(setTimeout(function() {
      if (showSpeed) { setStep(4); audio.pop(); }
      else { setStep(5); audio.boing(); }
    }, delays[3]));
    timers.push(setTimeout(function() {
      if (showSpeed) { setStep(5); audio.boing(); }
      else if (isRecord) { setStep(6); audio.levelUp(); }
    }, delays[4]));
    timers.push(setTimeout(function() {
      if (showSpeed && isRecord) { setStep(6); audio.levelUp(); }
    }, delays[5]));

    return function() { timers.forEach(function(t) { clearTimeout(t); }); };
  }, []);

  var emoji = maxD >= 8 ? "🏆" : maxD >= 6 ? "🥈" : maxD >= 4 ? "🎯" : "💪";
  var name  = player ? player.name : "";

  return (
    <div className="screen center" style={{gap:12, paddingBottom:200}}>

      <div className="result-emoji">{emoji}</div>

      <h2 className="result-title">
        Goed gedaan,<br/><span className="accent">{name}!</span>
      </h2>

      <div className="result-max">
        Max niveau: <span className="accent">{maxD} cijfers</span>
      </div>

      <div className="score-breakdown">

        {step >= 1 && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">🎯 Basispunten</span>
            <span className="breakdown-val">
              +<Counter target={base} duration={800}/>
            </span>
          </div>
        )}

        {step >= 2 && showSpeed && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">⚡ Snelheidsbonus</span>
            <span className="breakdown-val" style={{color:"#22D3EE"}}>
              +<Counter target={speed} duration={800}/>
            </span>
          </div>
        )}

        {step >= (showSpeed ? 3 : 2) && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">⌨️ Invoerbonus</span>
            <span className="breakdown-val" style={{color:"#4ADE80"}}>
              +<Counter target={input} duration={800}/>
            </span>
          </div>
        )}

        {step >= (showSpeed ? 4 : 3) && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">🔥 Streakbonus</span>
            <span className="breakdown-val" style={{color:"#FF8C42"}}>
              +<Counter target={streak} duration={800}/>
            </span>
          </div>
        )}

        {step >= (showSpeed ? 5 : 4) && (
          <div className="breakdown-total" style={{animation:"streakPop 0.5s ease"}}>
            <span>🏆 TOTAAL</span>
            <span className="total-val">
              <Counter target={total} duration={1200}/> pts
            </span>
          </div>
        )}

        {step >= 6 && isRecord && (
          <div className="new-record">
            🎉 NIEUW PERSOONLIJK RECORD!
          </div>
        )}

      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={onPlay}>🔁 Opnieuw</button>
        <button className="btn-ghost"   onClick={onScores}>🏆 Scorebord</button>
        <button className="btn-ghost"   onClick={onMenu}>🏠 Menu</button>
      </div>
    </div>
  );
}
