// js/juego/12-menu.js · empezar (start), garaje y tuning, menú, guardar partida y gráficos (applyGfx).
// Parte 12 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

function start() {
  wallet += cash;
  cash = 0;
  save();
  const q = $("bs");
  if (q) {
    skin = +q.value;
    sz = +$("zs").value;
  }
  const zi = sz == INICIO_MONTANA ? 0 : sz; // zona donde aparece el bus
  audio();
  applyGfx();
  if (AC && AC.state == "suspended") AC.resume();
  fuel = 100;
  fuT = 0;
  fuW = 0;
  pullT = 0;
  heat = 0;
  hst = 0;
  onFire = false;
  raceOn = 0;
  st0 = 2 * zi;
  Object.assign(B, { y: 0, vy: 0, fl: 0, alaRota: 0, tk: 0, lv: 0, x: 5.25, z: -1000 * zi, h: 0, v: 0, st: 0 });
  RZ = zi ? -CICLO - 250 : -250;
  rbMsg = 0;
  rb.position.z = RZ;
  rb.updateMatrix();
  cyc = 0;
  wo.position.z = 0;
  wo.updateMatrix();
  tolled = 0;
  R2 = -7250;
  R3 = -11250;
  R4 = -12250;
  R5 = -23250;
  tbDone = 0;
  mlDone = 0;
  BN.forEach((b) => (b.d = 0));
  CZ = 0;
  BZ = -6500;
  trT = 10;
  trOn = 0;
  trHitT = 0;
  zPrev = -1;
  setVeh(skin);
  chunks.forEach(scatter);
  time = 90;
  cash = 0;
  pas = 0;
  dmg = 0;
  si = 0;
  shake = 0;
  cars.forEach((c) => liberar(c.o));
  cars.length = 0;
  if (stop) liberar(stop.g);
  stop = mkStop(st0);
  state = "play";
  nit = PV.nit;
  $("rs").style.display = "none";
  $("ovr").innerHTML = "";
  $("ov").style.display = "none";
  cam.position.set(3.5, 6, 15 - 1000 * zi);
}
function over(t) {
  state = "over";
  $("rs").style.display = "none";
  $("ov").style.display = "flex";
  $("ovr").innerHTML =
    `<h2>${t}</h2><p>Paradas completadas: <b>${si}</b> · Ganancias: <b>₡${cash.toLocaleString("es-CR")}</b></p>`;
}
$("go").onclick = start;
const VN = [
    "Bus ATD",
    "Bus Mercedes rojo",
    "Bus Mercedes blanco y amarillo",
    "Bus Busscar Porvenir",
    "Jeep todoterreno",
    "Tanque MCR",
    "Hot rod",
    "Tractor",
    "Moto de nieve",
    "Ultraligero",
    "Rover lunar",
    "Fórmula F1",
    "Camión de carreras",
    "Camión monstruo",
    "Auto de rally",
    "Oruga amarilla",
    "Aerodeslizador",
    "Crawler verde",
    "The Beast",
    "Convertible retro",
    "Moto de nieve PRO X",
    "Oruga turbo todoterreno",
  ],
  VI = [
    "🚌",
    "🚌",
    "🚌",
    "🚌",
    "🚙",
    "🪖",
    "🏎",
    "🚜",
    "🛷",
    "🪂",
    "🌙",
    "🏁",
    "🚛",
    "🦖",
    "🏎",
    "🐝",
    "🌊",
    "🦎",
    "🚀",
    "💖",
    "🔷",
    "🐲",
  ];
let gv = 0,
  gf = "*";
