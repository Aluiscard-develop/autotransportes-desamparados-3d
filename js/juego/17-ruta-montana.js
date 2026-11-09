// js/juego/17-ruta-montana.js · RUTA DE MONTAÑA A VARA BLANCA (150 km): curvas, precipicios, bombas, volcanes y puente.
// Parte 17 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// ===================== RUTA DE MONTAÑA A VARA BLANCA (150 km) =====================
// Se entra por la carretera a Vara Blanca (después de la presa) o desde el menú ("Inicio: Ruta de montaña").
// El camino (150 km) se calcula una vez y se dibuja por pedazos de 200 m alrededor del bus.
// Tiene curvas, muchas subidas, precipicios (con y sin barandas), volcanes, parques nacionales, bombas
// para echar gasolina y, en el km 44, el peligroso puente de madera del Río Caliente.
// Para no perder precisión con números enormes, el mundo se "re-centra" cerca del bus cada 1.5 km.
const MT = { PASO: 5, LARGO: 150000, W: 4.2, ZB: 60000 },
  MN = MT.LARGO / MT.PASO + 1,
  MPX = new Float64Array(MN),
  MPZ = new Float64Array(MN),
  MPH = new Float64Array(MN),
  MPT = new Float64Array(MN),
  mSm = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  },
  PUENTE = { s0: 44000, s1: 44130, h: 72 }, // km 44: Puente del Río Caliente
  M_BOMBAS = [...Array(15)].map((_, n) => 8000 + n * 10000),
  M_PARQUES = [
    { s: 4000, f: 14000, n: "PARQUE NACIONAL BRAULIO CARRILLO" },
    { s: 16000, f: 26000, n: "PARQUE NACIONAL VOLCÁN POÁS" },
    { s: 62000, f: 76000, n: "PARQUE NACIONAL TAPANTÍ" },
    { s: 82000, f: 94000, n: "PARQUE NACIONAL VOLCÁN IRAZÚ" },
    { s: 100000, f: 112000, n: "PARQUE NACIONAL JUAN CASTRO BLANCO" },
    { s: 132000, f: 147000, n: "PARQUE NACIONAL VOLCÁN ARENAL" },
  ],
  M_VOLCANES = [
    { s: 20500, n: "Volcán Poás", lat: -780, tipo: "lago" },
    { s: 52000, n: "Volcán Barva", lat: 720, tipo: "dormido" },
    { s: 88000, n: "Volcán Irazú", lat: -820, tipo: "dormido" },
    { s: 121000, n: "Volcán Turrialba", lat: 760, tipo: "activo" },
    { s: 140000, n: "Volcán Arenal", lat: -680, tipo: "cono" },
  ];
// el camino: rumbo con curvas suaves (siempre avanza) y alturas con subidas y bajadas
(function () {
  const rumbo = (s) =>
      0.55 * Math.sin(s / 820 + 0.4) +
      0.35 * Math.sin(s / 310 + 1.3) +
      0.22 * Math.sin(s / 123 + 2.2) +
      0.1 * Math.sin(s / 2900),
    rumboPuente = rumbo(PUENTE.s0 - 100);
  let x = 0,
    z = 0;
  for (let i = 0; i < MN; i++) {
    const s = i * MT.PASO,
      recto = mSm(PUENTE.s0 - 250, PUENTE.s0 - 100, s) * (1 - mSm(PUENTE.s1 + 100, PUENTE.s1 + 250, s)),
      th = rumbo(s) * (1 - recto) + rumboPuente * recto;
    MPT[i] = th;
    MPX[i] = x;
    MPZ[i] = z;
    x += Math.cos(th) * MT.PASO;
    z += Math.sin(th) * MT.PASO;
    let h = 85 + 50 * Math.sin(s / 2100 + 0.3) + 30 * Math.sin(s / 700 + 2.1) + 10 * Math.sin(s / 240 + 0.7);
    h = 20 + (h - 20) * mSm(0, 700, s) * (1 - mSm(MT.LARGO - 700, MT.LARGO, s));
    const p = mSm(PUENTE.s0 - 500, PUENTE.s0 - 60, s) * (1 - mSm(PUENTE.s1 + 60, PUENTE.s1 + 500, s));
    MPH[i] = h * (1 - p) + PUENTE.h * p;
  }
})();
// lado de la montaña: k > 0 pared que sube, k < 0 precipicio, k ≈ 0 plano (bombas, parques, inicio y final)
function mPlano(s) {
  let e = mSm(250, 450, s) * (1 - mSm(MT.LARGO - 500, MT.LARGO - 300, s));
  for (const b of M_BOMBAS) e = Math.min(e, mSm(60, 160, Math.abs(s - b)));
  for (const p of M_PARQUES) e = Math.min(e, mSm(40, 120, Math.abs(s - p.s)));
  return e;
}
function mK(s, q) {
  let k =
    Math.max(-1, Math.min(1, 1.3 * Math.sin(s / 950 + 0.7) + 0.5 * Math.sin(s / 2600 + 1.9))) * mPlano(s);
  if (q > 0) k = -k;
  // miradores: del lado del volcán el terreno baja para que se vea completo
  for (const v of M_VOLCANES)
    if (Math.sign(v.lat) === q) {
      const w = 1 - mSm(1200, 2000, Math.abs(s - v.s));
      if (w > 0) k = k * (1 - w) - 0.85 * w;
    }
  const g = mSm(PUENTE.s0 - 420, PUENTE.s0 - 300, s) * (1 - mSm(PUENTE.s1 + 300, PUENTE.s1 + 420, s));
  return k * (1 - g) - g; // cañón del Río Caliente: precipicio a los dos lados
}
const M_LAT = [0, 10, 50, 220, 800],
  M_CU = [
    [0.45, 0.43, 0.4],
    [0.5, 0.48, 0.45],
    [0.38, 0.45, 0.3],
    [0.3, 0.42, 0.25],
    [0.32, 0.45, 0.26],
  ],
  M_CD = [
    [0.45, 0.43, 0.4],
    [0.4, 0.38, 0.33],
    [0.32, 0.45, 0.25],
    [0.28, 0.42, 0.22],
    [0.32, 0.45, 0.26],
  ];
