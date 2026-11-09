// =====================================================================
// DESASTRE TOTAL. Se carga después de js/apocalipsis.js y usa su estado (window.APOCALIPSIS).
// En el CAOS, en la TORMENTA MORADA y en la TORMENTA DE COMIDA (sin los tornados) aparecen:
//   TORNADOS DEL HORIZONTE   · ~120 tornados ultra gigantescos (300 a 500 m de alto) alrededor
//   MULTITUD                 · ~2000 personas corriendo desesperadas a los lados
//   BUSES DE EVACUACIÓN      · buses llenos de gente (hasta en el techo) en el tráfico
//   CARROS VOLCADOS          · carros patas arriba (algunos en llamas) bloqueando carriles
//   DERRUMBES                · tierra y rocas que bajan del cerro y tapan la carretera
//   INUNDACIÓN               · el agua sube y tapa la carretera (frena mucho)
//   EDIFICIOS QUE SE CAEN    · torres que se inclinan y se derrumban con polvo
//   AVALANCHAS               · ~40 avalanchas que bajan de las montañas y cruzan la carretera
//   INCENDIOS                · fuego por todas partes
// Todo se pone peor con cada nivel de la Tormenta Morada (APOCALIPSIS.nivel).
// =====================================================================
(function () {
  const { caja, cilindro, compartir, mat, humoTex, llamaTex, fachada, deModelo, faros, cartel, COLORES_EDIFICIO } = MUNDO;
  const AP = window.APOCALIPSIS;
  const activo = () => AP && AP.fase != "calma" && !MONT.on;
  const morada = () => AP.fase == "morada";
  const fuerza = () => (morada() ? Math.min(1, 0.55 + 0.15 * AP.nivel) : 0.35); // 0 a 1
  const play = () => state == "play" && !MONT.on;
  const m4 = new T.Matrix4(),
    q4 = new T.Quaternion(),
    e4 = new T.Euler(),
    v4 = new T.Vector3(),
    s4 = new T.Vector3();
  const golpe = (cuanto, texto) => {
    if (D.golpeT > 0) return;
    D.golpeT = 1.6;
    dmg += PV.crush ? cuanto * 0.3 : cuanto;
    B.v *= 0.4;
    shake = 1;
    msg(texto, 2200);
    if (dmg >= 100) {
      dmg = 100;
      end();
    }
  };
  const D = { golpeT: 0, volcadoT: 0, derrumbeT: 0, edificioT: 0, avisoAgua: 0, nivelAgua: -0.6 };
  window.DESASTRE = D;

  // ===================== TORNADOS DEL HORIZONTE =====================
  const N_HOR = 120;
  const texEmbudo = compartir(
    cv(64, 256, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(40,30,50,0.95)");
      g.addColorStop(1, "rgba(70,60,80,0.75)");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
      x.strokeStyle = "rgba(150,140,160,0.45)";
      x.lineWidth = 5;
      for (let i = -8; i < 16; i++) {
        x.beginPath();
        x.moveTo(0, i * 24);
        x.lineTo(w, i * 24 + 40);
        x.stroke();
      }
    }),
  );
  texEmbudo.wrapS = T.RepeatWrapping;
  const geoEmbudo = new T.CylinderGeometry(1, 0.07, 1, 16, 1, true);
  geoEmbudo.translate(0, 0.5, 0);
  const matEmbudo = new T.MeshBasicMaterial({ map: texEmbudo, color: 0xffffff, transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false, fog: false });
  const horizonte = new T.InstancedMesh(geoEmbudo, matEmbudo, N_HOR);
  horizonte.frustumCulled = false;
  horizonte.visible = false;
  sc.add(horizonte);
  const hor = [];
  for (let i = 0; i < N_HOR; i++) hor.push({ x: 0, z: 0, h: 0, f: R(0, 6), vx: 0, vz: 0, ok: false });
  const ponerHor = (o) => {
    const a = R(0, Math.PI * 2),
      d = R(260, 950);
    Object.assign(o, { x: B.x + Math.cos(a) * d, z: B.z - Math.abs(Math.sin(a)) * d * 0.9 - 100, h: R(300, 520), vx: R(-8, 8), vz: R(-5, 5), ok: true });
  };

  // ===================== MULTITUD =====================
  const N_GENTE = 2000;
  const geoCuerpo = new T.BoxGeometry(0.56, 1.5, 0.36);
  geoCuerpo.translate(0, 0.75, 0);
  const geoCabeza = new T.IcosahedronGeometry(0.22, 0);
  geoCabeza.translate(0, 1.75, 0);
  const cuerpos = new T.InstancedMesh(geoCuerpo, new T.MeshStandardMaterial({ roughness: 0.8 }), N_GENTE),
    cabezas = new T.InstancedMesh(geoCabeza, new T.MeshStandardMaterial({ color: 0xd7a27a, roughness: 0.8 }), N_GENTE);
  const ROPA = [0xe53935, 0x1e88e5, 0xfdd835, 0x8e24aa, 0x43a047, 0xff7043, 0xffffff, 0x263238];
  const multitud = [];
  for (let i = 0; i < N_GENTE; i++) {
    cuerpos.setColorAt(i, new T.Color(ROPA[i % ROPA.length]));
    multitud.push({ x: 0, z: 0, v: 0, f: R(0, 6) });
  }
  [cuerpos, cabezas].forEach((m) => {
    m.frustumCulled = false;
    m.visible = false;
    sc.add(m);
  });
  const ponerPersona = (p, adelante) => {
    p.x = (Math.random() < 0.5 ? -1 : 1) * R(8.6, 170);
    p.z = adelante ? B.z - R(350, 520) : B.z - R(-150, 520);
    p.v = R(3.5, 9) * (Math.random() < 0.8 ? 1 : -1);
  };

  // ===================== BUSES DE EVACUACIÓN =====================
  const busEvac = () =>
    deModelo("busEvac", () => {
      const g = new T.Group();
      caja(g, 2.6, 2.9, 11.5, 0xf2b400, 0, 1.85, 0);
      caja(g, 2.64, 1, 10.3, 0x223344, 0, 2.35, 0);
      // cabezas en todas las ventanas
      for (let z = -4.5; z <= 4.5; z += 1.1) [-1.33, 1.33].forEach((x) => caja(g, 0.06, 0.34, 0.34, 0xd7a27a, x, 2.4, z));
      // gente en el techo con los brazos arriba
      for (let i = 0; i < 12; i++) {
        const x = (i % 3) - 1,
          z = -4.4 + Math.floor(i / 3) * 2.6;
        caja(g, 0.5, 0.8, 0.32, ROPA[i % ROPA.length], x * 0.8, 3.75, z);
        caja(g, 0.14, 0.6, 0.14, ROPA[i % ROPA.length], x * 0.8 - 0.3, 4.4, z);
        caja(g, 0.14, 0.6, 0.14, ROPA[i % ROPA.length], x * 0.8 + 0.3, 4.4, z);
        caja(g, 0.36, 0.36, 0.36, 0xd7a27a, x * 0.8, 4.4, z);
      }
      cartel(g, "EVACUACIÓN", 2.2, 0.35, "#b71c1c", "#ffffff", 0, 3.05, -5.81, Math.PI);
      faros(g, 0.9, 0.95, -5.78);
      wr(g, [[-1.15, -3.8], [1.15, -3.8], [-1.15, 3.8], [1.15, 3.8]], 0.55);
      g.userData.hl = 5.8;
      return sh(g);
    });
  const vehAntes = window.vehNuevo;
  window.vehNuevo = function (zz) {
    if (activo() && Math.random() < 0.18 + 0.12 * fuerza()) return busEvac();
    return vehAntes(zz);
  };

  // ===================== CARROS VOLCADOS =====================
  const volcados = [];
  const volcar = () => {
    const o = mkCar(),
      x = pk_(LN),
      z = B.z - R(170, 420);
    o.rotation.set(0, R(-0.4, 0.4), Math.PI);
    if (Math.random() < 0.5) {
      const f = new T.Sprite(new T.SpriteMaterial({ map: llamaTex, color: 0xffffff, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      f.scale.setScalar(5);
      f.position.y = -2.4; // (el carro está al revés)
      o.add(f);
    }
    o.position.set(x, 1.7, z);
    o.userData.l = [{}, {}]; // el juego trata a los accidentes como carros con luces intermitentes
    o.userData.sm = [];
    sc.add(o);
    const c = { o, x, x0: x, y: 1.7, hl: 2.4, z, vz: 0, v0: 0, jv: 0, vx: 0, hit: 0, stat: 1, warn: 0 };
    cars.push(c);
    volcados.push(c);
  };

  // ===================== DERRUMBES =====================
  const derrumbes = [];
  for (let i = 0; i < 5; i++) {
    const g = new T.Group();
    const m = new T.Mesh(compartir(new T.SphereGeometry(1, 12, 8)), mat(0x6d4c2b, { flatShading: true }));
    m.scale.set(7, 3.4, 6);
    g.add(m);
    for (let k = 0; k < 8; k++) {
      const r = new T.Mesh(compartir(new T.DodecahedronGeometry(1, 0)), mat(0x7a7470, { flatShading: true }));
      r.scale.setScalar(R(0.8, 1.8));
      r.position.set(R(-6, 6), R(1, 3), R(-5, 5));
      g.add(r);
    }
    const polvo = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0x9c8466, depthWrite: false, transparent: true, opacity: 0 }));
    polvo.scale.setScalar(30);
    polvo.position.y = 6;
    g.add(polvo);
    g.visible = false;
    sc.add(g);
    derrumbes.push({ g, polvo, x: 0, z: 0, x0: 0, x1: 0, t: 0, vida: 0 });
  }
  const derrumbar = () => {
    const d = derrumbes.find((q) => q.vida <= 0);
    if (!d) return;
    const s = Math.random() < 0.5 ? -1 : 1;
    Object.assign(d, { x0: s * 45, x1: s * R(0, 5), z: B.z - R(140, 320), t: 0, vida: 30 });
    d.g.visible = true;
    msg("⛰ ¡DERRUMBE adelante! La tierra tapa la carretera", 2200);
  };

  // ===================== INUNDACIÓN =====================
  const agua = new T.Mesh(
    new T.PlaneGeometry(2400, 2400, 1, 120),
    new T.MeshStandardMaterial({ color: 0x5b6e70, roughness: 0.15, metalness: 0.3, normalMap: wNrm, transparent: true, opacity: 0.88 }),
  );
  agua.rotation.x = -Math.PI / 2;
  agua.visible = false;
  sc.add(agua);

  // ===================== EDIFICIOS QUE SE CAEN =====================
  const edificios = [];
  for (let i = 0; i < 4; i++) {
    const h = R(50, 90),
      f = fachada(18, h, 16, pk_(COLORES_EDIFICIO));
    f.position.y = h / 2;
    const g = new T.Group();
    g.add(f);
    const polvo = [];
    for (let k = 0; k < 5; k++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0xa09890, depthWrite: false, transparent: true, opacity: 0 }));
      g.add(sp);
      polvo.push(sp);
    }
    g.visible = false;
    sc.add(g);
    edificios.push({ g, f, polvo, h, x: 0, z: 0, t: -1, lado: 1 });
  }
  const ponerEdificio = () => {
    const e = edificios.find((q) => q.t < 0);
    if (!e) return;
    e.lado = Math.random() < 0.5 ? -1 : 1;
    Object.assign(e, { x: e.lado * R(28, 70), z: B.z - R(160, 380), t: 0 });
    e.g.visible = true;
    e.g.rotation.set(0, 0, 0);
    e.f.position.y = e.h / 2;
  };

  // ===================== AVALANCHAS =====================
  const N_AV = 40;
  const geoAv = new T.CylinderGeometry(1, 1, 1, 16, 1, false, Math.PI / 2, Math.PI);
  geoAv.rotateX(Math.PI / 2);
  const avs = new T.InstancedMesh(geoAv, new T.MeshStandardMaterial({ color: 0xdfe8ef, roughness: 0.95 }), N_AV);
  avs.frustumCulled = false;
  avs.visible = false;
  sc.add(avs);
  const avalanchas = [];
  for (let i = 0; i < N_AV; i++) avalanchas.push({ x: 0, z: 0, s: 1, v: 0, alto: 0, largo: 0, ok: false });
  const ponerAv = (a) => {
    a.s = Math.random() < 0.5 ? -1 : 1;
    Object.assign(a, { x: a.s * R(180, 600), z: B.z - R(60, 800), v: R(14, 30), alto: R(10, 24), largo: R(30, 90), ok: true });
  };

  // ===================== INCENDIOS =====================
  const fuegos = [];
  for (let i = 0; i < 26; i++) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: llamaTex, color: 0xffffff, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.visible = false;
    sc.add(sp);
    fuegos.push({ sp, x: 0, z: 0, s: 1, f: R(0, 6) });
  }
  const ponerFuego = (o) => {
    Object.assign(o, { x: (Math.random() < 0.5 ? -1 : 1) * R(9, 70), z: B.z - R(20, 450), s: R(5, 14) });
  };

  const ocultar = () => {
    [horizonte, cuerpos, cabezas, agua, avs].forEach((m) => (m.visible = false));
    derrumbes.forEach((d) => ((d.g.visible = false), (d.vida = 0)));
    edificios.forEach((e) => ((e.g.visible = false), (e.t = -1)));
    fuegos.forEach((f) => (f.sp.visible = false));
    hor.forEach((o) => (o.ok = false));
    avalanchas.forEach((a) => (a.ok = false));
    multitud.forEach((p) => (p.z = 1e9));
    D.nivelAgua = -0.6;
  };

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0,
    estaba = false;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const t = reloj;
    if (!activo()) {
      if (estaba) ocultar();
      estaba = false;
      // los volcados que quedan se van limpiando solos (el juego borra los carros lejanos)
      return;
    }
    if (!estaba) multitud.forEach((p) => ponerPersona(p, false));
    estaba = true;
    if (state != "play") return;
    const k = fuerza(),
      mor = morada();
    D.golpeT -= dt;

    // ----- tornados del horizonte -----
    // solo se calculan y dibujan los que se ven (en gráficos Bajo, menos: CALIDAD.efectos);
    // en la tormenta de comida no hay tornados
    const nHor = AP.fase == "comida" ? 0 : Math.round(N_HOR * (mor ? Math.min(1, 0.5 + 0.17 * AP.nivel) : 0.3) * CALIDAD.efectos);
    horizonte.visible = nHor > 0;
    horizonte.count = nHor;
    for (let i = 0; i < nHor; i++) {
      const o = hor[i];
      if (!o.ok || o.z - B.z > 350 || B.z - o.z > 1100 || Math.abs(o.x - B.x) > 1100) ponerHor(o);
      o.x += o.vx * dt;
      o.z += o.vz * dt;
      const ancho = o.h * 0.16 * (1 + 0.08 * Math.sin(t * 2 + o.f));
      m4.compose(v4.set(o.x + Math.sin(t * 0.7 + o.f) * 6, 0, o.z), q4.setFromEuler(e4.set(0, t * 1.5 + o.f, Math.sin(t + o.f) * 0.06)), s4.set(ancho, o.h, ancho));
      horizonte.setMatrixAt(i, m4);
    }
    horizonte.instanceMatrix.needsUpdate = true;
    matEmbudo.color.setHex(mor ? 0xb08ad0 : 0xffffff);

    // ----- multitud corriendo -----
    cuerpos.visible = cabezas.visible = true;
    const nGente = Math.round(N_GENTE * (mor ? 1 : 0.4) * CALIDAD.efectos);
    cuerpos.count = cabezas.count = nGente;
    for (let i = 0; i < nGente; i++) {
      const p = multitud[i];
      p.z += p.v * dt;
      if (p.z - B.z > 160 || B.z - p.z > 530) ponerPersona(p, p.z - B.z > 160);
      m4.makeTranslation(p.x + Math.sin(t * 2 + p.f) * 0.5, Math.abs(Math.sin(t * 12 + p.f)) * 0.2, p.z);
      cuerpos.setMatrixAt(i, m4);
      cabezas.setMatrixAt(i, m4);
    }
    cuerpos.instanceMatrix.needsUpdate = cabezas.instanceMatrix.needsUpdate = true;

    // ----- carros volcados -----
    for (let i = volcados.length - 1; i >= 0; i--) if (!cars.includes(volcados[i]) || volcados[i].z - B.z > 200) volcados.splice(i, 1);
    D.volcadoT -= dt;
    if (D.volcadoT <= 0) {
      D.volcadoT = R(2.5, 5) / (0.5 + k);
      if (volcados.length < 6 + 6 * k) volcar();
    }
    // los carros del tráfico zigzaguean sin control
    for (const c of cars) if (!c.hit && !c.stat) c.o.position.x = c.x + Math.sin(t * 2.3 + c.z * 0.05) * 0.7 * k;

    // ----- derrumbes -----
    D.derrumbeT -= dt;
    if (mor && D.derrumbeT <= 0) {
      D.derrumbeT = R(6, 14) / (0.4 + k);
      derrumbar();
    }
    derrumbes.forEach((d) => {
      if (d.vida <= 0) return;
      d.vida -= dt;
      d.t = Math.min(1, d.t + dt / 3);
      const q = 1 - Math.pow(1 - d.t, 3);
      d.x = d.x0 + (d.x1 - d.x0) * q;
      d.g.position.set(d.x, 0, d.z);
      d.polvo.material.opacity = d.t < 1 ? 0.7 : Math.max(0, d.polvo.material.opacity - dt * 0.3);
      if (d.vida <= 0 || d.z - B.z > 120) {
        d.vida = 0;
        d.g.visible = false;
      }
      if (play() && Math.abs(B.x - d.x) < 7 + PV.hw && Math.abs(B.z - d.z) < 6 + PV.hl * 0.5 && B.y < 4) {
        B.z = d.z + 6 + PV.hl * 0.5; // no se puede atravesar
        golpe(18, "⛰💥 ¡Chocaste con el derrumbe! Buscá por dónde pasar");
      }
      for (const c of cars) if (!c.vy && Math.abs(c.x - d.x) < 7 && Math.abs(c.z - d.z) < 6) ((c.vy = R(6, 12)), (c.vx = R(-6, 6)), (c.hit = 1));
    });

    // ----- inundación: el agua sube y baja -----
    const meta = mor ? -0.5 + (0.5 + 0.5 * Math.sin(t * 0.05)) * (0.4 + 0.5 * k) : -0.6;
    D.nivelAgua += (meta - D.nivelAgua) * Math.min(1, dt * 0.15);
    agua.visible = D.nivelAgua > -0.45;
    if (agua.visible) {
      agua.position.set(Math.round(B.x / 20) * 20, D.nivelAgua, Math.round(B.z / 20) * 20);
      if (play() && D.nivelAgua > 0.05 && !PV.hover && !B.fl && B.y < 1) {
        B.v *= Math.pow(0.82, dt * (1 + D.nivelAgua * 3));
        if (D.avisoAgua <= 0) {
          D.avisoAgua = 15;
          msg("🌊 ¡INUNDACIÓN! El agua tapa la carretera", 2500);
        }
      }
      D.avisoAgua -= dt;
    }

    // ----- edificios que se caen -----
    D.edificioT -= dt;
    if (D.edificioT <= 0) {
      D.edificioT = R(5, 11) / (0.4 + k);
      ponerEdificio();
    }
    edificios.forEach((e) => {
      if (e.t < 0) return;
      e.t += dt;
      e.g.position.set(e.x, 0, e.z);
      const c = Math.max(0, e.t - 1.5) / 4; // empieza a caerse a los 1,5 s
      e.g.rotation.z = e.lado * Math.min(1.35, c * c * 1.35); // se inclina hacia la carretera
      e.f.position.y = e.h / 2 - Math.min(e.h * 0.6, c * e.h * 0.4); // y se hunde
      e.polvo.forEach((sp, i) => {
        sp.position.set(R(-1, 1) * 3 + (i - 2) * 6, 3 + c * 20, R(-1, 1) * 3);
        sp.scale.setScalar(12 + c * 40);
        sp.material.opacity = c > 0 ? Math.min(0.85, c) * (e.t > 7 ? Math.max(0, 1 - (e.t - 7) / 3) : 1) : 0;
      });
      if (c > 0 && !e.avisado) {
        e.avisado = true;
        if (Math.abs(e.z - B.z) < 250) msg("🏢💥 ¡SE ESTÁ CAYENDO UN EDIFICIO!", 2000);
      }
      if (c > 0.9 && c < 1 && Math.abs(e.z - B.z) < 120) shake = Math.max(shake, 0.6);
      if (e.t > 10 || e.z - B.z > 150) {
        e.t = -1;
        e.avisado = false;
        e.g.visible = false;
      }
    });

    // ----- avalanchas que bajan de las montañas -----
    avs.visible = mor;
    if (mor) {
      const nAv = Math.round(N_AV * Math.min(1, 0.35 + 0.2 * AP.nivel) * Math.max(0.5, CALIDAD.efectos));
      avs.count = nAv;
      for (let i = 0; i < nAv; i++) {
        const a = avalanchas[i];
        if (!a.ok || a.z - B.z > 300 || B.z - a.z > 900 || a.x * a.s < -80) ponerAv(a);
        a.x -= a.s * a.v * dt;
        m4.compose(v4.set(a.x, 0, a.z), q4.identity(), s4.set(a.alto * 0.9, a.alto, a.largo));
        avs.setMatrixAt(i, m4);
        // cruza la carretera: si te agarra, te revuelca
        if (play() && Math.abs(a.x - B.x) < a.alto * 0.9 + PV.hw && Math.abs(a.z - B.z) < a.largo / 2 + PV.hl && B.y < 6) {
          golpe(22, "🏔💥 ¡Te agarró una avalancha!");
          B.x += -a.s * 6;
        }
        for (const c of cars) if (!c.vy && Math.abs(a.x - c.x) < a.alto && Math.abs(a.z - c.z) < a.largo / 2) ((c.vy = R(8, 16)), (c.vx = -a.s * R(4, 10)), (c.hit = 1));
      }
      avs.instanceMatrix.needsUpdate = true;
    }

    // ----- incendios -----
    const nFuego = Math.round(fuegos.length * (mor ? 1 : 0.4) * CALIDAD.efectos);
    fuegos.forEach((f, i) => {
      f.sp.visible = i < nFuego;
      if (!f.sp.visible) return;
      if (f.z - B.z > 60 || B.z - f.z > 480 || !f.s) ponerFuego(f);
      f.sp.position.set(f.x, f.s * 0.45, f.z);
      f.sp.scale.setScalar(f.s * (0.85 + 0.25 * Math.sin(t * 9 + f.f)));
    });
  };
})();
