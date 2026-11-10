// =====================================================================
// TIENDAS DE CELULARES "CeluTuanis" (marca inventada para el juego). Se carga después de js/mundo6.js.
// Hay una tienda a la orilla de la carretera en varias zonas. Cada vez que pasás frente a una te
// da plata (AJUSTES.tiendas.premio, una vez por tienda en cada vuelta).
//   ZONAS  · en qué zonas hay tienda y a cuántos metros del inicio de la zona (TIENDAS, abajo)
//   TIENDA · cómo se ve: el local con vidrio, el rótulo, el logo y el celular gigante (hacerTienda)
//   LOGO   · el dibujo del logo (logo)
// =====================================================================
(function () {
  const { caja, cartelDibujo, mat, DER, IZQ } = MUNDO;
  const A = AJUSTES.tiendas,
    NOMBRE = "CeluTuanis";

  // [zona, metros desde el inicio de la zona, lado (1 = derecha, -1 = izquierda)]
  const TIENDAS = [
    [0, 760, 1], // Centro urbano
    [1, 650, -1], // Autopista
    [3, 450, 1], // Ruta del bosque
    [9, 250, -1], // Circunvalación
    [13, 650, 1], // Cruce Río Frío
    [15, 800, -1], // Terminal de buses
    [22, 450, 1], // Autopista nueva
    [25, 350, -1], // Florencio del Castillo
    [26, 700, 1], // Puntarenas
    [40, 500, -1],
    [44, 600, 1],
    [47, 300, -1], // Desierto
  ].filter(([z]) => z < NZ);

  // ===================== LOGO =====================
  // un celular sonriente con señal, y el nombre
  function logo(x, w, h) {
    x.fillStyle = "#ffd23f";
    x.fillRect(0, 0, w, h);
    x.fillStyle = "#1d2b64";
    x.fillRect(0, h * 0.86, w, h * 0.14);
    const cx = h * 0.62,
      cy = h * 0.46,
      pw = h * 0.42,
      ph = h * 0.7;
    // el celular
    x.fillStyle = "#1d2b64";
    x.beginPath();
    x.roundRect
      ? x.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, pw * 0.2)
      : x.rect(cx - pw / 2, cy - ph / 2, pw, ph);
    x.fill();
    x.fillStyle = "#7fd6ff";
    x.fillRect(cx - pw * 0.36, cy - ph * 0.38, pw * 0.72, ph * 0.66);
    // carita feliz en la pantalla
    x.fillStyle = "#1d2b64";
    x.beginPath();
    x.arc(cx - pw * 0.14, cy - ph * 0.12, pw * 0.06, 0, 7);
    x.arc(cx + pw * 0.14, cy - ph * 0.12, pw * 0.06, 0, 7);
    x.fill();
    x.lineWidth = pw * 0.06;
    x.strokeStyle = "#1d2b64";
    x.beginPath();
    x.arc(cx, cy + ph * 0.02, pw * 0.17, 0.2, Math.PI - 0.2);
    x.stroke();
    // señal
    x.strokeStyle = "#ff6a13";
    x.lineCap = "round";
    for (let i = 1; i <= 3; i++) {
      x.lineWidth = h * 0.045;
      x.beginPath();
      x.arc(cx + pw * 0.62, cy - ph * 0.36, h * 0.07 * i, -Math.PI / 2, 0);
      x.stroke();
    }
    // el nombre
    x.fillStyle = "#1d2b64";
    x.font = `900 ${h * 0.42}px system-ui, Arial`;
    x.textAlign = "left";
    x.textBaseline = "middle";
    x.fillText(NOMBRE, h * 1.18, h * 0.42);
    x.fillStyle = "#ffd23f";
    x.font = `bold ${h * 0.1}px system-ui, Arial`;
    x.textAlign = "center";
    x.fillText("CELULARES · RECARGAS · INTERNET", w / 2, h * 0.93);
  }

  // ===================== TIENDA =====================
  // mira hacia +z; después se gira para que el frente quede hacia la carretera
  function hacerTienda() {
    const g = new T.Group();
    caja(g, 10, 4.4, 8, 0xf4f4f0, 0, 2.2, 0); // el local
    caja(g, 10.4, 0.35, 8.4, 0x1d2b64, 0, 4.55, 0); // techo
    caja(g, 7.6, 2.7, 0.12, 0x9ec6e0, -0.6, 1.55, 4.02, { metalness: 0.4, roughness: 0.15 }); // vitrina
    caja(g, 1.6, 2.5, 0.14, 0x26324f, 3.6, 1.25, 4.03); // puerta
    caja(g, 10.2, 1.3, 0.3, 0xffd23f, 0, 3.75, 4.12); // franja amarilla
    cartelDibujo(g, 8.4, 1.15, logo, 0, 3.75, 4.3); // rótulo del frente
    // rótulo grande en el techo
    caja(g, 0.3, 2.4, 0.3, 0x555555, -3.2, 5.9, 0);
    caja(g, 0.3, 2.4, 0.3, 0x555555, 3.2, 5.9, 0);
    caja(g, 9.6, 2.9, 0.25, 0x1d2b64, 0, 8.4, 0);
    cartelDibujo(g, 9.2, 2.5, logo, 0, 8.4, 0.14);
    // celular gigante en la entrada
    const cel = new T.Group();
    caja(cel, 1.5, 2.9, 0.35, 0x1d2b64, 0, 0, 0);
    caja(cel, 1.25, 2.3, 0.05, 0x7fd6ff, 0, 0.1, 0.19, { emissive: 0x2a8fd0, emissiveIntensity: 0.6 });
    cel.position.set(-6.2, 1.7, 4.4);
    cel.rotation.y = 0.35;
    g.add(cel);
    caja(g, 2, 0.3, 2, 0x8d8d8d, -6.2, 0.15, 4.4); // base del celular
    // acera y parqueo
    caja(g, 14, 0.12, 6, 0xb8b8b2, -1, 0.06, 7.2);
    for (let i = -2; i <= 2; i++) caja(g, 0.15, 0.02, 4, 0xffffff, i * 2.6 - 1, 0.13, 7.6);
    return g;
  }

  // ===================== PONERLAS EN EL MUNDO =====================
  const G = new T.Group();
  W(G);
  const tiendas = TIENDAS.map(([zona, metros, lado]) => {
    let z = -zona * 1000 - metros;
    if (Math.abs(z - RC(z)) < 170) z -= 300; // lejos de las rotondas (ahí la carretera da la vuelta)
    const t = hacerTienda();
    // el frente mira a la carretera; el local queda detrás de la acera
    t.scale.setScalar(1.4);
    t.position.set(lado * 24, 0, z);
    t.rotation.y = lado > 0 ? DER : IZQ;
    G.add(t);
    // sin árboles, casas ni otros negocios encima de la tienda
    (lado > 0 ? EXR : EXRL).push([z + 28, z - 28]);
    return { z, lado, zona, pagado: -1 };
  });
  congelar(G, new Set());
  chunks.forEach(scatter);

  // ===================== PASAR FRENTE A UNA =====================
  const D = { tiendas };
  window.TIENDAS = D; // para revisar desde la consola
  const sonidoCaja = () => {
    try {
      if (!AC) return;
      const t0 = AC.currentTime;
      [1318, 1760].forEach((f, i) => {
        const o = AC.createOscillator(),
          v = AC.createGain();
        o.type = "triangle";
        o.frequency.value = f;
        v.gain.setValueAtTime(0.18, t0 + i * 0.09);
        v.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.09 + 0.35);
        o.connect(v).connect(AC.destination);
        o.start(t0 + i * 0.09);
        o.stop(t0 + i * 0.09 + 0.4);
      });
    } catch (e) {}
  };
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    if (state != "play" || MONT.on) return;
    const u = B.z - CZ; // dónde vas dentro del ciclo
    for (const t of tiendas)
      if (t.pagado != cyc && u < t.z && u > t.z - 40) {
        t.pagado = cyc;
        cash += A.premio;
        sonidoCaja();
        msg(`📱 ¡Pasaste por ${NOMBRE}! +₡${A.premio.toLocaleString("es-CR")}`, 2200);
      }
  };
})();
