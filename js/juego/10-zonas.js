// js/juego/10-zonas.js · nombres de las zonas (ZN), torres, peaje, túneles, trenes, ciudades, puentes y rampas.
// Parte 10 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// zonas
const ZN = [
    "Centro urbano",
    "Autopista",
    "Puente atirantado",
    "Ruta del bosque",
    "Peaje Quick Pass",
    "Túnel Zurquí",
    "Ruta de la montaña · puente de madera",
    "Rotonda del Walmart · cruce ferroviario",
    "San José · Estadio Nacional",
    "Circunvalación × Ruta 27",
    "Rotonda Rancho de Guanacaste",
    "Rotonda del Bicentenario",
    "Rotonda de la Bandera (noche)",
    "Cruce Río Frío · Pococí",
    "Obras en construcción",
    "Terminal de buses",
    "Pista de agua",
    "Pista de carreras",
    "Pista de prueba (sin carros)",
  ],
  zoneAt = (z) => Math.floor(Math.max(0, -z) / 1000) % NZ;
const wo = new T.Group();
sc.add(wo);
let cyc = 0,
  tolled = 0,
  zPrev = -1;
const wNrm = (() => {
  const S_ = 256,
    c = document.createElement("canvas");
  c.width = c.height = S_;
  const x = c.getContext("2d"),
    d = x.createImageData(S_, S_),
    W_ = [
      [3, 1, 0.5, 0],
      [-2, 4, 0.35, 1.3],
      [5, -3, 0.22, 2.1],
      [1, 7, 0.15, 0.7],
      [9, 2, 0.08, 4],
    ];
  for (let j = 0; j < S_; j++)
    for (let i = 0; i < S_; i++) {
      let dx = 0,
        dy = 0;
      const u = i / S_,
        v = j / S_;
      for (const [a, b, amp, ph] of W_) {
        const k = Math.cos(6.2832 * (a * u + b * v) + ph) * amp;
        dx += k * a;
        dy += k * b;
      }
      let nx = -dx * 0.08,
        ny = -dy * 0.08,
        l = Math.hypot(nx, ny, 1);
      const o = (j * S_ + i) * 4;
      d.data[o] = ((nx / l) * 0.5 + 0.5) * 255;
      d.data[o + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      d.data[o + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      d.data[o + 3] = 255;
    }
  x.putImageData(d, 0, 0);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(170, 170);
  return t;
})();
const water = new T.Mesh(
  new T.PlaneGeometry(2000, 2000),
  new T.MeshStandardMaterial({
    color: 0x26708f,
    roughness: 0.08,
    metalness: 0.5,
    envMap: ENV,
    envMapIntensity: 1.3,
    normalMap: wNrm,
    normalScale: new T.Vector2(0.55, 0.55),
  }),
);
water.rotation.x = -Math.PI / 2;
water.position.y = -3;
water.visible = false;
sc.add(water);
function tower(z) {
  const g = new T.Group(),
    c = 0xc9c9c4,
    v = [];
  [-1, 1].forEach((q) => {
    g.add(mm(1.8, 42, 1.8, c, q * 8.2, 15, 0));
    for (let i = 0; i < 10; i++)
      for (const d of [-1, 1]) {
        const y = 38 - i * 1.5;
        v.push(q * 8.2, y, 0, q * 7.2, 0.9, d * (9 + i * 7.5));
      }
  });
  g.add(mm(17, 1.5, 1.6, c, 0, 34, 0), mm(17, 1.5, 1.6, c, 0, 20, 0));
  const ge = new T.BufferGeometry();
  ge.setAttribute("position", new T.Float32BufferAttribute(v, 3));
  g.add(new T.LineSegments(ge, new T.LineBasicMaterial({ color: 0xd8434f })));
  g.position.z = z;
  wo.add(g);
}
tower(-2250);
tower(-2750);
function toll(z) {
  const g = new T.Group();
  g.add(mm(34, 0.9, 9, 0xd0d3d5, 0, 6, 0));
  [-8, 0, 8].forEach((x) => g.add(mm(1.1, 6, 1.1, 0x777, x, 3, 0)));
  [-7.7, 0, 7.7].forEach((x) => g.add(mm(1.6, 0.9, 14, 0xf2c200, x, 0.45, 0)));
  [-3.5, 3.5].forEach((x) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(3, 0.9),
      new T.MeshBasicMaterial({ map: S("↓ QUICK PASS", 384, 112, "#111", "#37ff6b", 44) }),
    );
    p.position.set(x, 5.2, 4.6);
    g.add(p);
    for (let i = 0; i < 3; i++) {
      const k = new T.Mesh(new T.ConeGeometry(0.28, 0.8, 8), M(0xff6a00));
      k.position.set(x + (i - 1) * 1.4, 0.4, 7 + i * 2.5);
      g.add(k);
    }
  });
  const lg = new T.Mesh(
    new T.PlaneGeometry(6, 0.8),
    new T.MeshBasicMaterial({ map: S("PEAJE", 256, 64, "#0a6e3a", "#fff", 44) }),
  );
  lg.position.set(0, 7.2, 4.6);
  g.add(lg);
  g.position.z = z;
  wo.add(g);
}
toll(-4250);
function tunnel(z) {
  const g = new T.Group(),
    y = 0xe3b100;
  [1, -1].forEach((q) => {
    const f = q * 60;
    g.add(mm(28, 18, 3, y, -21.5, 9, f), mm(28, 18, 3, y, 21.5, 9, f), mm(15, 11, 3, y, 0, 12.5, f));
  });
  g.add(
    mm(0.8, 7.2, 120, 0x555a5e, -7.9, 3.6, 0),
    mm(0.8, 7.2, 120, 0x555a5e, 7.9, 3.6, 0),
    mm(16.6, 0.8, 120, 0x4a4e52, 0, 7.5, 0),
    mm(60, 14.5, 120, 0x3d6b38, 0, 14.75, 0),
    mm(22, 7.5, 120, 0x3d6b38, -19, 3.75, 0),
    mm(22, 7.5, 120, 0x3d6b38, 19, 3.75, 0),
  );
  [-3.5, 3.5].forEach((x) =>
    g.add(mm(0.35, 0.12, 116, 0xff9a2e, x, 7, 0, { emissive: 0xff8a1e, emissiveIntensity: 2 })),
  );
  g.position.z = z;
  wo.add(g);
}
tunnel(-5250);
rd.localClippingEnabled = true;
const cp1 = new T.Plane(new T.Vector3(0, 0, 1), 0),
  cp2 = new T.Plane(new T.Vector3(0, 0, -1), 0);
