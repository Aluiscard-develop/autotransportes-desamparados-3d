// js/juego/15-policia.js · MULTAS Y POLICÍA.
// Parte 15 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// ===================== MULTAS Y POLICÍA =====================
// Multas: exceso de velocidad, chocar y pasarse la parada. Con MULTAS_PARA_POLICIA multas sale la policía.
// Si la patrulla se te pega atrás 2 segundos te atrapa (−₡5000). Si le sacás más de 320 m, escapaste.
// Las multas se perdonan de a una cada minuto sin multas nuevas.
const MULTAS_PARA_POLICIA = 3,
  MULTA_VELOCIDAD = 1500,
  MULTA_ATRAPADO = 5000,
  VEL_POLICIA = 34; // m/s (≈122 km/h): con nitro o un vehículo rápido se puede escapar
let multas = 0,
  regalos = 0, // la policía ya no multa: regala plata
  multaT = 0,
  velT = 0,
  velCd = 0,
  polPrevZ = 0,
  chase = null,
  sir = null;
const limiteVel = (z) => {
  const zn = zoneAt(z);
  if (PV && PV.emerg) return 0; // ambulancia y bomberos: sin límite de velocidad
  if (zn == 16 || zn == 17 || zn == 18) return 0; // pistas: sin límite
  return zn == 1 || zn == 4 || zn == 9 || zn == 22 || zn == 25 || zn == 30 ? 100 : 70;
};
// La policía ya no multa ni persigue: cada vez que antes había multa, ahora te da un regalo.
function multa(razon, monto) {
  if (state != "play") return;
  regalos++;
  multaT = 0;
  const premio = Math.max(1000, monto || 0);
  cash += premio;
  msg(`🎁 ¡La policía te dio un regalo! +₡${premio.toLocaleString("es-CR")}`, 2600);
}
function mkPolicia() {
  const g = new T.Group(),
    blanco = new T.MeshPhysicalMaterial({
      color: 0xf4f6f8,
      roughness: 0.3,
      metalness: 0.2,
      clearcoat: 0.7,
      envMap: ENV,
      envMapIntensity: 0.5,
    }),
    azul = new T.MeshStandardMaterial({ color: 0x1b3fb0, roughness: 0.4 }),
    add = (geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };
  add(CG.body, blanco, 0, 0.8, 0);
  add(CG.cab, gm2, 0, 1.45, 0.25);
  add(CG.roof, blanco, 0, 1.78, 0.3);
  add(CG.sk, dk, 0, 0.36, 0);
  add(new T.BoxGeometry(1.93, 0.2, 4.32), azul, 0, 0.88, 0);
  add(CG.bp, dk, 0, 0.55, -2.2);
  add(CG.bp, dk, 0, 0.55, 2.2);
  add(CG.tl, tm, 0, 0.95, 2.16);
  const txt = new T.MeshBasicMaterial({ map: S("POLICÍA", 256, 44, "#1b3fb0", "#fff", 32) });
  [-1, 1].forEach((q) => {
    const h = add(CG.hl, hlM, q * 0.65, 0.92, -2.16),
      sp = new T.Sprite(glowM);
    sp.scale.setScalar(1.3);
    h.add(sp);
    const t = add(new T.PlaneGeometry(2.2, 0.38), txt, q * 0.975, 1.12, 0);
    t.rotation.y = (q * Math.PI) / 2;
  });
  // barra de luces
  add(new T.BoxGeometry(1.25, 0.1, 0.38), dk, 0, 1.87, 0.3);
  const luces = [0xff2020, 0x2050ff].map((c, i) => {
    const mat = new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 }),
      sm = new T.SpriteMaterial({
        map: gTex,
        color: c,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
      m = add(new T.BoxGeometry(0.52, 0.15, 0.32), mat, i ? 0.32 : -0.32, 1.98, 0.3),
      sp = new T.Sprite(sm);
    sp.scale.setScalar(3.2);
    m.add(sp);
    return { mat, sm };
  });
  [
    [-1, -1.4],
    [1, -1.4],
    [-1, 1.4],
    [1, 1.4],
  ].forEach(([sx, z]) => {
    add(TW, TWM, sx * 0.95, 0.34, z);
    add(HW, HWM, sx * 0.95, 0.34, z);
  });
  g.userData.luces = luces;
  return sh(g);
}
function sirena(on, vol = 0.05) {
  if (!AC) return;
  if (!sir) {
    try {
      const o = AC.createOscillator(),
        g = AC.createGain(),
        lfo = AC.createOscillator(),
        lg = AC.createGain(),
        f = AC.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.value = 760;
      lfo.frequency.value = 0.85;
      lg.gain.value = 260;
      lfo.connect(lg);
      lg.connect(o.frequency);
      f.type = "lowpass";
      f.frequency.value = 2400;
      o.connect(f);
      f.connect(g);
      g.gain.value = 0;
      g.connect(E.mg || AC.destination);
      o.start();
      lfo.start();
      sir = { g };
    } catch (e) {
      return;
    }
  }
  sir.g.gain.setTargetAtTime(on ? vol : 0, AC.currentTime, 0.1);
}
function iniciarPersecucion() {
  const n = multas >= 5 ? 2 : 1;
  chase = { cars: [], t: 0, lejosT: 0, cercaT: 0 };
  for (let i = 0; i < n; i++) {
    const o = mkPolicia(),
      p = { o, x: B.x + (i ? 3.5 : 0), z: B.z + 90 + i * 25, dx: i ? 3.5 : 0 };
    o.position.set(p.x, 0, p.z);
    sc.add(o);
    chase.cars.push(p);
  }
  $("pol").hidden = false;
  msg("🚨 ¡LA POLICÍA TE PERSIGUE! Escapá o te atrapan", 3500);
  horn();
}
function terminarPersecucion(texto) {
  if (!chase) return;
  chase.cars.forEach((p) => liberar(p.o));
  chase = null;
  $("pol").hidden = true;
  sirena(false);
  if (texto) msg(texto, 3800);
}
function policiaTick(dt) {
  // reinicio de partida (el bus "salta" de lugar) o fin del juego: se limpia todo
  if (Math.abs(B.z - polPrevZ) > 60 || state != "play") {
    if (Math.abs(B.z - polPrevZ) > 60) multas = 0;
    terminarPersecucion();
  }
  polPrevZ = B.z;
  if (state != "play" || MONT.on) return; // en la montaña no hay policía ni multas
  const kmh = Math.abs(B.v) * 3.6,
    lim = limiteVel(B.z);
  // exceso de velocidad sostenido
  if (lim && !B.fl && B.y < 2 && kmh > lim + 5) velT += dt;
  else velT = Math.max(0, velT - dt);
  velCd -= dt;
  if (velT > 2 && velCd <= 0) {
    velT = 0;
    velCd = 8;
    multa(`exceso de velocidad (${kmh | 0} km/h en zona de ${lim})`, MULTA_VELOCIDAD);
  }
  multaT += dt;
  if (!chase && multas > 0 && multaT > 60) {
    multas--;
    multaT = 0;
  }
  hudExtra =
    `<br>🚦 Límite ${lim ? `<span class="${kmh > lim + 5 ? "multa-alta" : ""}">${lim} km/h</span>` : "libre"}` +
    `<br>🎁 Regalos de la policía ${regalos}`;
  if (!chase) return;
  // persecución
  chase.t += dt;
  const now = performance.now(),
    w = Math.floor(now / 160) % 2;
  let dMin = 1e9,
    pegado = false;
  for (const p of chase.cars) {
    const dz = p.z - B.z; // > 0: la patrulla viene atrás
    const v =
      dz > 12
        ? Math.min(VEL_POLICIA, Math.abs(B.v) + 8 + dz * 0.12)
        : Math.max(0, Math.abs(B.v) + (dz - 7) * 0.8);
    p.z -= v * dt;
    const tx = B.x + p.dx * (dz > 15 ? 1 : 0),
      mx = Math.max(-6 * dt, Math.min(6 * dt, tx - p.x));
    p.x += mx;
    p.o.position.set(p.x, 0, p.z);
    p.o.rotation.y = (-mx / Math.max(dt, 1e-3)) * 0.03;
    p.o.userData.luces.forEach((l, i) => {
      const on = (i == 0) == !!w;
      l.mat.emissiveIntensity = on ? 3 : 0.15;
      l.sm.opacity = on ? 0.95 : 0;
    });
    dMin = Math.min(dMin, Math.abs(dz));
    if (dz < 10 && dz > -6 && Math.abs(p.x - B.x) < 3 && B.y < 3) pegado = true;
  }
  sirena(true, 0.07 * Math.max(0.15, 1 - dMin / 350));
  chase.cercaT = pegado ? chase.cercaT + dt : Math.max(0, chase.cercaT - dt * 0.5);
  chase.lejosT = dMin > 320 ? chase.lejosT + dt : 0;
  if (chase.cercaT > 2) {
    cash = Math.max(0, cash - MULTA_ATRAPADO);
    B.v *= 0.2;
    multas = 0;
    shake = 0.6;
    terminarPersecucion(`🚓 ¡TE ATRAPARON! Multa de ₡${MULTA_ATRAPADO.toLocaleString("es-CR")}`);
  } else if (chase.lejosT > 3 || chase.t > 120) {
    multas = 0;
    terminarPersecucion("😎 ¡Escapaste de la policía!");
  }
}