const keyOf = (i) => (esBus(i) ? 0 : i - 3);
function save() {
  try {
    localStorage.setItem("adg", JSON.stringify({ w: wallet, t: TUN }));
  } catch (e) {}
}
try {
  const d = JSON.parse(localStorage.getItem("adg") || "null");
  if (d) {
    wallet = d.w;
    d.t.forEach((o, i) => {
      if (TUN[i]) TUN[i] = o;
    });
  }
} catch (e) {}
const sts = (p) => [
  ["Aceleración", p.acc / 20],
  ["Velocidad", p.max / 60],
  ["Agarre", p.gp / 12],
  ["Frenos", p.br / 32],
  ["Manejo", p.turn / 1.5],
  ["Resistencia", 1 / p.dm / 2.5],
  ["Enfriamiento", 1 / p.hr / 3],
  ["Nitro", p.nit / 160],
  ["Ahorro", 1 / p.fc / 1.6],
];
function renderGar() {
  const k = keyOf(gv),
    base = PVS[k],
    tp = tuned(base, k),
    b0 = sts(Object.assign({}, base, { nit: 0 })),
    t0 = sts(tp);
  $("gar").innerHTML =
    `<div class="gh"><button id="gx">✕ Cerrar</button><b>🔧 TUNING</b><span>🪙 ₡${wallet.toLocaleString("es-CR")}</span></div>
<div class="gv"><button id="gl">◀</button><div class="gi">${VI[gv]}<div>${VN[gv]}</div></div><button id="gr">▶</button></div>
<div class="gs">${t0.map((r, i) => `<div class="sb"><span>${r[0]}</span><div><i style="width:${Math.min(100, b0[i][1] * 100)}%"></i><u style="width:${Math.min(100, Math.max(r[1], b0[i][1]) * 100)}%"></u></div></div>`).join("")}</div>
<div class="gt">${["*", "S", "A", "B", "C", "D", "E", "F"].map((t) => `<button class="tf${gf == t ? " on" : ""}" data-t="${t}" style="background:${t == "*" ? "#fff" : TC[t]}">${t == "*" ? "Todas" : t}</button>`).join("")}<button id="gz" class="tf" style="background:#ddd">↺ Resetear</button></div>
<div class="gg">${PARTS.filter((p) => gf == "*" || p.t == gf)
      .map((p) => {
        const l = TUN[k][p.id] | 0,
          c = TIERC[p.t] * (l + 1);
        return `<div class="gc" style="border-color:${TC[p.t]}"><div class="gtt" style="background:${TC[p.t]}">${p.t}</div><div class="ge">${p.e}</div><b>${p.n}</b><div class="pp">${"●".repeat(l) + "○".repeat(5 - l)}</div><small>${p.d}</small><button class="up" data-id="${p.id}" ${l >= 5 || wallet < c ? "disabled" : ""}>${l >= 5 ? "MÁX" : "⬆ ₡" + c.toLocaleString("es-CR")}</button></div>`;
      })
      .join("")}</div>`;
  const g = $("gar");
  g.querySelector("#gx").onclick = closeGarage;
  g.querySelector("#gl").onclick = () => {
    gv = (gv + VN.length - 1) % VN.length;
    $("bs").value = gv;
    renderGar();
  };
  g.querySelector("#gr").onclick = () => {
    gv = (gv + 1) % VN.length;
    $("bs").value = gv;
    renderGar();
  };
  g.querySelectorAll(".tf[data-t]").forEach(
    (d) =>
      (d.onclick = () => {
        gf = d.dataset.t;
        renderGar();
      }),
  );
  g.querySelector("#gz").onclick = () => {
    for (const p of PARTS) {
      const l = TUN[k][p.id] | 0;
      for (let i = 0; i < l; i++) wallet += Math.round(TIERC[p.t] * (i + 1) * 0.7);
    }
    TUN[k] = {};
    save();
    if (k == CK) PV = tuned(PB);
    renderGar();
  };
  g.querySelectorAll(".up").forEach(
    (d) =>
      (d.onclick = () => {
        const id = d.dataset.id,
          p = PARTS.find((x) => x.id == id),
          l = TUN[k][id] | 0,
          c = TIERC[p.t] * (l + 1);
        if (l < 5 && wallet >= c) {
          wallet -= c;
          TUN[k][id] = l + 1;
          save();
          if (k == CK) PV = tuned(PB);
          renderGar();
        }
      }),
  );
}
function openGarage() {
  if (state == "play") toggleMenu();
  wallet += cash;
  cash = 0;
  gv = +$("bs").value;
  gf = "*";
  save();
  $("gar").style.display = "block";
  renderGar();
}
function closeGarage() {
  $("gar").style.display = "none";
  PV = tuned(PB);
  save();
}
function resume() {
  state = "play";
  PV = tuned(PB);
  applyGfx();
  nit = Math.min(nit, PV.nit);
  $("ov").style.display = "none";
}
function toggleMenu() {
  if (state == "play") {
    state = "paused";
    if (E.g1) {
      E.g1.gain.value = 0;
      E.g3.gain.value = 0;
      E.g4.gain.value = 0;
    }
    $("bs").value = skin;
    $("zs").value = zoneAt(B.z);
    $("rs").style.display = "inline-block";
    $("ov").style.display = "flex";
  } else if (state == "paused") resume();
}
$("rs").onclick = resume;
$("mb").onclick = toggleMenu;
$("wb").onclick = openGarage;
$("tg").onclick = openGarage;
function applyGfx() {
  // sombras, resolución, distancia de vista y GQ: js/rendimiento.js (niveles en js/ajustes.js)
  CALIDAD.aplicar($("gq").value);
  RAIN = +$("wx").value;
  roadM.bumpMap = GQ ? nz : null;
  roadM.bumpScale = 0.9;
  roadM.envMap = null; // la carretera nunca usa reflejos: así se ve con color en cualquier dispositivo
  roadM.needsUpdate = true;
  ground.material.bumpMap = GQ ? nz : null;
  ground.material.bumpScale = 1.4;
  ground.material.needsUpdate = true;
}
$("gq").value = CALIDAD.eleccion;
applyGfx();
// Ya no se puede perder: si el vehículo se destroza, queda como nuevo y seguís manejando.
function end() {
  dmg = 0;
  onFire = false;
  heat = 0;
  shake = 0.6;
  msg("🔧 ¡Aquí nadie pierde! Tu vehículo quedó como nuevo", 2500);
}