ground.material.clippingPlanes = [cp1, cp2];
ground.material.clipIntersection = true;
const cany = new T.Mesh(
  new T.PlaneGeometry(2000, 2000),
  new T.MeshStandardMaterial({ color: 0x2f5d34, roughness: 1 }),
);
cany.rotation.x = -Math.PI / 2;
cany.position.y = -45;
sc.add(cany);
function mkTrain(n) {
  const g = new T.Group();
  g.add(mm(3, 3.2, 8, 0xe3b100, 0, 2.3, 0));
  for (let i = 1; i <= n; i++)
    g.add(
      mm(3, 3.4, 9, 0x6a4a8a, 0, 2.4, i * 9.6 + 1),
      mm(3.04, 0.8, 8, 0x9fc4e8, 0, 2.8, i * 9.6 + 1, { emissive: 0x335577 }),
    );
  return g;
}
function wood() {
  const g = new T.Group(),
    L = 260,
    H = L / 2,
    cb = [],
    hg = [],
    ps = [];
  const wt = cv(64, 64, (x, w, h) => {
    for (let i = 0; i < 4; i++) {
      x.fillStyle = ["#a9602d", "#b9703a", "#9a5428", "#b06a35"][i];
      x.fillRect(0, i * 16, w, 15);
    }
  });
  wt.wrapS = wt.wrapT = T.RepeatWrapping;
  wt.repeat.set(1, L / 4);
  const dk = new T.Mesh(
    new T.BoxGeometry(13.4, 0.3, L),
    new T.MeshStandardMaterial({ map: wt, roughness: 0.9 }),
  );
  dk.position.y = 0.1;
  dk.receiveShadow = true;
  g.add(dk);
  [-1, 1].forEach((q) => {
    g.add(
      mm(0.14, 0.14, L, 0xe8742a, q * 6.5, 1.3, 0),
      mm(0.14, 0.14, L, 0xe8742a, q * 6.5, 0.6, 0),
      mm(0.8, 12, 0.8, 0x6b5a48, q * 6.5, 6, -H),
      mm(0.8, 12, 0.8, 0x6b5a48, q * 6.5, 6, H),
    );
    for (let i = 0; i <= 52; i++) {
      const z = -H + i * 5,
        y = 1.8 + 10 * (z / H) ** 2,
        y0 = 1.8 + 10 * ((z - 5) / H) ** 2;
      if (i) cb.push(q * 6.5, y0, z - 5, q * 6.5, y, z);
      hg.push(q * 6.5, y, z, q * 6.5, 1.3, z);
      if (i % 2 == 0) ps.push(q * 6.5, 0.3, z, q * 6.5, 1.5, z);
    }
  });
  const ln = (a, c) => {
    const ge = new T.BufferGeometry();
    ge.setAttribute("position", new T.Float32BufferAttribute(a, 3));
    return new T.LineSegments(ge, new T.LineBasicMaterial({ color: c }));
  };
  g.add(ln(cb, 0xe8742a), ln(hg, 0x2f5fd8), ln(ps, 0x2f5fd8));
  [1, -1].forEach((q) => g.add(mm(2000, 46, 8, 0x7d7364, 0, -23, q * (H + 4))));
  const A = new T.Group(),
    rc = 0x9c5a3c,
    P = (z) => 34 * (1 - (z / H) ** 2);
  A.add(mm(5, 0.8, L, 0x555555, 0, 0, 0));
  for (let i = 0; i < 20; i++) {
    const z0 = -H + i * 13,
      dy = P(z0 + 13) - P(z0),
      m = mm(0.7, 0.7, Math.hypot(13, dy), rc, 0, (P(z0) + P(z0 + 13)) / 2, z0 + 6.5);
    m.rotation.x = -Math.atan2(dy, 13);
    A.add(m);
  }
  for (let z = -H + 13; z < H; z += 13) A.add(mm(0.3, P(z), 0.3, rc, 0, P(z) / 2, z));
  A.position.x = -48;
  g.add(A);
  const tr = mkTrain(5);
  tr.rotation.y = Math.PI;
  tr.position.set(-48, 0.4, -300);
  g.add(tr);
  g.position.z = -6500;
  wo.add(g);
  return tr;
}
const trA = wood();
// rotonda del Walmart
(function () {
  const g = new T.Group(),
    pO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const r = new T.Mesh(
    new T.CircleGeometry(27, 64),
    new T.MeshStandardMaterial(Object.assign({ color: 0x3b3e44, roughness: 0.9 }, pO)),
  );
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.02;
  g.add(r);
  const w = new T.Mesh(
    new T.RingGeometry(25.6, 25.9, 64),
    new T.MeshBasicMaterial({
      color: 0xeeeeee,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
  );
  w.rotation.x = -Math.PI / 2;
  w.position.y = 0.03;
  g.add(w);
  const c = new T.Mesh(new T.CylinderGeometry(11.7, 11.7, 0.4, 48), M(0xe6e6e6)),
    i = new T.Mesh(new T.CylinderGeometry(11, 11, 0.5, 48), M(0x3f8f3a));
  c.position.y = 0.2;
  i.position.y = 0.25;
  g.add(c, i);
  for (let k = 0; k < 7; k++) {
    const t = tree(),
      a = (k * Math.PI) / 3.5;
    t.scale.setScalar(0.8);
    t.position.set(Math.cos(a) * 8, 0.4, Math.sin(a) * 8);
    g.add(t);
  }
  [0, Math.PI].forEach((q) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(6, 1.6),
      new T.MeshBasicMaterial({ map: S("ROTONDA DEL WALMART", 512, 136, "#0a5a9a", "#fff", 40) }),
    );
    p.position.set(0, 2.2, q ? -0.5 : 0.5);
    p.rotation.y = q;
    g.add(p);
  });
  g.position.z = -7250;
  wo.add(g);
  const ms = new T.Group();
  ms.add(
    mm(36, 9, 30, 0x2b3350, 0, 4.5, 0),
    mm(36.2, 0.5, 30.2, 0xc8201f, 0, 6.3, 0),
    mm(38, 0.4, 9, 0x0d6b3a, 0, 4.4, 19),
    mm(0.5, 4.4, 0.5, 0x555555, -17, 2.2, 22),
    mm(0.5, 4.4, 0.5, 0x555555, 17, 2.2, 22),
  );
  const pk = new T.Mesh(
    new T.PlaneGeometry(40, 26),
    new T.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.9 }),
  );
  pk.rotation.x = -Math.PI / 2;
  pk.position.set(0, 0.03, 28);
  ms.add(pk);
  [
    ["MEGASUPER", 16, 3, "#2b3350", "#fff", 60, 0, 7.7],
    ["Ahorro todos los días", 9, 1.1, "#2b3350", "#fff", 34, -9, 5.4],
  ].forEach(([t, w2, h, bg, fg, fs, x, y]) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(w2, h),
      new T.MeshBasicMaterial({ map: S(t, (w2 * 40) | 0, (h * 40) | 0, bg, fg, fs) }),
    );
    p.position.set(x, y, 15.1);
    ms.add(p);
  });
  ms.position.set(70, 0, -7250);
  ms.rotation.y = -Math.PI / 2;
  wo.add(ms);
})();
// cruce ferroviario
const cx = new T.Group(),
  slp = cv(64, 32, (x, w, h) => {
    x.fillStyle = "#4a3b2c";
    x.fillRect(0, 0, w, h);
    x.fillStyle = "#2a2018";
    x.fillRect(4, 0, 10, h);
  });
