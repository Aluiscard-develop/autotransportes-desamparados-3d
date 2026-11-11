// =====================================================================
// TRIKE AZUL (vehículo 32). Se carga después de js/mundo5.js (vehículo 31) y de js/tiendas.js.
// Un ultraligero azul con franjas amarillas, ala azul con el centro blanco y puntas amarillas, motor y hélice atrás.
// Vuela y maneja igual que el Ultraligero (trike) de siempre (vehículo 9): copia su manejo (PVS).
//   tubo()   · un tubo de un punto a otro (para el chasis, la horquilla, el mástil y la barra de control)
//   CUERPO   · la tina y la trompa azules, el asiento, el piloto y el motor
//   HÉLICE   · gira sola (js/juego/13-actualizar.js usa g.userData.pr)
//   ALA      · se ladea al doblar y se tuerce si se daña (g.userData.wing)
// Colores: cambiá AZUL, AZUL_OSCURO, AMARILLO, BLANCO… aquí abajo.
// =====================================================================
(function () {
  const AZUL = 0x1f5fd6,
    AZUL_OSCURO = 0x173f9a,
    AMARILLO = 0xffc61a,
    BLANCO = 0xf2f5f8,
    LLANTA = 0x1d1d1d,
    METAL = 0x9aa3ad,
    NEGRO = 0x222222,
    CROMO = { metalness: 0.8, roughness: 0.3 };
  const ARRIBA = new T.Vector3(0, 1, 0);

  // un tubo (caja delgada) que va del punto a al punto b
  function tubo(g, a, b, grosor, color, o) {
    const A = new T.Vector3(...a),
      B = new T.Vector3(...b),
      d = B.clone().sub(A),
      m = mm(grosor, d.length(), grosor, color, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, o);
    m.quaternion.setFromUnitVectors(ARRIBA, d.normalize());
    g.add(m);
    return m;
  }

  mkV(32, (g, w) => {
    // ===================== CUERPO =====================
    // el frente del trike es -z (hacia adelante) y la hélice queda atrás (+z)
    const c = new T.Group();
    const pieza = (...a) => {
      const m = mm(...a);
      c.add(m);
      return m;
    };
    pieza(1.05, 0.5, 1.7, AZUL, 0, 0.95, 0.05); // tina
    pieza(0.5, 0.2, 2.3, AZUL_OSCURO, 0, 0.62, -0.3); // quilla de abajo
    [-1, 1].forEach((s) => pieza(0.02, 0.14, 1.6, AMARILLO, s * 0.53, 1.02, 0.05)); // franjas amarillas de los lados
    pieza(0.85, 0.55, 0.7, AZUL, 0, 1.05, -1.05); // trompa
    pieza(0.87, 0.12, 0.72, AMARILLO, 0, 1.12, -1.05); // franja amarilla de la trompa
    pieza(0.75, 0.12, 0.6, AZUL_OSCURO, 0, 1.36, -0.95).rotation.x = 0.35;
    pieza(0.8, 0.6, 0.05, 0xbfe6ff, 0, 1.62, -0.72, { transparent: true, opacity: 0.45 }).rotation.x = 0.5; // parabrisas
    // asiento
    pieza(0.62, 0.18, 0.6, NEGRO, 0, 1.3, 0.25);
    pieza(0.62, 0.7, 0.14, NEGRO, 0, 1.65, 0.6);
    // piloto con casco amarillo de raya azul
    pieza(0.55, 0.7, 0.4, 0x263238, 0, 1.75, 0.3);
    pieza(0.42, 0.42, 0.42, AMARILLO, 0, 2.32, 0.28);
    pieza(0.1, 0.43, 0.43, AZUL, 0, 2.33, 0.28);
    pieza(0.34, 0.14, 0.05, 0x111111, 0, 2.34, 0.06);
    [-1, 1].forEach((s) => tubo(c, [s * 0.3, 1.95, 0.25], [s * 0.42, 2.4, -0.72], 0.14, 0x263238)); // brazos
    // horquilla de la llanta de adelante
    [-1, 1].forEach((s) => tubo(c, [s * 0.18, 0.36, -1.6], [s * 0.18, 1.0, -1.3], 0.07, METAL, CROMO));
    // eje y soportes de las llantas de atrás
    tubo(c, [-0.95, 0.42, 0.75], [0.95, 0.42, 0.75], 0.08, METAL, CROMO);
    [-1, 1].forEach((s) => tubo(c, [s * 0.45, 0.85, 0.4], [s * 0.85, 0.42, 0.75], 0.07, METAL, CROMO));
    // motor con aletas y escapes negros
    pieza(0.7, 0.55, 0.55, 0x8f979f, 0, 1.35, 1.0, CROMO);
    for (let i = 0; i < 3; i++) pieza(0.8, 0.04, 0.5, 0x6f777f, 0, 1.45 + i * 0.09, 1.0, CROMO);
    [-1, 1].forEach((s) => {
      tubo(c, [s * 0.3, 1.2, 0.8], [s * 0.42, 1.0, 1.45], 0.12, NEGRO);
    });
    pieza(0.2, 0.2, 0.3, NEGRO, 0, 1.35, 1.35); // eje de la hélice
    // mástil, tubo de adelante y barra de control (todo llega al punto del ala)
    const ALA = [0, 4.2, 0.15];
    tubo(c, [0, 1.6, 0.75], ALA, 0.11, METAL, CROMO);
    tubo(c, [0, 1.4, -1.25], ALA, 0.09, METAL, CROMO);
    [-1, 1].forEach((s) => tubo(c, ALA, [s * 0.75, 2.45, -0.75], 0.06, METAL, CROMO));
    tubo(c, [-0.75, 2.45, -0.75], [0.75, 2.45, -0.75], 0.07, NEGRO);
    fusionar(c); // todas las piezas quietas en pocas mallas (más liviano)
    g.add(c);
    g.add(lt(0, 1.05, -1.42)); // foco

    // ===================== LLANTAS (aros cromados) =====================
    [-0.95, 0.95].forEach((x) => wh(g, 0.42, 0.3, x, 0.42, 0.75, LLANTA, 0xd0d6dc, w));
    wh(g, 0.36, 0.24, 0, 0.36, -1.6, LLANTA, 0xd0d6dc, w);

    // ===================== HÉLICE =====================
    const pr = new T.Group();
    pr.add(mm(0.16, 1.9, 0.05, 0xc5ccd3, 0, 0, 0, CROMO), mm(0.18, 0.18, 0.14, NEGRO, 0, 0, 0.05));
    pr.position.set(0, 1.35, 1.55);
    g.add(pr);
    g.userData.pr = pr;

    // ===================== ALA =====================
    // ala delta azul vista desde arriba: punta adelante, puntas de las alas hacia atrás.
    // La vela va con la punta un poco levantada (como los ultraligeros de verdad), así desde atrás se ven los colores.
    const wg = new T.Group(),
      vela = new T.Group(),
      forma = new T.Shape();
    [
      [0, -1.7],
      [-3.8, 0.7],
      [-3.75, 1.1],
      [-1.5, 1.0],
      [0, 1.3],
      [1.5, 1.0],
      [3.75, 1.1],
      [3.8, 0.7],
    ].forEach(([x, z], i) => (i ? forma.lineTo(x, z) : forma.moveTo(x, z)));
    const tela = new T.Mesh(
      new T.ExtrudeGeometry(forma, { depth: 0.1, bevelEnabled: false }).rotateX(Math.PI / 2),
      new T.MeshStandardMaterial({ color: AZUL, roughness: 0.6, side: T.DoubleSide }),
    );
    tela.castShadow = tela.receiveShadow = true;
    vela.add(tela);
    // triángulo blanco en el centro, bordes azul oscuro y las puntas amarillas
    const centro = new T.Shape();
    [
      [0, -1.2],
      [-1.1, 0.6],
      [0, 1.15],
      [1.1, 0.6],
    ].forEach(([x, z], i) => (i ? centro.lineTo(x, z) : centro.moveTo(x, z)));
    const blanco = new T.Mesh(
      new T.ShapeGeometry(centro).rotateX(Math.PI / 2),
      new T.MeshStandardMaterial({ color: BLANCO, roughness: 0.6, side: T.DoubleSide }),
    );
    blanco.position.y = 0.012;
    vela.add(blanco);
    [-1, 1].forEach((s) => {
      tubo(vela, [0, 0.03, -1.7], [s * 3.8, 0.03, 0.7], 0.16, AZUL_OSCURO);
      tubo(vela, [0, -0.03, 1.3], [s * 1.5, -0.03, 1.0], 0.1, AZUL_OSCURO);
      tubo(vela, [s * 1.5, -0.03, 1.0], [s * 3.75, -0.03, 1.1], 0.1, AZUL_OSCURO);
      vela.add(mm(0.6, 0.02, 0.45, AMARILLO, s * 3.45, 0.012, 0.85)); // punta amarilla
    });
    tubo(vela, [0, -0.13, -1.6], [0, -0.13, 1.2], 0.08, METAL, CROMO); // quilla del ala
    tubo(vela, [0, 0, 0.1], [0, 0.6, 0.1], 0.05, METAL, CROMO); // poste de arriba
    [
      [-3.7, 0.7],
      [3.7, 0.7],
      [0, -1.6],
    ].forEach(([x, z]) => tubo(vela, [0, 0.6, 0.1], [x, 0.02, z], 0.02, NEGRO)); // cables
    fusionar(vela);
    vela.rotation.x = 0.18; // punta arriba
    wg.add(vela);
    wg.position.set(0, 4.3, 0.1);
    g.add(wg);
    g.userData.wing = wg;
  });

  // ===================== MANEJO, NOMBRE Y GARAJE =====================
  // el mismo manejo que el Ultraligero (trike) de siempre: vehículo 9 → PVS[9 - 3]
  PVS.push(Object.assign({}, PVS[6]));
  VN.push("Trike azul");
  VI.push("🪂");
  TUN.push({});
})();
