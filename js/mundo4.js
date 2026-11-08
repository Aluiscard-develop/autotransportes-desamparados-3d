// =====================================================================
// MÁS MUNDO (zonas 35 a 42 y cosas por todo el juego). Se carga después de js/mundo3.js.
// Busca estos títulos con Ctrl+F:
//   OBRAS EN CARRETERA          · construcciones a la orilla que salen al azar por todo el juego
//   ICE Y KÖLBI                 · oficinas del ICE y tiendas kölbi (salen por todo el juego)
//   CARROS NUEVOS               · SUV, deportivos, vans, camiones del ICE y de kölbi en el tráfico
//   ZONA 35 · CARRETERA DE LAS MINAS · autopista, construcción de la carretera nueva y el túnel
//   ZONA 36 · MINAS DE SARATALÁN · cañón de roca, minas, vagonetas, camiones gigantes y piedras que caen
//   ZONA 37 · FERRY             · puerto, mar y el ferry que te lleva con todo y vehículo a la isla
//   ZONA 38 · ISLA BONITA       · playas, palmeras, hoteles, faro y el puente de regreso
//   ZONA 39 · CIUDAD ESMERALDA  · rascacielos, cuadras, aceras y el edificio del ICE
//   ZONA 40 · CORDILLERA Y VALLE · cordilleras nevadas, valle con fincas y río
//   ZONA 41 · AUTOPISTAS        · tres autopistas paralelas (las de los lados también se manejan)
//   ZONA 42 · PLAYAS DE GUANACASTE · mar, surfistas, salvavidas y sodas de playa
//   CUADRO A CUADRO             · ferry, piedras de la mina, túnel, explosiones y carros de las autopistas
// =====================================================================
(function () {
  const {
    caja, cilindro, piso, cartel, cartelDibujo, fachada, fusionar, deModelo, compartir, mat, bandera,
    NEGOCIOS, ZONAS_LOTE, COLORES_EDIFICIO, VIDRIO, LUZ, DER, IZQ, faros, restaurante, humoTex, copia,
  } = MUNDO;

  ZN.push(
    "Autopista a Saratalán · Carretera de las Minas (en construcción)",
    "Túnel y Minas de Saratalán (¡peligro!)",
    "Puerto · Ferry a Isla Bonita",
    "Isla Bonita · playas",
    "Ciudad Esmeralda",
    "Cordillera y valle",
    "Autopistas del Pacífico",
    "Playas de Guanacaste",
  );
  Object.assign(ZONAS_LOTE, { 35: 0.5, 40: 0.35, 42: 0.5 });
  EXRL.push([-35000, -36100], [-36000, -39000], [-39000, -40000], [-41000, -42000]);
  EXR.push([-35540, -37000], [-37000, -39000], [-39000, -40000], [-41000, -42000], [-42000, -43000]);

  const G = new T.Group(); // escenario fijo (se funde al final, por zona)
  W(G);
  const animados = new T.Group(); // lo que se mueve
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
  const letrero = (g, x, z, t, fondo = "#f9a825", letra = "#111111", ancho = 4.6, ry = 0) => {
    const s = new T.Group();
    caja(s, 0.2, 3, 0.2, 0x777777, 0, 1.5, 0);
    cartel(s, t, ancho, 1.2, fondo, letra, 0, 3.4, 0.12);
    cartel(s, t, ancho, 1.2, fondo, letra, 0, 3.4, -0.12, Math.PI);
    return Z(s, x, z, ry, g);
  };
  const cono = (g, x, z) => {
    const m = new T.Mesh(compartir(new T.ConeGeometry(0.28, 0.8, 10)), mat(0xff6d00));
    m.position.set(x, 0.4, z);
    m.castShadow = true;
    g.add(m);
    const b = new T.Mesh(compartir(new T.CylinderGeometry(0.15, 0.19, 0.14, 10)), mat(0xffffff));
    b.position.set(x, 0.48, z);
    g.add(b);
  };
  const persona = (g, x, z, ropa = 0xff6d00, casco = 0xffd600) => {
    caja(g, 0.5, 0.8, 0.32, 0x263238, x, 0.4, z);
    caja(g, 0.56, 0.75, 0.36, ropa, x, 1.18, z);
    const h = new T.Mesh(compartir(new T.SphereGeometry(0.2, 10, 8)), mat(0xd7a27a));
    h.position.set(x, 1.78, z);
    g.add(h);
    if (casco) {
      const c = new T.Mesh(compartir(new T.SphereGeometry(0.23, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), mat(casco));
      c.position.set(x, 1.84, z);
      g.add(c);
    }
  };
  const roca = (g, x, y, z, r, c = 0x8d6e63) => {
    const m = new T.Mesh(compartir(new T.DodecahedronGeometry(1, 0)), mat(c, { flatShading: true }));
    m.position.set(x, y, z);
    m.scale.set(r, r * R(0.6, 1.1), r * R(0.8, 1.3));
    m.rotation.set(R(0, 3), R(0, 3), 0);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const cerro = (g, x, z, r, h, c, nieve) => {
    const m = new T.Mesh(compartir(new T.ConeGeometry(r, h, 14)), mat(c, { flatShading: true }));
    m.position.set(x, h / 2 - 1, z);
    g.add(m);
    if (nieve) {
      const n = new T.Mesh(compartir(new T.ConeGeometry(r * 0.32, h * 0.32, 14)), mat(0xffffff, { flatShading: true }));
      n.position.set(x, h * 0.84, z);
      g.add(n);
    }
    return m;
  };
  const marMat = compartir(
    new T.MeshStandardMaterial({ color: 0x1f7fb8, roughness: 0.12, metalness: 0.25, normalMap: wNrm, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  );
  const mar = (w, d, x, z, y = 0.12) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, d), marMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    G.add(m);
    return m;
  };
  const palmera = (g, x, z, h = R(6, 9)) => {
    const p = new T.Group(),
      incl = R(-0.2, 0.2);
    const t = cilindro(p, 0.25, h, 0x8d6e63, 0, h / 2, 0);
    t.rotation.z = incl;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        hoja = caja(p, 0.5, 0.1, 3.6, 0x2e7d32, Math.cos(a) * 1.5 - incl * h * 0.5, h, Math.sin(a) * 1.5);
      hoja.rotation.y = -a + Math.PI / 2;
      hoja.rotation.x = 0.35;
    }
    return Z(p, x, z, R(0, 6), g);
  };
  const sombrilla = (g, x, z) => {
    const s = new T.Group(),
      c = pk_([0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xff7043]);
    cilindro(s, 0.06, 2.4, 0xeeeeee, 0, 1.2, 0);
    const t = new T.Mesh(compartir(new T.ConeGeometry(1.6, 0.6, 8)), mat(c));
    t.position.y = 2.5;
    s.add(t);
    caja(s, 0.7, 0.15, 1.8, 0xffffff, 1.2, 0.3, 0.2);
    return Z(s, x, z, 0, g);
  };
  const hotel = (g, x, z, c, nombre, ry) => {
    const h = new T.Group(),
      alto = R(14, 30);
    const f = fachada(14, alto, 12, c);
    f.position.y = alto / 2;
    h.add(f);
    caja(h, 14.4, 0.8, 12.4, 0x2b2f33, 0, alto + 0.4, 0);
    cartel(h, nombre, 12, 1.5, "#ffffff", "#0277bd", 0, alto - 1.5, 6.08);
    return Z(h, x, z, ry, g);
  };

  // ===================== ICE Y KÖLBI =====================
  const logoICE = (x, w, h) => {
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, w, h);
    x.fillStyle = "#0057a8";
    x.fillRect(0, h * 0.82, w, h * 0.18);
    texto(x, "ICE", w * 0.3, h * 0.42, h * 0.62, "#0057a8");
    // rayo
    x.fillStyle = "#f7a600";
    x.beginPath();
    const cx = w * 0.62,
      s = h * 0.32;
    x.moveTo(cx, h * 0.1);
    x.lineTo(cx - s * 0.6, h * 0.48);
    x.lineTo(cx - s * 0.05, h * 0.48);
    x.lineTo(cx - s * 0.35, h * 0.78);
    x.lineTo(cx + s * 0.55, h * 0.35);
    x.lineTo(cx + s * 0.02, h * 0.35);
    x.closePath();
    x.fill();
    texto(x, "Grupo ICE", w * 0.84, h * 0.45, h * 0.15, "#0057a8");
  };
  const logoKolbi = (x, w, h) => {
    x.fillStyle = "#7ab51d";
    x.fillRect(0, 0, w, h);
    texto(x, "kölbi", w / 2, h * 0.52, h * 0.62, "#ffffff");
  };
  const antena = (g, x, z, alto = 28) => {
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = caja(g, 0.18, alto, 0.18, 0xb0b0b0, x + a * 0.8, alto / 2, z + b * 0.8);
      p.rotation.z = -a * 0.012;
    }
    for (let y = 3; y < alto; y += 4) caja(g, 1.8, 0.12, 1.8, 0xc62828, x, y, z);
    [0, Math.PI / 2, Math.PI].forEach((a) => caja(g, 0.3, 1.6, 0.6, 0xeeeeee, x + Math.cos(a) * 1, alto - 1.5, z + Math.sin(a) * 1));
    caja(g, 0.5, 0.5, 0.5, 0xff2020, x, alto + 0.3, z, LUZ(0xff2020));
  };
  NEGOCIOS.ice = () => {
    const g = new T.Group(),
      f = fachada(18, 16, 12, 0xe3eef8);
    f.position.y = 8;
    g.add(f);
    caja(g, 18.4, 0.8, 12.4, 0x0057a8, 0, 16.4, 0);
    cartelDibujo(g, 9, 2.6, logoICE, 0, 13.4, 6.08);
    caja(g, 6, 3, 0.15, 0x9cc8e8, 0, 1.5, 6.05, VIDRIO);
    cartel(g, "ICE · ELECTRICIDAD Y TELECOMUNICACIONES", 12, 0.7, "#0057a8", "#ffffff", 0, 3.6, 6.1);
    // transformadores y postes de luz
    for (let i = 0; i < 3; i++) caja(g, 1.4, 2, 1.4, 0x78909c, -6 + i * 2, 1, -8);
    [-8, 8].forEach((x) => {
      caja(g, 0.3, 11, 0.3, 0x8d6e63, x, 5.5, 9.5);
      caja(g, 2.6, 0.2, 0.2, 0x8d6e63, x, 10.3, 9.5);
    });
    caja(g, 16, 0.05, 0.05, 0x111111, 0, 10.1, 9.5);
    piso(g, 18, 6, 0x6f7276, 0, 9);
    const camion = camionICE();
    camion.rotation.y = Math.PI / 2;
    camion.position.set(-2, 0, 9);
    g.add(camion);
    return g;
  };
  NEGOCIOS.kolbi = () => {
    const g = restaurante("kölbi", 0xf4f8ec, 0x7ab51d, "#7ab51d", "#ffffff");
    cartelDibujo(g, 4.6, 1.6, logoKolbi, -3, 3.4, 5.1);
    antena(g, -4, -8, 30);
    return g;
  };

  // ===================== CARROS NUEVOS =====================
  function camionICE() {
    return deModelo("camionICE", () => {
      const g = new T.Group();
      caja(g, 2.3, 2.1, 2.2, 0xf2f2f2, 0, 1.6, -2.4);
      caja(g, 2.32, 0.8, 0.1, 0x9fc4e8, 0, 2.1, -3.52, VIDRIO);
      caja(g, 2.2, 0.5, 7, 0x222222, 0, 0.7, 0);
      caja(g, 2.3, 1.4, 4.2, 0xf2f2f2, 0, 1.6, 1.3);
      [-1, 1].forEach((q) => cartel(g, "ICE", 1.8, 0.8, "#ffffff", "#0057a8", q * 1.17, 1.7, 1.3, (q * Math.PI) / 2));
      const b = caja(g, 0.3, 0.3, 4.4, 0xffb300, 0, 2.9, 0.6);
      b.rotation.x = 0.35;
      caja(g, 1, 0.9, 1, 0xffb300, 0, 3.6, -1.3); // canasta
      caja(g, 1.6, 0.25, 0.4, 0xff9800, 0, 2.8, -2.4, LUZ(0xff9800));
      faros(g, 0.8, 1, -3.52);
      wr(g, [[-1, -2.4], [1, -2.4], [-1, 2], [1, 2]], 0.48);
      g.userData.hl = 3.6;
      return sh(g);
    });
  }
  const vanKolbi = () =>
    deModelo("vanKolbi", () => {
      const g = new T.Group();
      caja(g, 2.1, 2.2, 5.4, 0x7ab51d, 0, 1.45, 0);
      caja(g, 2.12, 0.7, 1.2, 0x223344, 0, 1.95, -2, VIDRIO);
      [-1, 1].forEach((q) => cartel(g, "kölbi", 2.6, 0.9, "#7ab51d", "#ffffff", q * 1.06, 1.6, 0.6, (q * Math.PI) / 2));
      faros(g, 0.75, 0.9, -2.72);
      wr(g, [[-0.95, -1.7], [0.95, -1.7], [-0.95, 1.7], [0.95, 1.7]], 0.42);
      g.userData.hl = 2.7;
      return sh(g);
    });
  const suv = () => {
    const c = pk_([0x212121, 0xf5f5f5, 0x8d1c1c, 0x455a64, 0x1b5e20, 0xbdbdbd]);
    return deModelo("suv" + c, () => {
      const g = new T.Group();
      caja(g, 2.1, 1.1, 4.8, c, 0, 1.05, 0);
      caja(g, 2, 0.9, 3.2, c, 0, 2, 0.3);
      caja(g, 2.02, 0.6, 3, 0x223344, 0, 2, 0.3, VIDRIO);
      caja(g, 1.8, 0.12, 2.6, 0x333333, 0, 2.5, 0.4);
      faros(g, 0.75, 1.1, -2.42);
      wr(g, [[-0.95, -1.5], [0.95, -1.5], [-0.95, 1.5], [0.95, 1.5]], 0.45);
      g.userData.hl = 2.4;
      return sh(g);
    });
  };
  const deportivo = () => {
    const c = pk_([0xff1744, 0xffea00, 0x00e676, 0x2979ff, 0xff9100]);
    return deModelo("deportivo" + c, () => {
      const g = new T.Group();
      caja(g, 2, 0.6, 4.4, c, 0, 0.6, 0);
      caja(g, 1.6, 0.5, 1.8, 0x111111, 0, 1.1, 0.3, VIDRIO);
      caja(g, 1.9, 0.1, 0.5, 0x111111, 0, 1.15, 2.1);
      faros(g, 0.7, 0.6, -2.22);
      wr(g, [[-0.95, -1.4], [0.95, -1.4], [-0.95, 1.4], [0.95, 1.4]], 0.36);
      g.userData.hl = 2.2;
      return sh(g);
    });
  };
  const van = () => {
    const c = pk_([0xf5f5f5, 0x90a4ae, 0x1565c0]);
    return deModelo("van" + c, () => {
      const g = new T.Group();
      caja(g, 2.1, 2.4, 6, c, 0, 1.55, 0);
      caja(g, 2.12, 0.8, 1.2, 0x223344, 0, 2.05, -2.3, VIDRIO);
      caja(g, 2.12, 0.6, 3.6, 0x223344, 0, 2.1, 0.6, VIDRIO);
      faros(g, 0.75, 0.9, -3.02);
      wr(g, [[-0.95, -2], [0.95, -2], [-0.95, 2], [0.95, 2]], 0.42);
      g.userData.hl = 3;
      return sh(g);
    });
  };
  const camionMina = () =>
    deModelo("camionMina", () => {
      const g = new T.Group();
      caja(g, 3.4, 1.6, 3, 0xfbc02d, 0, 2.4, -3.2);
      caja(g, 1.6, 1.2, 1.4, 0x9fc4e8, -0.8, 3.7, -3.2, VIDRIO);
      caja(g, 3.2, 0.6, 9, 0x37474f, 0, 1.3, 0);
      const t = caja(g, 3.6, 2.2, 6, 0xfbc02d, 0, 2.9, 1.5);
      t.rotation.x = -0.06;
      caja(g, 3.4, 1, 5.6, 0x6d4c41, 0, 4.1, 1.5); // carga de mineral
      faros(g, 1.1, 1.8, -4.72);
      wr(g, [[-1.5, -3.3], [1.5, -3.3], [-1.5, 2.5], [1.5, 2.5]], 0.95);
      g.userData.hl = 4.8;
      return sh(g);
    });
  const vehAntes = window.vehNuevo;
  window.vehNuevo = function (zz) {
    const r = Math.random();
    if (zz == 16) return vehAntes(zz);
    if ((zz == 35 || zz == 36) && r < 0.25) return camionMina();
    if (r < 0.06) return suv();
    if (r < 0.09) return deportivo();
    if (r < 0.12) return van();
    if (r < 0.14) return camionICE();
    if (r < 0.16) return vanKolbi();
    return vehAntes(zz);
  };

  // ===================== OBRAS EN CARRETERA =====================
  // En cada pedazo de carretera (120 m) puede salir una obra a la orilla: conos, barreras, máquinas y
  // trabajadores. Cada obra mira a la derecha (+x = afuera de la carretera). PROB_OBRA = qué tan seguido.
  const PROB_OBRA = 0.13,
    SIN_OBRAS = new Set([2, 5, 6, 10, 16, 17, 18, 22, 24, 36, 37, 38, 41]);
  const _obras = {};
  function plantillaObra(k) {
    if (_obras[k]) return _obras[k];
    const g = new T.Group();
    for (let z = -18; z <= 18; z += 4) cono(g, 0.3, z);
    for (let i = 0; i < 6; i++) caja(g, 0.5, 0.9, 1.9, i % 2 ? 0xffffff : 0xff6d00, 1.6, 0.45, -10 + i * 4);
    // letreros para el que viene (llega desde +z)
    const s = new T.Group();
    caja(s, 0.12, 2.2, 0.12, 0x777777, 0, 1.1, 0);
    cartelDibujo(s, 1.6, 1.6, (x, w, h) => {
      x.fillStyle = "#ff8f00";
      x.save();
      x.translate(w / 2, h / 2);
      x.rotate(Math.PI / 4);
      x.fillRect(-w * 0.35, -h * 0.35, w * 0.7, h * 0.7);
      x.restore();
      texto(x, "🚧", w / 2, h * 0.42, h * 0.26, "#111");
      texto(x, "OBRAS", w / 2, h * 0.66, h * 0.12, "#111");
    }, 0, 2.5, 0.07);
    Z(s, 1.2, 26, 0, g);
    const s2 = new T.Group();
    caja(s2, 0.12, 2.2, 0.12, 0x777777, 0, 1.1, 0);
    cartel(s2, "HOMBRES TRABAJANDO · 40", 2.6, 0.8, "#ff8f00", "#111111", 0, 2.4, 0.07);
    Z(s2, 1.5, 34, 0, g);
    piso(g, 6, 34, k == 1 ? 0x232527 : 0x6d4c41, 4.2, 0, 0.04);
    if (k == 0) {
      // excavadora pequeña y montaña de tierra
      const e = new T.Group();
      caja(e, 1.8, 0.6, 2.8, 0x263238, 0, 0.3, 0);
      caja(e, 2, 1.2, 2, 0xffb300, 0, 1.2, 0.3);
      caja(e, 1, 1, 1, 0x9fc4e8, -0.4, 2.2, -0.2, VIDRIO);
      const b = caja(e, 0.4, 0.4, 3, 0xffb300, 0.5, 2.1, -1.8);
      b.rotation.x = 0.6;
      caja(e, 0.9, 0.6, 0.7, 0x37474f, 0.5, 0.8, -3.2);
      Z(e, 4.5, -4, 0.4, g);
      const m = new T.Mesh(compartir(new T.ConeGeometry(2.4, 1.8, 8)), mat(0x7a5a3a, { flatShading: true }));
      m.position.set(6, 0.9, 7);
      g.add(m);
      persona(g, 2.8, 4);
      persona(g, 3.4, -10);
    } else if (k == 1) {
      // aplanadora y asfalto nuevo
      const a = new T.Group();
      const r1 = cilindro(a, 0.75, 2, 0x9e9e9e, 0, 0.75, -1.4);
      r1.rotation.z = Math.PI / 2;
      const r2 = cilindro(a, 0.75, 2, 0x9e9e9e, 0, 0.75, 1.4);
      r2.rotation.z = Math.PI / 2;
      caja(a, 1.8, 0.8, 2.2, 0xffc107, 0, 1.3, 0);
      caja(a, 1.2, 1.2, 1, 0x9fc4e8, 0, 2.3, 0.3, VIDRIO);
      caja(a, 1.4, 0.1, 1.4, 0xffc107, 0, 2.95, 0.3);
      Z(a, 4.2, 2, 0, g);
      for (let i = 0; i < 3; i++) persona(g, 3 + i * 0.8, -8 - i * 2.5);
    } else {
      // banderero con PARE/SIGA, torre de luces y mezcladora
      persona(g, 1.2, 14);
      caja(g, 0.06, 1.6, 0.06, 0x777777, 1.5, 1.4, 14);
      cartel(g, "PARE", 0.7, 0.7, "#c62828", "#ffffff", 1.5, 2.3, 14.05);
      cartel(g, "SIGA", 0.7, 0.7, "#2e7d32", "#ffffff", 1.5, 2.3, 13.95, Math.PI);
      caja(g, 0.2, 6, 0.2, 0x9e9e9e, 6, 3, -12);
      caja(g, 1.8, 0.8, 0.3, 0x333333, 6, 6.2, -12);
      caja(g, 1.6, 0.6, 0.1, 0xfff6c0, 6, 6.2, -11.82, LUZ(0xfff2a0));
      caja(g, 2, 1.4, 1.6, 0xffc107, 6, 0.7, -12);
      const mz = new T.Group();
      caja(mz, 2.4, 2.4, 2.4, 0xf2f2f2, 0, 1.8, -3.2);
      caja(mz, 2.2, 0.5, 8.4, 0x222222, 0, 0.7, 0);
      const t = new T.Mesh(compartir(new T.CylinderGeometry(1.1, 1.5, 5, 12)), mat(0xef6c00));
      t.rotation.x = Math.PI / 2 - 0.25;
      t.position.set(0, 2.5, 1);
      mz.add(t);
      wr(mz, [[-1.05, -3.1], [1.05, -3.1], [-1.05, 1.6], [1.05, 1.6], [-1.05, 2.8], [1.05, 2.8]], 0.5);
      Z(mz, 5.6, 4, 0, g);
      persona(g, 3.2, -4);
      persona(g, 3.8, -6);
    }
    return (_obras[k] = fusionar(g));
  }
  function ponerObra(c, p, zn, h) {
    const o = p.o;
    o.visible = false;
    if (SIN_OBRAS.has(zn) || Math.random() > PROB_OBRA) return;
    const s = h.s;
    if (zn == 8 && s > 0) return; // la salida a Vara Blanca va por la derecha
    o.position.set(s * 7.7, 0, -R(40, CH - 40));
    o.rotation.y = s > 0 ? 0 : Math.PI;
    if (h.w() || h.nb() || h.hz() || h.rt()) return;
    for (const q of c.pr)
      if (q !== p && q.t == 20 && q.o.visible && Math.sign(q.o.position.x) == s && Math.abs(q.o.position.z - o.position.z) < 34) return;
    const k = (Math.random() * 3) | 0;
    if (!p.cache[k]) {
      p.cache[k] = plantillaObra(k).clone();
      o.add(p.cache[k]);
    }
    for (const n in p.cache) p.cache[n].visible = n == k;
    o.visible = true;
    // quitar árboles, casas, postes y vallas que queden encima
    for (const q of c.pr)
      if (q !== p && [0, 1, 3, 8, 9].includes(q.t) && q.o.visible)
        if (Math.abs(q.o.position.x - s * 12) < 7 && Math.abs(q.o.position.z - o.position.z) < 24) q.o.visible = false;
  }
  chunks.forEach((c) => {
    const o = new T.Group();
    c.g.add(o);
    c.pr.push({ o, t: 21, f: ponerObra, cache: {} });
  });

  // ===================== ZONA 35 · CARRETERA DE LAS MINAS =====================
  // Autopista con muro central. A la izquierda se está construyendo la Carretera de las Minas:
  // tierra, lastre, asfalto nuevo, máquinas, planta de asfalto y pilas de un puente. Al final, el túnel.
  const TUNEL = { z0: -35560, z1: -36060 };
  {
    portico(-35030, "AUTOPISTA A SARATALÁN · CARRETERA DE LAS MINAS", "#0a6e3a");
    // la carretera nueva por tramos: tierra → lastre → asfalto recién puesto
    piso(G, 14, 180, 0x7a5a3a, -32, -35130, 0.03);
    piso(G, 14, 180, 0x9e9a8f, -32, -35310, 0.03);
    piso(G, 14, 180, 0x2a2c2e, -32, -35490, 0.03);
    for (let z = -35410; z > -35580; z -= 8) caja(G, 0.2, 0.02, 3, 0xf2f2f2, -32, 0.06, z);
    for (let z = -35050; z > -35560; z -= 10) {
      cono(G, -24.5, z);
      cono(G, -39.5, z - 5);
    }
    // estacas de topografía
    for (let z = -35060; z > -35200; z -= 12) caja(G, 0.08, 1, 0.08, 0xff1744, -25.5, 0.5, z);
    // máquinas
    const pav = new T.Group(); // pavimentadora
    caja(pav, 3.2, 1.6, 3, 0x37474f, 0, 1.1, 0);
    caja(pav, 3.6, 0.6, 1.4, 0xffc107, 0, 0.5, 2);
    caja(pav, 1.6, 1.2, 1.4, 0xffc107, 0, 2.5, -0.3);
    caja(pav, 2.2, 0.15, 2, 0xffc107, 0, 3.2, -0.3);
    Z(pav, -32, -35402);
    const vol = new T.Group(); // volqueta echando asfalto
    caja(vol, 2.4, 2.2, 2.2, 0xd32f2f, 0, 1.6, -3);
    caja(vol, 2.2, 0.5, 7.8, 0x222222, 0, 0.7, 0);
    const caj = caja(vol, 2.5, 1.6, 4.6, 0x8d8d8d, 0, 2.8, 1.6);
    caj.rotation.x = 0.4;
    wr(vol, [[-1, -3], [1, -3], [-1, 1.2], [1, 1.2], [-1, 2.8], [1, 2.8]], 0.5);
    Z(vol, -32, -35392, Math.PI);
    for (const z of [-35430, -35460]) {
      const a = new T.Group();
      [-1.4, 1.4].forEach((q) => {
        const r = cilindro(a, 0.75, 2, 0x9e9e9e, 0, 0.75, q);
        r.rotation.z = Math.PI / 2;
      });
      caja(a, 1.8, 0.8, 2.2, 0xffc107, 0, 1.3, 0);
      caja(a, 1.2, 1.2, 1, 0x9fc4e8, 0, 2.3, 0.3, VIDRIO);
      Z(a, -30 + (z % 3), z);
    }
    // excavadoras cortando el cerro
    for (const [x, z, ry] of [[-38, -35110, 0.7], [-30, -35180, -0.4]]) {
      const e = new T.Group();
      caja(e, 3, 0.9, 4.6, 0x263238, 0, 0.45, 0);
      caja(e, 3.2, 1.6, 3.2, 0xffb300, 0, 1.8, 0.4);
      caja(e, 1.4, 1.6, 1.4, 0x9fc4e8, -0.7, 3.1, -0.5, VIDRIO);
      const b1 = caja(e, 0.6, 0.6, 4.4, 0xffb300, 0.8, 3.4, -2.6);
      b1.rotation.x = 0.55;
      const b2 = caja(e, 0.5, 0.5, 3.6, 0xffb300, 0.8, 3.1, -5.3);
      b2.rotation.x = -0.9;
      Z(e, x, z, ry);
    }
    cerro(G, -70, -35140, 40, 35, 0x7a5a3a);
    for (let i = 0; i < 16; i++) persona(G, -R(26, 38), -35060 - i * 30);
    // pilas del puente nuevo sobre la quebrada
    for (let i = 0; i < 4; i++) {
      caja(G, 2.2, 12, 2.2, 0xbdbdbd, -27, 6, -35240 - i * 30);
      caja(G, 2.2, 12, 2.2, 0xbdbdbd, -37, 6, -35240 - i * 30);
      if (i < 2) caja(G, 14, 1.2, 30, 0xbdbdbd, -32, 12.6, -35255 - i * 30);
    }
    // planta de asfalto
    const pl = new T.Group();
    [0, 6, 12].forEach((z) => cilindro(pl, 2.4, 14, 0xb0bec5, 0, 7, z));
    caja(pl, 6, 4, 22, 0x546e7a, -6, 2, 6);
    const tb = caja(pl, 1.4, 1.4, 26, 0x9e9e9e, -3, 8, 6);
    tb.rotation.x = 0.4;
    cartel(pl, "PLANTA DE ASFALTO", 10, 1.4, "#ff8f00", "#111111", 3.1, 4, 6, Math.PI / 2);
    Z(pl, -70, -35320);
    // valla del proyecto
    const v = new T.Group();
    [-5, 5].forEach((x) => caja(v, 0.4, 7, 0.4, 0x777777, x, 3.5, 0));
    cartelDibujo(v, 13, 4.6, (x, w, h) => {
      x.fillStyle = "#0a3d62";
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#ff8f00";
      x.fillRect(0, h * 0.78, w, h * 0.22);
      texto(x, "CONSTRUCCIÓN · CARRETERA DE LAS MINAS", w / 2, h * 0.2, h * 0.11, "#ffffff");
      texto(x, "San José → Minas de Saratalán · 48 km", w / 2, h * 0.42, h * 0.09, "#ffffff");
      texto(x, "AVANCE DE LA OBRA: 65 %", w / 2, h * 0.62, h * 0.1, "#ffd54f");
      texto(x, "MOPT · Disculpe las molestias", w / 2, h * 0.89, h * 0.09, "#111111");
    }, 0, 5.6, 0.25);
    Z(v, -16, -35060, 0);
    letrero(G, 9.8, -35480, "TÚNEL SARATALÁN · ENCIENDA LUCES", "#0a3d62", "#ffffff", 6);
    // ----- el túnel -----
    const L = TUNEL.z0 - TUNEL.z1,
      zc = (TUNEL.z0 + TUNEL.z1) / 2;
    caja(G, 1, 7.6, L, 0xcfd8dc, -8.1, 3.8, zc);
    caja(G, 1, 7.6, L, 0xcfd8dc, 8.1, 3.8, zc);
    caja(G, 17.2, 1, L, 0x90a4ae, 0, 8, zc);
    [-7.55, 7.55].forEach((x) => caja(G, 0.1, 0.8, L, 0xffb300, x, 0.6, zc)); // franja en la pared
    for (let z = TUNEL.z0 - 6; z > TUNEL.z1; z -= 14) caja(G, 3, 0.15, 1.2, 0xfff6c0, 0, 7.45, z, LUZ(0xfff2a0));
    // la montaña encima (con un hueco para la carretera)
    [-1, 1].forEach((q) => {
      caja(G, 300, 60, L + 40, 0x4e5b3e, q * 158.6, 30, zc);
      cerro(G, q * 70, zc, 110, 140, 0x546e5a, true);
    });
    caja(G, 17.2, 52, L + 40, 0x4e5b3e, 0, 34.5, zc);
    // picos encima de la montaña (para que se vea como cordillera y no como una pared)
    for (let i = 0; i < 14; i++) {
      const h = R(40, 110),
        m = new T.Mesh(compartir(new T.ConeGeometry(1, 1, 7)), mat(pk_([0x4e5b3e, 0x5d6b4a, 0x6d5d4b]), { flatShading: true }));
      m.scale.set(R(45, 80), h, R(45, 80));
      m.position.set(-280 + i * 43 + R(-15, 15), 60 + h / 2 - 2, zc + R(-200, 200));
      G.add(m);
      if (h > 80) {
        const n = new T.Mesh(compartir(new T.ConeGeometry(1, 1, 7)), mat(0xffffff, { flatShading: true }));
        n.scale.set(m.scale.x * 0.3, h * 0.3, m.scale.z * 0.3);
        n.position.set(m.position.x, 60 + h * 0.85 - 2, m.position.z);
        G.add(n);
      }
    }
    // las bocas del túnel
    [TUNEL.z0 + 20, TUNEL.z1 - 20].forEach((z, i) => {
      const b = new T.Group();
      caja(b, 3, 12, 2, 0x9e9e9e, -10, 6, 0);
      caja(b, 3, 12, 2, 0x9e9e9e, 10, 6, 0);
      caja(b, 23, 4, 2, 0x9e9e9e, 0, 10, 0);
      cartel(b, "TÚNEL SARATALÁN", 12, 1.6, "#0a3d62", "#ffffff", 0, 10, 1.05);
      cartel(b, "TÚNEL SARATALÁN", 12, 1.6, "#0a3d62", "#ffffff", 0, 10, -1.05, Math.PI);
      Z(b, 0, z);
    });
  }

  // ===================== ZONA 36 · MINAS DE SARATALÁN =====================
  // Cañón de roca roja con minas a los lados. Hay piedras que caen del cerro y cruzan la carretera:
  // si una te pega, te daña. Cada rato hay una explosión en la cantera. Si salís vivo: +₡10 000.
  const MINAS = { z0: -36080, z1: -36980, premio: -1, dentro: -1, golpe: 0, voladura: 0, avisos: -1 };
  const piedras = [],
    polvo = [];
  {
    portico(-36090, "⚠ PELIGRO · MINAS DE SARATALÁN", "#b71c1c", "#ffeb3b");
    // paredes del cañón
    for (let z = -36100; z > -36990; z -= 9) {
      [-1, 1].forEach((q) => {
        const r = R(4, 7);
        roca(G, q * R(21, 26), r * 0.6, z, r, pk_([0x8d4b2a, 0xa0522d, 0x7b3f1f, 0x6d4c41]));
        roca(G, q * R(24, 36), r * 1.8, z + R(-4, 4), r * 1.6, pk_([0x8d4b2a, 0xa0522d, 0x7b3f1f]));
      });
    }
    piso(G, 22, 900, 0x8a6a4a, -18, -36540, 0.025);
    piso(G, 22, 900, 0x8a6a4a, 18, -36540, 0.025);
    // bocas de las minas (a la derecha) con rieles y vagonetas
    for (const z of [-36250, -36550, -36850]) {
      const m = new T.Group();
      caja(m, 6, 6, 4, 0x0a0a0a, 0, 3, 0);
      caja(m, 0.6, 6.4, 0.6, 0x6d4c41, -3.2, 3.2, -2.1);
      caja(m, 0.6, 6.4, 0.6, 0x6d4c41, 3.2, 3.2, -2.1);
      caja(m, 7.2, 0.7, 0.7, 0x6d4c41, 0, 6.4, -2.1);
      cartel(m, "MINA " + ["SAN JUAN", "LA ESPERANZA", "EL INFIERNO"][(-z / 300) % 3 | 0], 5, 0.8, "#3e2723", "#ffd54f", 0, 7.4, -2.2, Math.PI);
      Z(m, 15, z, Math.PI / 2);
      cartel(G, "☠ PELIGRO · MINA", 3, 1, "#ffeb3b", "#b71c1c", 12.6, 2.4, z + 6, DER, true);
    }
    // rieles a lo largo de la orilla derecha
    [-0.6, 0.6].forEach((d) => caja(G, 0.12, 0.12, 880, 0x795548, 11 + d, 0.08, -36540, { metalness: 0.6, roughness: 0.4 }));
    for (let z = -36100; z > -36980; z -= 2.5) caja(G, 1.8, 0.1, 0.3, 0x5d4037, 11, 0.04, z);
    // avisos
    const avisos = ["⚠ ZONA DE DERRUMBES", "☠ PELIGRO · EXPLOSIVOS", "⚠ CAEN PIEDRAS", "NO SE DETENGA", "⚠ CAMIONES MINEROS", "VELOCIDAD 40"];
    for (let i = 0; i < 10; i++) letrero(G, i % 2 ? -9.8 : 9.4, -36140 - i * 85, avisos[i % avisos.length], "#ffeb3b", "#b71c1c", 4.8);
    // cantera a la izquierda con camiones gigantes
    for (let i = 0; i < 4; i++) caja(G, 60 - i * 12, 4, 80 - i * 14, 0x9c6b4a, -75, 2 + i * 4, -36500);
    for (let i = 0; i < 3; i++) {
      const c = camionMina();
      c.position.set(-45 - i * 9, 0, -36440 - i * 22);
      c.rotation.y = 0.6;
      c.scale.setScalar(1.6);
      G.add(c);
    }
    // casetas y torre de la mina
    const t = new T.Group();
    for (const [a, b] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) caja(t, 0.4, 22, 0.4, 0x5d4037, a, 11, b);
    caja(t, 5, 0.6, 5, 0x5d4037, 0, 22, 0);
    cilindro(t, 2, 0.6, 0x9e9e9e, 0, 23.4, 0).rotation.x = Math.PI / 2;
    Z(t, -40, -36720);
    caja(G, 8, 3, 6, 0x6d4c41, -36, 1.5, -36780);
    cartel(G, "MINAS DE SARATALÁN S.A.", 7, 0.8, "#3e2723", "#ffd54f", -31.95, 2.2, -36780, IZQ);
    // piedras que caen (se animan en CUADRO A CUADRO)
    for (let i = 0; i < 5; i++) {
      const p = new T.Mesh(compartir(new T.DodecahedronGeometry(1.6, 0)), mat(0x6d4c41, { flatShading: true }));
      p.castShadow = true;
      animados.add(p);
      piedras.push({ m: p, z: -36180 - i * 170, f: i * 2.3, lado: i % 2 ? -1 : 1 });
    }
    for (let i = 0; i < 14; i++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0xb08a6a, depthWrite: false, transparent: true, opacity: 0 }));
      sp.userData.k = i / 14;
      animados.add(sp);
      polvo.push(sp);
    }
  }

  // ===================== ZONA 37 · FERRY =====================
  // El mar va de MUELLE_A (tierra firme) a MUELLE_B (Isla Bonita). Subí el vehículo al ferry y frená:
  // el ferry zarpa y te lleva a la isla. Si te metés al agua sin ferry, volvés al muelle.
  const MUELLE_A = -37060,
    MUELLE_B = -37440,
    FERRY_L = 46;
  const FER = { zc: MUELLE_A - FERRY_L / 2, st: "A", t: 0, ride: false, ox: 0, oz: 0, aviso: -1, ciclo: -1 };
  window.FERRY = FER; // para revisar desde la consola
  const ferry = new T.Group();
  {
    portico(-37010, "PUERTO · FERRY A ISLA BONITA", "#0277bd");
    mar(3000, MUELLE_A - MUELLE_B, 0, (MUELLE_A + MUELLE_B) / 2);
    mar(1400, 60, -760, MUELLE_A + 30); // mar a los lados del puerto
    mar(1400, 60, 760, MUELLE_A + 30);
    // muelles de concreto
    [MUELLE_A, MUELLE_B].forEach((z, i) => {
      const q = i ? -1 : 1;
      caja(G, 40, 1.4, 6, 0xbdbdbd, 0, -0.62, z + q * 3);
      for (let x = -18; x <= 18; x += 6) cilindro(G, 0.3, 0.7, 0x37474f, x, 0.35, z + q * 0.6);
      [-9, 9].forEach((x) => {
        caja(G, 0.5, 6, 0.5, 0xffc107, x, 3, z + q * 2);
      });
      caja(G, 18.5, 0.5, 0.5, 0xffc107, 0, 6, z + q * 2);
      cartel(G, i ? "ISLA BONITA · BIENVENIDOS" : "⛴ FERRY · SUBA Y FRENE PARA ZARPAR", 16, 1.4, "#0277bd", "#ffffff", 0, 7, z + q * 2 + q * 0.3, i ? 0 : 0, true);
    });
    // terminal del ferry y fila de carros esperando
    const tf = new T.Group();
    caja(tf, 20, 6, 12, 0xeceff1, 0, 3, 0);
    caja(tf, 21, 0.8, 13, 0x0277bd, 0, 6.4, 0);
    cartel(tf, "TERMINAL DE FERRY", 14, 1.4, "#0277bd", "#ffffff", 0, 4.6, 6.05);
    caja(tf, 12, 2.2, 0.12, 0x9cc8e8, 0, 1.6, 6.05, VIDRIO);
    Z(tf, 30, -37030, DER);
    for (let i = 0; i < 4; i++) {
      const c = suv();
      c.position.set(-12, 0, -37020 - i * 7);
      G.add(c);
    }
    // el ferry
    caja(ferry, 20, 3.2, FERRY_L, 0xf5f5f5, 0, -1.45, 0);
    caja(ferry, 20.2, 0.8, FERRY_L + 0.2, 0x0277bd, 0, -2.7, 0);
    caja(ferry, 15.2, 0.1, FERRY_L - 2, 0x3b3e44, 0, 0.12, 0);
    for (let z = -20; z <= 20; z += 6) caja(ferry, 0.15, 0.02, 3, 0xffffff, 0, 0.18, z);
    [-1, 1].forEach((q) => caja(ferry, 0.4, 1.2, FERRY_L, 0xf5f5f5, q * 8, 0.75, 0));
    // puente de mando y chimenea (a la derecha)
    caja(ferry, 2, 5, 16, 0xf5f5f5, 9, 3.5, 4);
    caja(ferry, 2.1, 1.2, 15, 0x223344, 9, 4.4, 4, VIDRIO);
    cilindro(ferry, 0.9, 4, 0xc62828, 9, 8, 8);
    cartel(ferry, "FERRY ISLA BONITA", 10, 1.2, "#0277bd", "#ffffff", 7.95, 2.6, 4, -Math.PI / 2);
    cartel(ferry, "FERRY ISLA BONITA", 10, 1.2, "#0277bd", "#ffffff", 10.05, 2.6, 4, Math.PI / 2);
    // rampas
    [-1, 1].forEach((q) => {
      const r = caja(ferry, 14, 0.3, 3, 0x9e9e9e, 0, 0.05, q * (FERRY_L / 2 + 1.2));
      r.rotation.x = q * -0.05;
    });
    // salvavidas y luces
    for (let z = -18; z <= 18; z += 9) caja(ferry, 0.2, 0.6, 0.6, 0xff6d00, -8.25, 1.1, z);
    const carroFerry = deportivo();
    carroFerry.position.set(-4.5, 0.15, 14);
    ferry.add(carroFerry);
    ferry.position.z = FER.zc;
    animados.add(ferry);
  }

  // ===================== ZONA 38 · ISLA BONITA =====================
  const PUENTE_ISLA = { z0: -38850, z1: -39000 };
  {
    const z0 = MUELLE_B,
      z1 = PUENTE_ISLA.z0,
      L = z0 - z1,
      zc = (z0 + z1) / 2;
    // arena y mar a los dos lados
    [-1, 1].forEach((q) => {
      piso(G, 52, L, 0xd9c08a, q * 33.4, zc, 0.03);
      mar(1500, L + 150, q * 809, zc - 75);
    });
    // palmeras, sombrillas y gente
    for (let i = 0; i < 70; i++) palmera(G, (i % 2 ? 1 : -1) * R(10, 30), z0 - R(10, L - 10));
    for (let i = 0; i < 60; i++) sombrilla(G, (i % 2 ? 1 : -1) * R(36, 56), z0 - R(20, L - 20));
    for (let i = 0; i < 40; i++) persona(G, (i % 2 ? 1 : -1) * R(38, 58), z0 - R(20, L - 20), pk_([0xe53935, 0x1e88e5, 0xfdd835, 0x8e24aa]), 0);
    // hoteles y pueblito
    const nombres = ["HOTEL ISLA BONITA", "HOTEL PURA VIDA", "RESORT LAS OLAS", "HOTEL CORAL", "CABINAS DEL MAR"];
    for (let i = 0; i < 10; i++) hotel(G, (i % 2 ? 1 : -1) * 28, -37560 - i * 120, pk_([0xfff3e0, 0xe1f5fe, 0xfce4ec, 0xf1f8e9]), nombres[i % 5], i % 2 ? DER : IZQ);
    // faro
    const f = new T.Group();
    for (let i = 0; i < 6; i++) cilindro(f, 2.4 - i * 0.2, 4, i % 2 ? 0xc62828 : 0xffffff, 0, 2 + i * 4, 0);
    caja(f, 2.6, 2, 2.6, 0xfff59d, 0, 25, 0, LUZ(0xffee58));
    Z(f, -52, -38700);
    // botes en el mar
    for (let i = 0; i < 8; i++) {
      const b = new T.Group();
      caja(b, 2.4, 1, 7, pk_([0xffffff, 0xe53935, 0x1e88e5]), 0, 0.4, 0);
      caja(b, 0.12, 6, 0.12, 0xeeeeee, 0, 3.5, 0);
      const v = caja(b, 0.05, 4.4, 3, 0xffffff, 0, 3.8, 1.4);
      v.rotation.y = 0.05;
      Z(b, (i % 2 ? 1 : -1) * R(80, 260), -37500 - i * 160, R(0, 3));
    }
    letrero(G, 9.4, -37480, "🏝 ISLA BONITA · PLAYAS", "#0277bd", "#ffffff", 5);
    // puente de regreso a tierra firme
    const PL = PUENTE_ISLA.z0 - PUENTE_ISLA.z1,
      pc = (PUENTE_ISLA.z0 + PUENTE_ISLA.z1) / 2;
    mar(3000, PL, 0, pc);
    caja(G, 15, 0.9, PL, 0x3b3e44, 0, -0.2, pc);
    for (let z = PUENTE_ISLA.z0 - 4; z > PUENTE_ISLA.z1; z -= 9) caja(G, 0.18, 0.02, 4, 0xf2c200, 0, 0.27, z);
    [-1, 1].forEach((q) => {
      caja(G, 0.4, 1, PL, 0xb0b5ba, q * 7.6, 0.75, pc);
      caja(G, 0.25, 0.25, PL, 0x9e9e9e, q * 7.6, 1.35, pc, { metalness: 0.6, roughness: 0.35 });
    });
    for (let z = PUENTE_ISLA.z0 - 20; z > PUENTE_ISLA.z1; z -= 40) caja(G, 4, 12, 4, 0xbdbdbd, 0, -6, z);
  }

  // ===================== ZONA 39 · CIUDAD ESMERALDA =====================
  {
    portico(-39030, "CIUDAD ESMERALDA · BIENVENIDOS", "#00796b");
    [-1, 1].forEach((q) => piso(G, 6, 960, 0xbdbab3, q * 10.4, -39500, 0.04)); // aceras
    for (let cz = -39080; cz > -39980; cz -= 140) {
      // calles que cruzan con su paso de cebra
      piso(G, 400, 14, 0x3b3e44, 0, cz, 0.035);
      for (let x = -6.5; x <= 6.5; x += 1.3) caja(G, 0.6, 0.02, 3, 0xffffff, x, 0.06, cz + 9);
      // cuadras de edificios
      [-1, 1].forEach((q) => {
        for (let k = 0; k < 3; k++) {
          const w = R(18, 26),
            h = R(25, 110),
            z = cz - 22 - k * 38;
          if (z < -39990) continue;
          const f = fachada(w, h, R(18, 24), pk_(COLORES_EDIFICIO));
          f.position.set(q * (26 + w / 2 + R(0, 30)), h / 2, z);
          G.add(f);
        }
      });
      // postes de luz
      [-1, 1].forEach((q) => {
        caja(G, 0.25, 8, 0.25, 0x555555, q * 8.4, 4, cz - 70);
        caja(G, 2, 0.2, 0.4, 0x555555, q * 7.6, 8, cz - 70);
        caja(G, 0.8, 0.12, 0.4, 0xfff6c0, q * 7, 7.9, cz - 70, LUZ(0xfff2a0));
      });
    }
    // edificio central del ICE (torre azul) y tienda kölbi
    const ice = new T.Group(),
      fi = fachada(30, 120, 30, 0x5c8fc7);
    fi.position.y = 60;
    ice.add(fi);
    caja(ice, 30.4, 1.4, 30.4, 0x0057a8, 0, 120.7, 0);
    cartelDibujo(ice, 22, 6.4, logoICE, 0, 112, 15.08);
    const ant = new T.Group();
    antena(ant, 0, 0, 22);
    ant.position.y = 121.4;
    ice.add(ant);
    Z(ice, 52, -39560, DER);
    for (let i = 0; i < 2; i++) {
      const k = copia("kolbi");
      k.position.set(-24, 0, -39300 - i * 420);
      k.rotation.y = IZQ;
      G.add(k);
    }
    const w = copia("walmart");
    w.position.set(-40, 0, -39720);
    w.rotation.y = IZQ;
    G.add(w);
  }

  // ===================== ZONA 40 · CORDILLERA Y VALLE =====================
  {
    portico(-40030, "VALLE DE LA CORDILLERA", "#33691e");
    // dos cordilleras nevadas a los lados
    [-1, 1].forEach((q) => {
      for (let i = 0; i < 16; i++) cerro(G, q * R(260, 520), -40000 - i * 65 + R(-20, 20), R(90, 150), R(160, 300), pk_([0x546e7a, 0x5d6b4a, 0x4e5d45]), true);
      for (let i = 0; i < 12; i++) cerro(G, q * R(150, 230), -40030 - i * 80, R(50, 80), R(50, 100), pk_([0x689f38, 0x558b2f, 0x7cb342]));
    });
    // fincas: parcelas de colores, graneros, cercas y vacas
    // (esta zona tiene lomas: las piezas largas van en pedazos cortos para que sigan el terreno)
    for (let i = 0; i < 40; i++) {
      const q = i % 2 ? 1 : -1,
        d = R(40, 80),
        m = new T.Mesh(
          new T.PlaneGeometry(R(30, 60), d, 1, Math.ceil(d / 8)),
          mat(pk_([0x9ccc65, 0xc5e1a5, 0xdce775, 0x8bc34a, 0xa1887f]), { roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
        );
      m.rotation.x = -Math.PI / 2;
      m.position.set(q * R(50, 140), 0.03, -40060 - R(0, 880));
      m.receiveShadow = true;
      G.add(m);
    }
    for (let i = 0; i < 8; i++) {
      const g = new T.Group(),
        q = i % 2 ? 1 : -1;
      caja(g, 10, 6, 14, 0xb71c1c, 0, 3, 0);
      const t = caja(g, 10.6, 0.4, 8, 0x5d4037, 0, 7.5, -3.3);
      t.rotation.x = 0.5;
      const t2 = caja(g, 10.6, 0.4, 8, 0x5d4037, 0, 7.5, 3.3);
      t2.rotation.x = -0.5;
      caja(g, 3, 4, 0.1, 0xffffff, 0, 2, 7.05);
      Z(g, q * R(60, 120), -40080 - i * 115, q > 0 ? DER : IZQ);
    }
    for (let i = 0; i < 30; i++) {
      const v = new T.Group();
      caja(v, 0.9, 0.9, 1.8, 0xffffff, 0, 1.1, 0);
      caja(v, 0.5, 0.5, 0.6, 0x111111, 0, 1.4, -1.1);
      caja(v, 0.92, 0.4, 0.6, 0x111111, 0, 1.2, 0.3);
      for (const [a, b] of [[-0.3, -0.7], [0.3, -0.7], [-0.3, 0.7], [0.3, 0.7]]) caja(v, 0.15, 0.7, 0.15, 0xffffff, a, 0.35, b);
      Z(v, (i % 2 ? 1 : -1) * R(30, 110), -40050 - R(0, 900), R(0, 6));
    }
    for (let z = -40020; z > -40990; z -= 10) [-1, 1].forEach((q) => caja(G, 0.15, 1.2, 0.15, 0x8d6e63, q * 14, 0.6, z));
    for (let z = -40020; z > -40990; z -= 10) [-1, 1].forEach((q) => caja(G, 0.08, 0.08, 10, 0x8d6e63, q * 14, 1, z - 5));
    // río que corre por el valle
    const rio = [];
    for (let z = -40000; z >= -41000; z -= 25) rio.push([-70 + Math.sin(z / 90) * 25, z]);
    rio.forEach(([x, z]) => mar(26, 27, x, z, 0.06));
    letrero(G, 9.4, -40100, "MIRADOR DEL VALLE ↗", "#33691e", "#ffffff");
  }

  // ===================== ZONA 41 · AUTOPISTAS =====================
  // Tres autopistas paralelas. Las de los lados (x de 17 a 33) también se manejan.
  const AUTOP = { z0: -41000, z1: -42000 };
  const carrosLado = [];
  PISTAS_EXTRA.push((x, z) => {
    const u = z - CZ;
    return u < AUTOP.z0 && u > AUTOP.z1 && Math.abs(x) > 16.5 && Math.abs(x) < 33.5;
  });
  {
    portico(-41030, "AUTOPISTAS DEL PACÍFICO · CALDERA ↓  PUNTARENAS ↓", "#0a6e3a");
    [-1, 1].forEach((q) => {
      piso(G, 16, 1000, 0x1f2124, q * 25, -41500, 0.03);
      caja(G, 0.6, 1, 1000, 0xb0b5ba, q * 25, 0.5, -41500); // muro del centro
      [17.3, 32.7].forEach((x) => caja(G, 0.16, 0.05, 1000, 0xf2f2f2, q * x, 0.1, -41500));
      for (let z = -41004; z > -42000; z -= 12) [21.1, 28.9].forEach((x) => caja(G, 0.15, 0.05, 4, 0xf2f2f2, q * x, 0.1, z));
      // barandas entre la autopista del centro y las de los lados
      caja(G, 0.3, 0.8, 1000, 0x9e9e9e, q * 12.5, 0.4, -41500, { metalness: 0.6, roughness: 0.35 });
    });
    // pórticos con letreros cada 300 m
    for (const z of [-41200, -41500, -41800]) {
      const g = new T.Group();
      [-36, 36].forEach((x) => caja(g, 0.8, 9, 0.8, 0x8a8f94, x, 4.5, 0));
      caja(g, 72.8, 0.8, 0.8, 0x8a8f94, 0, 9, 0);
      cartel(g, "CALDERA 12 km", 12, 2, "#0a6e3a", "#ffffff", -25, 10.6, 0.45);
      cartel(g, "SAN JOSÉ ↑", 10, 2, "#0a6e3a", "#ffffff", 0, 10.6, 0.45);
      cartel(g, "PUNTARENAS 30 km", 12, 2, "#0a6e3a", "#ffffff", 25, 10.6, 0.45);
      Z(g, 0, z);
    }
    // paso elevado que cruza las tres autopistas
    const pz = -41620;
    caja(G, 140, 1.2, 14, 0x9e9e9e, 0, 8, pz);
    [-1, 1].forEach((q) => caja(G, 140, 1, 0.4, 0xbdbdbd, 0, 9, pz + q * 6.8));
    for (const x of [-40, -14, 14, 40]) caja(G, 2.4, 7.4, 2.4, 0xbdbdbd, x, 3.7, pz);
    // árboles más afuera
    for (let i = 0; i < 60; i++) {
      const t = tree();
      t.scale.setScalar(R(1, 1.8));
      t.position.set((i % 2 ? 1 : -1) * R(42, 90), 0, -41000 - R(0, 1000));
      G.add(t);
    }
    // carros que andan por las autopistas de los lados y por el paso elevado
    const modelos = [suv, deportivo, van, vanKolbi];
    for (let i = 0; i < 26; i++) {
      const q = i % 2 ? 1 : -1,
        o = modelos[i % 4]();
      const sentido = i % 4 < 2 ? 1 : -1; // en cada autopista hay carros en los dos sentidos
      o.rotation.y = sentido > 0 ? Math.PI : 0;
      animados.add(o);
      carrosLado.push({ o, x: q * 25 + (sentido > 0 ? 1 : -1) * R(2, 6), u: R(0, 1000), v: R(18, 30) * sentido, alto: false });
    }
    for (let i = 0; i < 6; i++) {
      const o = modelos[i % 4]();
      o.rotation.y = i % 2 ? Math.PI / 2 : -Math.PI / 2;
      animados.add(o);
      carrosLado.push({ o, x: R(-60, 60), u: 0, v: (i % 2 ? 1 : -1) * R(12, 18), alto: true, z: pz + (i % 2 ? 3 : -3) });
    }
  }

  // ===================== ZONA 42 · PLAYAS DE GUANACASTE =====================
  {
    portico(-42030, "PLAYAS DE GUANACASTE", "#ef6c00");
    piso(G, 40, 960, 0xd9c08a, 30, -42520, 0.03);
    mar(1500, 1000, 800, -42500);
    // olas: franjas blancas en la orilla
    for (let z = -42040; z > -42990; z -= 30) caja(G, 1.2, 0.05, 26, 0xffffff, 51 + Math.sin(z) * 1.5, 0.14, z, { transparent: true, opacity: 0.8 });
    for (let i = 0; i < 40; i++) palmera(G, R(12, 22), -42040 - R(0, 940));
    for (let i = 0; i < 50; i++) sombrilla(G, R(28, 46), -42040 - R(0, 940));
    for (let i = 0; i < 30; i++) persona(G, R(30, 48), -42040 - R(0, 940), pk_([0xe53935, 0x1e88e5, 0xfdd835, 0x00897b]), 0);
    // torres de salvavidas
    for (let i = 0; i < 5; i++) {
      const t = new T.Group();
      for (const [a, b] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) caja(t, 0.15, 3, 0.15, 0xffffff, a, 1.5, b);
      caja(t, 2.4, 1.6, 2.4, 0xe53935, 0, 3.8, 0);
      cartel(t, "SALVAVIDAS", 2.2, 0.4, "#e53935", "#ffffff", -1.22, 3.8, 0, -Math.PI / 2);
      Z(t, 42, -42100 - i * 190);
    }
    // surfistas en el mar
    for (let i = 0; i < 12; i++) {
      const s = new T.Group();
      caja(s, 0.5, 0.1, 2, pk_([0xfdd835, 0xff7043, 0x29b6f6]), 0, 0.2, 0);
      persona(s, 0, 0, 0x111111, 0);
      s.children.forEach((c) => (c.position.y += 0.2));
      Z(s, R(60, 110), -42060 - R(0, 920), R(0, 6));
    }
    // sodas de playa
    for (let i = 0; i < 4; i++) {
      const s = new T.Group();
      caja(s, 8, 3, 6, 0xffe0b2, 0, 1.5, 0);
      const t = new T.Mesh(compartir(new T.ConeGeometry(6.4, 2.4, 4)), mat(0xd7b46a));
      t.position.y = 4.2;
      t.rotation.y = Math.PI / 4;
      s.add(t);
      cartel(s, ["SODA LA PLAYA", "MARISQUERÍA EL SOL", "BAR LAS OLAS", "SODA TAMARINDO"][i], 6, 0.8, "#ef6c00", "#ffffff", 0, 2.6, 3.05);
      Z(s, 18, -42150 - i * 230, DER);
    }
    letrero(G, -9.8, -42200, "TAMARINDO 5 km", "#0a6e3a", "#ffffff");
  }

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

  // en el mar del ferry no salen carros
  window.sinTrafico = (u) => u < MUELLE_A && u > MUELLE_B;

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0,
    zAnt = 0,
    golpeT = 0,
    aguaT = 0;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const t = reloj,
      play = state == "play" && !MONT.on,
      u = B.z - CZ; // posición dentro del ciclo (negativa)
    const cerca = (z) => Math.abs(u - z) < 1600;
    // reinicio desde el menú o vuelta nueva: el ferry vuelve al muelle de tierra firme
    if (Math.abs(B.z - zAnt) > 30 || FER.ciclo != cyc) {
      FER.ciclo = cyc;
      if (!FER.ride) Object.assign(FER, { zc: MUELLE_A - FERRY_L / 2, st: "A", t: 0 });
    }
    zAnt = B.z;

    // ----- ferry -----
    ferry.visible = cerca(-37250);
    if (ferry.visible) {
      const zcW = CZ + FER.zc,
        enCubierta = Math.abs(B.x) < 7.6 && Math.abs(B.z - zcW) < FERRY_L / 2 - 1 && B.y < 2;
      if (FER.st == "A") {
        if (play && FER.aviso != cyc && u < MUELLE_A + 150 && u > MUELLE_A) {
          FER.aviso = cyc;
          msg("⛴ Subí el vehículo al ferry y frená para zarpar a Isla Bonita", 4000);
        }
        if (play && enCubierta && Math.abs(B.v) < 1.5) {
          FER.t += dt;
          if (FER.t > 1) {
            Object.assign(FER, { st: "ida", ride: true, ox: B.x, oz: B.z - zcW, t: 0 });
            msg("⛴ ¡Zarpa el ferry! Rumbo a Isla Bonita", 3000);
            hiss();
          }
        } else FER.t = 0;
      } else if (FER.st == "ida") {
        const dest = MUELLE_B + FERRY_L / 2,
          resta = FER.zc - dest;
        // arranca despacio, va a 16 m/s y frena al llegar
        const andado = MUELLE_A - FERRY_L / 2 - FER.zc,
          vel = Math.max(2.5, Math.min(16, resta * 0.25, andado * 0.4 + 3));
        FER.zc -= Math.min(resta, vel * dt);
        if (FER.zc - dest < 0.05) {
          FER.zc = dest;
          FER.st = "B";
          FER.t = 0;
          if (FER.ride) {
            FER.ride = false;
            cash += 3000;
            msg("🏝 ¡Llegaste a Isla Bonita! +₡3000 · Bajá del ferry", 3500);
          }
        }
      } else if (FER.st == "B") {
        if (!enCubierta) FER.t += dt;
        if (FER.t > 10) FER.st = "vuelta";
      } else if (FER.st == "vuelta") {
        FER.zc = Math.min(MUELLE_A - FERRY_L / 2, FER.zc + 16 * dt);
        if (FER.zc >= MUELLE_A - FERRY_L / 2) Object.assign(FER, { st: "A", t: 0 });
      }
      if (FER.ride) {
        B.z = CZ + FER.zc + FER.oz;
        B.x = FER.ox;
        B.v = 0;
        B.lv = 0;
      }
      ferry.position.set(0, Math.sin(t * 0.8) * 0.06, FER.zc);
      ferry.rotation.z = FER.st == "ida" || FER.st == "vuelta" ? Math.sin(t * 0.6) * 0.012 : 0;
      ferry.updateMatrix();
      // ¿se metió al agua sin el ferry?
      const enMar = u < MUELLE_A - 1 && u > MUELLE_B + 1 && Math.abs(B.x) < 200;
      if (play && enMar && !FER.ride && !(enCubierta && (FER.st == "A" || FER.st == "B"))) {
        aguaT += dt;
        if (aguaT > 0.15) {
          aguaT = 0;
          const haciaA = u > (MUELLE_A + MUELLE_B) / 2;
          B.z = CZ + (haciaA ? MUELLE_A + 12 : MUELLE_B - 12);
          B.x = 5.25;
          B.v = 0;
          B.h = haciaA ? 0 : Math.PI;
          shake = 0.6;
          msg(FER.st == "A" ? "🌊 ¡Al agua! Subí al ferry para cruzar" : "🌊 ¡Al agua! Esperá que vuelva el ferry", 3000);
        }
      } else aguaT = 0;
      // carros que se metan al mar: fuera
      for (let i = cars.length - 1; i >= 0; i--) {
        const cz = cars[i].z - CZ;
        if (cz < MUELLE_A && cz > MUELLE_B) {
          liberar(cars[i].o);
          cars.splice(i, 1);
        }
      }
    }

    // ----- túnel y puente de la isla: no salirse por los lados -----
    if (play && B.y < 6) {
      const enTunel = u < TUNEL.z0 + 20 && u > TUNEL.z1 - 20,
        enPuente = u < PUENTE_ISLA.z0 && u > PUENTE_ISLA.z1;
      const lim = (enTunel ? 7.4 : 7.2) - PV.hw;
      if ((enTunel || enPuente) && Math.abs(B.x) > lim) {
        B.x = Math.sign(B.x) * lim;
        B.v *= Math.pow(0.4, dt);
        shake = Math.max(shake, 0.2);
      }
    }

    // ----- minas de Saratalán -----
    const enMinas = cerca(-36530);
    animados.children.forEach((o) => {
      if (piedras.some((p) => p.m === o) || polvo.includes(o)) o.visible = enMinas;
    });
    if (enMinas) {
      if (golpeT > 0) golpeT -= dt;
      piedras.forEach((p) => {
        // cada piedra: espera, cae del cerro, rueda cruzando la carretera y se pierde al otro lado
        const ciclo = 9,
          k = ((t + p.f) % ciclo) / ciclo,
          m = p.m;
        let x, y;
        if (k < 0.3) {
          x = p.lado * 26;
          y = 30;
          m.visible = false;
        } else if (k < 0.5) {
          const q = (k - 0.3) / 0.2;
          x = p.lado * (26 - q * 12);
          y = 30 * (1 - q * q) + 1.6;
          m.visible = true;
        } else {
          const q = (k - 0.5) / 0.5;
          x = p.lado * (14 - q * 32);
          y = 1.6 + Math.abs(Math.sin(q * 9)) * 1.2 * (1 - q);
          m.visible = true;
        }
        m.position.set(x, y, p.z);
        m.rotation.x += dt * 4;
        m.rotation.z += dt * 3 * p.lado;
        const pz = CZ + p.z;
        if (play && m.visible && golpeT <= 0 && y < 4 && Math.abs(B.x - x) < 1.6 + PV.hw && Math.abs(B.z - pz) < 1.6 + PV.hl) {
          golpeT = 2;
          dmg += PV.crush ? 4 : 18;
          B.v *= 0.35;
          shake = 1;
          msg("🪨 ¡Te cayó una piedra encima!", 2200);
          if (dmg >= 100) {
            dmg = 100;
            end();
          }
        }
      });
      // explosión en la cantera cada 24 s
      const fase = (t % 24) / 24;
      polvo.forEach((sp, i) => {
        const q = Math.min(1, fase * 6 + sp.userData.k * 0.2);
        sp.position.set(-75 + Math.sin(i * 2.1) * q * 30, 10 + q * 40, -36500 + Math.cos(i * 1.7) * q * 30);
        sp.scale.setScalar(10 + q * 40);
        sp.material.opacity = fase < 0.25 ? 0.7 * (1 - q * 0.6) : Math.max(0, 0.4 - (fase - 0.25) * 2);
      });
      if (play && fase < 0.01 && Math.abs(u + 36500) < 700 && MINAS.voladura != Math.floor(t / 24)) {
        MINAS.voladura = Math.floor(t / 24);
        shake = Math.max(shake, 0.8);
        msg("💥 ¡KABOOM! Explosión en la cantera de Saratalán", 2200);
      }
      if (play && MINAS.avisos != cyc && u < MINAS.z0 + 60 && u > MINAS.z0) {
        MINAS.avisos = cyc;
        msg("☠ Minas de Saratalán: ¡cuidado con las piedras que caen!", 4000);
      }
      if (u < MINAS.z0 - 100 && u > MINAS.z1 + 100) MINAS.dentro = cyc; // pasó por adentro de las minas
      if (play && MINAS.premio != cyc && MINAS.dentro == cyc && u < MINAS.z1 && u > MINAS.z1 - 40) {
        MINAS.premio = cyc;
        cash += 10000;
        msg("⛏ ¡Saliste vivo de las Minas de Saratalán! +₡10 000", 4000);
      }
    }

    // ----- carros de las autopistas de los lados -----
    if (cerca(-41500))
      carrosLado.forEach((c) => {
        if (c.alto) {
          c.x += c.v * dt;
          if (c.x > 70) c.x = -70;
          if (c.x < -70) c.x = 70;
          c.o.position.set(c.x, 8.6, c.z);
        } else {
          c.u = (((c.u + c.v * dt) % 1000) + 1000) % 1000;
          c.o.position.set(c.x, 0, -41000 - c.u);
          // chocar con ellos (si manejás por la autopista de al lado)
          const wz = CZ - 41000 - c.u;
          if (play && Math.abs(B.x - c.x) < 1 + PV.hw && Math.abs(B.z - wz) < (c.o.userData.hl || 2.4) + PV.hl && golpeT <= 0) {
            golpeT = 1.5;
            dmg += 6 * PV.dm;
            B.v *= 0.4;
            shake = 0.7;
            msg("💥 ¡Choque en la autopista!", 1800);
          }
        }
      });
    if (golpeT > 0 && !enMinas) golpeT -= dt;
  };
})();