slp.wrapS = slp.wrapT = T.RepeatWrapping;
slp.repeat.set(160, 1);
const bed = new T.Mesh(
  new T.PlaneGeometry(240, 3.4),
  new T.MeshStandardMaterial({
    map: slp,
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  }),
);
bed.rotation.x = -Math.PI / 2;
bed.position.y = 0.04;
cx.add(bed);
[-0.75, 0.75].forEach((z) => cx.add(mm(240, 0.15, 0.15, 0xb8bcc0, 0, 0.14, z)));
const lamM = new T.MeshStandardMaterial({ color: 0x550000, emissive: 0xff0000, emissiveIntensity: 0.2 }),
  arms = [1, -1].map((q) => {
    const a = new T.Group(),
      b = new T.Mesh(
        new T.BoxGeometry(7, 0.14, 0.14),
        new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x661111 }),
      );
    b.position.x = -q * 3.5;
    a.add(b);
    a.position.set(q * 8.2, 1.1, 2.4);
    a.rotation.z = -q * 1.2;
    cx.add(a, mm(0.2, 3, 0.2, 0x888888, q * 8.2, 1.5, 2.4));
    const l = new T.Mesh(new T.SphereGeometry(0.25, 8, 6), lamM);
    l.position.set(q * 8.2, 3.2, 2.4);
    cx.add(l);
    const sg = new T.Mesh(
      new T.PlaneGeometry(1.6, 1.6),
      new T.MeshBasicMaterial({ map: S("TREN", 128, 128, "#f2c200", "#111", 36) }),
    );
    sg.position.set(q * 9.6, 2.4, 2.4);
    cx.add(sg);
    return a;
  });
const trC = mkTrain(5);
trC.rotation.y = Math.PI / 2;
trC.position.set(999, 0.4, 0);
cx.add(trC);
cx.position.z = -7750;
wo.add(cx);
// ===== ciudades y carreteras nuevas =====
const W = (...a) => wo.add(...a),
  crs = [];
