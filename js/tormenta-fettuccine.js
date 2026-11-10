// =====================================================================
// TORMENTA DE FETTUCCINE. Se carga después de js/tormenta-comida.js y usa el estado del apocalipsis
// (window.APOCALIPSIS). Se turna con la Tormenta Morada: un apocalipsis trae una y el siguiente la otra.
// Mientras dura (APOCALIPSIS.fase == "fettuccine"):
//   CIELO        · todo se pone color crema, como salsa Alfredo
//   LLUVIA       · llueven fideos de fettuccine por todas partes
//   COMIDAS      · del cielo caen (con su círculo rojo de aviso, igual que la comida de la Morada):
//                  · PLATOS DE FETTUCCINE ALFREDO: al caer dejan un CHARCO DE SALSA que resbala
//                  · NIDOS DE FETTUCCINE: ruedan por la carretera aplastando carros
//                  · TIRAS GIGANTES: quedan atravesadas en la carretera y SE PEGAN a las llantas
//   CHARCOS      · si pasás por un charco de salsa, el bus resbala de lado; los carros dan vueltas
// Los números (cuántos fideos, cuánto duran los charcos, qué tanto frenan las tiras) están en
// js/ajustes.js (AJUSTES.tormentaFettuccine). Cuánto dura la tormenta: AJUSTES.apocalipsis.fettuccine.
// =====================================================================
(function () {
  const AP = window.APOCALIPSIS,
    TC = window.TORMENTA_COMIDA;
  if (!AP || !TC) return;
  const A = AJUSTES.tormentaFettuccine,
    { compartir, mat } = MUNDO;
  const enTormenta = () => AP.fase == "fettuccine" && !MONT.on;
  const play = () => state == "play" && !MONT.on;
  const FIDEO = 0xeccb7a, // color del fettuccine
    SALSA = 0xfaf3e0; // salsa Alfredo

  // ===================== COMIDAS =====================
  const pieza = (g, geo, color, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, o) => {
    const m = new T.Mesh(geo, mat(color, Object.assign({ roughness: 0.55 }, o)));
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  // un fideo plano enrollado (un aro aplastado)
  const aro = (r) => compartir(new T.TorusGeometry(r, 0.045, 4, 22));
  const D = { charcos: [], resbala: null };
  window.TORMENTA_FETTUCCINE = D; // para revisar desde la consola

  // ----- plato de fettuccine Alfredo: deja un charco de salsa -----
  D.plato = TC.agregarComida({
    nombre: "plato de fettuccine Alfredo",
    un: "un",
    el: "el",
    emoji: "🍝",
    tormenta: "fettuccine",
    arma(g) {
      pieza(g, compartir(new T.CylinderGeometry(0.62, 0.46, 0.08, 24)), 0xf5f5f0, 0, 0.04, 0); // plato
      pieza(g, compartir(new T.CylinderGeometry(0.66, 0.66, 0.03, 24)), 0xe2e2dc, 0, 0.09, 0); // borde
      pieza(g, compartir(new T.SphereGeometry(0.46, 16, 10)), FIDEO, 0, 0.1, 0, 0, 0, 0, 1, 0.45, 1); // montaña de fideos
      for (let i = 0; i < 16; i++) {
        // fideos planos enrollados
        const a = R(0, 6.28),
          r = R(0, 0.3);
        pieza(
          g,
          aro(R(0.12, 0.26)),
          FIDEO,
          Math.cos(a) * r,
          0.17 + R(0, 0.14),
          Math.sin(a) * r,
          R(0, 3),
          R(0, 3),
          R(0, 3),
          1,
          1,
          0.35,
        );
      }
      pieza(g, compartir(new T.SphereGeometry(0.34, 16, 8)), SALSA, 0, 0.27, 0, 0, 0, 0, 1, 0.28, 1); // salsa Alfredo
      for (let i = 0; i < 14; i++)
        pieza(
          g,
          compartir(new T.BoxGeometry(0.04, 0.02, 0.04)),
          i % 3 ? 0xfff8e1 : 0x3d8b37,
          R(-0.25, 0.25),
          0.36,
          R(-0.25, 0.25),
          0,
          R(0, 3),
        ); // queso y perejil
      pieza(
        g,
        compartir(new T.BoxGeometry(0.05, 0.7, 0.02)),
        0xc0c0c8,
        -0.2,
        0.55,
        0.12,
        0,
        0,
        0.35,
        1,
        1,
        1,
        { metalness: 0.8, roughness: 0.3 },
      ); // tenedor
    },
    alto: 0.5,
    radio: 0.62,
    alImpacto(f, fuerza) {
      if (fuerza >= 1) ponerCharco(f.x, f.z, f.tam * R(0.9, 1.2));
    },
  });

  // ----- nido de fettuccine: rueda por la carretera -----
  D.nido = TC.agregarComida({
    nombre: "nido de fettuccine",
    un: "un",
    el: "el",
    emoji: "🍝",
    tormenta: "fettuccine",
    arma(g) {
      // una bola de fideos enrollados, centrada a 0,53 m (como las donas, para que ruede)
      for (let i = 0; i < 20; i++)
        pieza(
          g,
          aro(R(0.32, 0.48)),
          0xe9c77b,
          R(-0.04, 0.04),
          0.53,
          R(-0.04, 0.04),
          R(0, 3.14),
          R(0, 3.14),
          R(0, 3.14),
          1,
          1,
          0.3,
        );
      pieza(g, compartir(new T.SphereGeometry(0.3, 12, 8)), 0xd9b265, 0, 0.53, 0);
    },
    alto: 1.06,
    radio: 0.5,
    rueda: true,
  });

  // ----- tira de fettuccine gigante: queda atravesada y se pega -----
  D.tira = TC.agregarComida({
    nombre: "tira de fettuccine",
    un: "una",
    el: "la",
    emoji: "🍝",
    tormenta: "fettuccine",
    arma(g) {
      // una cinta ondulada a lo largo de x (de -2 a 2), con las puntas un poco levantadas
      const N = 18;
      for (let i = 0; i < N; i++) {
        const x0 = -2 + (4 * i) / N,
          x1 = -2 + (4 * (i + 1)) / N,
          y0 = 0.04 + 0.05 * Math.sin(i * 1.3) + (i == 0 ? 0.08 : 0),
          y1 = 0.04 + 0.05 * Math.sin((i + 1) * 1.3) + (i == N - 1 ? 0.08 : 0),
          l = Math.hypot(x1 - x0, y1 - y0);
        pieza(
          g,
          compartir(new T.BoxGeometry(1, 0.03, 0.3)),
          0xe9c46e,
          (x0 + x1) / 2,
          (y0 + y1) / 2,
          Math.sin(i * 0.7) * 0.04,
          0,
          0,
          Math.atan2(y1 - y0, x1 - x0),
          l,
          1,
          1,
        );
      }
    },
    alto: 0.14,
    radio: 0.9,
    tira: [2, 0.15],
    alImpacto(f) {
      // los carros que agarra abajo se quedan pegados
      for (const c of cars)
        if (!c.vy && Math.abs(c.x - f.x) < f.tam * 2 && Math.abs(c.z - f.z) < f.tam * 0.15 + 2.5) {
          c.hit = 0.01;
          c.vz = 0;
        }
    },
    alChocar(f, dt) {
      // pasás por encima, pero se pega a las llantas y te frena
      if (PV.crush) return;
      B.v *= Math.pow(A.frenoTira, dt);
      if (!f.pegado) {
        f.pegado = true;
        TC.golpear(A.danioTira, "🍝 ¡Te enredaste en una tira de fettuccine gigante! Se pega a las llantas");
      }
    },
  });

  TC.mensajes.fettuccine = [
    "🍝 ¡Llueve fettuccine!",
    "🥛 ¡Cuidado con los charcos de salsa Alfredo, resbalan!",
    "🍝 ¡Las tiras de fettuccine se pegan a las llantas!",
    "🍝 ¡Los nidos de fettuccine ruedan! ¡Apartate!",
    "😱 ¡FETTUCCINE POR TODAS PARTES!",
  ];

  // ===================== CHARCOS DE SALSA ALFREDO =====================
  // una mancha redonda pero con la orilla irregular
  function figuraCharco() {
    const s = new T.Shape(),
      n = 22;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2,
        r = i == n ? 1 : R(0.8, 1.05);
      if (i == 0) s.moveTo(r, 0);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const g = new T.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    return g;
  }
  const matCharco = new T.MeshStandardMaterial({
    color: SALSA,
    roughness: 0.18,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const charcos = D.charcos;
  for (let i = 0; i < 8; i++) {
    const m = new T.Mesh(figuraCharco(), matCharco);
    m.receiveShadow = true;
    m.visible = false;
    sc.add(m);
    charcos.push({ m, t: 0, x: 0, z: 0, r: 1 });
  }
  function ponerCharco(x, z, r) {
    const c = charcos.reduce((a, b) => (b.t < a.t ? b : a)); // el libre o el más viejo
    Object.assign(c, { t: A.charcoSegundos, x, z, r });
    c.m.position.set(x, 0.035, z);
    c.m.scale.setScalar(r);
    c.m.visible = true;
  }
  D.ponerCharco = ponerCharco; // para probar: TORMENTA_FETTUCCINE.ponerCharco(B.x, B.z - 30, 9)

  // ===================== LLUVIA DE FIDEOS =====================
  // todos en una sola malla (InstancedMesh), cayendo alrededor de la cámara
  const N_FIDEOS = 260,
    lluvia = new T.InstancedMesh(
      compartir(new T.BoxGeometry(0.2, 0.025, 2.2)),
      new T.MeshStandardMaterial({ color: FIDEO, roughness: 0.6 }),
      N_FIDEOS,
    );
  lluvia.frustumCulled = false;
  lluvia.count = 0;
  sc.add(lluvia);
  const fideos = [];
  for (let i = 0; i < N_FIDEOS; i++)
    fideos.push({ x: 0, y: -1, z: 0, f: R(0, 6.28), v: R(10, 16), ok: false });
  const ponerFideo = (p, arriba) => {
    p.x = cam.position.x + R(-45, 45);
    p.z = cam.position.z - R(-10, 140);
    p.y = arriba ? R(35, 60) : R(0, 60);
    p.ok = true;
  };
  const m4 = new T.Matrix4(),
    q4 = new T.Quaternion(),
    e4 = new T.Euler(),
    v4 = new T.Vector3(),
    s4 = new T.Vector3(1, 1, 1);
  const crema = new T.Color(0xf2e2b8);

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0,
    zAnt = null;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    // reinicio (el bus saltó de lugar) o ruta de montaña: se limpia todo
    if ((zAnt != null && Math.abs(B.z - zAnt) > 30 && state == "play") || MONT.on) {
      charcos.forEach((c) => ((c.t = 0), (c.m.visible = false)));
      D.resbala = null;
    }
    zAnt = B.z;
    const activa = enTormenta();
    // ----- cielo crema y lluvia de fideos -----
    if (activa) {
      sc.fog.color.lerp(crema, 0.65);
      sc.fog.near = Math.min(sc.fog.near, 30);
      sc.fog.far = Math.min(sc.fog.far, 340);
    }
    const n = activa ? Math.round(A.fideos * Math.max(0.35, CALIDAD.efectos)) : 0;
    if (state == "play") {
      for (let i = 0; i < Math.min(n, N_FIDEOS); i++) {
        const p = fideos[i];
        if (!p.ok) ponerFideo(p, false);
        p.y -= p.v * dt;
        if (
          p.y < 0.05 ||
          Math.abs(p.x - cam.position.x) > 50 ||
          p.z - cam.position.z > 15 ||
          cam.position.z - p.z > 150
        )
          ponerFideo(p, true);
        const a = reloj * 3 + p.f;
        m4.compose(
          v4.set(p.x + Math.sin(a) * 0.6, p.y, p.z),
          q4.setFromEuler(e4.set(Math.sin(a) * 1.2, p.f, Math.cos(a * 0.7) * 0.8)),
          s4,
        );
        lluvia.setMatrixAt(i, m4);
      }
      lluvia.count = Math.min(n, N_FIDEOS);
      lluvia.instanceMatrix.needsUpdate = true;
    }
    if (!activa) fideos.forEach((p) => (p.ok = false));

    // ----- charcos de salsa -----
    let dentro = null;
    charcos.forEach((c) => {
      if (c.t <= 0) return;
      c.t -= dt;
      // se van secando (se achican) al final, y se quitan si quedan muy atrás
      if (c.t < 3) c.m.scale.setScalar(c.r * Math.max(0.05, c.t / 3));
      if (c.t <= 0 || c.z - B.z > 150) {
        c.t = 0;
        c.m.visible = false;
        return;
      }
      const r = c.r * Math.min(1, c.t / 3);
      if (Math.hypot(B.x - c.x, B.z - c.z) < r) dentro = c;
      // los carros que pasan por la salsa dan vueltas
      for (const car of cars)
        if (!car.hit && !car.vy && Math.hypot(car.x - c.x, car.z - c.z) < r) car.hit = 1;
    });
    if (state != "play") return;
    // ----- el bus resbala en la salsa -----
    if (dentro && play() && !B.fl && !B.bal && !PV.hover && B.y < 1 && Math.abs(B.v) > 2) {
      if (!D.resbala || D.resbala.c !== dentro) {
        D.resbala = { c: dentro, lado: Math.random() < 0.5 ? -1 : 1, t: 0 };
        msg("🥛 ¡Resbalaste en la salsa Alfredo!", 1800);
        shake = Math.max(shake, 0.3);
      }
      const R_ = D.resbala;
      R_.t += dt;
      // se va de lado; si ya llegó a la orilla de la carretera, coletea para el otro lado
      if (Math.abs(B.x) > 8 && Math.sign(B.x) == R_.lado) R_.lado = -R_.lado;
      B.x += R_.lado * Math.min(1, Math.abs(B.v) / 15) * A.deslizar * dt;
      cur.rotation.y = Math.sin(R_.t * 9) * 0.22; // coleteando
    } else if (D.resbala && (!dentro || D.resbala.c !== dentro)) {
      D.resbala = null;
      cur.rotation.y = 0;
    }
  };
})();
