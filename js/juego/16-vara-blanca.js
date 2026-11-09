// js/juego/16-vara-blanca.js · CARRETERA A VARA BLANCA (zona 8): salida de montaña, derrumbe y presa.
// Parte 16 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// ===================== CARRETERA A VARA BLANCA (zona 8) =====================
// Salida a la derecha en San José · Estadio Nacional: carretera de montaña de 2 carriles que sube a un paso
// de 24 m, con barandas, un derrumbe que tapa un carril, una presa de carros y una piedra que rueda cerro abajo.
// Vuelve a la autopista antes del túnel. Coordenadas del primer ciclo del mundo (dentro del grupo "wo").
const VB_ALTURA = 24, // altura del paso de montaña (m)
  VB_ANCHO = 4.2; // medio ancho de la carretera (2 carriles)
const VB = (() => {
  const P = [],
    ease = (t) => t * t * (3 - 2 * t);
  for (let i = 0; i <= 25; i++) {
    const t = i / 25; // rampa de salida
    P.push({ x: 7 + 93 * ease(t), z: -8030 - 100 * t, h: 0 });
  }
  for (let i = 1; i <= 108; i++) {
    const u = i / 108; // tramo de montaña: curvas y subida/bajada
    P.push({
      x: 100 + 14 * Math.sin(u * Math.PI * 3),
      z: -8130 - 430 * u,
      h: (VB_ALTURA * (1 - Math.cos(2 * Math.PI * u))) / 2,
    });
  }
  for (let i = 1; i <= 25; i++) {
    const t = i / 25; // regreso a la autopista
    P.push({ x: 100 - 93 * ease(t), z: -8560 - 90 * t, h: 0 });
  }
  let L = 0;
  P.forEach((p, i) => {
    const a = P[Math.max(0, i - 1)],
      b = P[Math.min(P.length - 1, i + 1)],
      dx = b.x - a.x,
      dz = b.z - a.z,
      l = Math.hypot(dx, dz);
    p.tx = dx / l;
    p.tz = dz / l;
    p.nx = -p.tz; // derecha según el sentido de marcha
    p.nz = p.tx;
    if (i) L += Math.hypot(p.x - P[i - 1].x, p.z - P[i - 1].z);
    p.s = L;
  });
  return P;
})();
const vbEn = (i, lat, dy = 0) => {
  const p = VB[Math.max(0, Math.min(VB.length - 1, Math.round(i)))];
  return { x: p.x + p.nx * lat, y: p.h + dy, z: p.z + p.nz * lat };
};
// zonas libres de casas/árboles del borde y segmentos manejables (sin castigo de "fuera de pista")
EXR.push([-7990, -8170], [-8520, -8680]);
for (let i = 1; i < VB.length; i++) XS.push([VB[i - 1].x, VB[i - 1].z, VB[i].x, VB[i].z, 5]);
// cinta de triángulos que sigue el camino: f(p) → [[x,y,z] lado A, [x,y,z] lado B]
function cinta(f, colores) {
  const pos = [],
    uv = [],
    col = [],
    idx = [];
  VB.forEach((p, i) => {
    const [a, b] = f(p);
    pos.push(...a, ...b);
    uv.push(0, p.s / 12, 1, p.s / 12);
    if (colores) col.push(...colores[0], ...colores[1]);
    if (i) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  });
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  if (colores) g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const vbTex = cv(128, 256, (x, w, h) => {
  x.fillStyle = "#2f3237";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) {
    const v = R(25, 90) | 0;
    x.fillStyle = `rgba(${v},${v},${v + 4},${R(0.2, 0.5)})`;
    x.fillRect(R(0, w), R(0, h), 1.5, 1.5);
  }
  x.fillStyle = "#f2f2ee";
  x.fillRect(5, 0, 5, h);
  x.fillRect(w - 10, 0, 5, h);
  x.fillStyle = "#ffc400";
  x.fillRect(w / 2 - 2, 0, 4, h * 0.55);
});
vbTex.wrapS = vbTex.wrapT = T.RepeatWrapping;
const vbG = new T.Group();
{
  const carretera = new T.Mesh(
      cinta((p) => [
        [p.x - p.nx * VB_ANCHO, p.h + 0.06, p.z - p.nz * VB_ANCHO],
        [p.x + p.nx * VB_ANCHO, p.h + 0.06, p.z + p.nz * VB_ANCHO],
      ]),
      new T.MeshStandardMaterial({ map: vbTex, roughness: 0.85, side: T.DoubleSide }),
    ),
    roca = [0.5, 0.45, 0.4],
    pasto = [0.3, 0.45, 0.22],
    tierra = new T.MeshStandardMaterial({ map: nz, vertexColors: true, roughness: 1, side: T.DoubleSide });
  carretera.receiveShadow = true;
  vbG.add(carretera);
  // laderas del cerro (de la orilla de la carretera hasta el suelo)
  [-1, 1].forEach((q) => {
    const m = new T.Mesh(
      cinta(
        (p) => [
          [p.x + p.nx * q * VB_ANCHO, p.h, p.z + p.nz * q * VB_ANCHO],
          [p.x + p.nx * q * (VB_ANCHO + 3 + p.h * 1.3), -0.4, p.z + p.nz * q * (VB_ANCHO + 3 + p.h * 1.3)],
        ],
        [roca, pasto],
      ),
      tierra,
    );
    m.receiveShadow = true;
    vbG.add(m);
    // barandas metálicas
    const b = new T.Mesh(
      cinta((p) => [
        [p.x + p.nx * q * (VB_ANCHO + 0.15), p.h + 0.45, p.z + p.nz * q * (VB_ANCHO + 0.15)],
        [p.x + p.nx * q * (VB_ANCHO + 0.15), p.h + 0.95, p.z + p.nz * q * (VB_ANCHO + 0.15)],
      ]),
      new T.MeshStandardMaterial({ color: 0xc9ced3, metalness: 0.7, roughness: 0.35, side: T.DoubleSide }),
    );
    b.castShadow = true;
    vbG.add(b);
  });
  // postes de las barandas (solo donde la carretera va alta)
  const postes = new T.InstancedMesh(new T.BoxGeometry(0.15, 1, 0.15), M(0x8a8f94), 240),
    m4 = new T.Matrix4();
  let n = 0;
  for (let i = 26; i < 134; i += 2)
    for (const q of [-1, 1]) {
      const c = vbEn(i, q * (VB_ANCHO + 0.15), 0.5);
      m4.makeTranslation(c.x, c.y, c.z);
      postes.setMatrixAt(n++, m4);
    }
  postes.count = n;
  postes.frustumCulled = false;
  vbG.add(postes);
  // montañas y árboles alrededor
  for (let k = 0; k < 7; k++) {
    const mt = mount(),
      kk = R(0.9, 1.4),
      i = 30 + k * 14,
      c = vbEn(i, mt.userData.rb * kk + 45 + R(0, 60) + VB[i].h * 1.3);
    mt.scale.setScalar(kk);
    mt.position.set(c.x, (mt.geometry.parameters.height * kk) / 2 - 4, c.z);
    vbG.add(mt);
  }
  for (let k = 0; k < 40; k++) {
    const i = 26 + ((Math.random() * 108) | 0),
      q = Math.random() < 0.5 ? -1 : 1,
      t = tree(),
      c = vbEn(i, q * (VB_ANCHO + 6 + VB[i].h * 1.3 + R(2, 14)));
    t.position.set(c.x, 0, c.z);
    t.scale.setScalar(R(1, 1.8));
    vbG.add(t);
  }
  // rótulos
  const rotulo = (tex, w, h, x, y, z, ry = 0) => {
    const pl = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 }),
    );
    pl.position.set(x, y, z);
    pl.rotation.y = ry;
    vbG.add(pl, mm(0.15, y, 0.15, 0x777777, x, y / 2, z - 0.05));
  };
  const aviso = (l1, l2, l3) =>
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
      x.font = "bold 30px system-ui,Arial";
      x.fillText(l1, 128, 100);
      x.fillText(l2, 128, 140);
      x.fillText(l3, 128, 180);
    });
  rotulo(S("SALIDA · CARRETERA VARA BLANCA", 512, 138, "#0a6e3a", "#fff", 30), 6.4, 1.6, 9.8, 4, -7955);
  rotulo(aviso("⚠ CUIDADO", "DERRUMBES", "Y PRESA"), 2.6, 2.6, 12.6, 3.6, -7980);
  rotulo(S("↗ VARA BLANCA", 256, 64, "#0a6e3a", "#fff", 36), 3, 0.75, 10, 3.2, -8005);
  {
    const c = vbEn(32, VB_ANCHO + 1.8);
    rotulo(
      aviso("ZONA DE", "DERRUMBES", "⚠"),
      2.2,
      2.2,
      c.x,
      VB[32].h + 3,
      c.z,
      Math.atan2(-VB[32].tx, -VB[32].tz),
    );
  }
  {
    const c = vbEn(60, VB_ANCHO + 1.8);
    rotulo(
      aviso("PRESA", "ADELANTE", "🚗🚗"),
      2.2,
      2.2,
      c.x,
      VB[60].h + 3,
      c.z,
      Math.atan2(-VB[60].tx, -VB[60].tz),
    );
  }
}
// obstáculos: derrumbe y presa (carril derecho) y piedra que cae del cerro (carril derecho, más adelante)
const VB_OBS = [],
  ROCA_G = new T.DodecahedronGeometry(1, 0),
  ROCA_M = [M(0x7a6a58), M(0x8c8378), M(0x5f5348)],
  hazM = new T.MeshStandardMaterial({ color: 0xff9a1a, emissive: 0xff8a00, emissiveIntensity: 2 });