function lines(a, c, g) {
  const ge = new T.BufferGeometry();
  ge.setAttribute("position", new T.Float32BufferAttribute(a, 3));
  const l = new T.LineSegments(ge, new T.LineBasicMaterial({ color: c }));
  g.add(l);
}
// puente colgante verde (ruta del bosque)
(function () {
  const g = new T.Group(),
    c = 0x2f9f5a,
    v = [];
  g.add(mm(48, 0.25, 2.4, c, 0, 9, 0), mm(48, 1.2, 0.1, c, 0, 9.7, 1.2), mm(48, 1.2, 0.1, c, 0, 9.7, -1.2));
  [-1, 1].forEach((q) => {
    [-1.3, 1.3].forEach((z) => {
      g.add(mm(0.35, 16, 0.35, c, q * 13, 8, z));
      v.push(q * 13, 15, z, q * 24, 9.7, z);
    });
    g.add(mm(0.3, 0.3, 2.9, c, q * 13, 15, 0));
  });
  for (const z of [-1.3, 1.3])
    for (let i = 0; i < 26; i++) {
      const x1 = -13 + i,
        x2 = x1 + 1,
        y = (x) => 11 + (x / 13) ** 2 * 4;
      v.push(x1, y(x1), z, x2, y(x2), z);
      if (i % 2 == 0) v.push(x1, y(x1), z, x1, 9.7, z);
    }
  lines(v, c, g);
  g.position.z = -3250;
  W(g);
})();
// San José: estadio, condominio
(function () {
  const g = new T.Group(),
    wm = new T.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.6, side: T.DoubleSide });
  const bl = new T.Mesh(new T.CylinderGeometry(30, 34, 16, 40, 1, true), wm);
  bl.scale.z = 1.7;
  bl.position.y = 8;
  const pt = new T.Mesh(new T.CircleGeometry(26, 32), M(0x3f8f3a));
  pt.rotation.x = -Math.PI / 2;
  pt.position.y = 0.1;
  pt.scale.y = 1.7;
  const ar = new T.Mesh(new T.CylinderGeometry(24, 24, 76, 32, 1, true, Math.PI / 2, Math.PI), wm);
  ar.rotation.x = Math.PI / 2;
  ar.position.y = 6;
  g.add(bl, pt, ar);
  g.position.set(-85, 0, -8500);
  W(g);
  const co = new T.Group(),
    rf = new T.Mesh(new T.ConeGeometry(11, 5, 4), M(0xb5482d));
  rf.rotation.y = Math.PI / 4;
  rf.position.y = 25;
  co.add(
    mm(18, 22, 12, 0xe9b57a, 0, 11, 0),
    mm(4, 24, 4, 0x8a4a3a, -7, 12, 6.5),
    mm(19, 0.8, 13, 0xb5482d, 0, 22.3, 0),
    rf,
  );
  co.position.set(48, 0, -8450);
  W(co);
})();
// Circunvalación × Ruta 27
(function () {
  const g = new T.Group(),
    a = 0x3b3e44,
    pm = new T.MeshStandardMaterial({
      color: a,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  g.add(pn(7, 90, a, 29.5, 0.03, 0), pn(7, 90, a, 46.5, 0.03, 0), pn(10, 90, 0x3f8f3a, 38, 0.04, 0));
  const r = new T.Mesh(new T.RingGeometry(5, 12, 40, 1, 0, Math.PI), pm);
  r.rotation.x = -Math.PI / 2;
  r.position.set(38, 0.03, -45);
  const d = new T.Mesh(new T.CircleGeometry(5, 24), M(0x3f8f3a));
  d.rotation.x = -Math.PI / 2;
  d.position.set(38, 0.04, -45);
  g.add(r, d, mm(0.4, 7, 0.4, 0x777777, -8.5, 3.5, 60), mm(0.4, 7, 0.4, 0x777777, 8.5, 3.5, 60));
  const sg = new T.Mesh(
    new T.PlaneGeometry(14, 2.6),
    new T.MeshBasicMaterial({ map: S("CIRCUNVALACIÓN × RUTA 27", 512, 100, "#0a6e3a", "#fff", 34) }),
  );
  sg.position.set(0, 6, 60);
  g.add(sg);
  g.position.z = -9500;
  W(g);
})();
// Rancho de Guanacaste: óvalos a cada lado del paso a desnivel
(function () {
  const g = new T.Group();
  [-1, 1].forEach((q) => {
    const e = new T.Mesh(
        new T.CircleGeometry(1, 40),
        new T.MeshStandardMaterial({
          color: 0x3b3e44,
          roughness: 0.9,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      ),
      i = new T.Mesh(new T.CircleGeometry(1, 40), M(0x3f8f3a));
    [e, i].forEach((m) => {
      m.rotation.x = -Math.PI / 2;
      m.position.x = q * 29;
    });
    e.position.y = 0.03;
    e.scale.set(24, 36, 1);
    i.position.y = 0.06;
    i.scale.set(13, 26, 1);
    g.add(e, i);
  });
  g.position.z = -10500;
  W(g);
})();
// rotondas Bicentenario y Bandera
function rnd(z, k) {
  const g = new T.Group(),
    pO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const r = new T.Mesh(
    new T.CircleGeometry(27, 64),
    new T.MeshStandardMaterial(Object.assign({ color: 0x3b3e44, roughness: 0.9 }, pO)),
  );
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.02;
  const w = new T.Mesh(
    new T.RingGeometry(25.6, 25.9, 64),
    new T.MeshBasicMaterial({
      color: 0xeeeeee,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
  );
  w.rotation.x = -Math.PI / 2;
  w.position.y = 0.03;
  const c = new T.Mesh(new T.CylinderGeometry(11.7, 11.7, 0.4, 48), M(0xe6e6e6)),
    i = new T.Mesh(new T.CylinderGeometry(11, 11, 0.5, 48), M(0x3f8f3a));
  c.position.y = 0.2;
  i.position.y = 0.25;
  g.add(r, w, c, i);
  if (k == "b") {
    const t = cv(512, 512, (x, w, h) => {
      x.fillStyle = "#4f9a3f";
      x.fillRect(0, 0, w, h);
      x.strokeStyle = "#fff";
      x.lineWidth = 4;
      for (let n = 0; n < 7; n++) {
        x.beginPath();
        x.arc(166 + n * 30, 336, 120 + n * 18, 3.6, 5.4);
        x.stroke();
      }
      x.beginPath();
      x.arc(170, 300, 50, 0, 6.3);
      x.stroke();
    });
    const d = new T.Mesh(new T.CircleGeometry(11, 48), new T.MeshBasicMaterial({ map: t }));
    d.rotation.x = -Math.PI / 2;
    d.position.y = 0.52;
    g.add(d);
  } else {
    const fl = cv(240, 160, (x, w, h) => {
      ["#1d3f9a", "#fff", "#d62828", "#fff", "#1d3f9a"].forEach((c, j) => {
        x.fillStyle = c;
        x.fillRect(0, [0, 32, 64, 96, 128][j] * 1, w, [32, 32, 32, 32, 32][j]);
      });
    });
    g.add(mm(0.25, 13, 0.25, 0xf2f2f2, 0, 6.5, 0));
    const fg = new T.Mesh(
      new T.PlaneGeometry(4.5, 3),
      new T.MeshBasicMaterial({ map: fl, side: T.DoubleSide }),
    );
    fg.position.set(2.4, 11, 0);
    g.add(fg);
    [
      [25.2, 0x3b7bff],
      [11.8, 0xff3b4f],
    ].forEach(([rr, cc]) => {
      const n = new T.Mesh(new T.TorusGeometry(rr, 0.18, 6, 90), new T.MeshBasicMaterial({ color: cc }));
      n.rotation.x = Math.PI / 2;
      n.position.y = 0.4;
      g.add(n);
    });
    for (let n = 0; n < 10; n++) {
      const a = n * 0.628,
        l = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: 0xfff2b0 }));
      l.position.set(Math.cos(a) * 7, 0.8, Math.sin(a) * 7);
      g.add(l);
    }
  }
  [0, Math.PI].forEach((q) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(6, 0.9),
      new T.MeshBasicMaterial({
        map: S(
          k == "b" ? "ROTONDA DEL BICENTENARIO" : k == "n" ? "ROTONDA DE LAS NACIONES" : "ROTONDA DE LA BANDERA",
          512,
          77,
          "#f5f5f5",
          "#1b4fa8",
          32,
        ),
      }),
    );
    p.position.set(0, 1.2, q ? -11.6 : 11.6);
    p.rotation.y = q;
    g.add(p);
  });
  g.position.z = z;
  W(g);
}
rnd(-11250, "b");
rnd(-12250, "f");
// Cruce Río Frío: paso peatonal, comercios, ramal
(function () {
  const g = new T.Group(),
    c = 0xbfc4c8;
  g.add(mm(26, 0.4, 3, c, 0, 6.4, 0), mm(26, 1, 0.12, c, 0, 7.2, 1.5), mm(26, 1, 0.12, c, 0, 7.2, -1.5));
  [-1, 1].forEach((q) => {
    g.add(mm(1.4, 6.4, 3.2, 0x9aa0a4, q * 11, 3.2, 0));
    const r = mm(15.4, 0.4, 3, c, q * 19, 3.2, 0);
    r.rotation.z = -q * 0.43;
    g.add(r);
  });
  g.position.z = -13400;
  W(g);
  [-1, 1].forEach((q) =>
    W(
      mm(46, 5.5, 18, 0xf1ede4, q * 55, 2.75, -13450 + q * 20),
      mm(47, 0.7, 19, 0xd94a54, q * 55, 5.8, -13450 + q * 20),
    ),
  );
  W(pn(9, 120, 0x3b3e44, 24, 0.03, -13400, 0.3));
})();
// Obras: grúas torre, estructuras, viaducto prefabricado
function crane(x, z, h) {
  const g = new T.Group(),
    o = 0xe8742a,
    j = new T.Group();
  g.add(mm(1.4, h, 1.4, o, 0, h / 2, 0));
  j.position.y = h;
  j.add(
    mm(38, 1, 1, o, 11, 0, 0),
    mm(2.4, 1.8, 2.4, 0x777777, -9, -0.4, 0),
    mm(2.2, 2.2, 2.2, 0xd8d8d8, 1.5, -1.6, 1.3),
    mm(0.5, 4, 0.5, o, -0.5, 2.5, 0),
  );
  g.add(j);
  g.position.set(x, 0, z);
  crs.push(j);
  W(g);
}
function frame(x, z, n) {
  const g = new T.Group();
  for (let k = 0; k < n; k++) g.add(mm(14, 0.4, 14, 0x9a9a96, 0, k * 3.4 + 0.2, 0));
  for (const a of [-6.5, 6.5])
    for (const b of [-6.5, 6.5]) g.add(mm(0.6, n * 3.4, 0.6, 0x8a8a86, a, n * 1.7, b));
  g.add(mm(14, 3, 0.5, 0xdcd2c0, 0, 1.5, -6.5));
  g.position.set(x, 0, z);
  W(g);
}
frame(-40, -14450, 9);
frame(42, -14550, 12);
crane(-26, -14450, 32);
crane(28, -14550, 42);
crane(-55, -14560, 26);
W(
  mm(30, 1.4, 90, 0xb9b9b4, -70, 5, -14500),
  mm(2, 5, 2, 0x9a9a96, -62, 2.5, -14470),
  mm(2, 5, 2, 0x9a9a96, -78, 2.5, -14470),
  mm(2, 5, 2, 0x9a9a96, -62, 2.5, -14530),
  mm(2, 5, 2, 0x9a9a96, -78, 2.5, -14530),
);
// salidas, mall, túneles
const sd = (px, pz, a, b, c, d) => {
    const dx = c - a,
      dz = d - b,
      t = Math.max(0, Math.min(1, ((px - a) * dx + (pz - b) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(px - a - t * dx, pz - b - t * dz);
  },
  XS = [];
[
  [-700, "Ruta 27 · Caldera"],
  [-3600, "Ruta 32 · Limón"],
  [-5600, "Cartago · Ruta 2"],
  [-11700, "Ruta 1 · Guanacaste"],
].forEach(([z0, nm]) => {
  [
    [7, z0, 60, z0 - 90],
    [60, z0 - 90, 60, z0 - 600],
    [60, z0 - 600, 7, z0 - 690],
  ].forEach(([x1, z1, x2, z2]) => {
    XS.push([x1, z1, x2, z2, 5]);
    const dx = x2 - x1,
      dz = z2 - z1,
      L = Math.hypot(dx, dz),
      ry = Math.atan2(-dx, -dz),
      mx_ = (x1 + x2) / 2,
      mz_ = (z1 + z2) / 2;
    W(pn(11, L, 0xe8e8e8, mx_, 0.025, mz_, ry), pn(10, L, 0x3b3e44, mx_, 0.03, mz_, ry));
  });
  const sg = new T.Mesh(
    new T.PlaneGeometry(5.2, 1.4),
    new T.MeshBasicMaterial({ map: S("SALIDA · " + nm, 512, 138, "#0a6e3a", "#fff", 38) }),
  );
  sg.position.set(9.8, 3.6, z0 + 120);
  W(sg, mm(0.15, 3.6, 0.15, 0x777777, 9.8, 1.8, z0 + 120));
});
XS.push([7, -4650, 55, -4650, 5], [77, -4725, 77, -4575, 30]);
GZ.forEach((gz) => XS.push([29, gz - 14, 29, gz + 14, 22]));
GZ.forEach((gz) => {
  const g = new T.Group(),
    r = 0xd62828;
  g.add(
    pn(44, 32, 0x3b3e44, 29, 0.03, 0),
    mm(22, 0.7, 14, 0xf4f4f4, 26, 5.6, 0),
    mm(22.2, 0.4, 14.2, r, 26, 5.2, 0),
    mm(8, 4, 12, 0xe8e2d4, 45, 2, 0),
    mm(8.4, 0.4, 12.4, r, 45, 4.2, 0),
    mm(0.3, 10, 0.3, 0x888888, 12, 5, -9),
  );
  [
    [-8, -5],
    [8, -5],
    [-8, 5],
    [8, 5],
  ].forEach(([x, z]) => g.add(mm(0.5, 5.6, 0.5, 0x999999, 26 + x, 2.8, z)));
  [-7, 7].forEach((x) =>
    [-3, 3].forEach((z) =>
      g.add(mm(0.9, 1.6, 0.7, r, 26 + x, 0.8, z), mm(0.92, 0.5, 0.72, 0xffffff, 26 + x, 1.5, z)),
    ),
  );
  const sg = new T.Mesh(
    new T.PlaneGeometry(7, 1.6),
    new T.MeshBasicMaterial({
      map: S("GASOLINERA", 512, 117, r == 0xd62828 ? "#d62828" : "#c00", "#fff", 64),
    }),
  );
  sg.position.set(12, 9.5, -9);
  sg.rotation.y = -Math.PI / 2;
  g.add(sg);
  g.position.z = gz;
  W(g);
});
const LZ = [0, 1, 3, 4, 7, 8, 9, 13, 14, 15],
  onLf = (x, z) =>
    x < -25.5 &&
    x > -34.5 &&
    LZ.includes(zoneAt(z - CZ)) &&
    !HB.some((r) => z - CZ < r[0] + 60 && z - CZ > r[1] - 60);
// Pistas extra donde se puede manejar sin salirse (js/mundo3.js agrega los carriles externos de la
// Rotonda de La Y Griega y el patio de la Terminal Lumaca). Cada una es una función (x, z) => true/false.
const PISTAS_EXTRA = [];
// Clima por zona (js/mundo5.js): { suelo: color del zacate, niebla: [cerca, lejos], oscuro: 0 a 1, lluvia: 1 }
const CLIMA = {};
const onXs = (x, z) => Math.abs(x) > 5 && XS.some((q) => sd(x, z - CZ, q[0], q[1], q[2], q[3]) < q[4]);
(function () {
  const g = new T.Group(),
    fm = facade(60, 24, 150, 0xc9d1d8);
  fm.position.set(135, 12, 0);
  g.add(fm);
  const sg = new T.Mesh(
    new T.PlaneGeometry(40, 6.3),
    new T.MeshBasicMaterial({ map: S("MEGA MALL", 1024, 160, "#1b2a4a", "#ffd23f", 110) }),
  );
  sg.position.set(104.9, 19.5, 0);
  sg.rotation.y = -Math.PI / 2;
  g.add(sg);
  g.add(
    mm(2, 8, 26, 0x14202e, 104.2, 4, 0, { metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.7 }),
    mm(8, 0.6, 32, 0xc8201f, 101, 8.5, 0),
    pn(60, 150, 0x3b3e44, 77, 0.03, 0),
    pn(48, 10, 0x3b3e44, 31, 0.03, 0),
  );
  const im = new T.InstancedMesh(
      new T.BoxGeometry(2, 1.3, 4.2),
      new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.4 }),
      240,
    ),
    m4 = new T.Matrix4();
  let n = 0;
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 28; j++)
      if (Math.random() < 0.65 && n < 240) {
        m4.setPosition(56 + i * 6, 0.8, -66 + j * 4.8);
        im.setMatrixAt(n, m4);
        if (im.setColorAt) im.setColorAt(n, new T.Color().setHSL(Math.random(), 0.85, 0.5));
        n++;
      }
  im.count = n;
  g.add(im);
  g.position.z = -4650;
  W(g);
})();
tunnel(-6850);
(function () {
  const L = 240,
    c = 0x8e9399,
    g = new T.Group();
  g.add(
    mm(0.8, 6.5, L, c, -7.9, 3.25, 0),
    mm(0.8, 6.5, L, c, 7.9, 3.25, 0),
    mm(16.6, 0.8, L, 0xa9aeb3, 0, 6.9, 0),
    mm(44, 8, L, 0x4f8a3a, 0, 11.4, 0),
    mm(14, 7.4, L, 0x9a9fa4, -15.4, 3.7, 0),
    mm(14, 7.4, L, 0x9a9fa4, 15.4, 3.7, 0),
  );
  [-3.5, 3.5].forEach((x) =>
    g.add(mm(0.35, 0.12, L - 4, 0xcfe8ff, x, 6.4, 0, { emissive: 0xbfe0ff, emissiveIntensity: 2.5 })),
  );
  for (let i = -L / 2 + 15; i < L / 2; i += 30)
    [-3.5, 3.5].forEach((x) => g.add(mm(1.2, 1.2, 3, 0x666b70, x, 6, i)));
  for (let i = -L / 2 + 20; i < L / 2; i += 60)
    [1, -1].forEach((q) => {
      const p = new T.Mesh(
        new T.PlaneGeometry(3, 0.9),
        new T.MeshBasicMaterial({ map: S("SALIDA", 192, 58, "#0a6e3a", "#fff", 34) }),
      );
      p.position.set(q * 7.45, 4.6, i);
      p.rotation.y = (-q * Math.PI) / 2;
      g.add(p);
    });
  for (let k = 0; k < 10; k++) {
    const t = tree();
    t.position.set(R(-19, 19), 15.4, -L / 2 + 12 + (k * (L - 24)) / 9);
    g.add(t);
  }
  [1, -1].forEach((q) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(14, 1.8),
      new T.MeshBasicMaterial({ map: S("CARRETERA SUBTERRÁNEA", 512, 66, "#1b2a4a", "#fff", 34) }),
    );
    p.position.set(0, 8.2, q * (L / 2 + 0.1));
    p.rotation.y = q > 0 ? 0 : Math.PI;
    g.add(p);
  });
  g.position.z = -8800;
  W(g);
})();
// Parque Nacional Río Frío (salida a la izquierda)
const BN = [
  { x0: 12, x1: 60, z: -12700, r: 45, a: 3500, m: "🎡 Parque de diversiones", t: 0, d: 0 },
  { x0: -112, x1: -68, z: -13750, r: 30, a: 2500, m: "🌳 Parque Nacional Río Frío", t: 0, d: 0 },
];
(function () {
  const g = new T.Group();
  [
    [-7, -13150, -90, -13250],
    [-90, -13250, -90, -13700],
  ].forEach(([x1, z1, x2, z2]) => {
    XS.push([x1, z1, x2, z2, 5]);
    const dx = x2 - x1,
      dz = z2 - z1,
      L = Math.hypot(dx, dz),
      ry = Math.atan2(-dx, -dz),
      mx_ = (x1 + x2) / 2,
      mz_ = (z1 + z2) / 2;
    g.add(pn(11, L, 0xe8e8e8, mx_, 0.025, mz_, ry), pn(10, L, 0x3b3e44, mx_, 0.03, mz_, ry));
  });
  XS.push([-90, -13720, -90, -13780, 24]);
  g.add(
    pn(48, 70, 0x6b6258, -90, 0.03, -13750),
    pn(80, 9, 0x2d6a8a, -90, 0.05, -13830),
    mm(4, 0.3, 11, 0x8a5a32, -90, 0.5, -13830),
  );
  g.add(
    mm(1.6, 6, 1.6, 0x6b4a2a, -98, 3, -13700),
    mm(1.6, 6, 1.6, 0x6b4a2a, -82, 3, -13700),
    mm(18, 1.4, 1.2, 0x5a3d22, -90, 6.3, -13700),
    mm(6, 3.5, 5, 0x8a5a32, -112, 1.75, -13740),
    mm(7, 0.4, 6, 0x2f6b3a, -112, 3.7, -13740),
  );
  const s2 = new T.Mesh(
    new T.PlaneGeometry(14, 1.4),
    new T.MeshBasicMaterial({ map: S("PARQUE NACIONAL RÍO FRÍO", 512, 51, "#0a5a2a", "#fff", 34) }),
  );
  s2.position.set(-90, 6.3, -13699.3);
  g.add(s2);
  const s3 = new T.Mesh(
    new T.PlaneGeometry(5.2, 1.4),
    new T.MeshBasicMaterial({ map: S("SALIDA · Parque Nacional Río Frío", 512, 138, "#0a6e3a", "#fff", 26) }),
  );
  s3.position.set(-9.8, 3.6, -13030);
  g.add(s3, mm(0.15, 3.6, 0.15, 0x777777, -9.8, 1.8, -13030));
  for (let k = 0; k < 45; k++) {
    const t = tree(),
      z = R(-13950, -13250),
      dx = (Math.random() < 0.5 ? -1 : 1) * R(14, 48);
    if (z > -13800 && z < -13690 && Math.abs(dx) < 26) continue;
    t.scale.setScalar(R(1.4, 2.6));
    t.position.set(-90 + dx, 0, z);
    g.add(t);
  }
  W(g);
})();
// Parque de diversiones (zona nocturna)
const amu = (function () {
  const g = new T.Group(),
    cl = [0xe63946, 0xf4a261, 0x2a9d8f, 0x457b9d, 0xffd166, 0x9b5de5],
    em = (c) => ({ emissive: c, emissiveIntensity: 0.8 });
  XS.push([7, -12700, 60, -12700, 5], [40, -12740, 40, -12660, 22]);
  g.add(
    pn(90, 120, 0x8a8f94, 105, 0.03, -12700),
    pn(52, 10, 0x3b3e44, 33, 0.03, -12700),
    pn(40, 80, 0x3b3e44, 40, 0.03, -12700),
    mm(2, 8, 2, 0xe63946, 62, 4, -12708),
    mm(2, 8, 2, 0xe63946, 62, 4, -12692),
    mm(2, 2, 18, 0xffd166, 62, 8.5, -12700, em(0xffaa00)),
  );
  const gt = new T.Mesh(
    new T.PlaneGeometry(16, 1.8),
    new T.MeshBasicMaterial({ map: S("PARQUE DE DIVERSIONES", 512, 58, "#e63946", "#fff", 34) }),
  );
  gt.position.set(61.2, 8.5, -12700);
  gt.rotation.y = -Math.PI / 2;
  g.add(gt);
  const rs = new T.Mesh(
    new T.PlaneGeometry(6, 1.4),
    new T.MeshBasicMaterial({ map: S("Parque de diversiones", 512, 119, "#e63946", "#fff", 40) }),
  );
  rs.position.set(9.5, 4, -12560);
  g.add(rs, mm(0.15, 4, 0.15, 0x777777, 9.5, 2, -12560));
  const fw = new T.Group(),
    pv = new T.Group(),
    cabs = [];
  pv.rotation.y = Math.PI / 2;
  pv.position.set(112, 22, -12680);
  fw.add(
    new T.Mesh(
      new T.TorusGeometry(18, 0.35, 8, 48),
      new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x6688ff, emissiveIntensity: 0.8 }),
    ),
  );
  for (let i = 0; i < 6; i++) {
    const sp = mm(0.25, 36, 0.25, 0xdddddd, 0, 0, 0);
    sp.rotation.z = (i * Math.PI) / 6;
    fw.add(sp);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6,
      c = mm(1.8, 1.6, 1.8, cl[i % 6], Math.cos(a) * 18, Math.sin(a) * 18, 0, em(cl[i % 6]));
    fw.add(c);
    cabs.push(c);
  }
  pv.add(fw);
  g.add(pv);
  [-1, 1].forEach((q) => {
    const l = mm(0.7, 24, 0.7, 0xcccccc, 112, 11, -12680 + q * 4.5);
    l.rotation.x = -q * 0.39;
    g.add(l);
  });
  const cr = new T.Group();
  cr.position.set(85, 0, -12740);
  cr.add(new T.Mesh(new T.CylinderGeometry(6, 6, 0.5, 24), M(0xffd166)), mm(1, 0.1, 1, 0xffffff, 0, 6.8, 0));
  const cn = new T.Mesh(new T.ConeGeometry(7, 3, 24), M(0xe63946));
  cn.position.y = 6.5;
  cr.add(cn);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    cr.add(
      mm(0.2, 5, 0.2, 0xffffff, Math.cos(a) * 4.5, 2.8, Math.sin(a) * 4.5),
      mm(0.8, 1.2, 1.8, cl[i], Math.cos(a) * 4.5, 1.4, Math.sin(a) * 4.5, em(cl[i])),
    );
  }
  g.add(cr);
  const P = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    P.push(new T.Vector3(130 + 16 * Math.cos(t), 9 + 6 * Math.sin(3 * t) + 5, -12700 + 40 * Math.sin(t)));
  }
  for (let i = 0; i < 48; i++) {
    const a = P[i],
      b = P[(i + 1) % 48],
      L = a.distanceTo(b),
      m = mm(0.5, 0.3, L + 0.2, 0xe63946, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    m.lookAt(b);
    g.add(m);
    if (i % 4 == 0) g.add(mm(0.35, a.y, 0.35, 0xcccccc, a.x, a.y / 2, a.z));
  }
  const cart = mm(2, 1.2, 3, 0xffd166, 0, 0, 0, em(0xffaa00));
  g.add(cart);
  [
    [75, -12660],
    [75, -12690],
    [88, -12665],
  ].forEach(([x, z], i) => g.add(mm(5, 3, 5, cl[i], x, 1.5, z), mm(5.4, 0.4, 5.4, 0xffffff, x, 3.2, z)));
  W(g);
  return { fw, cabs, cr, cart, P, t: 0 };
})();
// pista de agua y pista de carreras
(function () {
  const g = new T.Group();
  [
    [-70, -16400, 26],
    [85, -16700, 20],
    [-60, -16900, 16],
  ].forEach(([x, z, r]) => {
    const i = new T.Mesh(new T.CylinderGeometry(r, r + 4, 3, 24), M(0xe6d3a3));
    i.position.set(x, 0.5, z);
    i.receiveShadow = true;
    g.add(i);
    for (let k = 0; k < 6; k++) {
      const t = tree();
      t.position.set(x + R(-r * 0.6, r * 0.6), 1.9, z + R(-r * 0.6, r * 0.6));
      g.add(t);
    }
  });
  const lh = new T.Group();
  lh.add(
    mm(5, 16, 5, 0xffffff, 0, 8, 0),
    mm(5.2, 3, 5.2, 0xd62828, 0, 4, 0),
    mm(5.2, 3, 5.2, 0xd62828, 0, 10, 0),
    mm(6, 0.6, 6, 0x333333, 0, 16.3, 0),
    mm(3, 2.4, 3, 0xffe9a0, 0, 17.8, 0, { emissive: 0xffd060, emissiveIntensity: 1.2 }),
  );
  lh.position.set(-70, 2, -16400);
  g.add(lh, mm(8, 0.5, 30, 0x8a5a32, 18, 0.3, -16040), mm(8, 0.5, 30, 0x8a5a32, -18, 0.3, -16040));
  W(g);
})();
(function () {
  const g = new T.Group(),
    ck = cv(256, 32, (x, w, h) => {
      for (let i = 0; i < 32; i++)
        for (let j = 0; j < 4; j++) {
          x.fillStyle = (i + j) % 2 ? "#111" : "#fff";
          x.fillRect(i * 8, j * 8, 8, 8);
        }
    });
  [
    [-17100, "SALIDA"],
    [-17900, "META"],
  ].forEach(([z, t]) => {
    g.add(
      mm(0.8, 7, 0.8, 0x555555, -9, 3.5, z),
      mm(0.8, 7, 0.8, 0x555555, 9, 3.5, z),
      pn(14, 1.2, 0xffffff, 0, 0.06, z),
    );
    const b = new T.Mesh(
      new T.PlaneGeometry(19, 1.4),
      new T.MeshBasicMaterial({ map: ck, side: T.DoubleSide }),
    );
    b.position.set(0, 7.2, z);
    const l = new T.Mesh(
      new T.PlaneGeometry(6, 1.2),
      new T.MeshBasicMaterial({ map: S(t, 256, 51, "#d62828", "#fff", 40) }),
    );
    l.position.set(0, 5.9, z + 0.1);
    g.add(b, l);
  });
  for (let i = 0; i < 5; i++)
    g.add(
      mm(8, 1 + i * 1.2, 60, 0x9aa0a8, 28 + i * 8, (1 + i * 1.2) / 2, -17350),
      mm(
        7.6,
        0.3,
        58,
        [0xd62828, 0x1b4fa8, 0xf2c200, 0x2a9d8f, 0xe8e8e8][i],
        28 + i * 8,
        1 + i * 1.2 + 0.15,
        -17350,
      ),
    );
  g.add(
    mm(44, 0.4, 60, 0xdddddd, 44, 9, -17350),
    mm(0.5, 9, 0.5, 0x777777, 24, 4.5, -17322),
    mm(0.5, 9, 0.5, 0x777777, 24, 4.5, -17378),
    mm(10, 5, 40, 0xe8ecef, 50, 2.5, -17600),
    mm(10.4, 0.5, 40.4, 0xd62828, 50, 5.2, -17600),
  );
  const bz = new T.Mesh(
    new T.PlaneGeometry(8, 1.6),
    new T.MeshBasicMaterial({ map: S("BOXES", 256, 51, "#111", "#ffd23f", 40) }),
  );
  bz.position.set(44.9, 3.5, -17600);
  bz.rotation.y = -Math.PI / 2;
  g.add(bz);
  W(g);
})();
// pista de prueba (zona 18, sin carros)
const RAMPS = [
  { x: 5, z: -18200, h: 2.5 },
  { x: -5, z: -18400, h: 4 },
  { x: 5, z: -18700, h: 5.5 },
];
(function () {
  const g = new T.Group(),
    z0 = -18000,
    pw = { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 };
  g.add(
    pn(130, 1000, 0x6e7378, 0, 0.02, z0 - 500),
    pn(9, 400, 0xf2f2f2, -35, 0.025, z0 - 300),
    pn(8, 400, 0x2f3236, -35, 0.03, z0 - 300),
    pn(8, 0.6, 0xffffff, -35, 0.04, z0 - 100),
    pn(8, 0.6, 0xffffff, -35, 0.04, z0 - 500),
  );
  g.add(
    mm(0.3, 4, 0.3, 0x444444, -30, 2, z0 - 100),
    mm(0.5, 0.5, 0.3, 0xd62828, -30, 3.6, z0 - 100, { emissive: 0xff2020, emissiveIntensity: 1.5 }),
    mm(0.5, 0.5, 0.3, 0xf2c200, -30, 3, z0 - 100, { emissive: 0xffcc00, emissiveIntensity: 1.5 }),
    mm(0.5, 0.5, 0.3, 0x2fd05a, -30, 2.4, z0 - 100, { emissive: 0x22ff66, emissiveIntensity: 1.5 }),
  );
  const sr = new T.Mesh(
    new T.RingGeometry(29.6, 30.2, 64),
    new T.MeshBasicMaterial(Object.assign({ color: 0xffffff }, pw)),
  );
  sr.rotation.x = -Math.PI / 2;
  sr.position.set(35, 0.035, z0 - 300);
  g.add(sr);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12,
      c = new T.Mesh(new T.ConeGeometry(0.3, 0.8, 8), M(0xff6a00));
    c.position.set(35 + Math.cos(a) * 32, 0.4, z0 - 300 + Math.sin(a) * 32);
    g.add(c);
  }
  for (let i = 0; i < 10; i++) {
    const c = new T.Mesh(new T.ConeGeometry(0.35, 0.9, 8), M(i % 2 ? 0xff6a00 : 0xffffff));
    c.position.set(-52 + (i % 2 ? 1.5 : -1.5), 0.45, z0 - 130 - i * 30);
    g.add(c);
  }
  RAMPS.forEach((r) => {
    const L = Math.hypot(12, r.h),
      m = mm(8, 0.3, L, 0xf2c200, r.x, r.h / 2, r.z);
    m.rotation.x = Math.atan(r.h / 12);
    g.add(m);
  });
  for (let i = 0; i < 30; i++) g.add(mm(16, 0.18, 0.6, 0x333333, 0, 0.1, z0 - 860 - i * 1.4));
  g.add(
    mm(1.2, 1.2, 1000, 0x1a1a1a, -64, 0.6, z0 - 500),
    mm(1.2, 1.2, 1000, 0x1a1a1a, 64, 0.6, z0 - 500),
    mm(1.25, 0.2, 1000, 0xffffff, -64, 1.1, z0 - 500),
    mm(1.25, 0.2, 1000, 0xffffff, 64, 1.1, z0 - 500),
  );
  const sg = new T.Mesh(
    new T.PlaneGeometry(18, 2),
    new T.MeshBasicMaterial({ map: S("PISTA DE PRUEBA · SIN TRÁFICO", 512, 57, "#1b2a4a", "#fff", 30) }),
  );
  sg.position.set(0, 7, z0 - 15);
  g.add(sg, mm(0.8, 7, 0.8, 0x555555, -9.5, 3.5, z0 - 15), mm(0.8, 7, 0.8, 0x555555, 9.5, 3.5, z0 - 15));
  W(g);
})();
// Terminal de buses
(function () {
  const g = new T.Group();
  g.add(
    pn(46, 80, 0x3b3e44, 34, 0.03, 0),
    mm(34, 0.5, 30, 0xd0d3d5, 30, 6.5, -2),
    mm(10, 9, 44, 0xe8ecef, 52, 4.5, -2),
  );
  for (const z of [-14, 0, 14]) for (const x of [16, 44]) g.add(mm(0.6, 6.5, 0.6, 0x888888, x, 3.25, z));
  for (let i = 0; i < 5; i++) {
    const k = SK[i % 3];
    const b = new T.Group();
    b.add(
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
    b.rotation.y = Math.PI / 2;
    b.position.set(36, 0, -26 + i * 11);
    g.add(b);
    g.add(mm(0.15, 0.05, 11, 0xffffff, 29.5, 0.05, -26 + i * 11 + 5.5));
  }
  const sg = new T.Mesh(
    new T.PlaneGeometry(16, 2.4),
    new T.MeshBasicMaterial({ map: S("TERMINAL DE BUSES", 512, 77, "#0a5a9a", "#fff", 46) }),
  );
  sg.position.set(46.9, 8.4, -2);
  sg.rotation.y = -Math.PI / 2;
  g.add(sg);
  const s2 = new T.Mesh(
    new T.PlaneGeometry(6, 1.2),
    new T.MeshBasicMaterial({ map: S("TERMINAL", 256, 51, "#0a5a9a", "#fff", 34) }),
  );
  s2.position.set(9, 4, 30);
  g.add(s2, mm(0.3, 4, 0.3, 0x777777, 9, 2, 30));
  g.position.z = -15500;
  W(g);
})();
