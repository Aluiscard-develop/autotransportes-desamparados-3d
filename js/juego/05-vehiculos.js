// js/juego/05-vehiculos.js · los demás vehículos que se pueden manejar (mkV 4 a 21, Oruga turbo).
// Parte 5 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// ===== otros vehículos =====
let cur = body,
  PV,
  PB,
  VWL = [];
const VM = {};
const wh = (g, r, w, x, y, z, c, hc, L) => {
  const p = new T.Group(),
    t = new T.Mesh(
      new T.CylinderGeometry(r, r, w, 18).rotateZ(Math.PI / 2),
      new T.MeshStandardMaterial({ color: c, roughness: 0.9 }),
    ),
    h = new T.Mesh(
      new T.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 12).rotateZ(Math.PI / 2),
      new T.MeshStandardMaterial({ color: hc, metalness: 0.8, roughness: 0.3 }),
    );
  t.castShadow = true;
  p.add(t, h);
  p.position.set(x, y, z);
  p.userData.r = r;
  g.add(p);
  L.push(p);
  return p;
};
const lt = (x, y, z) => {
    const m = mm(0.4, 0.25, 0.1, 0xfff6c0, x, y, z, { emissive: 0xfff2a0, emissiveIntensity: 1.5 }),
      sp = new T.Sprite(glowM);
    sp.scale.setScalar(1.8);
    m.add(sp);
    return m;
  },
  CH2 = { metalness: 0.9, roughness: 0.2 };
