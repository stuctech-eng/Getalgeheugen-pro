import { useState, useEffect, useRef } from "react";
import { audio, vibrate } from "./audio.js";
import { updateBestScore } from "./services/userService.js";
import { submitScore } from "./services/leaderboardService.js";

const COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];
const TIPS = ["Geweldig! 🎉","Briljant! 🧠","Perfect! ⭐","Top! 🚀","Wauw! 🔥","Super! 💪","Ongelooflijk! 🤯","Fenomenaal! 🌟"];
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
  const [displayDigits, setDisplayDigits] = useState(START_DIGITS);
  const [inputTimeLeft, setInputTimeLeft] = useState(0);
  const [inputMaxTime, setInputMaxTime]   = useState(10000);
  const [scoreTotal, setScoreTotal]       = useState(0);

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
  const tmr            = useRef(null);
  const cdTmr          = useRef(null);
  const inputTmr       = useRef(null);

  useEffect(function() {
    startRound(START_DIGITS);
    return function() {
      clearTimeout(tmr.current);
      clearInterval(cdTmr.current);
      clearInterval(inputTmr.current);
    };
  }, []);

  function startRound(nd) {
    clearTimeout(tmr.current);
    clearInterval(cdTmr.current);
    clearInterval(inputTmr.current);
    var digits = (nd !== undefined) ? nd : digitsRef.current;
    digitsRef.current = digits;
    setDisplayDigits(digits);
    setPhase("countdown");
    setCdCount(3);
    setCdAnim(true);
    setInp("");
    setFb(null);
    setActiveIdx(-1);
    setInputTimeLeft(0);
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
    setPhase("input");
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
    setPhase("show");
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
      clearInterval(inputTmr.current);
      handleResult(next === seqRef.current, false);
    }
  }

  function handleResult(correct, timeout) {
    setPhase("fb");

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

      setFb("ok");
      setFbMsg(TIPS[Math.floor(Math.random() * TIPS.length)] + (newStreak >= 3 ? " 🔥×" + newStreak : ""));
      setTimeout(function() { audio.boing(); }, 150);
      vibrate("ok");

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
          startRound(digitsRef.current + 1);
        } else {
          startRound();
        }
      }, 2000);

    } else {
      streakRef.current = 0;
      setStreak(0);
      setFb("bad");
      setFbMsg(timeout
        ? "Te laat! Het was " + seqRef.current + " ⏱️"
        : "Helaas, het was " + seqRef.current + " 😅");
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
        var finalScore  = scoreTotalRef.current;
        var finalMax    = maxDRef.current;
        var oldBest     = (player && player.bestScore) || 0;
        var isNewRecord = finalScore > 0 && finalScore > oldBest;

        var gameOverData = {
          maxDigits:   finalMax,
          score:       finalScore,
          basePoints:  basePointsRef.current,
          speedBonus:  speedBonusRef.current,
          inputBonus:  inputBonusRef.current,
          streakBonus: streakBonusRef.current,
          isNewRecord: isNewRecord,
          rounds:      roundRef.current
        };

        if (finalScore > 0) {
          var promises = [submitScore(uid, player.name, finalScore, finalMax)];
          if (isNewRecord) {
            promises.push(updateBestScore(uid, finalScore, finalMax));
          }
          Promise.all(promises).then(function() {
            onGameOver(gameOverData);
          }).catch(function() {
            onGameOver(gameOverData);
          });
        } else {
          setTimeout(function() {
            onGameOver(gameOverData);
          }, 1800);
        }

      } else {
        setTimeout(function() {
          roundRef.current = roundRef.current + 1;
          setRound(roundRef.current);
          startRound();
        }, 1800);
      }
    }
  }

  var n          = displayDigits || 1;
  var availW     = Math.min(window.innerWidth, 480) - 40;
  var gap        = 10;
  var cardW      = Math.min(88, Math.floor((availW - gap * (n - 1)) / n));
  var cardH      = Math.round(cardW * 1.18);
  var cardFont   = Math.round(cardW * 0.58);
  var slotW      = Math.min(66, Math.floor((availW - gap * (n - 1)) / n));
  var slotH      = Math.round(slotW * 1.22);
  var slotFont   = Math.round(slotW * 0.56);
  var inputPct   = inputMaxTime > 0 ? (inputTimeLeft / inputMaxTime) * 100 : 0;
  var inputColor = inputPct > 60 ? "#22C55E" : inputPct > 30 ? "#EAB308" : "#EF4444";
  var curShowTime= getShowTime(displayDigits, diffMod);
  var speedColor = curShowTime < 2000 ? "#EF4444" : curShowTime < 3000 ? "#EAB308" : "#22C55E";

  return (
    <div className="screen game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={function() { audio.plop(); onMenu(); }}>←</button>
        <div className="player-name">👤 {player && player.name}</div>
        <div className="round-num">Ronde {round}</div>
      </div>

      <div className="level-row">
        <span className="level-label">Niveau</span>
        <div className="digit-bubble">{displayDigits}</div>
        <span className="level-label">cijfers</span>
        <div className="speed-badge" style={{color: speedColor}}>
          ⚡ {(curShowTime/1000).toFixed(1)}s
        </div>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar" style={{width: (wins / winsUp * 100) + "%"}} />
      </div>

      <div className="streak-row">
        {Array.from({length: winsUp}, function(_, i) {
          return <span key={i}>{i < wins ? "⭐" : "☆"}</span>;
        })}
        <span className="streak-hint">{wins}/{winsUp} voor level</span>
        <span className="score-badge">🏆 {scoreTotal}</span>
        {streak >= 3 && <span className="fire-badge">🔥{streak}</span>}
      </div>

      <div className="display-area">
        {phase === "countdown" && (
          <div className="countdown">
            <div className="cd-num" style={{
              color: CD_COLORS[cdCount - 1],
              textShadow: "0 0 80px " + CD_COLORS[cdCount - 1],
              animation: cdAnim ? "cdPop 0.18s ease" : "none"
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
                    boxShadow: isActive
                      ? "0 0 40px " + COLORS[i % COLORS.length][0] + "88"
                      : "none"
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
            {phase === "input" && (
              <div className="input-timer-wrap">
                <div className="input-timer-bar" style={{
                  width: inputPct + "%",
                  background: inputColor,
                  boxShadow: "0 0 10px " + inputColor
                }} />
              </div>
            )}
            {phase === "fb" && (
              <div className="feedback-msg"
                style={{color: fb === "ok" ? "#4ADE80" : "#F87171"}}>
                {fbMsg}
              </div>
            )}
          </div>
        )}
      </div>

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
