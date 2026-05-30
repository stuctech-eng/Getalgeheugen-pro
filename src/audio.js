function createAudio() {
  var ctx = null;
  var bgMusic = null;
  var bgGain = null;
  var musicEnabled = true;
  var sfxEnabled = true;

  // Laad volume prefs
  try {
    var prefs = JSON.parse(localStorage.getItem("gg_audio") || "{}");
    if (prefs.music === false) musicEnabled = false;
    if (prefs.sfx   === false) sfxEnabled   = false;
  } catch(e) {}

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function playMp3(file, volume, loop) {
    if (!sfxEnabled && !loop) return;
    if (!musicEnabled && loop) return;
    var audio = new Audio("/"+file);
    audio.volume = volume !== undefined ? volume : 0.7;
    if (loop) audio.loop = true;
    audio.play().catch(function() {});
    return audio;
  }

  function tone(freq, type, start, dur, vol, fade) {
    if (!sfxEnabled) return;
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

  var NOTE_FREQS = [330, 440, 550, 660, 770, 880, 990, 1100];

  return {
    // Achtergrondmuziek
    startMusic: function() {
      if (!musicEnabled) return;
      if (bgMusic) return;
      bgMusic = new Audio("/background.mp3");
      bgMusic.loop = true;
      bgMusic.volume = 0.25;
      bgMusic.play().catch(function() {});
    },
    stopMusic: function() {
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        bgMusic = null;
      }
    },
    setMusicEnabled: function(val) {
      musicEnabled = val;
      try { localStorage.setItem("gg_audio", JSON.stringify({music: musicEnabled, sfx: sfxEnabled})); } catch(e) {}
      if (!val) this.stopMusic();
    },
    setSfxEnabled: function(val) {
      sfxEnabled = val;
      try { localStorage.setItem("gg_audio", JSON.stringify({music: musicEnabled, sfx: sfxEnabled})); } catch(e) {}
    },
    getMusicEnabled: function() { return musicEnabled; },
    getSfxEnabled:   function() { return sfxEnabled; },

    // Geluidseffecten — MP3
    pop:     function() { if (sfxEnabled) playMp3("pop.mp3", 0.6); },
    boing:   function() { if (sfxEnabled) playMp3("boing.mp3", 0.7); },
    levelUp: function() { if (sfxEnabled) playMp3("levelup.mp3", 0.8); },
    correct: function() { if (sfxEnabled) playMp3("correct.mp3", 0.7); },
    wrong:   function() { if (sfxEnabled) playMp3("wrong.mp3", 0.7); },

    // Behouden via Web Audio (kort/snel)
    tick:    function() { tone(880, "sine", 0, 0.07, 0.28); },
    tock:    function() { tone(660, "sine", 0, 0.07, 0.22); },
    tapNote: function(pos, total) {
      var freq = NOTE_FREQS[Math.floor(pos / total * 4)];
      tone(freq, "sine", 0, 0.06, 0.18, true);
      tone(freq * 1.5, "sine", 0, 0.04, 0.08, true);
    },
    plop:    function() { tone(320, "sine", 0, 0.12, 0.2); tone(220, "sine", 0.05, 0.09, 0.12); },
    buzz:    function() {
      var freqs = [[160,0],[130,0.06],[110,0.12]];
      for (var i = 0; i < freqs.length; i++) {
        tone(freqs[i][0], "sawtooth", freqs[i][1], 0.07, 0.28);
      }
    },
    whoosh:  function() {
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
  if (type === "ok")  navigator.vibrate([10, 20, 10]);
  else if (type === "bad") navigator.vibrate([80, 40, 80]);
  else navigator.vibrate(8);
}
