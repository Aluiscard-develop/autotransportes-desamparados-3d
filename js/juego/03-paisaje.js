// js/juego/03-paisaje.js · texturas, calles, árboles, casas, montañas, postes y los tramos que se reciclan (scatter).
// Parte 3 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

const CH = 120,
  N = 8;
let RZ = -250,
  wasJam = 0,
  CK = 0,
  wallet = 30000,
  fuel = 100,
  fuT = 0,
  fuW = 0,
  pullT = 0,
  pullSide = 0,
  CZ = 0,
  mlT = 0,
  mlDone = 0,
  R2 = -7250,
  R3 = -11250,
  R4 = -12250,
  R5 = -23250, // Rotonda de las Naciones (zona 23)
  tbT = 0,
  tbDone = 0,
  nt = 0,
  BZ = -6500,
  trT = 0,
  trOn = 0,
  tx = 0,
  trHitT = 0,
  dgOn = 0,
  dgT = 0,
  dgV = 0,
  dEm = 0,
  nit = 0,
  heat = 0,
  hst = 0,
  onFire = false,
  em = 0,
  raceOn = 0,
  raceT = 0,
  wy = -3,
  rbMsg = 0,
  skin = 0,
  sz = 0,
  st0 = 0;
const S = (t, w, h, bg, fg, fs) =>
  cv(w, h, (x) => {
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.fillStyle = fg;
    x.font = "bold " + fs + "px system-ui,Arial";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(t, w / 2, h / 2 + 2);
  });
const GZ = [-1700, -4950, -7900, -9100, -10100, -13050, -14000, -15900, -17800],
  EXRL = [[-13050, -13780]],
  EXR = [
    [-570, -1400],
    [-3470, -4300],
    [-5470, -6300],
    [-11570, -12400],
    [-4560, -4740],
    [-12580, -12820],
    [-17280, -17420],
    [-17570, -17630],
    ...GZ.map((z) => [z + 25, z - 25]),
  ],
  HB = [
    [-5190, -5310],
    [-6780, -6920],
    [-8660, -8940],
  ];
const JAM = [
    [-1050, -1950],
    [-3050, -3550],
    [-8000, -8650],
    [-9100, -9900],
    [-13050, -13900],
    [-10050, -10950],
    [-14050, -14950],
    [-19150, -19850],
    [-21000, -21235],
    [-22050, -22950],
  ],
  inJam = (z) => JAM.some((r) => z - CZ < r[0] && z - CZ > r[1]);
