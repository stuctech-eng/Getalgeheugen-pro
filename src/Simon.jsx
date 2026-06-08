import { useState, useEffect, useRef } from "react";
import { audio, vibrate } from "./audio.js";
import { saveScore } from "./firebase.js";

const TILE_COLORS = {
  "0": "#14B8A6", "1": "#FF6B35", "2": "#A855F7", "3": "#06B6D4",
  "4": "#22C55E", "5": "#EC4899", "6": "#EAB308", "7": "#3B82F6",
  "8": "#F43F5E", "9": "#D946EF", "a": "#F97316", "b": "#84CC16",
  "c": "#0EA5E9", "d": "#E879F9", "e": "#10B981"
};

const TILE_TONES = {
  "0": 220, "1": 246, "2": 277, "3": 311,
  "4": 349, "5": 392, "6": 440, "7": 494,
  "8": 523, "9": 587, "a": 659, "b": 740,
  "c": 830, "d": 932, "e": 1047
};

const CD_COLORS = ["#EF4444","#F97316","#22C55E"];
const CD_GLOW   = ["rgba(239,68,68,0.4)","rgba(249,115,22,0.4)","rgba(34,197,94,0.4)"];

const BASE_ORDER = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e"];

function playTone(freq, duration) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function shuffleArray(arr) {
  var a = [...arr];
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

export default function Simon({ uid, player, onMenu, onGameOver, simonOpts }) {
  var optSnelheid  = simonOpts && simonOpts.snelheid;
  var optTijdsdruk = simonOpts && simonOpts.tijdsdruk;
  var optShuffle   = simonOpts && simonOpts.shuffle;
  var optMoeilijk  = simonOpts && simonOpts.moeilijkheid ? simonOpts.moeilijkheid : 1;

  var startLen      = optMoeilijk === 3 ? 3 : optMoeilijk === 2 ? 2 : 1;
  var groeiStap     = optMoeilijk === 3 ? 2 : 1;
  var moeilijkFactor = optMoeilijk === 3 ? 1.5 : optMoeilijk === 2 ? 1.2 : 1.0;

  var factor = 1.0
    * moeilijkFactor
    * (optSnelheid  ? 1.3 : 1.0)
    * (optTijdsdruk ? 1.4 : 1.0)
    * (optShuffle   ? 1.6 : 1.0);

  const [phase, setPhase]               = useState("countdown");
  const [cdCount, setCdCount]           = useState(3);
  const [cdAnim, setCdAnim]             = useState(true);
  const [sequence, setSequence]         = useState([]);
  const [layout, setLayout]             = useState(BASE_ORDER);
  const [litKey, setLitKey]             = useState(null);
  const [inp, setInp]                   = useState([]);
  const [scoreTotal, setScoreTotal]     = useState(0);
  const [bestLen, setBestLen]           = useState(0);
  const [showMenu, setShowMenu]         = useState(false);
  const [flash, setFlash]               = useState(null);
  const [timeLeft, setTimeLeft]         = useState(5);
  const [showingSeq, setShowingSeq]     = useState(false);
  const [levelUpPhase, setLevelUpPhase] = useState(null);

  const seqRef      = useRef([]);
  const inpRef      = useRef([]);
  const scoreRef    = useRef(0);
  const bestRef     = useRef(0);
  const phaseRef    = useRef("countdown");
  const cdTmr       = useRef(null);
  const timeTmr     = useRef(null);
  const checkingRef = useRef(false);
  const startTime   = useRef(0);

  useEffect(function() {
    startGame();
    return function() {
      clearInterval(cdTmr.current);
      clearInterval(timeTmr.current);
    };
  }, []);

  function setPhaseSync(p) { phaseRef.current = p; setPhase(p); }
  function handleBackPress() { clearInterval(cdTmr.current); clearInterval(timeTmr.current); setShowMenu(true); }
  function handleResume() { setShowMenu(false); }
  function handleStop()   { setShowMenu(false); onMenu(); }

  function startGame() {
    clearInterval(cdTmr.current);
    clearInterval(timeTmr.current);
    seqRef.current = [];
    setSequence([]);
    inpRef.current = [];
    setInp([]);
    setPhaseSync("countdown");
    setCdCount(3);
    setCdAnim(true);
    setLitKey(null);
    setFlash(null);
    audio.tick();
    var count = 3;
    cdTmr.current = setInterval(function() {
      count--;
      setCdAnim(false);
      setTimeout(function() { setCdAnim(true); }, 60);
      if (count > 0) {
        setCdCount(count);
        if (count % 2 === 0) audio.tick(); else audio.tock();
      } else {
        clearInterval(cdTmr.current);
        var initSeq = [];
        for (var i = 0; i < startLen; i++) {
          initSeq.push(BASE_ORDER[Math.floor(Math.random() * BASE_ORDER.length)]);
        }
        nextRound(initSeq, true);
      }
    }, 800);
  }

  async function nextRound(currentSeq, isFirst) {
    var newLayout = optShuffle ? shuffleArray(BASE_ORDER) : BASE_ORDER;
    setLayout(newLayout);

    var newSeq = isFirst ? currentSeq : [...currentSeq];
    if (!isFirst) {
      for (var i = 0; i < groeiStap; i++) {
        newSeq.push(BASE_ORDER[Math.floor(Math.random() * BASE_ORDER.length)]);
      }
    }

    seqRef.current = newSeq;
    setSequence(newSeq);
    inpRef.current = [];
    setInp([]);
    checkingRef.current = false;

    if (!isFirst && (newSeq.length - startLen) % 3 === 0) {
      setLevelUpPhase("fading");
      await new Promise(function(r) { setTimeout(r, 300); });
      setLevelUpPhase("showing");
      audio.levelUp();
      await new Promise(function(r) { setTimeout(r, 1000); });
      setLevelUpPhase(null);
    }

    await showSequence(newSeq);
  }

  async function showSequence(seq) {
    setShowingSeq(true);
    setPhaseSync("show");
    var speed = optSnelheid ? Math.max(300, 800 - seq.length * 40) : 800;
    await new Promise(function(r) { setTimeout(r, 400); });
    for (var i = 0; i < seq.length; i++) {
      var digit = seq[i];
      setLitKey(digit);
      playTone(TILE_TONES[digit], speed / 1000 * 0.8);
      vibrate();
      await new Promise(function(r) { setTimeout(r, speed); });
      setLitKey(null);
      await new Promise(function(r) { setTimeout(r, 150); });
    }
    setShowingSeq(false);
    setPhaseSync("input");
    startTime.current = Date.now();
    if (optTijdsdruk) {
      var limit = Math.max(3, 8 - Math.floor(seq.length / 3));
      setTimeLeft(limit);
      clearInterval(timeTmr.current);
      timeTmr.current = setInterval(function() {
        setTimeLeft(function(t) {
          if (t <= 1) { clearInterval(timeTmr.current); handleWrong(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  }

  function tap(k) {
    if (phase !== "input" || checkingRef.current) return;
    setLitKey(k);
    playTone(TILE_TONES[k], 0.15);
    vibrate();
    setTimeout(function() { setLitKey(null); }, 180);
    var next = [...inpRef.current, k];
    inpRef.current = next;
    setInp([...next]);
    var pos = next.length - 1;
    if (next[pos] !== seqRef.current[pos]) {
      checkingRef.current = true;
      clearInterval(timeTmr.current);
      setTimeout(function() { handleWrong(); }, 200);
      return;
    }
    if (next.length === seqRef.current.length) {
      clearInterval(timeTmr.current);
      checkingRef.current = true;
      var elapsed    = (Date.now() - startTime.current) / 1000;
      var seqLen     = seqRef.current.length;
      var speedBonus = optTijdsdruk ? Math.max(0, Math.round((8 - elapsed) * 5)) : 0;
      var roundScore = Math.round((seqLen * 15 + speedBonus) * factor);
      scoreRef.current += roundScore;
      setScoreTotal(scoreRef.current);
      if (seqLen > bestRef.current) { bestRef.current = seqLen; setBestLen(seqLen); }
      setFlash("ok");
      audio.boing();
      vibrate("ok");
      setTimeout(function() { setFlash(null); checkingRef.current = false; nextRound(seqRef.current, false); }, 600);
    }
  }

  function handleWrong() {
    setFlash("bad");
    audio.buzz();
    vibrate("bad");
    setTimeout(function() {
      setFlash(null);
      saveScore(uid, player, scoreRef.current, bestRef.current, "simon").then(function() {
        onGameOver({ score: scoreRef.current, maxDigits: bestRef.current });
      }).catch(function() {
        onGameOver({ score: scoreRef.current, maxDigits: bestRef.current });
      });
    }, 1000);
  }

  var cdColor  = CD_COLORS[cdCount - 1] || "#22C55E";
  var cdGlow   = CD_GLOW[cdCount - 1]  || "rgba(34,197,94,0.4)";
  var timePct  = optTijdsdruk ? (timeLeft / Math.max(3, 8 - Math.floor(sequence.length / 3))) * 100 : 100;
  var timerColor = timePct > 60 ? "#22C55E" : timePct > 30 ? "#EAB308" : "#EF4444";

  // 3 kolommen × 5 rijen = 15 knoppen
  var rows = [];
  for (var i = 0; i < layout.length; i += 3) {
    rows.push(layout.slice(i, i + 3));
  }

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100dvh", overflow:"hidden",
      paddingTop:"env(safe-area-inset-top)",
      paddingBottom:"env(safe-area-inset-bottom)",
      background: flash === "ok"
        ? "radial-gradient(ellipse at center, rgba(34,197,94,0.2) 0%, transparent 70%), #0D1136"
        : flash === "bad"
        ? "radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, transparent 70%), #0D1136"
        : "#0D1136",
      transition:"background 0.2s"
    }}>

      {/* Level up overlay */}
      {levelUpPhase && (
        <div style={{
          position:"fixed", inset:0, zIndex:99,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"rgba(0,0,0,0.92)",
          opacity: levelUpPhase === "fading" ? 0 : 1,
          transition:"opacity 0.5s ease"
        }}>
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:12,
            opacity: levelUpPhase === "showing" ? 1 : 0,
            transform: levelUpPhase === "showing" ? "scale(1)" : "scale(0.8)",
            transition:"opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s"
          }}>
            <div style={{fontSize:80}}>🎵</div>
            <div style={{fontSize:36, fontWeight:900, color:"#A855F7",
              textShadow:"0 0 40px #A855F7", letterSpacing:4}}>
              REEKS {sequence.length}!
            </div>
          </div>
        </div>
      )}

      {/* Pauze overlay */}
      {showMenu && (
        <div style={{
          position:"fixed", inset:0, zIndex:100,
          background:"rgba(0,0,0,0.85)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:16
        }}>
          <p style={{fontSize:20, fontWeight:700, opacity:0.6, marginBottom:8}}>Wat wil je doen?</p>
          <button className="btn-primary" style={{maxWidth:260}} onClick={handleResume}>▶ Verder spelen</button>
          <button className="btn-ghost"   style={{maxWidth:260}} onClick={handleStop}>🚪 Stoppen</button>
        </div>
      )}

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"8px 12px", flexShrink:0
      }}>
        <button className="back-btn" onClick={handleBackPress}>←</button>
        <div style={{display:"flex", alignItems:"center", gap:6}}>
          <span style={{fontSize:12, opacity:0.5}}>👤 {player}</span>
          <span style={{
            fontSize:12, fontWeight:700,
            background:"rgba(168,85,247,0.2)", border:"1px solid rgba(168,85,247,0.4)",
            borderRadius:20, padding:"3px 9px", color:"#A855F7"
          }}>Reeks {sequence.length}</span>
          <span style={{
            fontSize:12, fontWeight:700,
            background:"rgba(255,255,255,0.07)",
            borderRadius:20, padding:"3px 9px"
          }}>🏆 {scoreTotal}</span>
        </div>
      </div>

      {/* Timer balk */}
      {optTijdsdruk && phase === "input" && (
        <div style={{padding:"0 12px 2px", flexShrink:0}}>
          <div style={{height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden"}}>
            <div style={{height:"100%", width:timePct+"%", background:timerColor, borderRadius:2, transition:"width 1s linear"}}/>
          </div>
        </div>
      )}

      {/* Voortgang bolletjes */}
      {phase === "input" && sequence.length > 0 && (
        <div style={{display:"flex", gap:4, justifyContent:"center", padding:"2px 8px", flexShrink:0, flexWrap:"wrap"}}>
          {sequence.map(function(_, i) {
            var filled = i < inp.length;
            return (
              <div key={i} style={{
                width: filled ? 10 : 6, height: filled ? 10 : 6,
                borderRadius:"50%",
                background: flash === "bad" && filled ? "#EF4444"
                  : flash === "ok" ? "#22C55E"
                  : filled ? TILE_COLORS[inp[i]] : "rgba(255,255,255,0.2)",
                transition:"all 0.15s", flexShrink:0
              }}/>
            );
          })}
        </div>
      )}

      {/* Status label */}
      {(phase === "show" || phase === "input") && (
        <div style={{
          textAlign:"center", fontSize:12, fontWeight:700,
          color: showingSeq ? "#A855F7" : "#22C55E",
          opacity:0.8, letterSpacing:2, textTransform:"uppercase",
          padding:"2px 0", flexShrink:0
        }}>
          {showingSeq ? "Onthoud..." : "Jouw beurt!"}
        </div>
      )}

      {/* Countdown */}
      {phase === "countdown" && (
        <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16}}>
          <div style={{
            width:160, height:160, borderRadius:"50%",
            background:"radial-gradient(circle, "+cdColor+"22 0%, transparent 70%)",
            border:"3px solid "+cdColor+"66",
            boxShadow:"0 0 60px "+cdGlow+", inset 0 0 40px "+cdGlow,
            display:"flex", alignItems:"center", justifyContent:"center"
          }}>
            <div style={{
              fontSize:96, fontWeight:900, lineHeight:1, color:cdColor,
              textShadow:"0 0 40px "+cdColor,
              transform:cdAnim ? "scale(1)" : "scale(1.15)",
              transition:"transform 0.15s"
            }}>{cdCount}</div>
          </div>
          <div style={{fontSize:13, opacity:0.35, letterSpacing:4, textTransform:"uppercase"}}>Simon!</div>
        </div>
      )}

      {/* Grid 3×5 */}
      {(phase === "show" || phase === "input") && (
        <div style={{flex:1, display:"flex", flexDirection:"column", gap:6, padding:"4px 8px 8px", overflow:"hidden"}}>
          {rows.map(function(row, ri) {
            return (
              <div key={ri} style={{display:"flex", gap:6, flex:1}}>
                {row.map(function(k, ki) {
                  var color = TILE_COLORS[k];
                  var isLit = litKey === k;
                  var inInp = inp.includes(k) && !showingSeq;
                  return (
                    <button key={ki} onClick={function(){ tap(k); }} style={{
                      flex:1, borderRadius:16, border:"none",
                      cursor: showingSeq ? "default" : "pointer",
                      background: isLit ? "#ffffff"
                        : flash === "ok" ? color
                        : flash === "bad" && inInp ? "#EF4444"
                        : color + (showingSeq ? "44" : "cc"),
                      boxShadow: isLit
                        ? "0 0 40px #ffffff, 0 0 80px "+color+"88"
                        : showingSeq ? "none"
                        : "0 0 16px "+color+"44",
                      transform: isLit ? "scale(0.91)" : "scale(1)",
                      transition: isLit ? "none" : "all 0.15s"
                    }}/>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Factor info */}
      <div style={{textAlign:"center", fontSize:10, opacity:0.25, paddingBottom:4, flexShrink:0}}>
        ×{factor.toFixed(2)} punten · niveau {optMoeilijk}
        {optSnelheid ? " ⚡" : ""}{optTijdsdruk ? " ⏱" : ""}{optShuffle ? " 🔀" : ""}
      </div>

    </div>
  );
}
