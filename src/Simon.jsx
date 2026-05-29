import { useState, useEffect, useRef } from "react";
import { audio, vibrate } from "./audio.js";
import { saveScore } from "./firebase.js";

const DIGIT_COLORS = {
  "0":"#14B8A6","1":"#FF6B35","2":"#A855F7","3":"#06B6D4",
  "4":"#22C55E","5":"#EC4899","6":"#EAB308","7":"#3B82F6",
  "8":"#F43F5E","9":"#D946EF"
};

// Vaste toonhoogte per kleur
const DIGIT_TONES = {
  "0": 220, "1": 261, "2": 293, "3": 329,
  "4": 349, "5": 392, "6": 440, "7": 494,
  "8": 523, "9": 587
};

const CD_COLORS = ["#EF4444","#F97316","#22C55E"];
const CD_GLOW   = ["rgba(239,68,68,0.4)","rgba(249,115,22,0.4)","rgba(34,197,94,0.4)"];

// Vaste layout — altijd zelfde posities
const BASE_ORDER = ["1","2","3","4","5","6","7","8","9","0"];

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
  var factor = 1.0
    * (optSnelheid  ? 1.3 : 1.0)
    * (optTijdsdruk ? 1.4 : 1.0)
    * (optShuffle   ? 1.6 : 1.0);

  const [phase, setPhase]           = useState("countdown");
  const [cdCount, setCdCount]       = useState(3);
  const [cdAnim, setCdAnim]         = useState(true);
  const [sequence, setSequence]     = useState([]);
  const [layout, setLayout]         = useState(BASE_ORDER);
  const [litKey, setLitKey]         = useState(null);
  const [inp, setInp]               = useState([]);
  const [scoreTotal, setScoreTotal] = useState(0);
  const [bestLen, setBestLen]       = useState(0);
  const [showMenu, setShowMenu]     = useState(false);
  const [flash, setFlash]           = useState(null);
  const [timeLeft, setTimeLeft]     = useState(5);
  const [showingSeq, setShowingSeq] = useState(false);
  const [levelUpPhase, setLevelUpPhase] = useState(null);

  const seqRef      = useRef([]);
  const inpRef      = useRef([]);
  const scoreRef    = useRef(0);
  const bestRef     = useRef(0);
  const layoutRef   = useRef(BASE_ORDER);
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

  function setPhaseSync(p) {
    phaseRef.current = p;
    setPhase(p);
  }

  function handleBackPress() {
    clearInterval(cdTmr.current);
    clearInterval(timeTmr.current);
    setShowMenu(true);
  }

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
        nextRound([]);
      }
    }, 800);
  }

  async function nextRound(currentSeq) {
    // Shuffle layout als optie aan
    var newLayout = optShuffle ? shuffleArray(BASE_ORDER) : BASE_ORDER;
    layoutRef.current = newLayout;
    setLayout(newLayout);

    // Voeg random cijfer toe aan reeks
    var newDigit = BASE_ORDER[Math.floor(Math.random() * BASE_ORDER.length)];
    var newSeq = [...currentSeq, newDigit];
    seqRef.current = newSeq;
    setSequence(newSeq);
    inpRef.current = [];
    setInp([]);
    checkingRef.current = false;

    // Toon level up als reeks langer dan 3
    if (newSeq.length > 3 && newSeq.length % 3 === 1) {
      setLevelUpPhase("fading");
      await new Promise(function(r) { setTimeout(r, 300); });
      setLevelUpPhase("showing");
      await new Promise(function(r) { setTimeout(r, 1000); });
      setLevelUpPhase(null);
    }

    // Toon reeks
    await showSequence(newSeq);
  }

  async function showSequence(seq) {
    setShowingSeq(true);
    setPhaseSync("show");

    // Snelheid factor
    var speed = optSnelheid
      ? Math.max(300, 800 - seq.length * 40)
      : 800;

    await new Promise(function(r) { setTimeout(r, 400); });

    for (var i = 0; i < seq.length; i++) {
      var digit = seq[i];
      setLitKey(digit);
      playTone(DIGIT_TONES[digit], speed / 1000 * 0.8);
      vibrate();
      await new Promise(function(r) { setTimeout(r, speed); });
      setLitKey(null);
      await new Promise(function(r) { setTimeout(r, 150); });
    }

    setShowingSeq(false);
    setPhaseSync("input");
    startTime.current = Date.now();

    // Tijdsdruk timer
    if (optTijdsdruk) {
      var limit = Math.max(3, 8 - Math.floor(seq.length / 3));
      setTimeLeft(limit);
      clearInterval(timeTmr.current);
      timeTmr.current = setInterval(function() {
        setTimeLeft(function(t) {
          if (t <= 1) {
            clearInterval(timeTmr.current);
            handleWrong();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }

  function tap(k) {
    if (phase !== "input" || checkingRef.current) return;

    // Flash knop
    setLitKey(k);
    playTone(DIGIT_TONES[k], 0.15);
    vibrate();
    setTimeout(function() { setLitKey(null); }, 180);

    var next = [...inpRef.current, k];
    inpRef.current = next;
    setInp([...next]);

    var pos = next.length - 1;

    // Fout?
    if (next[pos] !== seqRef.current[pos]) {
      checkingRef.current = true;
      clearInterval(timeTmr.current);
      setTimeout(function() { handleWrong(); }, 200);
      return;
    }

    // Reeks compleet?
    if (next.length === seqRef.current.length) {
      clearInterval(timeTmr.current);
      checkingRef.current = true;

      var elapsed   = (Date.now() - startTime.current) / 1000;
      var seqLen    = seqRef.current.length;
      var speedBonus = optTijdsdruk ? Math.max(0, Math.round((8 - elapsed) * 5)) : 0;
      var roundScore = Math.round((seqLen * 15 + speedBonus) * factor);
      scoreRef.current += roundScore;
      setScoreTotal(scoreRef.current);

      if (seqLen > bestRef.current) {
        bestRef.current = seqLen;
        setBestLen(seqLen);
      }

      setFlash("ok");
      audio.boing();
      vibrate("ok");

      setTimeout(function() {
        setFlash(null);
        checkingRef.current = false;
        nextRound(seqRef.current);
      }, 600);
    }
  }

  function handleWrong() {
    setFlash("bad");
    audio.buzz();
    vibrate("bad");

    setTimeout(function() {
      setFlash(null);
      // Game over — sla score op
      saveScore(uid, player, scoreRef.current, bestRef.current, "simon").then(function() {
        onGameOver({ score: scoreRef.current, maxDigits: bestRef.current });
      }).catch(function() {
        onGameOver({ score: scoreRef.current, maxDigits: bestRef.current });
      });
    }, 1000);
  }

  var cdColor = CD_COLORS[cdCount - 1] || "#22C55E";
  var cdGlow  = CD_GLOW[cdCount - 1]  || "rgba(34,197,94,0.4)";
  var timePct = optTijdsdruk ? (timeLeft / Math.max(3, 8 - Math.floor((sequence.length) / 3))) * 100 : 100;
  var timerColor = timePct > 60 ? "#22C55E" : timePct > 30 ? "#EAB308" : "#EF4444";

  // Layout in rijen van 3
  var rows = [];
  for (var i = 0; i < layout.length; i += 3) {
    rows.push(layout.slice(i, i + 3));
  }

  return (
    <div className="screen game-screen" style={{
      background: flash === "ok"
        ? "radial-gradient(ellipse at center, rgba(34,197,94,0.2) 0%, transparent 70%), #0D1136"
        : flash === "bad"
        ? "radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, transparent 70%), #0D1136"
        : "#0D1136",
      transition:"background 0.2s"
    }}>

      {/* Level up */}
      {levelUpPhase && (
        <div style={{
          position:"fixed", inset:0, zIndex:99,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:8,
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
            <div style={{fontSize:80}}>&#x1F3B5;</div>
            <div style={{fontSize:36, fontWeight:900, color:"#A855F7",
              textShadow:"0 0 40px #A855F7", letterSpacing:4}}>
              REEKS {sequence.length}!
            </div>
          </div>
        </div>
      )}

      {/* Pauze */}
      {showMenu && (
        <div style={{
          position:"fixed", inset:0, zIndex:100,
          background:"rgba(0,0,0,0.85)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:16
        }}>
          <p style={{fontSize:20, fontWeight:700, opacity:0.6, marginBottom:8}}>Wat wil je doen?</p>
          <button className="btn-primary" style={{maxWidth:260}} onClick={handleResume}>&#x25B6; Verder spelen</button>
          <button className="btn-ghost"   style={{maxWidth:260}} onClick={handleStop}>&#x1F6AA; Stoppen</button>
        </div>
      )}

      {/* Header */}
      <div className="game-header">
        <button className="back-btn" onClick={handleBackPress}>&#x2190;</button>
        <div className="player-name">&#x1F464; {player}</div>
        <div className="round-num">Reeks {sequence.length}</div>
      </div>

      {/* Score + info */}
      <div className="level-row">
        <span className="level-label">Reeks</span>
        <div className="digit-bubble">{sequence.length}</div>
        <span className="level-label">lang</span>
        <span className="score-badge">&#x1F3C6; {scoreTotal}</span>
        {bestLen > 0 && (
          <span style={{fontSize:12, opacity:0.4, marginLeft:4}}>best: {bestLen}</span>
        )}
      </div>

      {/* Timer als tijdsdruk aan */}
      {optTijdsdruk && phase === "input" && (
        <div style={{padding:"0 16px"}}>
          <div style={{height:6, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden"}}>
            <div style={{
              height:"100%", width:timePct+"%",
              background:timerColor,
              boxShadow:"0 0 10px "+timerColor,
              borderRadius:3, transition:"width 1s linear"
            }}/>
          </div>
          <div style={{textAlign:"center", fontSize:12, opacity:0.4, marginTop:4}}>
            &#x23F1; {timeLeft}s
          </div>
        </div>
      )}

      {/* Voortgang invoer bolletjes */}
      {phase === "input" && sequence.length > 0 && (
        <div style={{display:"flex", gap:6, justifyContent:"center", padding:"4px 0"}}>
          {sequence.map(function(_, i) {
            var filled = i < inp.length;
            var correct = filled && inp[i] === sequence[i];
            return (
              <div key={i} style={{
                width: filled ? 12 : 8,
                height: filled ? 12 : 8,
                borderRadius:"50%",
                background: flash === "bad" && filled ? "#EF4444"
                  : flash === "ok" ? "#22C55E"
                  : filled ? DIGIT_COLORS[inp[i]] : "rgba(255,255,255,0.2)",
                transition:"all 0.15s"
              }}/>
            );
          })}
        </div>
      )}

      {/* Display */}
      <div className="display-area" style={{padding:"8px 16px"}}>

        {/* Countdown */}
        {phase === "countdown" && (
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:16}}>
            <div style={{
              width:180, height:180, borderRadius:"50%",
              background:"radial-gradient(circle, "+cdColor+"22 0%, transparent 70%)",
              border:"3px solid "+cdColor+"66",
              boxShadow:"0 0 60px "+cdGlow+", inset 0 0 40px "+cdGlow,
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              <div style={{
                fontSize:110, fontWeight:900, lineHeight:1, color:cdColor,
                textShadow:"0 0 40px "+cdColor,
                transform:cdAnim ? "scale(1)" : "scale(1.15)",
                transition:"transform 0.15s"
              }}>{cdCount}</div>
            </div>
            <div style={{fontSize:13, opacity:0.35, letterSpacing:4, textTransform:"uppercase"}}>
              Simon!
            </div>
          </div>
        )}

        {/* Spel grid */}
        {(phase === "show" || phase === "input") && (
          <div style={{flex:1, display:"flex", flexDirection:"column", gap:8, width:"100%"}}>

            {/* Status label */}
            <div style={{
              textAlign:"center", fontSize:13, fontWeight:700,
              color: showingSeq ? "#A855F7" : "#22C55E",
              opacity:0.7, letterSpacing:2, textTransform:"uppercase"
            }}>
              {showingSeq ? "Onthoud..." : "Jouw beurt!"}
            </div>

            {/* Gekleurde knoppen — geen cijfers */}
            {rows.map(function(row, ri) {
              return (
                <div key={ri} style={{display:"flex", gap:8, flex:1}}>
                  {row.map(function(k, ki) {
                    var color  = DIGIT_COLORS[k];
                    var isLit  = litKey === k;
                    var inInp  = inp.includes(k) && !showingSeq;

                    return (
                      <button key={ki} onClick={function(){ tap(k); }} style={{
                        flex:1, aspectRatio:"1/1",
                        borderRadius:20, border:"none",
                        cursor: showingSeq ? "default" : "pointer",
                        background: isLit ? "#ffffff"
                          : flash === "ok" ? color
                          : flash === "bad" && inInp ? "#EF4444"
                          : color + (showingSeq ? "44" : "cc"),
                        boxShadow: isLit
                          ? "0 0 40px #ffffff, 0 0 80px "+color+"88"
                          : showingSeq ? "none"
                          : "0 0 20px "+color+"55",
                        transform: isLit ? "scale(0.91)" : "scale(1)",
                        transition: isLit ? "none" : "all 0.15s",
                        display:"flex", alignItems:"center", justifyContent:"center"
                      }}>
                      </button>
                    );
                  })}
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* Factor info */}
      <div style={{
        textAlign:"center", fontSize:11, opacity:0.3, marginBottom:8
      }}>
        &#x00D7;{factor.toFixed(2)} punten
        {optSnelheid  ? " &#x26A1;" : ""}
        {optTijdsdruk ? " &#x23F1;" : ""}
        {optShuffle   ? " &#x1F500;" : ""}
      </div>

    </div>
  );
}