function mkV(k, fn) {
  const g = new T.Group(),
    w = [];
  fn(g, w);
  g.traverse((o) => {
    if (o.isMesh && o.material && o.material.roughness === 0.8 && !o.material.envMap) {
      o.material.envMap = ENV;
      o.material.envMapIntensity = 0.15;
    }
  });
  g.visible = false;
  bus.add(g);
  VM[k] = { g, w };
}
mkV(4, (g, w) => {
  const r = 0xc8201f,
    b = 0x1a1a1a,
    tn = 0xb07a45;
  g.add(
    mm(1.8, 0.7, 3.2, r, 0, 0.9, 0),
    mm(1.7, 0.5, 1.2, r, 0, 1.3, -1.05),
    mm(1.9, 0.35, 0.25, b, 0, 0.7, -1.75),
    mm(1.5, 0.9, 0.06, 0xbfe0f0, 0, 1.75, -0.55, { transparent: true, opacity: 0.4 }),
    mm(0.9, 0.4, 0.9, tn, -0.4, 1.35, 0.3),
    mm(0.9, 0.4, 0.9, tn, 0.4, 1.35, 0.3),
    mm(0.9, 0.8, 0.15, tn, -0.4, 1.8, 0.8),
    mm(0.9, 0.8, 0.15, tn, 0.4, 1.8, 0.8),
    mm(1.8, 0.08, 0.08, b, 0, 2.6, -0.55),
    mm(1.8, 0.08, 0.08, b, 0, 2.6, 1.2),
    mm(0.04, 1.6, 0.04, b, -0.9, 2.2, 1.5),
  );
  [-0.9, 0.9].forEach((x) =>
    g.add(
      mm(0.08, 1.2, 0.08, b, x, 2.0, -0.55),
      mm(0.08, 1.2, 0.08, b, x, 2.0, 1.2),
      mm(0.08, 0.08, 1.8, b, x, 2.6, 0.3),
      mm(0.5, 0.15, 1.4, 0x333333, x, 1.45, -1),
      mm(0.5, 0.15, 1.4, 0x333333, x, 1.45, 1.1),
    ),
  );
  [-0.55, -0.2, 0.2, 0.55].forEach((x) =>
    g.add(mm(0.22, 0.22, 0.22, 0xfff6c0, x, 2.75, -0.55, { emissive: 0xfff2a0, emissiveIntensity: 1.5 })),
  );
  [
    [-0.95, -1.1],
    [0.95, -1.1],
    [-0.95, 1.1],
    [0.95, 1.1],
  ].forEach(([x, z]) => wh(g, 0.62, 0.5, x, 0.62, z, 0x151515, 0xaaaaaa, w));
});
mkV(5, (g, w) => {
  const gr = 0x7aa93a,
    tn = 0xd8c288;
  g.add(
    mm(2.4, 0.8, 4.2, gr, 0, 1, 0),
    mm(2.2, 0.35, 1.4, gr, 0, 1.25, -2),
    mm(1.7, 0.7, 1.9, gr, 0, 1.75, 0.3),
    mm(0.22, 0.22, 2.4, 0x555555, 0, 1.85, -1.6),
    mm(0.05, 1.4, 0.05, 0x111111, 0.7, 2.9, 1),
  );
  [-1, 1].forEach((q) => {
    g.add(mm(0.8, 0.9, 4.4, tn, q * 1.45, 0.5, 0, { roughness: 1 }));
    for (let i = 0; i < 4; i++) wh(g, 0.55, 0.8, q * 1.45, 0.55, -1.65 + i * 1.1, 0xd8c288, 0x444444, w);
    const p = new T.Mesh(
      new T.PlaneGeometry(1.2, 0.4),
      new T.MeshBasicMaterial({ map: S("MCR", 128, 43, "#7aa93a", "#111", 30) }),
    );
    p.position.set(q * 0.86, 1.8, 0.3);
    p.rotation.y = (q * Math.PI) / 2;
    g.add(p);
  });
});
mkV(6, (g, w) => {
  const y = 0xe3b100;
  g.add(
    mm(1.6, 0.9, 1.4, y, 0, 1.45, 0.7),
    mm(1.3, 0.35, 1.3, y, 0, 1, -0.2),
    mm(1.4, 0.1, 1.4, y, 0, 2, 0.7),
    mm(0.95, 0.9, 0.12, 0xdddddd, 0, 1, -1.7, CH2),
    mm(0.8, 0.5, 0.9, 0x888888, 0, 1.55, -0.9, CH2),
    mm(1.7, 0.3, 3.6, 0x222222, 0, 0.5, 0),
    lt(0, 1, -1.78),
  );
  [-0.5, 0, 0.5].forEach((x) => g.add(mm(0.12, 0.12, 1.4, 0xcccccc, x * 0.9, 1.95, -1, CH2)));
  [-1, 1].forEach((q) =>
    g.add(
      mm(0.12, 0.12, 2.4, 0xcccccc, q * 0.95, 0.55, 0.3, CH2),
      mm(0.12, 0.12, 0.12, 0xcccccc, q * 0.9, 1.2, -1.3, CH2),
    ),
  );
  [-1, 1].forEach((q) => {
    wh(g, 0.45, 0.28, q * 0.85, 0.45, -1.6, 0x151515, 0xc8201f, w);
    wh(g, 0.6, 0.55, q * 0.95, 0.6, 1.2, 0x151515, 0xc8201f, w);
  });
});
mkV(7, (g, w) => {
  const b = 0x2a56b8,
    rd = 0xc8201f,
    bk = 0x9c8a6a;
  g.add(
    mm(1.4, 1.1, 2, b, 0, 1.5, 0.4),
    mm(1, 0.8, 1.6, b, 0, 1.3, -1.2),
    mm(0.9, 0.7, 0.1, 0xcfcfcf, 0, 1.3, -2.05, CH2),
    mm(1.2, 0.9, 1, 0x8a5a32, 0, 2.3, 0.8),
    mm(1.5, 0.08, 1.4, b, 0, 2.9, 0.8),
    mm(1.8, 0.12, 1.3, bk, 0, 0.5, -3.3),
    mm(1.8, 0.7, 0.1, bk, 0, 0.85, -3.9),
    mm(0.1, 0.7, 1.3, bk, -0.9, 0.85, -3.3),
    mm(0.1, 0.7, 1.3, bk, 0.9, 0.85, -3.3),
  );
  [-0.25, 0.25].forEach((x) => g.add(mm(0.12, 1.4, 0.12, 0xcccccc, x, 2.3, -0.7, CH2)));
  [-1, 1].forEach((q) => {
    wh(g, 0.9, 0.6, q * 1.15, 0.9, 1.1, 0x151515, rd, w);
    wh(g, 0.5, 0.35, q * 0.85, 0.5, -1.5, 0x151515, rd, w);
    g.add(mm(0.14, 0.14, 2.6, rd, q * 0.9, 1, -2), mm(0.14, 0.8, 0.14, rd, q * 0.9, 1.3, -0.8));
  });
});
mkV(8, (g, w) => {
  const o = 0xe08a1e;
  g.add(
    mm(1, 0.5, 2.4, o, 0, 0.8, 0),
    mm(0.9, 0.4, 1.1, o, 0, 0.95, -1.3),
    mm(0.8, 0.9, 0.06, 0xcfe8f5, 0, 1.6, -0.7, { transparent: true, opacity: 0.4 }),
    mm(0.8, 0.25, 1.3, 0x6b5a48, 0, 1.15, 0.9),
    mm(0.7, 0.35, 2.2, 0x111111, 0, 0.3, 0.8),
    mm(1.4, 0.06, 0.06, 0x333333, 0, 1.3, -0.5),
    lt(0, 1, -1.9),
  );
  [-0.6, 0.6].forEach((x) => {
    const k = mm(0.18, 0.1, 1.9, 0x222222, x, 0.2, -1.1);
    k.rotation.x = 0.12;
    g.add(k);
  });
  [-0.8, -0.1, 0.6, 1.4].forEach((z) => wh(g, 0.2, 0.7, 0, 0.25, z, 0x333333, 0x777777, w));
});
mkV(9, (g, w) => {
  const o = 0xb8672a,
    wg = new T.Group(),
    pr = new T.Group();
  g.add(
    mm(1.2, 0.6, 1.8, o, 0, 1, 0),
    mm(0.9, 0.3, 0.9, 0x555555, 0, 1.4, 0.3),
    mm(0.08, 3, 0.08, 0x222222, 0, 2.8, -0.4),
    mm(0.08, 3, 0.08, 0x222222, -0.5, 2.8, 0.5),
    mm(0.08, 3, 0.08, 0x222222, 0.5, 2.8, 0.5),
    mm(0.06, 0.06, 1.2, 0x222222, 0, 0.6, -1.2),
    mm(0.5, 0.5, 0.5, o, 0, 1.4, 1),
  );
  wg.add(
    mm(7.5, 0.12, 2.6, 0xcfdde6, 0, 0, 0),
    mm(7.6, 0.13, 0.4, 0xc8662a, -1.2, 0, -0.2),
    mm(7.6, 0.13, 0.4, 0xc8662a, 1.2, 0, -0.2),
  );
  wg.position.y = 4.5;
  g.add(wg);
  g.userData.wing = wg;
  [-0.9, 0.9].forEach((x) => wh(g, 0.4, 0.3, x, 0.4, 0.7, 0x222222, 0xc8662a, w));
  wh(g, 0.33, 0.25, 0, 0.33, -1.4, 0x222222, 0xc8662a, w);
  pr.add(mm(0.08, 1.4, 0.2, 0x222222, 0, 0, 0));
  pr.position.set(0, 1.5, 1.3);
  g.add(pr);
  g.userData.pr = pr;
});
mkV(10, (g, w) => {
  g.add(
    mm(2.4, 0.5, 2.8, 0x3a3d42, 0, 1, 0),
    mm(2.5, 0.25, 2.9, 0xe0a21a, 0, 1.25, 0),
    mm(0.3, 0.3, 0.3, 0xeeeeee, 0, 2.8, 0.2),
    mm(0.04, 1.2, 0.04, 0xaaaaaa, 0.9, 2, 0.9),
    lt(-0.7, 1.1, -1.45),
    lt(0.7, 1.1, -1.45),
  );
  const d = new T.Mesh(
    new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new T.MeshStandardMaterial({
      color: 0xcfe6f2,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.2,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );
  d.position.set(0, 1.35, -0.2);
  d.scale.setScalar(1.15);
  g.add(d);
  const ds = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), M(0xdddddd));
  ds.position.set(0.9, 2.7, 0.9);
  g.add(ds);
  [-1.2, 0, 1.2].forEach((z) =>
    [-1, 1].forEach((q) => {
      g.add(mm(0.8, 0.1, 0.1, 0xaaaaaa, q * 1.4, 0.85, z));
      wh(g, 0.55, 0.35, q * 1.8, 0.55, z, 0x151515, 0xdddddd, w);
    }),
  );
});
mkV(11, (g, w) => {
  const o = 0xe58a1f,
    k = 0x222222;
  g.add(
    mm(0.9, 0.5, 3.2, o, 0, 0.6, 0),
    mm(0.55, 0.3, 1.6, o, 0, 0.45, -2.1),
    mm(0.8, 0.12, 0.9, k, 0, 0.9, -0.2),
    mm(2, 0.08, 0.55, o, 0, 0.22, -2.8),
    mm(0.08, 0.3, 0.55, o, -1, 0.3, -2.8),
    mm(0.08, 0.3, 0.55, o, 1, 0.3, -2.8),
    mm(0.55, 0.7, 0.7, 0x888888, 0, 1, 0.7, CH2),
    mm(2, 0.1, 0.7, o, 0, 1.55, 2),
    mm(0.1, 0.7, 0.7, o, -1, 1.25, 2),
    mm(0.1, 0.7, 0.7, o, 1, 1.25, 2),
    mm(0.1, 0.8, 0.1, k, 0, 1, 1.9),
    mm(0.5, 0.4, 1.6, o, -0.7, 0.55, 0.3),
    mm(0.5, 0.4, 1.6, o, 0.7, 0.55, 0.3),
  );
  const hh = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), M(0xeeeeee));
  hh.position.set(0, 1.05, -0.2);
  g.add(hh);
  [-0.9, 0.9].forEach((x) => {
    wh(g, 0.38, 0.35, x, 0.38, -1.5, 0x151515, 0xbbbbbb, w);
    wh(g, 0.46, 0.5, x * 1.02, 0.46, 1.5, 0x151515, 0xbbbbbb, w);
  });
});
mkV(12, (g, w) => {
  const c = 0x2bb5c0,
    o = 0xe08a1e;
  g.add(
    mm(2, 1.8, 1.7, c, 0, 1.9, 0.2),
    mm(1.9, 0.9, 1.6, c, 0, 1.3, -1.6),
    mm(0.9, 0.55, 0.9, 0xcccccc, 0, 2, -1.7, CH2),
    mm(1.7, 1, 0.15, 0xdddddd, 0, 1.2, -2.45, CH2),
    mm(2.3, 0.4, 0.4, 0xcccccc, 0, 0.6, -2.7, CH2),
    mm(1.7, 0.5, 5.6, 0x222222, 0, 0.7, 0.4),
    mm(1.9, 0.5, 2.2, o, 0, 1, 1.9),
    mm(1.5, 1.1, 0.08, 0xbfe0f0, 0, 2.3, -0.6, { transparent: true, opacity: 0.45 }),
    mm(2.4, 0.12, 0.9, 0xdddddd, 0, 3.4, 2.3),
    mm(0.12, 1.2, 0.12, 0x222222, -0.9, 2.8, 2.3),
    mm(0.12, 1.2, 0.12, 0x222222, 0.9, 2.8, 2.3),
    lt(-0.7, 1.2, -2.55),
    lt(0.7, 1.2, -2.55),
  );
  [-1, 1].forEach((q) => {
    g.add(mm(0.12, 1.2, 0.12, 0xcccccc, q * 1.1, 3, -0.4, CH2), mm(0.5, 0.3, 1.3, o, q * 1.05, 0.9, -1.8));
    wh(g, 0.6, 0.45, q * 1.05, 0.6, -1.8, 0x151515, 0xbbbbbb, w);
    wh(g, 0.65, 0.55, q * 1.05, 0.65, 1.9, 0x151515, 0xbbbbbb, w);
  });
});
mkV(13, (g, w) => {
  const c = 0x2fb34a,
    b = 0x222222;
  g.add(
    mm(1.8, 1, 1.8, c, 0, 2.6, 0.2),
    mm(1.7, 0.6, 1.5, c, 0, 2.2, -1.5),
    mm(1.7, 0.9, 0.15, 0xdddddd, 0, 2.3, -2.3, CH2),
    mm(1.8, 0.6, 1.8, c, 0, 2.3, 1.6),
    mm(1.5, 0.9, 0.06, 0xbfe0f0, 0, 2.95, -0.7, { transparent: true, opacity: 0.45 }),
    mm(2, 0.5, 4.8, b, 0, 1.6, 0),
    mm(0.08, 1, 0.08, b, -0.8, 3.3, 0.9),
    mm(0.08, 1, 0.08, b, 0.8, 3.3, 0.9),
    mm(1.7, 0.08, 0.08, b, 0, 3.8, 0.9),
    mm(0.15, 1.4, 0.15, 0xaaaaaa, 0.9, 3.2, -0.6, CH2),
    lt(-0.6, 2.3, -2.4),
    lt(0.6, 2.3, -2.4),
  );
  [
    [-1.5, -1.6],
    [1.5, -1.6],
    [-1.5, 1.7],
    [1.5, 1.7],
  ].forEach(([x, z]) => {
    wh(g, 1.1, 0.9, x, 1.1, z, 0x2a1d14, 0xbbbbbb, w);
    g.add(mm(0.14, 1.2, 0.14, 0xf2c200, x * 0.8, 1.8, z));
  });
});
mkV(14, (g, w) => {
  const c = 0x2b79d6;
  g.add(
    mm(1.7, 0.7, 3.4, c, 0, 0.85, 0),
    mm(1.5, 0.55, 1.7, c, 0, 1.45, 0.2),
    mm(1.52, 0.4, 1.6, 0xbfe0f0, 0, 1.5, 0.2, { transparent: true, opacity: 0.5 }),
    mm(0.8, 0.12, 0.9, 0x1a1a1a, 0, 1.2, -1.1),
    mm(1.8, 0.3, 0.3, 0x888888, 0, 0.55, -1.8),
    mm(1.7, 0.1, 0.5, 0x222222, 0, 1.65, 1.8),
    mm(0.1, 0.4, 0.1, 0x222222, -0.7, 1.45, 1.8),
    mm(0.1, 0.4, 0.1, 0x222222, 0.7, 1.45, 1.8),
    lt(-0.6, 0.9, -1.72),
    lt(0.6, 0.9, -1.72),
  );
  [-1, 1].forEach((q) =>
    [-1.2, 1.2].forEach((z) => wh(g, 0.42, 0.3, q * 0.9, 0.42, z, 0x151515, 0xbbbbbb, w)),
  );
});
const smT = cv(64, 64, (x, w, h) => {
  for (let i = 0; i < 7; i++) {
    const px = 32 + R(-9, 9),
      py = 32 + R(-9, 9),
      r = R(12, 24),
      g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,.5)");
    g.addColorStop(0.6, "rgba(255,255,255,.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }
});
const FX = [];
for (let i = 0; i < 80; i++) {
  const m = new T.Sprite(
    new T.SpriteMaterial({ map: smT, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
  );
  m.visible = false;
  sc.add(m);
  FX.push({ m, t: 0, l: 1, v: new T.Vector3() });
}
const fireL = new T.PointLight(0xff7a18, 0, 22);
sc.add(fireL);
mkV(15, (g, w) => {
  const y = 0xf2c200,
    k = 0x151515;
  g.add(
    mm(1.5, 0.6, 2.2, y, 0, 0.95, 0.2),
    mm(1.4, 0.45, 1.2, y, 0, 1, -1.1),
    mm(0.6, 0.4, 0.5, k, 0, 1.3, -0.4),
    mm(0.9, 0.35, 0.9, k, 0, 1.35, 0.8),
    mm(1.6, 0.15, 0.3, k, 0, 0.8, -1.75),
    mm(0.9, 0.5, 0.06, 0xbfe0f0, 0, 1.55, -0.7, { transparent: true, opacity: 0.4 }),
    mm(0.12, 1.1, 0.12, 0xcccccc, -0.6, 1.5, 1.2, CH2),
    lt(-0.4, 1, -1.72),
    lt(0.4, 1, -1.72),
  );
  [-1, 1].forEach((q) => {
    g.add(mm(0.55, 0.6, 3.2, k, q * 0.95, 0.5, 0.1), mm(0.6, 0.15, 3.3, y, q * 0.95, 0.85, 0.1));
    [-1.2, -0.4, 0.4, 1.2].forEach((z) => wh(g, 0.3, 0.55, q * 0.95, 0.35, z, 0x2a2a2a, 0xf2c200, w));
  });
  const hd = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), M(0xe0b08a));
  hd.position.set(0, 2.2, 0.5);
  g.add(mm(0.5, 0.7, 0.35, 0x151f3a, 0, 1.7, 0.5), hd);
});
mkV(16, (g, w) => {
  const o = 0xe8561a,
    k = 0x151515;
  g.add(
    mm(2.7, 0.55, 5.3, k, 0, 0.4, 0),
    mm(2.2, 0.7, 4.6, o, 0, 1, 0),
    mm(1.9, 0.45, 1.6, o, 0, 0.95, -2.4),
    mm(1.7, 0.6, 0.06, 0xbfe0f0, 0, 1.7, -1, { transparent: true, opacity: 0.4 }),
    mm(0.08, 1.2, 0.08, k, -0.8, 1.8, -0.9),
    mm(0.08, 1.2, 0.08, k, 0.8, 1.8, -0.9),
    mm(1.7, 0.08, 0.08, k, 0, 2.4, -0.9),
    mm(0.5, 0.4, 0.5, 0x666666, -0.5, 1.5, 0.2),
    mm(0.5, 0.4, 0.5, 0x666666, 0.5, 1.5, 0.2),
    mm(0.5, 0.4, 0.5, 0x666666, 0, 1.5, 0.9),
    lt(-0.5, 1, -2.65),
    lt(0.5, 1, -2.65),
  );
  const du = new T.Mesh(
    new T.CylinderGeometry(1.15, 1.15, 0.5, 24, 1, true).rotateX(Math.PI / 2),
    new T.MeshStandardMaterial({ color: o, side: T.DoubleSide, roughness: 0.4, metalness: 0.3 }),
  );
  du.position.set(0, 2, 2.3);
  g.add(du);
  const fan = new T.Group();
  for (let i = 0; i < 4; i++) {
    const b = mm(0.18, 2, 0.05, 0x222222, 0, 0, 0);
    b.rotation.z = (i * Math.PI) / 4;
    fan.add(b);
  }
  fan.position.set(0, 2, 2.3);
  g.add(fan);
  g.userData.fan = fan;
  [-0.5, 0.5].forEach((x) => g.add(mm(0.08, 1.2, 0.9, o, x, 2, 2.8)));
});
mkV(17, (g, w) => {
  const gr = 0x6fc23a,
    b = 0x222222;
  g.add(
    mm(1.2, 0.3, 3.2, 0x555555, 0, 0.95, 0),
    mm(0.9, 0.5, 1, b, 0, 1.3, 0.3),
    mm(1.7, 0.12, 0.12, gr, 0, 2.4, -0.9),
    mm(1.7, 0.12, 0.12, gr, 0, 2.4, 0.9),
    mm(1.7, 0.12, 0.12, gr, 0, 2, -1.3),
    mm(1.5, 0.5, 0.06, 0x1a2a3a, 0, 1.6, -0.95, { transparent: true, opacity: 0.5 }),
    mm(0.9, 0.6, 0.9, gr, 0, 1.9, 1.7),
    mm(0.4, 0.8, 0.5, gr, 0, 2.2, 2),
  );
  for (const x of [-0.8, 0.8])
    g.add(
      mm(0.12, 1.4, 0.12, gr, x, 1.7, -0.9),
      mm(0.12, 1.4, 0.12, gr, x, 1.7, 0.9),
      mm(0.12, 0.12, 2.2, gr, x, 2.4, 0),
      mm(0.12, 0.9, 0.12, gr, x, 1.4, -1.5),
      mm(0.12, 0.12, 3.2, gr, x, 1, 0),
      mm(0.12, 0.12, 2.2, gr, x, 1.8, 0),
    );
  [
    [-1.25, -1.2],
    [1.25, -1.2],
    [-1.25, 1.3],
    [1.25, 1.3],
  ].forEach(([x, z]) => {
    wh(g, 0.75, 0.6, x, 0.75, z, 0x151515, 0xd62828, w);
    const sp = mm(0.18, 1, 0.18, 0x2a56d8, x * 0.85, 1.3, z);
    sp.rotation.z = x > 0 ? -0.35 : 0.35;
    g.add(sp);
  });
});
mkV(18, (g, w) => {
  const b = 0x2a6fc9,
    en = new T.Mesh(
      new T.CylinderGeometry(0.85, 0.85, 2.6, 20).rotateX(Math.PI / 2),
      new T.MeshStandardMaterial({
        color: b,
        metalness: 0.3,
        roughness: 0.35,
        envMap: ENV,
        envMapIntensity: 0.35,
      }),
    ),
    cp = new T.Mesh(
      new T.CylinderGeometry(0.95, 0.95, 0.5, 20).rotateX(Math.PI / 2),
      new T.MeshStandardMaterial({ color: 0xd89a2a, metalness: 0.8, roughness: 0.25 }),
    );
  en.position.set(0, 1, 1.3);
  cp.position.set(0, 1, 2.8);
  en.castShadow = true;
  g.add(en, cp);
  g.add(
    mm(0.9, 0.4, 2.6, b, 0, 0.55, -1.2),
    mm(0.6, 0.3, 1, b, 0, 0.6, -2.4),
    mm(0.5, 0.4, 0.5, 0x222222, 0, 1, -0.5),
    mm(0.9, 0.3, 1.1, 0x333333, 0, 0.5, 0.5),
    mm(0.06, 0.9, 0.06, 0x111111, 0, 1, -0.9),
    mm(0.4, 0.04, 0.04, 0x111111, 0, 1.4, -0.9),
  );
  [-0.35, -0.12, 0.12, 0.35].forEach((x) => g.add(mm(0.14, 0.5, 0.14, 0x222222, x, 1.95, 1, CH2)));
  [-1, 1].forEach((q) => {
    wh(g, 0.3, 0.25, q * 0.5, 0.3, -2.3, 0x151515, 0xbbbbbb, w);
    wh(g, 0.78, 0.5, q * 1.1, 0.78, 1.5, 0x151515, 0xbbbbbb, w);
  });
});
mkV(19, (g, w) => {
  const t = 0x2fc4c8,
    p = 0xd05bd0,
    pu = 0x8a3fc7,
    br = 0x7a4a32;
  g.add(
    mm(1.9, 0.6, 4.2, t, 0, 0.85, 0),
    mm(1.85, 0.35, 1.6, p, 0, 1.2, -1.3),
    mm(1.2, 0.12, 3.2, p, 0, 1.2, 0.3),
    mm(1.7, 0.5, 0.06, 0xbfe0f0, 0, 1.55, -0.6, { transparent: true, opacity: 0.4 }),
    mm(0.8, 0.3, 0.8, br, -0.45, 1.2, 0.5),
    mm(0.8, 0.3, 0.8, br, 0.45, 1.2, 0.5),
    mm(0.8, 0.6, 0.2, br, -0.45, 1.55, 1),
    mm(0.8, 0.6, 0.2, br, 0.45, 1.55, 1),
    mm(1.9, 0.2, 0.2, 0xdddddd, 0, 0.55, -2.15, CH2),
    mm(0.9, 0.4, 0.1, 0x333333, 0, 0.95, -2.12),
    mm(0.2, 0.6, 1.2, t, -0.95, 1.3, 1.7),
    mm(0.2, 0.6, 1.2, t, 0.95, 1.3, 1.7),
    lt(-0.7, 1, -2.15),
    lt(0.7, 1, -2.15),
    lt(-0.35, 1, -2.15),
    lt(0.35, 1, -2.15),
  );
  [-1, 1].forEach((q) => [-1.3, 1.3].forEach((z) => wh(g, 0.5, 0.3, q * 0.95, 0.5, z, 0x151515, pu, w)));
});
mkV(20, (g, w) => {
  const b = 0x1e5fd6,
    k = 0x151515;
  g.add(
    mm(1, 0.55, 2.2, b, 0, 0.85, -0.1),
    mm(0.9, 0.4, 1, b, 0, 0.9, -1.3),
    mm(0.7, 0.35, 1.6, k, 0, 1.1, 0.9),
    mm(0.7, 0.7, 0.06, 0xbfe0f0, 0, 1.5, -0.9, { transparent: true, opacity: 0.4 }),
    mm(1.5, 0.06, 0.06, k, 0, 1.35, -0.6),
    mm(0.06, 0.06, 1, 0xcccccc, -0.6, 1.3, 0, CH2),
    mm(0.06, 0.06, 1, 0xcccccc, 0.6, 1.3, 0, CH2),
    mm(0.8, 0.3, 2.3, k, 0, 0.35, 1),
    mm(0.6, 0.6, 0.8, k, 0, 0.9, 1.9),
    lt(0, 1, -1.8),
  );
  [-0.6, 0.6].forEach((x) => {
    const sk = mm(0.2, 0.1, 2, b, x, 0.18, -1.4);
    sk.rotation.x = 0.14;
    g.add(sk);
  });
  [-0.5, 0.3, 1.1, 1.8].forEach((z) => wh(g, 0.2, 0.7, 0, 0.28, z, 0x333333, 0x777777, w));
});
// 🐲 Oruga turbo: todoterreno de orugas con alerón trasero y motor súper rápido
const ORUGA_TEX = cv(64, 64, (x, w, h) => {
  x.fillStyle = "#18191b";
  x.fillRect(0, 0, w, h);
  x.fillStyle = "#3b3d40";
  for (let i = 0; i < 8; i++) x.fillRect(0, i * 8, w, 4);
  x.fillStyle = "#56595d";
  x.fillRect(0, 0, 6, h);
  x.fillRect(w - 6, 0, 6, h);
});
ORUGA_TEX.wrapS = ORUGA_TEX.wrapT = T.RepeatWrapping;
ORUGA_TEX.repeat.set(1, 6);
mkV(21, (g, w) => {
  const k = 0x1c1f24,
    v = 0x7cff2e,
    gr = 0x3a3f46,
    trM = new T.MeshStandardMaterial({ map: ORUGA_TEX, roughness: 0.9 });
  [-1, 1].forEach((q) => {
    const t = new T.Mesh(new T.BoxGeometry(0.62, 0.8, 4.6), trM);
    t.position.set(q * 1.22, 0.45, 0);
    t.castShadow = true;
    g.add(t);
    [-2.3, 2.3].forEach((z) => {
      const c = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.62, 14).rotateZ(Math.PI / 2), trM);
      c.position.set(q * 1.22, 0.45, z);
      g.add(c);
    });
    for (let i = 0; i < 5; i++) wh(g, 0.3, 0.1, q * 1.56, 0.42, -1.7 + i * 0.85, 0x222222, v, w);
    g.add(mm(0.72, 0.12, 4.9, v, q * 1.22, 0.92, 0));
  });
  const nariz = mm(1.9, 0.12, 1.2, v, 0, 1.42, -1.6);
  nariz.rotation.x = -0.18;
  g.add(
    mm(1.9, 0.55, 4.2, k, 0, 1.05, 0),
    mm(1.7, 0.3, 1.4, k, 0, 1.25, -1.9),
    nariz,
    mm(1.4, 0.55, 1.5, 0x9fd8ff, 0, 1.6, -0.2, {
      transparent: true,
      opacity: 0.45,
      metalness: 0.3,
      roughness: 0.05,
    }),
    mm(1.5, 0.08, 1.6, k, 0, 1.9, -0.2),
    mm(0.6, 0.35, 0.9, gr, 0, 1.55, 1.2),
    mm(0.5, 0.18, 0.6, v, 0, 1.82, 1.2),
    lt(-0.6, 1.15, -2.62),
    lt(0.6, 1.15, -2.62),
  );
  [-0.35, 0.35].forEach((x) =>
    g.add(
      mm(0.16, 0.16, 0.5, 0xaaaaaa, x, 1.25, 2.25, CH2),
      mm(0.14, 0.14, 0.05, 0xff7a18, x, 1.25, 2.5, { emissive: 0xff5a00, emissiveIntensity: 2 }),
    ),
  );
  // alerón trasero
  [-0.75, 0.75].forEach((x) => g.add(mm(0.08, 0.75, 0.18, k, x, 1.75, 2.05)));
  g.add(mm(2.4, 0.08, 0.6, v, 0, 2.15, 2.1));
  [-1.2, 1.2].forEach((x) => g.add(mm(0.05, 0.35, 0.7, k, x, 2.15, 2.1)));
});
