// js/juego/08-trafico.js · carros del tráfico (mkCar), ambulancia, accidentes, botes y paradas (mkStop).
// Parte 8 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// tráfico
const gm = new T.MeshStandardMaterial({
    color: 0x9fb8c8,
    metalness: 0.3,
    roughness: 0.05,
    transparent: true,
    opacity: 0.35,
  }),
  dk = new T.MeshStandardMaterial({ color: 0x111 });
const CG = {
    body: new T.BoxGeometry(1.9, 0.7, 4.3),
    cab: new T.BoxGeometry(1.62, 0.6, 2.2),
    roof: new T.BoxGeometry(1.58, 0.09, 1.85),
    sk: new T.BoxGeometry(1.96, 0.28, 4.05),
    bp: new T.BoxGeometry(1.94, 0.24, 0.2),
    hl: new T.BoxGeometry(0.4, 0.15, 0.06),
    gr: new T.BoxGeometry(0.8, 0.16, 0.04),
    tl: new T.BoxGeometry(1.6, 0.2, 0.1),
    mr: new T.BoxGeometry(0.22, 0.14, 0.08),
  },
  gm2 = new T.MeshStandardMaterial({
    color: 0x1b2733,
    metalness: 0.6,
    roughness: 0.06,
    envMap: ENV,
    envMapIntensity: 1.1,
    transparent: true,
    opacity: 0.88,
  }),
  hlM = new T.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 1 }),
  CPAL = [0xf4f4f4, 0xc0c4c8, 0x1c1c1e, 0x9b1b1b, 0x1e4fa3, 0x2d6b3e, 0xd9d2c0, 0x6a6e74, 0xe0a21a, 0x3a3a40];
// optimización: una sola pintura por color, compartida por todos los carros
const PINTURAS = new Map();
function pintura(c) {
  const k = c.getHex();
  if (!PINTURAS.has(k))
    PINTURAS.set(
      k,
      Object.assign(
        new T.MeshStandardMaterial({
          color: c,
          metalness: 0.35,
          roughness: 0.28,
          envMap: ENV,
          envMapIntensity: 0.7,
        }),
        { userData: { pintura: 1 } },
      ),
    );
  return PINTURAS.get(k);
}
function mkCar() {
  const g = new T.Group(),
    c =
      Math.random() < 0.75
        ? new T.Color(pk_(CPAL))
        : new T.Color().setHSL(Math.round(Math.random() * 12) / 12, 0.8, 0.5),
    pm = pintura(c);
  const a = new T.Mesh(CG.body, pm);
  a.position.y = 0.8;
  const b = new T.Mesh(CG.cab, gm2);
  b.position.set(0, 1.45, 0.25);
  const rf = new T.Mesh(CG.roof, pm);
  rf.position.set(0, 1.78, 0.3);
  const w = new T.Mesh(CG.sk, dk);
  w.position.y = 0.36;
  const l = new T.Mesh(CG.tl, tm);
  l.position.set(0, 0.95, 2.16);
  g.add(a, b, rf, w, l);
  [-2.2, 2.2].forEach((z) => {
    const bp = new T.Mesh(CG.bp, dk);
    bp.position.set(0, 0.55, z);
    g.add(bp);
  });
  const gr = new T.Mesh(CG.gr, dk);
  gr.position.set(0, 0.72, -2.17);
  g.add(gr);
  [-1, 1].forEach((q) => {
    const h = new T.Mesh(CG.hl, hlM),
      sp = new T.Sprite(glowM);
    sp.scale.setScalar(1.3);
    h.add(sp);
    h.position.set(q * 0.65, 0.92, -2.16);
    const mr = new T.Mesh(CG.mr, pm);
    mr.position.set(q * 1.02, 1.25, -0.75);
    g.add(h, mr);
  });
  [
    [-1, -1.4],
    [1, -1.4],
    [-1, 1.4],
    [1, 1.4],
  ].forEach(([sx, z]) => {
    const t = new T.Mesh(TW, TWM),
      h = new T.Mesh(HW, HWM);
    t.position.set(sx * 0.95, 0.34, z);
    h.position.set(sx * 0.95, 0.34, z);
    t.castShadow = true;
    g.add(t, h);
  });
  return sh(g);
}
const TW = new T.CylinderGeometry(0.34, 0.34, 0.24, 12).rotateZ(Math.PI / 2),
  TWM = new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }),
  HW = new T.CylinderGeometry(0.18, 0.18, 0.26, 10).rotateZ(Math.PI / 2),
  HWM = new T.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.3 });
