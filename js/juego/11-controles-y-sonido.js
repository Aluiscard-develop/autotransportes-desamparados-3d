// js/juego/11-controles-y-sonido.js · estado del juego, teclado y botones táctiles, sonidos (motor, bocina, timbre).
// Parte 11 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// estado
const B = { x: 3.5, z: 0, h: 0, v: 0, st: 0 };
let state = "menu",
  time = 0,
  cash = 0,
  pas = 0,
  dmg = 0,
  si = 0,
  shake = 0,
  cm_ = 0,
  msgT = 0;
const keys = {};
addEventListener("keydown", (e) => {
  const k = e.code;
  keys[k] = 1;
  if (k == "Escape" || k == "KeyM") {
    toggleMenu();
    return;
  }
  if (e.key && e.key.length == 1) keys["Key" + e.key.toUpperCase()] = 1;
  if (AC && AC.state == "suspended") AC.resume();
  if (k == "KeyC") cm_ = (cm_ + 1) % 4;
  if (k == "KeyH") horn();
  if (k == "KeyR" && state != "menu") start();
  if ((state == "menu" || state == "over") && (k == "Enter" || k == "Space")) start();
  if (["Space", "ArrowUp", "ArrowDown"].includes(k)) e.preventDefault();
});
addEventListener("keyup", (e) => {
  keys[e.code] = 0;
  if (e.key && e.key.length == 1) keys["Key" + e.key.toUpperCase()] = 0;
});
addEventListener("blur", () => {
  for (const k in keys) keys[k] = 0;
});
document.querySelectorAll("[data-k]").forEach((b) => {
  const k = b.dataset.k;
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    keys[k] = 1;
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((v) => b.addEventListener(v, () => (keys[k] = 0)));
});
$("stop").addEventListener("click", () => (cm_ = (cm_ + 1) % 4));
let AC,
  E = {};
const GB = [0, 5, 9, 14, 20, 27, 40];
function audio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const mg = AC.createGain(),
      cp = AC.createDynamicsCompressor();
    mg.gain.value = 1;
    mg.connect(cp);
    cp.connect(AC.destination);
    const o1 = AC.createOscillator(),
      o2 = AC.createOscillator(),
      lp = AC.createBiquadFilter(),
      g1 = AC.createGain(),
      g2 = AC.createGain();
    o1.type = "sawtooth";
    o2.type = "square";
    lp.type = "lowpass";
    lp.Q.value = 2;
    g1.gain.value = 0;
    g2.gain.value = 0.5;
    o1.connect(lp);
    o2.connect(g2);
    g2.connect(lp);
    lp.connect(g1);
    g1.connect(mg);
    const nb = AC.createBuffer(1, AC.sampleRate, AC.sampleRate),
      d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = AC.createBufferSource();
    ns.buffer = nb;
    ns.loop = true;
    const bp = AC.createBiquadFilter(),
      g3 = AC.createGain();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    g3.gain.value = 0;
    ns.connect(bp);
    bp.connect(g3);
    g3.connect(mg);
    const tb = AC.createOscillator(),
      g4 = AC.createGain();
    g4.gain.value = 0;
    tb.connect(g4);
    g4.connect(mg);
    const rn = AC.createBufferSource(),
      hp = AC.createBiquadFilter(),
      rg = AC.createGain();
    rn.buffer = nb;
    rn.loop = true;
    hp.type = "highpass";
    hp.frequency.value = 1800;
    rg.gain.value = 0;
    rn.connect(hp);
    hp.connect(rg);
    rg.connect(mg);
    rn.start();
    E.rg = rg;
    o1.start();
    o2.start();
    ns.start();
    tb.start();
    Object.assign(E, { mg, o1, o2, lp, g1, g3, bp, tb, g4, nb, rpm: 650, g: 0, cut: 0 });
  } catch (e) {}
}
function hiss() {
  if (!AC || !E.nb) return;
  const s = AC.createBufferSource(),
    f = AC.createBiquadFilter(),
    g = AC.createGain(),
    t = AC.currentTime;
  s.buffer = E.nb;
  f.type = "highpass";
  f.frequency.value = 2500;
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  s.connect(f);
  f.connect(g);
  g.connect(E.mg);
  s.start(t);
  s.stop(t + 1);
}
// motor diésel trasero (tipo Mercedes-Benz 4 cil., Caio Apache S21): ralentí ~650 rpm, 6 cambios
function eng(G, play, dt) {
  if (!AC || !E.o1) return;
  const v = (Math.abs(B.v) * 32) / PV.max;
  let g = 0;
  for (let i = 1; i < 6; i++) if (v > GB[i]) g = i;
  if (PV.e) g = 0;
  if (E.o1.type != PV.w) E.o1.type = PV.w;
  if (g != E.g) {
    E.cut = 0.18;
    E.g = g;
  }
  const fr = Math.min(1, (v - GB[g]) / (GB[g + 1] - GB[g])),
    th = G && play ? 1 : 0;
  let tr = v < 0.5 ? PV.i + th * PV.r * 0.7 : PV.i + PV.r * 0.2 + fr * PV.r * 0.7 + th * PV.r * 0.1;
  if (E.cut > 0) {
    E.cut -= dt;
    tr -= 250;
  }
  E.rpm += (tr - E.rpm) * Math.min(1, dt * (tr > E.rpm ? 5 : 9));
  const f = (E.rpm / 60) * PV.c,
    t = AC.currentTime;
  E.o1.frequency.setTargetAtTime(f, t, 0.03);
  E.o2.frequency.setTargetAtTime(f / 2, t, 0.03);
  E.lp.frequency.setTargetAtTime(600 + E.rpm * 0.35 + th * 500, t, 0.05);
  E.g1.gain.setTargetAtTime(
    play ? (0.2 + 0.14 * th + (0.05 * (E.rpm - PV.i)) / PV.r) * (E.cut > 0 ? 0.35 : 1) : 0,
    t,
    0.05,
  );
  E.g3.gain.setTargetAtTime(play ? (0.04 + 0.08 * th) * (PV.nz || 1) * (E.rpm / (PV.i + PV.r)) : 0, t, 0.05);
  E.bp.frequency.setTargetAtTime(600 + E.rpm * 0.6, t, 0.05);
  E.tb.frequency.setTargetAtTime(1400 + E.rpm * 1.4, t, 0.1);
  E.g4.gain.setTargetAtTime(
    play ? ((th * Math.max(0, E.rpm - PV.i - PV.r * 0.25)) / PV.r) * 0.012 * (PV.tb || 1) : 0,
    t,
    0.1,
  );
  if (E.rg) E.rg.gain.setTargetAtTime(RAIN && state == "play" ? 0.07 : 0, t, 0.3);
}
function bell() {
  if (!AC) return;
  const t = AC.currentTime;
  [0, 0.28].forEach((d, i) => {
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = "sine";
    o.frequency.value = i ? 1175 : 1568;
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5);
    o.connect(g);
    g.connect(E.mg || AC.destination);
    o.start(t + d);
    o.stop(t + d + 0.55);
  });
}
function horn() {
  if (!AC) return;
  (PV.hf || [311, 392]).forEach((f) => {
    const o = AC.createOscillator();
    o.type = "square";
    o.frequency.value = f;
    const g = AC.createGain();
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(AC.destination);
    o.start();
    o.stop(AC.currentTime + 0.5);
  });
}
function msg(t, ms = 2200) {
  const m = $("msg");
  m.textContent = t;
  m.style.opacity = 1;
  msgT = ms / 1000;
}