const RC = (z) => {
  let b = RZ;
  for (const c of [R2, R3, R4, R5]) if (Math.abs(z - c) < Math.abs(z - b)) b = c;
  return b;
};
const pn = (w, d, c, x, y, z, ry = 0) => {
  const m = new T.Mesh(
    new T.PlaneGeometry(w, d),
    new T.MeshStandardMaterial({
      color: c,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = ry;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
};
const wT = cv(128, 128, (x, w, h) => {
  x.fillStyle = "#d3d9de";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    x.fillStyle = `rgba(0,0,0,${R(0.02, 0.06)})`;
    x.fillRect(R(0, w), R(0, h), R(2, 6), R(2, 6));
  }
  for (let j = 0; j < 4; j++) {
    x.fillStyle = "rgba(0,0,0,.1)";
    x.fillRect(0, j * 32 + 29, w, 3);
  }
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const X = i * 32 + 5,
        Y = j * 32 + 6,
        g = x.createLinearGradient(X, Y, X + 22, Y + 20);
      g.addColorStop(0, "#7fa2c2");
      g.addColorStop(0.45, "#36506e");
      g.addColorStop(1, "#1c2a3d");
      x.fillStyle = "#8f9aa4";
      x.fillRect(X - 2, Y - 2, 26, 24);
      x.fillStyle = g;
      x.fillRect(X, Y, 22, 20);
      x.fillStyle = "rgba(255,255,255,.22)";
      x.beginPath();
      x.moveTo(X + 3, Y + 20);
      x.lineTo(X + 9, Y);
      x.lineTo(X + 13, Y);
      x.lineTo(X + 7, Y + 20);
      x.fill();
      x.fillStyle = "#8f9aa4";
      x.fillRect(X + 10, Y, 2, 20);
    }
});
wT.wrapS = wT.wrapT = T.RepeatWrapping;
const wE = cv(128, 128, (x, w, h) => {
  x.fillStyle = "#000";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      if (Math.random() < 0.5) {
        const X = i * 32 + 5,
          Y = j * 32 + 6;
        x.fillStyle = ["#ffd58a", "#ffe9b8", "#cfe6ff", "#ffc070"][(Math.random() * 4) | 0];
        x.globalAlpha = R(0.55, 1);
        x.fillRect(X, Y, 22, 20);
        x.globalAlpha = 1;
      }
});
wE.wrapS = wE.wrapT = T.RepeatWrapping;
const FAC = [];
const crb = cv(64, 64, (x, w, h) => {
  x.fillStyle = "#d62828";
  x.fillRect(0, 0, w, 32);
  x.fillStyle = "#fff";
  x.fillRect(0, 32, w, 32);
});
crb.wrapS = crb.wrapT = T.RepeatWrapping;
crb.repeat.set(1, CH / 3);
const facade = (w, h, d, c) => {
  const t = wT.clone();
  t.needsUpdate = true;
  t.repeat.set(w / 8, h / 8);
  const e = wE.clone();
  e.needsUpdate = true;
  e.repeat.copy(t.repeat);
  const mt = new T.MeshStandardMaterial({
    map: t,
    color: c,
    roughness: 0.45,
    metalness: 0.25,
    emissive: 0xffffff,
    emissiveMap: e,
    emissiveIntensity: 0,
  });
  FAC.push(mt);
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mt);
  m.castShadow = m.receiveShadow = true;
  return m;
};
const mm = (w, h, d, c, x, y, z, o = {}) => {
  const m = new T.Mesh(
    new T.BoxGeometry(w, h, d),
    new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)),
  );
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
};
const roadT = cv(512, 512, (x, w, h) => {
  x.fillStyle = "#2d3035";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 16000; i++) {
    const v = R(18, 95) | 0;
    x.fillStyle = `rgba(${v},${v},${v + 5},${R(0.15, 0.5)})`;
    x.fillRect(R(0, w), R(0, h), R(1, 2.6), R(1, 2.6));
  }
  [-5.25, -1.75, 1.75, 5.25].forEach((lm) =>
    [-0.8, 0.8].forEach((o) => {
      const cx = ((lm + o + 7) / 14) * w,
        g = x.createLinearGradient(cx - 13, 0, cx + 13, 0);
      g.addColorStop(0, "rgba(8,8,10,0)");
      g.addColorStop(0.5, "rgba(8,8,10,.26)");
      g.addColorStop(1, "rgba(8,8,10,0)");
      x.fillStyle = g;
      x.fillRect(cx - 13, 0, 26, h);
    }),
  );
  for (let i = 0; i < 3; i++) {
    const v = R(32, 58) | 0;
    x.fillStyle = `rgba(${v},${v},${v + 4},.4)`;
    x.fillRect(R(40, w - 140), R(0, h - 110), R(40, 120), R(30, 110));
  }
  x.strokeStyle = "rgba(12,12,14,.55)";
  x.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    let px = R(30, w - 30),
      py = R(0, h - 100);
    x.beginPath();
    x.moveTo(px, py);
    for (let k = 0; k < 8; k++) {
      px += R(-9, 9);
      py += R(4, 13);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  x.fillStyle = "#f4f4f0";
  x.fillRect(16, 0, 8, h);
  x.fillRect(w - 24, 0, 8, h);
  x.fillRect(w * 0.25 - 3, h * 0.05, 6, h * 0.32);
  x.fillRect(w * 0.75 - 3, h * 0.05, 6, h * 0.32);
  x.fillStyle = "#ffc400";
  x.fillRect(w / 2 - 10, 0, 6, h);
  x.fillRect(w / 2 + 4, 0, 6, h);
  for (let i = 0; i < 5000; i++) {
    x.fillStyle = `rgba(40,40,44,${R(0.1, 0.45)})`;
    x.fillRect(R(0, w), R(0, h), R(1, 2), R(1, 2));
  }
});
roadT.wrapS = roadT.wrapT = T.RepeatWrapping;
roadT.repeat.set(1, CH / 14);
const roadM = new T.MeshStandardMaterial({ map: roadT, roughness: 0.85 }),
  roadG = new T.PlaneGeometry(14, CH);