function vbRoca(r, x, y, z, choca = true) {
  const m = new T.Mesh(ROCA_G, pk_(ROCA_M));
  m.scale.set(r * R(0.85, 1.2), r * R(0.6, 0.85), r * R(0.85, 1.2));
  m.rotation.set(R(0, 3), R(0, 3), R(0, 3));
  m.position.set(x, y + r * 0.45, z);
  m.castShadow = m.receiveShadow = true;
  vbG.add(m);
  if (choca) VB_OBS.push({ x, z, h: y, r: r * 1.05 });
  return m;
}
const VB_DERRUMBE = 76;
{
  vbRoca(1.9, ...Object.values(vbEn(VB_DERRUMBE, 2.1)));
  for (let k = 0; k < 9; k++) {
    const c = vbEn(VB_DERRUMBE + R(-2, 2), R(0.6, 3.8));
    vbRoca(R(0.35, 1), c.x, c.y, c.z, k < 3);
  }
  for (let k = 0; k < 6; k++) {
    // piedras en la ladera
    const c = vbEn(VB_DERRUMBE + R(-4, 4), VB_ANCHO + R(2, 9), -R(2, 6));
    vbRoca(R(0.8, 2), c.x, c.y, c.z, false);
  }
  // la presa: carros detenidos con las intermitentes
  for (let k = 0; k < 7; k++) {
    const i = VB_DERRUMBE - 2 - k * 2,
      c = vbEn(i, 2),
      car = mkCar(),
      p = VB[i],
      pend = (VB[i + 1].h - VB[i - 1].h) / (VB[i + 1].s - VB[i - 1].s);
    car.rotation.order = "YXZ";
    car.rotation.y = Math.atan2(-p.tx, -p.tz);
    car.rotation.x = Math.atan(pend);
    car.position.set(c.x, c.y, c.z);
    [-1, 1].forEach((q) => {
      const hz = new T.Mesh(CG.hl, hazM);
      hz.position.set(q * 0.85, 0.95, 2.16);
      car.add(hz);
    });
    vbG.add(car);
    VB_OBS.push({ x: c.x, z: c.z, h: c.y, r: 2.4 });
  }
}
// piedra que rueda cerro abajo cuando el bus se acerca
const VB_CAE = 104,
  vbCae = (() => {
    const fin = vbEn(VB_CAE, 2),
      ini = vbEn(VB_CAE + 3, 26, 22),
      m = vbRoca(1.6, ini.x, ini.y, ini.z, false),
      o = { x: fin.x, z: fin.z, h: fin.y, r: 1.7, off: true };
    VB_OBS.push(o);
    // cerro de donde cae
    const cerro = mount(),
      c = vbEn(VB_CAE + 3, cerro.userData.rb * 0.6 + VB_ANCHO + 3 + VB[VB_CAE].h * 1.3);
    cerro.scale.setScalar(0.6);
    cerro.position.set(c.x, cerro.geometry.parameters.height * 0.3 - 4, c.z);
    vbG.add(cerro);
    return { m, ini, fin, o, t: -1 };
  })();
