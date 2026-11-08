// =====================================================================
// AVALANCHA GIGANTESCA. Se carga al final (después de js/mundo5.js).
// Apenas empezás en cualquier zona, te avisa que viene una avalancha 400 m detrás de vos.
// Es una pared de nieve con carros, rocas, árboles y troncos dando vueltas, y te persigue por todo el juego.
// Si te alcanza, te daña mucho y vuelve a quedar 400 m atrás. Con V (o 👀) la ves por detrás.
//   AVALANCHA.dist  · a cuántos metros empieza detrás de vos (400)
//   AVALANCHA.vel   · qué tan rápido avanza (m/s; 17 m/s ≈ 61 km/h)
//   AVALANCHA.max   · nunca se queda más lejos que esto (así siempre te persigue)
// =====================================================================
(function () {
  const { caja, cilindro, compartir, mat, humoTex } = MUNDO;
  const AV = { dist: 400, vel: 17, max: 460, z: 0, on: false, avisoT: 0, golpeT: 0, retumbo: 0 };
  window.AVALANCHA = AV; // para revisar desde la consola

  // ----- el modelo -----
  const g = new T.Group();
  g.visible = false;
  sc.add(g);
  // el cuerpo: nieve amontonada detrás del frente
  const cuerpo = new T.Mesh(compartir(new T.CylinderGeometry(1, 1, 1, 18, 1, false, 0, Math.PI)), mat(0xcfdbe6, { roughness: 0.95 }));
  cuerpo.rotation.set(0, 0, Math.PI / 2); // medio cilindro acostado: la parte curva hacia arriba
  cuerpo.scale.set(26, 160, 90);
  cuerpo.position.set(0, 0, 80);
  g.add(cuerpo);
  // nubes de nieve en el frente (se mueven)
  const nubes = [];
  for (let i = 0; i < 46; i++) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: humoTex, color: 0xe3ebf2, depthWrite: false, transparent: true, opacity: 0.9 }));
    sp.userData = { x: R(-80, 80), y: R(2, 30), z: R(-6, 20), s: R(16, 34), f: R(0, 6) };
    g.add(sp);
    nubes.push(sp);
  }
  // cosas que arrastra: carros, rocas, árboles y troncos
  const cosas = [];
  const agregar = (o, y, giro) => {
    g.add(o);
    cosas.push({ o, x: R(-55, 55), y, f: R(0, 6), giro, v: R(1.5, 3.5) });
  };
  for (let i = 0; i < 9; i++) agregar(mkCar(), R(3, 14), 1);
  for (let i = 0; i < 8; i++) {
    const r = new T.Mesh(compartir(new T.DodecahedronGeometry(1, 0)), mat(0x6d6a66, { flatShading: true }));
    r.scale.setScalar(R(1.5, 3.5));
    agregar(r, R(2, 10), 1);
  }
  for (let i = 0; i < 6; i++) {
    const t = tree();
    t.scale.setScalar(R(0.8, 1.3));
    agregar(t, R(2, 8), 0.6);
  }
  for (let i = 0; i < 6; i++) {
    const tr = new T.Group();
    cilindro(tr, 0.5, R(6, 10), 0x5d4037, 0, 0, 0).rotation.z = Math.PI / 2;
    agregar(tr, R(1, 6), 1.4);
  }

  // ----- contador en pantalla -----
  const hud = document.createElement("div");
  hud.className = "p";
  hud.id = "avl";
  hud.style.cssText =
    "position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 58px);padding:4px 12px;font-size:14px;text-align:center;pointer-events:none;";
  hud.hidden = true;
  document.body.appendChild(hud);
  let hudTxt = "";

  // retumbo (ruido grave)
  let ruido;
  const retumbar = (fuerza) => {
    try {
      if (!AC) return;
      if (!ruido) {
        const n = AC.sampleRate * 2,
          b = AC.createBuffer(1, n, AC.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n);
        ruido = b;
      }
      const s = AC.createBufferSource(),
        f = AC.createBiquadFilter(),
        v = AC.createGain();
      s.buffer = ruido;
      f.type = "lowpass";
      f.frequency.value = 160;
      v.gain.value = 0.7 * fuerza;
      s.connect(f).connect(v).connect(AC.destination);
      s.start();
    } catch (e) {}
  };

  const empezar = () => {
    AV.z = B.z + AV.dist;
    AV.on = true;
    AV.avisoT = 6;
    msg("🏔⚠ ¡AVALANCHA GIGANTESCA 400 m detrás de vos! Trae carros y rocas de la montaña · ¡ACELERÁ! (V = mirar atrás)", 5500);
    retumbar(1);
  };

  // ----- cuadro a cuadro -----
  let zAnt = null,
    reloj = 0;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const t = reloj,
      play = state == "play" && !MONT.on;
    // empezar (o volver a empezar) cuando el vehículo aparece en otro lado: inicio, reinicio o el mar del ferry
    if (play && (zAnt == null || Math.abs(B.z - zAnt) > 30 || !AV.on)) empezar();
    zAnt = B.z;
    g.visible = AV.on && !MONT.on && state != "menu";
    hud.hidden = !g.visible;
    if (!g.visible) return;

    if (play) {
      AV.z -= AV.vel * dt;
      if (AV.z - B.z > AV.max) AV.z = B.z + AV.max; // nunca se queda muy lejos
    }
    const d = AV.z - B.z; // metros detrás del jugador
    // contador
    const txt = d < 120 ? `🏔🔴 ¡AVALANCHA a ${Math.max(0, d) | 0} m!` : `🏔 Avalancha: ${d | 0} m detrás`;
    if (txt != hudTxt) {
      hud.textContent = hudTxt = txt;
      hud.style.background = d < 120 ? "rgba(200,30,30,.85)" : "";
    }
    // avisos y retumbos cuando se acerca
    AV.avisoT -= dt;
    if (play && d < 150 && AV.avisoT <= 0) {
      AV.avisoT = 4;
      msg(`⚠ ¡La avalancha está a ${Math.max(0, d) | 0} m! ¡No te detengás!`, 1800);
    }
    AV.retumbo -= dt;
    if (play && d < 250 && AV.retumbo <= 0) {
      AV.retumbo = 2.4;
      retumbar(1 - d / 250);
    }
    if (play && d < 200) shake = Math.max(shake, 0.12 * (1 - d / 200));
    // te alcanzó
    AV.golpeT -= dt;
    if (play && d < 4 && AV.golpeT <= 0) {
      AV.golpeT = 2;
      dmg += PV.crush ? 12 : 35;
      B.v *= 0.3;
      shake = 1.2;
      msg("🏔💥 ¡TE ALCANZÓ LA AVALANCHA! Vuelve a quedar 400 m atrás", 3500);
      AV.z = B.z + AV.dist;
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
    // los carros del tráfico que quedan atrás se los lleva
    for (const c of cars)
      if (!c.vy && c.z > AV.z - 6 && c.z < AV.z + 40) {
        c.vy = R(10, 18);
        c.vx = R(-6, 6);
        c.hit = 1;
      }
    // mover el modelo
    g.position.set(0, 0, AV.z);
    nubes.forEach((sp) => {
      const u = sp.userData;
      sp.position.set(u.x + Math.sin(t * 0.7 + u.f) * 4, u.y + Math.sin(t * 1.3 + u.f) * 3, u.z + Math.sin(t + u.f) * 3);
      sp.scale.setScalar(u.s * (1 + 0.12 * Math.sin(t * 2 + u.f)));
    });
    cosas.forEach((c, i) => {
      c.o.position.set(c.x + Math.sin(t * 0.4 + c.f) * 6, c.y + Math.abs(Math.sin(t * c.v + c.f)) * 6, -4 + Math.sin(t * 0.8 + i) * 4);
      c.o.rotation.set(t * c.v * c.giro + c.f, t * 0.7 + i, t * c.v * 0.6 * c.giro);
    });
  };
})();
