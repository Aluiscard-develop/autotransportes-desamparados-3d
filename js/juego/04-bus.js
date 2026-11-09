// js/juego/04-bus.js · el bus: carrocería, parabrisas, luces y pinturas (SK, applySkin).
// Parte 4 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// autobus
const bus = new T.Group(),
  body = new T.Group();
bus.add(body);
const bx = (w, h, d, c, x, y, z, o = {}) => {
  const m = new T.Mesh(
    new T.BoxGeometry(w, h, d),
    new T.MeshPhysicalMaterial(
      Object.assign(
        {
          color: c,
          roughness: 0.35,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          side: T.DoubleSide,
          envMap: ENV,
          envMapIntensity: 0.3,
        },
        o,
      ),
    ),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  body.add(m);
  return m;
};
// Carrocería: antes era una sola caja que tapaba las ventanas (desde adentro solo se veía blanco).
// Ahora: parte baja hasta la línea de ventanas (y=1.75), techo aparte, columnas y vidrios de verdad.
const mBody = bx(2.6, 1.35, 11.5, 0xf4f6f8, 0, 1.075, 0),
  mB1 = bx(2.62, 0.4, 11.52, 0x3aa8d8, 0, 0.72, 0),
  mB2 = bx(2.63, 0.4, 11.53, 0x1a3a8a, 0, 1.12, 0),
  mFr = bx(2.62, 0.8, 0.06, 0x1a3a8a, 0, 1.1, -5.78);
const mTecho = bx(2.6, 0.25, 11.5, 0xf4f6f8, 0, 2.875, 0);
mTecho.material = mBody.material; // mismo color que la carrocería (cambia con la pintura)
bx(2.5, 0.12, 11.2, 0xdcdfe3, 0, 3.05, 0);
bx(1.6, 0.3, 2.2, 0xaab0b6, 0, 3.25, -1);
// vidrios laterales y trasero: un poco polarizados
const gl = {
  color: 0x6d8fa3,
  roughness: 0.02,
  metalness: 0.1,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
};
// parabrisas: claro para ver bien desde la cabina
const glF = {
  color: 0xdff2fa,
  roughness: 0.01,
  metalness: 0.1,
  transparent: true,
  opacity: 0.09,
  depthWrite: false,
};
bx(0.06, 1, 9.8, 0, 1.325, 2.25, 0.2, gl);
bx(0.06, 1, 9.8, 0, -1.325, 2.25, 0.2, gl);
[-1, 1].forEach((s) => {
  bx(0.06, 1, 1, 0, s * 1.325, 2.25, -5.22, glF); // ventanita lateral junto al chofer
  bx(0.1, 1, 0.12, 0x1c1f24, s * 1.32, 2.25, -4.72); // columna detrás de la ventanita
  bx(0.07, 1.05, 0.08, 0x1c1f24, s * 1.27, 2.25, -5.74); // columnas del parabrisas
  bx(0.08, 1, 0.65, 0xf4f6f8, s * 1.31, 2.25, 5.43).material = mBody.material; // cierre trasero
  bx(0.16, 1, 0.1, 0xf4f6f8, s * 1.22, 2.25, 5.74).material = mBody.material;
});
bx(2.4, 1.3, 0.06, 0, 0, 2.2, -5.77, glF); // PARABRISAS
bx(2.5, 0.08, 0.1, 0x111317, 0, 2.77, -5.76); // marco de hule superior
bx(2.5, 0.08, 0.1, 0x111317, 0, 1.77, -5.76); // marco inferior
bx(2.38, 0.2, 0.07, 0x1b4f63, 0, 2.64, -5.775, { transparent: true, opacity: 0.55, depthWrite: false }); // franja polarizada
// limpiaparabrisas
[
  [-0.62, 0.22],
  [0.52, 0.3],
].forEach(([x, a]) => {
  const w = bx(0.95, 0.03, 0.03, 0x15171a, x, 1.86, -5.82);
  w.rotation.z = a;
});
// tablero a todo lo ancho, retrovisor interno y visera
bx(2.4, 0.12, 0.55, 0x2a2f36, 0, 1.8, -5.45);
bx(0.24, 0.07, 0.03, 0x111317, 0.1, 2.66, -5.64);
bx(0.6, 0.03, 0.2, 0x2a2f36, -0.8, 2.735, -5.55);
bx(2.3, 1, 0.06, 0, 0, 2.2, 5.77, gl);
for (let z = -3.2; z < 5; z += 1.6) [-1, 1].forEach((s) => bx(0.08, 1, 0.12, 0xf4f6f8, s * 1.33, 2.25, z));
bx(0.12, 0.6, 0.25, 0x111, -1.55, 2.1, -5.1);
bx(0.12, 0.6, 0.25, 0x111, 1.55, 2.1, -5.1);
bx(2.65, 0.5, 0.3, 0xf4f6f8, 0, 0.55, -5.8);
bx(2.65, 0.5, 0.3, 0xf4f6f8, 0, 0.55, 5.8);
const hl = { color: 0xfff6c0, emissive: 0xfff2a0, emissiveIntensity: 1.5 };
[-0.95, 0.95].forEach((x) => {
  const m = bx(0.4, 0.25, 0.1, 0, x, 0.9, -5.78, hl),
    sp = new T.Sprite(glowM);
  sp.scale.setScalar(2.4);
  m.add(sp);
});
const tm = new T.MeshStandardMaterial({ color: 0x550000, emissive: 0xff0000, emissiveIntensity: 0.3 });
[-0.95, 0.95].forEach((x) => {
  const m = new T.Mesh(new T.BoxGeometry(0.4, 0.25, 0.1), tm),
    sp = new T.Sprite(rGlow);
  sp.scale.setScalar(1.8);
  m.add(sp);
  m.position.set(x, 0.9, 5.78);
  body.add(m);
});
const sm = new T.MeshBasicMaterial({
    map: S("GRUPO ATD  ·  AUTOTRANSPORTES DESAMPARADOS", 1024, 48, "#1a3a8a", "#fff", 34),
  }),
  sp = new T.PlaneGeometry(8.6, 0.4);
[1, -1].forEach((s) => {
  const m = new T.Mesh(sp, sm);
  m.position.set(s * 1.33, 1.12, 0.1);
  m.rotation.y = (s * Math.PI) / 2;
  body.add(m);
});
const dm_ = new T.Mesh(
  new T.PlaneGeometry(2, 0.4),
  new T.MeshBasicMaterial({ map: S("SAN JOSÉ - DESAMPARADOS", 512, 96, "#111", "#ffb020", 44) }),
);
dm_.position.set(0, 2.92, -5.79);
dm_.rotation.y = Math.PI;
const ck = new T.Mesh(
  new T.PlaneGeometry(2.5, 0.16),
  new T.MeshBasicMaterial({
    map: cv(256, 24, (x, w, h) => {
      for (let i = 0; i < 32; i++)
        for (let j = 0; j < 3; j++) {
          x.fillStyle = (i + j) % 2 ? "#d62828" : "#fff";
          x.fillRect(i * 8, j * 8, 8, 8);
        }
    }),
  }),
);
ck.position.set(0, 1.25, -5.82);
ck.rotation.y = Math.PI;
body.add(ck);
const gt = new T.Mesh(
  new T.PlaneGeometry(1.1, 0.22),
  new T.MeshBasicMaterial({ map: S("GRUPO ATD", 256, 52, "#1a3a8a", "#fff", 36) }),
);
gt.position.set(-0.6, 1.45, -5.82);
gt.rotation.y = Math.PI;
body.add(gt);
const SK = [
  {
    b: 0xf4f6f8,
    s: 0x3aa8d8,
    t: 0x1a3a8a,
    side: "GRUPO ATD  ·  AUTOTRANSPORTES DESAMPARADOS",
    bg: "#1a3a8a",
    dest: "SAN JOSÉ - DESAMPARADOS",
    fr: "GRUPO ATD",
  },
  {
    b: 0xc8201f,
    s: 0xf2f2f2,
    t: 0xc8201f,
    side: "TUBULARIAS · SANTA TERESA · ORIENTE",
    bg: "#a81818",
    dest: "CAIO",
    fr: "SANTA TERESA",
  },
  {
    b: 0xf1ede0,
    s: 0xe5b323,
    t: 0xe7e2d0,
    side: "COSTA RICA · MERCEDES-BENZ",
    bg: "#d9a81e",
    dest: "MERCEDES-BENZ",
    fr: "ICE",
  },
  {
    b: 0xf4f6f8,
    s: 0x8fd3e8,
    t: 0x1b3fb0,
    side: "GRUPO ATD  ·  DESAMPARADOS  ·  PORVENIR",
    bg: "#1b3fb0",
    dest: "28 · PORVENIR",
    fr: "DESAMPARADOS",
  },
];
// Buses extra que se manejan con la misma carrocería del bus (js/mundo3.js): vehículo → pintura de SK.
const BUS_EXTRA = {},
  esBus = (i) => i < 4 || BUS_EXTRA[i] != null;
function applySkin(i) {
  const k = SK[i],
    fg = k.fg || (i == 2 ? "#222" : "#fff");
  mBody.material.color.setHex(k.b);
  mB1.material.color.setHex(k.s);
  mB2.material.color.setHex(k.t);
  mFr.material.color.setHex(k.t);
  [
    [sm, S(k.side, 1024, 48, k.bg, fg, 34)],
    [dm_.material, S(k.dest, 512, 96, "#111", "#ffb020", 44)],
    [gt.material, S(k.fr, 256, 52, k.bg, fg, 36)],
  ].forEach(([m, t]) => {
    m.map = t;
    m.needsUpdate = true;
  });
}
const hs = new T.SpotLight(0xfff3d0, 2.2, 80, 0.55, 0.5);
hs.position.set(0, 1, -5.6);
hs.target.position.set(0, 0, -30);
bus.add(hs, hs.target);
