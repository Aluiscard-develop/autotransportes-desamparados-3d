// js/juego/07-bus-interior.js · interior del bus: tablero, piso, asientos, pasajeros y ruedas.
// Parte 7 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

body.add(dm_);
bx(1.2, 0.5, 0.7, 0x222a33, -0.8, 1.7, -4.9);
const stw = new T.Mesh(new T.TorusGeometry(0.28, 0.04, 6, 16), new T.MeshStandardMaterial({ color: 0x111 }));
stw.position.set(-0.8, 2, -4.55);
stw.rotation.x = -0.9;
body.add(stw);
// interior
const fT = cv(64, 64, (x, w, h) => {
  x.fillStyle = "#8a8f94";
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "#d5d9dc";
  x.lineWidth = 2;
  for (let i = 0; i < w; i += 16)
    for (let j = 0; j < h; j += 16) {
      x.beginPath();
      x.moveTo(i + 2, j + 2);
      x.lineTo(i + 14, j + 14);
      x.moveTo(i + 14, j + 2);
      x.lineTo(i + 2, j + 14);
      x.stroke();
    }
});
fT.wrapS = fT.wrapT = T.RepeatWrapping;
fT.repeat.set(10, 44);
const fl = new T.Mesh(
  new T.PlaneGeometry(2.4, 11),
  new T.MeshStandardMaterial({ map: fT, roughness: 0.5, metalness: 0.4 }),
);
fl.rotation.x = -Math.PI / 2;
fl.position.y = 0.72;
fl.receiveShadow = true;
body.add(fl);
const stC = new T.BoxGeometry(0.95, 0.4, 0.5),
  stB = new T.BoxGeometry(0.95, 0.7, 0.1),
  stM = new T.MeshStandardMaterial({ color: 0x3d4650, roughness: 0.8 }),
  stY = new T.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.6 });
for (let r = 0; r < 8; r++)
  [-1, 1].forEach((s) => {
    const m = s > 0 && r < 2 ? stY : stM,
      c = new T.Mesh(stC, m),
      b = new T.Mesh(stB, m),
      z = -2.6 + r;
    c.position.set(s * 0.78, 0.92, z);
    b.position.set(s * 0.78, 1.45, z + 0.23);
    body.add(c, b);
  });
const pG = new T.CylinderGeometry(0.03, 0.03, 2.25, 6),
  rG = new T.BoxGeometry(0.05, 0.05, 9.4);
for (let i = 0; i < 5; i++)
  [-1, 1].forEach((s) => {
    const p = new T.Mesh(pG, stY);
    p.position.set(s * 0.28, 1.85, -2.2 + i * 2);
    body.add(p);
  });
[-1, 1].forEach((s) => {
  const r = new T.Mesh(rG, stY);
  r.position.set(s * 0.28, 2.68, 0.9);
  body.add(r);
});
bx(0.8, 0.05, 1.4, 0xeeeeee, 0, 2.73, 1.5, { emissive: 0xffffff, emissiveIntensity: 0.6 });
const il = new T.PointLight(0xffffff, 0.7, 14);
il.position.set(0, 2.6, 0);
body.add(il);
const ppl = [],
  cords = [];
for (let r = 0; r < 8; r++)
  [-1, 1].forEach((q) =>
    [-0.24, 0.24].forEach((o) => {
      const g = new T.Group(),
        b = new T.Mesh(
          new T.CylinderGeometry(0.2, 0.22, 0.7, 8),
          new T.MeshStandardMaterial({
            color: new T.Color().setHSL(Math.random(), 0.5, 0.45),
            roughness: 0.8,
          }),
        ),
        h = new T.Mesh(
          new T.SphereGeometry(0.15, 10, 8),
          new T.MeshStandardMaterial({
            color: [0xe0b08a, 0xc58c63, 0x8d5a3a][(Math.random() * 3) | 0],
            roughness: 0.7,
          }),
        );
      b.position.y = 1.5;
      h.position.y = 2.0;
      g.add(b, h);
      g.position.set(q * 0.78 + o, 0, -2.6 + r + 0.15);
      g.visible = false;
      body.add(g);
      ppl.push(g);
    }),
  );
ppl.sort(() => Math.random() - 0.5);
[-1, 1].forEach((q) => {
  const g = new T.Group();
  g.add(mm(0.03, 0.03, 9.8, 0x7a5230, q * 1.12, 2.66, 0.3));
  for (let i = 0; i < 5; i++)
    g.add(
      mm(0.02, 0.4, 0.02, 0x7a5230, q * 1.12, 2.45, -2.4 + i * 2.1),
      mm(0.12, 0.05, 0.05, 0xd0a060, q * 1.12, 2.23, -2.4 + i * 2.1),
    );
  body.add(g);
  cords.push(g);
});
const parS = new T.Mesh(
  new T.PlaneGeometry(1.4, 0.32),
  new T.MeshBasicMaterial({ map: S("PARANDO", 256, 58, "#150000", "#ff3030", 40) }),
);
parS.position.set(0, 2.55, -5.2);
parS.visible = false;
body.add(parS);
function pull() {
  pullT = 0.6;
  pullSide = Math.random() < 0.5 ? 0 : 1;
  bell();
}
const wheels = [],
  wg = new T.CylinderGeometry(0.55, 0.55, 0.45, 16).rotateZ(Math.PI / 2),
  wm = new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }),
  hm = new T.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.3 });
[[-3.6], [3.4]].forEach(([z]) =>
  [-1, 1].forEach((s) => {
    const w = new T.Group(),
      t = new T.Mesh(wg, wm),
      h = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.47, 10).rotateZ(Math.PI / 2), hm);
    t.castShadow = true;
    w.add(t, h);
    w.position.set(s * 1.2, 0.55, z);
    bus.add(w);
    wheels.push(w);
  }),
);
sc.add(bus);
setVeh(0);
