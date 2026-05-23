import { useState, useEffect, useRef } from "react";
import { audio, vibrate } from "./audio.js";
import { saveScore } from "./firebase.js";

const DIGIT_COLORS = {
  "0":"#14B8A6","1":"#FF6B35","2":"#A855F7","3":"#06B6D4",
  "4":"#22C55E","5":"#EC4899","6":"#EAB308","7":"#3B82F6",
  "8":"#F43F5E","9":"#D946EF"
};

const CD_COLORS = ["#EF4444","#F97316","#22C55E"];
const CD_GLOW   = ["rgba(239,68,68,0.4)","rgba(249,115,22,0.4)","rgba(34,197,94,0.4)"];
const TOTAL_LIVES = 3;
const START_DIGITS = 3;

function rndUniqueDigits(n) {
  var digits = ["0","1","2","3","4","5","6","7","8","9"];
  var result = [];
  for (var i = 0; i < n; i++) {
    var idx = Math.floor(Math.random() * digits.length);
    result.push(digits[idx]);
    digits.splice(idx, 1);
  }
  return result.join("");
}

function calcFeedback(secret, guess) {
  var feedback = [];
  for (var i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      feedback.push("correct");
    } else if (secret.includes(guess[i])) {
      feedback.push("misplaced");
    } else {
      feedback.push("wrong");
    }
  }
  return feedback;
}

function getMaxPogingen(digits) {
  if (digits <= 3) return 4;
  if (digits <= 4) return 5;
  if (digits <= 5) return 6;
  return 7;
}