const mAlt = (h, k) =>
  k >= 0
    ? [h, h + 25 * k, h + 90 * k, h + 160 * k, 0]
    : [h, h * (1 + 0.65 * k), h * (1 + 0.95 * k), h * (1 + k), 0];
function mTerrY(i, q, lat) {
  const hs = mAlt(MPH[i], mK(i * MT.PASO, q)),
    d = lat - MT.W;
  for (let j = 1; j < M_LAT.length; j++)
    if (d <= M_LAT[j])
      return hs[j - 1] + ((hs[j] - hs[j - 1]) * (d - M_LAT[j - 1])) / (M_LAT[j] - M_LAT[j - 1]);
  return 0;
}
const mHash = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const mEnPuente = (s) => s > PUENTE.s0 + 2 && s < PUENTE.s1 - 2;
// barandas: siempre en el cañón (menos en el puente); en el resto, solo en algunos tramos con precipicio
function mBaranda(s, q) {
  if (s > PUENTE.s0 - 8 && s < PUENTE.s1 + 8) return false;
  if (s > PUENTE.s0 - 420 && s < PUENTE.s1 + 420) return true;
  return mK(s, q) < -0.3 && mHash(Math.floor(s / 200) * 2 + (q > 0 ? 1 : 0)) > 0.35;
}
// punto del camino desplazado a un lado (lat > 0 = derecha según el sentido de marcha), relativo al origen O
function mPunto(i, lat, y, O) {
  const th = MPT[i];
  return [MPX[i] - Math.sin(th) * lat - O[0], y, MPZ[i] + Math.cos(th) * lat - O[1]];
}
const mYaw = (i) => Math.atan2(-Math.cos(MPT[i]), -Math.sin(MPT[i])); // para que un objeto "mire" hacia quien viene
function malla(rows, fcol, fcolor, fuv) {
  const pos = [],
    col = [],
    uv = [],
    idx = [];
  let nc = 0;
  rows.forEach((i, r) => {
    const c = fcol(i);
    nc = c.length;
    c.forEach((p, j) => {
      pos.push(...p);
      if (fcolor) col.push(...fcolor(i, j));
      if (fuv) uv.push(...fuv(i, j));
    });
    if (r)
      for (let j = 0; j < nc - 1; j++) {
        const a = (r - 1) * nc + j,
          b = a + 1,
          c2 = r * nc + j,
          d = c2 + 1;
        idx.push(a, c2, b, b, c2, d);
      }
  });
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  if (fcolor) g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  if (fuv) g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const mRoadM = new T.MeshStandardMaterial({ map: vbTex, roughness: 0.85, side: T.DoubleSide }),
  mTerrM = new T.MeshStandardMaterial({ map: nz, vertexColors: true, roughness: 1, side: T.DoubleSide }),
  mRailM = new T.MeshStandardMaterial({
    color: 0xc9ced3,
    metalness: 0.7,
    roughness: 0.35,
    side: T.DoubleSide,
  }),
  mPostM = M(0x8a8f94),
  mPostG = new T.BoxGeometry(0.15, 1, 0.15),
  mMaderaM = M(0x8a5a32),
  mMaderaOscM = M(0x5e3b20),
  mSogaM = M(0xb08a55),
  mRocaM = M(0x6d625a),
  mRioM = new T.MeshStandardMaterial({
    color: 0x3d9db0,
    roughness: 0.15,
    metalness: 0.2,
    emissive: 0x0b2b33,
  });
[
  mRoadM,
  mTerrM,
  mRailM,
  mPostM,
  mPostG,
  mMaderaM,
  mMaderaOscM,
  mSogaM,
  mRocaM,
  mRioM,
  smT,
  nz,
  vbTex,
  ROCA_G,
  ...ROCA_M,
].forEach((o) => COMPARTIDO.add(o));
Object.values(TG).forEach((o) => COMPARTIDO.add(o));
[TM.tr, TM.pt, TM.nut, ...TM.lv, ...TM.pl].forEach((o) => COMPARTIDO.add(o));
const avisoTex = (l1, l2, l3) =>
  cv(256, 256, (x) => {
    x.fillStyle = "#111";
    x.beginPath();
    x.moveTo(128, 2);
    x.lineTo(254, 128);
    x.lineTo(128, 254);
    x.lineTo(2, 128);
    x.fill();
    x.fillStyle = "#f2c200";
    x.beginPath();
    x.moveTo(128, 13);
    x.lineTo(243, 128);
    x.lineTo(128, 243);
    x.lineTo(13, 128);
    x.fill();
    x.fillStyle = "#111";
    x.textAlign = "center";
    x.font = "bold 28px system-ui,Arial";
    x.fillText(l1, 128, 100);
    x.fillText(l2, 128, 138);
    x.fillText(l3, 128, 176);
  });
// rótulo en un poste al lado del camino
function mRotulo(g, O, i, lat, tex, w, h, alto = 3) {
  const P = mPunto(i, lat, MPH[i] + alto, O),
    pl = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 }),
    );
  pl.position.set(...P);
  pl.rotation.y = mYaw(i);
  const poste = mm(0.15, alto, 0.15, 0x777777, P[0], P[1] - alto / 2, P[2]);
  g.add(pl, poste);
}
const MONT = {
  on: false,
  ox: 0,
  oz: 0,
  i: 0,
  s: 0,
  lugar: "",
  pedazos: new Map(),
  humos: [],
  vistos: new Set(),
  segura: 0,
  caidaT: 0,
  cayendo: false,
  cruje: 0,
  puente: null,
  carga: 0,
};
// volcanes
function mVolcan(v) {
  const g = new T.Group(),
    cono = v.tipo === "cono",
    rt = cono ? 40 : 95,
    rb = cono ? 520 : 620,
    hh = cono ? 700 : 460,
    ge = new T.CylinderGeometry(rt, rb, hh, 32, 10, true),
    p = ge.attributes.position,
    col = [],
    c = new T.Color(),
    sd = R(0, 10);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      t = (y + hh / 2) / hh,
      n = 1 + 0.07 * Math.sin(Math.atan2(z, x) * 7 + sd) * (1 - t) + 0.04 * Math.sin(y * 0.05 + sd);
    p.setX(i, x * n);
    p.setZ(i, z * n);
    if (t < 0.25) c.setRGB(0.2, 0.34, 0.17);
    else if (t < 0.6) c.setRGB(0.3, 0.24, 0.2).lerp(new T.Color(0.2, 0.34, 0.17), ((0.6 - t) / 0.35) * 0.6);
    else c.setRGB(0.2, 0.18, 0.18).lerp(new T.Color(0.3, 0.24, 0.2), Math.max(0, (0.8 - t) / 0.2));
    col.push(c.r, c.g, c.b);
  }
  ge.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  ge.computeVertexNormals();
  const m = new T.Mesh(
    ge,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: T.DoubleSide }),
  );
  m.position.y = hh / 2 - 3;
  g.add(m);
  const crater = new T.Mesh(
    new T.CircleGeometry(rt * 0.97, 24),
    v.tipo === "lago"
      ? new T.MeshStandardMaterial({ color: 0x4fd1c5, emissive: 0x0a5550, roughness: 0.1 })
      : v.tipo === "dormido"
        ? M(0x3a3330)
        : new T.MeshBasicMaterial({ color: 0xff6a10 }),
  );
  crater.rotation.x = -Math.PI / 2;
  crater.position.y = hh - 6;
  g.add(crater);
  if (v.tipo === "activo" || v.tipo === "cono") {
    const brillo = new T.Sprite(
      new T.SpriteMaterial({
        map: gTex,
        color: 0xff5a10,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8,
      }),
    );
    brillo.scale.setScalar(rt * 5);
    brillo.position.y = hh;
    g.add(brillo);
  }
  // fumarola: humo (o vapor del lago) que sube y se deshace
  for (let k = 0; k < 8; k++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: smT,
        color: v.tipo === "lago" ? 0xffffff : v.tipo === "dormido" ? 0xcfcfcf : 0x8a8580,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    sp.position.set(R(-rt * 0.4, rt * 0.4), hh, R(-rt * 0.4, rt * 0.4));
    g.add(sp);
    MONT.humos.push({
      m: sp,
      y0: hh,
      t: k / 8,
      alto: v.tipo === "dormido" ? 120 : 300,
      ancho: rt * 1.4,
      vel: 0.05,
    });
  }
  return g;
}
// el puente de madera del Río Caliente
function mPuente(O) {
  const i0 = PUENTE.s0 / MT.PASO,
    i1 = PUENTE.s1 / MT.PASO,
    a = mPunto(i0, 0, PUENTE.h, O),
    b = mPunto(i1, 0, PUENTE.h, O),
    L = Math.hypot(b[0] - a[0], b[2] - a[2]),
    g = new T.Group(),
    tablero = new T.Group();
  g.position.set((a[0] + b[0]) / 2, PUENTE.h, (a[2] + b[2]) / 2);
  g.rotation.y = mYaw(i0);
  g.add(tablero);
  // tablas (algunas faltan: ¡cuidado!)
  const n = Math.floor(L / 0.6),
    tablas = new T.InstancedMesh(new T.BoxGeometry(4.8, 0.14, 0.5), mMaderaM, n),
    m4 = new T.Matrix4(),
    q = new T.Quaternion(),
    e = new T.Euler();
  let c = 0;
  for (let k = 0; k < n; k++) {
    if (k > 6 && k < n - 6 && Math.random() < 0.07) continue;
    e.set(R(-0.02, 0.02), R(-0.05, 0.05), R(-0.02, 0.02));
    q.setFromEuler(e);
    m4.compose(
      new T.Vector3(R(-0.1, 0.1), -0.07 + R(-0.03, 0.03), -L / 2 + k * 0.6 + 0.3),
      q,
      new T.Vector3(1, 1, 1),
    );
    tablas.setMatrixAt(c++, m4);
  }
  tablas.count = c;
  tablas.frustumCulled = false;
  tablas.receiveShadow = true;
  tablero.add(tablas);
  [-2.1, 2.1].forEach((x) => tablero.add(mm(0.3, 0.3, L, 0x5e3b20, x, -0.3, 0)));
  // sogas de las barandas y colgantes
  const soga = (pts, r) => {
    const t = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, r, 5), mSogaM);
    return t;
  };
  [-2.45, 2.45].forEach((x) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const z = -L / 2 + (k / 24) * L,
        u = (2 * z) / L;
      pts.push(new T.Vector3(x, 1.15 - 0.35 * (1 - u * u), z));
    }
    tablero.add(soga(pts, 0.05));
    for (let z = -L / 2 + 3; z < L / 2; z += 3) {
      const u = (2 * z) / L;
      tablero.add(mm(0.04, 1.15 - 0.35 * (1 - u * u), 0.04, 0xb08a55, x, (1.15 - 0.35 * (1 - u * u)) / 2, z));
    }
    // cable principal entre las torres
    const pc = [];
    for (let k = 0; k <= 24; k++) {
      const z = -L / 2 - 1 + (k / 24) * (L + 2),
        u = (2 * z) / (L + 2);
      pc.push(new T.Vector3(x * 1.06, 7.6 - 6 * (1 - u * u), z));
    }
    g.add(soga(pc, 0.09));
  });
  // torres de troncos con el rótulo
  const tex = S("PUENTE DEL RÍO CALIENTE", 512, 80, "#5e3b20", "#ffe9b0", 40);
  [-1, 1].forEach((lado) => {
    const z = lado * (L / 2 + 1);
    [-2.7, 2.7].forEach((x) => {
      const t = new T.Mesh(new T.CylinderGeometry(0.3, 0.38, 9, 8), mMaderaOscM);
      t.position.set(x, 3.5, z);
      t.castShadow = true;
      g.add(t);
    });
    g.add(mm(6.2, 0.45, 0.45, 0x5e3b20, 0, 7.8, z));
    const r = new T.Mesh(
      new T.PlaneGeometry(4.8, 0.75),
      new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide }),
    );
    r.position.set(0, 7.1, z + lado * 0.3);
    g.add(r);
  });
  // el río caliente abajo, con vapor
  const rio = new T.Group(),
    agua = new T.Mesh(new T.PlaneGeometry(1400, 26), mRioM);
  agua.rotation.x = -Math.PI / 2;
  rio.add(agua);
  rio.position.set(g.position.x, 0.4, g.position.z);
  rio.rotation.y = g.rotation.y;
  for (let k = 0; k < 14; k++) {
    const r = new T.Mesh(ROCA_G, pk_(ROCA_M));
    r.scale.setScalar(R(1, 3));
    r.position.set(R(-300, 300), 0.3, (Math.random() < 0.5 ? -1 : 1) * R(13, 18));
    rio.add(r);
  }
  for (let k = 0; k < 12; k++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({ map: smT, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 }),
    );
    sp.position.set(R(-80, 80), 1, R(-8, 8));
    rio.add(sp);
    MONT.humos.push({ m: sp, y0: 1, t: k / 12, alto: 45, ancho: 14, vel: 0.12 });
  }
  return { g, tablero, rio };
}
// pared de roca que cierra el cañón a cada lado del puente
function mParedCanon(i, O) {
  const pos = [],
    idx = [];
  const lats = [];
  for (const q of [-1, 1]) {
    const hs = mAlt(MPH[i], mK(i * MT.PASO, q));
    M_LAT.forEach((l, j) => lats.push([q * (MT.W + l), hs[j]]));
  }
  lats.sort((a, b) => a[0] - b[0]);
  lats.forEach(([l, y], k) => {
    pos.push(...mPunto(i, l, y, O), ...mPunto(i, l, 0, O));
    if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k);
  });
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x9a8a78, roughness: 1, side: T.DoubleSide }));
}
// un pedazo de 200 m del camino con todo lo que hay alrededor
function mPedazo(c) {
  const i0 = c * 40,
    i1 = Math.min(MN - 1, i0 + 40);
  if (i0 >= MN - 1 || c < 0) return null;
  const O = [MPX[i0], MPZ[i0]],
    g = new T.Group(),
    filas = [];
  for (let i = i0; i <= i1; i++) filas.push(i);
  const tramos = (pred) => {
    const out = [];
    let cur = null;
    filas.forEach((i) => {
      if (pred(i)) {
        if (!cur) out.push((cur = []));
        cur.push(i);
      } else cur = null;
    });
    return out.filter((r) => r.length > 1);
  };
  for (const r of tramos((i) => !mEnPuente(i * MT.PASO))) {
    const carretera = new T.Mesh(
      malla(
        r,
        (i) => [mPunto(i, -MT.W, MPH[i] + 0.06, O), mPunto(i, MT.W, MPH[i] + 0.06, O)],
        null,
        (i, j) => [j, (i * MT.PASO) / 12],
      ),
      mRoadM,
    );
    carretera.receiveShadow = true;
    g.add(carretera);
    for (const q of [-1, 1]) {
      const t = new T.Mesh(
        malla(
          r,
          (i) => {
            const hs = mAlt(MPH[i], mK(i * MT.PASO, q));
            return M_LAT.map((l, j) => mPunto(i, q * (MT.W + l), hs[j], O));
          },
          (i, j) => (mK(i * MT.PASO, q) >= 0 ? M_CU : M_CD)[j],
          (i, j) => [j * 3, (i * MT.PASO) / 20],
        ),
        mTerrM,
      );
      t.receiveShadow = true;
      g.add(t);
    }
  }
  // barandas
  for (const q of [-1, 1])
    for (const r of tramos((i) => mBaranda(i * MT.PASO, q))) {
      const b = new T.Mesh(
        malla(r, (i) => [
          mPunto(i, q * (MT.W + 0.15), MPH[i] + 0.45, O),
          mPunto(i, q * (MT.W + 0.15), MPH[i] + 0.95, O),
        ]),
        mRailM,
      );
      b.castShadow = true;
      g.add(b);
      const postes = new T.InstancedMesh(mPostG, mPostM, Math.ceil(r.length / 2)),
        m4 = new T.Matrix4();
      r.forEach((i, n) => {
        if (n % 2 == 0)
          postes.setMatrixAt(n / 2, m4.makeTranslation(...mPunto(i, q * (MT.W + 0.15), MPH[i] + 0.5, O)));
      });
      postes.frustumCulled = false;
      g.add(postes);
    }
  // árboles (bosque espeso en los parques nacionales) y montañas de fondo
  const sMed = (i0 + 20) * MT.PASO,
    parque = M_PARQUES.find((p) => sMed >= p.s && sMed <= p.f),
    nArb = parque ? 34 : 12;
  for (let k = 0; k < nArb; k++) {
    const i = i0 + ((Math.random() * (i1 - i0)) | 0),
      q = Math.random() < 0.5 ? -1 : 1,
      lat = MT.W + R(13, parque ? 120 : 200),
      s = i * MT.PASO;
    if (s > PUENTE.s0 - 60 && s < PUENTE.s1 + 60) continue;
    const t = tree();
    t.position.set(...mPunto(i, q * lat, mTerrY(i, q, lat), O));
    t.scale.setScalar(R(1.2, 2.4));
    g.add(t);
  }
  {
    const mt = mount(),
      kk = R(1.4, 2.8),
      q = Math.random() < 0.5 ? -1 : 1,
      i = i0 + 20;
    mt.scale.setScalar(kk);
    mt.position.set(
      ...mPunto(
        i,
        q * (MT.W + 300 + mt.userData.rb * kk + R(0, 400)),
        (mt.geometry.parameters.height * kk) / 2 - 4,
        O,
      ),
    );
    g.add(mt);
  }
  // kilómetros
  for (const i of filas)
    if (i > 0 && (i * MT.PASO) % 1000 === 0)
      mRotulo(
        g,
        O,
        i,
        MT.W + 1.3,
        S("KM " + (i * MT.PASO) / 1000, 128, 64, "#ffffff", "#111", 34),
        1.1,
        0.55,
        1.3,
      );
  const enPedazo = (s) => s >= i0 * MT.PASO && s < i1 * MT.PASO;
  // bombas de gasolina
  for (const b of M_BOMBAS)
    if (enPedazo(b)) {
      const i = b / MT.PASO,
        sg = new T.Group(),
        P = mPunto(i, MT.W + 8, MPH[i] + 0.04, O);
      sg.position.set(...P);
      sg.rotation.y = mYaw(i);
      const piso = new T.Mesh(new T.PlaneGeometry(14, 40), M(0x5a5d62));
      piso.rotation.x = -Math.PI / 2;
      sg.add(piso, mm(12, 0.5, 16, 0xf4f4f4, 0, 5.5, 0), mm(12.2, 0.3, 16.2, 0xd62828, 0, 5.15, 0));
      [-5, 5].forEach((x) => [-6, 6].forEach((z) => sg.add(mm(0.4, 5.2, 0.4, 0x999999, x, 2.6, z))));
      [-2.5, 2.5].forEach((x) =>
        sg.add(mm(0.9, 1.6, 0.6, 0xd62828, x, 0.8, 0), mm(0.92, 0.45, 0.62, 0xffffff, x, 1.45, 0)),
      );
      g.add(sg);
      mRotulo(
        g,
        O,
        i + 24,
        MT.W + 1.5,
        S("⛽ BOMBA · Km " + b / 1000, 256, 64, "#d62828", "#fff", 30),
        2.6,
        0.65,
        2.6,
      );
    }
  // portones de los parques nacionales
  for (const p of M_PARQUES)
    if (enPedazo(p.s)) {
      const i = p.s / MT.PASO,
        pg = new T.Group();
      pg.position.set(...mPunto(i, 0, MPH[i], O));
      pg.rotation.y = mYaw(i);
      [-1, 1].forEach((x) => {
        const t = new T.Mesh(new T.CylinderGeometry(0.4, 0.5, 8, 8), mMaderaOscM);
        t.position.set(x * (MT.W + 1.2), 4, 0);
        pg.add(t);
      });
      pg.add(mm(2 * MT.W + 4, 0.6, 0.6, 0x5e3b20, 0, 7.6, 0));
      const r = new T.Mesh(
        new T.PlaneGeometry(2 * MT.W + 1, 1.1),
        new T.MeshBasicMaterial({ map: S(p.n, 1024, 128, "#5e3b20", "#ffe9b0", 50), side: T.DoubleSide }),
      );
      r.position.set(0, 6.6, 0.32);
      pg.add(r);
      g.add(pg);
    }
  // volcanes (con un mirador en la orilla)
  for (const v of M_VOLCANES)
    if (enPedazo(v.s)) {
      const i = v.s / MT.PASO,
        vg = mVolcan(v);
      vg.position.set(...mPunto(i, v.lat, 0, O));
      g.add(vg);
      mRotulo(
        g,
        O,
        i - 10,
        Math.sign(v.lat) * (MT.W + 1.5),
        S("🌋 MIRADOR · " + v.n.toUpperCase(), 512, 80, "#0a5a2a", "#fff", 34),
        3.6,
        0.6,
        2.6,
      );
    }
  // el km 44: puente peligroso y avisos
  if (enPedazo(PUENTE.s0)) {
    MONT.puente = mPuente(O);
    g.add(MONT.puente.g, MONT.puente.rio);
    g.add(mParedCanon(PUENTE.s0 / MT.PASO, O), mParedCanon(PUENTE.s1 / MT.PASO, O));
  }
  if (enPedazo(PUENTE.s0 - 250)) {
    mRotulo(
      g,
      O,
      (PUENTE.s0 - 250) / MT.PASO,
      MT.W + 1.8,
      avisoTex("⚠ PUENTE", "PELIGROSO", "MÁX 20 km/h"),
      2.6,
      2.6,
      3.4,
    );
    mRotulo(
      g,
      O,
      (PUENTE.s0 - 150) / MT.PASO,
      MT.W + 1.8,
      S("RÍO CALIENTE · KM 44", 512, 80, "#0a6e3a", "#fff", 38),
      3.6,
      0.6,
      3,
    );
  }
  if (c === 0)
    mRotulo(
      g,
      O,
      12,
      MT.W + 1.8,
      S("RUTA DE MONTAÑA · VARA BLANCA → 150 km", 1024, 96, "#0a6e3a", "#fff", 44),
      6,
      0.6,
      3.2,
    );
  if (enPedazo(MT.LARGO - 300))
    mRotulo(
      g,
      O,
      (MT.LARGO - 300) / MT.PASO,
      MT.W + 1.8,
      S("🏁 META · 150 km", 512, 96, "#d62828", "#fff", 50),
      4,
      0.75,
      3.4,
    );
  return { g, O };
}
const montG = new T.Group();
montG.visible = false;
sc.add(montG);
function mColocar(p) {
  p.g.position.set(p.O[0] - MONT.ox, 0, MT.ZB + p.O[1] - MONT.oz);
}
function mQuitarPedazo(c) {
  const p = MONT.pedazos.get(c);
  if (!p) return;
  MONT.humos = MONT.humos.filter((h) => {
    let o = h.m;
    while (o && o !== p.g) o = o.parent;
    return !o;
  });
  if (MONT.puente && MONT.puente.g.parent === p.g) MONT.puente = null;
  liberar(p.g);
  MONT.pedazos.delete(c);
}
function mStream(s, todos) {
  const c0 = Math.floor((s - 400) / 200),
    c1 = Math.floor((s + 1400) / 200);
  for (const c of [...MONT.pedazos.keys()]) if (c < c0 - 1 || c > c1 + 1) mQuitarPedazo(c);
  let hechos = 0;
  for (let c = c0; c <= c1; c++)
    if (!MONT.pedazos.has(c) && (todos || hechos < 2)) {
      const p = mPedazo(c);
      if (!p) continue;
      montG.add(p.g);
      mColocar(p);
      MONT.pedazos.set(c, p);
      hechos++;
    }
}
const fundido = document.createElement("div");
fundido.style.cssText = "position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:8";
document.body.appendChild(fundido);
function mFundido() {
  fundido.style.transition = "none";
  fundido.style.opacity = 1;
  void fundido.offsetWidth;
  fundido.style.transition = "opacity .7s";
  fundido.style.opacity = 0;
}
// coloca el bus en el kilómetro s (carril derecho)
function mPonerBus(i, vel) {
  const th = MPT[i];
  MONT.ox = MPX[i];
  MONT.oz = MPZ[i];
  for (const p of MONT.pedazos.values()) mColocar(p);
  B.x = -Math.sin(th) * 1.9;
  B.z = MT.ZB + Math.cos(th) * 1.9;
  B.h = Math.atan2(-Math.cos(th), -Math.sin(th));
  B.y = MPH[i];
  B.v = vel;
  B.bal = 0;
  B.vy = 0;
  MONT.i = i;
  MONT.segura = i;
  cam.position.set(B.x - Math.cos(th) * 15, B.y + PV.ch, B.z - Math.sin(th) * 15);
  bus.position.set(B.x, B.y, B.z);
}
function montEntrar(s0, vel = 0) {
  if (MONT.on) return;
  MONT.on = true;
  if (chase) terminarPersecucion();
  cars.forEach((c) => liberar(c.o));
  cars.length = 0;
  wo.visible = rb.visible = water.visible = false;
  chunks.forEach((c) => (c.g.visible = false));
  if (stop) stop.g.visible = false;
  montG.visible = true;
  MONT.vistos.clear();
  MONT.cayendo = false;
  MONT.caidaT = 0;
  const i = Math.round(s0 / MT.PASO);
  mPonerBus(i, vel);
  mStream(s0, true);
  cam.far = 3200;
  cam.updateProjectionMatrix();
  mFundido();
  msg("⛰ Ruta de montaña a Vara Blanca · 150 km · ¡cuidado con los precipicios!", 4000);
}
function montSalir(alVB) {
  if (!MONT.on) return;
  MONT.on = false;
  for (const c of [...MONT.pedazos.keys()]) mQuitarPedazo(c);
  montG.visible = false;
  wo.visible = rb.visible = true;
  chunks.forEach((c) => (c.g.visible = true));
  if (stop) stop.g.visible = true;
  cam.far = 1500;
  cam.updateProjectionMatrix();
  if (alVB) {
    // de vuelta a la bajada de Vara Blanca, que lleva a la autopista
    vbVuelta = true;
    vbAviso = 1; // que no tape el mensaje del premio
    const p = VB[120];
    B.x = p.x;
    B.z = p.z;
    B.y = p.h;
    B.h = Math.atan2(-p.tx, -p.tz);
    B.v = 0;
    B.bal = 0;
    cam.position.set(B.x - p.tx * 15, B.y + PV.ch, B.z - p.tz * 15);
    if (stop) liberar(stop.g);
    st0 = Math.ceil(-B.z / 500) - si;
    stop = mkStop(si + st0);
    mFundido();
  }
}
// iniciar directo en la montaña desde el menú, y limpiar al reiniciar
const _startOriginal = start;
start = function () {
  montSalir(false);
  _startOriginal();
  if (sz == INICIO_MONTANA) montEntrar(60);
};
$("go").onclick = start;
let mAvisoBomba = 0;
function montTick(dt) {
  if (!MONT.on) return;
  // escena de montaña: niebla lejana para ver paisajes, sin recortes del suelo, sin agua
  sc.fog.near = 500;
  sc.fog.far = 2900;
  cp1.constant = 1e9;
  ground.visible = true;
  water.visible = false;
  wo.visible = rb.visible = false;
  // humo de volcanes y vapor del río
  for (const h of MONT.humos) {
    h.t = (h.t + dt * h.vel) % 1;
    const u = h.t;
    h.m.position.y = h.y0 + u * h.alto;
    h.m.scale.setScalar(h.ancho * (0.4 + u));
    h.m.material.opacity = 0.55 * Math.sin(Math.PI * u);
  }
  // re-centrar el mundo cerca del bus
  if (Math.abs(B.x) > 1500 || Math.abs(B.z - MT.ZB) > 1500) {
    const dx = B.x,
      dz = B.z - MT.ZB;
    MONT.ox += dx;
    MONT.oz += dz;
    B.x -= dx;
    B.z -= dz;
    cam.position.x -= dx;
    cam.position.z -= dz;
    bus.position.set(B.x, B.y, B.z);
    FX.forEach((p) => {
      p.m.position.x -= dx;
      p.m.position.z -= dz;
    });
    for (const p of MONT.pedazos.values()) mColocar(p);
  }
  // dónde está el bus en el camino
  const mx = B.x + MONT.ox,
    mz = B.z - MT.ZB + MONT.oz;
  let best = 1e18,
    bi = MONT.i,
    bt = 0;
  for (let i = Math.max(0, MONT.i - 60); i < Math.min(MN - 1, MONT.i + 60); i++) {
    const dx = MPX[i + 1] - MPX[i],
      dz = MPZ[i + 1] - MPZ[i],
      t = Math.max(0, Math.min(1, ((mx - MPX[i]) * dx + (mz - MPZ[i]) * dz) / (dx * dx + dz * dz))),
      d = (mx - MPX[i] - dx * t) ** 2 + (mz - MPZ[i] - dz * t) ** 2;
    if (d < best) {
      best = d;
      bi = i;
      bt = t;
    }
  }
  MONT.i = bi;
  const s = (bi + bt) * MT.PASO,
    h = MPH[bi] + (MPH[bi + 1] - MPH[bi]) * bt,
    th = MPT[bi],
    nx = -Math.sin(th),
    nz = Math.cos(th),
    qx = MPX[bi] + (MPX[bi + 1] - MPX[bi]) * bt,
    qz = MPZ[bi] + (MPZ[bi + 1] - MPZ[bi]) * bt,
    lat = (mx - qx) * nx + (mz - qz) * nz,
    q = Math.sign(lat) || 1,
    k = mK(s, q),
    enPuente = mEnPuente(s),
    kmh = Math.abs(B.v) * 3.6;
  MONT.s = s;
  mStream(s, false);
  // nombre del lugar y avisos
  const parque = M_PARQUES.find((p) => s >= p.s && s <= p.f),
    volcan = M_VOLCANES.find((v) => Math.abs(s - v.s) < 3000);
  MONT.lugar = parque ? parque.n.replace("PARQUE NACIONAL", "P.N.") : volcan ? volcan.n : "Ruta de montaña";
  const avisar = (clave, texto, ms = 3500) => {
    if (!MONT.vistos.has(clave)) {
      MONT.vistos.add(clave);
      msg(texto, ms);
    }
  };
  if (parque && s - parque.s < 300)
    avisar(
      parque.n,
      "🌳 Bienvenido al " + parque.n.toLowerCase().replace("parque nacional", "Parque Nacional"),
    );
  if (volcan && Math.abs(s - volcan.s) < 1300) avisar(volcan.n, "🌋 ¡" + volcan.n + " a la vista!");
  if (s > PUENTE.s0 - 400 && s < PUENTE.s0)
    avisar(
      "puente",
      "⚠ Km 44: Puente del Río Caliente. ¡Muy peligroso! Pasá despacio y por el centro",
      4500,
    );
  setH("stop", `⛰ <b>Km ${(s / 1000).toFixed(1)}</b> / 150 · ${MONT.lugar}`);
  hudExtra = "";
  // vaivén del puente
  if (MONT.puente) {
    const fuerza = enPuente ? 0.012 + 0.035 * Math.min(1, kmh / 40) : 0.006;
    MONT.puente.tablero.rotation.z = Math.sin(performance.now() / 600) * fuerza;
  }
  if (state != "play") return;
  // llegada a la meta
  if (s >= MT.LARGO - 60) {
    cash += 50000;
    msg("🏁 ¡Llegaste! 150 km de montaña a Vara Blanca · Premio ₡50 000", 5000);
    montSalir(true);
    return;
  }
  // caída al precipicio o al río: se vuelve a la carretera
  if (MONT.cayendo) {
    if (!B.bal && B.y < h - 3) {
      MONT.caidaT += dt;
      if (MONT.caidaT > 1.6) {
        MONT.cayendo = false;
        mPonerBus(MONT.segura, 0);
        mFundido();
        msg("🚑 De vuelta en la carretera", 2000);
      }
    }
    return;
  }
  // el ultraligero puede aterrizar en la carretera
  if (B.fl) {
    if (Math.abs(lat) < MT.W && B.y <= h + 0.5 && B.vy < 0) {
      B.fl = 0;
      B.y = h;
      B.vy = 0;
      msg(B.alaRota ? "🛬 Aterrizaste con el ala dañada · 🔧 ¡ya quedó arreglada!" : "🛬 Aterrizaste en la carretera", 2500);
      B.alaRota = 0;
    }
    return;
  }
  if (B.bal) return;
  const ancho = enPuente ? 2.4 : MT.W,
    baranda = !enPuente && mBaranda(s, q),
    pared = !enPuente && k > 0.15,
    plano = !enPuente && Math.abs(k) <= 0.15,
    limite = baranda ? MT.W - 0.5 - (PV.hw - 1) * 0.5 : pared ? MT.W + 0.3 : plano ? MT.W + 8 : ancho + 0.6;
  if (Math.abs(lat) > limite) {
    if (baranda || pared || plano) {
      // pared de roca, baranda o borde del plano: no te deja pasar
      const kk = q * limite - lat;
      B.x += nx * kk;
      B.z += nz * kk;
      dmg += Math.abs(B.v) * 0.35 * PV.dm * dt;
      B.v *= Math.pow(0.4, dt);
      shake = Math.max(shake, 0.25);
    } else {
      // ¡al vacío!
      MONT.cayendo = true;
      MONT.caidaT = 0;
      B.bal = 1;
      B.vy = 1;
      dmg += 30 * PV.dm;
      shake = 1;
      msg(enPuente ? "😱 ¡Te caíste del puente al Río Caliente!" : "😱 ¡Te caíste al precipicio!", 2500);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
      return;
    }
  }
  B.y = h;
  if (Math.abs(lat) < MT.W - 1 && !enPuente && s > 50) MONT.segura = bi;
  // pendiente: inclinación del vehículo y gravedad
  const fx = -Math.sin(B.h),
    fz = -Math.cos(B.h),
    al = fx * Math.cos(th) + fz * Math.sin(th),
    pend = (MPH[bi + 1] - MPH[bi]) / MT.PASO;
  cur.rotation.x += Math.atan(pend * al);
  B.v -= 9.8 * 0.55 * pend * al * dt;
  // el puente cruje si vas rápido; muy rápido, se quiebran las tablas
  if (enPuente) {
    if (kmh > 75) {
      MONT.cayendo = true;
      MONT.caidaT = 0;
      B.bal = 1;
      B.vy = 0;
      dmg += 30 * PV.dm;
      shake = 1;
      msg("💥 ¡Se quebraron las tablas del puente!", 2500);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
      return;
    }
    if (kmh > 25) {
      dmg += (kmh - 25) * 0.06 * PV.dm * dt;
      shake = Math.max(shake, 0.2 + (kmh - 25) * 0.01);
      MONT.cruje -= dt;
      if (MONT.cruje <= 0) {
        MONT.cruje = 2.5;
        msg("⚠ ¡El puente cruje! Pasá despacio (máx 20 km/h)", 2000);
      }
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
  }
  // bombas: detenete en la bomba para llenar el tanque
  const bomba = M_BOMBAS.find((b) => Math.abs(s - b) < 22);
  if (bomba != null && lat > MT.W + 1.5 && lat < MT.W + 15 && Math.abs(B.v) < 1.5 && fuel < 99) {
    mAvisoBomba += dt;
    if (mAvisoBomba > 2) {
      const cc = Math.round((100 - fuel) * 15);
      fuel = 100;
      heat = 0;
      nit = PV.nit;
      cash = Math.max(0, cash - cc);
      msg("⛽ Tanque lleno −₡" + cc, 2500);
      hiss();
      mAvisoBomba = 0;
    }
  } else mAvisoBomba = 0;
}