wo.add(vbG);
congelar(vbG, new Set([vbCae.m])); // escenario estático: no recalcular matrices
let vbVuelta = false, // true al volver de la montaña: no volver a entrar enseguida
  vbAviso = 0,
  vbChoqueT = 0,
  vbSobre = false;
function varaBlancaTick(dt) {
  if (MONT.on) return;
  const zr = B.z - wo.position.z,
    blink = Math.floor(performance.now() / 450) % 2;
  hazM.emissiveIntensity = blink ? 2.5 : 0.1;
  // piedra que cae: se reinicia cuando el bus se aleja
  if (vbCae.t >= 0 && vbCae.t < 1) {
    vbCae.t = Math.min(1, vbCae.t + dt / 1.5);
    const t = vbCae.t,
      a = vbCae.ini,
      b = vbCae.fin;
    vbCae.m.position.set(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t * t + 1.6 * 0.45 + Math.abs(Math.sin(t * 9)) * 2 * (1 - t),
      a.z + (b.z - a.z) * t,
    );
    vbCae.m.rotation.x += dt * 9;
    vbCae.m.rotation.z += dt * 6;
    if (t >= 1) {
      vbCae.o.off = false;
      shake = Math.max(shake, 0.4);
    }
  }
  const lejos = zr > -7950 || zr < -8720 || B.x < 6;
  if (lejos) {
    vbVuelta = false;
    if (vbSobre && !B.fl && !B.bal) B.y = 0;
    vbSobre = false;
    if (vbCae.t >= 1 && (zr > -7800 || zr < -8900)) {
      vbCae.t = -1;
      vbCae.o.off = true;
      vbCae.m.position.set(vbCae.ini.x, vbCae.ini.y + 0.7, vbCae.ini.z);
    }
    vbAviso = 0;
    return;
  }
  if (state != "play" || B.fl) return;
  // punto más cercano del camino
  let best = 1e9,
    bi = 0,
    bt = 0;
  for (let i = 1; i < VB.length; i++) {
    const a = VB[i - 1],
      b = VB[i],
      dx = b.x - a.x,
      dz = b.z - a.z,
      t = Math.max(0, Math.min(1, ((B.x - a.x) * dx + (zr - a.z) * dz) / (dx * dx + dz * dz))),
      d = Math.hypot(B.x - a.x - dx * t, zr - a.z - dz * t);
    if (d < best) {
      best = d;
      bi = i;
      bt = t;
    }
  }
  const a = VB[bi - 1],
    b = VB[bi],
    h = a.h + (b.h - a.h) * bt,
    qx = a.x + (b.x - a.x) * bt,
    qz = a.z + (b.z - a.z) * bt,
    nx = a.nx + (b.nx - a.nx) * bt,
    nz = a.nz + (b.nz - a.nz) * bt,
    lat = (B.x - qx) * nx + (zr - qz) * nz,
    pie = VB_ANCHO + 3 + h * 1.3;
  if (Math.abs(lat) < VB_ANCHO + 0.4 && (B.y > h - 2.5 || h < 2.5)) {
    // sobre la carretera de montaña
    if (!B.bal) B.y = h;
    vbSobre = true;
    // pasando la presa y el derrumbe empieza la Ruta de montaña de 150 km
    if (bi >= 108 && bi <= 112 && !vbVuelta) {
      montEntrar(60, Math.min(Math.abs(B.v), 15));
      return;
    }
    if (!vbAviso && bi > 20) {
      vbAviso = 1;
      msg("⛰ Carretera a Vara Blanca: ¡cuidado con derrumbes y presa!", 3500);
    }
    // barandas: no te deja caer del cerro
    const lim = VB_ANCHO - 0.5 - (PV.hw - 1) * 0.5;
    if (h > 1.5 && Math.abs(lat) > lim) {
      const k = Math.sign(lat) * lim - lat;
      B.x += nx * k;
      B.z += nz * k;
      dmg += Math.abs(B.v) * 0.35 * PV.dm * dt;
      B.v *= Math.pow(0.4, dt);
      shake = Math.max(shake, 0.25);
    }
    // inclinación del bus con la pendiente
    const pend = (b.h - a.h) / (b.s - a.s),
      fx = -Math.sin(B.h),
      fz = -Math.cos(B.h),
      tx = a.tx,
      tz = a.tz;
    cur.rotation.x += Math.atan(pend * (fx * tx + fz * tz));
    // gravedad en la cuesta
    B.v -= 9.8 * 0.55 * pend * (fx * tx + fz * tz) * dt;
    // la piedra cae cuando te acercás
    if (vbCae.t < 0 && bi > VB_CAE - 22 && bi < VB_CAE - 6) {
      vbCae.t = 0;
      msg("⚠ ¡DERRUMBE! Cuidado con la piedra", 2500);
    }
    // choques con el derrumbe y la presa
    vbChoqueT -= dt;
    for (const o of VB_OBS) {
      if (o.off || Math.abs(B.y - o.h) > 3) continue;
      for (const q of [-PV.hl * 0.8, 0, PV.hl * 0.8]) {
        const px = B.x + fx * q,
          pz = zr + fz * q,
          d = Math.hypot(px - o.x, pz - o.z),
          r = o.r + PV.hw * 0.9;
        if (d < r) {
          const k = (r - d) / (d || 1);
          B.x += (px - o.x) * k;
          B.z += (pz - o.z) * k;
          if (vbChoqueT <= 0 && Math.abs(B.v) > 1.5) {
            vbChoqueT = 1;
            dmg += Math.max(2, Math.abs(B.v) * 0.9) * PV.dm;
            shake = Math.max(shake, 0.6);
            msg(o.r > 2.2 ? "💥 ¡Chocaste un carro de la presa!" : "💥 ¡Chocaste con el derrumbe!", 1500);
            if (dmg >= 100) {
              dmg = 100;
              end();
            }
          }
          B.v *= 0.3;
          break;
        }
      }
    }
  } else if (Math.abs(lat) < pie && B.y < h - 1) {
    // contra la ladera del cerro desde abajo: no se puede atravesar
    const k = Math.sign(lat) * (pie + 0.2) - lat;
    B.x += nx * k;
    B.z += nz * k;
    B.v *= 0.3;
    shake = Math.max(shake, 0.3);
  } else if (vbSobre && !B.bal) {
    B.y = 0;
    vbSobre = false;
  }
}
