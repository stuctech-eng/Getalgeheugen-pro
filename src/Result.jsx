import { useState, useEffect } from "react";
import { audio } from "./audio.js";

function Counter({ target, duration }) {
  const [val, setVal] = useState(0);
  useEffect(function() {
    if (target === 0) { setVal(0); return; }
    var start = Date.now();
    var tmr = setInterval(function() {
      var elapsed = Date.now() - start;
      var pct = Math.min(1, elapsed / duration);
      var eased = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(eased * target));
      if (pct >= 1) clearInterval(tmr);
    }, 16);
    return function() { clearInterval(tmr); };
  }, [target]);
  return <span>{val}</span>;
}

export default function Result({ result, player, onPlay, onMenu, onScores }) {
  const [step, setStep] = useState(0);

  var r       = result || {};
  var base    = r.basePoints  || 0;
  var speed   = r.speedBonus  || 0;
  var input   = r.inputBonus  || 0;
  var streak  = r.streakBonus || 0;
  var total   = r.score       || 0;
  var maxD    = r.maxDigits   || 0;
  var isRecord= r.isNewRecord || false;

  // Count how many rows we show (skip speed if 0)
  var showSpeed = speed > 0;
  var totalSteps = showSpeed ? 6 : 5;

  useEffect(function() {
    var delays = [300, 1200, 2000, 2800, showSpeed ? 3600 : 3200, showSpeed ? 4400 : 4000, showSpeed ? 5200 : 4800];
    var timers = [];
    for (var i = 0; i <= totalSteps; i++) {
      (function(step, delay) {
        timers.push(setTimeout(function() {
          setStep(step);
          if (step >= 1 && step <= 4) audio.pop();
          if (step === (showSpeed ? 5 : 4)) audio.boing();
          if (step === (showSpeed ? 6 : 5) && isRecord) audio.levelUp();
        }, delay));
      })(i, delays[i]);
    }
    return function() { timers.forEach(function(t) { clearTimeout(t); }); };
  }, []);

  var emoji = maxD >= 8 ? "🏆" : maxD >= 6 ? "🥈" : maxD >= 4 ? "🎯" : "💪";
  var finalStep = showSpeed ? 6 : 5;

  return (
    <div className="screen center" style={{gap:12, paddingBottom:180}}>

      <div className="result-emoji" style={{animation:"streakPop 0.5s ease"}}>
        {emoji}
      </div>

      <h2 className="result-title">
        Goed gedaan,<br/><span className="accent">{player}!</span>
      </h2>

      <div className="result-max">
        Max niveau: <span className="accent">{maxD} cijfers</span>
      </div>

      <div className="score-breakdown">

        {step >= 1 && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">🎯 Basispunten</span>
            <span className="breakdown-val">+<Counter target={base} duration={800}/></span>
          </div>
        )}

        {step >= 2 && showSpeed && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">⚡ Snelheidsbonus</span>
            <span className="breakdown-val" style={{color:"#22D3EE"}}>+<Counter target={speed} duration={800}/></span>
          </div>
        )}

        {step >= (showSpeed ? 3 : 2) && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">⌨️ Invoerbonus</span>
            <span className="breakdown-val" style={{color:"#4ADE80"}}>+<Counter target={input} duration={800}/></span>
          </div>
        )}

        {step >= (showSpeed ? 4 : 3) && (
          <div className="breakdown-row" style={{animation:"slideIn 0.4s ease"}}>
            <span className="breakdown-label">🔥 Streakbonus</span>
            <span className="breakdown-val" style={{color:"#FF8C42"}}>+<Counter target={streak} duration={800}/></span>
          </div>
        )}

        {step >= (showSpeed ? 5 : 4) && (
          <div className="breakdown-total" style={{animation:"streakPop 0.5s ease"}}>
            <span>🏆 TOTAAL</span>
            <span className="total-val"><Counter target={total} duration={1200}/> pts</span>
          </div>
        )}

        {step >= finalStep && isRecord && (
          <div className="new-record" style={{animation:"recordFlash 1s ease infinite"}}>
            🎉 NIEUW PERSOONLIJK RECORD!
          </div>
        )}

      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={onPlay}>🔁 Opnieuw</button>
        <button className="btn-ghost" onClick={onScores}>🏆 Scorebord</button>
        <button className="btn-ghost" onClick={onMenu}>🏠 Menu</button>
      </div>
    </div>
  );
}
