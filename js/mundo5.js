// =====================================================================
// MÁS MUNDO (zonas 43 a 48 y la Motonieve Ultra 4x4). Se carga después de js/mundo4.js.
// Busca estos títulos con Ctrl+F:
//   ZONA 43 · MONTAÑAS NEVADAS   · nieve que cae, pinos nevados, lago congelado, telesilla y muñecos de nieve
//   MOTONIEVE ULTRA 4X4          · el vehículo nuevo (31): cuatro orugas, no se atasca en la nieve
//   ZONA 44 · MUNDO DE BLOQUES   · todo hecho de cubos: cerros, árboles, casitas, animales y nubes
//   ZONA 45 · CIUDAD DE JUGUETE  · edificios de bloques de colores con botones encima y muñequitos
//   ZONA 46 · PISTA DE KARTS     · bordillos, llantas, flechas turbo, graderías y meta con premio
//   ZONA 47 · DESIERTO           · dunas, mesetas rojas, cactus, oasis, camellos y plantas rodadoras
//   ZONA 48 · SUPERTORMENTA      · la más difícil: lluvia fuerte, viento, rayos, tornado con carros volando e incendios
//   CUADRO A CUADRO              · nieve, turbo, cronómetro, rodadoras, viento, rayos, tornado y fuego
// El clima de cada zona (color del suelo, neblina, oscuridad y lluvia) está en CLIMA.
// =====================================================================
(function () {
  const {
    caja, cilindro, piso, cartel, cartelDibujo, fachada, fusionar, deModelo, compartir, mat, bandera,
    ZONAS_LOTE, VIDRIO, LUZ, DER, IZQ, faros, llamaTex, humoTex,
  } = MUNDO;

  ZN.push(
    "Montañas nevadas",
    "Mundo de Bloques",
    "Ciudad de Juguete",
    "Pista de Karts",
    "Desierto",
    "⛈ Supertormenta (¡la más difícil!)",
  );
  Object.assign(CLIMA, {
    43: { suelo: 0xeef3f7, niebla: [50, 420] },
    44: { suelo: 0x6abe30, niebla: [80, 560] },
    45: { suelo: 0x58b947 },
    46: { suelo: 0x4caf50 },
    47: { suelo: 0xe0c084, niebla: [70, 480] },
    48: { suelo: 0x55704a, niebla: [22, 240], oscuro: 0.72, lluvia: 1 },
  });
  // sin árboles ni casas del juego en estas zonas (cada una trae lo suyo)
  EXR.push([-43000, -49000]);
  EXRL.push([-43000, -49000]);

  const G = new T.Group();
  W(G);
  const animados = new T.Group();
  W(animados);
  const Z = (g, x, z, ry = 0, padre = G) => {
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    padre.add(g);
    return g;
  };
  const texto = (x, t, cx, cy, fs, color) => {
    x.fillStyle = color;
    x.font = "bold " + fs + "px system-ui,Arial";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(t, cx, cy);
  };
  const portico = (z, t, fondo = "#0a6e3a", letra = "#ffffff") => {
    const g = new T.Group();
    [-9, 9].forEach((x) => caja(g, 0.6, 7.4, 0.6, 0x8a8f94, x, 3.7, 0));
    caja(g, 18.6, 0.7, 0.7, 0x8a8f94, 0, 7.4, 0);
    cartel(g, t, 17.4, 2.2, fondo, letra, 0, 8.9, 0.4);
    cartel(g, t, 17.4, 2.2, fondo, letra, 0, 8.9, -0.4, Math.PI);
    return Z(g, 0, z);
  };
  const letrero = (x, z, t, fondo = "#f9a825", letra = "#111111", ancho = 4.6) => {
    const s = new T.Group();
    caja(s, 0.2, 3, 0.2, 0x777777, 0, 1.5, 0);
    cartel(s, t, ancho, 1.2, fondo, letra, 0, 3.4, 0.12);
    cartel(s, t, ancho, 1.2, fondo, letra, 0, 3.4, -0.12, Math.PI);
    return Z(s, x, z);
  };
  const persona = (g, x, z, ropa, cabeza = 0xd7a27a) => {
    caja(g, 0.5, 0.8, 0.32, 0x263238, x, 0.4, z);
    caja(g, 0.56, 0.75, 0.36, ropa, x, 1.18, z);
    const h = new T.Mesh(compartir(new T.SphereGeometry(0.2, 10, 8)), mat(cabeza));
    h.position.set(x, 1.78, z);
    g.add(h);
  };
  const esfera = (g, r, c, x, y, z, o) => {
    const m = new T.Mesh(compartir(new T.SphereGeometry(1, 14, 10)), mat(c, o));
    m.scale.setScalar(r);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const cono = (g, r, h, c, x, y, z, lados = 10, o) => {
    const m = new T.Mesh(compartir(new T.ConeGeometry(1, 1, lados)), mat(c, o));
    m.scale.set(r, h, r);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  // suelo de una zona: dos planos a los lados de la carretera (no tapan el asfalto)
  const suelo = (zona, matSuelo) => {
    [-1, 1].forEach((q) => {
      const m = new T.Mesh(new T.PlaneGeometry(1500, 1000), matSuelo);
      m.rotation.x = -Math.PI / 2;
      m.position.set(q * (7.5 + 750), 0.025, -zona * 1000 - 500);
      m.receiveShadow = true;
      G.add(m);
    });
  };
  const matPlano = (c, tex) =>
    compartir(new T.MeshStandardMaterial({ color: c, map: tex || null, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  const aguaMat = compartir(
    new T.MeshStandardMaterial({ color: 0x2a7fc0, roughness: 0.1, metalness: 0.3, normalMap: wNrm, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  );
  const agua = (w, d, x, z, y = 0.06, m = aguaMat) => {
    const a = new T.Mesh(new T.PlaneGeometry(w, d), m);
    a.rotation.x = -Math.PI / 2;
    a.position.set(x, y, z);
    G.add(a);
    return a;
  };
  // partículas que caen alrededor del jugador (nieve o lluvia)
  const caida = (n, color, tam) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([R(-60, 60), R(0, 40), R(-60, 60)], i * 3);
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    const p = new T.Points(geo, new T.PointsMaterial({ color, size: tam, map: gTex, transparent: true, opacity: 0.95, depthWrite: false }));
    p.frustumCulled = false;
    p.visible = false;
    sc.add(p);
    return p;
  };

  // ===================== ZONA 43 · MONTAÑAS NEVADAS =====================
  // Mucha nieve. Fuera de la carretera la nieve frena a todos, menos a las motos de nieve.
  {
    portico(-43030, "MONTAÑAS NEVADAS · CUIDADO HIELO", "#0d47a1");
    suelo(43, matPlano(0xf7fafc));
    // bancos de nieve a la orilla
    for (let z = -43010; z > -44000; z -= 5)
      [-1, 1].forEach((q) => {
        const b = new T.Mesh(compartir(new T.IcosahedronGeometry(1, 1)), mat(0xffffff, { roughness: 0.9 })),
          r = R(1.1, 1.8);
        b.scale.set(r, r * 0.5, r * 1.6);
        b.position.set(q * R(9, 10.5), 0.1, z);
        G.add(b);
      });
    // montañas grandes y nevadas
    [-1, 1].forEach((q) => {
      for (let i = 0; i < 16; i++) {
        const r = R(90, 170),
          h = R(160, 320),
          x = q * R(180, 520),
          z = -43000 - i * 65 + R(-30, 30);
        cono(G, r, h, pk_([0x8e9eab, 0x9fb0bd, 0x7d8d99]), x, -1, z, 9, { flatShading: true });
        cono(G, r * 0.55, h * 0.55, 0xffffff, x, h * 0.45 - 1, z, 9, { flatShading: true });
      }
    });
    // pinos nevados
    for (let i = 0; i < 260; i++) {
      const q = i % 2 ? 1 : -1,
        x = q * R(13, 160),
        z = -43000 - R(10, 990),
        s = R(0.8, 2);
      if (Math.abs(x + 70) < 40 && z < -43350 && z > -43650) continue; // el lago
      cilindro(G, 0.3 * s, 2 * s, 0x5d4037, x, s, z);
      for (let k = 0; k < 3; k++) {
        cono(G, (2.4 - k * 0.6) * s, 2.4 * s, 0x1b5e20, x, (1.6 + k * 1.5) * s, z, 8);
        cono(G, (1.6 - k * 0.4) * s, 0.9 * s, 0xffffff, x, (2.9 + k * 1.5) * s, z, 8);
      }
    }
    // lago congelado con patinadores
    agua(80, 300, -70, -43500, 0.05, compartir(new T.MeshStandardMaterial({ color: 0xbfe6f5, roughness: 0.05, metalness: 0.4, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })));
    for (let i = 0; i < 12; i++) persona(G, -70 + R(-30, 30), -43500 + R(-130, 130), pk_([0xe53935, 0x1e88e5, 0x8e24aa, 0xfdd835]));
    letrero(-12, -43420, "LAGO CONGELADO ⛸", "#0d47a1", "#ffffff");
    // telesilla: torres, cable y sillas
    for (let i = 0; i < 9; i++) {
      const z = -43150 - i * 90;
      caja(G, 0.8, 18, 0.8, 0x607d8b, 60, 9, z);
      caja(G, 5, 0.4, 0.4, 0x607d8b, 60, 18, z);
    }
    [-2, 2].forEach((d) => caja(G, 0.08, 0.08, 720, 0x222222, 60 + d, 17.6, -43510));
    for (let i = 0; i < 24; i++) {
      const z = -43170 - i * 30,
        d = i % 2 ? 2 : -2;
      caja(G, 0.06, 2.4, 0.06, 0x222222, 60 + d, 16.3, z);
      caja(G, 1.6, 0.2, 0.8, 0x1565c0, 60 + d, 15.1, z);
      persona(G, 60 + d, z, 0xff7043);
      G.children[G.children.length - 1].position.y += 14.1;
      G.children[G.children.length - 2].position.y += 14.1;
      G.children[G.children.length - 3].position.y += 14.1;
    }
    // cabañas con techo nevado y muñecos de nieve
    for (let i = 0; i < 8; i++) {
      const g = new T.Group(),
        q = i % 2 ? 1 : -1;
      caja(g, 9, 4.5, 8, 0x795548, 0, 2.25, 0);
      [-1, 1].forEach((s) => {
        const t = caja(g, 10, 0.5, 5.4, 0xffffff, 0, 5.6, s * 2.1);
        t.rotation.x = s * 0.6;
      });
      caja(g, 1.4, 2.4, 0.1, 0x3e2723, 0, 1.2, 4.05);
      [-2.8, 2.8].forEach((x) => caja(g, 1.4, 1.2, 0.1, 0xffe082, x, 2.6, 4.05, LUZ(0x664400)));
      cilindro(g, 0.5, 3, 0x6d4c41, 3, 6, -1.5);
      Z(g, q * R(24, 40), -43100 - i * 110, q > 0 ? DER : IZQ);
    }
    for (let i = 0; i < 14; i++) {
      const g = new T.Group();
      esfera(g, 0.9, 0xffffff, 0, 0.8, 0);
      esfera(g, 0.65, 0xffffff, 0, 2, 0);
      esfera(g, 0.45, 0xffffff, 0, 2.9, 0);
      const n = cono(g, 0.08, 0.5, 0xff6d00, 0, 2.9, -0.45);
      n.rotation.x = -Math.PI / 2;
      caja(g, 0.6, 0.5, 0.6, 0x111111, 0, 3.4, 0);
      Z(g, (i % 2 ? 1 : -1) * R(12, 22), -43060 - i * 68, R(-0.5, 0.5) + Math.PI);
    }
    letrero(9.6, -43080, "⚠ CADENAS OBLIGATORIAS", "#0d47a1", "#ffffff", 5);
    letrero(-9.6, -43600, "❄ ZONA DE NIEVE · DESPACIO", "#0d47a1", "#ffffff", 5);
  }
  const nieve = caida(1500, 0xffffff, 0.6);

  // ===================== MOTONIEVE ULTRA 4X4 (vehículo 31) =====================
  // Cuatro orugas (una en cada esquina), jaula, barra de luces y escape doble. En la nieve no se atasca.
  mkV(31, (g, w) => {
    const c = 0xff6d00,
      n = 0x1a1a1a,
      cromo = { metalness: 0.9, roughness: 0.2 };
    g.add(
      mm(2.2, 0.7, 3.6, n, 0, 0.95, 0), // chasis
      mm(2.3, 0.6, 1.6, c, 0, 1.45, -1.1), // capó
      mm(1.9, 0.5, 0.6, c, 0, 1.65, -1.95), // trompa
      mm(1.6, 0.5, 0.06, 0x9fc4e8, 0, 2.05, -0.35, { transparent: true, opacity: 0.6 }), // parabrisas
      mm(0.9, 0.35, 1.5, 0x111111, 0, 1.55, 0.7), // asiento
      mm(1.4, 0.08, 0.08, 0x222222, 0, 1.95, -0.4), // manubrio
      mm(0.56, 0.75, 0.4, 0x0d47a1, 0, 2.1, 0.55), // piloto
      mm(0.46, 0.46, 0.46, c, 0, 2.75, 0.5), // casco
      mm(0.36, 0.16, 0.05, 0x111111, 0, 2.78, 0.26),
      mm(2.4, 0.2, 0.25, 0x222222, 0, 1.45, -2.25), // defensa
    );
    // jaula y barra de luces
    [-0.95, 0.95].forEach((x) => {
      g.add(mm(0.1, 1.5, 0.1, 0x333333, x, 2.1, -0.2), mm(0.1, 1.5, 0.1, 0x333333, x, 2.1, 1.4), mm(0.1, 0.1, 1.7, 0x333333, x, 2.85, 0.6));
      g.add(mm(0.18, 0.18, 1, 0xdddddd, x * 0.5, 1.1, 1.9, cromo)); // escapes
    });
    g.add(mm(2, 0.1, 0.1, 0x333333, 0, 2.85, -0.2), mm(2, 0.1, 0.1, 0x333333, 0, 2.85, 1.4));
    g.add(mm(1.7, 0.22, 0.22, 0xfff6c0, 0, 3, -0.2, { emissive: 0xfff2a0, emissiveIntensity: 1.5 }));
    g.add(lt(-0.7, 1.55, -2.22), lt(0.7, 1.55, -2.22));
    // cuatro orugas
    for (const [x, z] of [[-1.25, -1.3], [1.25, -1.3], [-1.25, 1.3], [1.25, 1.3]]) {
      g.add(mm(0.6, 0.85, 1.6, 0x212121, x, 0.45, z));
      for (let k = -3; k <= 3; k++) g.add(mm(0.64, 0.08, 0.12, 0x424242, x, 0.88, z + k * 0.22));
      g.add(mm(0.66, 0.3, 1.3, c, x, 0.98, z)); // guardafango
      wh(g, 0.32, 0.62, x, 0.42, z, 0x151515, 0x777777, w);
    }
  });
  PVS.push(
    Object.assign({}, PVS[17], {
      acc: 16, max: 52, off: 50, od: 0.05, br: 24, turn: 1.2, hl: 2.2, hw: 1.3, cd: 8.5, ch: 3.6, dm: 0.6, rl: 2.5,
      s: [0, 2.6, 0.3], hz: -2.3, ez: 1.8, i: 1100, r: 7000, c: 3, nieve: 1,
    }),
  );
  VN.push("Motonieve Ultra 4x4");
  VI.push("🏂");
  TUN.push({});
  const esDeNieve = () => PV.nieve || skin == 8 || skin == 20;

  // ===================== ZONA 44 · MUNDO DE BLOQUES =====================
  // Todo cuadrado: el suelo es una cuadrícula y los cerros, árboles, casas, animales y nubes son cubos.
  {
    const texCubos = cv(64, 64, (x, w, h) => {
      x.fillStyle = "#5fae3a";
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#6cc043";
      x.fillRect(4, 4, w / 2 - 6, h / 2 - 6);
      x.fillRect(w / 2 + 2, h / 2 + 2, w / 2 - 6, h / 2 - 6);
      x.strokeStyle = "#4a8f2c";
      x.lineWidth = 3;
      x.strokeRect(0, 0, w, h);
    });
    texCubos.wrapS = texCubos.wrapT = T.RepeatWrapping;
    texCubos.repeat.set(1500 / 4, 1000 / 4);
    compartir(texCubos);
    portico(-44030, "▦ MUNDO DE BLOQUES ▦", "#2e7d32");
    suelo(44, matPlano(0xffffff, texCubos));
    // cerros escalonados (cada piso: tierra con una capa de zacate)
    const cerroCubos = (x, z, base, pisos) => {
      for (let i = 0; i < pisos; i++) {
        const w = base - i * 8;
        if (w <= 0) break;
        caja(G, w, 3.4, w, 0x8b5a2b, x, 1.7 + i * 4, z);
        caja(G, w + 0.02, 0.6, w + 0.02, 0x5fae3a, x, 3.7 + i * 4, z);
      }
    };
    [-1, 1].forEach((q) => {
      for (let i = 0; i < 9; i++) cerroCubos(q * R(60, 220), -44060 - i * 110, R(30, 70), (R(3, 8) | 0));
    });
    // árboles de cubos
    const arbol = (x, z) => {
      const h = 4 + ((Math.random() * 3) | 0);
      caja(G, 1, h, 1, 0x6d4c2b, x, h / 2, z);
      caja(G, 5, 3, 5, 0x2e8b2e, x, h + 1, z);
      caja(G, 3, 2, 3, 0x2e8b2e, x, h + 3.5, z);
    };
    for (let i = 0; i < 120; i++) arbol((i % 2 ? 1 : -1) * R(12, 55), -44010 - R(0, 980));
    // casitas de tablas
    for (let i = 0; i < 8; i++) {
      const g = new T.Group();
      caja(g, 8, 5, 8, 0xb07a45, 0, 2.5, 0);
      for (let k = 0; k < 4; k++) caja(g, 9 - k * 2, 1, 9 - k * 2, 0x7a4f2a, 0, 5.5 + k, 0);
      caja(g, 1.6, 3, 0.2, 0x5a3a1a, 0, 1.5, 4.05);
      [-2.6, 2.6].forEach((x) => caja(g, 1.4, 1.4, 0.2, 0x9fd8f5, x, 3, 4.05));
      Z(g, (i % 2 ? 1 : -1) * R(18, 30), -44080 - i * 115, i % 2 ? DER : IZQ);
    }
    // animales cuadrados (ovejas y chanchitos)
    for (let i = 0; i < 26; i++) {
      const g = new T.Group(),
        oveja = i % 2;
      caja(g, 1.2, 1, 1.8, oveja ? 0xf2f2f2 : 0xf4a6b6, 0, 1.1, 0);
      caja(g, 0.8, 0.8, 0.8, oveja ? 0x9e9e9e : 0xf4a6b6, 0, 1.5, -1.1);
      for (const [a, b] of [[-0.4, -0.6], [0.4, -0.6], [-0.4, 0.6], [0.4, 0.6]]) caja(g, 0.3, 0.6, 0.3, oveja ? 0x9e9e9e : 0xe08aa0, a, 0.3, b);
      Z(g, (i % 2 ? 1 : -1) * R(12, 60), -44030 - R(0, 950), R(0, 6));
    }
    // lago cuadrado con cascada que sale de un cerro
    caja(G, 40, 0.3, 40, 0x3f76e4, -80, 0.05, -44500);
    caja(G, 20, 24, 20, 0x8b5a2b, -110, 12, -44500);
    caja(G, 20.02, 1, 20.02, 0x5fae3a, -110, 24.3, -44500);
    caja(G, 5, 24, 1, 0x5b8cf0, -98, 12, -44500, { emissive: 0x1a3a80, emissiveIntensity: 0.3 });
    // nubes cuadradas
    for (let i = 0; i < 30; i++) caja(G, R(12, 30), 4, R(8, 20), 0xffffff, R(-260, 260), R(55, 80), -44000 - R(0, 1000), { emissive: 0xffffff, emissiveIntensity: 0.25 });
    // isla flotante
    caja(G, 16, 6, 16, 0x8b5a2b, 40, 32, -44700);
    caja(G, 16.02, 1, 16.02, 0x5fae3a, 40, 35.5, -44700);
    caja(G, 1, 5, 1, 0x6d4c2b, 40, 38.5, -44700);
    caja(G, 5, 3, 5, 0x2e8b2e, 40, 42, -44700);
  }

  // ===================== ZONA 45 · CIUDAD DE JUGUETE =====================
  // Edificios armados con bloques de juguete de colores (con sus botones encima) y muñequitos.
  {
    const texBase = cv(64, 64, (x, w, h) => {
      x.fillStyle = "#4caf50";
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#5cc060";
      x.beginPath();
      x.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = "#3d8f40";
      x.lineWidth = 2;
      x.stroke();
    });
    texBase.wrapS = texBase.wrapT = T.RepeatWrapping;
    texBase.repeat.set(1500 / 1.6, 1000 / 1.6);
    compartir(texBase);
    suelo(45, matPlano(0xffffff, texBase));
    const COLORES = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xffffff, 0xff7043, 0x8e24aa];
    const botones = (g, w, d, y, c) => {
      for (let x = -w / 2 + 0.8; x < w / 2; x += 1.6)
        for (let z = -d / 2 + 0.8; z < d / 2; z += 1.6) {
          const b = cilindro(g, 0.48, 0.34, c, x, y + 0.17, z);
          b.castShadow = false;
        }
    };
    const edificio = (x, z, w, d, pisos, ry) => {
      const g = new T.Group();
      let c;
      for (let i = 0; i < pisos; i++) {
        c = i % 4 == 3 ? 0xffffff : pk_(COLORES);
        caja(g, w, 1.2, d, c, 0, 0.6 + i * 1.2, 0, { roughness: 0.35 });
        if (i % 3 == 1)
          for (let k = -w / 2 + 2; k < w / 2 - 1; k += 3) caja(g, 1.6, 1, 0.1, 0x8fd3ff, k, 0.6 + i * 1.2, d / 2 + 0.03, { transparent: true, opacity: 0.7, roughness: 0.1 });
      }
      botones(g, w, d, pisos * 1.2, c);
      caja(g, 2, 2.6, 0.12, 0x8d6e63, 0, 1.3, d / 2 + 0.04);
      return Z(g, x, z, ry);
    };
    portico(-45030, "CIUDAD DE JUGUETE", "#e53935", "#fdd835");
    // arco de bloques de colores en la entrada
    for (let i = 0; i < 16; i++) {
      const a = (i / 15) * Math.PI,
        c = COLORES[i % COLORES.length];
      const b = caja(G, 3, 1.6, 3, c, Math.cos(a) * 16, Math.sin(a) * 16 + 0.8, -45080, { roughness: 0.35 });
      b.rotation.z = a;
    }
    // cuadras de edificios a los dos lados
    for (let i = 0; i < 18; i++) {
      [-1, 1].forEach((q) => {
        const w = 8 + 1.6 * ((Math.random() * 5) | 0),
          d = 8 + 1.6 * ((Math.random() * 4) | 0);
        edificio(q * (16 + w / 2 + R(0, 10)), -45140 - i * 46, w, d, 4 + ((Math.random() * 18) | 0), q > 0 ? DER : IZQ);
      });
    }
    // muñequitos de juguete (cuerpo, cabeza y sombrero)
    for (let i = 0; i < 60; i++) {
      const g = new T.Group(),
        c = pk_(COLORES);
      cilindro(g, 0.35, 1.1, c, 0, 0.55, 0);
      esfera(g, 0.32, 0xffcc80, 0, 1.45, 0);
      cilindro(g, 0.3, 0.25, pk_(COLORES), 0, 1.8, 0);
      Z(g, (i % 2 ? 1 : -1) * R(9, 14), -45100 - R(0, 880), R(0, 6));
    }
    // árboles de juguete y cercas de bloques
    for (let i = 0; i < 50; i++) {
      const x = (i % 2 ? 1 : -1) * R(10, 14),
        z = -45100 - R(0, 880);
      cilindro(G, 0.4, 2, 0x8d6e63, x, 1, z);
      esfera(G, 1.6, pk_([0x43a047, 0x66bb6a, 0x2e7d32]), x, 3.2, z, { roughness: 0.35 });
    }
    for (let z = -45100; z > -45990; z -= 3.2) [-1, 1].forEach((q) => caja(G, 0.8, 0.8, 3.1, COLORES[((-z / 3.2) | 0) % COLORES.length], q * 8.6, 0.4, z, { roughness: 0.35 }));
    // grúa de juguete y un tren de bloques
    for (let i = 0; i < 20; i++) caja(G, 2, 2, 2, i % 2 ? 0xfdd835 : 0xe53935, 70, 1 + i * 2, -45500);
    caja(G, 30, 2, 2, 0xfdd835, 58, 41, -45500);
    for (let i = 0; i < 6; i++) caja(G, 3, 2.6, 6, pk_(COLORES), -40, 1.3, -45400 - i * 6.6, { roughness: 0.35 });
  }

  // ===================== ZONA 46 · PISTA DE KARTS =====================
  // Bordillos rojos y blancos, muros de llantas, graderías, flechas TURBO en la pista y una meta:
  // el tiempo empieza en la SALIDA y si llegás rápido a la META ganás más plata.
  const KART = { salida: -46060, meta: -46940, t0: -1, hecho: -1, turbos: [], turboT: 0 };
  {
    const texCuadros = cv(128, 32, (x, w, h) => {
      for (let i = 0; i < 16; i++)
        for (let j = 0; j < 4; j++) {
          x.fillStyle = (i + j) % 2 ? "#111" : "#fff";
          x.fillRect((i * w) / 16, (j * h) / 4, w / 16 + 1, h / 4 + 1);
        }
    });
    compartir(texCuadros);
    const cuadros = (w, h, x, y, z, ry = 0, rx = 0) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), compartir(new T.MeshBasicMaterial({ map: texCuadros, side: T.DoubleSide })));
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, 0);
      G.add(m);
      return m;
    };
    [KART.salida, KART.meta].forEach((z, i) => {
      [-10, 10].forEach((x) => caja(G, 1, 9, 1, 0x222222, x, 4.5, z));
      cuadros(21, 2.4, 0, 9.4, z);
      cartel(G, i ? "🏁 META" : "SALIDA", 8, 1.4, i ? "#111111" : "#e53935", "#ffffff", 0, 7.6, z + 0.6, 0, true);
      const l = cuadros(14.8, 2, 0, 0.03, z, 0, -Math.PI / 2);
      l.material.polygonOffset = true;
      l.material.polygonOffsetFactor = -4;
    });
    // bordillos y muros de llantas
    for (let z = -46010; z > -46990; z -= 2) [-1, 1].forEach((q) => caja(G, 1, 0.2, 2, ((-z / 2) | 0) % 2 ? 0xe53935 : 0xffffff, q * 7.9, 0.1, z - 1));
    const llanta = compartir(new T.CylinderGeometry(0.72, 0.72, 0.48, 10));
    for (let z = -46020; z > -46990; z -= 1.5)
      [-1, 1].forEach((q) => {
        for (let k = 0; k < 2; k++) {
          const t = new T.Mesh(llanta, mat(k ? 0x1e88e5 : 0x111111));
          t.position.set(q * 10.5, 0.24 + k * 0.5, z);
          G.add(t);
        }
      });
    // graderías con público
    [-1, 1].forEach((q) => {
      for (const z0 of [-46150, -46600]) {
        for (let k = 0; k < 6; k++) caja(G, 3, 0.8 + k * 0.8, 120, 0xbdbdbd, q * (16 + k * 3), 0.4 + k * 0.4, z0);
        for (let k = 0; k < 6; k++) for (let j = 0; j < 30; j++) caja(G, 0.6, 1, 0.6, pk_([0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xffffff]), q * (16 + k * 3), 1.2 + k * 0.8, z0 - 57 + j * 4 + R(-1, 1));
        caja(G, 18, 0.5, 124, 0xe53935, q * 23.5, 6.6, z0);
      }
    });
    // arcos de globos y banderines
    for (const z of [-46300, -46500, -46760]) {
      for (let i = 0; i < 24; i++) {
        const a = (i / 23) * Math.PI;
        esfera(G, 0.9, [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047][i % 4], Math.cos(a) * 11, Math.sin(a) * 10, z, { roughness: 0.3 });
      }
    }
    for (let i = 0; i < 20; i++) bandera(G, ["Costa Rica", "México", "Brasil", "Argentina", "Japón", "Italia"][i % 6], (i % 2 ? 1 : -1) * 12.5, -46080 - i * 44, 7);
    // flechas TURBO pintadas en la pista
    const texTurbo = compartir(
      cv(64, 128, (x, w, h) => {
        x.fillStyle = "#ff9800";
        x.fillRect(0, 0, w, h);
        x.fillStyle = "#fff176";
        for (let k = 0; k < 3; k++) {
          x.beginPath();
          const y = 10 + k * 40;
          x.moveTo(w / 2, y);
          x.lineTo(w - 8, y + 26);
          x.lineTo(w / 2, y + 16);
          x.lineTo(8, y + 26);
          x.closePath();
          x.fill();
        }
      }),
    );
    const matTurbo = compartir(new T.MeshBasicMaterial({ map: texTurbo, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
    for (const [x, z] of [[5.2, -46200], [1.8, -46330], [-1.8, -46450], [5.2, -46560], [1.8, -46690], [5.2, -46820], [-5.2, -46260], [-1.8, -46620]]) {
      const p = new T.Mesh(new T.PlaneGeometry(2.6, 5.2), matTurbo);
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.04, z);
      G.add(p);
      KART.turbos.push([x, z]);
    }
    letrero(-12, -46100, "⚡ PASÁ POR LAS FLECHAS: TURBO", "#ff9800", "#111111", 6);
  }
  // karts en el tráfico de la pista
  const kart = () => {
    const c = pk_([0xe53935, 0x1e88e5, 0x43a047, 0xfdd835, 0x8e24aa, 0xff7043]);
    return deModelo("kart" + c, () => {
      const g = new T.Group();
      caja(g, 1.4, 0.35, 2.2, c, 0, 0.4, 0);
      caja(g, 1.1, 0.3, 0.6, c, 0, 0.55, -1.1);
      caja(g, 1.5, 0.1, 0.4, 0x222222, 0, 0.75, 1.15);
      caja(g, 0.5, 0.6, 0.4, 0x263238, 0, 0.9, 0.3);
      const h = new T.Mesh(compartir(new T.SphereGeometry(0.28, 10, 8)), mat(c));
      h.position.set(0, 1.4, 0.3);
      g.add(h);
      wr(g, [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.8], [0.75, 0.8]], 0.25);
      g.userData.hl = 1.2;
      return sh(g);
    });
  };

  // ===================== ZONA 47 · DESIERTO =====================
  const rodadoras = [];
  {
    portico(-47030, "DESIERTO · ÚLTIMA GASOLINERA 200 km", "#bf360c");
    suelo(47, matPlano(0xdcc08a));
    // dunas
    for (let i = 0; i < 40; i++) {
      const q = i % 2 ? 1 : -1;
      const d = esfera(G, 1, 0xd9b77a, q * R(30, 320), -R(2, 6), -47000 - R(0, 1000), { flatShading: true });
      d.scale.set(R(30, 70), R(10, 22), R(20, 50));
    }
    // mesetas de roca roja con franjas
    for (let i = 0; i < 10; i++) {
      const q = i % 2 ? 1 : -1,
        x = q * R(140, 420),
        z = -47000 - R(0, 1000),
        r = R(30, 60),
        h = R(40, 90);
      for (let k = 0; k < 4; k++) {
        const m = new T.Mesh(compartir(new T.CylinderGeometry(1, 1.08, 1, 10)), mat(k % 2 ? 0xb5502a : 0xc8683a, { flatShading: true }));
        m.scale.set(r, h / 4, r * 0.8);
        m.position.set(x, (h / 4) * (k + 0.5), z);
        G.add(m);
      }
    }
    // cactus
    for (let i = 0; i < 70; i++) {
      const g = new T.Group(),
        h = R(2.5, 6);
      cilindro(g, 0.4, h, 0x558b2f, 0, h / 2, 0);
      cilindro(g, 0.28, 1.6, 0x558b2f, 0.9, h * 0.62, 0);
      cilindro(g, 0.28, 1.3, 0x558b2f, -0.9, h * 0.5, 0);
      caja(g, 1.6, 0.35, 0.35, 0x558b2f, 0, h * 0.42, 0);
      Z(g, (i % 2 ? 1 : -1) * R(11, 80), -47010 - R(0, 980), R(0, 6));
    }
    // oasis con palmeras, agua y camellos
    agua(46, 34, -60, -47500);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2,
        x = -60 + Math.cos(a) * 27,
        z = -47500 + Math.sin(a) * 21;
      cilindro(G, 0.3, 8, 0x8d6e63, x, 4, z);
      for (let k = 0; k < 6; k++) {
        const b = (k * Math.PI) / 3,
          h = caja(G, 0.5, 0.1, 3.6, 0x2e7d32, x + Math.cos(b) * 1.5, 8, z + Math.sin(b) * 1.5);
        h.rotation.y = -b + Math.PI / 2;
        h.rotation.x = 0.35;
      }
    }
    for (let i = 0; i < 6; i++) {
      const g = new T.Group();
      caja(g, 1, 1.2, 2.6, 0xc8a165, 0, 2.2, 0);
      esfera(g, 0.6, 0xc8a165, 0, 3, 0.3);
      caja(g, 0.5, 1.4, 0.5, 0xc8a165, 0, 3, -1.3);
      caja(g, 0.5, 0.5, 0.9, 0xc8a165, 0, 3.7, -1.6);
      for (const [a, b] of [[-0.35, -0.9], [0.35, -0.9], [-0.35, 0.9], [0.35, 0.9]]) caja(g, 0.25, 1.6, 0.25, 0xb08a55, a, 0.8, b);
      Z(g, -30 - i * 8, -47440 - i * 18, R(0, 6));
    }
    // gasolinera abandonada, carro oxidado y paneles solares
    const gas = new T.Group();
    caja(gas, 12, 4, 8, 0xd7ccc8, 0, 2, 0);
    caja(gas, 14, 0.5, 12, 0x8d6e63, 0, 5.5, 6);
    [-5, 5].forEach((x) => caja(gas, 0.4, 5.5, 0.4, 0x8d6e63, x, 2.75, 10));
    cartel(gas, "ÚLTIMA GASOLINERA", 10, 1, "#bf360c", "#ffffff", 0, 3.4, 4.05);
    Z(gas, 22, -47200, DER);
    caja(G, 2, 1.2, 4.4, 0x8d4b2a, -14, 0.6, -47300, { roughness: 1 });
    caja(G, 1.8, 0.8, 2, 0x6d3b20, -14, 1.6, -47300, { roughness: 1 });
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 5; j++) {
        const p = caja(G, 6, 0.2, 3.4, 0x1a237e, 40 + j * 8, 1.6, -47700 - i * 8, { metalness: 0.6, roughness: 0.2 });
        p.rotation.x = -0.5;
        caja(G, 0.2, 1.4, 0.2, 0x9e9e9e, 40 + j * 8, 0.7, -47700 - i * 8);
      }
    letrero(9.6, -47150, "⚠ NO HAY AGUA EN 100 km", "#bf360c", "#ffffff", 5);
    // plantas rodadoras (se animan)
    for (let i = 0; i < 7; i++) {
      const m = new T.Mesh(compartir(new T.IcosahedronGeometry(0.9, 1)), mat(0x9c7a45, { wireframe: true }));
      animados.add(m);
      rodadoras.push({ m, z: -47100 - i * 130, f: i * 3.1, v: R(5, 9) });
    }
  }

  // ===================== ZONA 48 · SUPERTORMENTA =====================
  // La zona más difícil. Lluvia fuerte y oscuridad (CLIMA), ráfagas de viento que te empujan,
  // rayos que caen cerca (y a veces encima), un tornado que levanta carros y casas en llamas.
  // Si salís entero al final: +₡25 000.
  const TORM = { z0: -48000, z1: -49000, dentro: -1, premio: -1, rayoT: 2, flash: 0, rafaga: 0, tornT: 0, avisos: -1 };
  const fuegos = [],
    voladores = [],
    embudo = [];
  let rayo, sonidoTrueno;
  {
    portico(-48030, "⚠ ALERTA ROJA · SUPERTORMENTA", "#b71c1c", "#ffffff");
    // árboles doblados por el viento, troncos caídos y postes inclinados
    for (let i = 0; i < 140; i++) {
      const g = new T.Group(),
        q = i % 2 ? 1 : -1,
        h = R(5, 9);
      cilindro(g, 0.3, h, 0x4e342e, 0, h / 2, 0);
      esfera(g, R(1.8, 2.8), 0x2e4d2a, 0.5, h, 0, { flatShading: true });
      g.rotation.z = -R(0.25, 0.5);
      Z(g, q * R(12, 90), -48010 - R(0, 980), 0);
      g.rotation.z = -R(0.25, 0.5);
    }
    for (let i = 0; i < 18; i++) {
      const t = cilindro(G, 0.4, R(6, 10), 0x4e342e, (i % 2 ? 1 : -1) * R(15, 19), 0.4, -48050 - i * 52);
      t.rotation.z = Math.PI / 2;
      t.rotation.y = R(-0.5, 0.5);
    }
    for (let i = 0; i < 16; i++) {
      const p = caja(G, 0.35, 10, 0.35, 0x6d4c41, (i % 2 ? 1 : -1) * 11, 5, -48040 - i * 60);
      p.rotation.z = (i % 2 ? 1 : -1) * R(0.15, 0.4);
    }
    // charcos e inundación a la orilla
    for (let i = 0; i < 20; i++) agua(R(8, 20), R(10, 30), (i % 2 ? 1 : -1) * R(14, 40), -48020 - R(0, 960), 0.05);
    // escombros y carros chocados
    for (let i = 0; i < 40; i++) {
      const c = caja(G, R(0.5, 2), R(0.2, 0.8), R(0.5, 2), pk_([0x8d6e63, 0x9e9e9e, 0x5d4037, 0xbdbdbd]), (i % 2 ? 1 : -1) * R(8.5, 20), 0.3, -48020 - R(0, 960));
      c.rotation.set(R(0, 1), R(0, 3), R(0, 1));
    }
    for (let i = 0; i < 6; i++) {
      const c = caja(G, 2, 1.4, 4.4, pk_([0x37474f, 0x8d1c1c, 0x1565c0]), (i % 2 ? 1 : -1) * R(10, 16), 0.7, -48100 - i * 150);
      c.rotation.set(0, R(0, 3), R(0.5, Math.PI));
    }
    // casas en llamas
    for (let i = 0; i < 5; i++) {
      const g = new T.Group(),
        q = i % 2 ? 1 : -1,
        x = q * R(22, 34),
        z = -48120 - i * 180;
      caja(g, 9, 4.5, 8, 0x3e2723, 0, 2.25, 0);
      const t = caja(g, 10, 0.4, 6, 0x1a1110, 0, 5.2, 1.5);
      t.rotation.x = 0.7;
      Z(g, x, z, q > 0 ? DER : IZQ);
      for (let k = 0; k < 8; k++) {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: llamaTex, color: 0xffffff, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
        sp.userData = { x: x + R(-4, 4), y: R(2, 7), z: z + R(-3, 3), t: R(3, 6), f: R(0, 6), v: R(5, 9) };
        animados.add(sp);
        fuegos.push(sp);
      }
      const luz = new T.PointLight(0xff6a00, 2.5, 40, 2);
      luz.position.set(x, 6, z);
      animados.add(luz);
      fuegos.push(luz);
    }
    // avisos
    const av = ["⚠ VIENTOS DE 180 km/h", "⚡ PELIGRO DE RAYOS", "🌪 TORNADO", "⚠ CARRETERA INUNDADA", "🔥 INCENDIOS", "⚠ NO SE DETENGA"];
    for (let i = 0; i < 10; i++) letrero(i % 2 ? -9.8 : 9.6, -48080 - i * 92, av[i % av.length], "#b71c1c", "#ffffff", 5);
    // el rayo: un zigzag que se mueve a donde cae
    rayo = new T.Group();
    let x = 0,
      y = 120;
    while (y > 0) {
      const nx = x + R(-5, 5),
        ny = y - R(8, 16),
        l = Math.hypot(nx - x, ny - y),
        s = new T.Mesh(new T.BoxGeometry(0.5, l, 0.5), new T.MeshBasicMaterial({ color: 0xe8f4ff }));
      s.position.set((x + nx) / 2, (y + ny) / 2, 0);
      s.rotation.z = -Math.atan2(nx - x, y - ny);
      rayo.add(s);
      x = nx;
      y = ny;
    }
    const brillo = new T.Sprite(new T.SpriteMaterial({ map: gTex, color: 0xbfe0ff, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    brillo.scale.setScalar(30);
    brillo.position.y = 2;
    rayo.add(brillo);
    rayo.visible = false;
    animados.add(rayo);
    // el tornado: embudo de humo que gira y carros volando alrededor
    for (let i = 0; i < 26; i++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0x3a3d42, depthWrite: false, transparent: true, opacity: 0.85 }));
      sp.userData.k = i / 26;
      animados.add(sp);
      embudo.push(sp);
    }
    const autos = [() => mkCar(), () => mkCar(), () => mkCar(), () => kart(), () => mkCar(), () => mkCar()];
    autos.forEach((f, i) => {
      const o = f();
      animados.add(o);
      voladores.push({ o, f: i * 1.05, r: R(8, 16) });
    });
  }
  // trueno: ruido grave que se apaga
  const trueno = (fuerza) => {
    try {
      if (!AC) return;
      if (!sonidoTrueno) {
        const n = AC.sampleRate * 2.5,
          b = AC.createBuffer(1, n, AC.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.28));
        sonidoTrueno = b;
      }
      const s = AC.createBufferSource(),
        f = AC.createBiquadFilter(),
        g = AC.createGain();
      s.buffer = sonidoTrueno;
      f.type = "lowpass";
      f.frequency.value = 380;
      g.gain.value = 0.9 * fuerza;
      s.connect(f).connect(g).connect(AC.destination);
      s.start();
    } catch (e) {}
  };

  // más tráfico especial: karts en la pista
  const vehAntes = window.vehNuevo;
  window.vehNuevo = function (zz) {
    if (zz == 46 && Math.random() < 0.75) return kart();
    return vehAntes(zz);
  };

  // fundir el escenario fijo por zona
  {
    const porZona = new Map();
    for (const ch of [...G.children]) {
      const k = Math.floor(-ch.position.z / 1000);
      if (!porZona.has(k)) porZona.set(k, new T.Group());
      porZona.get(k).add(ch);
    }
    for (const g of porZona.values()) G.add(fusionar(g));
    congelar(G, new Set());
  }
  chunks.forEach(scatter);

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0;
  const _c = new T.Color();
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const t = reloj,
      play = state == "play" && !MONT.on,
      u = B.z - CZ,
      zb = MONT.on ? -1 : zoneAt(B.z);
    const caer = (p, vel, viento) => {
      const a = p.geometry.attributes.position;
      for (let k = 0; k < a.count; k++) {
        let y = a.getY(k) - dt * vel * (0.7 + (k % 5) * 0.12);
        if (y < 0) y += 40;
        a.setY(k, y);
        a.setX(k, a.getX(k) + viento * dt);
        if (a.getX(k) > 60) a.setX(k, a.getX(k) - 120);
        if (a.getX(k) < -60) a.setX(k, a.getX(k) + 120);
      }
      a.needsUpdate = true;
      p.position.set(B.x, B.y, B.z);
    };

    // ----- nieve -----
    nieve.visible = zb == 43;
    if (nieve.visible) {
      caer(nieve, 4, Math.sin(t * 0.3) * 2);
      if (play && Math.abs(B.x) > 7.4 && !esDeNieve() && !B.fl) B.v *= Math.pow(0.55, dt); // la nieve honda frena
    }

    // ----- pista de karts: turbo y cronómetro -----
    if (zb == 46 && play) {
      if (KART.turboT > 0) KART.turboT -= dt;
      for (const [x, z] of KART.turbos)
        if (KART.turboT <= 0 && Math.abs(B.x - x) < 1.6 + PV.hw * 0.5 && Math.abs(u - z) < 3 && B.v > 2) {
          KART.turboT = 0.8;
          B.v = Math.min(PV.max * 1.6, B.v + 14);
          shake = Math.max(shake, 0.3);
          msg("⚡ ¡TURBO!", 900);
        }
      if (KART.t0 < 0 && u < KART.salida && u > KART.salida - 30) {
        KART.t0 = t;
        msg("🏁 ¡Arrancó el cronómetro! Llegá rápido a la META", 2200);
      }
      if (KART.t0 >= 0 && KART.hecho != cyc && u < KART.meta) {
        KART.hecho = cyc;
        const s = t - KART.t0,
          premio = Math.max(2000, Math.round((20000 - s * 300) / 500) * 500);
        KART.t0 = -1;
        cash += premio;
        msg(`🏁 ¡META! Tiempo: ${s.toFixed(1)} s · +₡${premio.toLocaleString("es-CR")}`, 4000);
      }
    }
    if (zb != 46 && KART.t0 >= 0 && (u > KART.salida + 50 || u < KART.meta - 200)) KART.t0 = -1;

    // ----- plantas rodadoras del desierto -----
    const enDesierto = Math.abs(u + 47500) < 1300;
    rodadoras.forEach((r) => {
      r.m.visible = enDesierto;
      if (!enDesierto) return;
      const x = ((((t * r.v + r.f * 20) % 120) + 120) % 120) - 60;
      r.m.position.set(x, 0.9 + Math.abs(Math.sin(t * 4 + r.f)) * 0.8, r.z);
      r.m.rotation.z -= dt * r.v * 1.1;
    });
    if (zb == 47) sc.fog.color.lerp(_c.setRGB(0.86, 0.76, 0.6), 0.6); // neblina de arena

    // ----- supertormenta -----
    const enTorm = u < TORM.z0 + 300 && u > TORM.z1 - 300 && !MONT.on;
    let viento = 0;
    if (enTorm) {
      if (u < TORM.z0 && u > TORM.z1) TORM.dentro = cyc;
      if (play && TORM.avisos != cyc && u < TORM.z0 + 40 && u > TORM.z0 - 40) {
        TORM.avisos = cyc;
        msg("⛈ ¡SUPERTORMENTA! Viento, rayos, tornado e incendios. ¡Aguantá hasta el final!", 4500);
      }
      // viento: sopla de lado y a ratos llegan ráfagas
      TORM.rafaga -= dt;
      if (TORM.rafaga < -R(4, 8)) {
        TORM.rafaga = R(1.2, 2.2);
        if (play && zb == 48) msg("💨 ¡Ráfaga de viento!", 1200);
      }
      viento = (Math.sin(t * 0.5) * 1.6 + (TORM.rafaga > 0 ? Math.sign(Math.sin(t * 0.13)) * 5 : 0)) * (zb == 48 ? 1 : 0);
      if (play && !B.fl && zb == 48) B.x += viento * (PV.bus ? 0.7 : 1) * dt;
      // rayos
      TORM.rayoT -= dt;
      if (TORM.rayoT <= 0 && zb == 48) {
        TORM.rayoT = R(1.5, 4.5);
        const alJugador = Math.random() < 0.18,
          rx = alJugador ? B.x + R(-6, 6) : R(-70, 70),
          rz = alJugador ? B.z - R(4, 30) : B.z - R(20, 260);
        rayo.position.set(rx, 0, rz - CZ);
        rayo.rotation.y = R(0, 6);
        rayo.visible = true;
        TORM.flash = 0.22;
        trueno(alJugador ? 1 : 0.6);
        if (play && Math.hypot(B.x - rx, B.z - rz) < 7 && B.y < 6) {
          dmg += PV.crush ? 6 : 15;
          shake = 1;
          B.v *= 0.5;
          msg("⚡ ¡Te cayó un rayo!", 2200);
          if (dmg >= 100) {
            dmg = 100;
            end();
          }
        }
      }
      if (TORM.flash > 0) {
        TORM.flash -= dt;
        const k = Math.max(0, TORM.flash / 0.22);
        hemi.intensity += 2.2 * k;
        sun.intensity += 1.5 * k;
        sc.fog.color.lerp(_c.setRGB(0.85, 0.9, 1), 0.7 * k);
        if (TORM.flash <= 0.1) rayo.visible = false;
      } else rayo.visible = false;
      // tornado: va y viene cruzando la carretera
      const tx = Math.sin(t * 0.09) * 70,
        tz = -48500 + Math.sin(t * 0.035) * 350;
      embudo.forEach((sp, i) => {
        const k = sp.userData.k,
          a = t * 3 + i * 1.7,
          r = 2 + k * 18;
        sp.position.set(tx + Math.cos(a) * r * 0.5, k * 70, tz + Math.sin(a) * r * 0.5);
        sp.scale.setScalar(6 + k * 26);
      });
      voladores.forEach((v, i) => {
        const a = t * 1.6 + v.f,
          y = 8 + ((t * 4 + i * 9) % 50);
        v.o.position.set(tx + Math.cos(a) * (v.r + y * 0.2), y, tz + Math.sin(a) * (v.r + y * 0.2));
        v.o.rotation.set(t * 1.3 + i, t * 2 + i, t * 0.9);
      });
      const dT = Math.hypot(B.x - tx, B.z - (CZ + tz));
      if (play && dT < 28 && !B.fl) {
        // te jala y te levanta
        B.x += ((tx - B.x) / (dT || 1)) * 6 * dt;
        shake = Math.max(shake, 0.6);
        TORM.tornT -= dt;
        if (TORM.tornT <= 0 && dT < 16 && !B.bal) {
          TORM.tornT = 3;
          B.bal = 1;
          B.vy = 13;
          dmg += PV.crush ? 4 : 10;
          msg("🌪 ¡El tornado te levantó por los aires!", 2500);
        }
      }
      // carros del tráfico que se acercan al tornado salen volando
      for (const c of cars)
        if (!c.vy && Math.abs(c.x - tx) < 18 && Math.abs(c.z - (CZ + tz)) < 18) {
          c.vy = R(14, 22);
          c.vx = R(-8, 8);
          c.hit = 1;
        }
      // incendios
      fuegos.forEach((f) => {
        if (f.isLight) {
          f.intensity = 2 + Math.sin(t * 13 + f.position.x) * 0.8;
          return;
        }
        const d = f.userData;
        f.position.set(d.x + Math.sin(t * 1.3 + d.f) * 0.6, d.y + Math.sin(t * d.v + d.f) * 0.8, d.z);
        f.scale.setScalar(d.t * (0.85 + 0.25 * Math.sin(t * d.v + d.f)));
      });
      // premio al salir entero
      if (play && TORM.premio != cyc && TORM.dentro == cyc && u < TORM.z1 && u > TORM.z1 - 40) {
        TORM.premio = cyc;
        cash += 25000;
        msg("⛈ ¡SOBREVIVISTE A LA SUPERTORMENTA! +₡25 000", 5000);
      }
    } else rayo.visible = false;
    [...embudo, ...voladores.map((v) => v.o), ...fuegos].forEach((o) => (o.visible = enTorm));
  };
})();
