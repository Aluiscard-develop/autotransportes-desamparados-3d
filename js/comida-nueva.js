// =====================================================================
// COMIDA NUEVA y COMIDA QUE CAE EN LOS EDIFICIOS. Se carga después de js/tormenta-fettuccine.js.
// Usa la lluvia de comida de js/tormenta-comida.js (window.TORMENTA_COMIDA).
//   COMIDAS NUEVAS · rábanos, pilas de panqueques, huevos duros (rebotan), huevos fritos (resbalan)
//                    y mazorcas (ruedan). Caen en la Tormenta Morada y en las tormentas de colores
//                    (la roja y la naranja, js/tormentas-colores.js): mirá "tormenta" en cada una.
//   EDIFICIOS      · a veces la comida cae encima de un edificio: lo rompe, salen volando pedazos
//                    y el edificio se derrumba (AJUSTES.tormentaComida.enEdificios dice qué tan seguido)
// =====================================================================
(function () {
  const TC = window.TORMENTA_COMIDA;
  if (!TC) return;
  const A = AJUSTES.tormentaComida,
    { compartir, mat, fachada, humoTex, COLORES_EDIFICIO } = MUNDO;

  // ===================== COMIDAS NUEVAS (tamaño 1 = 1 metro de ancho) =====================
  const pieza = (g, geo, color, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, o) => {
    const m = new T.Mesh(geo, mat(color, Object.assign({ roughness: 0.55 }, o)));
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
  const media = (r, arriba) =>
    compartir(new T.SphereGeometry(r, 18, 9, 0, Math.PI * 2, arriba ? 0 : Math.PI / 2, Math.PI / 2));
  const caja = (w, h, d) => compartir(new T.BoxGeometry(w, h, d));
  const cono = (r, h, lados = 12) => compartir(new T.ConeGeometry(r, h, lados));
  const D = {};
  window.COMIDA_NUEVA = D; // para revisar desde la consola: TORMENTA_COMIDA.soltar(COMIDA_NUEVA.rabano)

  // ----- rábano: cae de punta y se clava en el piso -----
  D.rabano = TC.agregarComida({
    nombre: "rábano",
    un: "un",
    el: "el",
    emoji: "🌱",
    tormenta: ["roja", "morada"],
    arma(g) {
      pieza(g, esfera(0.45), 0xd6284f, 0, 0.55, 0, 0, 0, 0, 1, 0.92, 1); // bulbo rojo
      pieza(g, esfera(0.3), 0xf4f1ea, 0, 0.22, 0, 0, 0, 0, 1, 0.6, 1); // parte blanca de abajo
      pieza(g, cono(0.1, 0.55), 0xf4f1ea, 0, -0.05, 0, Math.PI); // la raíz
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26;
        pieza(
          g,
          cil(0.03, 0.04, 0.5, 6),
          0x5b9e3a,
          Math.cos(a) * 0.08,
          1.1,
          -Math.sin(a) * 0.08,
          0,
          a,
          -0.25,
        ); // tallo
        pieza(
          g,
          esfera(0.5, 10, 8),
          0x3f9a3a,
          Math.cos(a) * 0.3,
          1.5,
          -Math.sin(a) * 0.3,
          0,
          a,
          -0.45,
          0.26,
          0.6,
          0.07,
        ); // hoja
      }
    },
    alto: 1.9,
    radio: 0.5,
    clava: true,
  });

  // ----- pila de panqueques con mantequilla y miel -----
  D.panqueques = TC.agregarComida({
    nombre: "pila de panqueques",
    un: "una",
    el: "la",
    emoji: "🥞",
    tormenta: ["naranja", "morada"],
    arma(g) {
      for (let i = 0; i < 4; i++)
        pieza(g, cil(0.5, 0.5, 0.1, 24), i % 2 ? 0xd8964a : 0xe5ad66, 0, 0.06 + i * 0.11, 0);
      pieza(g, cil(0.43, 0.43, 0.025, 20), 0xa04a12, 0, 0.5, 0); // miel
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + 0.3;
        pieza(
          g,
          caja(0.07, 0.2 + (i % 3) * 0.06, 0.04),
          0xa04a12,
          Math.cos(a) * 0.5,
          0.42,
          Math.sin(a) * 0.5,
          0,
          -a,
        ); // chorreando
      }
      pieza(g, caja(0.22, 0.12, 0.22), 0xffe066, 0.05, 0.57, -0.03, 0, 0.4); // mantequilla
    },
    alto: 0.64,
    radio: 0.55,
    gira: true,
  });

  // ----- huevo duro partido en dos (rebota al caer) -----
  D.huevoDuro = TC.agregarComida({
    nombre: "huevo duro",
    un: "un",
    el: "el",
    emoji: "🥚",
    tormenta: ["roja", "morada"],
    arma(g) {
      [-0.32, 0.32].forEach((z) => {
        pieza(g, media(0.3, false), 0xfbf8f0, 0, 0.3, z, 0, 0, 0, 1.4, 1, 1); // clara (la mitad de abajo)
        pieza(g, cil(0.3, 0.3, 0.02, 20), 0xfffdf6, 0, 0.3, z, 0, 0, 0, 1.4, 1, 1); // donde se partió
        pieza(g, media(0.15, true), 0xffc21a, 0, 0.3, z, 0, 0, 0, 1.25, 0.55, 1.25); // yema
      });
    },
    alto: 0.42,
    radio: 0.55,
    rebota: true,
  });

  // ----- huevo frito: plano y resbaloso -----
  const formaClara = new T.Shape();
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      r = 0.5 + 0.07 * Math.sin(i * 2.7) + 0.04 * Math.cos(i * 5.1);
    i
      ? formaClara.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      : formaClara.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  D.huevoFrito = TC.agregarComida({
    nombre: "huevo frito",
    un: "un",
    el: "el",
    emoji: "🍳",
    tormenta: ["naranja", "morada"],
    arma(g) {
      pieza(
        g,
        compartir(
          new T.ExtrudeGeometry(formaClara, { depth: 0.05, bevelEnabled: false }).rotateX(-Math.PI / 2),
        ),
        0xfdfcf4,
        0,
        0,
        0,
      ); // la clara
      pieza(g, media(0.18, true), 0xffa41b, 0.06, 0.05, -0.05, 0, 0, 0, 1, 0.65, 1); // la yema
    },
    alto: 0.16,
    radio: 0.55,
    gira: true,
    // si le pasás por encima, resbalás de lado
    alChocar(f, dt) {
      B.v *= Math.pow(0.7, dt);
      B.x += (Math.sign(B.x - f.x) || 1) * 5 * dt;
      if (!f.resbalo) {
        f.resbalo = true;
        msg("🍳 ¡Te resbalaste en un huevo frito gigante!", 2000);
      }
    },
  });

  // ----- mazorca: cae acostada y rueda por la carretera -----
  D.mazorca = TC.agregarComida({
    nombre: "mazorca",
    un: "una",
    el: "la",
    emoji: "🌽",
    tormenta: ["naranja", "morada"],
    arma(g) {
      pieza(g, cil(0.27, 0.27, 1.25, 16), 0xf2c014, 0, 0.3, 0, 0, 0, Math.PI / 2); // el olote
      [-0.62, 0.62].forEach((x) => pieza(g, esfera(0.27, 12, 8), 0xf2c014, x, 0.3, 0, 0, 0, 0, 0.5, 1, 1));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        for (let k = 0; k < 9; k++)
          pieza(
            g,
            caja(0.11, 0.07, 0.12),
            0xffd84a,
            -0.56 + k * 0.14,
            0.3 + Math.cos(a) * 0.27,
            Math.sin(a) * 0.27,
            a,
          ); // granos
      }
      [0, 2.1, 4.2].forEach((b) =>
        pieza(
          g,
          esfera(0.5, 10, 6),
          0x7cb342,
          0.78,
          0.3 + Math.cos(b) * 0.12,
          Math.sin(b) * 0.12,
          b,
          0,
          0,
          0.55,
          0.12,
          0.3,
        ),
      ); // hojas
    },
    alto: 0.6,
    radio: 0.75,
    rueda: true,
    radioRueda: 0.3,
    tira: [0.8, 0.3], // es larga: choca como una tira atravesada
  });

  TC.mensajes.roja = [
    "🔴 ¡Llueven rábanos gigantes!",
    "🍟🌪 ¡El tornado de papas está lanzando hamburguesas!",
    "🥚 ¡Huevos duros que rebotan!",
    "😱 ¡EL CIELO SE PUSO ROJO!",
  ];
  TC.mensajes.naranja = [
    "🍊 ¡Llueve jugo de naranja!",
    "🔺 ¡Totopos volando como frisbis! ¡Agachate!",
    "🌽 ¡Las mazorcas ruedan!",
    "🥞 ¡Cuidado con los panqueques gigantes!",
    "🍳 ¡Huevos fritos resbalosos en la carretera!",
  ];

  // ===================== COMIDA ENCIMA DE LOS EDIFICIOS =====================
  // Unos edificios a la orilla: cuando una comida va a caer encima de uno, aparece el edificio, la comida
  // lo golpea en el techo, salen volando pedazos y el edificio se derrumba.
  const torres = [];
  for (let i = 0; i < 4; i++) {
    const h = R(26, 50),
      f = fachada(16, h, 14, pk_(COLORES_EDIFICIO));
    f.position.y = h / 2;
    const g = new T.Group();
    g.add(f);
    const polvo = [];
    for (let k = 0; k < 4; k++) {
      const sp = new T.Sprite(
        new T.SpriteMaterial({
          map: humoTex,
          color: 0xa09890,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );
      g.add(sp);
      polvo.push(sp);
    }
    g.visible = false;
    sc.add(g);
    torres.push({ g, f, polvo, h, x: 0, z: 0, t: -1, roto: -1, lado: 1 });
  }
  // pedazos de edificio (todos en una sola malla)
  const N_PEDAZOS = 110,
    pedMesh = new T.InstancedMesh(
      compartir(new T.BoxGeometry(1, 1, 1)),
      new T.MeshStandardMaterial({ roughness: 0.85 }),
      N_PEDAZOS,
    );
  pedMesh.frustumCulled = false;
  pedMesh.castShadow = true;
  pedMesh.count = 0;
  sc.add(pedMesh);
  const pedazos = [];
  const COLOR_PEDAZO = [0x9a9590, 0xb8b2a8, 0x7d7873, 0x8fb8d8, 0x6d8fae, 0xd9d4c9];
  const _c = new T.Color();
  for (let i = 0; i < N_PEDAZOS; i++) {
    pedazos.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, w: 1, h: 1, d: 1, t: 0 });
    pedMesh.setColorAt(i, _c.setHex(COLOR_PEDAZO[i % COLOR_PEDAZO.length]));
  }
  pedMesh.instanceColor.needsUpdate = true;
  const soltarPedazos = (x, y, z, cuantos, lado) => {
    let n = Math.round(cuantos * Math.max(0.4, CALIDAD.efectos));
    for (const p of pedazos) {
      if (n <= 0) break;
      if (p.t > 0) continue;
      n--;
      Object.assign(p, {
        x: x + R(-6, 6),
        y: y - R(0, 6),
        z: z + R(-6, 6),
        vx: R(-10, 10) - lado * R(0, 9), // muchos salen hacia la carretera
        vy: R(4, 16),
        vz: R(-10, 10),
        rx: R(0, 6),
        ry: R(0, 6),
        w: R(0.8, 3.2),
        h: R(0.6, 2.2),
        d: R(0.8, 3),
        t: R(5, 8),
      });
    }
  };
  // la comida que va a salir: a veces se manda encima de un edificio
  TC.alSoltar.push((f, op) => {
    if (op.x != null || f.c.rueda || Math.random() >= A.enEdificios) return;
    const e = torres.find((q) => q.t < 0);
    if (!e) return;
    e.lado = Math.random() < 0.5 ? -1 : 1;
    Object.assign(e, { x: e.lado * R(30, 50), z: f.z, t: 0, roto: -1, avisado: false });
    e.g.visible = true;
    e.g.rotation.set(0, 0, 0);
    e.g.position.set(e.x, 0, e.z);
    e.f.position.y = e.h / 2;
    e.polvo.forEach((sp) => (sp.material.opacity = 0));
    f.x = e.x + R(-3, 3);
    f.z = e.z + R(-3, 3);
    if (f.aviso) f.aviso.position.set(f.x, 0.06, f.z);
    f.techo = e.h;
    f.alTecho = () => {
      e.roto = 0;
      soltarPedazos(e.x, e.h, e.z, 30, e.lado);
      const cerca = Math.abs(e.z - B.z) < 300;
      if (cerca && state == "play") {
        const c = f.c,
          un = c.un[0].toUpperCase() + c.un.slice(1);
        msg(`${c.emoji}🏢💥 ¡${un} ${c.nombre} gigante cayó encima de un edificio!`, 2200);
        shake = Math.max(shake, 0.4);
      }
    };
  });

  // ===================== CUADRO A CUADRO =====================
  const m4 = new T.Matrix4(),
    q4 = new T.Quaternion(),
    e4 = new T.Euler(),
    v4 = new T.Vector3(),
    s4 = new T.Vector3();
  let zAnt = null;
  const limpiar = () => {
    torres.forEach((e) => ((e.t = -1), (e.g.visible = false)));
    pedazos.forEach((p) => (p.t = 0));
    pedMesh.count = 0;
  };
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    if ((zAnt != null && Math.abs(B.z - zAnt) > 30 && state == "play") || MONT.on) limpiar();
    zAnt = B.z;
    if (state != "play") return;
    // ----- edificios: esperan la comida y después se derrumban -----
    torres.forEach((e) => {
      if (e.t < 0) return;
      e.t += dt;
      if (e.roto >= 0) {
        e.roto += dt;
        const c = Math.min(1, e.roto / 3.5);
        e.g.rotation.z = e.lado * c * c * 0.6; // se inclina
        e.f.position.y = e.h / 2 - c * e.h * 0.75; // y se hunde
        e.polvo.forEach((sp, i) => {
          sp.position.set((i - 1.5) * 7, 4 + c * 18, R(-1, 1) * 3);
          sp.scale.setScalar(14 + c * 34);
          sp.material.opacity = Math.min(0.85, e.roto) * Math.max(0, 1 - Math.max(0, e.roto - 5) / 3);
        });
        if (e.roto < 2 && Math.random() < dt * 6) soltarPedazos(e.x, e.h * (1 - c * 0.7), e.z, 3, e.lado);
      }
      if (e.roto > 9 || e.t > 25 || e.z - B.z > 160) {
        e.t = -1;
        e.g.visible = false;
      }
    });
    // ----- pedazos volando -----
    let n = 0;
    for (const p of pedazos) {
      if (p.t <= 0) continue;
      p.t -= dt;
      p.vy -= 25 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < p.h / 2) {
        p.y = p.h / 2;
        p.vy = p.vy < -3 ? -p.vy * 0.3 : 0;
        p.vx *= 0.6;
        p.vz *= 0.6;
      } else {
        p.rx += dt * 3;
        p.ry += dt * 2;
      }
      // los pedazos grandes que caen en la carretera le pegan a los carros
      if (p.vy < -5 && p.y < 3)
        for (const car of cars)
          if (!car.vy && Math.abs(car.x - p.x) < 2 && Math.abs(car.z - p.z) < 3) {
            car.hit = 1;
            car.vz *= 0.3;
          }
      if (p.z - B.z > 150) p.t = 0;
      const s = Math.min(1, p.t);
      m4.compose(
        v4.set(p.x, p.y, p.z),
        q4.setFromEuler(e4.set(p.rx, p.ry, 0)),
        s4.set(p.w * s, p.h * s, p.d * s),
      );
      pedMesh.setMatrixAt(n++, m4);
    }
    pedMesh.count = n;
    pedMesh.instanceMatrix.needsUpdate = true;
  };
})();
