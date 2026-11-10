// =====================================================================
// APOCALIPSIS. Se carga al final (después de js/avalancha.js). Pasa en TODAS las zonas, por fases:
//   1. CALMA      · un rato tranquilo (al empezar y entre apocalipsis)
//   2. CAOS       · los carros van rapidísimo, tornados gigantes por todas partes con carros volando,
//                   clima pésimo, explosiones y gente corriendo y gritando
//   3. TORMENTA   · se turnan: un apocalipsis trae la Tormenta Morada y el siguiente la Tormenta de
//                   Fettuccine (js/tormenta-fettuccine.js). AP.turno cuenta cuál toca.
//      MORADA     · la Tormenta Morada, todo junto en una sola tormenta: cielo morado, rayos morados,
//                   tornados morados, bolas de fuego, LLUVIA DE COMIDA GIGANTE (js/tormenta-comida.js)
//                   y la CARRETERA PARTIÉNDOSE a la mitad (js/carretera-partida.js).
//                   Cada minuto sube de nivel (más peligrosa) y te da ₡5000 por aguantar. Dura
//                   AJUSTES.apocalipsis.nivelesMorada niveles y vuelve la calma (+₡ por sobrevivir).
// El desastre total (tornados en el horizonte, multitudes, derrumbes, inundaciones…) está en js/apocalipsis2.js. Se apaga desde el menú ("🌪 Apocalipsis: No").
// Cuánto dura cada fase y qué tan rápido van los carros: js/ajustes.js (AJUSTES.apocalipsis).
// =====================================================================
(function () {
  const { compartir, mat, humoTex, llamaTex } = MUNDO;
  const FASES = AJUSTES.apocalipsis; // primeraCalma, calma, caos, morada (cada cuánto sube de nivel), premio
  const VEL_CARROS = FASES.velCarros; // veces más rápido que lo normal
  const AP = { fase: "calma", nivel: 0, t: FASES.primeraCalma, aviso: false, gritoT: 0, rayoT: 0, boomT: 0, golpeT: 0, turno: 0 };
  window.APOCALIPSIS = AP; // para revisar desde la consola

  // ----- opción del menú -----
  const sel = document.getElementById("apo");
  const activo = () => !sel || sel.value == "1";

  // ----- tornados (se mueven por el mundo alrededor del jugador) -----
  const N_TORNADOS = 14;
  const tornados = [];
  for (let i = 0; i < N_TORNADOS; i++) {
    const g = new T.Group(),
      humo = [],
      autos = [];
    for (let k = 0; k < 18; k++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0x3a3d42, depthWrite: false, transparent: true, opacity: 0.85 }));
      sp.userData.k = k / 18;
      g.add(sp);
      humo.push(sp);
    }
    for (let k = 0; k < 3; k++) {
      const o = mkCar();
      g.add(o);
      autos.push({ o, f: k * 2.1, r: R(8, 14) });
    }
    g.visible = false;
    sc.add(g);
    tornados.push({ g, humo, autos, x: 0, z: 0, vx: 0, vz: 0, alto: R(150, 260), activo: false });
  }
  const ponerTornado = (t, cerca) => {
    t.x = R(-110, 110);
    t.z = B.z - (cerca ? R(120, 450) : R(400, 800));
    t.vx = R(-6, 6);
    t.vz = R(-3, 3);
    t.activo = true;
  };

  // ----- gente corriendo y gritando -----
  const gente = [];
  for (let i = 0; i < 26; i++) {
    const g = new T.Group(),
      ropa = pk_([0xe53935, 0x1e88e5, 0xfdd835, 0x8e24aa, 0x43a047, 0xff7043, 0xffffff]);
    const piernaI = new T.Mesh(compartir(new T.BoxGeometry(0.22, 0.8, 0.22)), mat(0x263238)),
      piernaD = piernaI.clone(),
      cuerpo = new T.Mesh(compartir(new T.BoxGeometry(0.56, 0.75, 0.36)), mat(ropa)),
      cabeza = new T.Mesh(compartir(new T.SphereGeometry(0.2, 10, 8)), mat(0xd7a27a)),
      brazoI = new T.Mesh(compartir(new T.BoxGeometry(0.16, 0.7, 0.16)), mat(ropa)),
      brazoD = brazoI.clone();
    piernaI.position.set(-0.13, 0.4, 0);
    piernaD.position.set(0.13, 0.4, 0);
    cuerpo.position.y = 1.18;
    cabeza.position.y = 1.78;
    brazoI.position.set(-0.36, 1.75, 0); // brazos arriba: ¡desesperados!
    brazoD.position.set(0.36, 1.75, 0);
    g.add(piernaI, piernaD, cuerpo, cabeza, brazoI, brazoD);
    g.visible = false;
    sc.add(g);
    gente.push({ g, piernaI, piernaD, brazoI, brazoD, x: 0, z: 0, v: 0, f: R(0, 6) });
  }
  const ponerPersona = (p) => {
    p.x = (Math.random() < 0.5 ? -1 : 1) * R(8.5, 16);
    p.z = B.z - R(40, 380);
    p.v = R(5, 8) * (Math.random() < 0.7 ? 1 : -1); // casi todos corren hacia atrás (huyendo)
  };

  // ----- explosiones y bolas de fuego -----
  const explosiones = [];
  for (let i = 0; i < 6; i++) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: llamaTex, color: 0xffffff, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.visible = false;
    sc.add(sp);
    explosiones.push({ sp, t: 0, x: 0, z: 0 });
  }
  const bolas = [];
  for (let i = 0; i < 5; i++) {
    const m = new T.Mesh(compartir(new T.SphereGeometry(1.6, 12, 10)), new T.MeshBasicMaterial({ color: 0xd05cff }));
    const sp = new T.Sprite(new T.SpriteMaterial({ map: gTex, color: 0xc040ff, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.scale.setScalar(14);
    m.add(sp);
    m.visible = false;
    sc.add(m);
    bolas.push({ m, x: 0, y: 0, z: 0, vx: 0, vz: 0, activa: false });
  }
  const explotar = (x, z, fuerte) => {
    const e = explosiones.find((q) => q.t <= 0) || explosiones[0];
    Object.assign(e, { t: 1, x, z });
    e.sp.visible = true;
    if (play() && Math.hypot(B.x - x, B.z - z) < (fuerte ? 12 : 8) && B.y < 6 && AP.golpeT <= 0) {
      AP.golpeT = 1.5;
      dmg += PV.crush ? 4 : 12;
      B.v *= 0.5;
      shake = 1;
      msg("💥 ¡Una explosión te alcanzó!", 1800);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
    for (const c of cars)
      if (!c.vy && Math.abs(c.x - x) < 12 && Math.abs(c.z - z) < 12) {
        c.vy = R(10, 18);
        c.vx = R(-8, 8);
        c.hit = 1;
      }
  };

  // ----- rayo (morado en la tormenta morada) -----
  const rayo = new T.Group();
  {
    let x = 0,
      y = 140;
    while (y > 0) {
      const nx = x + R(-6, 6),
        ny = y - R(8, 18),
        l = Math.hypot(nx - x, ny - y),
        s = new T.Mesh(new T.BoxGeometry(0.6, l, 0.6), new T.MeshBasicMaterial({ color: 0xf0d8ff }));
      s.position.set((x + nx) / 2, (y + ny) / 2, 0);
      s.rotation.z = -Math.atan2(nx - x, y - ny);
      rayo.add(s);
      x = nx;
      y = ny;
    }
    rayo.visible = false;
    sc.add(rayo);
  }
  // cielo morado: una cúpula transparente alrededor de la cámara
  const cupula = new T.Mesh(
    new T.SphereGeometry(950, 32, 16),
    new T.MeshBasicMaterial({ color: 0x6a1b9a, side: T.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false }),
  );
  cupula.visible = false;
  sc.add(cupula);
  CALIDAD.fondo(cupula); // en gráficos Bajo se acerca a la cámara para que no la recorte

  // ----- sonidos: gritos y truenos -----
  const grito = () => {
    try {
      if (!AC) return;
      const o = AC.createOscillator(),
        v = AC.createGain(),
        vib = AC.createOscillator(),
        vg = AC.createGain(),
        t0 = AC.currentTime,
        f = R(650, 1100),
        dur = R(0.5, 0.9);
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, t0);
      o.frequency.linearRampToValueAtTime(f * R(1.2, 1.5), t0 + dur * 0.3);
      o.frequency.linearRampToValueAtTime(f * 0.8, t0 + dur);
      vib.frequency.value = R(6, 11);
      vg.gain.value = f * 0.05;
      vib.connect(vg).connect(o.frequency);
      v.gain.setValueAtTime(0, t0);
      v.gain.linearRampToValueAtTime(0.05, t0 + 0.05);
      v.gain.linearRampToValueAtTime(0, t0 + dur);
      o.connect(v).connect(AC.destination);
      o.start(t0);
      vib.start(t0);
      o.stop(t0 + dur);
      vib.stop(t0 + dur);
    } catch (e) {}
  };
  let bufTrueno;
  const trueno = (fuerza) => {
    try {
      if (!AC) return;
      if (!bufTrueno) {
        const n = AC.sampleRate * 2.5,
          b = AC.createBuffer(1, n, AC.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.28));
        bufTrueno = b;
      }
      const s = AC.createBufferSource(),
        f = AC.createBiquadFilter(),
        g = AC.createGain();
      s.buffer = bufTrueno;
      f.type = "lowpass";
      f.frequency.value = 400;
      g.gain.value = 0.8 * fuerza;
      s.connect(f).connect(g).connect(AC.destination);
      s.start();
    } catch (e) {}
  };

  const play = () => state == "play" && !MONT.on;
  const ocultarTodo = () => {
    tornados.forEach((t) => ((t.g.visible = false), (t.activo = false)));
    gente.forEach((p) => (p.g.visible = false));
    bolas.forEach((b) => ((b.m.visible = false), (b.activa = false)));
    explosiones.forEach((e) => ((e.sp.visible = false), (e.t = 0)));
    rayo.visible = false;
    cupula.visible = false;
  };
  const cambiarFase = (f) => {
    const antes = AP.fase;
    AP.fase = f;
    AP.t = FASES[f];
    AP.aviso = false;
    if (f == "caos") {
      tornados.forEach((t, i) => i < 5 && ponerTornado(t, true));
      gente.forEach(ponerPersona);
      msg("🌪🌪🌪 ¡APOCALIPSIS! Tornados gigantes en todas partes, los carros se volvieron locos · ¡SOBREVIVÍ!", 5000);
      trueno(1);
    } else if (f == "morada") {
      tornados.forEach((t) => !t.activo && ponerTornado(t, false));
      msg("🟣⚡🍔 ¡LA TORMENTA MORADA! Rayos, tornados, bolas de fuego, COMIDA GIGANTE cayendo del cielo y la carretera partiéndose", 5500);
      trueno(1);
    } else if (f == "fettuccine") {
      // se van los tornados del caos: ahora llueve fettuccine (js/tormenta-fettuccine.js)
      tornados.forEach((t) => ((t.g.visible = false), (t.activo = false)));
      explosiones.forEach((e) => ((e.sp.visible = false), (e.t = 0)));
      rayo.visible = false;
      msg("🍝🌪 ¡TORMENTA DE FETTUCCINE! Llueven fideos, platos gigantes de fettuccine Alfredo y la salsa resbala · ¡SOBREVIVÍ!", 5500);
      trueno(1);
    } else {
      ocultarTodo();
      const fett = antes == "fettuccine",
        premio = fett ? FASES.premioFettuccine : FASES.premio;
      cash += premio;
      msg(`🌤 ${fett ? "Pasó la Tormenta de Fettuccine" : antes == "morada" ? "Pasó la Tormenta Morada" : "Pasó el apocalipsis"}... ¡Sobreviviste! +₡${premio.toLocaleString("es-CR")}`, 4500);
    }
  };

  // ----- gente corriendo y gritando (en el caos y en las tormentas) -----
  const moverGente = (t, dt) => {
    const nGente = Math.max(6, Math.round(gente.length * CALIDAD.efectos)); // en gráficos Bajo, menos
    gente.forEach((p, i) => {
      if (i >= nGente) return (p.g.visible = false);
      p.z += p.v * dt;
      if (p.z - B.z > 120 || B.z - p.z > 420) ponerPersona(p);
      p.g.visible = true;
      const paso = Math.sin(t * 14 + p.f);
      p.g.position.set(p.x + Math.sin(t * 3 + p.f) * 0.6, Math.abs(paso) * 0.15, p.z);
      p.g.rotation.y = p.v > 0 ? Math.PI : 0;
      p.piernaI.rotation.x = paso * 0.8;
      p.piernaD.rotation.x = -paso * 0.8;
      p.brazoI.rotation.z = 0.3 + Math.sin(t * 18 + p.f) * 0.4;
      p.brazoD.rotation.z = -0.3 - Math.sin(t * 18 + p.f + 1) * 0.4;
    });
  };
  const GRITOS = {
    normal: ["😱 ¡AAAAAAH! ¡CORRAN!", "😭 ¡AYUDA! ¡AUXILIO!", "😱 ¡NOS VAMOS A MORIR!", "🏃 ¡SÁLVESE QUIEN PUEDA!", "😨 ¡EL TORNADO VIENE PARA ACÁ!"],
    comida: ["😱 ¡UNA HAMBURGUESA GIGANTE!", "😭 ¡CORRAN, VIENE LA PIZZA!", "😱 ¡LAS DONAS NOS VAN A APLASTAR!", "🏃 ¡SÁLVESE QUIEN PUEDA!", "😨 ¡NO ME COMAN!"],
    fettuccine: ["😱 ¡ME CAYÓ SALSA ALFREDO!", "😭 ¡TENGO FETTUCCINE EN EL PELO!", "🏃 ¡CORRAN, VIENE EL FETTUCCINE!", "😨 ¡NOS VA A ENREDAR!", "😱 ¡NO ME RESBALO, NO ME RESBALO!"],
  };
  const gritar = (dt, tema) => {
    AP.gritoT -= dt;
    if (AP.gritoT > 0) return;
    AP.gritoT = R(1, 2.6);
    grito();
    if (Math.random() < 0.25) msg(pk_(GRITOS[tema] || GRITOS.normal), 1500);
  };
  // los carros van rapidísimo (k = veces más rápido que lo normal)
  const acelerarCarros = (k, dt) => {
    for (const c of cars)
      if (!c.hit && !c.stat) {
        c.z += c.vz * (k - 1) * dt;
        c.o.position.z = c.z;
      }
  };
  // ----- cuadro a cuadro -----
  let reloj = 0,
    zAnt = null;
  const _c = new T.Color(),
    morado = new T.Color(0x7b1fa2);
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const t = reloj;
    // apagado desde el menú, o en la ruta de montaña
    if (!activo() || MONT.on) {
      if (AP.fase != "calma") {
        AP.fase = "calma";
        AP.nivel = 0;
        AP.t = FASES.calma;
      }
      ocultarTodo();
      return;
    }
    // al empezar de nuevo (inicio o reinicio) vuelve la calma
    if (zAnt != null && Math.abs(B.z - zAnt) > 30 && state == "play") {
      AP.fase = "calma";
      AP.nivel = 0;
      AP.t = FASES.primeraCalma;
      ocultarTodo();
    }
    zAnt = B.z;
    if (state != "play") return;

    // ----- fases -----
    AP.t -= dt;
    if (AP.fase == "calma") {
      if (AP.t < 5 && !AP.aviso) {
        AP.aviso = true;
        msg("⚠ El cielo se pone negro... algo terrible se acerca 😨", 4000);
      }
      if (AP.t <= 0) cambiarFase("caos");
      return;
    }
    if (AP.t <= 0) {
      if (AP.fase == "caos") cambiarFase(AP.turno++ % 2 ? "fettuccine" : "morada"); // se turnan
      else if (AP.fase == "fettuccine") cambiarFase("calma");
      else if (AP.nivel + 1 >= FASES.nivelesMorada) {
        // la Tormenta Morada terminó: vuelve la calma
        cash += 5000;
        cambiarFase("calma");
      } else {
        // la Tormenta Morada sube de nivel
        AP.t = FASES.morada;
        AP.nivel++;
        cash += 5000;
        msg(`🟣⛈ La Tormenta Morada sube a nivel ${AP.nivel + 1} · aguantaste un minuto más +₡5000`, 3500);
        trueno(1);
      }
    }
    // ----- Tormenta de Fettuccine: aquí solo la gente y los carros (lo demás está en js/tormenta-fettuccine.js) -----
    if (AP.fase == "fettuccine") {
      cupula.visible = false;
      acelerarCarros(VEL_CARROS.fettuccine, dt);
      moverGente(t, dt);
      gritar(dt, "fettuccine");
      return;
    }
    const moradaK = AP.fase == "morada" ? 1 : 0;

    // ----- clima pésimo: oscuro, lluvia y (en la morada) todo morado -----
    rnv = 1;
    nt = Math.max(nt, 0.6 + 0.15 * moradaK);
    sc.fog.near = Math.min(sc.fog.near, 25);
    sc.fog.far = Math.min(sc.fog.far, 300);
    if (moradaK) sc.fog.color.lerp(morado, 0.75);
    ground.material.color.setHex(moradaK ? 0x6e5a80 : 0x7d8a76); // zacate oscuro
    cupula.visible = moradaK > 0;
    if (cupula.visible) {
      cupula.material.opacity = 0.45 + 0.1 * Math.sin(t * 2);
      cupula.position.copy(cam.position);
    }

    // ----- los carros van rapidísimo -----
    acelerarCarros(moradaK ? VEL_CARROS.morada : VEL_CARROS.caos, dt);

    // ----- tornados -----
    // en gráficos Bajo salen menos (CALIDAD.efectos, js/ajustes.js)
    const nActivos = Math.max(2, Math.round((moradaK ? Math.min(N_TORNADOS, 8 + AP.nivel * 2) : 5) * CALIDAD.efectos));
    tornados.forEach((tr, i) => {
      if (i >= nActivos) {
        tr.g.visible = false;
        return;
      }
      if (!tr.activo || tr.z - B.z > 200 || B.z - tr.z > 900) ponerTornado(tr, false);
      tr.x += tr.vx * dt;
      tr.z += tr.vz * dt;
      if (Math.abs(tr.x) > 140) tr.vx = -tr.vx;
      tr.g.visible = true;
      tr.g.position.set(tr.x, 0, tr.z);
      const col = moradaK ? 0x5e2a7e : 0x3a3d42;
      tr.humo.forEach((sp, j) => {
        const q = sp.userData.k,
          a = t * 3.2 + j * 1.7,
          r = 4 + q * 36;
        sp.position.set(Math.cos(a) * r * 0.5, q * tr.alto, Math.sin(a) * r * 0.5);
        sp.scale.setScalar(10 + q * 50);
        sp.material.color.setHex(col);
      });
      tr.autos.forEach((v, j) => {
        const a = t * 1.7 + v.f,
          y = 8 + ((t * 5 + j * 13 + i * 7) % (tr.alto * 0.6));
        v.o.position.set(Math.cos(a) * (v.r + y * 0.15), y, Math.sin(a) * (v.r + y * 0.15));
        v.o.rotation.set(t * 1.4 + j, t * 2 + i, t);
      });
      // jala al jugador y lo levanta
      const d = Math.hypot(B.x - tr.x, B.z - tr.z);
      if (play() && d < 45 && !B.fl) {
        B.x += ((tr.x - B.x) / (d || 1)) * 7 * dt;
        shake = Math.max(shake, 0.6);
        if (d < 22 && !B.bal && AP.golpeT <= 0) {
          AP.golpeT = 2.5;
          B.bal = 1;
          B.vy = 14;
          dmg += PV.crush ? 4 : 10;
          msg("🌪 ¡Un tornado te levantó por los aires!", 2200);
          if (dmg >= 100) {
            dmg = 100;
            end();
          }
        }
      }
      // carros del tráfico: ¡a volar!
      for (const c of cars)
        if (!c.vy && Math.abs(c.x - tr.x) < 30 && Math.abs(c.z - tr.z) < 30) {
          c.vy = R(14, 24);
          c.vx = R(-10, 10);
          c.hit = 1;
        }
    });
    AP.golpeT -= dt;

    // ----- gente corriendo y gritando -----
    moverGente(t, dt);
    gritar(dt, moradaK && Math.random() < 0.5 ? "comida" : "normal"); // en la morada también gritan por la comida
    // ----- destrucción: explosiones -----
    AP.boomT -= dt;
    if (AP.boomT <= 0) {
      AP.boomT = moradaK ? R(0.8, 2) : R(2, 4.5);
      explotar(R(-30, 30), B.z - R(20, 250), false);
    }
    explosiones.forEach((e) => {
      if (e.t <= 0) return;
      e.t -= dt * 1.2;
      e.sp.visible = e.t > 0;
      e.sp.position.set(e.x, 4 + (1 - e.t) * 8, e.z);
      e.sp.scale.setScalar(6 + (1 - e.t) * 26);
      e.sp.material.opacity = Math.max(0, e.t);
    });

    // ----- rayos (morados en la tormenta morada) -----
    AP.rayoT -= dt;
    if (AP.rayoT <= 0) {
      AP.rayoT = moradaK ? R(0.5, 1.4) : R(2, 5);
      const alJugador = Math.random() < (moradaK ? 0.2 : 0.1),
        rx = alJugador ? B.x + R(-6, 6) : R(-80, 80),
        rz = alJugador ? B.z - R(4, 25) : B.z - R(20, 300);
      rayo.position.set(rx, 0, rz);
      rayo.rotation.y = R(0, 6);
      rayo.children.forEach((s) => s.material.color.setHex(moradaK ? 0xe1a6ff : 0xe8f4ff));
      rayo.visible = true;
      rayo.userData.t = 0.2;
      trueno(alJugador ? 1 : 0.5);
      if (play() && Math.hypot(B.x - rx, B.z - rz) < 7 && B.y < 6) {
        dmg += PV.crush ? 6 : 15;
        shake = 1;
        B.v *= 0.5;
        msg(moradaK ? "🟣⚡ ¡Te cayó un rayo morado!" : "⚡ ¡Te cayó un rayo!", 2000);
        if (dmg >= 100) {
          dmg = 100;
          end();
        }
      }
    }
    if (rayo.visible) {
      rayo.userData.t -= dt;
      const q = Math.max(0, rayo.userData.t / 0.2);
      hemi.intensity += 2 * q;
      sc.fog.color.lerp(_c.setHex(moradaK ? 0xe1a6ff : 0xdde8ff), 0.6 * q);
      if (rayo.userData.t <= 0) rayo.visible = false;
    }

    // ----- bolas de fuego moradas (solo en la tormenta morada) -----
    bolas.forEach((b) => {
      if (!moradaK) {
        b.m.visible = false;
        b.activa = false;
        return;
      }
      if (!b.activa) {
        Object.assign(b, { activa: true, x: R(-60, 60), y: R(80, 140), z: B.z - R(60, 400), vx: R(-10, 10), vz: R(-10, 10) });
        b.m.visible = true;
      }
      b.y -= 45 * dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.m.position.set(b.x, b.y, b.z);
      if (b.y <= 1) {
        explotar(b.x, b.z, true);
        b.activa = false;
        b.m.visible = false;
      }
    });
  };
})();
