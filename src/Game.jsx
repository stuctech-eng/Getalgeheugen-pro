import { useState, useEffect, useRef } from "react";
import { audio, vibrate } from "./audio.js";
import { saveScore } from "./firebase.js";

const DIGIT_COLORS = {
  "0":"#14B8A6","1":"#FF6B35","2":"#A855F7","3":"#06B6D4",
  "4":"#22C55E","5":"#EC4899","6":"#EAB308","7":"#3B82F6",
  "8":"#F43F5E","9":"#8B5CF6"
};

const SHOW_COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];

const CD_COLORS = ["#EF4444","#F97316","#22C55E"];
const TOTAL_LIVES = 3;
const START_DIGITS = 3;

function getShowTime(digits, diffMod) {
  var base = 3000 + (digits - 4) * 300;
  base = Math.max(1000, base);
  return Math.round(base * (1 + diffMod));
}

function getInputTime(digits) {
  if (digits <= 3) return 8000;
  if (digits <= 4) return 10000;
  if (digits <= 5) return 12000;
  return 14000;
}

function getSpeedBonus(diffMod) {
  if (diffMod <= -0.4) return 2.0;
  if (diffMod <= -0.2) return 1.4;
  if (diffMod === 0)   return 1.0;
  if (diffMod >= 0.2)  return 0.8;
  return 0.6;
}

function rndDigits(n) {
  var result = "";
  for (var i = 0; i < n; i++) result += Math.floor(Math.random() * 10);
  return result;
}