const wr = (g, pts, r) =>
  pts.forEach(([x, z]) => {
    const t = new T.Mesh(new T.CylinderGeometry(r, r, 0.4, 14).rotateZ(Math.PI / 2), TWM),
      h = new T.Mesh(new T.CylinderGeometry(r * 0.5, r * 0.5, 0.42, 10).rotateZ(Math.PI / 2), HWM);
    t.position.set(x, r, z);
    h.position.set(x, r, z);
    t.castShadow = true;
    g.add(t, h);
  });
// ===== AMBULANCIA (tráfico y accidentes) =====
const AMBG = {
    cab: new T.BoxGeometry(2, 1.45, 1.5),
    caja: new T.BoxGeometry(2.15, 2.25, 3.7),
    franja: new T.BoxGeometry(2.17, 0.32, 5.25),
    vid: new T.BoxGeometry(1.8, 0.6, 0.06),
    luz: new T.BoxGeometry(0.42, 0.16, 0.22),
    rueda: new T.CylinderGeometry(0.42, 0.42, 0.32, 14).rotateZ(Math.PI / 2),
    txt: new T.PlaneGeometry(2.6, 0.42),
    cruz: new T.PlaneGeometry(0.75, 0.75),
  },
  AMBM = {
    blanco: new T.MeshStandardMaterial({ color: 0xf6f7f8, roughness: 0.35, metalness: 0.15 }),
    rojo: new T.MeshStandardMaterial({ color: 0xd62828, roughness: 0.4 }),
    txt: new T.MeshBasicMaterial({ map: S("AMBULANCIA", 384, 62, "#ffffff", "#d62828", 44) }),
    cruz: new T.MeshBasicMaterial({
      map: cv(64, 64, (x) => {
        x.fillStyle = "#fff";
        x.fillRect(0, 0, 64, 64);
        x.fillStyle = "#d62828";
        x.fillRect(24, 6, 16, 52);
        x.fillRect(6, 24, 52, 16);
      }),
    }),
  };
