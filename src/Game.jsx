import { useState, useEffect, useRef } from "react";
import { audio, vibrate } from "./audio.js";
import { saveScore } from "./firebase.js";

const COLORS = [
  ["#FF6B35","#FF8C42"],["#A855F7","#C084FC"],["#06B6D4","#22D3EE"],
  ["#EC4899","#F472B6"],["#22C55E","#4ADE80"],["#EAB308","#FDE047"],
  ["#3B82F6","#60A5FA"],["#F43F5E","#FB7185"]
];
const TIPS = ["Geweldig! 🎉","Briljant! 🧠","Perfect! ⭐","Top! 🚀","Wauw! 🔥","Super! 💪"];
const CD_COLORS = ["#EF4444","#F97316","#22C55E"];

function rndDigits(n) {
  var result = "";
  for (var i = 0; i < n; i++) result += Math.floor(Math.random() * 10);
  return result;
}

export default function Game({ player, onMenu, onGameOver, settings }) {
  var showTime  = (settings && settings.showTime)   || 2500;
  var winsUp    = (settings && settings.winsUp)     || 3;
  var failsDown = (settings && settings.failsDown)  || 2;
  var startD    = (settings && settings.startDigits)|| 2;
  var showMode  = (settings && settings.showMode)   || "together"; // "together" | "sequential"

  const [phase, setPhase]               = useState("countdown");
  const [cdCount, setCdCount]           = useState(3);
  const [cdAnim, setCdAnim]             = useState(true);
  const [seq, setSeq]                   = useState("");
  const [activeIdx, setActiveIdx]       = useState(-1);
  const [inp, setInp]                   = useState("");
  const [fb, setFb]                     = useState(null);
  const [fbMsg, setFbMsg]               = useState("");
  const [shake, setShake]               = useState(false);
  const [wins, setWins]                 = useState(0);
  const [fails, setFails]               = useState(0);
  const [round, setRound]               = useState(1);
  const [displayDigits, setDisplayDigits] = useState(startD);

  const digitsRef  = useRef(startD);
  const seqRef     = useRef("");
  const winsRef    = useRef(0);
  const failsRef   = useRef(0);
  const maxDRef    = useRef(startD);
  const tmr        = useRef(null);
  const cdTmr      = useRef(null);

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
    setPhase("countdown");
    setCdCount(3);
    setCdAnim(true);
    setInp("");
    setFb(null);
    setActiveIdx(-1);
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
          tmr.current = setTimeout(function() { setPhase("input"); }, showTime);
        }
      }
    }, 800);
  }

  async function revealSequential(s) {
    setPhase("show");
    for (var i = 0; i < s.length; i++) {
      setActiveIdx(i);
      audio.pop();
      vibrate();
      await new Promise(function(r) { setTimeout(r, 500); });
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
      setFb("ok");
      setFbMsg(TIPS[Math.floor(Math.random() * TIPS.length)]);
      setTimeout(function() { audio.boing(); }, 150);
      vibrate("ok");
      var nw = winsRef.current + 1;
      winsRef.current = nw;
      failsRef.current = 0;
      maxDRef.current = Math.max(maxDRef.current, digitsRef.current);
      setWins(nw);
      setFails(0);
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
      setFb("bad");
      setFbMsg("Helaas, het was " + seqRef.current + " 😅");
      audio.buzz();
      vibrate("bad");
      setShake(true);
      setTimeout(function() { setShake(false); }, 500);
      var nf = failsRef.current + 1;
      failsRef.current = nf;
      winsRef.current = 0;
      setFails(nf);
      setWins(0);
      if (nf >= failsDown) {
        if (digitsRef.current <= startD) {
          saveScore(player, maxDRef.current);
          setTimeout(function() { onGameOver(maxDRef.current); }, 1600);
        } else {
          setTimeout(function() {
            failsRef.current = 0;
            setFails(0);
            setRound(function(r) { return r + 1; });
            startRound(digitsRef.current - 1);
          }, 1600);
        }
      } else {
        setTimeout(function() {
          setRound(function(r) { return r + 1; });
          startRound();
        }, 1600);
      }
    }
  }

  var n = displayDigits || 1;
  var availW = Math.min(window.innerWidth, 480) - 40;
  var gap = 10;
  var cardW = Math.min(88, Math.floor((availW - gap * (n - 1)) / n));
  var cardH = Math.round(cardW * 1.18);
  var cardFont = Math.round(cardW * 0.58);
  var slotW = Math.min(66, Math.floor((availW - gap * (n - 1)) / n));
  var slotH = Math.round(slotW * 1.22);
  var slotFont = Math.round(slotW * 0.56);

  return (
    <div className="screen game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={function() { audio.plop(); onMenu(); }}>←</button>
        <div className="player-name">👤 {player}</div>
        <div className="round-num">Ronde {round}</div>
      </div>

      <div className="level-row">
        <span className="level-label">Niveau</span>
        <div className="digit-bubble">{displayDigits}</div>
        <span className="level-label">cijfers</span>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar" style={{width: (wins / winsUp * 100) + "%"}} />
      </div>

      <div className="streak-row">
        {Array.from({length: winsUp}, function(_, i) {
          return <span key={i}>{i < wins ? "⭐" : "☆"}</span>;
        })}
        <span className="streak-hint">{wins}/{winsUp} voor volgend level</span>
      </div>

      <div className="display-area">

        {phase === "countdown" && (
          <div className="countdown">
            <div className="cd-num" style={{
              color: CD_COLORS[cdCount - 1],
              textShadow: "0 0 60px " + CD_COLORS[cdCount - 1],
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
                  animation: "popIn 0.2s ease " + (i * 0.08) + "s backwards"
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
                <div key={i} className={"show-card" + (isActive ? " card-active" : " card-hidden")}
                  style={{
                    width: cardW, height: cardH, fontSize: cardFont,
                    borderRadius: Math.round(cardW * 0.2),
                    background: isActive
                      ? "linear-gradient(135deg," + COLORS[i % COLORS.length][0] + "," + COLORS[i % COLORS.length][1] + ")"
                      : "rgba(255,255,255,0.05)"
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
                  <div key={i} className={cls} style={{width: slotW, height: slotH, fontSize: slotFont}}>
                    {ch}
                  </div>
                );
              })}
            </div>
            {phase === "fb" && (
              <div className="feedback-msg" style={{color: fb === "ok" ? "#4ADE80" : "#F87171"}}>
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

      <div className="fail-row">
        {Array.from({length: failsDown}, function(_, i) {
          return <span key={i} style={{opacity: i < fails ? 1 : 0.2}}>❤️</span>;
        })}
      </div>
    </div>
  );
}
