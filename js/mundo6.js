// =====================================================================
// ZONA 49 · CAMPO DE GUERRA. Se carga después de js/mundo5.js.
// La carretera cruza un campo de batalla entre dos ejércitos (verde a la izquierda, café a la derecha).
// Busca estos títulos con Ctrl+F:
//   ESCENARIO        · sacos de arena, alambre de púas, erizos antitanque, búnkeres, carpas, torres,
//                      ruinas, árboles quemados, carros quemados y cráteres
//   TANQUES          · se mueven, giran la torreta y le disparan al otro lado (y a veces a la carretera)
//   AVIONES          · cada tanto pasa un avión y suelta una fila de bombas que cruza la carretera
//   EXPLOSIONES      · fuego, humo, escombros y cráteres; tiran los carros por el aire y te dañan
//   CUADRO A CUADRO  · todo lo que se mueve
// Los números (cuántos tanques, cada cuánto disparan, daño, premio) están en js/ajustes.js
// (AJUSTES.campoDeGuerra). El clima de la zona (suelo, neblina) está en CLIMA, abajo.
// =====================================================================
(function () {
  const { caja, cilindro, cartel, fusionar, deModelo, compartir, mat, llamaTex, humoTex, DER, IZQ } = MUNDO;
  const A = AJUSTES.campoDeGuerra,
    ZONA = 49,
    Z0 = -ZONA * 1000, // donde empieza la zona (dentro del ciclo)
    Z1 = Z0 - 1000, // donde termina
    // 100 m antes de terminar el recorrido el mundo "salta" a la vuelta siguiente: lo que esté después
    // de FIN desaparecería de golpe, así que el escenario y el premio llegan solo hasta ahí.
    FIN = Z1 + 120;

  ZN.push("🪖 Campo de guerra");
  CLIMA[ZONA] = { suelo: 0x2a2116, niebla: [40, 380], oscuro: 0.3 };
  // sin los árboles, casas ni postes de siempre: esta zona trae lo suyo
  EXR.push([Z0, Z1]);
  EXRL.push([Z0, Z1]);

  const G = new T.Group(); // escenario fijo (se junta en pocas mallas al final)
  W(G);
  const animados = new T.Group(); // lo que se mueve (solo se ve cerca de la zona)
  W(animados);
  const enZona = (x, z, ry = 0, g) => {
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    G.add(g);
    return g;
  };
  const lado = (i) => (i % 2 ? 1 : -1);
  const zAzar = (margen = 20) => Z0 - margen - R(0, Z0 - FIN - 2 * margen);

  // ===================== ESCENARIO =====================
  {
    // suelo de tierra a los dos lados
    const matTierra = compartir(
      new T.MeshStandardMaterial({
        color: 0x1e160d,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    [-1, 1].forEach((q) => {
      const m = new T.Mesh(new T.PlaneGeometry(1500, 1000), matTierra);
      m.rotation.x = -Math.PI / 2;
      m.position.set(q * (7.5 + 750), 0.025, Z0 - 500);
      m.receiveShadow = true;
      G.add(m);
    });
    // pórtico de entrada
    {
      const g = new T.Group();
      [-9, 9].forEach((x) => caja(g, 0.6, 7.4, 0.6, 0x4e5b31, x, 3.7, 0));
      caja(g, 18.6, 0.7, 0.7, 0x4e5b31, 0, 7.4, 0);
      cartel(g, "⚠ CAMPO DE GUERRA · TANQUES DISPARANDO", 17.4, 2.2, "#1b1b1b", "#ffd23f", 0, 8.9, 0.4);
      cartel(
        g,
        "⚠ CAMPO DE GUERRA · TANQUES DISPARANDO",
        17.4,
        2.2,
        "#1b1b1b",
        "#ffd23f",
        0,
        8.9,
        -0.4,
        Math.PI,
      );
      enZona(0, Z0 - 30, 0, g);
    }
    // sacos de arena a la orilla (con huecos)
    for (let s = 0; s < 34; s++) {
      const g = new T.Group(),
        q = lado(s);
      for (let fila = 0; fila < 3; fila++)
        for (let k = 0; k < 7; k++) {
          const b = caja(
            g,
            1.05,
            0.42,
            0.62,
            fila % 2 ? 0xc2ad84 : 0xb8a27a,
            0,
            0.21 + fila * 0.4,
            k * 1.1 + (fila % 2) * 0.55,
          );
          b.rotation.y = R(-0.08, 0.08);
        }
      enZona(q * 10.2, Z0 - 40 - Math.floor(s / 2) * 50, 0, g);
    }
    // alambre de púas: postes y dos hilos
    [-1, 1].forEach((q) => {
      for (let k = 0; k < 57; k++) {
        const z = Z0 - 20 - k * 15;
        caja(G, 0.12, 1.5, 0.12, 0x3e3a33, q * 13.5, 0.75, z);
        [0.6, 1.2].forEach((y) => caja(G, 0.04, 0.04, 15, 0x6d6d6d, q * 13.5, y, z - 7.5));
      }
    });
    // erizos antitanque (tres vigas cruzadas)
    for (let i = 0; i < 46; i++) {
      const g = new T.Group();
      [
        [0, 0, 0.78],
        [0.78, 0, 0],
        [0, 0.78, 0.78],
      ].forEach(([x, y, z]) => {
        const v = caja(g, 0.28, 0.28, 3, 0x4a4a46, 0, 0.9, 0);
        v.rotation.set(x, y, z);
      });
      enZona(lado(i) * R(16, 70), zAzar(), R(0, 3), g);
    }
    // búnkeres de concreto con su ranura
    for (let i = 0; i < 6; i++) {
      const g = new T.Group(),
        q = lado(i);
      caja(g, 7, 2.6, 5.5, 0x8d8d84, 0, 1.3, 0);
      caja(g, 7.4, 0.5, 5.9, 0x7a7a72, 0, 2.8, 0);
      caja(g, 4, 0.35, 0.2, 0x111111, 0, 1.9, -2.8);
      enZona(q * R(24, 36), Z0 - 90 - i * 150, q > 0 ? DER : IZQ, g);
    }
    // carpas militares
    const geoCarpa = compartir(new T.CylinderGeometry(3, 3, 7, 3, 1));
    for (let i = 0; i < 10; i++) {
      const g = new T.Group(),
        c = new T.Mesh(geoCarpa, mat(lado(i) > 0 ? 0x7a6a45 : 0x556b2f));
      c.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      c.position.y = 1.5;
      c.castShadow = true;
      g.add(c);
      enZona(lado(i) * R(45, 80), zAzar(40), R(-0.3, 0.3), g);
    }
    // torres de vigilancia
    for (let i = 0; i < 4; i++) {
      const g = new T.Group();
      [-1, 1].forEach((x) => [-1, 1].forEach((z) => caja(g, 0.25, 8, 0.25, 0x5d4a33, x * 1.4, 4, z * 1.4)));
      caja(g, 3.6, 0.3, 3.6, 0x6d5a40, 0, 8, 0);
      caja(g, 3.6, 1, 0.15, 0x6d5a40, 0, 8.6, 1.7);
      caja(g, 3.6, 1, 0.15, 0x6d5a40, 0, 8.6, -1.7);
      caja(g, 4.2, 0.25, 4.2, 0x3e5230, 0, 10.2, 0);
      enZona(lado(i) * R(18, 26), Z0 - 150 - i * 230, 0, g);
    }
    // ruinas: paredes rotas y montones de escombros
    for (let i = 0; i < 12; i++) {
      const g = new T.Group(),
        c = pk_([0x9e8f80, 0x8d6e63, 0xa1887f, 0x9e9e9e]);
      for (let k = 0; k < 5; k++) {
        const h = R(2, 9);
        caja(g, R(3, 7), h, 0.5, c, R(-4, 4), h / 2, k < 3 ? -3 : 3);
      }
      caja(g, 0.5, R(3, 7), 6, c, -4, 2.5, 0);
      for (let k = 0; k < 14; k++) {
        const e = caja(
          g,
          R(0.5, 1.8),
          R(0.3, 1),
          R(0.5, 1.8),
          pk_([c, 0x6d6d6d, 0x5d4037]),
          R(-5, 5),
          0.3,
          R(-5, 5),
        );
        e.rotation.set(R(0, 1), R(0, 3), R(0, 1));
      }
      enZona(lado(i) * R(22, 60), zAzar(30), R(0, 3), g);
    }
    // árboles quemados (sin hojas)
    for (let i = 0; i < 70; i++) {
      const g = new T.Group(),
        h = R(4, 8);
      cilindro(g, 0.22, h, 0x2b2420, 0, h / 2, 0);
      const r1 = caja(g, 0.14, 2, 0.14, 0x2b2420, 0.5, h * 0.7, 0);
      r1.rotation.z = -0.8;
      const r2 = caja(g, 0.12, 1.6, 0.12, 0x2b2420, -0.4, h * 0.55, 0.2);
      r2.rotation.z = 0.9;
      enZona(lado(i) * R(15, 110), zAzar(), R(0, 6), g);
      g.rotation.z = R(-0.12, 0.12);
    }
    // carros quemados
    for (let i = 0; i < 16; i++) {
      const g = new T.Group();
      caja(g, 2, 1.1, 4.4, 0x2a2622, 0, 0.75, 0);
      caja(g, 1.8, 0.7, 2.2, 0x1d1a17, 0, 1.6, -0.2);
      enZona(lado(i) * R(9, 24), zAzar(), R(0, 3), g);
      g.rotation.z = R(-0.2, 0.2);
    }
    // cráteres que ya estaban (en el campo y en la orilla)
    const geoCrater = compartir(new T.CircleGeometry(1, 20));
    const matCrater = compartir(
      new T.MeshStandardMaterial({
        color: 0x2e261c,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );
    for (let i = 0; i < 70; i++) {
      const c = new T.Mesh(geoCrater, matCrater);
      c.rotation.x = -Math.PI / 2;
      c.scale.setScalar(R(1.5, 5));
      c.position.set(lado(i) * R(8.5, 90), 0.04, zAzar());
      G.add(c);
    }
    // letreros
    const avisos = [
      "⚠ ZONA MILITAR",
      "💣 NO SALGA DE LA CARRETERA",
      "🪖 CAMPO DE BATALLA",
      "⚠ TANQUES DISPARANDO",
      "✈ BOMBARDEOS",
      "⚠ ¡NO SE DETENGA!",
    ];
    for (let i = 0; i < 10; i++) {
      const g = new T.Group();
      caja(g, 0.2, 3, 0.2, 0x555555, 0, 1.5, 0);
      cartel(g, avisos[i % avisos.length], 5, 1.2, "#1b1b1b", "#ffd23f", 0, 3.4, 0.12);
      cartel(g, avisos[i % avisos.length], 5, 1.2, "#1b1b1b", "#ffd23f", 0, 3.4, -0.12, Math.PI);
      enZona(i % 2 ? -9.8 : 9.6, Z0 - 70 - i * 85, 0, g);
    }
  }

  // ===================== TANQUES =====================
  // Cada tanque tiene la base (que se mueve) y la torreta con el cañón (que gira para apuntar).
  const hacerTanque = (color) => {
    const base = deModelo("tanque-base-" + color, () => {
      const g = new T.Group();
      caja(g, 3.2, 1.1, 6, color, 0, 1.15, 0); // casco
      caja(g, 2.6, 0.5, 4.6, color, 0, 1.9, 0.2);
      [-1, 1].forEach((q) => {
        caja(g, 0.9, 1.1, 6.6, 0x26241f, q * 1.75, 0.6, 0); // orugas
        for (let k = 0; k < 5; k++)
          cilindro(g, 0.42, 0.95, 0x3b3933, q * 1.75, 0.55, -2.4 + k * 1.2).rotation.z = Math.PI / 2;
      });
      g.userData.hl = 3.3;
      return g;
    });
    const torreta = deModelo("tanque-torreta-" + color, () => {
      const g = new T.Group();
      cilindro(g, 1.35, 0.9, color, 0, 0, 0);
      caja(g, 1.4, 0.7, 1.6, color, 0, 0.1, 0.9);
      const c = cilindro(g, 0.16, 4.4, 0x2d2b26, 0, 0.1, -3); // cañón (apunta hacia -z)
      c.rotation.x = Math.PI / 2;
      cilindro(g, 0.24, 0.6, 0x2d2b26, 0, 0.1, -5.1).rotation.x = Math.PI / 2;
      return g;
    });
    torreta.position.y = 2.6;
    const t = new T.Group();
    t.add(base, torreta);
    return { g: t, torreta };
  };
  const tanques = [];
  for (let i = 0; i < A.tanques; i++) {
    const q = lado(i),
      { g, torreta } = hacerTanque(q < 0 ? 0x556b2f : 0x8a7346);
    animados.add(g);
    tanques.push({
      g,
      torreta,
      q,
      x: q * R(24, 70),
      z0: Z0 - 60 - (i >> 1) * (880 / Math.ceil(A.tanques / 2)) - R(0, 40),
      f: R(0, 6),
      vel: R(0.15, 0.35),
      apuntaA: null, // hacia dónde gira la torreta (null = vigila la carretera)
      blanco: null, // a dónde va a disparar
      dispT: R(1, 4),
      roto: 0, // segundos que le quedan quemándose si le dieron
      llama: null,
      humo: null,
    });
  }

  tanques.forEach((tq) => {
    tq.llama = new T.Sprite(
      new T.SpriteMaterial({
        map: llamaTex,
        color: 0xffffff,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    tq.humo = new T.Sprite(
      new T.SpriteMaterial({
        map: humoTex,
        color: 0x1e1b19,
        depthWrite: false,
        transparent: true,
        opacity: 0.7,
      }),
    );
    tq.llama.visible = tq.humo.visible = false;
    animados.add(tq.llama, tq.humo);
  });

  // ===================== EXPLOSIONES =====================
  const explosiones = [];
  for (let i = 0; i < 14; i++) {
    const fuego = new T.Sprite(
        new T.SpriteMaterial({
          map: llamaTex,
          color: 0xffffff,
          blending: T.AdditiveBlending,
          depthWrite: false,
          transparent: true,
        }),
      ),
      humo = new T.Sprite(
        new T.SpriteMaterial({
          map: humoTex,
          color: 0x1a1714,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );
    fuego.visible = humo.visible = false;
    animados.add(fuego, humo);
    explosiones.push({ fuego, humo, t: 0, x: 0, z: 0, tam: 1 });
  }
  const crateres = [];
  const geoHoyo = compartir(new T.CircleGeometry(1, 20));
  for (let i = 0; i < 24; i++) {
    const c = new T.Mesh(
      geoHoyo,
      new T.MeshBasicMaterial({
        color: 0x1f1913,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      }),
    );
    c.rotation.x = -Math.PI / 2;
    c.visible = false;
    animados.add(c);
    crateres.push({ m: c, t: 0 });
  }
  // escombros: todos en una sola malla
  const N_ESC = 240;
  const escombros = new T.InstancedMesh(
    compartir(new T.BoxGeometry(1, 1, 1)),
    new T.MeshStandardMaterial({ roughness: 0.9 }),
    N_ESC,
  );
  escombros.setColorAt(0, new T.Color(0xffffff));
  escombros.frustumCulled = false;
  escombros.count = 0;
  animados.add(escombros);
  const esc = [];
  for (let i = 0; i < N_ESC; i++) esc.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0, t: 0, r: 0 });
  let sigEsc = 0;
  const _c = new T.Color(),
    m4 = new T.Matrix4(),
    q4 = new T.Quaternion(),
    e4 = new T.Euler(),
    v4 = new T.Vector3(),
    s4 = new T.Vector3();
  const sonidoBum = (vol) => {
    try {
      if (!AC || vol < 0.03) return;
      const n = AC.sampleRate * 1.2,
        b = AC.createBuffer(1, n, AC.sampleRate),
        d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.18));
      const s = AC.createBufferSource(),
        f = AC.createBiquadFilter(),
        g = AC.createGain();
      s.buffer = b;
      f.type = "lowpass";
      f.frequency.value = 300;
      g.gain.value = Math.min(1, vol);
      s.connect(f).connect(g).connect(AC.destination);
      s.start();
    } catch (e) {}
  };
  const play = () => state == "play" && !MONT.on;
  const D = { golpeT: 0, dentro: -1, premio: -1, aviso: -1, avionT: 6 };
  window.CAMPO_DE_GUERRA = D; // para revisar desde la consola
  // x, z: posición DENTRO del ciclo (como el escenario); tam: 1 = granada de tanque, 1.4 = bomba
  function explotar(x, z, tam) {
    const e = explosiones.find((q) => q.t <= 0) || explosiones[0];
    Object.assign(e, { t: 1, x, z, tam });
    e.fuego.visible = e.humo.visible = true;
    const c = crateres.find((q) => q.t <= 0) || crateres[0];
    c.t = 25;
    c.m.visible = true;
    c.m.position.set(x, 0.05, z);
    c.m.scale.setScalar(2.2 * tam);
    c.m.material.opacity = 0.8;
    // escombros que saltan
    const n = Math.round(16 * Math.max(0.4, CALIDAD.efectos));
    for (let j = 0; j < n; j++) {
      const p = esc[sigEsc];
      escombros.setColorAt(sigEsc, _c.setHex(pk_([0x5d4037, 0x6d6d6d, 0x3e3a33, 0x8d6e63, 0x2b2420])));
      sigEsc = (sigEsc + 1) % N_ESC;
      const a = R(0, 6.28),
        v = R(4, 13) * tam;
      Object.assign(p, {
        x,
        y: 0.5,
        z,
        vx: Math.cos(a) * v,
        vy: R(7, 18) * tam,
        vz: Math.sin(a) * v,
        s: R(0.25, 0.8),
        t: R(1.5, 2.6),
        r: R(0, 6),
      });
    }
    if (escombros.instanceColor) escombros.instanceColor.needsUpdate = true;
    // jugador, carros y tanques cerca
    const wz = z + CZ,
      d = Math.hypot(B.x - x, B.z - wz),
      radio = A.radio * tam;
    sonidoBum(0.9 * tam * Math.max(0, 1 - d / 400));
    if (d < 140) shake = Math.max(shake, ((140 - d) / 140) * 0.9);
    if (play() && d < radio && B.y < 6 && D.golpeT <= 0) {
      D.golpeT = 1.4;
      dmg += (PV.crush ? 0.35 : 1) * A.danio * tam;
      B.v *= 0.5;
      shake = 1;
      if (d < radio * 0.5 && !B.fl && !B.bal && !PV.crush) {
        B.bal = 1; // la explosión levanta el vehículo
        B.vy = 8 + 4 * tam;
        msg("💥💥 ¡Una explosión te mandó a volar!", 2200);
      } else msg(tam > 1.2 ? "💣 ¡Te cayó una bomba cerca!" : "💥 ¡Te alcanzó un cañonazo!", 2000);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
    for (const car of cars)
      if (!car.vy && Math.hypot(car.x - x, car.z - wz) < radio * 1.4) {
        car.vy = R(10, 18) * tam;
        car.vx = R(-8, 8);
        car.hit = 1;
      }
    for (const tq of tanques)
      if (tq.posZ != null && !tq.roto && Math.hypot(tq.x - x, tq.posZ - z) < 6 * tam) {
        tq.roto = 25; // le dieron: se queda quemándose un rato
        tq.g.rotation.z = R(-0.15, 0.15);
      }
  }

  D.explotar = explotar; // para probar desde la consola: CAMPO_DE_GUERRA.explotar(0, B.z - CZ - 40, 1)

  // ----- granadas de los tanques (vuelan en arco) -----
  const granadas = [];
  for (let i = 0; i < 14; i++) {
    const m = new T.Mesh(compartir(new T.SphereGeometry(0.35, 8, 6)), mat(0x2b2b2b));
    const brillo = new T.Sprite(
      new T.SpriteMaterial({
        map: gTex,
        color: 0xffa040,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    brillo.scale.setScalar(4);
    m.add(brillo);
    m.visible = false;
    animados.add(m);
    granadas.push({ m, t: -1, dur: 1, x0: 0, z0: 0, y0: 0, x1: 0, z1: 0, alto: 0 });
  }
  const fogonazos = tanques.map(() => {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: llamaTex,
        color: 0xffd080,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    sp.visible = false;
    sp.scale.setScalar(5);
    animados.add(sp);
    return sp;
  });
  function elegirBlanco(tq) {
    const u = B.z - CZ,
      alJugador = Math.random() < A.alJugador && Math.abs(u - tq.posZ) < 260;
    let x1, z1;
    if (alJugador) {
      // a la carretera, un poco adelante de donde vas
      x1 = B.x + R(-7, 7);
      z1 = u - Math.max(10, B.v * 1.2) - R(0, 50);
    } else {
      // al otro lado del campo (al otro ejército)
      x1 = -tq.q * R(15, 80);
      z1 = tq.posZ + R(-90, 90);
    }
    z1 = Math.min(Z0 - 5, Math.max(FIN, z1));
    tq.blanco = [x1, z1];
    tq.apuntaA = Math.atan2(-(x1 - tq.x), -(z1 - tq.posZ)); // la torreta gira hacia el blanco
  }
  function disparar(tq, i) {
    const gr = granadas.find((q) => q.t < 0);
    if (!gr || !tq.blanco) return;
    const [x1, z1] = tq.blanco;
    tq.blanco = null;
    const dist = Math.hypot(x1 - tq.x, z1 - tq.posZ),
      boca = new T.Vector3(0, 0, -5.2).applyAxisAngle(new T.Vector3(0, 1, 0), tq.apuntaA);
    Object.assign(gr, {
      t: 0,
      dur: 0.5 + dist / 110,
      x0: tq.x + boca.x,
      z0: tq.posZ + boca.z,
      y0: 2.7,
      x1,
      z1,
      alto: 6 + dist * 0.12,
    });
    gr.m.visible = true;
    const f = fogonazos[i];
    f.position.set(gr.x0, 2.7, gr.z0);
    f.visible = true;
    f.userData.t = 0.12;
    sonidoBum(0.5 * Math.max(0, 1 - Math.hypot(B.x - tq.x, B.z - (tq.posZ + CZ)) / 350));
  }

  // ===================== AVIONES =====================
  const avion = deModelo("avion-guerra", () => {
    const g = new T.Group();
    const f = cilindro(g, 0.9, 12, 0x5f6a72, 0, 0, 0);
    f.rotation.z = Math.PI / 2; // apunta en x
    caja(g, 3.5, 0.25, 13, 0x56616a, -0.5, 0, 0); // alas
    caja(g, 1.6, 0.2, 5, 0x56616a, -5.4, 0.2, 0);
    caja(g, 1.8, 2.2, 0.2, 0x56616a, -5.6, 1.2, 0); // cola
    caja(g, 2, 0.6, 1.1, 0x9ec6e0, 3.2, 0.7, 0, { metalness: 0.5, roughness: 0.2 }); // cabina
    return g;
  });
  avion.visible = false;
  animados.add(avion);
  const bombas = [];
  for (let i = 0; i < 10; i++) {
    const m = new T.Mesh(compartir(new T.CylinderGeometry(0.3, 0.3, 1.4, 8)), mat(0x2f3a2a));
    m.visible = false;
    animados.add(m);
    bombas.push({ m, activa: false, x: 0, y: 0, z: 0, vx: 0, vy: 0 });
  }
  const V = { activo: false, x: 0, z: 0, dir: 1, sueltas: 0, sigX: 0 };
  function pasarAvion() {
    V.activo = true;
    V.dir = Math.random() < 0.5 ? 1 : -1;
    V.x = -V.dir * 500;
    V.z = Math.min(Z0 - 20, Math.max(FIN, B.z - CZ - R(50, 150)));
    V.sueltas = 0;
    V.sigX = -V.dir * 18 * (A.bombasPorAvion / 7);
    avion.visible = true;
    avion.rotation.y = V.dir > 0 ? 0 : Math.PI;
    msg("✈💣 ¡AVIÓN! Va a soltar bombas sobre la carretera", 2200);
  }

  // tráfico de la zona: camiones y jeeps del ejército
  const camionMilitar = () =>
    deModelo("camion-militar", () => {
      const g = new T.Group();
      caja(g, 2.4, 1.6, 2.2, 0x4e5b31, 0, 1.6, -2.6);
      caja(g, 2.2, 0.6, 0.1, 0x9ec6e0, 0, 1.95, -3.72, { metalness: 0.5, roughness: 0.2 });
      caja(g, 2.5, 0.5, 5, 0x3b4524, 0, 0.95, 1);
      const lona = cilindro(g, 1.25, 5, 0x5f6b3c, 0, 2.2, 1);
      lona.rotation.x = Math.PI / 2;
      wr(
        g,
        [
          [-1.15, -2.6],
          [1.15, -2.6],
          [-1.15, 1.2],
          [1.15, 1.2],
          [-1.15, 2.6],
          [1.15, 2.6],
        ],
        0.55,
      );
      g.userData.hl = 3.8;
      return sh(g);
    });
  const jeepMilitar = () =>
    deModelo("jeep-militar", () => {
      const g = new T.Group();
      caja(g, 1.9, 0.9, 3.8, 0x556b2f, 0, 0.95, 0);
      caja(g, 1.8, 0.1, 1, 0x9ec6e0, 0, 1.6, -0.5, { metalness: 0.5, roughness: 0.2 });
      caja(g, 1.9, 0.12, 2, 0x3b4524, 0, 2.05, 0.6);
      wr(
        g,
        [
          [-0.95, -1.25],
          [0.95, -1.25],
          [-0.95, 1.25],
          [0.95, 1.25],
        ],
        0.45,
      );
      g.userData.hl = 2;
      return sh(g);
    });
  const vehAntes = window.vehNuevo;
  window.vehNuevo = function (zz) {
    if (zz == ZONA) {
      const r = Math.random();
      if (r < 0.35) return camionMilitar();
      if (r < 0.6) return jeepMilitar();
    }
    return vehAntes(zz);
  };

  // juntar el escenario fijo en pocas mallas
  G.add(fusionar(new T.Group().add(...G.children)));
  congelar(G, new Set());
  chunks.forEach(scatter);

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const t = reloj,
      u = B.z - CZ, // dónde vas dentro del ciclo
      cerca = !MONT.on && u < Z0 + 350 && u > Z1 - 350;
    animados.visible = cerca;
    if (!cerca) {
      V.activo = false;
      return;
    }
    if (state != "play") return;
    D.golpeT -= dt;
    const enLaZona = u < Z0 && u > Z1;
    if (enLaZona) {
      D.dentro = cyc;
      sc.fog.color.lerp(_c.setRGB(0.4, 0.36, 0.31), 0.65); // humo de la batalla
    }
    if (play() && D.aviso != cyc && u < Z0 + 40 && u > Z0 - 40) {
      D.aviso = cyc;
      msg("🪖💥 ¡CAMPO DE GUERRA! Los tanques están disparando: pasá rápido y esquivá las explosiones", 4500);
    }
    // ----- tanques -----
    tanques.forEach((tq, i) => {
      if (tq.roto <= 0) tq.posZ = tq.z0 + Math.sin(t * tq.vel + tq.f) * 30; // patrulla para adelante y para atrás
      tq.g.position.set(tq.x, 0, tq.posZ);
      tq.llama.visible = tq.humo.visible = tq.roto > 0;
      if (tq.roto > 0) {
        // le dieron: se queda quieto, echando fuego y humo negro, y no dispara
        tq.roto -= dt;
        tq.llama.position.set(tq.x, 3.5 + Math.sin(t * 9 + i) * 0.4, tq.posZ);
        tq.llama.scale.setScalar(4.5 + Math.sin(t * 13 + i) * 0.8);
        const k = (t * 0.5 + i * 0.13) % 1;
        tq.humo.position.set(tq.x + k * 3, 5 + k * 18, tq.posZ);
        tq.humo.scale.setScalar(5 + k * 12);
        tq.humo.material.opacity = 0.75 * (1 - k);
        if (tq.roto <= 0) tq.g.rotation.z = 0; // ya lo arreglaron
        return;
      }
      // la torreta gira poco a poco (por el lado más corto) hacia donde va a disparar
      const meta = tq.apuntaA != null ? tq.apuntaA : (tq.q * Math.PI) / 2 + Math.sin(t * 0.3 + tq.f) * 0.5,
        giro =
          ((((meta - tq.torreta.rotation.y + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
          Math.PI;
      tq.torreta.rotation.y += giro * Math.min(1, dt * 3);
      tq.dispT -= dt;
      const enRango = Math.abs(u - tq.posZ) < 420;
      if (tq.dispT <= 0.8 && !tq.blanco && enRango) elegirBlanco(tq); // primero apunta…
      if (tq.dispT <= 0) {
        tq.dispT = R(A.cadaCuantoDisparan[0], A.cadaCuantoDisparan[1]) / Math.max(0.4, CALIDAD.efectos);
        if (enRango) disparar(tq, i); // …y después dispara
        tq.apuntaA = null;
      }
    });
    fogonazos.forEach((f) => {
      if (!f.visible) return;
      f.userData.t -= dt;
      if (f.userData.t <= 0) f.visible = false;
    });
    // ----- granadas en el aire -----
    granadas.forEach((gr) => {
      if (gr.t < 0) return;
      gr.t += dt / gr.dur;
      const k = Math.min(1, gr.t);
      gr.m.position.set(
        gr.x0 + (gr.x1 - gr.x0) * k,
        gr.y0 * (1 - k) + gr.alto * 4 * k * (1 - k),
        gr.z0 + (gr.z1 - gr.z0) * k,
      );
      if (gr.t >= 1) {
        gr.t = -1;
        gr.m.visible = false;
        explotar(gr.x1, gr.z1, 1);
      }
    });
    // ----- avión con bombas -----
    D.avionT -= dt;
    if (!V.activo && D.avionT <= 0 && enLaZona) {
      D.avionT = R(A.avionCada[0], A.avionCada[1]);
      pasarAvion();
    }
    if (V.activo) {
      V.x += V.dir * 120 * dt;
      avion.position.set(V.x, 70, V.z);
      // suelta bombas al cruzar sobre la carretera
      if (V.sueltas < A.bombasPorAvion && V.dir * (V.x - V.sigX) >= 0) {
        const b = bombas.find((q) => !q.activa);
        if (b) {
          Object.assign(b, { activa: true, x: V.x, y: 68, z: V.z, vx: V.dir * 6, vy: 0 });
          b.m.visible = true;
        }
        V.sueltas++;
        V.sigX += V.dir * 6;
      }
      if (Math.abs(V.x) > 520) {
        V.activo = false;
        avion.visible = false;
      }
    }
    bombas.forEach((b) => {
      if (!b.activa) return;
      b.vy -= 25 * dt;
      b.vx *= Math.pow(0.6, dt);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.m.position.set(b.x, b.y, b.z);
      b.m.rotation.z = Math.atan2(b.vy, b.vx) + Math.PI / 2;
      if (b.y <= 0) {
        b.activa = false;
        b.m.visible = false;
        explotar(b.x, b.z, 1.4);
      }
    });
    // ----- explosiones -----
    explosiones.forEach((e) => {
      if (e.t <= 0) return;
      e.t -= dt * 0.9;
      const k = 1 - Math.max(0, e.t);
      e.fuego.visible = e.t > 0.15;
      e.fuego.position.set(e.x, 2.5 + k * 6 * e.tam, e.z);
      e.fuego.scale.setScalar((8 + k * 16) * e.tam);
      e.fuego.material.opacity = Math.min(1, e.t * 1.8);
      e.humo.visible = e.t > 0;
      e.humo.position.set(e.x, 4 + k * 16 * e.tam, e.z);
      e.humo.scale.setScalar((8 + k * 26) * e.tam);
      e.humo.material.opacity = Math.max(0, Math.min(0.9, k * 1.8) * Math.min(1, e.t * 1.6));
    });
    crateres.forEach((c) => {
      if (c.t <= 0) return;
      c.t -= dt;
      if (c.t < 3) c.m.material.opacity = Math.max(0, c.t / 3) * 0.8;
      if (c.t <= 0) c.m.visible = false;
    });
    // ----- escombros (los vivos al principio de la lista: solo esos se dibujan) -----
    let n = 0;
    for (let i = 0; i < N_ESC; i++) {
      const p = esc[i];
      if (p.t <= 0) continue;
      p.t -= dt;
      p.vy -= 28 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < p.s * 0.5) {
        p.y = p.s * 0.5;
        p.vy *= -0.25;
        p.vx *= 0.5;
        p.vz *= 0.5;
      }
      p.r += dt * 4;
      const s = p.s * Math.min(1, p.t * 2);
      m4.compose(v4.set(p.x, p.y, p.z), q4.setFromEuler(e4.set(p.r, p.r * 0.6, 0)), s4.set(s, s, s));
      if (n != i) {
        esc[i] = esc[n];
        esc[n] = p;
        if (escombros.instanceColor) {
          escombros.getColorAt(i, _c);
          const ci = _c.getHex();
          escombros.getColorAt(n, _c);
          escombros.setColorAt(i, _c);
          escombros.setColorAt(n, _c.setHex(ci));
          escombros.instanceColor.needsUpdate = true;
        }
      }
      escombros.setMatrixAt(n, m4);
      n++;
    }
    sigEsc = n % N_ESC;
    escombros.count = n;
    escombros.instanceMatrix.needsUpdate = true;
    // ----- premio al cruzar -----
    if (play() && D.premio != cyc && D.dentro == cyc && u < FIN && u > FIN - 40) {
      D.premio = cyc;
      cash += A.premio;
      msg(`🪖 ¡CRUZASTE EL CAMPO DE GUERRA! +₡${A.premio.toLocaleString("es-CR")}`, 4500);
    }
  };
})();