// props
const M = (c) => new T.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });
const sh = (g) => {
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
};
const TG = {
    tr: new T.CylinderGeometry(0.22, 0.42, 3, 7),
    co: new T.ConeGeometry(1, 1, 8),
    ic: new T.IcosahedronGeometry(1, 0),
    dd: new T.DodecahedronGeometry(1, 0),
    pt: new T.CylinderGeometry(0.17, 0.3, 7.2, 7),
    lf: new T.BoxGeometry(0.55, 0.05, 3.8),
    nut: new T.SphereGeometry(0.2, 6, 5),
  },
  TM = {
    tr: M(0x5b3a1e),
    pt: M(0x8a6a48),
    nut: M(0x6b4a22),
    lv: [...Array(7)].map((_, i) =>
      M(new T.Color().setHSL(0.22 + i * 0.024, 0.42 + (i % 3) * 0.09, 0.2 + (i % 3) * 0.05).getHex()),
    ),
    pl: [M(0x4c9a3a), M(0x5aa83e), M(0x3f8a34)],
  };
const pk_ = (a) => a[(Math.random() * a.length) | 0];
function tree() {
  const g = new T.Group(),
    r = Math.random();
  if (r < 0.4) {
    const t = new T.Mesh(TG.tr, TM.tr);
    t.position.y = 1.5;
    g.add(t);
    const m = pk_(TM.lv);
    [
      [2.7, 3.4, 3.9],
      [2.2, 3, 5.6],
      [1.6, 2.6, 7.1],
      [1, 2.1, 8.5],
    ].forEach(([rr, hh, y]) => {
      const c = new T.Mesh(TG.co, m);
      c.scale.set(rr, hh, rr);
      c.position.y = y;
      c.rotation.y = R(0, 6);
      g.add(c);
    });
  } else if (r < 0.85) {
    const t = new T.Mesh(TG.tr, TM.tr);
    t.position.y = 1.6;
    t.scale.set(1.15, 1.1, 1.15);
    g.add(t);
    const m = pk_(TM.lv),
      n = 4 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const b = new T.Mesh(i % 2 ? TG.ic : TG.dd, m),
        s = R(1.5, 2.4);
      b.scale.set(s, s * R(0.75, 0.95), s);
      b.position.set(R(-1.3, 1.3), R(4.3, 6.4), R(-1.3, 1.3));
      b.rotation.set(R(0, 3), R(0, 3), 0);
      g.add(b);
    }
  } else {
    const tg = new T.Group(),
      t = new T.Mesh(TG.pt, TM.pt);
    t.position.y = 3.6;
    tg.add(t);
    const m = pk_(TM.pl);
    for (let i = 0; i < 8; i++) {
      const pv = new T.Group(),
        l = new T.Mesh(TG.lf, m);
      l.position.z = 1.6;
      pv.add(l);
      pv.position.y = 7.2;
      pv.rotation.set(0, (i * Math.PI) / 4 + R(-0.2, 0.2), 0);
      pv.rotateX(R(0.4, 0.8));
      tg.add(pv);
    }
    for (let i = 0; i < 3; i++) {
      const c = new T.Mesh(TG.nut, TM.nut);
      c.position.set(Math.cos(i * 2.1) * 0.3, 6.9, Math.sin(i * 2.1) * 0.3);
      tg.add(c);
    }
    tg.rotation.z = R(-0.16, 0.16);
    tg.rotation.y = R(0, 6);
    g.add(tg);
  }
  return sh(g);
}
const hc = [0xf2d0a4, 0xe9a8a0, 0xa8d0e6, 0xf5e27a, 0xbfe0b0, 0xf3efe4, 0xd8b8e6, 0x9fd6c8, 0xf6b77a],
  HRF = [0xb5482d, 0x8a3a2a, 0x6b7078, 0x3d6b8a, 0xa0522d].map(M);
const HG = {
    b: new T.BoxGeometry(7, 3.5, 7),
    r: new T.ConeGeometry(6, 2.6, 4),
    band: new T.BoxGeometry(7.06, 0.7, 7.06),
    door: new T.BoxGeometry(1.1, 2.1, 0.1),
    win: new T.BoxGeometry(1.3, 1.05, 0.1),
    fr: new T.BoxGeometry(1.55, 1.3, 0.06),
    st: new T.BoxGeometry(1.7, 0.2, 0.7),
  },
  winM = new T.MeshStandardMaterial({
    color: 0x2b4a66,
    roughness: 0.15,
    metalness: 0.3,
    emissive: 0xffc070,
    emissiveIntensity: 0,
  }),
  HDM = [M(0x6b3d22), M(0x2a5a8a), M(0x8a2a2a)],
  HFM = M(0xf7f7f2),
  HSM = M(0xb0aaa0);