export default function CodeBreaker({ uid, player, onMenu, onGameOver, settings }) {
  var winsUp = (settings && settings.winsUp) || 3;

  const [phase, setPhase]               = useState("countdown");
  const [cdCount, setCdCount]           = useState(3);
  const [cdAnim, setCdAnim]             = useState(true);
  const [currentInp, setCurrentInp]     = useState([]);
  const [pogingen, setPogingen]         = useState([]);
  const [wins, setWins]                 = useState(0);
  const [lives, setLives]               = useState(TOTAL_LIVES);
  const [streak, setStreak]             = useState(0);
  const [round, setRound]               = useState(1);
  const [displayDigits, setDisplayDigits] = useState(START_DIGITS);
  const [scoreTotal, setScoreTotal]     = useState(0);
  const [levelUpPhase, setLevelUpPhase] = useState(null);
  const [nextDigits, setNextDigits]     = useState(START_DIGITS + 1);
  const [showMenu, setShowMenu]         = useState(false);
  const [litKey, setLitKey]             = useState(null);
  const [gameOver, setGameOver]         = useState(false);
  const [revealSecret, setRevealSecret] = useState("");

  const digitsRef     = useRef(START_DIGITS);
  const secretRef     = useRef("");
  const winsRef       = useRef(0);
  const livesRef      = useRef(TOTAL_LIVES);
  const streakRef     = useRef(0);
  const maxDRef       = useRef(START_DIGITS);
  const scoreTotalRef = useRef(0);
  const roundRef      = useRef(1);
  const pogingenRef   = useRef([]);
  const cdTmr         = useRef(null);
  const checkingRef   = useRef(false);

  useEffect(function() {
    startRound(START_DIGITS);
    return function() { clearInterval(cdTmr.current); };
  }, []);

  function handleBackPress() {
    clearInterval(cdTmr.current);
    setShowMenu(true);
  }

  function handleResume() { setShowMenu(false); }
  function handleStop() { setShowMenu(false); onMenu(); }

  function startRound(nd) {
    clearInterval(cdTmr.current);
    var digits = (nd !== undefined) ? nd : digitsRef.current;
    digitsRef.current = digits;
    setDisplayDigits(digits);
    setPhase("countdown");
    setCdCount(3);
    setCdAnim(true);
    setCurrentInp([]);
    setPogingen([]);
    pogingenRef.current = [];
    setGameOver(false);
    setRevealSecret("");
    checkingRef.current = false;
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
        var s = rndUniqueDigits(digits);
        secretRef.current = s;
        setCurrentInp([]);
        setPhase("input");
      }
    }, 800);
  }

  function tap(k) {
    if (phase !== "input" || gameOver || checkingRef.current) return;

    if (k === "del") {
      audio.plop();
      setCurrentInp(function(prev) { return prev.slice(0, -1); });
      return;
    }

    setCurrentInp(function(prev) {
      if (prev.includes(k)) return prev;
      if (prev.length >= digitsRef.current) return prev;

      audio.tapNote(prev.length, digitsRef.current);
      vibrate();
      setLitKey(k);
      setTimeout(function() { setLitKey(null); }, 200);

      var next = [...prev, k];

      if (next.length === digitsRef.current) {
        checkingRef.current = true;
        // Gebruik setTimeout zodat state update eerst verwerkt wordt
        setTimeout(function() { checkPoging(next); }, 50);
      }

      return next;
    });
  }

  function checkPoging(guess) {
    var secret   = secretRef.current;
    var feedback = calcFeedback(secret, guess);
    var correct  = feedback.every(function(f) { return f === "correct"; });
    var maxPog   = getMaxPogingen(digitsRef.current);
    var newPogingen = [...pogingenRef.current, { guess: guess.join(""), feedback }];
    pogingenRef.current = newPogingen;
    setPogingen([...newPogingen]);
    setCurrentInp([]);
    checkingRef.current = false;

    if (correct) {
      var gebruiktePogingen = newPogingen.length;
      var pogingenBonus = (maxPog - gebruiktePogingen + 1) * 20;
      var newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      var streakMult = newStreak >= 7 ? 3.0 : newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0;
      var bp = digitsRef.current * 10;
      var roundScore = Math.round((bp + pogingenBonus) * streakMult * 2.0);
      scoreTotalRef.current += roundScore;
      setScoreTotal(scoreTotalRef.current);
      maxDRef.current = Math.max(maxDRef.current, digitsRef.current);
      audio.boing();
      vibrate("ok");
      setGameOver(true);

      var nw = winsRef.current + 1;
      winsRef.current = nw;
      setWins(nw);

      setTimeout(function() {
        roundRef.current++;
        setRound(roundRef.current);
        pogingenRef.current = [];
        if (nw >= winsUp) {
          audio.levelUp();
          winsRef.current = 0;
          setWins(0);
          var nd = digitsRef.current + 1;
          setNextDigits(nd);
          setLevelUpPhase("fading");
          setTimeout(function() { setLevelUpPhase("showing"); }, 500);
          setTimeout(function() { setLevelUpPhase(null); startRound(nd); }, 2800);
        } else {
          startRound();
        }
      }, 1500);

    } else if (newPogingen.length >= maxPog) {
      streakRef.current = 0;
      setStreak(0);
      audio.buzz();
      vibrate("bad");
      setGameOver(true);
      setRevealSecret(secret);

      var newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);
      winsRef.current = 0;
      setWins(0);

      setTimeout(function() {
        if (newLives <= 0) {
          var finalScore = scoreTotalRef.current;
          var finalMax   = maxDRef.current;
          saveScore(uid, player, finalScore, finalMax, "codebreker").then(function() {
            onGameOver({ score: finalScore, maxDigits: finalMax });
          }).catch(function() {
            onGameOver({ score: finalScore, maxDigits: finalMax });
          });
        } else {
          roundRef.current++;
          setRound(roundRef.current);
          pogingenRef.current = [];
          startRound();
        }
      }, 2500);

    } else {
      audio.pop();
    }
  }

  var maxPogingen = getMaxPogingen(displayDigits);
  var cdColor = CD_COLORS[cdCount - 1] || "#22C55E";
  var cdGlow  = CD_GLOW[cdCount - 1]  || "rgba(34,197,94,0.4)";
  var streakSize = streak >= 7 ? 24 : streak >= 5 ? 20 : streak >= 3 ? 17 : 14;
  var nums = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","del"]];

  return (
    <div className="screen game-screen" style={{background:"#0D1136"}}>

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
            <div style={{fontSize:100}}>⬆️</div>
            <div style={{fontSize:48, fontWeight:900, color:"#A855F7",
              textShadow:"0 0 40px #A855F7, 0 0 80px #A855F7", letterSpacing:4}}>LEVEL UP!</div>
            <div style={{fontSize:22, marginTop:4, color:"#22C55E",
              textShadow:"0 0 20px #22C55E", fontWeight:700}}>Nu {nextDigits} cijfers! 🎯</div>
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
          <button className="btn-primary" style={{maxWidth:260}} onClick={handleResume}>▶ Verder spelen</button>
          <button className="btn-ghost"   style={{maxWidth:260}} onClick={handleStop}>🚪 Stoppen</button>
        </div>
      )}

      {/* Header */}
      <div className="game-header">
        <button className="back-btn" onClick={handleBackPress}>←</button>
        <div className="player-name">👤 {player}</div>
        <div className="round-num">Ronde {round}</div>
      </div>

      {/* Niveau */}
      <div className="level-row">
        <span className="level-label">Niveau</span>
        <div className="digit-bubble">{displayDigits}</div>
        <span className="level-label">cijfers</span>
        <div style={{
          fontSize:12, color:"#EAB308", fontWeight:700,
          background:"rgba(255,255,255,0.08)",
          padding:"5px 10px", borderRadius:20
        }}>🔓 {pogingen.length}/{maxPogingen}</div>
        <span className="score-badge">🏆 {scoreTotal}</span>
        {streak >= 3 && <span style={{fontSize:streakSize, transition:"font-size 0.3s"}}>🔥{streak}</span>}
      </div>

      {/* Progress */}
      <div className="progress-wrap">
        <div className="progress-bar" style={{width:(wins/winsUp*100)+"%"}}/>
      </div>
      <div className="streak-row">
        {Array.from({length:winsUp}, function(_, i) {
          return <span key={i}>{i < wins ? "⭐" : "☆"}</span>;
        })}
        <span className="streak-hint">{wins}/{winsUp} voor level</span>
        <span style={{fontSize:12, color:"#EAB308", fontWeight:700, marginLeft:4}}>🔓 Code Breker</span>
      </div>

      {/* Display area */}
      <div className="display-area" style={{gap:6}}>

        {/* COUNTDOWN */}
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
              🔓 Code Breker!
            </div>
          </div>
        )}

        {/* INVOER */}
        {phase === "input" && (
          <div style={{display:"flex", flexDirection:"column", gap:6, width:"100%", flex:1}}>

            {/* Pogingen geschiedenis */}
            <div style={{display:"flex", flexDirection:"column", gap:4}}>
              {pogingen.map(function(p, pi) {
                var isLast = pi === pogingen.length - 1;
                return (
                  <div key={pi} style={{
                    display:"flex", gap:4, justifyContent:"center",
                    opacity: isLast ? 1 : 0.5
                  }}>
                    {p.guess.split("").map(function(d, di) {
                      var fb    = p.feedback[di];
                      var color = DIGIT_COLORS[d];
                      var bg    = fb === "correct"  ? color
                        : fb === "misplaced" ? color+"55"
                        : "rgba(255,255,255,0.06)";
                      var border = fb === "correct"  ? "2px solid "+color
                        : fb === "misplaced" ? "2px solid "+color+"88"
                        : "2px solid rgba(255,255,255,0.1)";
                      return (
                        <div key={di} style={{
                          width:44, height:44, borderRadius:12,
                          background:bg, border:border,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:20, fontWeight:900, color:"#fff",
                          boxShadow: fb === "correct" ? "0 0 12px "+color+"66" : "none"
                        }}>{d}</div>
                      );
                    })}
                    <div style={{display:"flex", alignItems:"center", gap:2, marginLeft:4}}>
                      {p.feedback.map(function(f, fi) {
                        return (
                          <span key={fi} style={{fontSize:14}}>
                            {f === "correct" ? "✅" : f === "misplaced" ? "🟡" : "❌"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Lege rijen */}
              {Array.from({length: maxPogingen - pogingen.length}, function(_, i) {
                var isCurrent = i === 0 && !gameOver;
                return (
                  <div key={i} style={{display:"flex", gap:4, justifyContent:"center"}}>
                    {Array.from({length:displayDigits}, function(_, j) {
                      var ch = isCurrent && currentInp[j] ? currentInp[j] : "";
                      var color = ch ? DIGIT_COLORS[ch] : null;
                      return (
                        <div key={j} style={{
                          width:44, height:44, borderRadius:12,
                          background: ch ? color : "rgba(255,255,255,0.04)",
                          border: ch
                            ? "2px solid "+color
                            : isCurrent && j === currentInp.length
                            ? "2px solid rgba(168,85,247,0.6)"
                            : "2px dashed rgba(255,255,255,0.12)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:20, fontWeight:900, color:"#fff",
                          boxShadow: ch ? "0 0 12px "+color+"66" : "none",
                          opacity: isCurrent ? 1 : 0.2
                        }}>{ch}</div>
                      );
                    })}
                    <div style={{width:60}}/>
                  </div>
                );
              })}
            </div>

            {/* Code tonen bij verlies */}
            {gameOver && revealSecret && (
              <div style={{textAlign:"center", padding:"6px 0"}}>
                <div style={{fontSize:12, opacity:0.4, marginBottom:4}}>De code was:</div>
                <div style={{display:"flex", gap:4, justifyContent:"center"}}>
                  {revealSecret.split("").map(function(d, i) {
                    var color = DIGIT_COLORS[d];
                    return (
                      <div key={i} style={{
                        width:44, height:44, borderRadius:12,
                        background:color, border:"2px solid "+color,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:20, fontWeight:900, color:"#fff",
                        boxShadow:"0 0 16px "+color+"66"
                      }}>{d}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Numpad */}
            {!gameOver && (
              <div style={{flex:1, display:"flex", flexDirection:"column", gap:8}}>
                {nums.map(function(row, ri) {
                  return (
                    <div key={ri} style={{display:"flex", gap:8, flex:1}}>
                      {row.map(function(k, ki) {
                        if (k === "") return <div key={ki} style={{flex:1}}/>;
                        var isDel  = k === "del";
                        var color  = isDel ? null : DIGIT_COLORS[k];
                        var isLit  = litKey === k;
                        var isUsed = !isDel && currentInp.includes(k);
                        return (
                          <button key={ki} onClick={function(){ tap(k); }} style={{
                            flex:1, aspectRatio:"1/1",
                            borderRadius:20, border:"none",
                            cursor: isUsed ? "default" : "pointer",
                            fontSize: isDel ? 24 : 30, fontWeight:900,
                            background: isDel
                              ? isLit ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"
                              : isUsed ? "rgba(255,255,255,0.06)"
                              : isLit ? "#ffffff" : color,
                            color: isDel ? "#fff"
                              : isUsed ? "rgba(255,255,255,0.15)"
                              : isLit ? color : "#fff",
                            opacity: isUsed ? 0.3 : 1,
                            boxShadow: isUsed || isDel ? "none"
                              : isLit ? "0 0 40px #ffffff88, 0 0 60px "+color+"66"
                              : "0 0 20px "+color+"55",
                            transform: isLit ? "scale(0.91)" : "scale(1)",
                            transition: isLit ? "none" : "transform 0.15s",
                            display:"flex", alignItems:"center", justifyContent:"center"
                          }}>
                            {isDel ? "⌫" : k}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Levens */}
      <div className="lives-row">
        {Array.from({length:TOTAL_LIVES}, function(_, i) {
          return (
            <span key={i} className={"life"+(i < lives ? " life-active" : " life-lost")}>
              {i < lives ? "❤️" : "🖤"}
            </span>
          );
        })}
        <span className="lives-label">{lives} {lives === 1 ? "leven" : "levens"} over</span>
      </div>
    </div>
  );
}
