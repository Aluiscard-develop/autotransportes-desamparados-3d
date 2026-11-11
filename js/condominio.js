// =====================================================================
// ZONA 50 · CONDOMINIO CON MI CASA y la COMPUTADORA. Se carga después de js/tormentas-colores.js.
// La carretera pasa por la calle principal de un condominio. Mi casa (dos pisos, blanca, techo rojo)
// está a la derecha, a la mitad de la zona, con la Máquina Generadora de Tormentas en el patio.
// Si te parás frente a la casa aparece el botón "💻 Usar la computadora" (o la tecla E):
// escribís un código de tormenta, la máquina sale disparada al cielo y empieza la tormenta.
// Busca estos títulos con Ctrl+F:
//   CASAS        · las casas del condominio, la entrada con la caseta del guarda y el muro
//   MI CASA      · la casa (cambiá los colores en CASA, abajo)
//   MÁQUINA      · la máquina en su plataforma y cómo despega
//   COMPUTADORA  · la pantalla con el código, los botones de tormentas y la X para cerrar
// Los códigos y lo que hace cada tormenta están en js/tormentas-colores.js (CÓDIGOS).
// =====================================================================
(function () {
  const GEN = window.GENERADOR;
  if (!GEN || NZ <= 50) return;
  const { caja, cilindro, cartel, compartir, mat, fusionar, humoTex, llamaTex, VIDRIO, LUZ, DER, IZQ } =
    MUNDO;
  const ZONA = 50,
    Z0 = -ZONA * 1000,
    Z1 = Z0 - 1000,
    ZC = Z0 - 500, // mi casa (a la mitad de la zona)
    XC = 27; // a qué distancia de la carretera está mi casa (a la derecha)
  const CASA = { pared: 0xf7f7f2, techo: 0xc62828, marcos: 0xffffff, puerta: 0x6d4c41 };

  ZN.push("🏠 Condominio (mi casa)");
  CLIMA[ZONA] = { suelo: 0x7fb26a };
  EXR.push([Z0, Z1]);
  EXRL.push([Z0, Z1]);
  const G = new T.Group();
  W(G);
  const animados = new T.Group();
  W(animados);
  const poner = (g, x, z, ry = 0) => {
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    G.add(g);
    return g;
  };
  // techo de dos aguas: un prisma triangular (ancho w, alto h, largo d) en la altura y
  const techo = (g, w, h, d, c, y) => {
    const s = new T.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, h);
    s.lineTo(-w / 2, 0);
    const m = new T.Mesh(
      compartir(new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2)),
      mat(c),
    );
    m.position.y = y;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const arbusto = (g, x, z, r = 1) => {
    const m = new T.Mesh(compartir(new T.IcosahedronGeometry(1, 0)), mat(0x3f8f3a));
    m.scale.set(r, r * 0.8, r);
    m.position.set(x, r * 0.6, z);
    m.castShadow = true;
    g.add(m);
  };
  const palmera = (g, x, z) => {
    cilindro(g, 0.25, 7, 0x8d6e63, x, 3.5, z);
    for (let i = 0; i < 6; i++) {
      const h = caja(g, 0.5, 0.08, 4, 0x2e7d32, x + Math.cos(i) * 1.6, 7, z + Math.sin(i) * 1.6);
      h.rotation.set(0.35, -i + Math.PI / 2, 0);
    }
  };

  // ===================== CASAS =====================
  // casa común de una o dos plantas, mirando hacia +z (después se gira hacia la carretera)
  const COLORES = [0xffe0b2, 0xb3e5fc, 0xc8e6c9, 0xf8bbd0, 0xfff9c4, 0xd1c4e9, 0xffccbc];
  const casaComun = (pisos, color, techoC) => {
    const g = new T.Group(),
      alto = pisos * 3;
    caja(g, 10, alto, 8, color, 0, alto / 2, 0);
    techo(g, 11, 2.4, 9, techoC, alto);
    caja(g, 1.1, 2.2, 0.15, 0x6d4c41, -2, 1.1, 4.05);
    for (let p = 0; p < pisos; p++)
      [-3.5, 1.5, 3.6].forEach(
        (x) => p + x != -2 && caja(g, 1.4, 1.2, 0.12, 0x9ec6e0, x, 1.7 + p * 3, 4.05, VIDRIO),
      );
    caja(g, 14, 0.9, 0.2, 0xffffff, 0, 0.45, 9); // murito del frente
    arbusto(g, 3.5, 6.5, 1.1);
    arbusto(g, -4, 6.5, 0.9);
    return g;
  };
  // la entrada: portón con caseta del guarda y el nombre del condominio
  {
    const g = new T.Group();
    [-9.5, 9.5].forEach((x) => caja(g, 1.4, 6.5, 1.4, 0xd7ccc8, x, 3.25, 0));
    caja(g, 20.4, 1.2, 1.6, 0xd7ccc8, 0, 6.9, 0);
    cartel(g, "CONDOMINIO VILLA TORMENTA", 17, 1.5, "#5d4037", "#ffe082", 0, 6.9, 0.85);
    cartel(g, "CONDOMINIO VILLA TORMENTA", 17, 1.5, "#5d4037", "#ffe082", 0, 6.9, -0.85, Math.PI);
    poner(g, 0, Z0 - 30);
    const caseta = new T.Group();
    caja(caseta, 3.4, 2.8, 3.4, 0xffffff, 0, 1.4, 0);
    caja(caseta, 4, 0.3, 4, 0x8d6e63, 0, 2.95, 0);
    caja(caseta, 2.4, 1, 0.1, 0x9ec6e0, 0, 1.7, 1.72, VIDRIO);
    caja(caseta, 0.15, 0.15, 6, 0xffeb3b, -1.9, 1, 4.4); // la aguja (levantada no estorba)
    poner(caseta, 12, Z0 - 36, DER);
  }
  // muro a los dos lados y casas a lo largo
  for (let z = Z0 - 45; z > Z1 + 40; z -= 42) {
    [-1, 1].forEach((lado) => {
      const zCasa = z - 20;
      if (lado > 0 && Math.abs(zCasa - ZC) < 45) return; // ahí está mi casa
      const c = casaComun(
        Math.random() < 0.5 ? 1 : 2,
        pk_(COLORES),
        pk_([0x8d6e63, 0x546e7a, 0xa1887f, 0xb71c1c]),
      );
      poner(c, lado * R(25, 30), zCasa, lado > 0 ? DER : IZQ);
      if (Math.random() < 0.5) palmera(G, lado * 14, z - 4);
      else arbusto(G, lado * 14, z - 4, 1.4);
      caja(G, 0.3, 4.5, 0.3, 0x616161, lado * 9.5, 2.25, z); // poste de luz
      caja(G, 1.6, 0.25, 0.4, 0x616161, lado * 8.8, 4.5, z);
      caja(G, 0.6, 0.15, 0.4, 0xfff6c0, lado * 8.3, 4.35, z, LUZ(0xfff2a0));
    });
  }

  // ===================== MI CASA =====================
  // dos pisos, blanca, techo rojo, cochera a un lado; mira hacia +z y se gira hacia la carretera
  {
    const g = new T.Group();
    caja(g, 12, 3.2, 9, CASA.pared, 0, 1.6, 0); // primer piso
    caja(g, 12.3, 0.3, 9.3, 0xe0e0e0, 0, 3.25, 0); // la franja entre los pisos
    caja(g, 12, 3, 9, CASA.pared, 0, 4.9, 0); // segundo piso
    techo(g, 13.4, 3.2, 10, CASA.techo, 6.4);
    caja(g, 0.9, 2.2, 0.9, 0xb71c1c, 3.5, 8.6, -1.5); // chimenea
    // puerta y ventanas del frente
    caja(g, 1.3, 2.4, 0.15, CASA.puerta, -1, 1.2, 4.55);
    caja(g, 1.7, 0.2, 0.6, CASA.marcos, -1, 2.55, 4.8); // techito de la puerta
    [-4, 3].forEach((x) => {
      caja(g, 2, 1.5, 0.12, 0x9ec6e0, x, 1.8, 4.55, VIDRIO);
      caja(g, 2.3, 0.18, 0.2, CASA.marcos, x, 0.98, 4.6);
    });
    [-4, -0.5].forEach((x) => caja(g, 1.8, 1.5, 0.12, 0x9ec6e0, x, 5, 4.55, VIDRIO));
    // la ventana del cuarto de la computadora (brilla azul)
    caja(g, 2.2, 1.6, 0.12, 0x4fc3ff, 3.4, 5, 4.55, LUZ(0x2196f3));
    caja(g, 2.5, 0.18, 0.2, CASA.marcos, 3.4, 4.12, 4.6);
    // balcón
    caja(g, 4.2, 0.2, 1.4, 0xe0e0e0, -2.2, 3.5, 5.2);
    caja(g, 4.2, 0.9, 0.08, 0xffffff, -2.2, 4, 5.88);
    // cochera a un lado
    caja(g, 5.4, 3, 8, CASA.pared, -8.7, 1.5, 0.5);
    caja(g, 5.8, 0.35, 8.4, CASA.techo, -8.7, 3.1, 0.5);
    caja(g, 4.4, 2.5, 0.15, 0x9e9e9e, -8.7, 1.25, 4.55);
    for (let i = 0; i < 5; i++) caja(g, 4.4, 0.05, 0.17, 0x757575, -8.7, 0.3 + i * 0.5, 4.56);
    // entrada para carros y caminito
    caja(g, 5, 0.06, 15, 0xbdbdbd, -8.7, 0.04, 12);
    caja(g, 1.4, 0.06, 13, 0xd7ccc8, -1, 0.04, 11.5);
    // cerca blanca del frente (con espacio para la entrada)
    for (let x = -14; x <= 8; x += 0.9)
      if (x < -11.5 || x > -5.8) caja(g, 0.12, 1, 0.12, 0xffffff, x, 0.5, 17);
    [0.4, 0.85].forEach((y) => {
      caja(g, 2.6, 0.08, 0.06, 0xffffff, -12.8, y, 17);
      caja(g, 14, 0.08, 0.06, 0xffffff, 1, y, 17);
    });
    arbusto(g, 4.5, 6, 1.2);
    arbusto(g, 6.5, 6.4, 1);
    arbusto(g, -3.6, 6.2, 0.9);
    palmera(g, 6.8, 12);
    // buzón y rótulo "MI CASA"
    caja(g, 0.15, 1.3, 0.15, 0x5d4037, -4.6, 0.65, 18);
    caja(g, 0.5, 0.4, 0.7, 0x1565c0, -4.6, 1.45, 18);
    cartel(g, "🏠 MI CASA", 3.6, 1, "#c62828", "#ffffff", 1.5, 2.3, 17.2);
    caja(g, 0.15, 2, 0.15, 0x5d4037, 1.5, 1, 17.1);
    poner(g, XC, ZC, DER);
  }

  // ===================== MÁQUINA =====================
  // en su plataforma, en el patio al lado de mi casa
  const XM = 23,
    ZM = ZC + 13;
  {
    const g = new T.Group();
    cilindro(g, 3.6, 0.25, 0x9e9e9e, 0, 0.12, 0);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2,
        r = caja(g, 1.6, 0.04, 0.5, i % 2 ? 0x212121 : 0xffd600, Math.cos(a) * 3.1, 0.27, Math.sin(a) * 3.1);
      r.rotation.y = -a + Math.PI / 2;
    }
    caja(g, 0.8, 1.2, 0.5, 0x37474f, 3.9, 0.6, 0); // tablero
    caja(g, 0.5, 0.15, 0.06, 0xff1744, 3.9, 1.0, -0.26, LUZ(0xff1744));
    poner(g, XM, ZM);
  }
  const maquina = GEN.hacerMaquina();
  maquina.scale.setScalar(1.5);
  maquina.position.set(XM, 0.25, ZM);
  animados.add(maquina);
  const fuego = new T.Sprite(
    new T.SpriteMaterial({
      map: llamaTex,
      color: 0xffb060,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
    }),
  );
  fuego.visible = false;
  animados.add(fuego);
  const humos = [];
  for (let i = 0; i < 10; i++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: humoTex,
        color: 0xdddddd,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    animados.add(sp);
    humos.push({ sp, t: 0 });
  }
  const DESP = { t: -1 }; // despegando: t = segundos desde que despegó

  G.add(fusionar(new T.Group().add(...G.children))); // todo lo quieto en pocas mallas
  congelar(G, new Set());
  chunks.forEach(scatter);

  // ===================== COMPUTADORA =====================
  const boton = document.createElement("button");
  boton.id = "btnCompu";
  boton.textContent = "💻 Usar la computadora" + (matchMedia("(pointer: fine)").matches ? " (E)" : "");
  document.body.appendChild(boton);
  const compu = document.createElement("div");
  compu.id = "compu";
  compu.innerHTML = `
    <div class="pantalla" role="dialog" aria-label="Computadora de mi casa">
      <div class="barra"><span>💻 GENERADOR DE TORMENTAS · MI CASA</span><button class="x" aria-label="Cerrar">✕</button></div>
      <label class="texto" for="codigoTormenta">INSERTE CÓDIGO DE LA TORMENTA:</label>
      <form><input id="codigoTormenta" maxlength="30" autocomplete="off" spellcheck="false" placeholder="ejemplo: ULTRA" /><button type="submit">▶ GENERAR</button></form>
      <div class="resp"></div>
      <div class="lista"></div>
    </div>`;
  document.body.appendChild(compu);
  const entrada = compu.querySelector("input"),
    resp = compu.querySelector(".resp"),
    lista = compu.querySelector(".lista");
  GEN.CODIGOS.forEach(([codigo, emoji, nombre, hace]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "codigo" + (codigo == "ULTRA" ? " ultra" : "");
    b.innerHTML = `<b>${emoji} ${codigo}</b><span>${nombre} · ${hace}</span>`;
    b.onclick = () => usar(codigo);
    lista.appendChild(b);
  });
  // las teclas que se escriben aquí no manejan el bus (la R reinicia, la C cambia la cámara…)
  ["keydown", "keyup"].forEach((ev) => compu.addEventListener(ev, (e) => e.stopPropagation()));
  compu.addEventListener("keydown", (e) => e.key == "Escape" && cerrar());
  let abierta = false;
  const abrir = () => {
    if (abierta || state != "play") return;
    abierta = true;
    state = "paused"; // el juego se detiene mientras usás la computadora
    for (const k in keys) keys[k] = 0;
    if (E.g1) E.g1.gain.value = E.g3.gain.value = E.g4.gain.value = 0;
    resp.textContent = "";
    resp.className = "resp";
    compu.style.display = "flex";
    boton.style.display = "none";
    setTimeout(() => entrada.focus(), 50);
  };
  const cerrar = () => {
    if (!abierta) return;
    abierta = false;
    compu.style.display = "none";
    entrada.blur();
    resume();
  };
  const usar = (texto) => {
    const c = GEN.usar(texto);
    if (!c) {
      resp.textContent = "❌ Código no encontrado. Probá uno de la lista.";
      resp.className = "resp mal";
      return;
    }
    entrada.value = "";
    resp.textContent =
      c[0] == "CALMA"
        ? "🌤 Apagando las tormentas…"
        : `✅ ${c[1]} ${c[2]} · ¡La máquina sale disparada al cielo!`;
    resp.className = "resp bien";
    if (c[0] != "CALMA" && DESP.t < 0 && maquina.visible) DESP.t = 0; // despega
    setTimeout(cerrar, 1300);
  };
  compu.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    usar(entrada.value);
  };
  compu.querySelector(".x").onclick = cerrar;
  boton.onclick = abrir;
  addEventListener("keydown", (e) => e.code == "KeyE" && boton.style.display == "block" && abrir());
  window.COMPUTADORA = { abrir, cerrar, usar }; // para probar desde la consola

  // ===================== CUADRO A CUADRO =====================
  const ruido = (dur, f0, f1, vol) => {
    try {
      if (!AC) return;
      const t0 = AC.currentTime,
        o = AC.createOscillator(),
        v = AC.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f0, t0);
      o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      v.gain.setValueAtTime(vol, t0);
      v.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(v).connect(AC.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch (e) {}
  };
  const hayTormentaDeLaCompu = () =>
    Object.values(APOCALIPSIS.forzadas).some((s) => s > 0) ||
    GEN.tornado > 0 ||
    GEN.jugo > 0 ||
    GEN.totopos > 0 ||
    GEN.pendientes.length ||
    APOCALIPSIS.forzada;
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    if (state != "play") return;
    // ----- ¿estás parado frente a mi casa? -----
    const u = B.z - CZ, // dónde vas dentro del ciclo
      frente = !MONT.on && Math.abs(u - ZC) < 16 && B.x > 0.5 && Math.abs(B.v) < 2 && B.y < 0.5;
    boton.style.display = frente && !abierta ? "block" : "none";
    if (frente && !boton.avisado) {
      boton.avisado = true;
      msg("🏠 Estás en tu casa · usá la computadora para generar tormentas", 2600);
    }
    if (!frente) boton.avisado = false;
    // ----- la máquina despega y se va al cielo -----
    if (DESP.t >= 0) {
      if (DESP.t == 0) {
        ruido(2.5, 90, 900, 0.18);
        shake = Math.max(shake, 0.5);
      }
      DESP.t += dt;
      const y = 0.25 + 15 * DESP.t * DESP.t;
      maquina.position.y = y;
      maquina.rotation.y += dt * DESP.t * 3;
      fuego.visible = true;
      fuego.position.set(XM, y - 1.2, ZM);
      fuego.scale.set(3, 5 + Math.random() * 2, 1);
      humos.forEach((h, i) => {
        if (h.t <= 0 && Math.random() < dt * 8) {
          h.t = 2;
          h.sp.position.set(XM + R(-1, 1), y - 2, ZM + R(-1, 1));
        }
        if (h.t > 0) {
          h.t -= dt;
          h.sp.scale.setScalar(4 + (2 - h.t) * 5);
          h.sp.material.opacity = Math.max(0, h.t / 2) * 0.7;
        }
      });
      if (y > 160) {
        DESP.t = -1;
        maquina.visible = false;
        fuego.visible = false;
      }
    } else
      humos.forEach((h) => h.t > 0 && ((h.t -= dt), (h.sp.material.opacity = Math.max(0, h.t / 2) * 0.7)));
    // ----- cuando terminan las tormentas de la computadora, la máquina vuelve a su plataforma -----
    if (!maquina.visible && DESP.t < 0 && !hayTormentaDeLaCompu()) {
      maquina.visible = true;
      maquina.position.y = 0.25;
    }
  };
})();
