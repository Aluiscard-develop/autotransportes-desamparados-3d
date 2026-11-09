// =====================================================================
// CARRETERA PARTIDA. Se carga después de js/tormenta-comida.js y usa el estado del apocalipsis
// (window.APOCALIPSIS). Durante la Tormenta Morada, adelante de vos la carretera se parte a la mitad:
//   RAJA      · primero aparece una raja negra por la línea del centro que corre hacia adelante,
//               con temblor y ruido (tenés AJUSTES.carreteraPartida.aviso segundos para cambiarte de carril)
//   SE HUNDE  · después una mitad de la carretera (izquierda o derecha) se hunde en un hueco negro,
//               con polvo y pedazos de asfalto
//   CAERSE    · si vas por la mitad que se hundió, te caés al hueco (daño) y una grúa te saca y te deja
//               del otro lado del hueco, en tu carril. Los carros que van por esa mitad también se caen.
// Con el trike volando o el aerodeslizador pasás por encima sin caerte.
// Los números (cada cuánto, qué tan largo, daño) están en js/ajustes.js (AJUSTES.carreteraPartida).
// =====================================================================
(function () {
  const AP = window.APOCALIPSIS;
  if (!AP) return;
  const A = AJUSTES.carreteraPartida,
    { compartir, humoTex } = MUNDO;
  const ANCHO = 8, // del centro de la carretera hasta un poco después de la orilla (la carretera mide 14 m)
    RAJA = 0.35; // ancho de la raja antes de hundirse, en metros
  const play = () => state == "play" && !MONT.on;
  const enTormenta = () => AP.fase == "morada" && !MONT.on;

  // ===================== EL HUECO =====================
  // Cada hueco es una figura con el borde del centro en zigzag (la raja). Va de x = 0 a x = 1 y de
  // z = 0 a z = -1; después se estira al ancho y al largo de cada rajadura. El color va de café
  // (la pared del hueco, junto a la raja) a negro (el fondo), así parece hondo.
  function figuraHueco() {
    const s = new T.Shape(),
      dientes = 34;
    s.moveTo(0, 0);
    for (let i = 1; i < dientes; i++) s.lineTo(R(0, 0.07), (i / dientes) * 1); // la raja (borde del centro)
    s.lineTo(R(0.02, 0.06), 1);
    for (let i = 1; i <= 8; i++) s.lineTo(i / 8, 1 - R(0, 0.02)); // punta de adelante
    for (let i = 1; i < 12; i++) s.lineTo(1 - R(0, 0.04), 1 - i / 12); // orilla de afuera
    for (let i = 8; i >= 1; i--) s.lineTo(i / 8, R(0, 0.02)); // punta de atrás
    const g = new T.ShapeGeometry(s);
    g.rotateX(Math.PI / 2); // y de la figura → z (hacia adelante es -z)
    g.scale(1, 1, -1);
    const pos = g.attributes.position,
      col = new Float32Array(pos.count * 3),
      cerca = new T.Color(0x4a3a2b),
      fondo = new T.Color(0x060403),
      c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      c.copy(cerca).lerp(fondo, Math.min(1, pos.getX(i) * 3.2));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new T.BufferAttribute(col, 3));
    return g;
  }
  const matHueco = new T.MeshBasicMaterial({
    vertexColors: true,
    side: T.DoubleSide, // la mitad izquierda es la misma figura dada vuelta
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const matAsfalto = new T.MeshStandardMaterial({ color: 0x3b3b3f, roughness: 0.9 }),
    matLinea = new T.MeshStandardMaterial({ color: 0xffc928, roughness: 0.7 });
  const geoLosa = compartir(new T.BoxGeometry(1, 0.6, 1)),
    geoLinea = compartir(new T.BoxGeometry(0.16, 0.62, 1));

  // pedazos de asfalto alrededor del hueco: todos en una sola malla (InstancedMesh)
  const POR_HUECO = 34,
    N_POOL = 4,
    pedazos = new T.InstancedMesh(
      compartir(new T.DodecahedronGeometry(1, 0)),
      new T.MeshStandardMaterial({ color: 0x45454a, roughness: 1, flatShading: true }),
      POR_HUECO * N_POOL,
    );
  pedazos.frustumCulled = false;
  const m4 = new T.Matrix4(),
    q4 = new T.Quaternion(),
    e4 = new T.Euler(),
    v4 = new T.Vector3(),
    s4 = new T.Vector3();
  const cero = new T.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < POR_HUECO * N_POOL; i++) pedazos.setMatrixAt(i, cero);
  sc.add(pedazos);

  const huecos = [];
  for (let i = 0; i < N_POOL; i++) {
    const h = {
      i,
      activo: false,
      fase: "", // "raja" o "hundido"
      t: 0,
      q: 1, // 1 = se hunde la mitad derecha, -1 = la izquierda
      z0: 0, // dónde empieza (atrás)
      largo: 50,
      hueco: new T.Mesh(figuraHueco(), matHueco),
      losa: new T.Group(),
      polvo: [],
      piezas: [], // posición final de cada pedazo de asfalto
    };
    h.hueco.visible = false;
    sc.add(h.hueco);
    const l = new T.Mesh(geoLosa, matAsfalto);
    l.receiveShadow = true;
    const linea = new T.Mesh(geoLinea, matLinea); // la línea amarilla del centro se va con la losa
    h.losa.add(l, linea);
    h.losa.userData = { l, linea };
    h.losa.visible = false;
    sc.add(h.losa);
    for (let k = 0; k < 3; k++) {
      const sp = new T.Sprite(
        new T.SpriteMaterial({
          map: humoTex,
          color: 0x9a8a78,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );
      sp.visible = false;
      sc.add(sp);
      h.polvo.push(sp);
    }
    huecos.push(h);
  }

  // ===================== SONIDO =====================
  const retumbo = (dur, vol) => {
    try {
      if (!AC || vol < 0.03) return;
      const n = Math.round(AC.sampleRate * dur),
        b = AC.createBuffer(1, n, AC.sampleRate),
        d = b.getChannelData(0);
      for (let i = 0; i < n; i++)
        d[i] = (Math.random() * 2 - 1) * Math.min(1, (i / n) * 8) * Math.exp(-i / (n * 0.4));
      const s = AC.createBufferSource(),
        f = AC.createBiquadFilter(),
        g = AC.createGain();
      s.buffer = b;
      f.type = "lowpass";
      f.frequency.value = 160;
      g.gain.value = Math.min(1, vol);
      s.connect(f).connect(g).connect(AC.destination);
      s.start();
    } catch (e) {}
  };

  // ===================== RAJAR Y HUNDIR =====================
  const D = { t: 4, cayendo: null };
  window.CARRETERA_PARTIDA = D; // para revisar desde la consola
  D.huecos = huecos;
  function rajar(z0, q) {
    const h = huecos.find((x) => !x.activo);
    if (!h) return null;
    Object.assign(h, { activo: true, fase: "raja", t: 0, q, z0, largo: R(A.largo[0], A.largo[1]) });
    h.hueco.position.set(0, 0.03, z0);
    h.hueco.scale.set(q * RAJA, 1, 0.001); // una raja finita que corre hacia adelante
    h.hueco.visible = true;
    h.losa.visible = false;
    retumbo(1.4, 0.5 * Math.max(0.2, 1 - Math.abs(B.z - z0) / 400));
    shake = Math.max(shake, 0.35);
    if (play())
      msg(
        `⚠🛣 ¡La carretera se está rajando! Pasate al carril de la ${q > 0 ? "izquierda" : "derecha"}`,
        2500,
      );
    return h;
  }
  function hundir(h) {
    h.fase = "hundido";
    h.t = 0;
    h.hueco.scale.set(h.q * RAJA, 1, h.largo);
    // la losa de asfalto que se va hundiendo
    const { l, linea } = h.losa.userData;
    l.scale.set(ANCHO - 0.6, 1, h.largo * 0.96);
    l.position.set(h.q * ((ANCHO - 0.6) / 2), 0, 0);
    linea.scale.set(1, 1, h.largo * 0.96);
    linea.position.set(h.q * 0.15, 0.01, 0);
    h.losa.position.set(0, 0, h.z0 - h.largo / 2);
    h.losa.rotation.set(0, 0, 0);
    h.losa.visible = true;
    // pedazos de asfalto en la orilla de la raja y en la orilla de afuera
    h.piezas.length = 0;
    const n = Math.round(POR_HUECO * Math.max(0.5, CALIDAD.efectos));
    for (let k = 0; k < POR_HUECO; k++) {
      if (k >= n) {
        pedazos.setMatrixAt(h.i * POR_HUECO + k, cero);
        continue;
      }
      const enRaja = k % 3 != 0,
        x = enRaja ? -h.q * R(0.1, 0.9) : h.q * R(ANCHO - 0.3, ANCHO + 1.2),
        z = h.z0 - R(0.5, h.largo - 0.5);
      h.piezas.push({ k, x, z, s: R(0.18, 0.5), r: R(0, 6), vy: R(4, 9) });
    }
    h.polvo.forEach((sp, k) => {
      sp.visible = true;
      sp.position.set(h.q * R(1, 6), 1, h.z0 - (h.largo * (k + 0.5)) / h.polvo.length);
      sp.userData.t = 0;
    });
    const d = Math.abs(B.z - (h.z0 - h.largo / 2));
    retumbo(1.8, 0.9 * Math.max(0.1, 1 - d / 450));
    shake = Math.max(shake, Math.max(0.2, 1 - d / 250));
  }
  function borrar(h) {
    h.activo = false;
    h.hueco.visible = false;
    h.losa.visible = false;
    h.polvo.forEach((sp) => (sp.visible = false));
    for (let k = 0; k < POR_HUECO; k++) pedazos.setMatrixAt(h.i * POR_HUECO + k, cero);
    pedazos.instanceMatrix.needsUpdate = true;
  }
  D.rajar = rajar; // para probar desde la consola: CARRETERA_PARTIDA.rajar(B.z - 80, 1)
  // ¿este punto (x, z) cae en la mitad hundida de algún hueco?
  const dentro = (h, x, z, margen = 0.2) =>
    h.activo && h.fase == "hundido" && h.t > 0.35 && h.q * x > margen && z < h.z0 && z > h.z0 - h.largo;

  // el cable de la grúa (con su gancho) que te saca del hueco
  const cable = new T.Group();
  {
    const c = new T.Mesh(
      compartir(new T.BoxGeometry(0.12, 60, 0.12)),
      new T.MeshStandardMaterial({ color: 0x2b2b2b }),
    );
    const gancho = new T.Mesh(
      compartir(new T.BoxGeometry(0.9, 0.5, 0.9)),
      new T.MeshStandardMaterial({ color: 0xffb300, roughness: 0.6 }),
    );
    gancho.position.y = -30;
    cable.add(c, gancho);
  }
  cable.visible = false;
  sc.add(cable);

  // ===================== CAERSE AL HUECO =====================
  function caer(h) {
    const F = { t: 0, x: B.x, z: B.z, h: B.h, q: h.q, salida: h.z0 - h.largo - 8 }; // salida: después del hueco
    D.cayendo = F;
    dmg += (PV.crush ? 0.5 : 1) * A.danio;
    shake = 1;
    retumbo(1, 0.8);
    msg("🕳💥 ¡Te caíste en la carretera partida!", 2500);
    if (dmg >= 100) {
      dmg = 100;
      end();
    }
  }

  // ===================== CUADRO A CUADRO =====================
  let zAnt = null;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    // reinicio (el bus saltó de lugar) o ruta de montaña: se arregla todo
    if ((zAnt != null && Math.abs(B.z - zAnt) > 30 && state == "play") || MONT.on) {
      huecos.forEach((h) => h.activo && borrar(h));
      D.cayendo = null;
      cable.visible = false;
    }
    zAnt = B.z;
    if (state == "over" || state == "menu") {
      D.cayendo = null;
      cable.visible = false;
    }
    if (state != "play") return;

    // ----- rajaduras nuevas -----
    if (enTormenta()) {
      D.t -= dt;
      if (D.t <= 0) {
        D.t = R(A.cadaCuanto[0], A.cadaCuanto[1]);
        const activos = huecos.filter((h) => h.activo);
        if (activos.length < A.maximo) {
          const z0 = B.z - R(A.distancia[0], A.distancia[1]),
            // casi siempre se hunde la mitad por donde vas (¡hay que cambiarse de carril!)
            q = Math.random() < 0.65 ? Math.sign(B.x) || 1 : -(Math.sign(B.x) || 1),
            libre = activos.every((h) => z0 - A.largo[1] > h.z0 + 15 || z0 < h.z0 - h.largo - 15);
          // en el agua y el ferry no; en las rotondas tampoco (ahí la carretera da la vuelta)
          const raro = [0, 0.5, 1].some((f) => {
            const z = z0 - f * A.largo[1];
            return [16, 17, 18].includes(zoneAt(z)) || Math.abs(z - RC(z)) < 60;
          });
          if (libre && !raro) rajar(z0, q);
        }
      }
    }

    // ----- cada hueco -----
    let tocados = false;
    huecos.forEach((h) => {
      if (!h.activo) return;
      h.t += dt;
      if (h.fase == "raja") {
        // la raja corre hacia adelante
        const k = Math.min(1, h.t / A.aviso);
        h.hueco.scale.z = Math.max(0.001, h.largo * (1 - Math.pow(1 - k, 2)));
        h.hueco.scale.x = h.q * RAJA * (1 + 0.4 * Math.sin(h.t * 30) ** 2); // tiembla
        if (h.t >= A.aviso) hundir(h);
      } else {
        // la mitad se hunde: el hueco se abre y la losa se va para abajo, ladeándose hacia afuera
        const k = Math.min(1, h.t / 1.2),
          e = k * k;
        h.hueco.scale.x = h.q * (RAJA + (ANCHO - RAJA) * Math.min(1, h.t / 0.5)); // el hueco se abre
        h.losa.position.y = -e * 9;
        h.losa.rotation.z = -h.q * e * 0.45;
        if (k >= 1) h.losa.visible = false;
        // pedazos que saltan y caen en la orilla
        if (h.t < 2.5) {
          tocados = true;
          h.piezas.forEach((p) => {
            const tt = Math.min(h.t, 2.5),
              y = Math.max(p.s * 0.4, 0.2 + p.vy * tt - 12 * tt * tt);
            m4.compose(
              v4.set(p.x, y, p.z),
              q4.setFromEuler(e4.set(p.r + tt * 3, p.r, 0)),
              s4.set(p.s, p.s * 0.6, p.s),
            );
            pedazos.setMatrixAt(h.i * POR_HUECO + p.k, m4);
          });
        }
        // polvo
        h.polvo.forEach((sp) => {
          if (!sp.visible) return;
          sp.userData.t += dt * 0.35;
          const u = sp.userData.t;
          sp.position.y = 1 + u * 10;
          sp.scale.setScalar(6 + u * 18);
          sp.material.opacity = Math.max(0, 0.65 * (1 - u)) * Math.min(1, u * 6);
          if (u >= 1) sp.visible = false;
        });
        // los carros que van por esa mitad se caen
        for (const c of cars) {
          if (c.caido) continue;
          if (dentro(h, c.x, c.z, 0.5)) {
            c.caido = { v: 0 };
            c.hit = 0.01;
            c.vz = 0;
            c.vx = 0;
          }
        }
        // se arregla cuando queda muy atrás, o lejos y ya pasó la tormenta
        if (h.z0 - h.largo - B.z > 80 || (!enTormenta() && h.z0 < B.z - 400)) borrar(h);
      }
    });
    if (tocados) pedazos.instanceMatrix.needsUpdate = true;
    // carros cayendo al hueco
    for (const c of cars)
      if (c.caido) {
        c.vy = 0;
        c.caido.v += 22 * dt;
        c.y = (c.y || 0) - c.caido.v * dt;
        c.o.rotation.x = Math.max(-0.6, (c.y || 0) * 0.12);
        if (c.y < -9) c.o.visible = false;
      }

    // ----- vos -----
    // 1. te caés: el bus se hunde de nariz en el hueco (0 a 1,9 s)
    // 2. una grúa baja un cable, te levanta y te lleva por el aire hasta después del hueco (1,9 a 4,4 s)
    // 3. te deja en tu mismo carril y seguís. (Se mueve poco a poco: un salto grande parecería un reinicio.)
    cable.visible = false;
    if (D.cayendo) {
      const F = D.cayendo;
      F.t += dt;
      B.x = F.x;
      B.h = F.h;
      B.v = 0;
      B.bal = 0;
      B.vy = 0;
      let y;
      if (F.t < 1.9) {
        const k = Math.min(1, F.t / 0.9);
        y = -k * k * 3.2;
        B.z = F.z;
        cur.rotation.x = -k * 0.35;
        cur.rotation.z = -F.q * k * 0.4;
      } else {
        if (F.t > 1.95 && !F.aviso) {
          F.aviso = true;
          msg("🏗 ¡Llegó la grúa! Te va a pasar al otro lado del hueco", 2500);
        }
        const sube = Math.min(1, (F.t - 1.9) / 0.6),
          va = Math.min(1, Math.max(0, (F.t - 2.5) / 1.4)),
          baja = Math.min(1, Math.max(0, (F.t - 3.9) / 0.5)),
          suave = va * va * (3 - 2 * va);
        y = -3.2 + 10.2 * sube - 7 * baja;
        B.z = F.z + (F.salida - F.z) * suave;
        cur.rotation.x = -0.35 * (1 - sube) + Math.sin(F.t * 5) * 0.04 * (1 - baja); // se mece colgando
        cur.rotation.z = -F.q * 0.4 * (1 - sube);
        cable.visible = true;
        cable.position.set(B.x, y + 3.4 + 30, B.z);
      }
      B.y = Math.max(0, y); // la cámara sube con el bus cuando va colgando
      bus.position.set(B.x, y, B.z);
      if (F.t > 4.4) {
        B.y = 0;
        bus.position.y = 0;
        cur.rotation.x = cur.rotation.z = 0;
        D.cayendo = null;
        msg("🏗 La grúa te dejó del otro lado · ¡seguí!", 2000);
      }
      zAnt = B.z;
      return;
    }
    if (play() && !B.fl && !B.bal && !PV.hover && B.y < 1)
      for (const h of huecos)
        if (dentro(h, B.x, B.z)) {
          caer(h);
          break;
        }
  };
})();
