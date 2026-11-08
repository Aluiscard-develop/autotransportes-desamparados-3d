// =====================================================================
// MÁS MUNDO (zonas 24 a 31). Se carga después de js/mundo.js y usa sus herramientas (window.MUNDO).
// Busca estos títulos con Ctrl+F:
//   ZONA 24 · RUTA DE LA MUERTE    · Cerro de la Muerte: niebla, lomas, barandas, cruces y antenas
//   ZONA 25 · FLORENCIO DEL CASTILLO · autopista y el plantel de RECOPE con un incendio de 200 m de alto
//   ZONA 26 · PUNTARENAS           · playa, mar, muelle, crucero, ferrys, botes y hoteles
//   ZONA 27 · VOLCANES             · parques nacionales y volcanes (Poás, Irazú, Turrialba, Arenal)
//   ZONA 28 · CHICAGO              · rascacielos, torres negras, el "frijol", río y tren elevado
//   ZONA 29 · MINNESOTA            · nieve, lagos congelados, pinos, mall y torre de agua
//   ZONA 30 · NUEVA JERSEY         · peaje del Turnpike, puerto con grúas y barcos, refinería
//   ZONA 31 · PANAMÁ               · Canal de Panamá con esclusas y barcos, rascacielos
//   SUPER DIESEL                   · el vehículo nuevo (24)
//   TRÁFICO NUEVO                  · motos, pickups, cisternas, mezcladoras y grúas
// =====================================================================
(function () {
  const {
    caja, cilindro, piso, cartel, fachada, fusionar, deModelo, bandera, copia, compartir, mat, geoCaja,
    llamaTex, humoTex, NEGOCIOS, ZONAS_LOTE, COLORES_EDIFICIO, VIDRIO, LUZ, DER, IZQ, traila, busNuevo,
    camionBomberos, faros, planoTex,
  } = MUNDO;

  ZN.push(
    "Ruta de la Muerte · Cerro de la Muerte",
    "Autopista Florencio del Castillo · RECOPE",
    "Puntarenas · Muelle, ferrys y playas",
    "Parques nacionales · Volcanes",
    "Chicago",
    "Minnesota",
    "Nueva Jersey",
    "Panamá · Canal de Panamá",
  );
  // negocios a la orilla también en las zonas nuevas (probabilidad de que salga uno en cada lote)
  Object.assign(ZONAS_LOTE, { 25: 0.5, 26: 0.85, 28: 0.85, 29: 0.8, 30: 0.6, 31: 0.75 });
  // tramos sin árboles, casas ni negocios a la orilla
  EXRL.push([-26000, -27000], [-28000, -29000]); // izquierda: el mar de Puntarenas y el río de Chicago
  EXR.push([-25150, -25860]); // derecha: el plantel de RECOPE

  const G = new T.Group(); // escenario fijo de estas zonas (se funde al final)
  W(G);
  const Z = (g, x, z, ry = 0) => {
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    G.add(g);
    return g;
  };
  const torre = (x, z, w, h, d, c, g = G) => {
    const f = fachada(w, h, d, c);
    f.position.set(x, h / 2, z);
    g.add(f);
    caja(g, w + 0.4, 0.8, d + 0.4, 0x2b2f33, x, h + 0.4, z);
    return f;
  };
  const portico = (z, t, fondo = "#0a6e3a", letra = "#ffffff") => {
    const g = new T.Group();
    [-9, 9].forEach((x) => caja(g, 0.6, 7.4, 0.6, 0x8a8f94, x, 3.7, 0));
    caja(g, 18.6, 0.7, 0.7, 0x8a8f94, 0, 7.4, 0);
    cartel(g, t, 16, 2.2, fondo, letra, 0, 8.9, 0.4);
    cartel(g, t, 16, 2.2, fondo, letra, 0, 8.9, -0.4, Math.PI);
    return Z(g, 0, z);
  };
  const letrero = (x, z, t, fondo = "#f9a825", letra = "#111111", ancho = 4.6) => {
    const g = new T.Group();
    caja(g, 0.2, 3, 0.2, 0x777777, 0, 1.5, 0);
    cartel(g, t, ancho, 1.2, fondo, letra, 0, 3.4, 0.12);
    return Z(g, x, z);
  };
  // agua con olas (comparte la textura de olas del juego)
  const _agua = {};
  const agua = (w, d, x, z, color = 0x1f6fa8, y = 0.045) => {
    if (!_agua[color])
      _agua[color] = compartir(
        new T.MeshStandardMaterial({ color, roughness: 0.12, metalness: 0.25, normalMap: wNrm, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
      );
    const m = new T.Mesh(new T.PlaneGeometry(w, d), _agua[color]);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    G.add(m);
    return m;
  };
  // muchas copias de una pieza en una sola llamada de dibujo (con su caja de recorte bien calculada)
  const copias = (geo, material, lista, colores) => {
    const g = geo.clone(),
      im = new T.InstancedMesh(g, material, lista.length),
      m4 = new T.Matrix4(),
      q = new T.Quaternion(),
      e = new T.Euler(),
      box = new T.Box3();
    lista.forEach(([x, y, z, s = 1, ry = 0], i) => {
      m4.compose(new T.Vector3(x, y, z), q.setFromEuler(e.set(0, ry, 0)), new T.Vector3(s, s, s));
      im.setMatrixAt(i, m4);
      // siempre con color (blanco si no se da): un material compartido no puede mezclar copias con y sin color
      im.setColorAt(i, new T.Color(colores ? colores[i % colores.length] : 0xffffff));
      box.expandByPoint(new T.Vector3(x, y, z));
    });
    g.boundingSphere = box.getBoundingSphere(new T.Sphere());
    g.boundingSphere.radius += 30;
    im.castShadow = im.receiveShadow = true;
    G.add(im);
    return im;
  };
  const animados = new T.Group(); // lo que se mueve: no se funde
  W(animados);

  // ===================== ZONA 24 · RUTA DE LA MUERTE =====================
  // Niebla espesa, lomas grandes (RELIEVE en js/juego.js) y barandas que no dejan salirse.
  {
    portico(-24030, "RUTA DE LA MUERTE · CERRO DE LA MUERTE 3 451 m", "#3e2723", "#ffd54f");
    const avisos = ["⚠ NEBLINA DENSA", "⚠ CURVA PELIGROSA", "⚠ ZONA DE DERRUMBES", "MANEJE CON CUIDADO", "⚠ PENDIENTE FUERTE", "⚠ NO ADELANTE"];
    for (let i = 0; i < 12; i++) letrero(i % 2 ? -9.8 : 9.8, -24120 - i * 75, avisos[i % avisos.length]);
    // barandas de metal en tramos de 20 m (así siguen las lomas)
    for (let z = -24010; z > -25000; z -= 20)
      [-7.6, 7.6].forEach((x) => {
        caja(G, 0.25, 0.5, 20, 0xb0b5ba, x, 0.75, z - 10, { metalness: 0.6, roughness: 0.35 });
        caja(G, 0.15, 0.8, 0.15, 0x8a8f94, x, 0.4, z);
      });
    // cruces a la orilla
    for (let i = 0; i < 22; i++) {
      const g = new T.Group(),
        lado = i % 2 ? -1 : 1;
      caja(g, 0.18, 1.6, 0.18, 0xf2f2f2, 0, 0.8, 0);
      caja(g, 0.9, 0.16, 0.18, 0xf2f2f2, 0, 1.15, 0);
      caja(g, 0.5, 0.25, 0.5, pk_([0xe53935, 0xfdd835, 0x8e24aa]), 0.3, 0.12, 0.2);
      Z(g, lado * R(9.2, 10.5), -24060 - i * 42 - R(0, 20));
    }
    // matorrales del páramo
    const mats = [];
    for (let i = 0; i < 260; i++) {
      const lado = Math.random() < 0.5 ? -1 : 1;
      mats.push([lado * R(11, 120), 0.4, -24000 - R(0, 1000), R(0.6, 1.8)]);
    }
    copias(new T.IcosahedronGeometry(1, 0), mat(0xffffff, { flatShading: true }), mats, [0x6b7a3c, 0x8a7d4a, 0x55693a, 0x9a8a55]);
    // antenas en la cima
    [[-80, -24450], [95, -24700], [-120, -24850]].forEach(([x, z]) => {
      const g = new T.Group();
      for (let k = 0; k < 4; k++) caja(g, 0.4, 46, 0.4, 0xd0d0d0, k % 2 ? 1.5 : -1.5, 23, k < 2 ? 1.5 : -1.5);
      for (let y = 4; y < 46; y += 6) caja(g, 3.4, 0.25, 3.4, 0xc62828, 0, y, 0);
      caja(g, 0.8, 0.8, 0.8, 0xff2020, 0, 46.5, 0, LUZ(0xff2020));
      Z(g, x, z);
    });
    // soda con truchas
    const soda = new T.Group();
    caja(soda, 10, 3.6, 8, 0x8d6e63, 0, 1.8, 0);
    caja(soda, 11, 0.6, 9, 0x4e342e, 0, 3.9, 0);
    cartel(soda, "SODA DEL CERRO · TRUCHAS", 8, 1, "#4e342e", "#ffecb3", 0, 3, 4.05);
    Z(soda, 22, -24560, DER);
  }

  // ===================== ZONA 25 · FLORENCIO DEL CASTILLO · RECOPE =====================
  // Autopista con muro central. A la derecha, el plantel de RECOPE con un incendio gigantesco de 200 m.
  const RECOPE = { z: -25500, x: 95, fuego: 100, ciclo: -1, presa: [-25050, -25560], jugador: 0, fin: false };
  window.RECOPE = RECOPE; // para revisar desde la consola
  {
    portico(-25030, "AUTOPISTA FLORENCIO DEL CASTILLO · RUTA 2", "#0a6e3a");
    piso(G, 150, 720, 0x8d9094, 110, -25500, 0.02);
    caja(G, 0.3, 2.6, 700, 0xb0b5ba, 36, 1.3, -25500); // malla
    const entrada = new T.Group();
    caja(entrada, 0.6, 6, 0.6, 0x1b5e20, 0, 3, -5);
    caja(entrada, 0.6, 6, 0.6, 0x1b5e20, 0, 3, 5);
    caja(entrada, 0.6, 1.6, 11, 0x1b5e20, 0, 6.6, 0);
    cartel(entrada, "RECOPE · PLANTEL DE COMBUSTIBLES", 10, 1.4, "#1b5e20", "#ffffff", -0.35, 6.6, 0, -Math.PI / 2);
    Z(entrada, 36, -25200);
    // tanques
    const tanque = (x, z, r, h, quemado) => {
      const g = new T.Group(),
        c = quemado ? 0x2a2522 : 0xeceff1;
      cilindro(g, r, h, c, 0, h / 2, 0);
      const techo = new T.Mesh(compartir(new T.ConeGeometry(r * 1.02, 2.4, 24)), mat(quemado ? 0x1a1614 : 0xcfd8dc));
      techo.position.y = h + 1.2;
      g.add(techo);
      if (!quemado) {
        cilindro(g, r * 1.01, 1.2, 0x2e7d32, 0, h * 0.7, 0);
        cartel(g, "RECOPE", r * 1.2, r * 0.3, "#ffffff", "#1b5e20", 0, h * 0.45, r + 0.05);
      }
      return Z(g, x, z, DER);
    };
    for (const x of [62, 128])
      for (const z of [-25250, -25380, -25620, -25750]) tanque(x, z, 13, 15);
    tanque(95, -25250, 11, 13);
    tanque(95, -25750, 11, 13);
    tanque(RECOPE.x, RECOPE.z, 14, 16, true); // el que se quema
    // tuberías
    [-25315, -25685].forEach((z) => {
      const t = cilindro(G, 0.8, 90, 0x9e9e9e, 95, 2, z);
      t.rotation.z = Math.PI / 2;
    });
    const t2 = cilindro(G, 0.8, 600, 0x9e9e9e, 46, 2, -25500);
    t2.rotation.x = Math.PI / 2;
    // chimenea con antorcha
    cilindro(G, 1, 40, 0xb0b0b0, 160, 20, -25820);
    // cisternas, bomberos y ambulancias atendiendo
    for (let i = 0; i < 4; i++) {
      const c = cisterna();
      c.position.set(50, 0, -25800 - i * 10);
      c.rotation.y = Math.PI / 2;
      G.add(c);
    }
    for (let i = 0; i < 4; i++) {
      const c = camionBomberos();
      c.position.set(28 - (i % 2) * 6, 0, -25420 - i * 16);
      c.rotation.y = 0.4;
      G.add(c);
    }
    const amb = mkAmbulancia();
    amb.position.set(26, 0, -25560);
    G.add(amb);
  }
  // el incendio: columna de llamas hasta 200 m y humo hasta 450 m (se ve desde lejos)
  const recopeG = new T.Group(),
    rLlamas = [],
    rHumos = [];
  {
    const lm = new T.SpriteMaterial({ map: llamaTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    for (let i = 0; i < 110; i++) {
      const u = Math.pow(i / 110, 0.85),
        y = u * 200,
        ancho = 34 * (1 - u * 0.55),
        sp = new T.Sprite(lm);
      sp.userData = { x: R(-ancho, ancho) * 0.6, y, z: R(-ancho, ancho) * 0.6, t: R(26, 46) * (1 - u * 0.45), f: R(0, 6.3), v: R(3, 7) };
      recopeG.add(sp);
      rLlamas.push(sp);
    }
    for (let i = 0; i < 40; i++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0x262321, depthWrite: false, transparent: true, opacity: 0.6, fog: false }));
      sp.userData = { u: i / 40, x: R(-20, 20), z: R(-20, 20) };
      recopeG.add(sp);
      rHumos.push(sp);
    }
    const brillo = new T.Sprite(new T.SpriteMaterial({ map: gTex, color: 0xff6a10, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7, fog: false }));
    brillo.scale.setScalar(120);
    brillo.position.y = 40;
    recopeG.add(brillo);
    rLlamas.brillo = brillo;
    recopeG.position.set(RECOPE.x, 0, RECOPE.z);
    animados.add(recopeG);
  }

  // ===================== ZONA 26 · PUNTARENAS =====================
  // A la izquierda: arena, mar, muelle con crucero, ferrys y botes. A la derecha: hoteles.
  const ferrys = [],
    botes = [];
  {
    portico(-26030, "PUNTARENAS · PASEO DE LOS TURISTAS", "#00838f");
    piso(G, 40, 1000, 0xe8d39a, -28, -26500, 0.03);
    agua(1000, 1000, -548, -26500);
    // sombrillas y palmeras
    const COLS = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xff7043, 0x8e24aa];
    for (let i = 0; i < 34; i++) {
      const g = new T.Group(),
        c = COLS[i % COLS.length];
      caja(g, 0.1, 2.4, 0.1, 0xf2f2f2, 0, 1.2, 0);
      const s = new T.Mesh(compartir(new T.ConeGeometry(1.6, 0.7, 10)), mat(c));
      s.position.y = 2.5;
      g.add(s);
      caja(g, 0.9, 0.05, 1.9, COLS[(i + 2) % COLS.length], 1.2, 0.06, 0.3);
      Z(g, -R(16, 38), -26060 - i * 27);
    }
    for (let i = 0; i < 26; i++) {
      const g = new T.Group(),
        tronco = cilindro(g, 0.25, 7, 0x8d6e63, 0, 3.5, 0);
      tronco.rotation.z = R(-0.15, 0.15);
      for (let k = 0; k < 6; k++) {
        const h = caja(g, 0.5, 0.12, 3.6, 0x2e7d32, 0, 7, 0);
        h.rotation.set(0.35, (k * Math.PI) / 3, 0);
        h.translateZ(1.6);
      }
      Z(g, -R(10, 40), -26040 - i * 37);
    }
    // muelle
    caja(G, 240, 1, 10, 0x8b6b4a, -160, 2, -26450);
    for (let x = -45; x > -280; x -= 15) [-4.5, 4.5].forEach((d) => caja(G, 0.6, 4, 0.6, 0x5d4037, x, 0, -26450 + d));
    for (let x = -60; x > -280; x -= 30) {
      caja(G, 0.2, 5, 0.2, 0x555555, x, 4.5, -26455);
      caja(G, 0.6, 0.4, 0.6, 0xfff2c0, x, 7, -26455, LUZ(0xffe9a0));
    }
    const sm = new T.Group();
    cartel(sm, "MUELLE DE PUNTARENAS", 8, 1.2, "#5d4037", "#ffffff", 0, 4.6, 0);
    caja(sm, 0.3, 4, 0.3, 0x5d4037, -3, 2, 0);
    caja(sm, 0.3, 4, 0.3, 0x5d4037, 3, 2, 0);
    Z(sm, -44, -26450, IZQ);
    // crucero atracado
    const cr = new T.Group();
    caja(cr, 130, 12, 22, 0xf5f5f5, 0, 2, 0);
    caja(cr, 130.4, 2, 22.4, 0x0d47a1, 0, -3, 0);
    for (let k = 0; k < 4; k++) caja(cr, 100 - k * 14, 3.2, 18 - k, 0xffffff, -6 + k * 3, 9.6 + k * 3.2, 0);
    for (let k = 0; k < 5; k++) caja(cr, 98 - k * 12, 0.8, 18.2 - k, 0x4fc3f7, -6 + k * 3, 9.8 + k * 3.2, 0, VIDRIO);
    caja(cr, 8, 9, 6, 0xc62828, 30, 26, 0);
    cartel(cr, "CRUCERO DEL PACÍFICO", 40, 4, "#ffffff", "#0d47a1", 0, 4, 11.05);
    Z(cr, -200, -26478);
    // terminal de ferrys
    const tf = new T.Group();
    caja(tf, 18, 6, 12, 0x00838f, 0, 3, 0);
    cartel(tf, "TERMINAL DE FERRYS · PAQUERA · NARANJO", 14, 1.4, "#006064", "#ffffff", 0, 5, 6.05);
    caja(tf, 40, 1, 12, 0x9e9e9e, -26, 0.5, 0);
    Z(tf, -40, -26760, IZQ);
    // ferrys (se mueven) y botes (se mecen)
    const ferry = (texto, color) => {
      const g = new T.Group();
      caja(g, 60, 5, 16, color, 0, 1.2, 0);
      caja(g, 60.4, 1, 16.4, 0x263238, 0, -1.5, 0);
      caja(g, 30, 4, 12, 0xffffff, 6, 5.7, 0);
      caja(g, 30.2, 1.2, 12.2, 0x4fc3f7, 6, 6.2, 0, VIDRIO);
      caja(g, 10, 3, 9, 0xffffff, 10, 9.2, 0);
      cilindro(g, 1.2, 5, 0xffd600, 16, 11, 0);
      [-1, 1].forEach((q) => cartel(g, texto, 26, 2, "#ffffff", "#0d47a1", 4, 2.2, q * 8.05, q > 0 ? 0 : Math.PI));
      for (let k = 0; k < 6; k++) caja(g, 4, 1.4, 2, pk_([0xd62828, 0x1b4fa8, 0xf2f2f2, 0x333333]), -24 + k * 4.4, 4.4, 4);
      animados.add(g);
      return g;
    };
    ferrys.push(
      { g: ferry("FERRY PUNTARENAS · PAQUERA", 0x1565c0), z: -26760, f: 0, v: 0.045 },
      { g: ferry("FERRY PUNTARENAS · NARANJO", 0xc62828), z: -26860, f: 2, v: 0.035 },
    );
    for (let i = 0; i < 14; i++) {
      const g = new T.Group(),
        c = pk_([0xffffff, 0xe53935, 0x1e88e5, 0xfdd835, 0x43a047]);
      caja(g, 3, 1.2, 8, c, 0, 0.3, 0);
      caja(g, 2.2, 1.4, 2.6, 0xffffff, 0, 1.4, 0.8);
      if (i % 3 == 0) caja(g, 0.15, 9, 0.15, 0xdddddd, 0, 5, -1);
      g.position.set(-R(70, 600), 0, -26100 - R(0, 850));
      g.rotation.y = R(0, 6.3);
      animados.add(g);
      botes.push({ g, f: R(0, 6.3) });
    }
    // hoteles a la derecha
    const HOTELES = ["HOTEL PUNTARENAS", "HOTEL TORTUGA", "HOTEL PLAYA DORADA", "HOTEL EL FARO", "HOTEL ATARDECER", "HOTEL CARIBE", "HOTEL ISLA SAN LUCAS"];
    HOTELES.forEach((n, i) => {
      const h = R(22, 60),
        z = -26090 - i * 130,
        x = R(48, 60),
        w = 24,
        c = pk_([0xffe0b2, 0xb3e5fc, 0xf8bbd0, 0xfff9c4, 0xc8e6c9]);
      torre(x, z, 18, h, w, c);
      cartel(G, n, 16, 2, "#00838f", "#ffffff", x - 9.1, h - 2.4, z, DER);
      piso(G, 18, 26, 0x4fc3f7, x - 22, z, 0.04); // piscina
    });
  }

  // ===================== ZONA 27 · VOLCANES =====================
  const fumarolas = [];
  {
    portico(-27030, "PARQUES NACIONALES · VOLCANES DE COSTA RICA", "#33691e");
    const volcan = (x, z, r, h, tipo, nombre) => {
      const g = new T.Group(),
        rt = r * (tipo == "cono" ? 0.08 : 0.2),
        ge = new T.CylinderGeometry(rt, r, h, 28, 8, true),
        p = ge.attributes.position,
        col = [],
        c = new T.Color();
      for (let i = 0; i < p.count; i++) {
        const t = (p.getY(i) + h / 2) / h,
          n = 1 + 0.06 * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 7) * (1 - t);
        p.setX(i, p.getX(i) * n);
        p.setZ(i, p.getZ(i) * n);
        if (t < 0.35) c.setRGB(0.2, 0.36, 0.17);
        else if (t < 0.7) c.setRGB(0.32, 0.26, 0.2);
        else c.setRGB(0.22, 0.19, 0.18);
        col.push(c.r, c.g, c.b);
      }
      ge.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      ge.computeVertexNormals();
      const m = new T.Mesh(ge, compartir(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: T.DoubleSide })));
      m.position.y = h / 2 - 3;
      g.add(m);
      const cr = new T.Mesh(
        compartir(new T.CircleGeometry(rt * 0.95, 20)),
        tipo == "lago" ? mat(0x4fd1c5, { emissive: 0x0a5550, roughness: 0.1 }) : tipo == "dormido" ? mat(0x3a3330) : compartir(new T.MeshBasicMaterial({ color: 0xff6a10 })),
      );
      cr.rotation.x = -Math.PI / 2;
      cr.position.y = h - 4;
      g.add(cr);
      g.position.set(x, 0, z);
      G.add(g);
      // humo (o vapor) que sale del cráter
      for (let k = 0; k < 7; k++) {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: tipo == "lago" ? 0xffffff : tipo == "dormido" ? 0xcfcfcf : 0x7a7570, depthWrite: false, transparent: true, opacity: 0 }));
        animados.add(sp);
        fumarolas.push({ sp, x, z, y: h, k: k / 7, alto: tipo == "dormido" ? 90 : 220, ancho: rt });
      }
      if (tipo == "activo" || tipo == "cono") {
        const b = new T.Sprite(new T.SpriteMaterial({ map: gTex, color: 0xff5a10, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
        b.scale.setScalar(rt * 5 + 40);
        b.position.set(x, h, z);
        animados.add(b);
      }
      letrero(Math.sign(x) * 10.5, z + 60, nombre, "#33691e", "#ffffff", 6);
    };
    volcan(-250, -27300, 170, 170, "lago", "→ VOLCÁN POÁS");
    volcan(270, -27260, 180, 200, "activo", "→ VOLCÁN TURRIALBA");
    volcan(-290, -27800, 150, 260, "cono", "→ VOLCÁN ARENAL");
    volcan(300, -27820, 190, 210, "dormido", "→ VOLCÁN IRAZÚ");
    // estación de guardaparques y senderos
    const gp = new T.Group();
    caja(gp, 12, 4, 8, 0x795548, 0, 2, 0);
    const techo = caja(gp, 13.5, 0.5, 10, 0x33691e, 0, 4.6, 0);
    techo.rotation.x = 0.1;
    cartel(gp, "GUARDAPARQUES · SINAC", 9, 1, "#33691e", "#ffffff", 0, 3.3, 4.05);
    Z(gp, -24, -27150, IZQ);
    ["SENDERO AL CRÁTER", "P. N. BRAULIO CARRILLO", "P. N. TAPANTÍ", "P. N. CORCOVADO", "P. N. MANUEL ANTONIO", "P. N. RINCÓN DE LA VIEJA"].forEach((t, i) =>
      letrero(i % 2 ? 10.5 : -10.5, -27350 - i * 100, t, "#5d4037", "#ffffff", 5.5),
    );
    // catarata
    const ct = new T.Group();
    caja(ct, 30, 34, 10, 0x6d6d6d, 0, 17, 0);
    const cae = caja(ct, 7, 32, 0.5, 0xbfe8ff, 0, 17, 5.3, { emissive: 0x335577, transparent: true, opacity: 0.85 });
    cae.castShadow = false;
    piso(ct, 22, 14, 0x4fa3d1, 0, 13, 0.05);
    cartel(ct, "CATARATA LA PAZ", 7, 1, "#33691e", "#ffffff", -9, 3, 12);
    Z(ct, 70, -27560, DER);
  }

  // ===================== ZONA 28 · CHICAGO =====================
  let trenL;
  {
    portico(-28030, "BIENVENIDOS A CHICAGO", "#0b2a4a", "#ff5252");
    piso(G, 190, 1000, 0x8f9296, 105, -28500, 0.015);
    for (let k = 0; k < 10; k++) piso(G, 190, 12, 0x34373c, 105, -28050 - k * 100, 0.025);
    for (let k = 0; k < 9; k++) {
      const zb = -28100 - k * 100;
      if (k != 0) {
        torre(58, zb + 21, 20, R(40, 110), 36, pk_(COLORES_EDIFICIO));
        torre(58, zb - 21, 20, R(40, 110), 36, pk_(COLORES_EDIFICIO));
      }
      if (k != 2 && k != 6) torre(95, zb, 26, R(80, 170), 70, pk_(COLORES_EDIFICIO));
      torre(140, zb, 30, R(60, 150), 80, pk_(COLORES_EDIFICIO));
      // al otro lado del río
      torre(-110, zb + 20, 22, R(60, 160), 36, pk_(COLORES_EDIFICIO));
      torre(-110, zb - 20, 22, R(60, 160), 36, pk_(COLORES_EDIFICIO));
      torre(-150, zb, 28, R(80, 190), 80, pk_(COLORES_EDIFICIO));
    }
    // torre negra de tubos (como la Willis) y torre negra afinada con antenas (como la Hancock)
    {
      const g = new T.Group(),
        alto = [180, 250, 210, 230, 260, 200, 170, 240, 190];
      alto.forEach((h, i) => torre(((i % 3) - 1) * 12, (Math.floor(i / 3) - 1) * 12, 12, h, 12, 0x2a2d31, g));
      [-4, 4].forEach((x) => cilindro(g, 0.6, 50, 0xdddddd, x, 285, 0));
      Z(g, 95, -28700);
      const h2 = new T.Group(),
        cuerpo = new T.Mesh(compartir(new T.CylinderGeometry(15, 24, 200, 4)), fachada(1, 1, 1, 0x2a2d31).material);
      cuerpo.rotation.y = Math.PI / 4;
      cuerpo.position.y = 100;
      h2.add(cuerpo);
      [-4, 4].forEach((x) => cilindro(h2, 0.6, 40, 0xdddddd, x, 220, 0));
      Z(h2, 95, -28300);
    }
    // parque con el "frijol" de acero
    piso(G, 50, 80, 0x4f8a3a, 38, -28100, 0.03);
    const frijol = new T.Mesh(compartir(new T.SphereGeometry(5, 32, 20)), compartir(new T.MeshStandardMaterial({ color: 0xe8eef2, metalness: 1, roughness: 0.04, envMap: ENV })));
    frijol.scale.set(2.1, 1, 1.4);
    frijol.position.set(36, 4.6, -28100);
    G.add(frijol);
    // río de Chicago con lanchas de paseo
    agua(36, 1000, -62, -28500, 0x2e6e6a);
    caja(G, 2, 2, 1000, 0x9e9e9e, -43, 0.5, -28500);
    caja(G, 2, 2, 1000, 0x9e9e9e, -81, 0.5, -28500);
    for (let i = 0; i < 4; i++) {
      const g = new T.Group();
      caja(g, 5, 1.6, 18, 0xf5f5f5, 0, 0.4, 0);
      caja(g, 4.6, 1.2, 10, 0x1e88e5, 0, 1.8, 0);
      g.position.set(-62 + (i % 2 ? 7 : -7), 0, -28150 - i * 230);
      animados.add(g);
      botes.push({ g, f: i, rio: true });
    }
    // tren elevado "L" por la izquierda
    caja(G, 6, 0.8, 1000, 0x5d4037, -24, 8, -28500);
    for (let z = -28010; z > -29000; z -= 25) caja(G, 1.2, 8, 1.2, 0x5d4037, -24, 4, z);
    trenL = new T.Group();
    for (let i = 0; i < 5; i++) {
      caja(trenL, 2.8, 3.2, 14, 0xb0b8c0, 0, 1.8, i * 14.6, { metalness: 0.7, roughness: 0.3 });
      caja(trenL, 2.84, 0.9, 12, 0x9fc4e8, 0, 2.2, i * 14.6, { emissive: 0x335577 });
      caja(trenL, 2.86, 0.3, 14, 0xc62828, 0, 0.9, i * 14.6);
    }
    trenL.position.set(-24, 8.6, -28500);
    animados.add(trenL);
  }

  // ===================== ZONA 29 · MINNESOTA =====================
  let nieve;
  {
    portico(-29030, "MINNESOTA · TIERRA DE LOS 10 000 LAGOS", "#0d47a1");
    piso(G, 392, 1000, 0xf4f8fb, 205, -29500, 0.02);
    piso(G, 392, 1000, 0xf4f8fb, -205, -29500, 0.02);
    [-8.6, 8.6].forEach((x) => caja(G, 1.4, 0.6, 1000, 0xffffff, x, 0.3, -29500));
    // lagos congelados con casitas de pesca
    const lagos = [[-130, -29300, 70], [160, -29720, 90], [-150, -29820, 60]];
    lagos.forEach(([x, z, r]) => {
      const m = new T.Mesh(compartir(new T.CircleGeometry(r, 40)), mat(0xcfe8f5, { roughness: 0.15, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.04, z);
      G.add(m);
      for (let k = 0; k < 4; k++) caja(G, 2.4, 2, 3, pk_([0xc62828, 0x1565c0, 0x2e7d32, 0xf9a825]), x + R(-r / 2, r / 2), 1, z + R(-r / 2, r / 2));
    });
    // pinos nevados
    const pinos = [];
    for (let i = 0; i < 220; i++) {
      const lado = Math.random() < 0.5 ? -1 : 1,
        x = lado * R(14, 260),
        z = -29000 - R(0, 1000);
      if (lagos.some(([lx, lz, r]) => Math.hypot(x - lx, z - lz) < r + 6) || (x > 70 && x < 200 && z < -29230 && z > -29380)) continue;
      pinos.push([x, 0, z, R(0.8, 1.6)]);
    }
    copias(new T.ConeGeometry(2.6, 9, 7).translate(0, 4.5, 0), mat(0x1b4d2e, { flatShading: true }), pinos);
    copias(new T.ConeGeometry(1.7, 3.6, 7).translate(0, 7.8, 0), mat(0xffffff, { flatShading: true }), pinos);
    // mall gigante y torre de agua
    const mall = new T.Group();
    caja(mall, 70, 22, 150, 0xd7ccc8, 0, 11, 0);
    caja(mall, 72, 1.4, 152, 0x6d4c41, 0, 22.6, 0);
    cartel(mall, "MEGA MALL · MINNESOTA", 40, 5, "#0d47a1", "#ffffff", 0, 16, 75.05);
    Z(mall, 135, -29300, DER);
    piso(G, 30, 150, 0x3b3e44, 82, -29300, 0.03);
    for (let i = 0; i < 12; i++) {
      const c = mkCar();
      c.rotation.y = Math.PI / 2;
      c.position.set(i % 2 ? 76 : 88, 0, -29240 - i * 10);
      G.add(c);
    }
    const ta = new T.Group();
    for (let k = 0; k < 4; k++) caja(ta, 0.6, 26, 0.6, 0x90a4ae, k % 2 ? 4 : -4, 13, k < 2 ? 4 : -4);
    const tk = new T.Mesh(compartir(new T.SphereGeometry(8, 20, 14)), mat(0x90caf9));
    tk.position.y = 32;
    tk.scale.y = 0.8;
    ta.add(tk);
    cartel(ta, "MINNESOTA", 12, 2, "#0d47a1", "#ffffff", 0, 32, 8.05);
    Z(ta, -60, -29560, IZQ);
    // copos de nieve que caen alrededor del jugador
    const n = 1400,
      pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([R(-70, 70), R(0, 40), R(-90, 30)], i * 3);
    const ge = new T.BufferGeometry();
    ge.setAttribute("position", new T.BufferAttribute(pos, 3));
    nieve = new T.Points(ge, new T.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false }));
    nieve.visible = false;
    nieve.frustumCulled = false;
    sc.add(nieve);
  }

  // ===================== ZONA 30 · NUEVA JERSEY =====================
  {
    portico(-30030, "BIENVENIDOS A NUEVA JERSEY · NEW JERSEY TURNPIKE", "#0a3d62");
    // peaje del Turnpike
    const pj = new T.Group();
    caja(pj, 34, 0.9, 12, 0xeceff1, 0, 6.6, 0);
    caja(pj, 34.2, 0.4, 12.2, 0x0a3d62, 0, 6.05, 0);
    [-13, 13].forEach((x) => [-4.5, 4.5].forEach((z) => caja(pj, 0.8, 6, 0.8, 0x888888, x, 3, z)));
    [-3.5, 3.5].forEach((x) => {
      caja(pj, 1, 0.3, 14, 0xf2c200, x, 0.15, 0);
      caja(pj, 0.9, 2.6, 2.6, 0xe8ecef, x, 1.6, 0);
    });
    cartel(pj, "PEAJE · NEW JERSEY TURNPIKE", 18, 1.6, "#0a3d62", "#ffffff", 0, 6.6, 6.05);
    Z(pj, 0, -30200);
    // bahía y puerto con grúas, barcos y contenedores
    agua(700, 1000, 500, -30500, 0x2a5f7a);
    piso(G, 60, 900, 0xa1a1a1, 120, -30500, 0.03);
    for (let i = 0; i < 5; i++) {
      const g = new T.Group(),
        z = -30150 - i * 170;
      [-6, 6].forEach((d) => [-8, 8].forEach((x) => caja(g, 1.2, 30, 1.2, 0x1565c0, x, 15, d)));
      caja(g, 18, 3, 14, 0x1565c0, 0, 31, 0);
      caja(g, 60, 2, 3, 0x1565c0, 30, 33, 0);
      caja(g, 6, 4, 6, 0xf5f5f5, 0, 35, 0);
      Z(g, 130, z);
    }
    const contenedores = [],
      colores = [0xd62828, 0x1b4fa8, 0x2e7d32, 0xf2b400, 0xef6c00, 0x6a1b9a, 0x9e9e9e, 0x00838f];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 30; j++) for (let h = 0; h < 3; h++) if (Math.random() < 0.75 - h * 0.2) contenedores.push([96 + i * 3, 1.3 + h * 2.6, -30100 - j * 27]);
    // dos barcos de carga atracados, con contenedores encima
    [-30300, -30700].forEach((z) => {
      const g = new T.Group();
      caja(g, 30, 12, 190, 0x37474f, 0, 3, 0);
      caja(g, 30.4, 2, 190.4, 0xc62828, 0, -3, 0);
      caja(g, 26, 14, 16, 0xf5f5f5, 0, 16, 80);
      Z(g, 182, z);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) for (let h = 0; h < 2; h++) contenedores.push([171 + i * 3, 10.3 + h * 2.6, z - 75 + j * 12.5]);
    });
    copias(new T.BoxGeometry(2.5, 2.6, 12), mat(0xffffff, { roughness: 0.6 }), contenedores, colores);
    // refinería a la izquierda
    for (let i = 0; i < 8; i++) {
      const g = new T.Group(),
        r = R(8, 13),
        h = R(10, 16);
      cilindro(g, r, h, 0xe0e0e0, 0, h / 2, 0);
      Z(g, -R(50, 150), -30100 - i * 105);
    }
    for (let i = 0; i < 4; i++) {
      cilindro(G, 1.2, 45, 0xb0b0b0, -170, 22, -30200 - i * 200);
      caja(G, 2.6, 1.4, 2.6, 0xd62828, -170, 40, -30200 - i * 200);
    }
    // a lo lejos, los rascacielos de Manhattan
    for (let i = 0; i < 26; i++) torre(-R(330, 420), -30050 - i * 37, R(18, 30), R(80, 240), R(18, 30), pk_(COLORES_EDIFICIO));
  }

  // ===================== ZONA 31 · PANAMÁ =====================
  const barcosCanal = [];
  {
    portico(-31030, "BIENVENIDOS A PANAMÁ · CANAL DE PANAMÁ", "#d21034");
    agua(90, 1000, 100, -31500, 0x2a6f7a);
    [53, 147].forEach((x) => caja(G, 4, 6, 1000, 0xb0b0b0, x, 1, -31500));
    // compuertas de las esclusas
    [-31280, -31720].forEach((z) => {
      [-1, 1].forEach((q) => {
        const p = caja(G, 46, 9, 2.4, 0x37474f, 100 + q * 22.5, 3, z);
        p.rotation.y = q * 0.25;
      });
      caja(G, 90, 1.2, 4, 0x9e9e9e, 100, 7, z - 4);
    });
    const ctl = new T.Group();
    caja(ctl, 10, 16, 10, 0xeceff1, 0, 8, 0);
    caja(ctl, 11, 3, 11, 0x4fc3f7, 0, 17, 0, VIDRIO);
    cartel(ctl, "ESCLUSAS DE MIRAFLORES", 9, 1.4, "#d21034", "#ffffff", 0, 13, 5.05);
    Z(ctl, 35, -31500, DER);
    // barcos que cruzan el canal
    const barco = (c) => {
      const g = new T.Group();
      caja(g, 26, 10, 120, c, 0, 2, 0);
      caja(g, 26.4, 2, 120.4, 0xc62828, 0, -3, 0);
      caja(g, 22, 12, 14, 0xf5f5f5, 0, 13, 48);
      for (let j = 0; j < 8; j++) for (let h = 0; h < 2; h++) caja(g, 20, 2.6, 11, pk_([0xd62828, 0x1b4fa8, 0x2e7d32, 0xf2b400, 0xef6c00]), 0, 8.3 + h * 2.6, -42 + j * 11.5);
      animados.add(g);
      return g;
    };
    barcosCanal.push({ g: barco(0x263238), f: 0 }, { g: barco(0x1b5e20), f: 3.1 });
    // la Ciudad de Panamá: rascacielos y la torre que se tuerce
    for (let i = 0; i < 18; i++) torre(-R(55, 150), -31060 - i * 52, R(18, 26), R(60, 200), R(18, 26), pk_(COLORES_EDIFICIO));
    const tt = new T.Group();
    for (let k = 0; k < 30; k++) {
      const f = caja(tt, 18, 6.4, 18, 0xdfe7ee, 0, 3.2 + k * 6.6, 0);
      f.rotation.y = k * 0.09;
    }
    Z(tt, -40, -31850);
    for (let i = 0; i < 10; i++) {
      bandera(G, "Panamá", 11, -31100 - i * 85);
      bandera(G, "Panamá", -11, -31140 - i * 85);
    }
  }

  // ===================== SUPER DIESEL (vehículo 24) =====================
  const humoDiesel = [];
  mkV(24, (g, w) => {
    const c = 0x0d47a1,
      cromo = { metalness: 0.95, roughness: 0.15 };
    g.add(
      mm(2.6, 1.6, 3.2, c, 0, 1.6, -3.1), // capó largo
      mm(2.7, 3, 3.4, c, 0, 2.5, 0.2), // cabina
      mm(2.7, 3.4, 2.4, c, 0, 2.7, 3.1), // dormitorio
      mm(2.4, 1.2, 0.2, 0xdddddd, 0, 1.5, -4.75, cromo), // parrilla
      mm(2.9, 0.4, 0.5, 0xdddddd, 0, 0.75, -4.9, cromo), // defensa
      mm(2.5, 1.1, 0.1, 0x9fc4e8, 0, 3.2, -1.52, { transparent: true, opacity: 0.6 }),
      mm(2.3, 0.5, 10.6, 0x222222, 0, 0.7, 0),
      mm(2.72, 0.35, 6.2, 0xff6f00, 0, 2.1, 1.3), // franja de fuego
      mm(2.8, 0.2, 2.4, 0xdddddd, 0, 1.2, 5.2, cromo),
      lt(-0.95, 1.6, -4.8),
      lt(0.95, 1.6, -4.8),
    );
    [-1, 1].forEach((q) => {
      const t = mm(0.35, 5.6, 0.35, 0xdddddd, q * 1.45, 3.9, -1.3, cromo); // escapes altos
      g.add(t, mm(0.3, 0.6, 2.4, 0xdddddd, q * 1.45, 1, -1.6, cromo));
      wh(g, 0.62, 0.45, q * 1.1, 0.62, -3.2, 0x151515, 0xdddddd, w);
      wh(g, 0.62, 0.45, q * 1.1, 0.62, 2.4, 0x151515, 0xdddddd, w);
      wh(g, 0.62, 0.45, q * 1.1, 0.62, 3.9, 0x151515, 0xdddddd, w);
    });
    for (let i = 0; i < 12; i++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0x222222, depthWrite: false, transparent: true, opacity: 0 }));
      sp.userData = { q: i % 2 ? 1 : -1, u: i / 12 };
      g.add(sp);
      humoDiesel.push(sp);
    }
  });
  PVS.push(
    Object.assign({}, PVS[9], {
      acc: 14, max: 52, off: 16, od: 0.3, br: 26, hl: 4.9, hw: 1.35, cd: 16, ch: 6.4, dm: 0.3, cr: 0.7,
      crush: 1, s: [-0.6, 3.2, -0.6], hz: -4.8, hr: 0.5, ez: -3.2, i: 520, r: 1700, c: 6,
    }),
  );
  VN.push("Super Diesel");
  VI.push("🚛");
  TUN.push({});

  // ===================== TRÁFICO NUEVO =====================
  function cisterna() {
    return deModelo("cisterna", () => {
      const g = new T.Group();
      caja(g, 2.5, 2.9, 2.8, 0x1b5e20, 0, 2.05, -7.9);
      caja(g, 2.4, 1.3, 1.6, 0x1b5e20, 0, 1.25, -9.9);
      caja(g, 2.52, 1, 0.1, 0x9fc4e8, 0, 2.7, -9.32, VIDRIO);
      caja(g, 2.2, 0.5, 19.4, 0x222222, 0, 0.75, -0.5);
      const t = cilindro(g, 1.35, 13, 0xeceff1, 0, 2.5, 1.8);
      t.rotation.x = Math.PI / 2;
      [-1, 1].forEach((q) => cartel(g, "COMBUSTIBLE · INFLAMABLE", 9, 0.8, "#ffffff", "#c62828", q * 1.37, 2.5, 1.8, (q * Math.PI) / 2));
      faros(g, 0.85, 1, -10.71);
      wr(g, [[-1.1, -9.4], [1.1, -9.4], [-1.1, -7], [1.1, -7], [-1.1, 6.6], [1.1, 6.6], [-1.1, 8], [1.1, 8]], 0.55);
      g.userData.hl = 10;
      return sh(g);
    });
  }
  const moto = () => {
    const c = pk_([0xd62828, 0x111111, 0x1565c0, 0xf9a825]);
    return deModelo("moto" + c, () => {
      const g = new T.Group();
      caja(g, 0.5, 0.6, 1.7, c, 0, 0.8, 0);
      caja(g, 0.45, 0.8, 0.5, 0x263238, 0, 1.45, 0.15); // conductor
      const casco = new T.Mesh(compartir(new T.SphereGeometry(0.28, 10, 8)), mat(c));
      casco.position.set(0, 2.05, 0);
      g.add(casco);
      faros(g, 0, 0.95, -0.9);
      wr(g, [[0, -0.75], [0, 0.75]], 0.33);
      g.userData.hl = 1.1;
      return sh(g);
    });
  };
  const pickup = () => {
    const c = pk_([0xf2f2f2, 0x37474f, 0xb71c1c, 0x1565c0, 0x6d4c41]);
    return deModelo("pickup" + c, () => {
      const g = new T.Group();
      caja(g, 2.1, 1, 5.4, c, 0, 1.05, 0);
      caja(g, 2, 0.9, 2.2, c, 0, 1.95, -0.6);
      caja(g, 2.02, 0.6, 2, 0x223344, 0, 2, -0.6, VIDRIO);
      caja(g, 1.9, 0.5, 2.2, 0x333333, 0, 1.6, 1.5);
      faros(g, 0.7, 1.1, -2.72);
      wr(g, [[-0.95, -1.7], [0.95, -1.7], [-0.95, 1.7], [0.95, 1.7]], 0.42);
      g.userData.hl = 2.7;
      return sh(g);
    });
  };
  const mezcladora = () =>
    deModelo("mezcladora", () => {
      const g = new T.Group();
      caja(g, 2.4, 2.6, 2.4, 0xf2f2f2, 0, 1.9, -3.4);
      caja(g, 2.2, 0.5, 9, 0x222222, 0, 0.7, -0.3);
      const t = new T.Mesh(compartir(new T.CylinderGeometry(1.1, 1.5, 5.4, 14)), mat(0xef6c00));
      t.rotation.x = Math.PI / 2 - 0.25;
      t.position.set(0, 2.5, 1);
      g.add(t);
      faros(g, 0.8, 1, -4.62);
      wr(g, [[-1.05, -3.3], [1.05, -3.3], [-1.05, 1.6], [1.05, 1.6], [-1.05, 2.9], [1.05, 2.9]], 0.5);
      g.userData.hl = 4.8;
      return sh(g);
    });
  const grua = () =>
    deModelo("grua", () => {
      const g = new T.Group();
      caja(g, 2.3, 2.2, 2.4, 0xf9a825, 0, 1.7, -1.6);
      caja(g, 2.2, 0.8, 4.2, 0x37474f, 0, 1, 1.4);
      const b = caja(g, 0.3, 0.3, 3.4, 0x37474f, 0, 2.6, 2);
      b.rotation.x = 0.5;
      caja(g, 1.6, 0.25, 0.4, 0xff9800, 0, 2.9, -1.4, LUZ(0xff9800));
      faros(g, 0.75, 1, -2.82);
      wr(g, [[-1, -1.8], [1, -1.8], [-1, 2], [1, 2]], 0.45);
      g.userData.hl = 3.6;
      return sh(g);
    });
  const vehAntes = window.vehNuevo;
  window.vehNuevo = function (zz) {
    const r = Math.random();
    if (zz >= 22 && zz <= 25 && RECOPE.fuego > 0) {
      if (r < 0.1) return camionBomberos();
      if (r < 0.15) return mkAmbulancia();
      if (r < 0.25) return cisterna();
    }
    if (zz == 16) return null;
    if (r < 0.06) return moto();
    if (r < 0.12) return pickup();
    if (r < 0.15) return cisterna();
    if (r < 0.17) return mezcladora();
    if (r < 0.19) return grua();
    return vehAntes(zz);
  };

  // fundir el escenario fijo por zona (cada zona en su grupo, para que se recorte lo que no se ve)
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
  let reloj = 0,
    zAnt = 0,
    avisoRecope = -1;
  window.objetivoAgua = () =>
    PV.bomberos && RECOPE.fuego > 0 && Math.abs(B.z - (wo.position.z + RECOPE.z)) < 140 ? { x: RECOPE.x, z: wo.position.z + RECOPE.z } : null;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const t = reloj,
      play = state == "play";
    if (Math.abs(B.z - zAnt) > 30) RECOPE.ciclo = -2; // reinicio desde el menú
    zAnt = B.z;
    // ----- RECOPE -----
    if (RECOPE.ciclo != cyc) {
      RECOPE.ciclo = cyc;
      RECOPE.fuego = 100;
      RECOPE.jugador = 0;
      RECOPE.fin = false;
    }
    const i = JAM.indexOf(RECOPE.presa);
    if (RECOPE.fuego > 0 && i < 0) JAM.push(RECOPE.presa);
    if (RECOPE.fuego <= 0 && i >= 0) JAM.splice(i, 1);
    const fz = wo.position.z + RECOPE.z,
      f = Math.max(0, RECOPE.fuego) / 100,
      cerca = Math.abs(B.z - fz) < 2600 && !MONT.on;
    recopeG.visible = cerca;
    if (cerca) {
      rLlamas.forEach((sp) => {
        const u = sp.userData,
          k = f > 0 ? (0.3 + 0.7 * f) * (0.8 + 0.3 * Math.sin(t * u.v + u.f)) : 0;
        sp.visible = k > 0 && u.y <= 200 * (0.15 + 0.85 * f);
        sp.scale.setScalar(u.t * k);
        sp.position.set(u.x + Math.sin(t * 0.7 + u.f) * 3, u.y + Math.sin(t * u.v) * 3, u.z);
      });
      rLlamas.brillo.visible = f > 0;
      rLlamas.brillo.material.opacity = 0.2 + 0.3 * f;
      rHumos.forEach((sp) => {
        const u = sp.userData,
          q = (u.u + t * 0.02) % 1;
        sp.position.set(u.x + q * 160, 120 + q * 330, u.z - q * 40);
        sp.scale.setScalar(50 + q * 130);
        sp.material.opacity = (f > 0 ? 0.75 : 0.25) * (1 - q);
        sp.material.color.setHex(f > 0 ? 0x262321 : 0xd0d0d0);
      });
    }
    if (play && !MONT.on) {
      if (RECOPE.fuego > 0 && B.z - fz < 900 && B.z - fz > 300 && avisoRecope != cyc) {
        avisoRecope = cyc;
        msg(PV.bomberos ? "🚒 ¡Incendio gigante en RECOPE! Acercate y mantené F para echar agua" : "🔥 ¡INCENDIO GIGANTESCO en el plantel de RECOPE: llamas de 200 m!", 4500);
      }
      if (PV.bomberos && (keys.KeyF || keys.TF) && RECOPE.fuego > 0 && Math.abs(B.z - fz) < 140 && B.x > 0) {
        RECOPE.fuego -= 1.2 * dt;
        RECOPE.jugador += dt;
        if (Math.random() < dt * 0.6) msg("🚒 ¡Apagando RECOPE! " + Math.max(0, Math.ceil(RECOPE.fuego)) + "% de fuego", 1200);
      }
      // meterse al fuego del plantel quema
      if (RECOPE.fuego > 0 && Math.hypot(B.x - RECOPE.x, B.z - fz) < 32) {
        dmg += 25 * dt;
        B.v *= Math.pow(0.35, dt);
        if (dmg >= 100) end();
      }
    }
    if (RECOPE.fuego <= 0 && !RECOPE.fin) {
      RECOPE.fin = true;
      if (RECOPE.jugador > 3) {
        cash += 50000;
        msg("🚒 ¡APAGASTE EL INCENDIO DE RECOPE! +₡50 000", 5000);
      } else msg("🚒 Los bomberos apagaron el incendio de RECOPE", 4000);
    }
    // ----- barcos, ferrys, trenes y volcanes -----
    const enZona = (k) => Math.abs(B.z - (wo.position.z - k * 1000 - 500)) < 1800;
    if (enZona(26) || enZona(28))
      for (const b of botes) {
        b.g.position.y = Math.sin(t * 1.3 + b.f) * 0.25;
        b.g.rotation.z = Math.sin(t * 0.9 + b.f) * 0.05;
        if (b.rio) b.g.position.z = -28500 + ((((t * 6 + b.f * 230) % 960) + 960) % 960) - 480;
      }
    if (enZona(26))
      ferrys.forEach((fe) => {
        const u = Math.sin(t * fe.v + fe.f);
        fe.g.position.set(-480 + u * 400, Math.sin(t + fe.f) * 0.2, fe.z);
      });
    if (enZona(28)) trenL.position.z = -28500 + 400 * Math.sin(t * 0.05);
    if (enZona(31)) barcosCanal.forEach((b, k) => b.g.position.set(100 + (k ? 18 : -18), 0, -31500 + 380 * Math.sin(t * 0.012 + b.f)));
    if (enZona(27))
      fumarolas.forEach((h) => {
        const q = (h.k + t * 0.03) % 1;
        h.sp.position.set(h.x + q * h.ancho * 1.5, h.y + q * h.alto, h.z);
        h.sp.scale.setScalar(h.ancho * 0.8 + q * h.ancho * 2.5);
        h.sp.material.opacity = 0.6 * Math.sin(q * Math.PI);
      });
    // nieve en Minnesota
    nieve.visible = !MONT.on && zoneAt(B.z) == 29;
    if (nieve.visible) {
      const p = nieve.geometry.attributes.position;
      for (let k = 0; k < p.count; k++) {
        let y = p.getY(k) - dt * (3 + (k % 5));
        if (y < 0) y += 40;
        p.setY(k, y);
      }
      p.needsUpdate = true;
      nieve.position.set(B.x, 0, B.z);
    }
    // humo negro del Super Diesel (más humo al acelerar)
    if (skin == 24) {
      const fuerte = keys.ArrowUp || keys.KeyW || keys.TG ? 1 : 0.35;
      humoDiesel.forEach((sp) => {
        const u = sp.userData,
          q = (u.u + t * 1.2) % 1;
        sp.position.set(u.q * 1.45 + q * 0.5, 6.8 + q * 4, -1.3 + q * 3);
        sp.scale.setScalar(0.6 + q * 2.6);
        sp.material.opacity = 0.55 * fuerte * (1 - q);
      });
    }
  };
})();
