// =====================================================================
// MUNDOS NUEVOS · ZONAS 51 A 54. Se carga después de js/condominio.js (zona 50).
// Busca estos títulos con Ctrl+F:
//   ZONA 51 · VOLCÁN            · volcanes humeando, ríos de lava a los lados (¡no te metás!), ceniza
//                                 y piedras de fuego que caen cerca de la carretera
//   ZONA 52 · PLAYA DEL CARIBE  · el mar a la derecha con olas, sombrillas, palmeras, casitas de colores,
//                                 salvavidas, muelle y botes
//   ZONA 53 · MUNDO DE DULCES   · árboles de chupeta, bastones de dulce, cerros de helado, gomitas,
//                                 río de chocolate, casas de galleta y nubes de algodón
//   ZONA 54 · CIUDAD DEL FUTURO · torres de vidrio con luces de neón, arcos de luz, carros voladores y
//                                 un tren flotante (es de noche para que se vean las luces)
// El clima de cada zona (color del suelo, neblina, oscuridad) está en CLIMA, en cada zona.
// =====================================================================
(function () {
  if (NZ <= 54) return;
  const { caja, cilindro, cartel, compartir, mat, fusionar, humoTex, llamaTex, LUZ, VIDRIO, DER, IZQ } =
    MUNDO;
  const z0 = (zona) => -zona * 1000;
  const lado = (i) => (i % 2 ? 1 : -1);
  // cada zona arma su escenario en su propio grupo y al final se junta en pocas mallas
  const nuevaZona = (zona, nombre, clima) => {
    ZN.push(nombre);
    CLIMA[zona] = clima;
    EXR.push([z0(zona), z0(zona) - 1000]);
    EXRL.push([z0(zona), z0(zona) - 1000]);
    const g = new T.Group();
    W(g);
    // el suelo de la zona: dos planos de color a los lados de la carretera (el zacate de siempre queda tapado)
    [-1, 1].forEach((q) =>
      plano(g, 1500, 1000, clima.suelo, q * (7.5 + 750), z0(zona) - 500, 0.025, {
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    return g;
  };
  const terminar = (g) => {
    g.add(fusionar(new T.Group().add(...g.children)));
    congelar(g, new Set());
  };
  const animados = new T.Group();
  W(animados);
  const poner = (padre, g, x, z, ry = 0, y = 0) => {
    g.position.set(x, y, z);
    g.rotation.y = ry;
    padre.add(g);
    return g;
  };
  const malla = (padre, geo, c, x, y, z, o) => {
    const m = new T.Mesh(compartir(geo), mat(c, o));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    padre.add(m);
    return m;
  };
  const plano = (padre, w, d, c, x, z, y = 0.03, o = {}) => {
    const m = new T.Mesh(
      compartir(new T.PlaneGeometry(w, d)),
      mat(
        c,
        Object.assign(
          { roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 },
          o,
        ),
      ),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    padre.add(m);
    return m;
  };
  const portico = (padre, z, texto, fondo, letra = "#ffffff") => {
    const g = new T.Group();
    [-9.5, 9.5].forEach((x) => caja(g, 0.7, 7.6, 0.7, 0x8a8f94, x, 3.8, 0));
    caja(g, 19.6, 0.8, 0.8, 0x8a8f94, 0, 7.6, 0);
    cartel(g, texto, 18.2, 2.3, fondo, letra, 0, 9.2, 0.45);
    cartel(g, texto, 18.2, 2.3, fondo, letra, 0, 9.2, -0.45, Math.PI);
    return poner(padre, g, 0, z);
  };
  const techo = (g, w, h, d, c, y) => {
    const s = new T.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, h);
    s.lineTo(-w / 2, 0);
    const m = new T.Mesh(
      compartir(new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2)),
      mat(c),
    );
    m.position.y = y;
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const palmera = (g, x, z, alto = 8) => {
    const inc = R(-0.25, 0.25);
    const t = cilindro(g, 0.28, alto, 0x8d6e63, x, alto / 2, z);
    t.rotation.z = inc;
    const tx = x - Math.sin(inc) * alto * 0.5,
      ty = alto - (1 - Math.cos(inc)) * alto * 0.5;
    for (let i = 0; i < 7; i++) {
      const h = caja(
        g,
        0.6,
        0.08,
        4.4,
        0x2e7d32,
        tx + Math.cos(i * 0.9) * 1.8,
        ty,
        z + Math.sin(i * 0.9) * 1.8,
      );
      h.rotation.set(0.4, -i * 0.9 + Math.PI / 2, 0);
    }
    [0, 2, 4].forEach((a) =>
      malla(
        g,
        new T.SphereGeometry(0.3, 8, 6),
        0x6d4c41,
        tx + Math.cos(a) * 0.4,
        ty - 0.4,
        z + Math.sin(a) * 0.4,
      ),
    );
  };
  const enZona = (zona, margen = 250) => {
    const u = B.z - CZ;
    return u < z0(zona) + margen && u > z0(zona) - 1000 - margen;
  };
  const golpe = (cuanto, texto) => {
    if (window.TORMENTA_COMIDA) return TORMENTA_COMIDA.golpear(cuanto, texto);
    dmg += cuanto;
    msg(texto, 2200);
    if (dmg >= 100) ((dmg = 100), end());
  };

  // ===================== ZONA 51 · VOLCÁN =====================
  const VOL = nuevaZona(51, "🌋 Volcán", { suelo: 0x1e1715, niebla: [40, 520], oscuro: 0.35 });
  const Z51 = z0(51);
  portico(VOL, Z51 - 25, "🌋 VOLCÁN · CUIDADO CON LA LAVA", "#bf360c");
  const lavaMat = { emissive: 0xff2200, emissiveIntensity: 0.75, roughness: 0.6 };
  // los volcanes
  [
    [-240, Z51 - 520, 200, 210],
    [270, Z51 - 300, 160, 150],
  ].forEach(([x, z, r, h]) => {
    malla(VOL, new T.ConeGeometry(r, h, 22), 0x4e342e, x, h / 2, z);
    malla(VOL, new T.CylinderGeometry(r * 0.13, r * 0.13, 3, 18), 0xff6d00, x, h - 1, z, lavaMat); // el cráter
    for (let i = 0; i < 5; i++) {
      // lava bajando
      const a = R(-1.2, 1.2) + (x < 0 ? 0 : Math.PI),
        m = malla(
          VOL,
          new T.BoxGeometry(6, 1, h * 1.05),
          0xff5a00,
          x + Math.cos(a) * r * 0.45,
          h * 0.5,
          z + Math.sin(a) * r * 0.45,
          lavaMat,
        );
      m.lookAt(x + Math.cos(a) * r, 0, z + Math.sin(a) * r);
      m.rotateX(-Math.atan2(h, r) + Math.PI / 2 - 0.02);
    }
  });
  // humo saliendo de los cráteres
  const humosVolcan = [];
  for (let i = 0; i < 8; i++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: humoTex,
        color: 0x5d5d5d,
        transparent: true,
        depthWrite: false,
        opacity: 0.7,
      }),
    );
    animados.add(sp);
    humosVolcan.push({
      sp,
      t: i / 8,
      x: i % 2 ? -240 : 270,
      y0: i % 2 ? 212 : 152,
      z: i % 2 ? Z51 - 520 : Z51 - 300,
    });
  }
  // ríos de lava a los dos lados, con orillas de piedra
  [-1, 1].forEach((s) => {
    plano(VOL, 6, 980, 0xd83a00, s * 20, Z51 - 500, 0.06, lavaMat);
    [-1, 1].forEach((o) => caja(VOL, 1.2, 0.7, 980, 0x2b2522, s * 20 + o * 3.6, 0.35, Z51 - 500));
  });
  // piedras y árboles quemados
  for (let i = 0; i < 70; i++) {
    const r = R(0.8, 3.5),
      m = malla(
        VOL,
        new T.DodecahedronGeometry(1, 0),
        0x2b2522,
        lado(i) * R(26, 140),
        r * 0.5,
        Z51 - R(20, 990),
      );
    m.scale.setScalar(r);
    m.rotation.set(R(0, 3), R(0, 3), 0);
  }
  for (let i = 0; i < 26; i++) {
    const x = lado(i) * R(28, 90),
      z = Z51 - R(30, 980),
      h = R(4, 8);
    cilindro(VOL, 0.25, h, 0x1b1b1b, x, h / 2, z);
    const rama = caja(VOL, 0.15, 2.2, 0.15, 0x1b1b1b, x + 0.6, h * 0.7, z);
    rama.rotation.z = -0.8;
  }
  // charcos de lava
  for (let i = 0; i < 10; i++) {
    const m = malla(
      VOL,
      new T.CircleGeometry(R(4, 9), 14),
      0xff6d00,
      lado(i) * R(35, 120),
      0.07,
      Z51 - R(40, 960),
      lavaMat,
    );
    m.rotation.x = -Math.PI / 2;
  }
  terminar(VOL);
  // piedras de fuego que caen del cielo (con aviso rojo)
  const bombas = [];
  for (let i = 0; i < 6; i++) {
    const g = new T.Group();
    const roca = new T.Mesh(
      compartir(new T.DodecahedronGeometry(1.4, 0)),
      mat(0x3e2723, { emissive: 0xff3d00, emissiveIntensity: 0.6 }),
    );
    g.add(roca);
    const fuego = new T.Sprite(
      new T.SpriteMaterial({
        map: llamaTex,
        color: 0xff8a3d,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
      }),
    );
    fuego.scale.set(5, 7, 1);
    g.add(fuego);
    g.visible = false;
    sc.add(g);
    const aviso = new T.Mesh(
      new T.RingGeometry(4, 5.5, 24),
      new T.MeshBasicMaterial({ color: 0xff1744, transparent: true, opacity: 0.6, depthWrite: false }),
    );
    aviso.rotation.x = -Math.PI / 2;
    aviso.visible = false;
    sc.add(aviso);
    bombas.push({ g, aviso, t: -1, x0: 0, y0: 0, z0: 0, x1: 0, z1: 0, dur: 2.5 });
  }
  const explosiones = [];
  for (let i = 0; i < 4; i++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: llamaTex,
        color: 0xffa040,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        opacity: 0,
      }),
    );
    sc.add(sp);
    explosiones.push({ sp, t: 0 });
  }
  const ceniza = (() => {
    const n = 500,
      pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([R(-60, 60), R(0, 40), R(-60, 60)], i * 3);
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    const p = new T.Points(
      geo,
      new T.PointsMaterial({
        color: 0x9e9e9e,
        size: 0.35,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    p.frustumCulled = false;
    p.visible = false;
    sc.add(p);
    return p;
  })();
  let bombaT = 3,
    lavaAviso = 0;

  // ===================== ZONA 52 · PLAYA DEL CARIBE =====================
  const PLA = nuevaZona(52, "🏖 Playa del Caribe", { suelo: 0xcfae68, niebla: [100, 700] });
  const Z52 = z0(52);
  portico(PLA, Z52 - 25, "🏖 PLAYA DEL CARIBE · PURA VIDA", "#00897b");
  // el mar a la derecha (turquesa cerca, azul más lejos)
  plano(PLA, 160, 1000, 0x26c6da, 120, Z52 - 500, 0.04, { roughness: 0.15, metalness: 0.2 });
  plano(PLA, 1400, 1000, 0x0d7fa8, 900, Z52 - 500, 0.04, { roughness: 0.15, metalness: 0.2 });
  plano(PLA, 4, 1000, 0xa88b4f, 40, Z52 - 500, 0.035); // arena mojada
  // sombrillas, toallas y sillas
  const COL_PLAYA = [0xff5252, 0xffeb3b, 0x40c4ff, 0x69f0ae, 0xff80ab, 0xffab40];
  for (let i = 0; i < 18; i++) {
    const x = R(16, 36),
      z = Z52 - 30 - i * 52 - R(0, 20),
      c = COL_PLAYA[i % COL_PLAYA.length];
    cilindro(PLA, 0.08, 3, 0xeeeeee, x, 1.5, z);
    malla(PLA, new T.ConeGeometry(2.4, 1, 8), c, x, 3.2, z);
    caja(PLA, 1.1, 0.03, 2, COL_PLAYA[(i + 2) % COL_PLAYA.length], x + 1.6, 0.05, z + 0.5);
    const silla = caja(PLA, 0.7, 0.1, 1.8, 0xffffff, x - 1.6, 0.45, z);
    silla.rotation.x = -0.25;
  }
  // palmeras a los dos lados
  for (let i = 0; i < 40; i++) palmera(PLA, i % 3 ? R(12, 38) : -R(12, 60), Z52 - R(30, 980), R(7, 10));
  // casitas de colores sobre pilotes (al otro lado)
  const COL_CASITA = [0xffd54f, 0x4dd0e1, 0xef5350, 0x81c784, 0xba68c8, 0xff8a65];
  for (let i = 0; i < 12; i++) {
    const g = new T.Group(),
      c = COL_CASITA[i % COL_CASITA.length];
    [-3, 3].forEach((x) => [-2.5, 2.5].forEach((z) => caja(g, 0.3, 1.8, 0.3, 0x6d4c41, x, 0.9, z)));
    caja(g, 7, 3, 6, c, 0, 3.3, 0);
    techo(g, 8, 2.2, 7, 0xeceff1, 4.8);
    caja(g, 7, 0.15, 2, 0x8d6e63, 0, 1.8, 4); // corredor
    caja(g, 7, 0.8, 0.1, 0xffffff, 0, 2.3, 5);
    caja(g, 1, 2, 0.1, 0x6d4c41, 0, 2.8, 3.05);
    [-2.3, 2.3].forEach((x) => caja(g, 1.2, 1, 0.1, 0xffffff, x, 3.4, 3.05));
    poner(PLA, g, -R(24, 34), Z52 - 50 - i * 78, IZQ);
  }
  // salvavidas
  {
    const g = new T.Group();
    [-1, 1].forEach((x) => [-1, 1].forEach((z) => caja(g, 0.25, 5, 0.25, 0xffffff, x, 2.5, z)));
    caja(g, 3, 0.3, 3, 0xffffff, 0, 5, 0);
    caja(g, 2.6, 2, 2.6, 0xd32f2f, 0, 6.1, 0);
    cilindro(g, 0.05, 3, 0xffffff, 1.3, 8, 1.3);
    caja(g, 1.2, 0.7, 0.03, 0xd32f2f, 1.9, 9, 1.3);
    poner(PLA, g, 30, Z52 - 420);
  }
  // muelle
  caja(PLA, 4, 0.4, 3, 0x8d6e63, 60, 1.2, Z52 - 640);
  caja(PLA, 70, 0.3, 3, 0x8d6e63, 75, 1.2, Z52 - 640);
  for (let x = 44; x < 110; x += 6)
    [-1.3, 1.3].forEach((z) => cilindro(PLA, 0.2, 2.5, 0x5d4037, x, 0.4, Z52 - 640 + z));
  terminar(PLA);
  // olas que van y vienen y botes meciéndose
  const olas = new T.Group();
  for (let i = 0; i < 3; i++)
    caja(olas, 1.2, 0.08, 1000, 0xffffff, 44 + i * 9, 0.1, Z52 - 500, { transparent: true, opacity: 0.8 });
  animados.add(olas);
  const botes = [];
  [
    [90, 0xffffff],
    [140, 0xff7043],
    [210, 0x42a5f5],
    [120, 0xffee58],
  ].forEach(([x, c], i) => {
    const g = new T.Group();
    caja(g, 2.4, 1, 7, c, 0, 0.5, 0);
    caja(g, 2, 0.3, 5.6, 0x8d6e63, 0, 1, 0);
    cilindro(g, 0.08, 5, 0xeeeeee, 0, 3.5, 0.5);
    const vela = caja(g, 0.05, 3.6, 2.6, 0xffffff, 0, 3.7, -0.8);
    vela.rotation.x = 0.1;
    poner(animados, g, x, Z52 - 150 - i * 220);
    botes.push(g);
  });

  // ===================== ZONA 53 · MUNDO DE DULCES =====================
  const DUL = nuevaZona(53, "🍭 Mundo de dulces", { suelo: 0xec6fae, niebla: [60, 520] });
  const Z53 = z0(53);
  portico(DUL, Z53 - 25, "🍭 MUNDO DE DULCES 🍬", "#ec407a");
  const PASTEL = [0xff80ab, 0x80d8ff, 0xb9f6ca, 0xffff8d, 0xea80fc, 0xffd180, 0xff8a80];
  // árboles de chupeta
  for (let i = 0; i < 34; i++) {
    const x = lado(i) * R(14, 60),
      z = Z53 - R(40, 980),
      h = R(5, 9),
      r = R(1.6, 2.8),
      g = new T.Group();
    cilindro(g, 0.18, h, 0xffffff, 0, h / 2, 0);
    const disco = malla(
      g,
      new T.CylinderGeometry(r, r, 0.5, 24),
      PASTEL[i % PASTEL.length],
      0,
      h + r * 0.8,
      0,
    );
    disco.rotation.x = Math.PI / 2;
    [0.35, 0.65].forEach((f, k) => {
      const aro = malla(
        g,
        new T.TorusGeometry(r * f, r * 0.08, 6, 24),
        PASTEL[(i + 2 + k) % PASTEL.length],
        0,
        h + r * 0.8,
        0.26,
      );
      aro.rotation.z = k;
    });
    poner(DUL, g, x, z, R(-0.6, 0.6));
  }
  // bastones de dulce (rayas rojas y blancas)
  for (let i = 0; i < 22; i++) {
    const g = new T.Group(),
      n = 8;
    for (let k = 0; k < n; k++) cilindro(g, 0.45, 1, k % 2 ? 0xffffff : 0xe53935, 0, 0.5 + k, 0);
    const curva = malla(g, new T.TorusGeometry(1.1, 0.45, 8, 16, Math.PI), 0xe53935, 1.1, n, 0);
    curva.rotation.z = 0;
    poner(DUL, g, lado(i + 1) * R(16, 50), Z53 - R(40, 980), R(0, 6));
  }
  // cerros de helado (bolas de colores con una cereza)
  for (let i = 0; i < 9; i++) {
    const x = lado(i) * R(110, 260),
      z = Z53 - R(60, 940),
      r = R(25, 50);
    malla(
      DUL,
      new T.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      PASTEL[i % PASTEL.length],
      x,
      0,
      z,
    );
    malla(DUL, new T.SphereGeometry(r * 0.6, 18, 10), PASTEL[(i + 3) % PASTEL.length], x, r * 0.8, z);
    malla(DUL, new T.SphereGeometry(r * 0.12, 12, 8), 0xd50000, x, r * 1.42, z);
  }
  // gomitas
  for (let i = 0; i < 50; i++) {
    const r = R(0.8, 1.8);
    malla(
      DUL,
      new T.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      PASTEL[i % PASTEL.length],
      lado(i) * R(12, 90),
      0,
      Z53 - R(30, 990),
      {
        roughness: 0.25,
      },
    );
  }
  // río de chocolate a la izquierda
  plano(DUL, 14, 980, 0x5d3a1a, -38, Z53 - 500, 0.05, { roughness: 0.2 });
  // casas de galleta
  for (let i = 0; i < 8; i++) {
    const g = new T.Group();
    caja(g, 8, 5, 7, 0xb5713a, 0, 2.5, 0);
    techo(g, 9, 3.4, 8, i % 2 ? 0xff80ab : 0xffffff, 5);
    [0.4, 5].forEach((y) => caja(g, 8.2, 0.3, 7.2, 0xffffff, 0, y, 0)); // glaseado
    caja(g, 1.4, 2.6, 0.15, 0xe91e63, 0, 1.3, 3.55);
    [-2.6, 2.6].forEach((x) =>
      malla(
        g,
        new T.CylinderGeometry(0.6, 0.6, 0.15, 14),
        PASTEL[(i + 1) % PASTEL.length],
        x,
        3,
        3.6,
      ).rotateX(Math.PI / 2),
    );
    poner(DUL, g, lado(i) * R(20, 30), Z53 - 80 - i * 115, lado(i) > 0 ? DER : IZQ);
  }
  terminar(DUL);
  // nubes de algodón de azúcar
  const nubes = [];
  for (let i = 0; i < 10; i++) {
    const g = new T.Group();
    for (let k = 0; k < 4; k++) {
      const m = new T.Mesh(compartir(new T.SphereGeometry(1, 12, 8)), mat(i % 2 ? 0xffc1e3 : 0xc5e8ff));
      m.scale.setScalar(R(4, 7));
      m.position.set(k * 5 - 7, R(-1, 1), R(-2, 2));
      g.add(m);
    }
    poner(animados, g, lado(i) * R(20, 120), Z53 - R(50, 950), 0, R(40, 70));
    nubes.push(g);
  }

  // ===================== ZONA 54 · CIUDAD DEL FUTURO =====================
  // Es la última zona: 100 m antes del final el mundo salta a la vuelta siguiente, así que el escenario
  // llega solo hasta FIN.
  const FUT = nuevaZona(54, "🌆 Ciudad del futuro", { suelo: 0x0b0f1c, niebla: [60, 620], oscuro: 0.75 });
  const Z54 = z0(54),
    FIN = Z54 - 1000 + 120;
  portico(FUT, Z54 - 25, "🌆 CIUDAD DEL FUTURO", "#311b92", "#18ffff");
  const NEON = [0x18ffff, 0xff4081, 0x76ff03, 0xffea00, 0xb388ff];
  const neon = (c) => ({ emissive: c, emissiveIntensity: 2 });
  // líneas de neón a la orilla de la carretera
  [-8, 8].forEach((x) =>
    caja(FUT, 0.25, 0.05, Z54 - 30 - FIN, 0x18ffff, x, 0.06, (Z54 - 30 + FIN) / 2, neon(0x18ffff)),
  );
  // torres de vidrio
  for (let i = 0; i < 40; i++) {
    const s = lado(i),
      x = s * R(30, 120),
      z = Z54 - R(40, 1000 - 140),
      w = R(10, 22),
      h = R(50, 170),
      c = NEON[i % NEON.length];
    caja(FUT, w, h, w, 0x1e2a44, x, h / 2, z, { metalness: 0.7, roughness: 0.15 });
    [-1, 1].forEach((a) =>
      [-1, 1].forEach((b) => caja(FUT, 0.4, h, 0.4, c, x + (a * w) / 2, h / 2, z + (b * w) / 2, neon(c))),
    );
    for (let k = 1; k < 5; k++) caja(FUT, w + 0.3, 0.35, w + 0.3, c, x, (h * k) / 5, z, neon(c));
    if (i % 3 == 0) {
      const aro = malla(FUT, new T.TorusGeometry(w * 0.8, 0.5, 8, 28), c, x, h + 6, z, neon(c));
      aro.rotation.x = Math.PI / 2;
    }
  }
  // arcos de luz sobre la carretera
  for (let z = Z54 - 90; z > FIN + 20; z -= 110) {
    const arco = malla(FUT, new T.TorusGeometry(13, 0.45, 8, 36, Math.PI), 0xff4081, 0, 0, z, neon(0xff4081));
    arco.rotation.y = 0;
  }
  // carteles de holograma
  [
    ["AÑO 3000", "#18ffff"],
    ["ROBOTS · TALLER", "#ff4081"],
    ["TAXI VOLADOR", "#76ff03"],
    ["PURA VIDA 3000", "#ffea00"],
  ].forEach(([t, c], i) => {
    const g = new T.Group();
    caja(g, 0.4, 10, 0.4, 0x37474f, 0, 5, 0);
    cartel(g, t, 9, 2.4, "#0a0f1e", c, 0, 11, 0.25);
    cartel(g, t, 9, 2.4, "#0a0f1e", c, 0, 11, -0.25, Math.PI);
    poner(FUT, g, lado(i) * 16, Z54 - 150 - i * 190, lado(i) > 0 ? DER : IZQ);
  });
  // riel del tren flotante a la derecha
  caja(FUT, 2, 0.8, Z54 - 30 - FIN, 0xb0bec5, 22, 9, (Z54 - 30 + FIN) / 2, {
    metalness: 0.6,
    roughness: 0.3,
  });
  for (let z = Z54 - 40; z > FIN; z -= 40) cilindro(FUT, 0.6, 9, 0x90a4ae, 22, 4.5, z);
  terminar(FUT);
  // el tren y los carros voladores
  const tren = new T.Group();
  for (let k = 0; k < 4; k++) {
    caja(tren, 3, 2.6, 12, 0xeceff1, 0, 0, k * 12.6, { metalness: 0.5, roughness: 0.2 });
    caja(tren, 3.05, 0.6, 10, 0x18ffff, 0, 0.3, k * 12.6, neon(0x18ffff));
  }
  poner(animados, tren, 22, Z54 - 200, 0, 11);
  const voladores = [];
  for (let i = 0; i < 14; i++) {
    const g = new T.Group(),
      c = NEON[i % NEON.length];
    caja(g, 2.2, 1, 4.2, i % 2 ? 0xeceff1 : 0x263238, 0, 0, 0, { metalness: 0.5, roughness: 0.3 });
    caja(g, 1.8, 0.6, 2, 0x80deea, 0, 0.7, -0.3, VIDRIO);
    caja(g, 2.3, 0.15, 4.3, c, 0, -0.55, 0, neon(c));
    poner(animados, g, lado(i) * R(6, 40), Z54 - R(0, 860), 0, R(14, 40));
    voladores.push({ g, v: lado(i + 1) * R(18, 34) });
  }
  animados.traverse((o) => o.isMesh && (o.castShadow = false));

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const juega = state == "play" && !MONT.on;
    // ----- volcán -----
    const enVolcan = enZona(51, 100) && !MONT.on;
    ceniza.visible = enVolcan;
    if (enVolcan) {
      ceniza.position.set(cam.position.x, 0, cam.position.z);
      const p = ceniza.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 3;
        if (y < 0) y += 40;
        p.setY(i, y);
      }
      p.needsUpdate = true;
      humosVolcan.forEach((h) => {
        h.t = (h.t + dt * 0.08) % 1;
        h.sp.position.set(h.x + h.t * 30, h.y0 + h.t * 140, h.z);
        h.sp.scale.setScalar(50 + h.t * 160);
        h.sp.material.opacity = 0.75 * (1 - h.t);
      });
    }
    if (juega && enVolcan && enZona(51, -30)) {
      // piedras de fuego
      bombaT -= dt;
      if (bombaT <= 0) {
        bombaT = R(2.5, 5);
        const b = bombas.find((q) => q.t < 0);
        if (b) {
          const x1 = Math.random() < 0.4 ? B.x + R(-3, 3) : R(-12, 12),
            z1 = B.z - Math.max(25, B.v * 2.5) - R(0, 80);
          Object.assign(b, {
            t: 0,
            x0: x1 + (Math.random() < 0.5 ? -1 : 1) * 120,
            y0: 140,
            z0: z1 - 60,
            x1,
            z1,
          });
          b.g.visible = b.aviso.visible = true;
          b.aviso.position.set(x1, 0.08, z1);
        }
      }
      // lava: no te metás
      if (B.y < 1 && Math.abs(Math.abs(B.x) - 20) < 3) {
        dmg += 18 * dt * PV.dm;
        B.x -= Math.sign(B.x) * 8 * dt;
        if (lavaAviso <= 0) {
          lavaAviso = 2;
          msg("🌋🔥 ¡Te metiste en la lava! ¡Salí rápido!", 2000);
        }
        if (dmg >= 100) ((dmg = 100), end());
      }
      lavaAviso -= dt;
    }
    bombas.forEach((b) => {
      if (b.t < 0) return;
      if (state == "play") b.t += dt;
      const f = Math.min(1, b.t / b.dur);
      b.g.position.set(b.x0 + (b.x1 - b.x0) * f, b.y0 * (1 - f * f), b.z0 + (b.z1 - b.z0) * f);
      b.g.rotation.x += dt * 4;
      b.aviso.material.opacity = 0.35 + 0.3 * Math.sin(b.t * 14);
      if (f >= 1) {
        b.t = -1;
        b.g.visible = b.aviso.visible = false;
        const e = explosiones.find((q) => q.t <= 0) || explosiones[0];
        e.t = 1;
        e.sp.position.set(b.x1, 3, b.z1);
        for (const car of cars)
          if (!car.vy && Math.hypot(car.x - b.x1, car.z - b.z1) < 9) {
            car.vy = R(10, 16);
            car.vx = Math.sign(car.x - b.x1 || 1) * R(4, 9);
            car.hit = 1;
          }
        if (juega && Math.hypot(B.x - b.x1, B.z - b.z1) < 7 && B.y < 4)
          golpe(14, "🌋💥 ¡Te cayó una PIEDRA DE FUEGO del volcán!");
        if (Math.abs(B.z - b.z1) < 60) shake = Math.max(shake, 0.5);
      }
    });
    explosiones.forEach((e) => {
      if (e.t <= 0) return;
      e.t -= dt * 1.4;
      e.sp.scale.setScalar(6 + (1 - e.t) * 18);
      e.sp.material.opacity = Math.max(0, e.t);
    });
    // ----- playa: olas y botes -----
    if (enZona(52)) {
      olas.position.x = Math.sin(reloj * 0.8) * 4;
      olas.children.forEach((o, i) => (o.material.opacity = 0.55 + 0.3 * Math.sin(reloj * 0.8 + i)));
      botes.forEach((g, i) => {
        g.position.y = Math.sin(reloj * 1.3 + i) * 0.35;
        g.rotation.z = Math.sin(reloj * 1.1 + i * 2) * 0.08;
      });
    }
    // ----- dulces: las nubes de algodón flotan -----
    if (enZona(53)) nubes.forEach((g, i) => (g.position.y += Math.sin(reloj * 0.5 + i) * dt * 0.8));
    // ----- futuro: tren y carros voladores -----
    if (enZona(54)) {
      tren.position.z += 45 * dt;
      if (tren.position.z > Z54) tren.position.z = FIN + 60;
      voladores.forEach((c) => {
        c.g.position.z += c.v * dt;
        if (c.g.position.z > Z54) c.g.position.z = FIN + 20;
        if (c.g.position.z < FIN + 20) c.g.position.z = Z54;
        c.g.rotation.y = c.v > 0 ? Math.PI : 0;
        c.g.position.y += Math.sin(reloj * 2 + c.v) * dt * 0.6;
      });
    }
  };
})();