export default function Game({ uid, player, onMenu, onGameOver, settings }) {
  var diffMod  = (settings && settings.difficultyMod !== undefined) ? settings.difficultyMod : 0;
  var winsUp   = (settings && settings.winsUp) || 3;
  var showMode = (settings && settings.showMode) || "together";

  const [phase, setPhase]                 = useState("countdown");
  const [cdCount, setCdCount]             = useState(3);
  const [cdAnim, setCdAnim]               = useState(true);
  const [cdPulse, setCdPulse]             = useState(false);
  const [seq, setSeq]                     = useState("");
  const [activeIdx, setActiveIdx]         = useState(-1);
  const [inp, setInp]                     = useState([]);
  const [flash, setFlash]                 = useState(null);
  const [bgFlash, setBgFlash]             = useState(null);
  const [litKey, setLitKey]               = useState(null);
  const [wins, setWins]                   = useState(0);
  const [lives, setLives]                 = useState(TOTAL_LIVES);
  const [streak, setStreak]               = useState(0);
  const [round, setRound]                 = useState(1);
  const [displayDigits, setDisplayDigits] = useState(START_DIGITS);
  const [inputTimeLeft, setInputTimeLeft] = useState(0);
  const [inputMaxTime, setInputMaxTime]   = useState(10000);
  const [scoreTotal, setScoreTotal]       = useState(0);
  const [showLevelUp, setShowLevelUp]     = useState(false);
  const [showMenu, setShowMenu]           = useState(false);
  const [paused, setPaused]               = useState(false);

  const digitsRef      = useRef(START_DIGITS);
  const seqRef         = useRef("");
  const winsRef        = useRef(0);
  const livesRef       = useRef(TOTAL_LIVES);
  const streakRef      = useRef(0);
  const maxDRef        = useRef(START_DIGITS);
  const scoreTotalRef  = useRef(0);
  const basePointsRef  = useRef(0);
  const speedBonusRef  = useRef(0);
  const inputBonusRef  = useRef(0);
  const streakBonusRef = useRef(0);
  const inputStartRef  = useRef(0);
  const roundRef       = useRef(1);
  const inpRef         = useRef([]);
  const tmr            = useRef(null);
  const cdTmr          = useRef(null);
  const inputTmr       = useRef(null);
  const pausedTimeRef  = useRef(0);
  const phaseRef       = useRef("countdown");

  useEffect(function() {
    startRound(START_DIGITS);
    return function() {
      clearTimeout(tmr.current);
      clearInterval(cdTmr.current);
      clearInterval(inputTmr.current);
    };
  }, []);

  function setPhaseSync(p) {
    phaseRef.current = p;
    setPhase(p);
  }

  function handleBackPress() {
    clearTimeout(tmr.current);
    clearInterval(cdTmr.current);
    clearInterval(inputTmr.current);
    if (phaseRef.current === "input") {
      var elapsed = Date.now() - inputStartRef.current;
      var it = getInputTime(digitsRef.current);
      pausedTimeRef.current = Math.max(0, it - elapsed);
    }
    setShowMenu(true);
    setPaused(true);
  }

  function handleResume() {
    setShowMenu(false);
    setPaused(false);
    if (phaseRef.current === "input") {
      var remaining = pausedTimeRef.current;
      setInputTimeLeft(remaining);
      inputStartRef.current = Date.now() - (getInputTime(digitsRef.current) - remaining);
      inputTmr.current = setInterval(function() {
        var el = Date.now() - inputStartRef.current;
        var left = Math.max(0, getInputTime(digitsRef.current) - el);
        setInputTimeLeft(left);
        if (left <= 0) {
          clearInterval(inputTmr.current);
          handleResult(false, true);
        }
      }, 50);
    } else {
      startRound();
    }
  }

  function handleStop() {
    setShowMenu(false);
    setPaused(false);
    onMenu();
  }

  function startRound(nd) {
    clearTimeout(tmr.current);
    clearInterval(cdTmr.current);
    clearInterval(inputTmr.current);
    var digits = (nd !== undefined) ? nd : digitsRef.current;
    digitsRef.current = digits;
    setDisplayDigits(digits);
    setPhaseSync("countdown");
    setCdCount(3);
    setCdAnim(true);
    setInp([]);
    inpRef.current = [];
    setFlash(null);
    setBgFlash(null);
    setActiveIdx(-1);
    setInputTimeLeft(0);
    audio.tick();
    var count = 3;
    cdTmr.current = setInterval(function() {
      count = count - 1;
      setCdAnim(false);
      setCdPulse(true);
      setTimeout(function() { setCdAnim(true); setCdPulse(false); }, 150);
      if (count > 0) {
        setCdCount(count);
        if (count % 2 === 0) audio.tick(); else audio.tock();
      } else {
        clearInterval(cdTmr.current);
        var s = rndDigits(digits);
        seqRef.current = s;
        setSeq(s);
        setInp([]);
        inpRef.current = [];
        if (showMode === "sequential") {
          revealSequential(s);
        } else {
          audio.whoosh();
          setPhaseSync("show");
          var st = getShowTime(digits, diffMod);
          tmr.current = setTimeout(function() { startInputPhase(); }, st);
        }
      }
    }, 800);
  }

  function startInputPhase() {
    var it = getInputTime(digitsRef.current);
    setInputMaxTime(it);
    setInputTimeLeft(it);
    inputStartRef.current = Date.now();
    setPhaseSync("input");
    inputTmr.current = setInterval(function() {
      var elapsed = Date.now() - inputStartRef.current;
      var left = Math.max(0, it - elapsed);
      setInputTimeLeft(left);
      if (left <= 0) {
        clearInterval(inputTmr.current);
        handleResult(false, true);
      }
    }, 50);
  }

  async function revealSequential(s) {
    setPhaseSync("show");
    var st = getShowTime(digitsRef.current, diffMod);
    var perCard = Math.max(600, Math.floor(st / s.length));
    for (var i = 0; i < s.length; i++) {
      setActiveIdx(i);
      audio.pop();
      vibrate();
      await new Promise(function(r) { setTimeout(r, perCard); });
    }
    setActiveIdx(-1);
    await new Promise(function(r) { setTimeout(r, 200); });
    startInputPhase();
  }

  function tap(k) {
    if (phase !== "input" || flash) return;

    if (k === "del") {
      audio.plop();
      setInp([]);
      inpRef.current = [];
      return;
    }

    // Stijgende toon
    var pos = inpRef.current.length;
    audio.tapNote(pos, digitsRef.current);
    vibrate();

    // Knop oplichten
    setLitKey(k);
    setTimeout(function() { setLitKey(null); }, 180);

    var next = [...inpRef.current, k];
    inpRef.current = next;
    setInp(next);

    if (next.length === digitsRef.current) {
      clearInterval(inputTmr.current);
      handleResult(next.join("") === seqRef.current, false);
    }
  }

  function handleResult(correct, timeout) {
    setPhaseSync("fb");

    if (correct) {
      var elapsed = Date.now() - inputStartRef.current;
      var it = getInputTime(digitsRef.current);
      var timeRatio = Math.max(0, 1 - elapsed / it);
      var iBonus = Math.round(timeRatio * digitsRef.current * 5);
      inputBonusRef.current = inputBonusRef.current + iBonus;

      var newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);

      var streakMult = 1.0;
      if (newStreak >= 7) streakMult = 3.0;
      else if (newStreak >= 5) streakMult = 2.0;
      else if (newStreak >= 3) streakMult = 1.5;

      var bp = digitsRef.current * 10;
      basePointsRef.current = basePointsRef.current + bp;
      var sb = Math.round(bp * (getSpeedBonus(diffMod) - 1));
      speedBonusRef.current = speedBonusRef.current + sb;
      var stb = Math.round(bp * (streakMult - 1));
      streakBonusRef.current = streakBonusRef.current + stb;
      var modeMult = showMode === "sequential" ? 1.5 : 1.0;
      var roundScore = Math.round((bp + sb + iBonus + stb) * modeMult);
      scoreTotalRef.current = scoreTotalRef.current + roundScore;
      setScoreTotal(scoreTotalRef.current);
      maxDRef.current = Math.max(maxDRef.current, digitsRef.current);

      // Flash groen
      setFlash("ok");
      setBgFlash("ok");
      audio.boing();
      vibrate("ok");

      setTimeout(function() {
        setBgFlash(null);
        setFlash(null);
        setInp([]);
        inpRef.current = [];
      }, 600);

      var nw = winsRef.current + 1;
      winsRef.current = nw;
      setWins(nw);

      setTimeout(function() {
        roundRef.current = roundRef.current + 1;
        setRound(roundRef.current);
        if (nw >= winsUp) {
          audio.levelUp();
          winsRef.current = 0;
          setWins(0);
          setShowLevelUp(true);
          setTimeout(function() {
            setShowLevelUp(false);
            startRound(digitsRef.current + 1);
          }, 1200);
        } else {
          startRound();
        }
      }, 700);

    } else {
      streakRef.current = 0;
      setStreak(0);

      // Flash rood
      setFlash("bad");
      setBgFlash("bad");
      audio.buzz();
      vibrate("bad");

      setTimeout(function() {
        setBgFlash(null);
        setFlash(null);
        setInp([]);
        inpRef.current = [];
      }, 700);

      var newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);
      winsRef.current = 0;
      setWins(0);

      if (newLives <= 0) {
        var finalScore = scoreTotalRef.current;
        var finalMax   = maxDRef.current;
        saveScore(uid, player, finalScore, finalMax).then(function() {
          onGameOver({ score: finalScore, maxDigits: finalMax });
        }).catch(function() {
          onGameOver({ score: finalScore, maxDigits: finalMax });
        });
      } else {
        setTimeout(function() {
          roundRef.current = roundRef.current + 1;
          setRound(roundRef.current);
          startRound();
        }, 900);
      }
    }
  }

  var n          = displayDigits || 1;
  var availW     = Math.min(window.innerWidth, 480) - 40;
  var gap        = 10;
  var perRow     = n <= 5 ? n : Math.ceil(n / 2);
  var cardW      = Math.min(88, Math.floor((availW - gap * (perRow - 1)) / perRow));
  var cardH      = Math.round(cardW * 1.18);
  var cardFont   = Math.round(cardW * 0.58);
  var inputPct   = inputMaxTime > 0 ? (inputTimeLeft / inputMaxTime) * 100 : 0;
  var timerColor = inputPct > 60 ? "#22C55E" : inputPct > 30 ? "#EAB308" : "#EF4444";
  var curShowTime= getShowTime(displayDigits, diffMod);
  var speedColor = curShowTime < 2000 ? "#EF4444" : curShowTime < 3000 ? "#EAB308" : "#22C55E";
  var isLowTimer = inputPct < 30;
  var nums = ["1","2","3","4","5","6","7","8","9","del","0",""];

  var streakSize = streak >= 7 ? 24 : streak >= 5 ? 20 : streak >= 3 ? 17 : 14;

  return (
    <div className="screen game-screen" style={{
      background: bgFlash === "ok"
        ? "radial-gradient(ellipse at center, rgba(34,197,94,0.25) 0%, transparent 70%), #0D1136"
        : bgFlash === "bad"
        ? "radial-gradient(ellipse at center, rgba(239,68,68,0.25) 0%, transparent 70%), #0D1136"
        : undefined,
      transition:"background 0.2s"
    }}>

      {/* Pauze popup */}
      {showMenu && (
        <div style={{
          position:"fixed", inset:0, zIndex:100,
          background:"rgba(0,0,0,0.85)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:16
        }}>
          <p style={{fontSize:20, fontWeight:700, opacity:0.6, marginBottom:8}}>
            Wat wil je doen?
          </p>
          <button className="btn-primary" style={{maxWidth:260}} onClick={handleResume}>
            ▶ Verder spelen
          </button>
          <button className="btn-ghost" style={{maxWidth:260}} onClick={handleStop}>
            🚪 Stoppen
          </button>
        </div>
      )}

      {/* Level up overlay */}
      {showLevelUp && (
        <div style={{
          position:"fixed", inset:0, zIndex:99,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"rgba(168,85,247,0.15)",
          animation:"streakPop 0.3s ease"
        }}>
          <div style={{fontSize:80}}>⬆️</div>
          <div style={{fontSize:36, fontWeight:900, color:"#A855F7",
            textShadow:"0 0 40px #A855F7"}}>LEVEL UP!</div>
          <div style={{fontSize:18, opacity:0.6, marginTop:8}}>
            {displayDigits + 1} cijfers
          </div>
        </div>
      )}

      {/* Header */}
      <div className="game-header">
        <button className="back-btn" onClick={handleBackPress}>←</button>
        <div className="player-name">👤 {player}</div>
        <div className="round-num">Ronde {round}</div>
      </div>

      {/* Niveau + score */}
      <div className="level-row">
        <span className="level-label">Niveau</span>
        <div className="digit-bubble">{displayDigits}</div>
        <span className="level-label">cijfers</span>
        <div className="speed-badge" style={{color: speedColor}}>
          ⚡ {(curShowTime/1000).toFixed(1)}s
        </div>
        <span className="score-badge">🏆 {scoreTotal}</span>
        {streak >= 3 && (
          <span style={{fontSize:streakSize, transition:"font-size 0.3s"}}>🔥{streak}</span>
        )}
      </div>

      {/* Voortgang sterren */}
      <div className="progress-wrap">
        <div className="progress-bar" style={{width: (wins / winsUp * 100) + "%"}} />
      </div>
      <div className="streak-row">
        {Array.from({length: winsUp}, function(_, i) {
          return <span key={i}>{i < wins ? "⭐" : "☆"}</span>;
        })}
        <span className="streak-hint">{wins}/{winsUp} voor level</span>
      </div>

      {/* Display area */}
      <div className="display-area">

        {phase === "countdown" && (
          <div className="countdown">
            <div className="cd-num" style={{
              color: CD_COLORS[cdCount - 1],
              textShadow: "0 0 80px " + CD_COLORS[cdCount - 1],
              animation: cdAnim ? "cdPop 0.18s ease" : "none",
              transform: cdPulse ? "scale(1.15)" : "scale(1)",
              transition:"transform 0.15s"
            }}>{cdCount}</div>
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
                  background: "linear-gradient(135deg," + SHOW_COLORS[i % SHOW_COLORS.length][0] + "," + SHOW_COLORS[i % SHOW_COLORS.length][1] + ")",
                  animation: "popIn 0.25s ease " + (i * 0.1) + "s backwards",
                  boxShadow: "0 8px 24px " + SHOW_COLORS[i % SHOW_COLORS.length][0] + "66"
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
                      ? "linear-gradient(135deg," + SHOW_COLORS[i % SHOW_COLORS.length][0] + "," + SHOW_COLORS[i % SHOW_COLORS.length][1] + ")"
                      : "rgba(255,255,255,0.05)",
                    boxShadow: isActive ? "0 0 40px " + SHOW_COLORS[i % SHOW_COLORS.length][0] + "88" : "none"
                  }}>
                  {isActive ? d : ""}
                </div>
              );
            })}
          </div>
        )}

        {(phase === "input" || phase === "fb") && (
          <div style={{
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:12, width:"100%"
          }}>
            {/* Voortgang bolletjes */}
            <div style={{display:"flex", gap:10}}>
              {Array.from({length: displayDigits}, function(_, i) {
                var filled = i < inp.length;
                var color = filled && inp[i] ? DIGIT_COLORS[inp[i]] : null;
                return (
                  <div key={i} style={{
                    width: filled ? 14 : 10,
                    height: filled ? 14 : 10,
                    borderRadius:"50%",
                    background: flash === "ok"
                      ? "#22C55E"
                      : flash === "bad"
                      ? "#EF4444"
                      : filled ? (color || "#fff") : "rgba(255,255,255,0.2)",
                    boxShadow: filled
                      ? "0 0 10px " + (flash === "ok" ? "#22C55E" : flash === "bad" ? "#EF4444" : (color || "#fff"))
                      : "none",
                    transition:"all 0.15s"
                  }}/>
                );
              })}
            </div>

            {/* Timer balk */}
            <div style={{
              width:"100%", height:6,
              background:"rgba(255,255,255,0.08)",
              borderRadius:3, overflow:"hidden"
            }}>
              <div style={{
                height:"100%", width:inputPct+"%",
                background: isLowTimer
                  ? timerColor
                  : timerColor,
                boxShadow:"0 0 10px "+timerColor,
                borderRadius:3,
                transition:"width 0.05s linear, background 0.3s",
                animation: isLowTimer ? "pulse 0.5s ease infinite" : "none"
              }}/>
            </div>

            {/* Numpad gekleurde knoppen */}
            <div style={{
              display:"grid", gridTemplateColumns:"repeat(3,1fr)",
              gap:8, width:"100%"
            }}>
              {nums.map(function(k, i) {
                if (k === "") return <div key={i}/>;
                var isDel = k === "del";
                var color = isDel ? null : DIGIT_COLORS[k];
                var isLit = litKey === k;
                var inInput = inp.includes(k);
                var isFlashOk  = flash === "ok"  && !isDel && inInput;
                var isFlashBad = flash === "bad" && !isDel && inInput;

                return (
                  <button key={i} onClick={function() { tap(k); }} style={{
                    height:68, borderRadius:18, border:"none",
                    cursor:"pointer", fontSize:28, fontWeight:900,
                    background: isDel
                      ? "rgba(239,68,68,0.15)"
                      : isFlashOk
                      ? "#22C55E"
                      : isFlashBad
                      ? "#EF4444"
                      : isLit
                      ? color
                      : color + "44",
                    color: isDel ? "#F87171" : "#fff",
                    boxShadow: isLit
                      ? "0 0 30px "+color+", 0 0 60px "+color+"44"
                      : isFlashOk ? "0 0 30px #22C55E"
                      : isFlashBad ? "0 0 30px #EF4444"
                      : isLowTimer ? "0 0 12px #EF444433"
                      : isDel ? "none" : "0 2px 8px "+color+"22",
                    transform: isLit ? "scale(0.93)" : "scale(1)",
                    transition:"all 0.12s",
                    display:"flex", alignItems:"center", justifyContent:"center"
                  }}>
                    {isDel ? "⌫" : k}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Levens */}
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
