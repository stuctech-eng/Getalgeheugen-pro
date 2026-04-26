import { useState, useEffect, useRef } from "react";
import { audio, vibrate } from "./audio.js";
import { saveScore } from "./firebase.js";

const COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];
const TIPS = ["Geweldig! 🎉","Briljant! 🧠","Perfect! ⭐","Top! 🚀","Wauw! 🔥","Super! 💪","Ongelooflijk! 🤯","Fenomenaal! 🌟"];
const CD_COLORS = ["#EF4444","#F97316","#22C55E"];
const TOTAL_LIVES = 3;

function rndDigits(n) {
  var result = "";
  for (var i = 0; i < n; i++) result += Math.floor(Math.random() * 10);
  return result;
}

// Speed scales with level -- faster as you go higher
function getShowTime(digits, baseTime) {
  var reduction = (digits - 2) * 200;
  return Math.max(1000, baseTime - reduction);
}

export default function Game({ player, onMenu, onGameOver, settings }) {
  var baseShowTime = (settings && settings.showTime)    || 3000;
  var winsUp       = (settings && settings.winsUp)      || 3;
  var startD       = (settings && settings.startDigits) || 2;
  var showMode     = (settings && settings.showMode)    || "together";

  const [phase, setPhase]                 = useState("countdown");
  const [cdCount, setCdCount]             = useState(3);
  const [cdAnim, setCdAnim]               = useState(true);
  const [seq, setSeq]                     = useState("");
  const [activeIdx, setActiveIdx]         = useState(-1);
  const [inp, setInp]                     = useState("");
  const [fb, setFb]                       = useState(null);
  const [fbMsg, setFbMsg]                 = useState("");
  const [shake, setShake]                 = useState(false);
  const [wins, setWins]                   = useState(0);
  const [lives, setLives]                 = useState(TOTAL_LIVES);
  const [streak, setStreak]               = useState(0);
  const [round, setRound]                 = useState(1);
  const [displayDigits, setDisplayDigits] = useState(startD);
  const [showSpeed, setShowSpeed]         = useState(baseShowTime);
  const [scoreTotal, setScoreTotal]       = useState(0);
  const [showStreak, setShowStreak]       = useState(false);

  const digitsRef    = useRef(startD);
  const seqRef       = useRef("");
  const winsRef      = useRef(0);
  const livesRef     = useRef(TOTAL_LIVES);
  const streakRef    = useRef(0);
  const maxDRef      = useRef(startD);
  const scoreTotalRef= useRef(0);
  const tmr          = useRef(null);
  const cdTmr        = useRef(null);

  useEffect(function() {
    startRound(startD);
    return function() {
      clearTimeout(tmr.current);
      clearInterval(cdTmr.current);
    };
  }, []);

  function startRound(nd) {
    clearTimeout(tmr.current);
    clearInterval(cdTmr.current);
    var digits = (nd !== undefined) ? nd : digitsRef.current;
    digitsRef.current = digits;
    setDisplayDigits(digits);
    var spd = getShowTime(digits, baseShowTime);
    setShowSpeed(spd);
    setPhase("countdown");
    setCdCount(3);
    setCdAnim(true);
    setInp("");
    setFb(null);
    setActiveIdx(-1);
    setShowStreak(false);
    audio.tick();
    var count = 3;
    cdTmr.current = setInterval(function() {
      count = count - 1;
      setCdAnim(false);
      setTimeout(function() { setCdAnim(true); }, 60);
      if (count > 0) {
        setCdCount(count);
        if (count % 2 === 0) audio.tick(); else audio.tock();
      } else {
        clearInterval(cdTmr.current);
        var s = rndDigits(digits);
        seqRef.current = s;
        setSeq(s);
        setInp("");
        if (showMode === "sequential") {
          revealSequential(s);
        } else {
          audio.whoosh();
          setPhase("show");
          tmr.current = setTimeout(function() { setPhase("input"); }, spd);
        }
      }
    }, 800);
  }

  async function revealSequential(s) {
    setPhase("show");
    var spd = getShowTime(digitsRef.current, baseShowTime);
    var perCard = Math.max(400, Math.floor(spd / s.length));
    for (var i = 0; i < s.length; i++) {
      setActiveIdx(i);
      audio.pop();
      vibrate();
      await new Promise(function(r) { setTimeout(r, perCard); });
      setActiveIdx(-1);
      await new Promise(function(r) { setTimeout(r, 150); });
    }
    setPhase("input");
  }

  function tap(k) {
    if (phase !== "input") return;
    if (k === "del") {
      audio.plop();
      setInp(function(prev) { return prev.slice(0, -1); });
      return;
    }
    if (inp.length >= digitsRef.current) return;
    audio.pop();
    vibrate();
    var next = inp + k;
    setInp(next);
    if (next.length === digitsRef.current) {
      handleResult(next === seqRef.current);
    }
  }

  function handleResult(correct) {
    setPhase("fb");
    if (correct) {
      // Score = digits × streak bonus
      var newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      var points = digitsRef.current * Math.max(1, newStreak);
      scoreTotalRef.current = scoreTotalRef.current + points;
      setScoreTotal(scoreTotalRef.current);
      maxDRef.current = Math.max(maxDRef.current, digitsRef.current);

      // Streak fire every 3 correct
      if (newStreak > 0 && newStreak % 3 === 0) {
        setShowStreak(true);
      }

      var tipIdx = Math.floor(Math.random() * TIPS.length);
      setFb("ok");
      setFbMsg(TIPS[tipIdx] + (newStreak >= 3 ? " 🔥×" + newStreak : ""));
      setTimeout(function() { audio.boing(); }, 150);
      vibrate("ok");

      var nw = winsRef.current + 1;
      winsRef.current = nw;
      setWins(nw);

      setTimeout(function() {
        setRound(function(r) { return r + 1; });
        if (nw >= winsUp) {
          audio.levelUp();
          winsRef.current = 0;
          setWins(0);
          startRound(digitsRef.current + 1);
        } else {
          startRound();
        }
      }, 2000);

    } else {
      // Wrong -- lose a life
      streakRef.current = 0;
      setStreak(0);
      setFb("bad");
      setFbMsg("Helaas, het was " + seqRef.current + " 😅");
      audio.buzz();
      vibrate("bad");
      setShake(true);
      setTimeout(function() { setShake(false); }, 500);

      var newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);
      winsRef.current = 0;
      setWins(0);

      if (newLives <= 0) {
        // Game over -- save score
        saveScore(player, maxDRef.current, scoreTotalRef.current);
        setTimeout(function() {
          onGameOver({
            maxDigits: maxDRef.current,
            score: scoreTotalRef.current
          });
        }, 1800);
      } else {
        setTimeout(function() {
          setRound(function(r) { return r + 1; });
          startRound();
        }, 1800);
      }
    }
  }

  var n        = displayDigits || 1;
  var availW   = Math.min(window.innerWidth, 480) - 40;
  var gap      = 10;
  var cardW    = Math.min(88, Math.floor((availW - gap * (n - 1)) / n));
  var cardH    = Math.round(cardW * 1.18);
  var cardFont = Math.round(cardW * 0.58);
  var slotW    = Math.min(66, Math.floor((availW - gap * (n - 1)) / n));
  var slotH    = Math.round(slotW * 1.22);
  var slotFont = Math.round(slotW * 0.56);

  // Speed indicator color
  var speedPct = Math.round((1 - (showSpeed - 1000) / (baseShowTime - 1000)) * 100);
  var speedColor = showSpeed > 2000 ? "#22C55E" : showSpeed > 1500 ? "#EAB308" : "#EF4444";

  return (
    <div className="screen game-screen">

      {/* Header -- safe area aware */}
      <div className="game-header">
        <button className="back-btn" onClick={function() { audio.plop(); onMenu(); }}>←</button>
        <div className="player-name">👤 {player}</div>
        <div className="round-num">Ronde {round}</div>
      </div>

      {/* Level + speed */}
      <div className="level-row">
        <span className="level-label">Niveau</span>
        <div className="digit-bubble">{displayDigits}</div>
        <span className="level-label">cijfers</span>
        <div className="speed-badge" style={{color: speedColor}}>
          ⚡ {(showSpeed/1000).toFixed(1)}s
        </div>
      </div>

      {/* Progress */}
      <div className="progress-wrap">
        <div className="progress-bar" style={{width: (wins / winsUp * 100) + "%"}} />
      </div>

      {/* Streak + score */}
      <div className="streak-row">
        {Array.from({length: winsUp}, function(_, i) {
          return <span key={i}>{i < wins ? "⭐" : "☆"}</span>;
        })}
        <span className="streak-hint">{wins}/{winsUp} voor level</span>
        <span className="score-badge">🏆 {scoreTotal}</span>
        {streak >= 3 && <span className="fire-badge">🔥{streak}</span>}
      </div>

      {/* Main display */}
      <div className="display-area">

        {phase === "countdown" && (
          <div className="countdown">
            <div className="cd-num" style={{
              color: CD_COLORS[cdCount - 1],
              textShadow: "0 0 80px " + CD_COLORS[cdCount - 1] + ", 0 0 160px " + CD_COLORS[cdCount - 1] + "44",
              animation: cdAnim ? "cdPop 0.18s ease" : "none"
            }}>
              {cdCount}
            </div>
            <div className="cd-label">Klaarmaken...</div>
          </div>
        )}

        {phase === "show" && showMode === "together" && (
          <div className="show-cards">
            {seq.split("").map(function(d, i) {
              return (
                <div key={i} className="show-card" style={{
                  width: cardW, height: cardH, fontSize: cardFont,
                  borderRadius: Math.round(cardW * 0.2),
                  background: "linear-gradient(135deg," + COLORS[i % COLORS.length][0] + "," + COLORS[i % COLORS.length][1] + ")",
                  animation: "popIn 0.25s ease " + (i * 0.1) + "s backwards",
                  boxShadow: "0 8px 24px " + COLORS[i % COLORS.length][0] + "66"
                }}>{d}</div>
              );
            })}
          </div>
        )}

        {phase === "show" && showMode === "sequential" && (
          <div className="show-cards">
            {seq.split("").map(function(d, i) {
              var isActive = i === activeIdx;
              return (
                <div key={i}
                  className={"show-card" + (isActive ? " card-active" : " card-hidden")}
                  style={{
                    width: cardW, height: cardH, fontSize: cardFont,
                    borderRadius: Math.round(cardW * 0.2),
                    background: isActive
                      ? "linear-gradient(135deg," + COLORS[i % COLORS.length][0] + "," + COLORS[i % COLORS.length][1] + ")"
                      : "rgba(255,255,255,0.05)",
                    boxShadow: isActive ? "0 0 40px " + COLORS[i % COLORS.length][0] + "88" : "none"
                  }}>
                  {isActive ? d : ""}
                </div>
              );
            })}
          </div>
        )}

        {(phase === "input" || phase === "fb") && (
          <div className={"input-area" + (shake ? " shake" : "")}>
            <p className="input-prompt">Wat zag je?</p>
            <div className="entered-row">
              {Array.from({length: displayDigits}, function(_, i) {
                var ch = inp[i] || "";
                var isCur = phase === "input" && i === inp.length;
                var cls = "entered-slot";
                if (phase === "fb") cls += fb === "ok" ? " slot-ok" : " slot-bad";
                else if (isCur) cls += " slot-active";
                return (
                  <div key={i} className={cls}
                    style={{width: slotW, height: slotH, fontSize: slotFont}}>
                    {ch}
                  </div>
                );
              })}
            </div>
            {phase === "fb" && (
              <div className="feedback-msg"
                style={{color: fb === "ok" ? "#4ADE80" : "#F87171"}}>
                {fbMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Numpad */}
      {phase === "input" && (
        <div className="numpad">
          {["1","2","3","4","5","6","7","8","9","","0","del"].map(function(k, i) {
            return (
              <button key={i}
                className={"num-key" + (k === "" ? " num-empty" : k === "del" ? " num-del" : "")}
                onClick={function() { if (k) tap(k); }}>
                {k === "del" ? "⌫" : k}
              </button>
            );
          })}
        </div>
      )}

      {/* Lives -- prominent at bottom */}
      <div className="lives-row">
        {Array.from({length: TOTAL_LIVES}, function(_, i) {
          return (
            <span key={i} className={"life" + (i < lives ? " life-active" : " life-lost")}>
              {i < lives ? "❤️" : "🖤"}
            </span>
          );
        })}
        <span className="lives-label">{lives} {lives === 1 ? "leven" : "levens"} over</span>
      </div>

    </div>
  );
}
