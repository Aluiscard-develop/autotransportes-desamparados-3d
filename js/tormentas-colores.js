// =====================================================================
// GENERADOR DE TORMENTAS y TORMENTAS DE COLORES. Se carga después de js/comida-nueva.js.
// La computadora de la casa (js/condominio.js) escribe un código y llama GENERADOR.usar(código):
// la Máquina Generadora de Tormentas sale disparada al cielo y desde allá arriba empieza la tormenta.
// Busca estos títulos con Ctrl+F:
//   CÓDIGOS                   · qué hace cada código de la computadora (agregá más aquí)
//   MÁQUINA                   · cómo se ve la máquina (la del patio de la casa y la que queda en el cielo)
//   CIELO                     · el cielo y la neblina se ponen rojos, anaranjados o morados
//   TORNADO DE PAPAS          · un tornado hecho de papas fritas que lanza hamburguesas (Tormenta Roja)
//   LLUVIA DE JUGO DE NARANJA · (Tormenta Naranja)
//   TOTOPOS VOLADORES         · totopos gigantes que cruzan la carretera como frisbis (Tormenta Naranja)
//   AVALANCHA DE COMIDA       · una ola de comida rodando por la carretera hacia vos (también sale sola
//                               de vez en cuando en cualquier tormenta de comida)
//   ULTRA PRO MAX APOCALIPSIS · si la roja, la naranja y la morada pasan al mismo tiempo
// Los números están en js/ajustes.js (AJUSTES.generador).
// =====================================================================
(function () {
  const AP = window.APOCALIPSIS,
    TC = window.TORMENTA_COMIDA;
  if (!AP || !TC) return;
  const A = AJUSTES.generador,
    FASES = AJUSTES.apocalipsis,
    { caja, cilindro, compartir, mat, humoTex, llamaTex, LUZ } = MUNDO;
  const play = () => state == "play" && !MONT.on;
  const comida = (nombre) => TC.COMIDAS.findIndex((c) => c.nombre == nombre);

  // lo que prendió la computadora (segundos que faltan). Las tormentas de comida van en AP.forzadas
  // (roja, naranja, morada = comida gigante, fettuccine) porque dicen qué comida cae.
  const G = {
    tornado: 0,
    totopos: 0,
    jugo: 0,
    rafaga: null,
    pendientes: [],
    ultra: 0,
    avalanchaT: R(30, 50),
  };
  window.GENERADOR = G; // para probar desde la consola: GENERADOR.usar("ULTRA")
  const duracionMorada = () => 4 + FASES.morada * FASES.nivelesMorada; // lo que dura la Morada completa
  const prender = (nombre, s = A.duracion) => (AP.forzadas[nombre] = Math.max(AP.forzadas[nombre] || 0, s));
  const rafaga = (...nombres) =>
    (G.rafaga = { lista: nombres.map(comida).filter((k) => k >= 0), n: 8, t: 0 });

  // ===================== CÓDIGOS =====================
  // [código, emoji, nombre, qué hace, función]. El código se escribe en la computadora (sin tildes).
  const CODIGOS = [
    [
      "ROJA",
      "🔴",
      "Tormenta Roja",
      "Cielo rojo, rábanos y huevos duros, y un tornado de papas que lanza hamburguesas",
      () => {
        prender("roja");
        G.tornado = Math.max(G.tornado, A.duracion);
      },
    ],
    [
      "NARANJA",
      "🟠",
      "Tormenta Naranja",
      "Cielo anaranjado, jugo de naranja, panqueques, huevos fritos, mazorcas y totopos voladores",
      () => {
        prender("naranja");
        G.jugo = Math.max(G.jugo, A.duracion);
        G.totopos = Math.max(G.totopos, A.duracion);
      },
    ],
    [
      "MORADA",
      "🟣",
      "Tormenta Morada",
      "El apocalipsis: rayos, tornados, comida gigante, fettuccine y la carretera partida",
      () => AP.empezarMorada(),
    ],
    [
      "ULTRA",
      "☢",
      "ULTRA PRO MAX APOCALIPSIS",
      "¡La roja, la naranja y la morada juntas! Todo al mismo tiempo",
      () => {
        const s = duracionMorada();
        AP.empezarMorada();
        prender("roja", s);
        prender("naranja", s);
        G.tornado = G.jugo = G.totopos = Math.max(G.tornado, s);
      },
    ],
    [
      "FETTUCCINE",
      "🍝",
      "Tormenta de Fettuccine",
      "Lluvia de fideos, platos Alfredo, nidos y tiras",
      () => prender("fettuccine"),
    ],
    [
      "COMIDA",
      "🍔",
      "Comida gigante",
      "Hamburguesas, pizzas, donas, espagueti con albóndigas y más",
      () => prender("morada"),
    ],
    [
      "AVALANCHA",
      "🏔",
      "Avalancha de comida",
      "Una ola de comida que viene rodando por la carretera",
      () => avalancha(),
    ],
    [
      "PAPAS",
      "🍟",
      "Tornado de papas",
      "Un tornado de papas fritas que te lanza hamburguesas",
      () => (G.tornado = Math.max(G.tornado, A.duracion)),
    ],
    [
      "TOTOPOS",
      "🔺",
      "Totopos voladores",
      "Totopos gigantes que cruzan la carretera como frisbis",
      () => (G.totopos = Math.max(G.totopos, 30)),
    ],
    [
      "JUGO",
      "🍊",
      "Lluvia de jugo de naranja",
      "Llueve jugo de naranja",
      () => (G.jugo = Math.max(G.jugo, A.duracion)),
    ],
    ["RABANOS", "🌱", "Rábanos gigantes", "Caen rábanos gigantes del cielo", () => rafaga("rábano")],
    [
      "PANQUEQUES",
      "🥞",
      "Panqueques gigantes",
      "Caen pilas de panqueques con miel",
      () => rafaga("pila de panqueques"),
    ],
    [
      "HUEVOS",
      "🍳",
      "Huevos duros y fritos",
      "Huevos duros que rebotan y huevos fritos que resbalan",
      () => rafaga("huevo duro", "huevo frito"),
    ],
    [
      "MAZORCAS",
      "🌽",
      "Mazorcas que ruedan",
      "Caen mazorcas y ruedan por la carretera",
      () => rafaga("mazorca"),
    ],
    ["DONAS", "🍩", "Donas que ruedan", "Caen donas y ruedan por la carretera", () => rafaga("dona")],
    [
      "CALMA",
      "🌤",
      "Apagar",
      "Apaga las tormentas de la computadora",
      () => {
        for (const k in AP.forzadas) AP.forzadas[k] = 0;
        G.tornado = G.totopos = G.jugo = 0;
        G.rafaga = null;
        if (AP.forzada) AP.forzada = false;
      },
    ],
  ];
  G.CODIGOS = CODIGOS;
  const OTROS = {
    ULTRAPROMAX: "ULTRA",
    ULTRAPROMAXAPOCALIPSIS: "ULTRA",
    APOCALIPSIS: "MORADA",
    PAPA: "PAPAS",
    JUGODENARANJA: "JUGO",
  };
  // busca el código (sin tildes ni espacios; "rabano" sirve igual que "RABANOS")
  G.buscar = (texto) => {
    let t = String(texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    t = OTROS[t] || t;
    return CODIGOS.find(([c]) => c == t || c == t + "S" || c == t + "ES") || null;
  };
  // usar un código: la máquina sale al cielo y la tormenta empieza unos segundos después
  G.usar = (texto) => {
    const c = G.buscar(texto);
    if (!c) return null;
    G.pendientes.push({ c, t: c[0] == "CALMA" ? 0 : A.despegue });
    return c;
  };

  // ===================== MÁQUINA =====================
  // mira hacia +z. g.userData.nube: la nube de colores en la cúpula; g.userData.luces: las tres luces
  G.hacerMaquina = () => {
    const g = new T.Group();
    cilindro(g, 1.5, 0.5, 0x37474f, 0, 0.25, 0); // base
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2,
        aleta = caja(g, 0.18, 2, 1.3, 0xc62828, Math.cos(a) * 1.25, 1, Math.sin(a) * 1.25);
      aleta.rotation.y = -a;
      const tobera = new T.Mesh(
        compartir(new T.ConeGeometry(0.35, 0.6, 10)),
        mat(0x263238, { metalness: 0.6 }),
      );
      tobera.position.set(Math.cos(a + 1) * 0.7, 0.2, Math.sin(a + 1) * 0.7);
      g.add(tobera);
    }
    cilindro(g, 1.1, 3.2, 0xcfd8dc, 0, 2.1, 0, { metalness: 0.7, roughness: 0.25 }); // cuerpo
    [0xff2a14, 0xff8c1a, 0x9b30ff].forEach((c, i) => cilindro(g, 1.13, 0.22, c, 0, 1.2 + i * 0.7, 0, LUZ(c))); // franjas
    caja(g, 0.9, 0.7, 0.1, 0x111111, 0, 2.3, 1.08); // pantallita
    caja(g, 0.7, 0.12, 0.11, 0x39ff14, 0, 2.4, 1.1, LUZ(0x39ff14));
    const nube = new T.Mesh(
      compartir(new T.SphereGeometry(0.75, 16, 12)),
      new T.MeshStandardMaterial({
        color: 0x9b30ff,
        emissive: 0x9b30ff,
        emissiveIntensity: 1.2,
        roughness: 0.9,
      }),
    );
    nube.position.y = 4.15;
    g.add(nube);
    const cupula = new T.Mesh(
      compartir(new T.SphereGeometry(1.05, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2)),
      mat(0xbfe6ff, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3 }),
    );
    cupula.position.y = 3.7;
    g.add(cupula);
    cilindro(g, 0.06, 2.4, 0x90a4ae, 0.5, 5.2, -0.4); // antena
    const punta = new T.Mesh(compartir(new T.SphereGeometry(0.16, 10, 8)), mat(0xff1744, LUZ(0xff1744)));
    punta.position.set(0.5, 6.45, -0.4);
    g.add(punta);
    const plato = new T.Mesh(
      compartir(new T.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4)),
      mat(0xeceff1, { side: T.DoubleSide }),
    );
    plato.position.set(-1.05, 3.4, 0);
    plato.rotation.z = 1.1;
    g.add(plato);
    g.userData.nube = nube;
    return g;
  };
  // la que queda en el cielo mientras hay tormenta, con un rayo de luz que baja
  const enCielo = G.hacerMaquina();
  enCielo.scale.setScalar(4);
  const rayo = new T.Mesh(
    new T.CylinderGeometry(1.2, 9, 30, 20, 1, true),
    new T.MeshBasicMaterial({
      color: 0xff8c1a,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.AdditiveBlending,
      fog: false,
    }),
  );
  rayo.position.y = -15;
  enCielo.add(rayo);
  const fuegoCielo = new T.Sprite(
    new T.SpriteMaterial({
      map: llamaTex,
      color: 0xffb060,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
    }),
  );
  fuegoCielo.scale.set(1.6, 2.6, 1);
  fuegoCielo.position.y = -0.6;
  enCielo.add(fuegoCielo);
  enCielo.visible = false;
  sc.add(enCielo);

  // ===================== CIELO =====================
  const COLOR = {
    roja: new T.Color(0xff2a14),
    naranja: new T.Color(0xff8c1a),
    morada: new T.Color(0x9b30ff),
  };
  const cielo = new T.Mesh(
    new T.SphereGeometry(420, 24, 12),
    new T.MeshBasicMaterial({
      color: 0xff2a14,
      transparent: true,
      opacity: 0.35,
      side: T.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  cielo.visible = false;
  sc.add(cielo);
  const colorAhora = new T.Color(),
    _c = new T.Color();

  // ===================== TORNADO DE PAPAS =====================
  const N_PAPAS = 170,
    papasMesh = new T.InstancedMesh(
      compartir(new T.BoxGeometry(0.42, 0.42, 3.4)),
      new T.MeshStandardMaterial({ roughness: 0.6 }),
      N_PAPAS,
    );
  papasMesh.frustumCulled = false;
  papasMesh.castShadow = true;
  papasMesh.count = 0;
  sc.add(papasMesh);
  const papas = [];
  for (let i = 0; i < N_PAPAS; i++) {
    papas.push({ h: R(0, 48), a: R(0, 6.28), w: R(1.8, 3.2), inc: R(-0.5, 0.5), giro: R(0, 6.28) });
    papasMesh.setColorAt(i, _c.setHex([0xf2c14e, 0xe8b23a, 0xffd56a, 0xd99a2b][i % 4]));
  }
  papasMesh.instanceColor.needsUpdate = true;
  const polvoTornado = [];
  for (let i = 0; i < 4; i++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: humoTex,
        color: 0xe0b860,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    sc.add(sp);
    polvoTornado.push(sp);
  }
  const TOR = { x: 0, z: 0, vx: 4, on: false, lanzaT: 1 };
  const ponerTornado = () =>
    Object.assign(TOR, { x: R(-18, 18), z: B.z - R(150, 210), vx: R(-5, 5), on: true, lanzaT: 1.5 });
  // lanza una hamburguesa en curva (a veces directo hacia vos)
  const lanzarHamburguesa = () => {
    const k = comida("hamburguesa");
    if (k < 0 || TC.comidas.length > 22) return;
    const y0 = 42,
      vy = R(8, 14),
      g = 25,
      t = (vy + Math.sqrt(vy * vy + 2 * g * y0)) / g,
      haciaVos = Math.random() < 0.35,
      tx = haciaVos ? B.x - Math.sin(B.h) * B.v * t + R(-2, 2) : R(-12, 12),
      tz = haciaVos ? B.z - Math.cos(B.h) * B.v * t + R(-4, 4) : TOR.z + R(-60, 40);
    TC.soltar(k, {
      x: TOR.x,
      z: TOR.z,
      y: y0,
      tam: R(3.5, 5.5),
      vy,
      gravedad: g,
      danioK: 0.5, // más chiquitas: dañan la mitad
      vx: (tx - TOR.x) / t,
      vz: (tz - TOR.z) / t,
    });
  };

  // ===================== LLUVIA DE JUGO DE NARANJA =====================
  const N_GOTAS = 300,
    jugoMesh = new T.InstancedMesh(
      compartir(new T.BoxGeometry(0.06, 1.5, 0.06)),
      new T.MeshStandardMaterial({ color: 0xff9a1f, emissive: 0x7a3600, transparent: true, opacity: 0.75 }),
      N_GOTAS,
    );
  jugoMesh.frustumCulled = false;
  jugoMesh.count = 0;
  sc.add(jugoMesh);
  const gotas = [];
  for (let i = 0; i < N_GOTAS; i++) gotas.push({ x: 0, y: -1, z: 0, v: R(28, 38), ok: false });
  const ponerGota = (p, arriba) => {
    p.x = cam.position.x + R(-40, 40);
    p.z = cam.position.z - R(-10, 120);
    p.y = arriba ? R(30, 50) : R(0, 50);
    p.ok = true;
  };

  // ===================== TOTOPOS VOLADORES =====================
  const formaTotopo = new T.Shape();
  formaTotopo.moveTo(0, 0.62);
  formaTotopo.quadraticCurveTo(0.05, 0.66, 0.1, 0.6);
  formaTotopo.lineTo(0.55, -0.28);
  formaTotopo.quadraticCurveTo(0.58, -0.36, 0.5, -0.36);
  formaTotopo.lineTo(-0.5, -0.36);
  formaTotopo.quadraticCurveTo(-0.58, -0.36, -0.55, -0.28);
  formaTotopo.lineTo(-0.1, 0.6);
  formaTotopo.quadraticCurveTo(-0.05, 0.66, 0, 0.62);
  const N_TOTOPOS = 12,
    totoMesh = new T.InstancedMesh(
      compartir(
        new T.ExtrudeGeometry(formaTotopo, { depth: 0.06, bevelEnabled: false }).rotateX(-Math.PI / 2),
      ),
      new T.MeshStandardMaterial({ color: 0xf0a830, roughness: 0.7 }),
      N_TOTOPOS,
    );
  totoMesh.frustumCulled = false;
  totoMesh.castShadow = true;
  totoMesh.count = 0;
  sc.add(totoMesh);
  const totopos = [];
  for (let i = 0; i < N_TOTOPOS; i++)
    totopos.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vz: 0, giro: 0, tam: 3 });
  let totoT = 0;
  const lanzarTotopo = () => {
    const p = totopos.find((q) => !q.on);
    if (!p) return;
    const lado = Math.random() < 0.5 ? -1 : 1;
    Object.assign(p, {
      on: true,
      x: lado * R(45, 60),
      y: R(2.2, 5.5),
      z: B.z - R(40, 150),
      vx: -lado * R(20, 30),
      vz: R(-2, 8),
      giro: R(0, 6),
      tam: R(3, 4.5),
    });
  };

  // ===================== AVALANCHA DE COMIDA =====================
  // una fila de comidas que ruedan (donas, mazorcas, nidos de fettuccine) cae adelante y viene hacia vos
  const avalancha = () => {
    const rodantes = [];
    TC.COMIDAS.forEach((c, i) => c.rueda && rodantes.push(i));
    if (!rodantes.length) return;
    const n = Math.round(A.avalanchaComidas * Math.max(0.5, CALIDAD.efectos)),
      z0 = B.z - R(150, 190);
    for (let i = 0; i < n; i++)
      TC.soltar(pk_(rodantes), {
        x: -14 + (28 * i) / Math.max(1, n - 1) + R(-1.5, 1.5),
        z: z0 - R(0, 25),
        y: R(3, 14),
        tam: R(5, 8.5),
      });
    if (play()) {
      msg("🏔🍩🌽 ¡AVALANCHA DE COMIDA! Viene rodando por la carretera", 3000);
      shake = Math.max(shake, 0.5);
    }
  };
  G.avalancha = avalancha;

  // ===================== ULTRA PRO MAX APOCALIPSIS =====================
  const cartelUltra = document.createElement("div");
  cartelUltra.id = "ultra";
  cartelUltra.textContent = "☢ ULTRA PRO MAX APOCALIPSIS ☢";
  document.body.appendChild(cartelUltra);
  const esUltra = () => AP.forzadas.roja > 0 && AP.forzadas.naranja > 0 && AP.fase == "morada";

  // ===================== CUADRO A CUADRO =====================
  const m4 = new T.Matrix4(),
    q4 = new T.Quaternion(),
    e4 = new T.Euler(),
    v4 = new T.Vector3(),
    s4 = new T.Vector3(1, 1, 1);
  let reloj = 0,
    zAnt = null;
  const apagarTodo = () => {
    for (const k in AP.forzadas) AP.forzadas[k] = 0;
    G.tornado = G.totopos = G.jugo = G.ultra = 0;
    G.rafaga = null;
    G.pendientes.length = 0;
    TOR.on = false;
    totopos.forEach((p) => (p.on = false));
    gotas.forEach((p) => (p.ok = false));
    TC.ritmo = 1;
  };
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    if ((zAnt != null && Math.abs(B.z - zAnt) > 30 && state == "play") || MONT.on) apagarTodo();
    zAnt = B.z;
    const juega = play();
    if (juega) {
      // ----- los códigos que se usaron empiezan cuando la máquina llega al cielo -----
      for (let i = G.pendientes.length - 1; i >= 0; i--) {
        const p = G.pendientes[i];
        p.t -= dt;
        if (p.t > 0) continue;
        G.pendientes.splice(i, 1);
        p.c[4]();
        if (p.c[0] != "CALMA") msg(`${p.c[1]} ¡La máquina en el cielo empezó: ${p.c[2]}!`, 3000);
        else msg("🌤 La computadora apagó sus tormentas", 2500);
      }
      // ----- el tiempo de cada tormenta -----
      for (const k in AP.forzadas) if (AP.forzadas[k] > 0) AP.forzadas[k] = Math.max(0, AP.forzadas[k] - dt);
      G.tornado = Math.max(0, G.tornado - dt);
      G.totopos = Math.max(0, G.totopos - dt);
      G.jugo = Math.max(0, G.jugo - dt);
      // ----- ráfaga de una sola comida -----
      if (G.rafaga) {
        G.rafaga.t -= dt;
        if (G.rafaga.t <= 0 && G.rafaga.lista.length) {
          G.rafaga.t = 0.6;
          TC.soltar(pk_(G.rafaga.lista));
          if (--G.rafaga.n <= 0) G.rafaga = null;
        } else if (!G.rafaga.lista.length) G.rafaga = null;
      }
    }
    // ----- ultra pro max -----
    const ultra = esUltra();
    if (ultra && !G.ultra && juega) {
      msg("☢🔴🟠🟣 ¡¡ULTRA PRO MAX APOCALIPSIS!! La roja, la naranja y la morada juntas · ¡SOBREVIVÍ!", 6000);
      shake = 1;
    }
    if (ultra) G.ultra += dt;
    else if (G.ultra) {
      if (G.ultra > 20 && juega) {
        cash += A.premioUltra;
        msg(`☢ ¡Sobreviviste la ULTRA PRO MAX APOCALIPSIS! +₡${A.premioUltra.toLocaleString("es-CR")}`, 5000);
      }
      G.ultra = 0;
    }
    cartelUltra.style.display = ultra && state == "play" ? "block" : "none";
    TC.ritmo = ultra ? A.ritmoUltra : 1;

    // ----- avalanchas de comida (solas, en cualquier tormenta de comida) -----
    if (juega && AP.tormentas().length) {
      G.avalanchaT -= dt;
      if (G.avalanchaT <= 0) {
        G.avalanchaT = ultra ? R(14, 22) : R(A.avalanchaCada[0], A.avalanchaCada[1]);
        avalancha();
      }
    }

    // ----- cielo de colores -----
    const roja = AP.forzadas.roja > 0,
      naranja = AP.forzadas.naranja > 0,
      colores = roja || naranja;
    cielo.visible = colores && !MONT.on;
    if (cielo.visible) {
      if (ultra) {
        // va pasando por rojo → anaranjado → morado
        const f = (reloj * 0.35) % 3,
          lista = [COLOR.roja, COLOR.naranja, COLOR.morada],
          i = Math.floor(f);
        colorAhora.copy(lista[i]).lerp(lista[(i + 1) % 3], f - i);
      } else {
        colorAhora.setRGB(0, 0, 0);
        let n = 0;
        if (roja) (colorAhora.add(COLOR.roja), n++);
        if (naranja) (colorAhora.add(COLOR.naranja), n++);
        if (AP.fase == "morada") (colorAhora.add(COLOR.morada), n++);
        colorAhora.multiplyScalar(1 / n);
      }
      cielo.position.copy(cam.position);
      cielo.material.color.copy(colorAhora);
      cielo.material.opacity = 0.32 + 0.06 * Math.sin(reloj * 2);
      sc.fog.color.lerp(colorAhora, 0.7);
      sc.fog.near = Math.min(sc.fog.near, 30);
      sc.fog.far = Math.min(sc.fog.far, 330);
      nt = Math.max(nt, 0.35);
    }

    // ----- la máquina en el cielo -----
    const generando =
      colores ||
      G.tornado > 0 ||
      G.totopos > 0 ||
      G.jugo > 0 ||
      AP.forzadas.morada > 0 ||
      AP.forzadas.fettuccine > 0 ||
      AP.forzada;
    enCielo.visible = generando && !MONT.on;
    if (enCielo.visible) {
      enCielo.position.set(B.x * 0.5 + 30, 95 + Math.sin(reloj) * 3, B.z - 210);
      enCielo.rotation.y = reloj * 0.6;
      const c = colores ? colorAhora : AP.fase == "morada" ? COLOR.morada : _c.setHex(0xf2e2b8);
      enCielo.userData.nube.material.color.copy(c);
      enCielo.userData.nube.material.emissive.copy(c);
      rayo.material.color.copy(c);
      rayo.material.opacity = 0.12 + 0.06 * Math.sin(reloj * 5);
      fuegoCielo.scale.set(1.6, 2.2 + Math.random() * 0.8, 1);
    }

    // ----- tornado de papas -----
    const hayTornado = G.tornado > 0 && !MONT.on;
    if (hayTornado && !TOR.on) ponerTornado();
    if (!hayTornado) TOR.on = false;
    if (TOR.on && juega) {
      TOR.z += 5 * dt; // se viene acercando
      TOR.vx += (B.x - TOR.x) * 0.04 * dt;
      TOR.x += TOR.vx * dt;
      if (Math.abs(TOR.x) > 28) TOR.vx = -Math.sign(TOR.x) * Math.abs(TOR.vx);
      if (TOR.z - B.z > 45) ponerTornado(); // ya lo pasaste: aparece otro adelante
      TOR.lanzaT -= dt;
      if (TOR.lanzaT <= 0) {
        TOR.lanzaT = R(A.hamburguesaCada[0], A.hamburguesaCada[1]) / TC.ritmo;
        if (Math.abs(TOR.z - B.z) < 320) lanzarHamburguesa();
      }
      const d = Math.hypot(B.x - TOR.x, B.z - TOR.z);
      if (d < 8 && B.y < 40) {
        TC.golpear(A.danioTornado, "🍟🌪 ¡Te agarró el TORNADO DE PAPAS!");
        B.x += (Math.sign(B.x - TOR.x) || 1) * 10 * dt;
      }
      for (const car of cars)
        if (!car.vy && Math.hypot(car.x - TOR.x, car.z - TOR.z) < 14) {
          car.vy = R(12, 20);
          car.vx = Math.sign(car.x - TOR.x || 1) * R(4, 10);
          car.hit = 1;
        }
    }
    if (TOR.on) {
      const n = Math.round(N_PAPAS * Math.max(0.45, CALIDAD.efectos));
      for (let i = 0; i < n; i++) {
        const p = papas[i],
          r = 2.5 + p.h * 0.3;
        p.a += dt * (3.2 - p.h * 0.025);
        p.giro += dt * 4;
        m4.compose(
          v4.set(TOR.x + Math.cos(p.a) * r, p.h + Math.sin(p.a * 2) * 0.8, TOR.z + Math.sin(p.a) * r),
          q4.setFromEuler(e4.set(p.inc + Math.sin(p.giro) * 0.4, -p.a, p.giro * 0.2)),
          s4.set(1, 1, p.w / 3.4),
        );
        papasMesh.setMatrixAt(i, m4);
      }
      papasMesh.count = n;
      papasMesh.instanceMatrix.needsUpdate = true;
      polvoTornado.forEach((sp, i) => {
        sp.position.set(
          TOR.x + Math.cos(reloj + i * 1.6) * 4,
          2 + i * 1.5,
          TOR.z + Math.sin(reloj + i * 1.6) * 4,
        );
        sp.scale.setScalar(12 + i * 3);
        sp.material.opacity = 0.55;
      });
    } else if (papasMesh.count) {
      papasMesh.count = 0;
      polvoTornado.forEach((sp) => (sp.material.opacity = 0));
    }

    // ----- lluvia de jugo de naranja -----
    const nGotas = G.jugo > 0 && !MONT.on ? Math.round(A.gotasJugo * Math.max(0.35, CALIDAD.efectos)) : 0;
    if (nGotas && state == "play") {
      for (let i = 0; i < Math.min(nGotas, N_GOTAS); i++) {
        const p = gotas[i];
        if (!p.ok) ponerGota(p, false);
        p.y -= p.v * dt;
        if (
          p.y < 0.05 ||
          Math.abs(p.x - cam.position.x) > 45 ||
          p.z - cam.position.z > 15 ||
          cam.position.z - p.z > 130
        )
          ponerGota(p, true);
        m4.compose(v4.set(p.x, p.y, p.z), q4.setFromEuler(e4.set(0.15, 0, 0.1)), s4.set(1, 1, 1));
        jugoMesh.setMatrixAt(i, m4);
      }
      jugoMesh.instanceMatrix.needsUpdate = true;
    }
    jugoMesh.count = Math.min(nGotas, N_GOTAS);
    if (!nGotas) gotas.forEach((p) => (p.ok = false));

    // ----- totopos voladores -----
    if (G.totopos > 0 && juega) {
      totoT -= dt;
      if (totoT <= 0) {
        totoT = R(0.9, 1.8) / TC.ritmo;
        lanzarTotopo();
      }
    }
    let nt2 = 0;
    for (const p of totopos) {
      if (!p.on) continue;
      if (juega) {
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.giro += dt * 14;
        if (Math.abs(p.x) > 70 && Math.sign(p.x) == Math.sign(p.vx)) p.on = false;
        if (p.z - B.z > 120) p.on = false;
        for (const car of cars)
          if (
            !car.vy &&
            Math.abs(car.x - p.x) < p.tam * 0.5 + 1 &&
            Math.abs(car.z - p.z) < p.tam * 0.5 + 1.5 &&
            p.y < 4
          ) {
            car.vy = R(8, 14);
            car.hit = 1;
          }
        if (
          Math.abs(B.x - p.x) < p.tam * 0.5 + PV.hw &&
          Math.abs(B.z - p.z) < p.tam * 0.5 + PV.hl * 0.5 &&
          p.y < B.y + 3.2 &&
          p.y > B.y - 1
        ) {
          TC.golpear(A.danioTotopo, "🔺💥 ¡Te pegó un TOTOPO VOLADOR gigante!");
          p.on = false;
        }
      }
      if (!p.on) continue;
      m4.compose(
        v4.set(p.x, p.y, p.z),
        q4.setFromEuler(e4.set(Math.sin(p.giro * 0.3) * 0.15, p.giro, 0)),
        s4.set(p.tam, p.tam, p.tam),
      );
      totoMesh.setMatrixAt(nt2++, m4);
    }
    totoMesh.count = nt2;
    totoMesh.instanceMatrix.needsUpdate = true;
  };
})();
