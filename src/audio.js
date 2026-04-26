function createAudio() {
  var ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, type, start, dur, vol, fade) {
    if (vol === undefined) vol = 0.3;
    if (fade === undefined) fade = true;
    var c = getCtx();
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(vol, c.currentTime + start);
    if (fade) gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.01);
  }

  return {
    tick: function() { tone(880, "sine", 0, 0.07, 0.28); },
    tock: function() { tone(660, "sine", 0, 0.07, 0.22); },
    pop:  function() { tone(440, "sine", 0, 0.03, 0.2, false); tone(660, "sine", 0, 0.09, 0.15); },
    plop: function() { tone(320, "sine", 0, 0.12, 0.2); tone(220, "sine", 0.05, 0.09, 0.12); },
    boing: function() {
      var freqs = [[80,0,0.6,0.5],[160,0.02,0.55,0.4],[300,0.06,0.6,0.35],
                   [500,0.1,0.65,0.3],[800,0.15,0.7,0.25],[1100,0.2,0.75,0.2],
                   [1500,0.27,0.8,0.14],[2000,0.35,0.7,0.09],[2600,0.42,0.6,0.05]];
      for (var i = 0; i < freqs.length; i++) {
        tone(freqs[i][0], "sine", freqs[i][1], freqs[i][2], freqs[i][3]);
      }
    },
    buzz: function() {
      var freqs = [[160,0],[130,0.06],[110,0.12]];
      for (var i = 0; i < freqs.length; i++) {
        tone(freqs[i][0], "sawtooth", freqs[i][1], 0.07, 0.28);
      }
    },
    levelUp: function() {
      var freqs = [[523,0],[659,0.1],[784,0.2],[1047,0.3]];
      for (var i = 0; i < freqs.length; i++) {
        tone(freqs[i][0], "sine", freqs[i][1], 0.25, 0.3);
      }
    },
    whoosh: function() {
      var c = getCtx();
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.22);
      gain.gain.setValueAtTime(0.001, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, c.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.32);
    }
  };
}

export var audio = createAudio();

export function vibrate(type) {
  if (!navigator.vibrate) return;
  if (type === "ok") navigator.vibrate([10, 20, 10]);
  else if (type === "bad") navigator.vibrate([60, 40, 60]);
  else navigator.vibrate(10);
}
