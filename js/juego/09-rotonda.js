// js/juego/09-rotonda.js · Rotonda de La Y Griega y el McDonald's.
// Parte 9 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// rotonda La Y Griega
const rb = new T.Group(),
  pO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
const ring = new T.Mesh(
  new T.CircleGeometry(27, 64),
  new T.MeshStandardMaterial(Object.assign({ color: 0x3b3e44, roughness: 0.9 }, pO)),
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.02;
ring.receiveShadow = true;
rb.add(ring);
const wl = new T.Mesh(
  new T.RingGeometry(25.6, 25.9, 64),
  new T.MeshBasicMaterial({
    color: 0xeeeeee,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  }),
);
wl.rotation.x = -Math.PI / 2;
wl.position.y = 0.03;
rb.add(wl);
const cb = new T.Mesh(new T.CylinderGeometry(11.7, 11.7, 0.4, 48), M(0xe6e6e6)),
  isl = new T.Mesh(new T.CylinderGeometry(11, 11, 0.5, 48), M(0x3f8f3a));
cb.position.y = 0.2;
isl.position.y = 0.25;
cb.receiveShadow = isl.receiveShadow = true;
rb.add(cb, isl);
const yM = new T.MeshStandardMaterial({ color: 0x1b4fa8, roughness: 0.3, metalness: 0.5 }),
  pl = new T.Mesh(new T.CylinderGeometry(3, 3.4, 1.2, 24), M(0xf5f5f5)),
  st2 = new T.Mesh(new T.BoxGeometry(1.1, 6, 1.1), yM);
pl.position.y = 1;
st2.position.y = 4.6;
pl.castShadow = st2.castShadow = true;
rb.add(pl, st2);
[-1, 1].forEach((s) => {
  const a = new T.Mesh(new T.BoxGeometry(1, 5.2, 1), yM);
  a.position.set(s * 1.25, 9.7, 0);
  a.rotation.z = -s * 0.5;
  a.castShadow = true;
  rb.add(a);
});
[0, Math.PI].forEach((r) => {
  const p = new T.Mesh(
    new T.PlaneGeometry(4.4, 0.8),
    new T.MeshBasicMaterial({ map: S("ROTONDA LA Y GRIEGA", 512, 96, "#f5f5f5", "#1b4fa8", 42) }),
  );
  p.position.set(0, 1, r ? -3.5 : 3.5);
  p.rotation.y = r;
  rb.add(p);
});
for (let i = 0; i < 8; i++) {
  const t = tree(),
    a = (i * Math.PI) / 4;
  t.scale.setScalar(0.75);
  t.position.set(Math.cos(a) * 8, 0.4, Math.sin(a) * 8);
  rb.add(t);
}
function gs(x, z, ry) {
  const g = new T.Group(),
    p = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 3, 6), M(0x777)),
    b = new T.Mesh(
      new T.PlaneGeometry(4.2, 1.3),
      new T.MeshBasicMaterial({ map: S("ROTONDA · LA Y GRIEGA", 512, 160, "#0a7a43", "#fff", 34) }),
    );
  b.position.y = 3.4;
  p.position.y = 1.5;
  g.add(p, b);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  rb.add(g);
}
gs(22, 75, 0);
gs(-22, -75, Math.PI);
rb.position.z = RZ;
rb.updateMatrix();
sc.add(rb);
const md = new T.Group();
md.add(
  mm(26, 5.5, 12, 0x1c1c1e, 0, 2.75, 0),
  mm(27, 0.5, 13, 0xf2f2f2, 0, 5.7, 0),
  mm(3, 12, 2.6, 0xd62828, -11.5, 6, 6.8),
  mm(10, 3, 0.2, 0x1a3a5a, -1, 2, 6.05, { metalness: 0.8, roughness: 0.1 }),
);
const pk = new T.Mesh(
  new T.PlaneGeometry(26, 16),
  new T.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.9 }),
);
pk.rotation.x = -Math.PI / 2;
pk.position.set(0, 0.03, 14);
md.add(pk);
const mp = (t, w, h, bg, fg, fs, x, y, z) => {
  const p = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: S(t, (w * 40) | 0, (h * 40) | 0, bg, fg, fs) }),
  );
  p.position.set(x, y, z);
  md.add(p);
};
mp("McDonald’s", 8, 1.2, "#1c1c1e", "#fff", 44, 1.5, 4.4, 6.1);
mp("M", 2.4, 2.4, "#d62828", "#ffc72c", 96, -11.5, 9, 8.15);
md.position.set(70, 0, -6); // más afuera: por aquí pasa el carril externo
md.rotation.y = -Math.PI / 2;
rb.add(md);