function mkAmbulancia() {
  const g = new T.Group(),
    add = (geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };
  add(AMBG.cab, AMBM.blanco, 0, 1.15, -1.85);
  add(AMBG.caja, AMBM.blanco, 0, 1.6, 0.75);
  add(AMBG.franja, AMBM.rojo, 0, 1.05, -0.1);
  add(AMBG.vid, gm2, 0, 1.55, -2.62).rotation.x = -0.25;
  add(CG.bp, dk, 0, 0.55, -2.65);
  add(CG.bp, dk, 0, 0.55, 2.62);
  [-1, 1].forEach((q) => {
    const h = add(CG.hl, hlM, q * 0.68, 0.85, -2.62),
      sp = new T.Sprite(glowM);
    sp.scale.setScalar(1.3);
    h.add(sp);
    add(AMBG.txt, AMBM.txt, q * 1.08, 2.15, 0.75).rotation.y = (q * Math.PI) / 2;
    add(AMBG.cruz, AMBM.cruz, q * 1.081, 1.55, 1.9).rotation.y = (q * Math.PI) / 2;
    add(AMBG.rueda, TWM, q * 0.95, 0.42, -1.75);
    add(AMBG.rueda, TWM, q * 0.95, 0.42, 1.6);
  });
  add(AMBG.cruz, AMBM.cruz, 0, 1.75, 2.61);
  // luces de emergencia: rojas y blancas, alternadas
  const luces = [0xff2020, 0xffffff, 0xff2020].map((c, i) => {
    const mat = new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 }),
      sm = new T.SpriteMaterial({
        map: gTex,
        color: c,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
      m = add(AMBG.luz, mat, -0.7 + i * 0.7, 2.8, -1.05),
      sp = new T.Sprite(sm);
    sp.scale.setScalar(2.6);
    m.add(sp);
    return { mat, sm };
  });
  g.userData.amb = luces;
  g.userData.hl = 2.7;
  return sh(g);
}
function mkVeh(zz) {
  const nv = typeof vehNuevo == "function" && vehNuevo(zz); // js/mundo.js
  if (nv) return nv;
  const r = Math.random();
  if (r > 0.96) return mkAmbulancia();
  if (r < 0.3) {
    const g = new T.Group();
    if (r < 0.15) {
      const cc = [0x2a56b8, 0xd8d8d8, 0xb02a2a][(Math.random() * 3) | 0];
      g.add(
        mm(2.5, 2.6, 2.2, cc, 0, 1.7, -3.9),
        mm(2.5, 3, 8.4, 0xe8ebee, 0, 2, 1.1),
        mm(2.3, 0.5, 10.8, 0x222, 0, 0.55, -0.2),
      );
      wr(
        g,
        [
          [-1.1, -3.9],
          [1.1, -3.9],
          [-1.1, 1.4],
          [1.1, 1.4],
          [-1.1, 3.6],
          [1.1, 3.6],
        ],
        0.6,
      );
      g.userData.hl = 5.4;
    } else {
      const k = SK[(Math.random() * SK.length) | 0];
      g.add(
        mm(2.6, 2.7, 10.4, k.b, 0, 1.7, 0),
        mm(2.62, 0.5, 10.42, k.s, 0, 1, 0),
        mm(2.64, 0.9, 9, 0xbfd8e8, 0, 2.3, 0, {
          metalness: 0.2,
          roughness: 0.05,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      wr(
        g,
        [
          [-1.2, -3.4],
          [1.2, -3.4],
          [-1.2, 3.4],
          [1.2, 3.4],
        ],
        0.55,
      );
      g.userData.hl = 5.3;
    }
    return g;
  }
  const o = mkCar();
  o.userData.hl = 2.2;
  return o;
}
const cars = [];
let tl_ = 0;
function mkAcc() {
  const g = new T.Group(),
    a = mkCar(),
    b = mkCar(),
    p = mkCar();
  a.position.set(-0.8, 0, -2);
  a.rotation.set(0, 0.7, 0.12);
  b.position.set(1.2, 0, 2.5);
  b.rotation.set(0, -0.5, -0.1);
  p.position.set(3.4, 0, 7.5);
  p.rotation.y = 0.35;
  const r = mm(0.5, 0.2, 0.4, 0xff2020, -0.35, 1.95, 0, { emissive: 0xff0000, emissiveIntensity: 2 }),
    u = mm(0.5, 0.2, 0.4, 0x2050ff, 0.35, 1.95, 0, { emissive: 0x2255ff, emissiveIntensity: 0 });
  p.add(r, u);
  g.add(a, b, p);
  g.userData.l = [r.material, u.material];
  g.userData.sm = [0, 1, 2, 3].map((i) => {
    const m = new T.Mesh(
      new T.SphereGeometry(0.7, 8, 6),
      new T.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.5 }),
    );
    m.position.set(-0.8, 2, -2);
    g.add(m);
    return m;
  });
  for (let k = 0; k < 4; k++) {
    const c = new T.Mesh(new T.ConeGeometry(0.25, 0.7, 8), M(0xff6a00));
    c.position.set((k % 2) * 1.6, 0.35, 12 + k * 3);
    g.add(c);
  }
  for (let k = 0; k < 6; k++) g.add(mm(R(0.2, 0.5), 0.12, R(0.2, 0.5), 0x333333, R(-2, 3), 0.06, R(-4, 5)));
  const am = mkAmbulancia(); // la ambulancia atiende el accidente
  am.position.set(-0.4, 0, 8.6);
  am.rotation.y = 0.15;
  g.add(am);
  g.userData.amb = am.userData.amb;
  g.userData.hl = 4.6;
  return g;
}
const LN = [-5.25, -1.75, 1.75, 5.25];
function mkBoat() {
  const g = new T.Group();
  g.add(
    mm(1.8, 0.6, 4.4, 0xf4f6f8, 0, 0.5, 0),
    mm(1.82, 0.2, 4.42, 0x1b4fa8, 0, 0.3, 0),
    mm(1.2, 0.7, 1.4, 0xbfd8e8, 0, 1.1, 0.3, { transparent: true, opacity: 0.5 }),
    mm(0.1, 1.4, 0.1, 0x888888, 0, 1.6, -0.9),
  );
  g.userData.hl = 2.4;
  return g;
}
function spawn(z) {
  if (zoneAt(z - CZ) == 18) return;
  if (typeof sinTrafico == "function" && sinTrafico(z - CZ)) return; // js/mundo3.js: el mar del ferry
  const lz =
      LZ.includes(zoneAt(z - CZ)) &&
      !HB.some((r) => z - CZ < r[0] + 60 && z - CZ > r[1] - 60) &&
      Math.random() < 0.25,
    zz = zoneAt(z - CZ),
    wt = zz == 16,
    rc = zz == 17,
    x = lz
      ? Math.random() < 0.5
        ? -28.5
        : -31.5
      : rc
        ? LN[2 + ((Math.random() * 2) | 0)]
        : LN[(Math.random() * 4) | 0],
    on = x == -28.5 || (x < 0 && x > -10),
    jm = inJam(z),
    sp = jm ? 16 : 30;
  if (cars.some((c) => c.x0 == x && Math.abs(c.z - z) < sp + (c.hl || 2))) return;
  if (!jm && !wt && !rc && Math.random() < 0.05) {
    const o = mkAcc();
    o.position.set(x, 0, z);
    sc.add(o);
    cars.push({ o, x, x0: x, hl: 4.6, z, vz: 0, v0: 0, jv: 0, vx: 0, hit: 0, stat: 1 });
    return;
  }
  const o = wt ? mkBoat() : mkVeh(zz);
  o.position.set(x, 0, z);
  o.rotation.y = on ? Math.PI : 0;
  sc.add(o);
  const v = rc ? -R(26, 40) : on ? R(13, 19) : -R(8, 13);
  const vAmb = o.userData.amb ? 1.6 : 1; // las ambulancias van más rápido
  cars.push({
    o,
    x,
    x0: x,
    hl: o.userData.hl || 2.2,
    z,
    vz: (jm ? v * 0.2 : v) * vAmb,
    v0: v * vAmb,
    jv: R(0.5, 3),
    vx: 0,
    hit: 0,
  });
}
// parada
const STOPD = 500;
let stop = null;
function mkStop(i) {
  const g = new T.Group(),
    z = -STOPD * (i + 1);
  const zn = new T.Mesh(
    new T.PlaneGeometry(7, 17),
    new T.MeshBasicMaterial({ color: 0x2fff7a, transparent: true, opacity: 0.35, fog: false }),
  );
  zn.rotation.x = -Math.PI / 2;
  zn.position.set(3.6, 0.05, z);
  g.add(zn);
  // ----- PARADA REMODELADA -----
  // Andén de concreto con bahía pintada, caseta de vidrio con techo verde, pantalla LED con la
  // próxima ruta, banca, mapa de rutas, basurero y maceteras. Mira hacia la carretera (-x).
  const s = new T.Group();
  s.position.set(9.5, 0, z);
  const bx_ = (w, h, d, c, x, y, zz, o) => {
    const m = new T.Mesh(
      new T.BoxGeometry(w, h, d),
      new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)),
    );
    m.position.set(x, y, zz);
    s.add(m);
    return m;
  };
  const tx_ = (t, w, h, bg, fg, fs, x, y, zz, ry = -Math.PI / 2, luz) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: S(t, (w * 128) | 0, (h * 128) | 0, bg, fg, fs * 2), toneMapped: !luz }),
    );
    p.position.set(x, y, zz);
    p.rotation.y = ry;
    s.add(p);
    return p;
  };
  const vid = { color: 0xbfe3f5, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false };
  bx_(3.2, 0.22, 16, 0xc9c6bf, 0.4, 0.11, 0); // andén
  bx_(0.25, 0.24, 16, 0xf2c200, -1.25, 0.12, 0); // cordón amarillo
  bx_(0.12, 3, 0.12, 0x37474f, 1.6, 1.5, -3, { metalness: 0.7, roughness: 0.3 });
  bx_(0.12, 3, 0.12, 0x37474f, 1.6, 1.5, 3, { metalness: 0.7, roughness: 0.3 });
  bx_(0.12, 3, 0.12, 0x37474f, -0.4, 1.5, -3, { metalness: 0.7, roughness: 0.3 });
  bx_(0.12, 3, 0.12, 0x37474f, -0.4, 1.5, 3, { metalness: 0.7, roughness: 0.3 });
  bx_(2.8, 0.18, 7, 0x2e7d32, 0.5, 3.05, 0); // techo verde
  bx_(2.9, 0.08, 7.1, 0xdfe6ea, 0.5, 3.18, 0, { metalness: 0.6, roughness: 0.3 });
  bx_(0.05, 2.4, 5.8, 0, 1.6, 1.5, 0, vid); // vidrio de atrás
  bx_(1.8, 2.4, 0.05, 0, 0.6, 1.5, -3, vid); // vidrios de los lados
  bx_(1.8, 2.4, 0.05, 0, 0.6, 1.5, 3, vid);
  bx_(0.6, 0.12, 4.4, 0x8d6e63, 1.1, 0.62, 0.4); // banca
  bx_(0.12, 0.5, 4.4, 0x8d6e63, 1.38, 0.9, 0.4);
  [-1.5, 2.3].forEach((q) => bx_(0.5, 0.5, 0.12, 0x455a64, 1.1, 0.36, q));
  // pantalla LED (próximo bus) y letrero
  bx_(0.25, 0.7, 2.6, 0x111111, 0.5, 2.6, 0);
  tx_(pk_(["🚌 ATD  2 min", "🚌 LUMACA  4 min", "🚌 28 PORVENIR 1 min", "🚌 ATD  6 min"]), 2.4, 0.5, "#050505", "#ffb020", 20, 0.36, 2.6, 0, -Math.PI / 2, 1);
  tx_("PARADA · REMODELADA", 6.6, 0.42, "#2e7d32", "#ffffff", 20, -0.95, 3.05, 0);
  // panel de anuncio iluminado y mapa de rutas
  bx_(0.2, 2.2, 1.4, 0x263238, 1.45, 1.4, -3.7);
  tx_("MAPA DE RUTAS", 1.2, 1.9, "#e3f2fd", "#0d47a1", 13, 1.33, 1.4, -3.7, -Math.PI / 2, 1);
  // poste con el letrero de PARADA
  bx_(0.12, 3.8, 0.12, 0x777777, -0.9, 1.9, 5);
  tx_("PARADA", 1.6, 0.6, "#ffd23f", "#111111", 30, -0.9, 3.6, 5.07, 0);
  tx_("PARADA", 1.6, 0.6, "#ffd23f", "#111111", 30, -0.9, 3.6, 4.93, Math.PI);
  // basurero y maceteras con arbustos
  bx_(0.5, 0.9, 0.5, 0x2e7d32, -0.6, 0.67, -4.6);
  [-6.5, 6.5].forEach((q) => {
    bx_(1.2, 0.6, 1.2, 0x9e9e9e, 0.8, 0.52, q);
    const b = new T.Mesh(new T.IcosahedronGeometry(0.75, 0), M(0x3f8f3a));
    b.position.set(0.8, 1.3, q);
    s.add(b);
  });
  const pp = [];
  for (let i = 0; i < 6; i++) {
    const p = new T.Group(),
      b = new T.Mesh(
        new T.CylinderGeometry(0.25, 0.3, 1.2, 8),
        M(new T.Color().setHSL(Math.random(), 0.6, 0.5).getHex()),
      ),
      h = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), M(0xe0b08a));
    b.position.y = 0.8;
    h.position.y = 1.65;
    p.add(b, h);
    p.position.set(R(-0.9, 0.4), 0.22, R(-2.6, 2.6));
    s.add(p);
    pp.push(p);
  }
  sh(s);
  {
    const q = zoneAt(z);
    if (q == 2 || q == 5 || q == 16 || Math.abs((-z % CICLO) - 6500) < 135) s.visible = false;
  }
  g.add(s);
  sc.add(g);
  return { z, g, zn, pp, t: 0 };
}
