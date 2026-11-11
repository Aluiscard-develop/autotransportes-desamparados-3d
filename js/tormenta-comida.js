// =====================================================================
// LLUVIA DE COMIDA GIGANTE. Se carga después de js/apocalipsis2.js y usa su estado (window.APOCALIPSIS).
// Cae en la Tormenta Morada (hamburguesas, pizzas, donas, hot dogs, sandías, helados, pollo frito,
// papas y espagueti) y en la Tormenta de Fettuccine (la comida de js/tormenta-fettuccine.js).
// Cada comida dice en qué tormenta cae con "tormenta" (si no lo dice, en la Morada); puede ser una lista,
// por ejemplo tormenta: ["roja", "morada"]. Las tormentas de colores están en js/tormentas-colores.js.
// Otros archivos agregan comidas con TORMENTA_COMIDA.agregarComida({...}) y pueden usar estos extras:
//   alImpacto(f) · algo más cuando cae · alChocar(f, dt) · qué pasa si la chocás (en vez de empujarla)
//   tira: [largo, ancho] · es larga y queda atravesada en la carretera (choque en forma de tira)
//   radioRueda · para las que ruedan: qué tan alto queda el centro (la dona: 0.53)
// TORMENTA_COMIDA.soltar(k, { x, z, y, tam, vx, vz, vy, gravedad }) tira una comida en un lugar o
// lanzada en curva (así el tornado de papas lanza hamburguesas). TORMENTA_COMIDA.alSoltar: funciones
// que se llaman con cada comida que sale (js/comida-nueva.js la hace caer en edificios con f.techo).
// LA COMIDA SE QUEDA DONDE CAE (AJUSTES.tormentaComida.segundosEnElSuelo = 0): solo se quita cuando
// queda muy atrás o cuando ya hay muchas (se hunde la más vieja).
//   AVISO     · un círculo rojo en el piso marca dónde va a caer (¡esquivalo!)
//   IMPACTO   · explota en migas, aplasta los carros que agarra abajo, tira por el aire a los de
//               al lado, deja un cráter y, si estás cerca, te daña
//   EN EL PISO· la comida se queda tirada en la carretera: si chocás con ella te frena, te daña y
//               la vas empujando a un lado (con el tanque o el camión monstruo la aplastás y te pagan)
//   DONAS     · ruedan por la carretera aplastando lo que encuentran
//   SANDÍAS   · rebotan antes de quedarse quietas
//   ESPAGUETI · el plato de espagueti dispara ALBÓNDIGAS gigantes: un montón cuando cae y después
//               una cada pocos segundos mientras está en el piso. Las albóndigas saltan, ruedan,
//               mandan a volar los carros y te dañan si te pegan (busca ALBÓNDIGAS)
// Los números (cada cuánto cae, tamaño, daño) están en js/ajustes.js (AJUSTES.tormentaComida).
// Para agregar otra comida: agregala a COMIDAS (cada una se arma con piezas de 1 metro).
// =====================================================================
(function () {
  const AP = window.APOCALIPSIS;
  if (!AP) return;
  const A = AJUSTES.tormentaComida,
    { compartir, mat, humoTex } = MUNDO;
  const enComida = () => AP.tormentas().length > 0 && !MONT.on;
  const play = () => state == "play" && !MONT.on;

  // ===================== LAS COMIDAS (tamaño 1 = 1 metro de ancho) =====================
  const pieza = (g, geo, color, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, o) => {
    const m = new T.Mesh(geo, mat(color, Object.assign({ roughness: 0.6 }, o)));
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const cil = (rArriba, rAbajo, alto, lados = 20) =>
    compartir(new T.CylinderGeometry(rArriba, rAbajo, alto, lados));
  const esfera = (r, a = 18, b = 12) => compartir(new T.SphereGeometry(r, a, b));
  const caja = (w, h, d) => compartir(new T.BoxGeometry(w, h, d));
  const prisma = (shape, grosor) =>
    compartir(new T.ExtrudeGeometry(shape, { depth: grosor, bevelEnabled: false }));
  const COMIDAS = [
    {
      nombre: "hamburguesa",
      un: "una",
      el: "la",
      emoji: "🍔",
      arma(g) {
        pieza(g, cil(0.5, 0.47, 0.18), 0xd99a4e, 0, 0.09, 0); // pan de abajo
        pieza(g, cil(0.53, 0.53, 0.14), 0x5a3018, 0, 0.25, 0); // carne
        pieza(g, caja(1, 0.03, 1), 0xffc928, 0, 0.335, 0, 0, 0.4); // queso
        pieza(g, cil(0.56, 0.56, 0.04, 12), 0x5cb83c, 0, 0.37, 0); // lechuga
        pieza(g, cil(0.46, 0.46, 0.05, 16), 0xd93a2b, 0, 0.41, 0); // tomate
        pieza(
          g,
          compartir(new T.SphereGeometry(0.52, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)),
          0xe0a457,
          0,
          0.43,
          0,
          0,
          0,
          0,
          1,
          0.62,
          1,
        ); // pan de arriba
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9,
            r = 0.15 + (i % 3) * 0.1;
          pieza(
            g,
            caja(0.05, 0.02, 0.09),
            0xfff3d6,
            Math.cos(a) * r,
            0.74 - r * 0.2,
            Math.sin(a) * r,
            0.3,
            a,
          ); // ajonjolí
        }
      },
      alto: 0.76,
      radio: 0.55,
    },
    {
      nombre: "pizza",
      un: "una",
      el: "la",
      emoji: "🍕",
      arma(g) {
        const s = new T.Shape();
        s.moveTo(0, -0.55);
        s.lineTo(0.42, 0.45);
        s.quadraticCurveTo(0, 0.55, -0.42, 0.45);
        s.lineTo(0, -0.55);
        pieza(g, prisma(s, 0.08), 0xf7c33a, 0, 0.08, 0, Math.PI / 2); // la tajada (queso)
        pieza(g, cil(0.07, 0.07, 0.86, 10), 0xc98a3c, 0, 0.06, 0.47, 0, 0, Math.PI / 2); // borde (lado ancho)
        [
          [0.14, 0.3],
          [-0.15, 0.22],
          [0.04, 0.02],
          [-0.02, -0.25],
        ].forEach(([x, z]) => pieza(g, cil(0.08, 0.08, 0.025, 12), 0xb32a1f, x, 0.1, z)); // pepperoni
      },
      alto: 0.14,
      radio: 0.5,
      gira: true, // cae girando como un plato
    },
    {
      nombre: "dona",
      un: "una",
      el: "la",
      emoji: "🍩",
      arma(g) {
        // de pie, como una rueda (rueda por la carretera)
        pieza(g, compartir(new T.TorusGeometry(0.36, 0.17, 12, 26)), 0xc07a35, 0, 0.53, 0, 0, Math.PI / 2);
        pieza(
          g,
          compartir(new T.TorusGeometry(0.36, 0.15, 10, 26)),
          0xff5fa2,
          0.075,
          0.53,
          0,
          0,
          Math.PI / 2,
        ); // glaseado
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          pieza(
            g,
            caja(0.03, 0.03, 0.09),
            i % 2 ? 0xffffff : 0x4ad6ff,
            0.235,
            0.53 + Math.sin(a) * 0.36,
            Math.cos(a) * 0.36,
            a,
          ); // confites
        }
      },
      alto: 1.06,
      radio: 0.55,
      rueda: true,
    },
    {
      nombre: "hot dog",
      un: "un",
      el: "el",
      emoji: "🌭",
      arma(g) {
        pieza(g, cil(0.22, 0.22, 1, 16), 0xe0a457, 0, 0.22, 0, 0, 0, Math.PI / 2, 1, 1, 1.5); // pan
        pieza(g, cil(0.13, 0.13, 1.2, 12), 0xb5452e, 0, 0.4, 0, 0, 0, Math.PI / 2); // salchicha
        [-0.6, 0.6].forEach((x) => pieza(g, esfera(0.13, 12, 8), 0xb5452e, x, 0.4, 0));
        for (let i = 0; i < 6; i++)
          pieza(
            g,
            caja(0.18, 0.03, 0.05),
            0xffd21a,
            -0.45 + i * 0.18,
            0.53,
            i % 2 ? 0.04 : -0.04,
            0,
            i % 2 ? 0.6 : -0.6,
          ); // mostaza
      },
      alto: 0.55,
      radio: 0.65,
    },
    {
      nombre: "sandía",
      un: "una",
      el: "la",
      emoji: "🍉",
      arma(g) {
        // tajada de pie: media luna verde con la parte roja adelante y atrás
        const media = (r) => {
          const s = new T.Shape();
          s.absarc(0, 0, r, 0, Math.PI, false);
          s.lineTo(r, 0);
          return s;
        };
        pieza(g, prisma(media(0.62), 0.2), 0x2f8a34, 0, 0, -0.1);
        pieza(g, prisma(media(0.55), 0.22), 0xe8364a, 0, 0.005, -0.11);
        for (let i = 0; i < 8; i++) {
          const a = 0.3 + (i / 8) * 2.5,
            r = 0.25 + (i % 2) * 0.13;
          [-0.115, 0.115].forEach((z) =>
            pieza(g, caja(0.04, 0.07, 0.01), 0x1a1a1a, Math.cos(a) * r, Math.sin(a) * r, z, 0, 0, a),
          ); // semillas
        }
      },
      alto: 0.62,
      radio: 0.62,
      rebota: true,
    },
    {
      nombre: "helado",
      un: "un",
      el: "el",
      emoji: "🍦",
      arma(g) {
        pieza(g, compartir(new T.ConeGeometry(0.3, 0.9, 16)), 0xd9a35a, 0, 0.45, 0, Math.PI); // cono (punta abajo)
        pieza(g, esfera(0.34), 0xff7fb5, 0, 0.98, 0); // fresa
        pieza(g, esfera(0.3), 0x3a1d0e, 0, 1.36, 0); // chocolate
        pieza(g, esfera(0.08, 10, 8), 0xd4142a, 0, 1.7, 0); // cereza
      },
      alto: 1.75,
      radio: 0.4,
      clava: true, // se clava de punta en el piso
    },
    {
      nombre: "pollo frito",
      un: "un",
      el: "el",
      emoji: "🍗",
      arma(g) {
        pieza(g, esfera(0.35), 0x8f4716, 0.15, 0.35, 0, 0, 0, 0, 1.45, 1, 1, {
          roughness: 1,
          flatShading: true,
        }); // la carne
        pieza(g, cil(0.07, 0.07, 0.6, 10), 0xf3ead8, -0.5, 0.33, 0, 0, 0, Math.PI / 2); // hueso
        [-0.06, 0.06].forEach((z) => pieza(g, esfera(0.11, 10, 8), 0xf3ead8, -0.82, 0.33, z));
      },
      alto: 0.7,
      radio: 0.65,
    },
    {
      nombre: "papas fritas",
      un: "unas",
      el: "las",
      emoji: "🍟",
      arma(g) {
        pieza(g, cil(0.36, 0.27, 0.6, 4), 0xd62828, 0, 0.3, 0, 0, Math.PI / 4); // la cajita
        for (let i = 0; i < 14; i++) {
          const x = R(-0.2, 0.2),
            z = R(-0.2, 0.2);
          pieza(
            g,
            caja(0.07, 0.7, 0.07),
            0xffd447,
            x,
            0.65 + R(0, 0.12),
            z,
            R(-0.25, 0.25),
            0,
            R(-0.25, 0.25),
          );
        }
      },
      alto: 1.1,
      radio: 0.4,
    },
    {
      nombre: "plato de espagueti",
      un: "un",
      el: "el",
      emoji: "🍝",
      arma(g) {
        pieza(g, cil(0.6, 0.45, 0.08, 24), 0xf5f5f0, 0, 0.04, 0); // plato
        pieza(g, cil(0.63, 0.63, 0.03, 24), 0xe2e2dc, 0, 0.09, 0); // borde del plato
        pieza(g, esfera(0.45, 16, 10), 0xf2d16b, 0, 0.1, 0, 0, 0, 0, 1, 0.5, 1); // montaña de fideos
        for (let i = 0; i < 18; i++) {
          // fideos enredados
          const a = R(0, 6.28),
            r = R(0, 0.32);
          pieza(
            g,
            compartir(new T.TorusGeometry(R(0.1, 0.24), 0.022, 5, 18)),
            0xf2d16b,
            Math.cos(a) * r,
            0.16 + R(0, 0.16),
            Math.sin(a) * r,
            R(0, 3),
            R(0, 3),
            R(0, 3),
          );
        }
        pieza(g, esfera(0.27, 14, 8), 0xc8281e, 0, 0.3, 0, 0, 0, 0, 1, 0.32, 1); // salsa de tomate
        [
          [0.09, 0.37, 0.05],
          [-0.12, 0.35, -0.07],
          [0.02, 0.36, -0.17],
        ].forEach(([x, y, z]) =>
          pieza(g, esfera(0.1, 10, 8), 0x6b3b22, x, y, z, 0, 0, 0, 1, 1, 1, { flatShading: true }),
        ); // albóndigas
        pieza(g, caja(0.05, 0.7, 0.02), 0xc0c0c8, 0.22, 0.55, 0.1, 0, 0, -0.35, 1, 1, 1, {
          metalness: 0.8,
          roughness: 0.3,
        }); // tenedor
      },
      alto: 0.6,
      radio: 0.62,
      albondigas: true, // dispara albóndigas
    },
  ];
  // cada comida queda en pocas mallas (una por color) para que pese poco
  COMIDAS.forEach((c) => {
    c.plantilla = new T.Group();
    c.arma(c.plantilla);
    fusionar(c.plantilla);
  });

  // ===================== PIEZAS QUE SE REUSAN =====================
  const libres = COMIDAS.map(() => []);
  const sacar = (k) => {
    const g = libres[k].pop() || COMIDAS[k].plantilla.clone();
    if (!g.parent) sc.add(g);
    g.visible = true;
    return g;
  };
  const guardar = (f) => {
    f.g.visible = false;
    libres[f.k].push(f.g);
  };
  // círculo rojo de aviso
  const geoAviso = compartir(new T.RingGeometry(0.82, 1, 40));
  geoAviso.rotateX(-Math.PI / 2);
  const avisos = [];
  const sacarAviso = () => {
    let a = avisos.find((m) => !m.visible);
    if (!a) {
      a = new T.Mesh(
        geoAviso,
        new T.MeshBasicMaterial({
          color: 0xff2a2a,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
        }),
      );
      sc.add(a);
      avisos.push(a);
    }
    a.visible = true;
    return a;
  };
  // cráter: mancha oscura que queda en el piso
  const geoCrater = compartir(new T.CircleGeometry(1, 28));
  geoCrater.rotateX(-Math.PI / 2);
  const crateres = [];
  const ponerCrater = (x, z, r) => {
    let c = crateres.find((m) => !m.visible);
    if (!c) {
      c = new T.Mesh(
        geoCrater,
        new T.MeshBasicMaterial({
          color: 0x2b241d,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
      );
      sc.add(c);
      crateres.push(c);
    }
    c.visible = true;
    c.position.set(x, 0.04, z);
    c.scale.setScalar(r);
    c.material.opacity = 0.75;
    c.userData.t = (A.segundosEnElSuelo || 20) + 4; // con 0 (la comida se queda) el cráter dura 24 s
  };
  // migas: todas en una sola malla (InstancedMesh) para que sea liviano
  const N_MIGAS = 320;
  const migas = new T.InstancedMesh(
    compartir(new T.BoxGeometry(1, 1, 1)),
    new T.MeshStandardMaterial({ roughness: 0.8 }),
    N_MIGAS,
  );
  migas.frustumCulled = false;
  migas.setColorAt(0, new T.Color(0xffffff)); // así el material nace con colores por migaja
  migas.count = 0;
  sc.add(migas);
  const miga = [];
  for (let i = 0; i < N_MIGAS; i++) miga.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, s: 0, t: 0, r: 0 });
  let sigMiga = 0;
  const _c = new T.Color(),
    m4 = new T.Matrix4(),
    q4 = new T.Quaternion(),
    e4 = new T.Euler(),
    v4 = new T.Vector3(),
    s4 = new T.Vector3();
  const coloresDe = (c) => {
    const cs = [];
    c.plantilla.traverse((o) => o.isMesh && cs.push(o.material.color.getHex()));
    return cs;
  };
  const colores = COMIDAS.map(coloresDe);
  const soltarMigas = (k, x, y, z, tam) => {
    const n = Math.round(26 * Math.max(0.4, CALIDAD.efectos)),
      cs = colores[k];
    for (let j = 0; j < n; j++) {
      const p = miga[sigMiga];
      migas.setColorAt(sigMiga, _c.setHex(cs[j % cs.length]));
      sigMiga = (sigMiga + 1) % N_MIGAS;
      const a = R(0, 6.28),
        v = R(6, 18);
      Object.assign(p, { x: x + R(-1, 1) * tam * 0.3, y: y + R(0, tam * 0.3), z: z + R(-1, 1) * tam * 0.3 });
      Object.assign(p, {
        vx: Math.cos(a) * v,
        vy: R(8, 22),
        vz: Math.sin(a) * v,
        s: R(0.2, 0.55) * (tam / 10),
        t: R(1.8, 3),
        r: R(0, 6),
      });
    }
    if (migas.instanceColor) migas.instanceColor.needsUpdate = true;
  };
  // polvo
  const polvos = [];
  for (let i = 0; i < 6; i++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: humoTex,
        color: 0xd9c7a8,
        depthWrite: false,
        transparent: true,
        opacity: 0,
      }),
    );
    sp.visible = false;
    sc.add(sp);
    polvos.push({ sp, t: 0 });
  }
  const levantarPolvo = (x, z, tam) => {
    const p = polvos.find((q) => q.t <= 0) || polvos[0];
    p.t = 1;
    p.tam = tam;
    p.sp.position.set(x, tam * 0.3, z);
    p.sp.visible = true;
  };

  // ===================== ALBÓNDIGAS =====================
  // Todas en una sola malla (InstancedMesh). Las dispara el plato de espagueti.
  const N_ALB = 24,
    albMesh = new T.InstancedMesh(
      compartir(new T.IcosahedronGeometry(1, 1)),
      new T.MeshStandardMaterial({ color: 0x6b3b22, roughness: 0.85, flatShading: true }),
      N_ALB,
    );
  albMesh.frustumCulled = false;
  albMesh.castShadow = true;
  albMesh.count = 0;
  sc.add(albMesh);
  const albs = [];
  for (let i = 0; i < N_ALB; i++)
    albs.push({ t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 1, rx: 0, rz: 0 });

  // ===================== SONIDOS =====================
  const ruido = (dur, f0, f1, vol) => {
    try {
      if (!AC) return;
      const o = AC.createOscillator(),
        v = AC.createGain(),
        t0 = AC.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(f0, t0);
      o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      v.gain.setValueAtTime(vol, t0);
      v.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(v).connect(AC.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch (e) {}
  };
  const sonidoGolpe = (cerca) => ruido(0.7, 150, 32, cerca ? 0.6 : 0.25); // ¡PUM!
  const sonidoSilbido = (dur) => ruido(dur, 1300, 380, 0.05); // fiiiiuuu (cuando viene hacia vos)
  const sonidoPop = (cerca) => ruido(0.25, 260, 90, cerca ? 0.35 : 0.12); // ¡POP! (sale una albóndiga)

  // ===================== LA TORMENTA =====================
  const comidas = []; // las que están cayendo o en el piso
  const D = { t: 0, golpeT: 0, choqueT: 0, avisoT: 0 };
  D.COMIDAS = COMIDAS;
  D.comidas = comidas;
  D.albondigas = albs;
  window.TORMENTA_COMIDA = D; // para revisar desde la consola
  const maxComidas = () => Math.max(4, Math.round(A.maxComidas * Math.max(0.45, CALIDAD.efectos)));
  // la comida se queda donde cae: cuando ya hay muchas, la más vieja de las que están en el piso se hunde
  const hundirLaMasVieja = () => {
    let vieja = null;
    for (const f of comidas) if (f.fase == "piso" && !f.hundir && (!vieja || f.t > vieja.t)) vieja = f;
    if (vieja) vieja.hundir = true;
  };
  const golpear = (cuanto, texto) => {
    if (D.golpeT > 0) return;
    D.golpeT = 1.4;
    dmg += PV.crush ? cuanto * 0.3 : cuanto;
    B.v *= 0.4;
    shake = 1;
    msg(texto, 2200);
    if (dmg >= 100) {
      dmg = 100;
      end();
    }
  };
  // una comida al azar de las que caen en la tormenta de ahora (si hay dos juntas, primero se elige la tormenta)
  const elegir = () => {
    const tormenta = pk_(AP.tormentas()),
      lista = [];
    COMIDAS.forEach((c, i) => [].concat(c.tormenta || "morada").includes(tormenta) && lista.push(i));
    return lista.length ? pk_(lista) : 0;
  };
  // k: qué comida (si no se dice, una al azar). Para probar desde la consola: TORMENTA_COMIDA.soltar(8)
  // op (opcional): { x, z } dónde cae, y desde qué altura, tam, y si va lanzada: vx, vz, vy, gravedad
  function soltar(k = elegir(), op = {}) {
    const c = COMIDAS[k],
      tam = op.tam || R(A.tamano[0], A.tamano[1]),
      y0 = op.y != null ? op.y : R(130, 170),
      tCaida = y0 / A.velocidadCaida,
      haciaVos = op.x == null && Math.random() < 0.25; // una de cada 4 va directo a donde vas a estar
    let x, z;
    if (op.x != null) {
      x = op.x;
      z = op.z;
    } else if (haciaVos) {
      x = B.x - Math.sin(B.h) * B.v * tCaida + R(-3, 3);
      z = B.z - Math.cos(B.h) * B.v * tCaida + R(-6, 6);
    } else {
      x = Math.random() < 0.55 ? R(-7, 7) : (Math.random() < 0.5 ? -1 : 1) * R(10, 38);
      z = B.z - R(30, 280);
    }
    const g = sacar(k);
    g.scale.setScalar(tam);
    g.rotation.set(c.clava ? 0.35 : 0, R(0, 6.28), 0);
    if (c.rueda) g.rotation.y = 0; // las donas ruedan hacia atrás, por la carretera
    if (c.tira) g.rotation.y = R(-0.15, 0.15); // las tiras quedan atravesadas en la carretera
    const f = {
      k,
      c,
      g,
      tam,
      x,
      z,
      y: y0,
      vy: op.vy != null ? op.vy : -A.velocidadCaida,
      fase: "cae",
      t: 0,
      rebotes: c.rebota ? 2 : 0,
      gravedad: op.gravedad || false, // número: cae en curva con esa gravedad (lanzada)
      vx: op.vx || 0,
      vz: 0,
      vzAire: op.vz || 0,
      danioK: op.danioK || 1, // las hamburguesas del tornado de papas dañan menos
      techo: 0, // si cae encima de un edificio: a qué altura está el techo (js/comida-nueva.js)
    };
    // el círculo rojo va donde va a caer (si va lanzada, se calcula dónde)
    let ax = x,
      az = z;
    if (op.gravedad) {
      const g = op.gravedad,
        v = f.vy,
        tVuelo = (v + Math.sqrt(v * v + 2 * g * y0)) / g;
      ax += f.vx * tVuelo;
      az += f.vzAire * tVuelo;
    }
    f.aviso = sacarAviso();
    f.aviso.position.set(ax, 0.06, az);
    f.aviso.scale.setScalar(tam * c.radio * 1.1);
    comidas.push(f);
    if (haciaVos && play()) sonidoSilbido(tCaida);
    D.alSoltar.forEach((fn) => fn(f, op));
    return f;
  }
  // el plato de espagueti dispara una albóndiga (a veces hacia vos)
  function lanzarAlbondiga(f, haciaVos) {
    const a = albs.find((q) => q.t <= 0);
    if (!a) return;
    let dx = Math.cos(R(0, 6.28)),
      dz = Math.sin(R(0, 6.28));
    if (haciaVos) {
      const ex = B.x - Math.sin(B.h) * B.v * 1.2 - f.x,
        ez = B.z - Math.cos(B.h) * B.v * 1.2 - f.z,
        d = Math.hypot(ex, ez) || 1;
      dx = ex / d;
      dz = ez / d;
    }
    const v = haciaVos ? R(16, 24) : R(8, 18);
    Object.assign(a, {
      t: 9,
      r: f.tam * R(0.13, 0.18),
      x: f.x,
      y: f.tam * 0.45,
      z: f.z,
      vx: dx * v,
      vy: R(12, 20),
      vz: dz * v,
      rx: 0,
      rz: 0,
    });
    sonidoPop(Math.hypot(B.x - f.x, B.z - f.z) < 150);
  }
  function impacto(f, fuerza) {
    const { x, z, tam, c } = f;
    if (c.alImpacto) c.alImpacto(f, fuerza);
    if (c.albondigas && !f.disparo) {
      // ¡al caer el espagueti salen volando las albóndigas!
      f.disparo = true;
      f.albT = R(A.albondigasCada[0], A.albondigasCada[1]);
      const cerca = Math.hypot(B.x - x, B.z - z) < 250;
      for (let i = 0; i < A.albondigasAlCaer; i++) lanzarAlbondiga(f, cerca && i < 2);
    }
    soltarMigas(f.k, x, 0, z, tam);
    levantarPolvo(x, z, tam);
    ponerCrater(x, z, tam * c.radio * 0.9 * fuerza);
    const dJugador = Math.hypot(B.x - x, B.z - z),
      radio = A.radioGolpe * (tam / 11) * fuerza;
    sonidoGolpe(dJugador < 120);
    if (dJugador < 90) shake = Math.max(shake, (0.9 * fuerza * (90 - dJugador)) / 90);
    // carros: los de abajo quedan aplastados, los de al lado salen volando
    for (const car of cars) {
      if (car.vy) continue;
      const d = Math.hypot(car.x - x, car.z - z);
      if (d < tam * c.radio * 0.8) {
        car.hit = 0.01;
        car.vz = 0;
        car.vx = 0;
        car.o.scale.y = 0.25;
      } else if (d < radio * 1.6) {
        car.vy = R(10, 18) * fuerza;
        car.vx = Math.sign(car.x - x || 1) * R(4, 10);
        car.hit = 1;
      }
    }
    if (play() && dJugador < radio && B.y < tam * 0.6)
      golpear(
        A.danio * fuerza * (f.danioK || 1),
        `${c.emoji}💥 ¡Te ${c.un == "unas" ? "cayeron" : "cayó"} ${c.un} ${c.nombre.toUpperCase()} ${c.un == "unas" ? "GIGANTES" : "GIGANTE"} encima!`,
      );
  }

  D.soltar = soltar;
  D.alSoltar = []; // funciones que se llaman con cada comida que sale (fn(f, op))
  D.ritmo = 1; // más alto = cae comida más seguido (la Ultra Pro Max lo sube)
  // avisos que salen cada tanto, según la tormenta (otros archivos agregan los suyos)
  const MENSAJES = {
    morada: [
      "🍔 ¡Cuidado con las hamburguesas gigantes!",
      "🍕 ¡Llueven pizzas! Esquivá los círculos rojos",
      "🍩 ¡Las donas ruedan! ¡Apartate!",
      "🌭 ¡Un hot dog gigante va cayendo!",
      "🍉 ¡Sandías que rebotan!",
      "🍝 ¡El espagueti dispara albóndigas gigantes!",
      "😱 ¡LA COMIDA NOS ATACA!",
    ],
  };
  D.mensajes = MENSAJES;
  // para que otros archivos agreguen comidas (como js/tormenta-fettuccine.js)
  D.agregarComida = (c) => {
    c.plantilla = new T.Group();
    c.arma(c.plantilla);
    fusionar(c.plantilla);
    COMIDAS.push(c);
    libres.push([]);
    colores.push(coloresDe(c));
    return COMIDAS.length - 1;
  };
  D.golpear = golpear;
  D.soltarMigas = soltarMigas;

  function ocultarTodo() {
    comidas.forEach((f) => {
      guardar(f);
      if (f.aviso) f.aviso.visible = false;
    });
    comidas.length = 0;
    crateres.forEach((m) => (m.visible = false));
    polvos.forEach((p) => ((p.t = 0), (p.sp.visible = false)));
    miga.forEach((p) => (p.t = 0));
    migas.count = 0;
    albs.forEach((a) => (a.t = 0));
    albMesh.count = 0;
  }

  // ===================== CUADRO A CUADRO =====================
  let zAnt = null,
    estaba = false;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    // reinicio (el bus saltó de lugar) o apocalipsis apagado: limpiar todo
    if (
      (zAnt != null && Math.abs(B.z - zAnt) > 30 && state == "play") ||
      (AP.fase == "calma" && !comidas.length && estaba)
    ) {
      ocultarTodo();
      estaba = false;
    }
    zAnt = B.z;
    if (MONT.on) {
      if (estaba) ocultarTodo();
      estaba = false;
      return;
    }
    const activa = enComida();
    if (!activa && !comidas.length && migas.count == 0 && albMesh.count == 0) return;
    estaba = true;
    if (state != "play") return;
    D.golpeT -= dt;
    D.choqueT -= dt;
    // ----- que llueva comida -----
    if (activa) {
      D.t -= dt;
      if (D.t <= 0) {
        D.t = R(A.cadaCuanto[0], A.cadaCuanto[1]) / Math.max(0.5, CALIDAD.efectos) / D.ritmo;
        if (comidas.length < maxComidas()) soltar();
        else hundirLaMasVieja(); // ya hay muchas: la más vieja se hunde y deja lugar
      }
      D.avisoT -= dt;
      if (D.avisoT <= 0) {
        D.avisoT = R(12, 18); // cada tanto (la Tormenta Morada también avisa cosas)
        msg(pk_(MENSAJES[pk_(AP.tormentas())] || MENSAJES.morada), 2200);
      }
    }
    // ----- cada comida -----
    for (let i = comidas.length - 1; i >= 0; i--) {
      const f = comidas[i],
        c = f.c;
      f.t += dt;
      if (f.fase == "cae") {
        f.y += f.vy * dt;
        f.x += f.vx * dt; // lanzada en curva
        f.z += f.vzAire * dt;
        if (f.techo && f.y <= f.techo) {
          // cayó encima de un edificio: lo rompe y sigue cayendo
          f.techo = 0;
          if (f.alTecho) f.alTecho(f);
        }
        if (c.tira)
          f.g.rotation.z = Math.sin(f.t * 6) * 0.12; // la tira ondea al caer
        else if (c.gira) f.g.rotation.y += dt * 6;
        else if (c.rueda) f.g.rotation.x += dt * 3;
        else f.g.rotation.y += dt * 1.2;
        if (f.aviso) f.aviso.material.opacity = 0.45 + 0.35 * Math.sin(f.t * 14);
        if (f.y <= 0) {
          f.y = 0;
          impacto(f, f.rebotes == 2 || !c.rebota ? 1 : 0.5);
          f.vx = f.vzAire = 0;
          if (f.rebotes > 0) {
            f.vy = A.velocidadCaida * (f.rebotes == 2 ? 0.45 : 0.25);
            f.rebotes--;
            f.gravedad = true;
          } else {
            f.fase = "piso";
            f.t = 0;
            if (f.aviso) f.aviso.visible = false;
            f.aviso = null;
            if (c.rueda) f.vz = R(9, 15); // ruedan hacia atrás (hacia el que viene manejando)
          }
        } else if (f.gravedad) f.vy -= (f.gravedad === true ? 60 : f.gravedad) * dt; // rebote o lanzada: sube y vuelve a caer
      } else {
        // en el piso (y las donas rodando)
        if (f.vz) {
          f.z += f.vz * dt;
          f.g.rotation.x += (f.vz * dt) / (f.tam * (c.radioRueda || 0.53));
          for (const car of cars)
            if (
              !car.vy &&
              car.o.scale.y > 0.5 &&
              Math.abs(car.x - f.x) < f.tam * 0.35 + 1 &&
              Math.abs(car.z - f.z) < f.tam * 0.4
            ) {
              car.hit = 0.01;
              car.vz = 0;
              car.o.scale.y = 0.25;
            }
        }
        // el espagueti en el piso sigue disparando albóndigas
        if (c.albondigas && enComida() && f.y > -f.tam * 0.1 && Math.abs(B.z - f.z) < 400) {
          f.albT -= dt;
          if (f.albT <= 0) {
            f.albT = R(A.albondigasCada[0], A.albondigasCada[1]);
            lanzarAlbondiga(f, Math.random() < 0.5);
          }
        }
        // se queda donde cayó (segundosEnElSuelo = 0); si no, se hunde después de un rato.
        // También se hunde si ya hay muchas (hundirLaMasVieja) o si quedó muy atrás.
        const vida = !A.segundosEnElSuelo
          ? Infinity
          : enComida()
            ? A.segundosEnElSuelo
            : Math.min(A.segundosEnElSuelo, 3);
        if (f.t > vida || f.hundir) f.y -= dt * f.tam * 0.25;
        if (f.y < -f.tam * c.alto || f.z - B.z > 120 || B.z - f.z > 900) {
          guardar(f);
          comidas.splice(i, 1);
          continue;
        }
        // chocar con la comida tirada
        if (play() && f.y > -f.tam * c.alto * 0.5 && B.y < f.tam * c.alto * 0.8) {
          const rx = f.tam * (c.tira ? c.tira[0] : c.radio),
            rz = f.tam * (c.tira ? c.tira[1] : c.radio);
          if (Math.abs(B.x - f.x) < rx + PV.hw && Math.abs(B.z - f.z) < rz + PV.hl * 0.5) {
            if (c.alChocar) c.alChocar(f, dt);
            else if (PV.crush) {
              // el tanque y el camión monstruo la aplastan
              if (f.g.scale.y > f.tam * 0.3) {
                f.g.scale.y = f.tam * 0.2;
                f.vz = 0;
                cash += 500;
                soltarMigas(f.k, f.x, 0, f.z, f.tam * 0.6);
                msg(`${c.emoji} ¡Aplastaste ${c.el} ${c.nombre}! +₡500`, 1800);
              }
            } else {
              // el bus la empuja hacia un lado (así nunca tranca la carretera) y pierde velocidad
              const lado = Math.sign(f.x - B.x) || 1;
              f.x += lado * Math.max(4, Math.abs(B.v) * 0.6) * dt;
              f.vz = 0;
              B.v *= Math.pow(0.15, dt);
              if (D.choqueT <= 0) {
                D.choqueT = 1.5;
                golpear(
                  6,
                  `${c.emoji} ¡Chocaste con ${c.un} ${c.nombre} ${c.un == "unas" ? "gigantes" : "gigante"}!`,
                );
              }
            }
          }
        }
      }
      f.g.position.set(f.x, f.y, f.z);
    }
    // ----- albóndigas: saltan, rebotan y ruedan -----
    let na = 0;
    for (let i = 0; i < N_ALB; i++) {
      const a = albs[i];
      if (a.t <= 0) continue;
      a.t -= dt;
      a.vy -= 30 * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.z += a.vz * dt;
      if (a.y < a.r) {
        a.y = a.r;
        if (a.vy < -4) {
          a.vy *= -0.45; // rebota
          if (Math.random() < 0.5) soltarMigas(COMIDAS.length - 1, a.x, 0, a.z, a.r * 3); // salpica salsa
        } else a.vy = 0;
        const roce = Math.pow(0.7, dt); // rueda y se va frenando
        a.vx *= roce;
        a.vz *= roce;
      }
      a.rx += (a.vz * dt) / a.r;
      a.rz -= (a.vx * dt) / a.r;
      // manda a volar los carros
      for (const car of cars)
        if (!car.vy && a.y < a.r * 2 + 1 && Math.hypot(car.x - a.x, car.z - a.z) < a.r + 1.3) {
          car.vy = R(9, 15);
          car.vx = Math.sign(car.x - a.x || 1) * R(3, 8);
          car.hit = 1;
        }
      // te pega
      if (
        play() &&
        Math.abs(B.x - a.x) < a.r + PV.hw &&
        Math.abs(B.z - a.z) < a.r + PV.hl * 0.5 &&
        B.y < a.y + a.r
      ) {
        golpear(A.danioAlbondiga, "🍝💥 ¡Te pegó una ALBÓNDIGA GIGANTE!");
        a.vx = Math.sign(a.x - B.x || 1) * 10;
        a.vz = 0;
        a.vy = 8;
      }
      if (a.z - B.z > 150 || B.z - a.z > 900) a.t = 0;
      if (a.t <= 0) continue;
      const s = a.r * Math.min(1, a.t * 2);
      m4.compose(v4.set(a.x, a.y, a.z), q4.setFromEuler(e4.set(a.rx, 0, a.rz)), s4.set(s, s, s));
      albMesh.setMatrixAt(na++, m4);
    }
    albMesh.count = na;
    albMesh.instanceMatrix.needsUpdate = true;
    // ----- migas -----
    let n = 0;
    for (let i = 0; i < N_MIGAS; i++) {
      const p = miga[i];
      if (p.t <= 0) continue;
      p.t -= dt;
      p.vy -= 30 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < p.s * 0.5) {
        p.y = p.s * 0.5;
        p.vy *= -0.3;
        p.vx *= 0.6;
        p.vz *= 0.6;
      }
      p.r += dt * 5;
      const s = p.s * Math.min(1, p.t * 2);
      m4.compose(v4.set(p.x, p.y, p.z), q4.setFromEuler(e4.set(p.r, p.r * 0.7, 0)), s4.set(s, s, s));
      // las migas vivas se ponen al principio de la lista: así solo se dibujan esas
      if (n != i) {
        miga[i] = miga[n];
        miga[n] = p;
        if (migas.instanceColor) {
          migas.getColorAt(i, _c);
          const ci = _c.getHex();
          migas.getColorAt(n, _c);
          migas.setColorAt(i, _c);
          migas.setColorAt(n, _c.setHex(ci));
          migas.instanceColor.needsUpdate = true;
        }
      }
      migas.setMatrixAt(n, m4);
      n++;
    }
    sigMiga = n % N_MIGAS;
    migas.count = n;
    migas.instanceMatrix.needsUpdate = true;
    // ----- polvo y cráteres -----
    polvos.forEach((p) => {
      if (p.t <= 0) return;
      p.t -= dt * 0.6;
      p.sp.visible = p.t > 0;
      p.sp.scale.setScalar(p.tam * (1.2 + (1 - p.t) * 2.5));
      p.sp.material.opacity = Math.max(0, p.t) * 0.8;
    });
    crateres.forEach((m) => {
      if (!m.visible) return;
      m.userData.t -= dt;
      if (m.userData.t < 2) m.material.opacity = Math.max(0, m.userData.t / 2) * 0.75;
      if (m.userData.t <= 0 || m.position.z - B.z > 150) m.visible = false;
    });
  };
})();