function house() {
  const g = new T.Group(),
    col = new T.Color(pk_(hc)),
    b = new T.Mesh(HG.b, M(col.getHex()));
  b.position.y = 1.75;
  const r = new T.Mesh(HG.r, pk_(HRF));
  r.rotation.y = Math.PI / 4;
  r.position.y = 4.8;
  const bd = new T.Mesh(HG.band, M(col.clone().multiplyScalar(0.7).getHex()));
  bd.position.y = 0.35;
  const dr = new T.Mesh(HG.door, pk_(HDM));
  dr.position.set(1.6, 1.05, 3.52);
  const sp = new T.Mesh(HG.st, HSM);
  sp.position.set(1.6, 0.1, 3.8);
  g.add(b, r, bd, dr, sp);
  [
    [-1.5, 2, 3.52, 0],
    [3.52, 2, -0.6, Math.PI / 2],
    [-3.52, 2, -0.6, Math.PI / 2],
  ].forEach(([x, y, z, ry]) => {
    const f = new T.Mesh(HG.fr, HFM),
      w = new T.Mesh(HG.win, winM);
    f.position.set(x, y, z);
    w.position.set(x, y, z);
    f.rotation.y = w.rotation.y = ry;
    w.position.x += Math.sign(x) * (Math.abs(x) > 3 ? 0.03 : 0);
    w.position.z += z > 3 ? 0.03 : 0;
    g.add(f, w);
  });
  return sh(g);
}
function mount() {
  const rr = R(70, 140),
    hh = R(90, 210),
    ge = new T.ConeGeometry(rr, hh, 16, 7),
    p = ge.attributes.position,
    col = [],
    c = new T.Color(),
    hue = R(0.26, 0.36),
    sd = R(0, 100),
    snow = hh > 175;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      t = (y + hh / 2) / hh;
    if (t < 0.995) {
      const n =
        1 +
        0.2 * Math.sin(x * 0.045 + sd) * Math.cos(z * 0.05 + sd * 1.3) +
        0.09 * Math.sin((x + z) * 0.12 + sd);
      p.setX(i, x * n);
      p.setZ(i, z * n);
      if (t > 0.02) p.setY(i, y + Math.sin(x * 0.07 + z * 0.06 + sd) * hh * 0.035);
    }
    const nz_ = 0.5 + 0.5 * Math.sin(x * 0.11 + sd) * Math.cos(z * 0.09);
    if (t < 0.55) c.setHSL(hue + nz_ * 0.04, 0.38, 0.24 + nz_ * 0.06);
    else if (t < 0.78)
      c.setHSL(hue + 0.04, 0.22, 0.22 + nz_ * 0.05).lerp(
        new T.Color(0.42, 0.39, 0.35),
        ((t - 0.55) / 0.23) * 0.7,
      );
    else if (snow && t > 0.86) c.setRGB(0.92, 0.94, 0.97);
    else c.setRGB(0.45 + nz_ * 0.06, 0.42 + nz_ * 0.05, 0.38);
    col.push(c.r, c.g, c.b);
  }
  ge.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  ge.computeVertexNormals();
  const m = new T.Mesh(
    ge,
    new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
  );
  // radio real de la base (con el relieve), para que la montaña no se meta en la carretera
  let rb = 0;
  for (let i = 0; i < p.count; i++) rb = Math.max(rb, Math.hypot(p.getX(i), p.getZ(i)));
  m.userData.rb = rb;
  return m;
}
function pole() {
  const g = new T.Group(),
    p = new T.Mesh(new T.CylinderGeometry(0.15, 0.2, 9, 6), M(0x6b5a48));
  p.position.y = 4.5;
  const a = new T.Mesh(new T.BoxGeometry(2.4, 0.2, 0.2), M(0x4a3b2c));
  a.position.y = 8.6;
  g.add(p, a);
  return sh(g);
}
const chunks = [];
for (let i = 0; i < N; i++) {
  const g = new T.Group(),
    r = new T.Mesh(roadG, roadM);
  r.rotation.x = -Math.PI / 2;
  r.position.z = -CH / 2;
  r.receiveShadow = true;
  g.add(r);
  const pr = [];
  for (let j = 0; j < 14; j++) {
    const o = tree();
    pr.push({ o, t: 0 });
    g.add(o);
  }
  for (let j = 0; j < 7; j++) {
    const o = house();
    pr.push({ o, t: 1 });
    g.add(o);
  }
  for (let j = 0; j < 6; j++) {
    const o = mount();
    pr.push({ o, t: 2 });
    g.add(o);
  }
  for (let j = 0; j < 8; j++) {
    const o = pole();
    o.position.set(j % 2 ? -8.4 : 8.4, 0, -(j >> 1) * 30 - 12);
    g.add(o);
    pr.push({ o, t: 3 });
  }
  const bar = mm(0.9, 0.9, CH, 0xbdbdb8, 0, 0.45, -CH / 2);
  g.add(bar);
  pr.push({ o: bar, t: 5 });
  for (let j = 0; j < 4; j++) {
    const l = new T.Group(),
      e = { emissive: 0xffe9a0, emissiveIntensity: 1.2 };
    l.add(
      mm(0.25, 9, 0.25, 0x8a8f94, 0, 4.5, 0),
      mm(7, 0.2, 0.2, 0x8a8f94, 0, 9, 0),
      mm(0.9, 0.25, 0.5, 0xfff2c0, -3.4, 8.8, 0, e),
      mm(0.9, 0.25, 0.5, 0xfff2c0, 3.4, 8.8, 0, e),
    );
    l.position.set(0, 0, -15 - j * 30);
    g.add(l);
    pr.push({ o: l, t: 4 });
  }
  const rl = new T.Group();
  [-1, 1].forEach((q) =>
    rl.add(
      mm(0.3, 1, CH, 0xc8ccd0, q * 7.4, 0.55, -CH / 2),
      mm(0.9, 1.6, CH, 0xc4414d, q * 7.2, -0.8, -CH / 2),
    ),
  );
  g.add(rl);
  pr.push({ o: rl, t: 6 });
  const sl = new T.Mesh(
    new T.PlaneGeometry(7, CH * 0.8),
    new T.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.9 }),
  );
  sl.rotation.x = -Math.PI / 2;
  sl.position.set(15, 0.01, -CH / 2);
  g.add(sl);
  pr.push({ o: sl, t: 7 });
  for (let j = 0; j < 5; j++) {
    const h = 28 + j * 13,
      o = facade(9 + (j % 3) * 2, h, 9 + (j % 2) * 3, [0xc8d0d8, 0xb8c4d0, 0xd9d2c8, 0x9fb0c4, 0xc5ccd4][j]);
    g.add(o);
    pr.push({ o, t: 8, h: h / 2 });
  }
  const lrd = new T.Mesh(new T.PlaneGeometry(8, CH), roadM);
  lrd.rotation.x = -Math.PI / 2;
  lrd.position.set(-30, 0.005, -CH / 2);
  lrd.receiveShadow = true;
  g.add(lrd);
  pr.push({ o: lrd, t: 10 });
  pr.push({ o: r, t: 11 });
  {
    const bg = new T.Group();
    [-1, 1].forEach((q) => {
      for (let j = 0; j < 6; j++) {
        const bu = new T.Mesh(
          new T.SphereGeometry(0.6, 8, 6),
          new T.MeshStandardMaterial({ color: j % 2 ? 0xd62828 : 0xffffff, roughness: 0.5 }),
        );
        bu.position.set(q * 7.6, 0.1, -10 - j * 20);
        bg.add(bu);
      }
    });
    g.add(bg);
    pr.push({ o: bg, t: 12 });
    const cg = new T.Group();
    [-1, 1].forEach((q) =>
      cg.add(
        mm(0.7, 0.12, CH, 0xffffff, q * 7.35, 0.06, -CH / 2, { map: crb }),
        mm(0.9, 0.9, CH, 0x1a1a1a, q * 9.2, 0.45, -CH / 2),
        mm(0.92, 0.15, CH, 0xffffff, q * 9.2, 0.8, -CH / 2),
      ),
    );
    g.add(cg);
    pr.push({ o: cg, t: 13 });
  }
  {
    const bb = new T.Group(),
      bt = ["HOTEL", "BANCO", "FERRETERÍA", "FARMACIA", "PIZZERÍA", "TALLER"][(Math.random() * 6) | 0],
      pl2 = new T.Mesh(
        new T.PlaneGeometry(8, 3),
        new T.MeshBasicMaterial({
          map: S(
            bt,
            512,
            192,
            ["#1b4fa8", "#c8201f", "#0a6e3a", "#b8770a"][(Math.random() * 4) | 0],
            "#fff",
            72,
          ),
        }),
      );
    pl2.position.y = 8.5;
    bb.add(mm(0.4, 8, 0.4, 0x666666, 0, 4, 0), pl2, mm(8.2, 3.2, 0.1, 0x444444, 0, 8.5, -0.1));
    g.add(bb);
    pr.push({ o: bb, t: 9 });
  }
  sc.add(g);
  chunks.push({ g, k: i, pr });
}
function scatter(c) {
  const zn = Math.floor((c.k * CH + CH / 2) / 1000) % NZ,
    Z = (...a) => a.includes(zn);
  c.pr.forEach((p) => {
    const s = Math.random() < 0.5 ? -1 : 1,
      o = p.o,
      t = p.t,
      wz = () => -c.k * CH + o.position.z,
      w = () => Math.abs(wz() - RC(wz())) < 135, // rotondas (y los carriles externos de La Y Griega)
      nb = () => Math.abs(wz() - BZ) < 140,
      hz = () => HB.some((r) => wz() - CZ < r[0] && wz() - CZ > r[1]),
      rt = () =>
        (o.position.x > 3 && EXR.some((r) => wz() - CZ < r[0] && wz() - CZ > r[1])) ||
        (o.position.x < -3 && EXRL.some((r) => wz() - CZ < r[0] && wz() - CZ > r[1])),
      lf = () => {
        if (Math.abs(o.position.x + 30) < 10) o.position.x = -42 - R(0, 8);
      },
      zc = -c.k * CH - CH / 2 - CZ;
    if (p.f) return p.f(c, p, zn, { s, nb, hz, rt, w }); // lotes de js/mundo.js
    if (t == 11) {
      o.visible = !Z(16);
      return;
    }
    if (t == 12) {
      o.visible = Z(16);
      return;
    }
    if (t == 13) {
      o.visible = Z(17);
      return;
    }
    if (t == 10) {
      o.visible = Z(0, 1, 3, 4, 7, 8, 9, 13, 14, 15) && !HB.some((r) => zc < r[0] + 60 && zc > r[1] - 60);
      return;
    }
    if (t == 9) {
      o.position.set(s * R(12, 18), 0, -R(10, CH - 10));
      o.visible = Z(0, 1, 3, 4, 7, 8, 9, 11, 13, 14, 15, 19, 20, 21, 23) && !hz() && !rt() && !nb();
      return;
    }
    if (t == 3) {
      o.visible = !w() && !nb() && Z(0, 3, 4, 7, 9, 11, 13, 14, 15, 21, 23) && !hz() && !rt();
      return;
    }
    if (t == 4) {
      o.visible = Z(1, 9, 25, 30, 35, 41);
      return;
    }
    if (t == 5) {
      o.visible = Z(1, 4, 9, 25, 30, 35, 41);
      return;
    }
    if (t == 6) {
      o.visible = Z(2, 10);
      return;
    }
    if (t == 7) {
      o.visible = Z(3, 13);
      return;
    }
    if (t == 8) {
      o.position.set(s * R(18, 50), p.h, -R(0, CH));
      lf();
      o.visible = Z(8) && !w() && !hz() && !rt();
      return;
    }
    const f = Z(3, 5, 6, 24, 27);
    if (t == 0) {
      o.position.set(s * (Z(1) ? R(15, 45) : f ? R(9, 36) : R(11, 48)), 0, -R(0, CH));
      o.scale.setScalar(f ? R(1.3, 2.6) : R(0.8, 1.5));
      lf();
      o.visible = !Z(2, 8, 16, 18, 19, 20, 28, 29) && !nb() && !hz() && !rt();
      if (w()) o.position.x = s * R(90, 120);
    } else if (t == 1) {
      o.position.set(s * R(13, 32), 0, -R(0, CH));
      o.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      lf();
      o.visible = Z(0, 4, 7, 13, 21, 23) && !nb() && !hz() && !rt();
      if (w()) o.position.x = s * R(90, 120);
    } else {
      // montañas: el borde de la base queda siempre lejos de la carretera y de las calles laterales
      const k = R(0.8, 1.7),
        borde =
          (Z(5, 6, 24) ? 55 + R(0, 110) : Z(2, 16) ? 140 + R(0, 220) : 80 + R(0, 240)) +
          (Z(8) && s > 0 ? 170 : 0); // zona 8: deja libre la carretera a Vara Blanca
      o.scale.setScalar(k);
      o.position.set(s * (o.userData.rb * k + borde), (o.geometry.parameters.height * k) / 2 - 4, -R(0, CH));
      o.visible = !Z(27) && !((s < 0 && Z(26)) || (s > 0 && Z(30, 31))); // ni en el mar, la bahía, el canal ni encima de los volcanes
    }
  });
}
chunks.forEach(scatter);
