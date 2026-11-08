// =====================================================================
// MÁS MUNDO (zonas 32 a 34 y la Rotonda de La Y Griega en obras). Se carga después de js/mundo2.js.
// Busca estos títulos con Ctrl+F:
//   WALMART Y CARL'S JR           · los dos negocios nuevos que salen por todo el juego
//   ROTONDA LA Y GRIEGA · OBRAS   · obras en construcción, grúa torre, conos y trabajadores
//   CARRILES EXTERNOS             · los carriles que rodean la rotonda por fuera (se pueden manejar)
//   ESTACIONES REMODELADAS        · las paradas nuevas de la rotonda (la parada normal está en js/juego.js, mkStop)
//   ZONA 32 · TERMINAL LUMACA     · terminal de buses de Autotransportes Lumaca
//   ZONA 33 · PAÍSES UNIDOS I     · Nicaragua, Honduras, El Salvador, Guatemala y México
//   ZONA 34 · PAÍSES UNIDOS II    · Colombia, Venezuela, Brasil, Perú, Chile y Argentina
//   MOTOS Y BUSES PARA MANEJAR    · vehículos 25 a 30
//   CUADRO A CUADRO               · la grúa que gira, premios de la terminal, la estación y los países
// =====================================================================
(function () {
  const {
    caja, cilindro, piso, cartel, cartelDibujo, fachada, fusionar, deModelo, bandera, compartir, mat,
    BUSES, NEGOCIOS, COMIDA, ZONAS_LOTE, COLORES_EDIFICIO, VIDRIO, LUZ, DER, IZQ, busNuevo, faros, restaurante,
  } = MUNDO;

  ZN.push(
    "Terminal Autotransportes Lumaca",
    "Países unidos · Centroamérica y México",
    "Países unidos · Sudamérica",
  );
  // negocios a la orilla (también Walmart y Carl's Jr) en más zonas
  Object.assign(ZONAS_LOTE, { 10: 0.7, 12: 0.75, 32: 0.85, 33: 0.75, 34: 0.75 });
  EXR.push([-32150, -32850]); // derecha: la Terminal Lumaca

  const G = new T.Group(); // escenario fijo de las zonas nuevas (se funde al final)
  W(G);
  const Z = (g, x, z, ry = 0, padre = G) => {
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    padre.add(g);
    return g;
  };
  const texto = (x, t, cx, cy, fs, color) => {
    x.fillStyle = color;
    x.font = "bold " + fs + "px system-ui,Arial";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(t, cx, cy);
  };
  const portico = (z, t, fondo = "#0a6e3a", letra = "#ffffff", padre = G) => {
    const g = new T.Group();
    [-9, 9].forEach((x) => caja(g, 0.6, 7.4, 0.6, 0x8a8f94, x, 3.7, 0));
    caja(g, 18.6, 0.7, 0.7, 0x8a8f94, 0, 7.4, 0);
    cartel(g, t, 17, 2.2, fondo, letra, 0, 8.9, 0.4);
    cartel(g, t, 17, 2.2, fondo, letra, 0, 8.9, -0.4, Math.PI);
    return Z(g, 0, z, 0, padre);
  };
  const letrero = (g, x, z, t, fondo = "#f9a825", letra = "#111111", ancho = 4.6, ry = 0) => {
    const s = new T.Group();
    caja(s, 0.2, 3, 0.2, 0x777777, 0, 1.5, 0);
    cartel(s, t, ancho, 1.2, fondo, letra, 0, 3.4, 0.12);
    cartel(s, t, ancho, 1.2, fondo, letra, 0, 3.4, -0.12, Math.PI);
    return Z(s, x, z, ry, g);
  };
  const cono = (g, x, z, s = 1) => {
    const m = new T.Mesh(compartir(new T.ConeGeometry(0.28 * s, 0.8 * s, 10)), mat(0xff6d00));
    m.position.set(x, 0.4 * s, z);
    m.castShadow = true;
    g.add(m);
    caja(g, 0.36 * s, 0.1 * s, 0.36 * s, 0xff6d00, x, 0.05 * s, z);
    const b = new T.Mesh(compartir(new T.CylinderGeometry(0.15 * s, 0.19 * s, 0.14 * s, 10)), mat(0xffffff));
    b.position.set(x, 0.48 * s, z);
    g.add(b);
  };
  const persona = (g, x, z, ropa, casco) => {
    caja(g, 0.5, 0.8, 0.32, 0x263238, x, 0.4, z);
    caja(g, 0.56, 0.75, 0.36, ropa, x, 1.18, z);
    const h = new T.Mesh(compartir(new T.SphereGeometry(0.2, 10, 8)), mat(0xd7a27a));
    h.position.set(x, 1.78, z);
    g.add(h);
    if (casco) {
      const c = new T.Mesh(compartir(new T.SphereGeometry(0.23, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), mat(casco));
      c.position.set(x, 1.84, z);
      g.add(c);
    }
  };
  // cinta plana sobre el suelo que sigue una lista de puntos [x, z] (carriles, líneas pintadas)
  const cinta = (g, pts, ancho, color, y = 0.035, desfase = 0, capa = -3) => {
    const pos = [],
      idx = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)],
        b = pts[Math.min(pts.length - 1, i + 1)],
        tx = b[0] - a[0],
        tz = b[1] - a[1],
        l = Math.hypot(tx, tz) || 1,
        nx = -tz / l,
        nz = tx / l;
      pos.push(p[0] + nx * (desfase - ancho / 2), y, p[1] + nz * (desfase - ancho / 2));
      pos.push(p[0] + nx * (desfase + ancho / 2), y, p[1] + nz * (desfase + ancho / 2));
      if (i) {
        const k = i * 2;
        idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
      }
    });
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // que las normales miren hacia arriba aunque la cinta esté al revés
    const n = geo.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    geo.setAttribute("uv", new T.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
    const m = new T.Mesh(
      geo,
      mat(color, { roughness: 0.9, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: capa, polygonOffsetUnits: capa }),
    );
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // ===================== WALMART Y CARL'S JR =====================
  // Cada negocio mira hacia +z (hacia la carretera). Salen al azar en los lotes de la orilla
  // (ver elegirNegocio en js/mundo.js) y también fijos en la Rotonda de La Y Griega.
  const logoWalmart = (x, w, h) => {
    x.fillStyle = "#0071ce";
    x.fillRect(0, 0, w, h);
    texto(x, "Walmart", w * 0.4, h / 2, h * 0.52, "#ffffff");
    const cx = w * 0.87,
      cy = h / 2;
    x.fillStyle = "#ffc220";
    for (let i = 0; i < 6; i++) {
      x.save();
      x.translate(cx, cy);
      x.rotate((i * Math.PI) / 3);
      x.beginPath();
      x.ellipse(0, -h * 0.24, h * 0.07, h * 0.16, 0, 0, Math.PI * 2);
      x.fill();
      x.restore();
    }
  };
  const logoCarls = (x, w, h) => {
    x.fillStyle = "#d71920";
    x.fillRect(0, 0, w, h);
    // estrella amarilla con carita
    const cx = w / 2,
      cy = h * 0.42,
      r = h * 0.34;
    x.fillStyle = "#ffc72c";
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        q = i % 2 ? r * 0.45 : r;
      x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q);
    }
    x.closePath();
    x.fill();
    x.fillStyle = "#111";
    [-1, 1].forEach((s) => {
      x.beginPath();
      x.arc(cx + s * r * 0.17, cy - r * 0.05, r * 0.06, 0, Math.PI * 2);
      x.fill();
    });
    x.strokeStyle = "#111";
    x.lineWidth = r * 0.06;
    x.beginPath();
    x.arc(cx, cy + r * 0.05, r * 0.2, 0.2, Math.PI - 0.2);
    x.stroke();
    texto(x, "Carl's Jr.", cx, h * 0.87, h * 0.17, "#ffffff");
  };
  NEGOCIOS.walmart = () => {
    const g = new T.Group();
    caja(g, 26, 8, 18, 0xd9dde0, 0, 4, -6);
    caja(g, 26.4, 0.9, 18.4, 0x0071ce, 0, 8.4, -6);
    caja(g, 9, 10, 1.2, 0x0071ce, 0, 5, 3.2);
    cartelDibujo(g, 8.4, 2.4, logoWalmart, 0, 8.2, 3.85);
    caja(g, 5, 2.8, 0.12, 0x9cc8e8, 0, 1.4, 3.85, VIDRIO);
    [-8.5, 8.5].forEach((x) => caja(g, 5.5, 2.4, 0.12, 0x9cc8e8, x, 1.6, 3.1, VIDRIO));
    piso(g, 26, 7, 0x3b3e44, 0, 6.6);
    for (let i = -5; i <= 5; i++) caja(g, 0.12, 0.02, 3, 0xffffff, i * 2.4, 0.05, 7.4);
    // carritos del súper
    for (let i = 0; i < 4; i++) caja(g, 0.6, 0.9, 1, 0x9e9e9e, -11 + i * 0.75, 0.5, 4.6, { metalness: 0.7, roughness: 0.3 });
    // poste con el logo (se ve de lejos)
    caja(g, 0.5, 12, 0.5, 0x777777, 12.5, 6, 9);
    cartelDibujo(g, 6, 2, logoWalmart, 12.5, 12.6, 9.27);
    cartelDibujo(g, 6, 2, logoWalmart, 12.5, 12.6, 8.73, Math.PI);
    return g;
  };
  NEGOCIOS.carlsjr = () =>
    restaurante("CARL'S JR.", 0xf3e6c8, 0xd71920, "#111111", "#ffc72c", (g) => {
      caja(g, 0.4, 4, 0.4, 0x777777, 5.5, 12.7, 7.5);
      cartelDibujo(g, 3.6, 3.6, logoCarls, 5.5, 15.6, 7.75);
      cartelDibujo(g, 3.6, 3.6, logoCarls, 5.5, 15.6, 7.25, Math.PI);
      cartelDibujo(g, 2.4, 2.4, logoCarls, -4, 3.2, 5.08);
    });
  COMIDA.push("carlsjr");

  // ===================== ROTONDA LA Y GRIEGA · OBRAS =====================
  // Todo esto va dentro del grupo de la rotonda (rb, en js/juego.js): se mueve con ella en cada vuelta.
  // Coordenadas relativas al centro de la rotonda. El bus llega desde +z y sigue hacia -z.
  const RY = new T.Group();
  // ----- CARRILES EXTERNOS -----
  // Dos carriles (uno por lado) que salen de la carretera antes de la rotonda, la rodean por fuera y
  // vuelven a entrar después. Así se pasa directo sin dar la vuelta (y sin meterse en las obras).
  const CTRL = [[10.6, 128], [13, 98], [24, 58], [37.5, 0], [24, -58], [13, -98], [10.6, -128]];
  const curva = new T.CatmullRomCurve3(CTRL.map(([x, z]) => new T.Vector3(x, 0, z)));
  const PTS = curva.getSpacedPoints(160).map((v) => [v.x, v.z]);
  const CARRIL_ANCHO = 7.4;
  [1, -1].forEach((q) => {
    const pts = PTS.map(([x, z]) => [q * x, q * z]);
    cinta(RY, pts, CARRIL_ANCHO, 0x3b3e44, 0.03, 0, -3);
    [-CARRIL_ANCHO / 2 + 0.3, CARRIL_ANCHO / 2 - 0.3].forEach((d) => cinta(RY, pts, 0.18, 0xf2f2f2, 0.04, d, -5));
    for (let i = 4; i < pts.length - 4; i += 6) cinta(RY, pts.slice(i, i + 3), 0.16, 0xffd23f, 0.04, 0, -5); // línea del centro
    // flechas pintadas y letreros
    [20, 140].forEach((i) => {
      const [x, z] = pts[i],
        [x2, z2] = pts[i + 1],
        a = Math.atan2(x2 - x, z2 - z),
        f = cartel(RY, "⬆", 2.4, 4.8, "#3b3e44", "#f2f2f2", x, 0.05, z);
      f.rotation.set(-Math.PI / 2, 0, a + Math.PI);
      f.material.polygonOffset = true;
      f.material.polygonOffsetFactor = -6;
    });
  });
  letrero(RY, 11.5, 160, "CARRIL EXTERNO · PASO DIRECTO ↗", "#0a7a43", "#ffffff", 6.4);
  letrero(RY, -11.5, -160, "CARRIL EXTERNO · PASO DIRECTO ↗", "#0a7a43", "#ffffff", 6.4, Math.PI);
  letrero(RY, 11.5, 200, "🚧 OBRAS EN LA ROTONDA · 30 km/h", "#ff8f00", "#111111", 6.4);
  letrero(RY, -11.5, -200, "🚧 OBRAS EN LA ROTONDA · 30 km/h", "#ff8f00", "#111111", 6.4, Math.PI);
  // ¿está (x, z) sobre un carril externo? (para que el bus no "se salga" de la carretera)
  const PTS_FISICA = curva.getSpacedPoints(60).map((v) => [v.x, v.z]);
  const distCarril = (x, z) => {
    let d = 1e9;
    for (let i = 0; i < PTS_FISICA.length - 1; i++) {
      const [ax, az] = PTS_FISICA[i],
        [bx, bz] = PTS_FISICA[i + 1],
        vx = bx - ax,
        vz = bz - az,
        t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
      d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
    }
    return d;
  };
  PISTAS_EXTRA.push((x, z) => {
    const dz = z - rb.position.z;
    if (Math.abs(dz) > 132 || Math.abs(x) < 6) return false;
    return x > 0 ? distCarril(x, dz) < CARRIL_ANCHO / 2 + 0.4 : distCarril(-x, -dz) < CARRIL_ANCHO / 2 + 0.4;
  });

  // ----- obras dentro de la rotonda: carril de la izquierda cerrado con conos y barreras -----
  for (let a = Math.PI * 0.55; a < Math.PI * 1.45; a += 0.075) cono(RY, Math.cos(a) * 24.8, Math.sin(a) * 24.8);
  const barrera = (g, x, z, ry) => {
    const b = new T.Group();
    for (let i = 0; i < 4; i++) caja(b, 0.5, 0.9, 0.5, i % 2 ? 0xffffff : 0xff6d00, 0, 0.45, -0.75 + i * 0.5);
    return Z(b, x, z, ry, g);
  };
  for (let a = Math.PI * 0.62; a < Math.PI * 1.4; a += 0.16) barrera(RY, Math.cos(a) * 21.5, Math.sin(a) * 21.5, -a);
  // andamio y malla junto al monumento de la Y (remodelación de la isla)
  {
    const g = new T.Group();
    for (const [x, z] of [[-4.5, -4.5], [4.5, -4.5], [-4.5, -6.5], [4.5, -6.5]]) caja(g, 0.12, 4, 0.12, 0x9e9e9e, x, 2.5, z);
    [1.5, 3.5].forEach((y) => caja(g, 9.2, 0.15, 2.2, 0x8d6e63, 0, y + 0.5, -5.5));
    caja(g, 9.2, 3.6, 0.05, 0x2e7d32, 0, 2.5, -4.4, { transparent: true, opacity: 0.55 });
    cartel(g, "REMODELACIÓN · ROTONDA LA Y GRIEGA", 8.6, 0.9, "#ff8f00", "#111111", 0, 3.6, -4.32, Math.PI);
    for (let i = 0; i < 4; i++) persona(g, -3 + i * 2, -7.8, 0xff6d00, 0xffd600);
    RY.add(g);
  }
  // ----- obras afuera (izquierda, después de la rotonda) -----
  const OB = new T.Group();
  OB.position.set(-68, 0, -72);
  RY.add(OB);
  piso(OB, 46, 82, 0x8d6e4b, 0, 0, 0.025);
  // malla naranja
  for (let z = -40; z < 40; z += 4) caja(OB, 0.08, 1.4, 4, 0xff6d00, 23, 0.9, z + 2, { transparent: true, opacity: 0.8 });
  for (let z = -40; z <= 40; z += 4) caja(OB, 0.12, 1.8, 0.12, 0x9e9e9e, 23, 0.9, z);
  cartel(OB, "OBRAS EN CONSTRUCCIÓN · MOPT", 12, 1.6, "#ff8f00", "#111111", 23.1, 3.1, 0, Math.PI / 2);
  caja(OB, 0.3, 3, 0.3, 0x777777, 23.1, 1.5, -5.6);
  caja(OB, 0.3, 3, 0.3, 0x777777, 23.1, 1.5, 5.6);
  // montañas de tierra y tubos
  [[-8, 18, 4], [-14, 6, 3], [6, 24, 3.5], [-2, -28, 5]].forEach(([x, z, r]) => {
    const m = new T.Mesh(compartir(new T.ConeGeometry(r * 2, r * 1.3, 9)), mat(0x7a5a3a, { flatShading: true }));
    m.position.set(x, r * 0.65, z);
    m.castShadow = true;
    OB.add(m);
  });
  for (let i = 0; i < 5; i++) {
    const t = cilindro(OB, 0.9, 6, 0x9e9e9e, 10 + (i % 3) * 2, 0.9 + Math.floor(i / 3) * 1.7, -14 + (i % 3) * 0.1);
    t.rotation.z = Math.PI / 2;
  }
  // excavadora
  {
    const g = new T.Group();
    caja(g, 3, 0.9, 4.6, 0x263238, 0, 0.45, 0);
    caja(g, 3.2, 1.6, 3.2, 0xffb300, 0, 1.8, 0.4);
    caja(g, 1.4, 1.6, 1.4, 0x9fc4e8, -0.7, 3.1, -0.5, VIDRIO);
    caja(g, 1.6, 1.6, 0.3, 0xffb300, 0.6, 3.1, -0.5);
    const b1 = caja(g, 0.6, 0.6, 4.4, 0xffb300, 0.8, 3.4, -2.6);
    b1.rotation.x = 0.55;
    const b2 = caja(g, 0.5, 0.5, 3.6, 0xffb300, 0.8, 3.1, -5.3);
    b2.rotation.x = -0.9;
    caja(g, 1.3, 0.9, 1, 0x37474f, 0.8, 1.3, -6.4);
    Z(g, -6, 8, 0.6, OB);
  }
  // volqueta
  {
    const g = new T.Group();
    caja(g, 2.4, 2.2, 2.2, 0xd32f2f, 0, 1.6, -3);
    caja(g, 2.42, 0.8, 0.1, 0x9fc4e8, 0, 2.2, -4.12, VIDRIO);
    caja(g, 2.2, 0.5, 7.8, 0x222222, 0, 0.7, 0);
    const v = caja(g, 2.5, 1.6, 4.6, 0x8d8d8d, 0, 2.2, 1.6);
    v.rotation.x = -0.12;
    wr(g, [[-1, -3], [1, -3], [-1, 1.2], [1, 1.2], [-1, 2.8], [1, 2.8]], 0.5);
    Z(g, 12, -24, 0.2, OB);
  }
  // contenedores de oficina y baños portátiles
  caja(OB, 6, 2.6, 2.5, 0xeceff1, -15, 1.3, -32);
  cartel(OB, "OFICINA DE OBRA", 4.4, 0.6, "#ff8f00", "#111111", -15, 2.1, -30.73);
  caja(OB, 6, 2.6, 2.5, 0x1565c0, -15, 3.9, -32);
  for (let i = 0; i < 3; i++) caja(OB, 1.2, 2.3, 1.2, 0x2e7d32, -4 + i * 1.4, 1.15, -36);
  for (let i = 0; i < 7; i++) persona(OB, -10 + i * 3.4, -6 + (i % 3) * 7, 0xff6d00, 0xffd600);
  for (let i = 0; i < 12; i++) cono(OB, 21, -36 + i * 6.5);
  // grúa torre (la pluma gira; se anima en CUADRO A CUADRO)
  const pluma = new T.Group();
  {
    const g = new T.Group();
    for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) caja(g, 0.25, 42, 0.25, 0xffc107, x, 21, z);
    for (let y = 2; y < 42; y += 3) {
      caja(g, 2, 0.15, 0.15, 0xffc107, 0, y, -0.9);
      caja(g, 2, 0.15, 0.15, 0xffc107, 0, y, 0.9);
      caja(g, 0.15, 0.15, 2, 0xffc107, -0.9, y, 0);
      caja(g, 0.15, 0.15, 2, 0xffc107, 0.9, y, 0);
    }
    caja(g, 4, 1, 4, 0x9e9e9e, 0, 0.5, 0);
    Z(g, 2, 26, 0, OB);
    caja(pluma, 1.4, 1.4, 34, 0xffc107, 0, 0, -12);
    caja(pluma, 1.4, 1.4, 10, 0xffc107, 0, 0, 9);
    caja(pluma, 2.6, 2.6, 3, 0x9e9e9e, 0, -0.4, 12);
    caja(pluma, 1.8, 1.8, 1.8, 0x37474f, 1.6, -1.2, 0.8);
    caja(pluma, 0.6, 5, 0.6, 0xffc107, 0, 3, 0);
    caja(pluma, 0.06, 18, 0.06, 0x222222, 0, -9, -22);
    caja(pluma, 1.2, 0.8, 1.2, 0xff6d00, 0, -18.2, -22);
    caja(pluma, 3, 1.2, 3, 0x795548, 0, -19.2, -22);
    cartel(pluma, "LA Y GRIEGA 2027", 10, 1.2, "#ffc107", "#111111", 0, 0, -7, -Math.PI / 2, true).position.x = 0.75;
    pluma.position.set(2, 42.7, 26);
    OB.add(pluma);
  }
  // valla grande en la entrada
  {
    const g = new T.Group();
    [-4, 4].forEach((x) => caja(g, 0.4, 7, 0.4, 0x777777, x, 3.5, 0));
    cartelDibujo(g, 11, 4.4, (x, w, h) => {
      x.fillStyle = "#ff8f00";
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#111";
      for (let i = -4; i < 30; i++) x.fillRect(i * 32, 0, 14, h * 0.12);
      texto(x, "🚧 OBRAS EN CONSTRUCCIÓN", w / 2, h * 0.36, h * 0.17, "#111111");
      texto(x, "Remodelación de la Rotonda de La Y Griega", w / 2, h * 0.6, h * 0.1, "#111111");
      texto(x, "Usá los carriles externos · Disculpe las molestias", w / 2, h * 0.8, h * 0.085, "#111111");
    }, 0, 6, 0.25);
    Z(g, -26, 110, 0, RY);
    Z(g.clone(), 26, -110, Math.PI, RY);
  }
  // ----- ESTACIONES REMODELADAS -----
  // Una por lado, en el borde de afuera de cada carril externo. Parando el bus en la franja verde: premio.
  const estacion = (g, x, z, ry) => {
    const s = new T.Group();
    piso(s, 3.6, 30, 0xbdbab3, 1, 0, 0.06);
    caja(s, 0.25, 0.26, 30, 0xf2c200, -0.9, 0.13, 0);
    for (let k = -1; k <= 1; k++) {
      [-0.2, 2.2].forEach((px) => caja(s, 0.16, 3.4, 0.16, 0x37474f, px, 1.7, k * 7, { metalness: 0.7, roughness: 0.3 }));
    }
    caja(s, 3.4, 0.2, 18, 0x2e7d32, 1, 3.45, 0);
    caja(s, 3.5, 0.08, 18.1, 0xdfe6ea, 1, 3.6, 0, { metalness: 0.6, roughness: 0.3 });
    caja(s, 0.06, 2.6, 16, 0xbfe3f5, 2.2, 1.6, 0, { transparent: true, opacity: 0.35, depthWrite: false, metalness: 0.3, roughness: 0.05 });
    for (let k = -1; k <= 1; k++) caja(s, 0.6, 0.12, 4, 0x8d6e63, 1.6, 0.62, k * 6);
    caja(s, 0.25, 0.8, 3.4, 0x111111, 0.6, 2.9, 0);
    cartel(s, "Y GRIEGA · LUMACA 3 min · ATD 5 min", 3.2, 0.55, "#050505", "#ffb020", 0.46, 2.9, 0, -Math.PI / 2);
    cartel(s, "ESTACIÓN Y GRIEGA · REMODELADA", 12, 0.6, "#2e7d32", "#ffffff", -0.71, 3.45, 0, -Math.PI / 2);
    for (let i = 0; i < 8; i++) persona(s, R(0.6, 1.8), -7 + i * 2, pk_([0x1565c0, 0xc62828, 0x6a1b9a, 0x2e7d32, 0xf9a825]));
    return Z(s, x, z, ry, g);
  };
  estacion(RY, 42.6, 0, 0);
  estacion(RY, -42.6, 0, Math.PI);
  // franja verde donde parar (sobre el carril externo de la derecha)
  piso(RY, 3.4, 18, 0x2fbf6a, 39.3, 0, 0.045).material = mat(0x2fbf6a, { transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  // Walmart y Carl's Jr fijos en la rotonda
  {
    const w = NEGOCIOS.walmart();
    w.position.set(-62, 0, 86);
    w.rotation.y = IZQ;
    RY.add(w);
    const c = NEGOCIOS.carlsjr();
    c.position.set(46, 0, 82);
    c.rotation.y = DER;
    RY.add(c);
  }
  // fundir todo lo fijo de la rotonda (menos la pluma de la grúa, que gira)
  OB.remove(pluma);
  const RYf = fusionar(RY);
  pluma.position.add(OB.position);
  RYf.add(pluma);
  rb.add(RYf);
  congelar(RYf, new Set([pluma]));
  rb.updateMatrixWorld(true);

  // ===================== ZONA 32 · TERMINAL LUMACA =====================
  // A la derecha: patio de buses (se puede manejar adentro), andenes techados, buses de Lumaca,
  // edificio con boletería, pantalla de salidas y torre del reloj. Pará el bus en el ANDÉN 1: +₡8000.
  BUSES.push([0xf4f6f8, 0xc62828, "LUMACA"], [0x283593, 0xffd54f, "INTERNACIONAL"]);
  const B_LUMACA = BUSES.length - 2,
    B_INTER = BUSES.length - 1;
  const TERM = { z0: -32240, z1: -32760, x1: 62, anden: -32500, hecho: -1, t: 0 };
  PISTAS_EXTRA.push((x, z) => {
    const u = z - CZ;
    return x > 6 && x < TERM.x1 && u < TERM.z0 && u > TERM.z1;
  });
  {
    portico(-32030, "AUTOTRANSPORTES LUMACA · TERMINAL A 200 m", "#c62828");
    piso(G, 82, 540, 0x55585c, 48, -32500, 0.025);
    // líneas del patio
    for (let z = -32270; z > -32740; z -= 20) caja(G, 12, 0.02, 0.18, 0xffffff, 14, 0.05, z);
    // ANDÉN 1: la franja verde donde parar
    const a1 = piso(G, 7, 40, 0x2fbf6a, 16.5, TERM.anden, 0.05);
    a1.material = mat(0x2fbf6a, { transparent: true, opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
    const t1 = cartel(G, "ANDÉN 1 · LUMACA", 6, 2, "#2fbf6a", "#ffffff", 16.5, 0.07, TERM.anden + 14);
    t1.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    // letrero alto en la entrada
    const pil = new T.Group();
    caja(pil, 1.2, 16, 1.2, 0x37474f, 0, 8, 0);
    cartel(pil, "LUMACA", 6, 2.4, "#c62828", "#ffffff", 0, 15, 0.62);
    cartel(pil, "LUMACA", 6, 2.4, "#c62828", "#ffffff", 0, 15, -0.62, Math.PI);
    cartel(pil, "TERMINAL", 6, 1.2, "#ffffff", "#c62828", 0, 12.8, 0.62);
    cartel(pil, "TERMINAL", 6, 1.2, "#ffffff", "#c62828", 0, 12.8, -0.62, Math.PI);
    Z(pil, 10, -32225);
    // techo de los andenes
    caja(G, 36, 0.6, 400, 0xeceff1, 44, 8.3, -32500);
    caja(G, 36.4, 0.9, 400.4, 0xc62828, 44, 7.7, -32500);
    for (let z = -32310; z >= -32690; z -= 38) [27, 61].forEach((x) => caja(G, 0.7, 8, 0.7, 0x9e9e9e, x, 4, z, { metalness: 0.6, roughness: 0.3 }));
    // andenes (islas) con buses de Lumaca estacionados de frente a la carretera
    for (let j = 0; j < 7; j++) {
      const z = -32330 - j * 56;
      caja(G, 26, 0.3, 3.2, 0xbdbab3, 46, 0.15, z);
      caja(G, 26, 0.32, 0.25, 0xf2c200, 46, 0.16, z - 1.6);
      cartel(G, "ANDÉN " + (j + 2), 3, 0.7, "#c62828", "#ffffff", 34, 3, z, DER, true);
      caja(G, 0.15, 2.6, 0.15, 0x777777, 34, 1.3, z);
      for (let i = 0; i < 3; i++) persona(G, 40 + i * 4 + R(-1, 1), z + R(-0.8, 0.8), pk_([0x1565c0, 0xc62828, 0x6a1b9a, 0x2e7d32]));
      [-1, 1].forEach((q) => {
        if (Math.random() < 0.2) return;
        const b = busNuevo(j % 4 == 3 ? B_INTER : B_LUMACA);
        b.position.set(44, 0, z + q * 4.8);
        b.rotation.y = IZQ;
        G.add(b);
      });
    }
    // edificio de la terminal
    const ed = fachada(24, 14, 420, 0xf4f6f8);
    ed.position.set(76, 7, -32500);
    G.add(ed);
    caja(G, 24.6, 1, 420.6, 0xc62828, 76, 14.5, -32500);
    cartel(G, "TERMINAL AUTOTRANSPORTES LUMACA", 40, 3.6, "#c62828", "#ffffff", 63.9, 11, -32500, DER);
    // boletería y pantalla de salidas
    for (let i = 0; i < 4; i++) {
      caja(G, 0.2, 2.4, 3.4, 0x9cc8e8, 63.9, 1.6, -32440 - i * 5, VIDRIO);
      cartel(G, "BOLETERÍA " + (i + 1), 3.2, 0.5, "#0d47a1", "#ffffff", 63.75, 3.2, -32440 - i * 5, DER);
    }
    cartelDibujo(G, 16, 5, (x, w, h) => {
      x.fillStyle = "#050505";
      x.fillRect(0, 0, w, h);
      texto(x, "SALIDAS · LUMACA", w / 2, h * 0.11, h * 0.12, "#ffffff");
      const filas = [["SAN JOSÉ", "10:15", "2"], ["CARTAGO", "10:20", "3"], ["TRES RÍOS", "10:30", "4"], ["CURRIDABAT", "10:35", "5"], ["GUATEMALA (INTERNACIONAL)", "11:00", "6"], ["MANAGUA (INTERNACIONAL)", "11:30", "7"]];
      filas.forEach(([d, h0, a], i) => {
        const y = h * (0.27 + i * 0.125);
        x.fillStyle = "#ffb020";
        x.font = "bold " + h * 0.085 + "px system-ui,Arial";
        x.textAlign = "left";
        x.fillText(d, w * 0.04, y);
        x.textAlign = "right";
        x.fillText(h0 + "   ANDÉN " + a, w * 0.96, y);
      });
    }, 63.8, 6, -32560, DER);
    // sala de espera con bancas
    for (let i = 0; i < 6; i++) caja(G, 1, 0.5, 6, 0x8d6e63, 58, 0.5, -32590 - i * 9);
    // torre del reloj
    const tr = new T.Group();
    caja(tr, 6, 26, 6, 0xf4f6f8, 0, 13, 0);
    caja(tr, 6.6, 1.2, 6.6, 0xc62828, 0, 26.6, 0);
    cartelDibujo(tr, 4, 4, (x, w, h) => {
      x.fillStyle = "#fff";
      x.fillRect(0, 0, w, h);
      x.strokeStyle = "#111";
      x.lineWidth = w * 0.04;
      x.beginPath();
      x.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
      x.stroke();
      x.beginPath();
      x.moveTo(w / 2, h / 2);
      x.lineTo(w / 2, h * 0.18);
      x.moveTo(w / 2, h / 2);
      x.lineTo(w * 0.72, h * 0.6);
      x.stroke();
    }, -3.05, 21, 0, DER);
    cartel(tr, "LUMACA", 5.6, 1.4, "#c62828", "#ffffff", -3.05, 17, 0, DER);
    Z(tr, 62, -32260);
    for (let i = 0; i < 6; i++) bandera(G, "Costa Rica", 9.5, -32100 - i * 22);
  }

  // ===================== ZONA 33 · PAÍSES UNIDOS I =====================
  // Cinco países seguidos, 200 m cada uno. Cada país tiene su arco de bienvenida, banderas y un monumento.
  // Al entrar a cada país te sellan el pasaporte (+₡500). La lista de países está en PAISES_UNIDOS.
  const PAISES_UNIDOS = [
    { n: "Nicaragua", e: "🇳🇮", z: -33000, c: "#0067c6", l: "#ffffff" },
    { n: "Honduras", e: "🇭🇳", z: -33200, c: "#0073cf", l: "#ffffff" },
    { n: "El Salvador", e: "🇸🇻", z: -33400, c: "#0f47af", l: "#ffffff" },
    { n: "Guatemala", e: "🇬🇹", z: -33600, c: "#4997d0", l: "#ffffff" },
    { n: "México", e: "🇲🇽", z: -33800, c: "#006847", l: "#ffffff" },
    { n: "Colombia", e: "🇨🇴", z: -34000, c: "#fcd116", l: "#003893" },
    { n: "Venezuela", e: "🇻🇪", z: -34167, c: "#cf142b", l: "#ffffff" },
    { n: "Brasil", e: "🇧🇷", z: -34333, c: "#009c3b", l: "#ffdf00" },
    { n: "Perú", e: "🇵🇪", z: -34500, c: "#d91023", l: "#ffffff" },
    { n: "Chile", e: "🇨🇱", z: -34667, c: "#0033a0", l: "#ffffff" },
    { n: "Argentina", e: "🇦🇷", z: -34833, c: "#74acdf", l: "#ffffff" },
  ];
  window.PAISES_UNIDOS = PAISES_UNIDOS;
  const lagoMat = compartir(new T.MeshStandardMaterial({ color: 0x2a6fa8, roughness: 0.12, metalness: 0.25, normalMap: wNrm, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  const lago = (w, d, x, z) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, d), lagoMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.045, z);
    G.add(m);
  };
  const cerro = (x, z, r, h, c, nieve) => {
    const m = new T.Mesh(compartir(new T.ConeGeometry(r, h, 18)), mat(c, { flatShading: true }));
    m.position.set(x, h / 2, z);
    G.add(m);
    if (nieve) {
      const n = new T.Mesh(compartir(new T.ConeGeometry(r * 0.3, h * 0.3, 18)), mat(0xffffff, { flatShading: true }));
      n.position.set(x, h * 0.85 + 0.2, z);
      G.add(n);
    }
    return m;
  };
  const piramide = (x, z, base, pisos, alto, c, ry = 0) => {
    const g = new T.Group();
    for (let i = 0; i < pisos; i++) {
      const w = base * (1 - (i / pisos) * 0.75);
      caja(g, w, alto, w, c, 0, alto * (i + 0.5), 0);
    }
    caja(g, base * 0.12, alto * pisos, base * 0.6, 0x8d7b68, 0, (alto * pisos) / 2, base * 0.3); // escalinata
    return Z(g, x, z, ry);
  };
  const casitas = (lado, z0, largo, colores) => {
    for (let z = z0 - 10; z > z0 - largo + 10; z -= 13) {
      const c = pk_(colores),
        g = new T.Group();
      caja(g, 10, 5 + R(0, 2), 9, c, 0, 3, 0);
      caja(g, 10.6, 0.5, 9.6, 0x8d4b2a, 0, 6.4, 0);
      caja(g, 1.4, 2.4, 0.1, 0x5d4037, 0, 1.2, 4.55);
      [-3, 3].forEach((x) => caja(g, 1.4, 1.4, 0.1, 0x223344, x, 3, 4.55));
      Z(g, lado * 30, z, lado > 0 ? DER : IZQ);
    }
  };
  // arco "PAÍSES UNIDOS" con las banderas de todos
  const arcoUnion = (z, t) => {
    const g = new T.Group();
    [-12, 12].forEach((x) => caja(g, 1.4, 13, 1.4, 0xeceff1, x, 6.5, 0));
    caja(g, 25.4, 2.6, 1.6, 0xeceff1, 0, 13.6, 0);
    cartel(g, t, 22, 2, "#1a237e", "#ffffff", 0, 13.6, 0.82);
    cartel(g, t, 22, 2, "#1a237e", "#ffffff", 0, 13.6, -0.82, Math.PI);
    Z(g, 0, z);
    PAISES_UNIDOS.forEach((p, i) => {
      bandera(G, p.n, 13 + (i % 2) * 3, z - 10 - i * 7, 7);
      bandera(G, p.n, -16 - (i % 2) * 3, z - 10 - i * 7, 7);
    });
  };
  arcoUnion(-33020, "🤝 PAÍSES UNIDOS · CENTROAMÉRICA Y MÉXICO");
  arcoUnion(-34020, "🤝 PAÍSES UNIDOS · SUDAMÉRICA");
  PAISES_UNIDOS.forEach((p, i) => {
    const largo = i < 5 ? 200 : 167;
    portico(p.z - 100, "BIENVENIDOS A " + p.n.toUpperCase(), p.c, p.l);
    for (let z = p.z - 120; z > p.z - largo; z -= 40) {
      bandera(G, p.n, 10.5, z);
      bandera(G, p.n, -10.5, z - 20);
    }
  });
  // Nicaragua: lago, volcán Momotombo y la catedral de León
  {
    lago(150, 170, -130, -33100);
    cerro(-260, -33110, 95, 150, 0x5d4e3f);
    const g = new T.Group();
    caja(g, 22, 12, 34, 0xf5f5f0, 0, 6, 0);
    [-8, 8].forEach((x) => {
      caja(g, 6, 22, 6, 0xf5f5f0, x, 11, 15);
      const c = new T.Mesh(compartir(new T.SphereGeometry(3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2)), mat(0xf5f5f0));
      c.position.set(x, 22, 15);
      g.add(c);
    });
    const d = new T.Mesh(compartir(new T.SphereGeometry(6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)), mat(0xf5f5f0));
    d.position.y = 12;
    g.add(d);
    cartel(g, "CATEDRAL DE LEÓN", 10, 1.2, "#0067c6", "#ffffff", 0, 6, 18.05);
    Z(g, 58, -33130, DER);
  }
  // Honduras: ruinas mayas de Copán (escalinata y estelas)
  {
    piramide(-62, -33300, 40, 5, 3.4, 0x9e9478);
    for (let i = 0; i < 5; i++) {
      const g = new T.Group();
      caja(g, 2.2, 7, 1.4, 0x8d8370, 0, 3.5, 0);
      for (let k = 0; k < 4; k++) caja(g, 1.6, 0.6, 1.6, 0x7a705e, 0, 1 + k * 1.6, 0);
      caja(g, 1.2, 1.2, 1.5, 0x6d6352, 0, 6.2, 0.1);
      Z(g, -30 - (i % 2) * 6, -33240 - i * 26, IZQ);
    }
    letrero(G, -13, -33260, "RUINAS DE COPÁN", "#0073cf", "#ffffff");
    casitas(1, -33200, 200, [0xffffff, 0xf5e6c8, 0xe0f2f1, 0xfff59d]);
  }
  // El Salvador: Monumento al Divino Salvador del Mundo
  {
    const g = new T.Group();
    piso(g, 40, 40, 0xbdbab3, 0, 0);
    cilindro(g, 4, 3, 0xeceff1, 0, 1.5, 0);
    cilindro(g, 1.6, 30, 0xeceff1, 0, 18, 0);
    const mundo = new T.Mesh(compartir(new T.SphereGeometry(3.4, 18, 12)), mat(0x1e88e5));
    mundo.position.y = 36;
    g.add(mundo);
    caja(g, 1.2, 4, 1, 0xf5f5f5, 0, 41.2, 0);
    caja(g, 3.6, 0.6, 0.6, 0xf5f5f5, 0, 42.2, 0);
    const c = new T.Mesh(compartir(new T.SphereGeometry(0.6, 10, 8)), mat(0xf5f5f5));
    c.position.y = 43.8;
    g.add(c);
    Z(g, -48, -33500);
    letrero(G, -13, -33460, "EL SALVADOR DEL MUNDO", "#0f47af", "#ffffff", 5.4);
    casitas(1, -33400, 200, [0xbbdefb, 0xffffff, 0xffe0b2]);
  }
  // Guatemala: templo de Tikal en la selva
  {
    const g = new T.Group();
    for (let i = 0; i < 9; i++) caja(g, 30 - i * 2.6, 4.2, 30 - i * 2.6, 0x8b8070, 0, 2.1 + i * 4.2, 0);
    caja(g, 8, 8, 6, 0x7a705e, 0, 41.8, -2);
    caja(g, 7, 9, 1.6, 0x7a705e, 0, 50, -3.5); // crestería
    caja(g, 5, 38, 8, 0x9e9478, 0, 19, 13);
    Z(g, -75, -33700, IZQ);
    for (let i = 0; i < 40; i++) {
      const t = tree();
      t.scale.setScalar(R(1.5, 2.6));
      t.position.set(-R(40, 130), 0, -33600 - R(0, 200));
      G.add(t);
    }
    letrero(G, -13, -33650, "TIKAL · PETÉN", "#4997d0", "#ffffff");
  }
  // México: Pirámide del Sol, Ángel de la Independencia y cactus
  {
    piramide(-120, -33900, 80, 5, 8, 0xa1887f, IZQ);
    const g = new T.Group();
    caja(g, 10, 4, 10, 0x9e9e9e, 0, 2, 0);
    cilindro(g, 1.6, 34, 0xeceff1, 0, 21, 0);
    caja(g, 1.4, 3.6, 1.2, 0xffc107, 0, 39.8, 0, { metalness: 0.9, roughness: 0.25 });
    const al = caja(g, 5, 0.3, 1.4, 0xffc107, 0, 40.6, 0.2, { metalness: 0.9, roughness: 0.25 });
    al.rotation.z = 0.25;
    Z(g, 42, -33880);
    letrero(G, 13, -33850, "ÁNGEL DE LA INDEPENDENCIA", "#006847", "#ffffff", 5.6);
    for (let i = 0; i < 24; i++) {
      const c = new T.Group(),
        h = R(2, 4.5);
      cilindro(c, 0.4, h, 0x2e7d32, 0, h / 2, 0);
      cilindro(c, 0.28, 1.6, 0x2e7d32, 0.9, h * 0.6, 0);
      cilindro(c, 0.28, 1.3, 0x2e7d32, -0.9, h * 0.5, 0);
      caja(c, 1.4, 0.4, 0.4, 0x2e7d32, 0, h * 0.4, 0);
      Z(c, (i % 2 ? 1 : -1) * R(14, 38), -33810 - R(0, 180));
    }
  }

  // ===================== ZONA 34 · PAÍSES UNIDOS II =====================
  // Colombia: cafetales en las lomas y casitas de colores
  {
    for (let i = 0; i < 4; i++) cerro(-90 - i * 45, -34060 - i * 30, 40, 50, 0x558b2f);
    const cafe = [];
    for (let i = 0; i < 140; i++) cafe.push([-R(14, 60), 0.7, -34030 - R(0, 130)]);
    for (const [x, y, z] of cafe) {
      const m = new T.Mesh(compartir(new T.IcosahedronGeometry(0.9, 0)), mat(0x2e7d32, { flatShading: true }));
      m.position.set(x, y, z);
      G.add(m);
    }
    casitas(1, -34000, 167, [0xfdd835, 0x1e88e5, 0xe53935, 0xff7043, 0x8e24aa]);
    letrero(G, -13, -34050, "CAFÉ DE COLOMBIA", "#fcd116", "#003893");
  }
  // Venezuela: tepuy con el Salto Ángel
  {
    const t = cilindro(G, 70, 140, 0x6d4c41, -230, 70, -34250);
    t.scale.set(1.4, 1, 1);
    caja(G, 1, 1, 1, 0x388e3c, -230, 140.5, -34250).scale.set(180, 1, 130);
    const salto = caja(G, 7, 130, 0.5, 0xe3f2fd, -133, 70, -34230, { emissive: 0x90caf9, emissiveIntensity: 0.4 });
    salto.rotation.y = 0.2;
    lago(60, 40, -125, -34215);
    letrero(G, -13, -34200, "SALTO ÁNGEL · CANAIMA", "#cf142b", "#ffffff", 5.2);
  }
  // Brasil: el Corcovado con el Cristo y el Pan de Azúcar
  {
    cerro(-170, -34420, 70, 120, 0x33691e);
    const g = new T.Group();
    caja(g, 3, 6, 3, 0xd7ccc8, 0, 3, 0);
    caja(g, 2.6, 16, 2.2, 0xf5f5f5, 0, 14, 0);
    caja(g, 22, 2, 2, 0xf5f5f5, 0, 19.5, 0);
    const c = new T.Mesh(compartir(new T.SphereGeometry(1.4, 12, 10)), mat(0xf5f5f5));
    c.position.y = 23.5;
    g.add(c);
    g.position.set(-170, 120, -34420);
    g.rotation.y = IZQ;
    G.add(g);
    const pan = new T.Mesh(compartir(new T.SphereGeometry(40, 18, 14)), mat(0x5d6b4a, { flatShading: true }));
    pan.scale.set(1, 2, 1);
    pan.position.set(-290, 30, -34330);
    G.add(pan);
    casitas(1, -34333, 167, [0x00c853, 0xffeb3b, 0x29b6f6, 0xffffff]);
    letrero(G, -13, -34380, "RÍO DE JANEIRO · CRISTO REDENTOR", "#009c3b", "#ffdf00", 6.4);
  }
  // Perú: Machu Picchu (terrazas y casitas de piedra) y el Huayna Picchu
  {
    const g = new T.Group();
    for (let i = 0; i < 7; i++) caja(g, 70 - i * 8, 3, 60 - i * 6, i % 2 ? 0x689f38 : 0x7cb342, 0, 1.5 + i * 3, 0);
    for (let i = 0; i < 10; i++) {
      const x = R(-18, 18),
        z = R(-14, 14);
      caja(g, 5, 3, 4, 0x9e9e9e, x, 22.5, z);
      const t = caja(g, 5.6, 0.4, 4.6, 0x8d6e63, x, 24.4, z);
      t.rotation.x = 0.3;
    }
    Z(g, -90, -34590);
    cerro(-120, -34650, 30, 110, 0x2e5d32);
    letrero(G, -13, -34540, "MACHU PICCHU · CUSCO", "#d91023", "#ffffff");
  }
  // Chile: la cordillera de los Andes nevada y la torre Costanera
  {
    for (let i = 0; i < 6; i++) cerro(-150 - (i % 2) * 90, -34680 - i * 30, 70, R(150, 220), 0x546e7a, true);
    const f = fachada(22, 130, 22, 0x90a4ae);
    f.position.set(60, 65, -34760);
    G.add(f);
    const p = new T.Mesh(compartir(new T.CylinderGeometry(4, 12, 20, 4)), mat(0x90a4ae));
    p.position.set(60, 140, -34760);
    p.rotation.y = Math.PI / 4;
    G.add(p);
    letrero(G, 13, -34710, "SANTIAGO · COSTANERA", "#0033a0", "#ffffff");
  }
  // Argentina: el Obelisco de Buenos Aires
  {
    const g = new T.Group();
    piso(g, 30, 30, 0xbdbab3, 0, 0);
    const ob = new T.Mesh(compartir(new T.CylinderGeometry(1.6, 3.4, 60, 4)), mat(0xf5f5f0));
    ob.position.y = 30;
    ob.rotation.y = Math.PI / 4;
    g.add(ob);
    const pu = new T.Mesh(compartir(new T.ConeGeometry(2.3, 4, 4)), mat(0xf5f5f0));
    pu.position.y = 62;
    pu.rotation.y = Math.PI / 4;
    g.add(pu);
    Z(g, -40, -34920);
    letrero(G, -13, -34880, "BUENOS AIRES · OBELISCO", "#74acdf", "#ffffff");
    casitas(1, -34833, 167, [0xffffff, 0xeceff1, 0xffccbc]);
    arcoUnion(-34985, "🤝 PAÍSES UNIDOS · ¡VUELVA PRONTO!");
  }

  // ===================== MOTOS Y BUSES PARA MANEJAR =====================
  // 25 Moto deportiva · 26 Moto repartidora · 27 a 30 buses (usan la misma carrocería del bus ATD).
  const ruedaMoto = (g, w, z, r = 0.36) => wh(g, r, 0.18, 0, r, z, 0x151515, 0xbbbbbb, w);
  mkV(25, (g, w) => {
    const c = 0xd50000;
    g.add(
      mm(0.42, 0.5, 1.5, c, 0, 0.75, -0.05), // carenado
      mm(0.5, 0.35, 0.7, c, 0, 1.12, -0.25), // tanque
      mm(0.36, 0.14, 0.7, 0x111111, 0, 1.1, 0.45), // asiento
      mm(0.4, 0.42, 0.3, c, 0, 1.05, -0.8), // trompa
      mm(0.36, 0.25, 0.05, 0x9fc4e8, 0, 1.35, -0.88, { transparent: true, opacity: 0.6 }),
      mm(0.08, 0.6, 0.08, 0xbbbbbb, 0, 0.7, -0.85, { metalness: 0.8, roughness: 0.3 }), // horquilla
      mm(0.7, 0.06, 0.06, 0x222222, 0, 1.3, -0.6), // manubrio
      mm(0.14, 0.14, 0.7, 0xbbbbbb, 0.22, 0.55, 0.55, { metalness: 0.9, roughness: 0.2 }), // escape
      mm(0.46, 0.7, 0.34, 0x212121, 0, 1.6, 0.2), // piloto
      mm(0.16, 0.5, 0.16, 0x1565c0, -0.16, 0.95, 0.15),
      mm(0.16, 0.5, 0.16, 0x1565c0, 0.16, 0.95, 0.15),
      mm(0.12, 0.12, 0.55, 0x212121, -0.27, 1.6, -0.15),
      mm(0.12, 0.12, 0.55, 0x212121, 0.27, 1.6, -0.15),
      mm(0.4, 0.4, 0.42, c, 0, 2.15, 0.15), // casco
      mm(0.32, 0.14, 0.05, 0x111111, 0, 2.17, -0.07),
      lt(0, 1.05, -0.96),
    );
    ruedaMoto(g, w, -0.82);
    ruedaMoto(g, w, 0.78);
  });
  mkV(26, (g, w) => {
    const c = 0xffc72c;
    g.add(
      mm(0.5, 0.25, 1.3, c, 0, 0.55, 0.05),
      mm(0.5, 0.85, 0.3, c, 0, 0.95, -0.6),
      mm(0.38, 0.18, 0.6, 0x111111, 0, 0.98, 0.25),
      mm(0.6, 0.06, 0.06, 0x222222, 0, 1.4, -0.68),
      mm(0.72, 0.7, 0.62, 0xd71920, 0, 1.45, 0.72), // caja de reparto
      mm(0.46, 0.7, 0.34, 0xd71920, 0, 1.5, 0.05), // repartidor
      mm(0.4, 0.4, 0.42, 0xffc72c, 0, 2.05, 0.0),
      mm(0.16, 0.45, 0.16, 0x37474f, -0.16, 0.85, -0.05),
      mm(0.16, 0.45, 0.16, 0x37474f, 0.16, 0.85, -0.05),
      lt(0, 1.1, -0.76),
    );
    const caj = new T.Mesh(new T.PlaneGeometry(0.6, 0.6), new T.MeshBasicMaterial({ map: cv(128, 128, logoCarls) }));
    caj.position.set(0, 1.45, 1.04);
    g.add(caj);
    ruedaMoto(g, w, -0.62, 0.28);
    ruedaMoto(g, w, 0.62, 0.28);
  });
  const motoPV = (o) =>
    Object.assign({}, PVS[11], {
      acc: 15, max: 46, off: 14, od: 0.6, br: 26, turn: 1.45, sf: 0.04, sl: 0.25, gp: 8, hl: 1.1, hw: 0.45,
      cd: 6.2, ch: 2.9, dm: 1.3, cr: 0.5, sk: 0.15, rl: 7, bob: 0.01, bf: 14, ob: 0.06, fc: 0.6,
      hz: -1, ez: 0.9, s: [0, 2.05, 0.05], i: 1300, r: 9500, c: 4, w: "square",
    }, o);
  PVS.push(motoPV(), motoPV({ acc: 10, max: 30, turn: 1.6, r: 6000, c: 3, s: [0, 1.95, -0.05] }));
  VN.push("Moto deportiva", "Moto repartidora Carl's Jr");
  VI.push("🏍", "🛵");
  TUN.push({}, {});
  // buses nuevos: la pintura se agrega a SK (js/juego.js) y BUS_EXTRA dice qué pintura usa cada vehículo
  [
    ["Bus Lumaca", { b: 0xf4f6f8, s: 0xc62828, t: 0x0d47a1, side: "AUTOTRANSPORTES LUMACA", bg: "#c62828", dest: "LUMACA · SAN JOSÉ", fr: "LUMACA" }],
    ["Bus escolar", { b: 0xf2b400, s: 0x111111, t: 0x111111, side: "TRANSPORTE DE ESTUDIANTES", bg: "#111111", fg: "#f2b400", dest: "ESCOLAR", fr: "ESTUDIANTES" }],
    ["Bus turístico Pura Vida", { b: 0x00897b, s: 0xffffff, t: 0xffd54f, side: "PURA VIDA · TOURS COSTA RICA", bg: "#00695c", dest: "TOUR · VOLCANES", fr: "PURA VIDA" }],
    ["Bus internacional Países Unidos", { b: 0x283593, s: 0xffd54f, t: 0xc62828, side: "PAÍSES UNIDOS · INTERNACIONAL", bg: "#1a237e", dest: "SAN JOSÉ - MÉXICO", fr: "INTERNACIONAL" }],
  ].forEach(([nombre, pintura]) => {
    SK.push(pintura);
    BUS_EXTRA[VN.length] = SK.length - 1;
    PVS.push(PVS[0]); // lugar reservado: los buses usan el manejo y el tuning del bus (keyOf → 0)
    VN.push(nombre);
    VI.push("🚌");
    TUN.push({});
  });

  // más buses en el tráfico: Lumaca por todo lado y los internacionales en los países unidos
  const vehAntes = window.vehNuevo;
  window.vehNuevo = function (zz) {
    const r = Math.random();
    if (zz == 16) return vehAntes(zz);
    if (zz == 32 && r < 0.35) return busNuevo(B_LUMACA);
    if ((zz == 33 || zz == 34) && r < 0.18) return busNuevo(r < 0.1 ? B_INTER : B_LUMACA);
    if (r < 0.04) return busNuevo(B_LUMACA);
    return vehAntes(zz);
  };

  // fundir el escenario fijo por zona
  {
    const porZona = new Map();
    for (const ch of [...G.children]) {
      const k = Math.floor(-ch.position.z / 1000);
      if (!porZona.has(k)) porZona.set(k, new T.Group());
      porZona.get(k).add(ch);
    }
    for (const g of porZona.values()) G.add(fusionar(g));
    congelar(G, new Set());
  }
  chunks.forEach(scatter);

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0,
    rbZ = null,
    estHecha = 0,
    estT = 0;
  const sellos = new Set();
  const tickAntes = window.mundoTick;
  window.mundoTick = function (dt) {
    tickAntes(dt);
    reloj += dt;
    const play = state == "play";
    // la grúa torre gira despacio
    if (Math.abs(B.z - rb.position.z) < 900) pluma.rotation.y = Math.sin(reloj * 0.12) * 1.3;
    // estación remodelada de La Y Griega: parar el bus en la franja verde
    if (rbZ !== rb.position.z) {
      rbZ = rb.position.z;
      estHecha = 0;
    }
    const dz = B.z - rb.position.z;
    if (play && !MONT.on && PV.bus && !estHecha && Math.abs(dz) < 9 && B.x > 36.5 && B.x < 42 && Math.abs(B.v) < 1.5) {
      estT += dt;
      if (estT > 1.5) {
        estHecha = 1;
        cash += 2500;
        msg("🚏 Estación remodelada de La Y Griega: ¡suben pasajeros! +₡2500", 3000);
        hiss();
      }
    } else estT = 0;
    if (!MONT.on && play) {
      const u = -(B.z - CZ);
      // Terminal Lumaca: parar en el ANDÉN 1
      if (TERM.hecho != cyc && Math.abs(B.z - CZ - TERM.anden) < 18 && B.x > 13 && B.x < 20 && Math.abs(B.v) < 1.5) {
        TERM.t += dt;
        if (TERM.t > 2) {
          TERM.hecho = cyc;
          cash += 8000;
          msg(PV.bus ? "🚌 ¡Llegaste a la Terminal Lumaca! Bajan todos · +₡8000" : "🚌 Terminal Lumaca: +₡8000", 3200);
          hiss();
        }
      } else TERM.t = 0;
      // países unidos: pasaporte sellado al entrar a cada país
      if (u > 33000 && u < 35000) {
        let k = PAISES_UNIDOS.length - 1;
        while (k > 0 && -PAISES_UNIDOS[k].z > u) k--;
        const id = cyc + ":" + k;
        if (u > -PAISES_UNIDOS[k].z + 100 && !sellos.has(id)) {
          sellos.add(id);
          cash += 500;
          msg(`${PAISES_UNIDOS[k].e} ¡Bienvenido a ${PAISES_UNIDOS[k].n}! Pasaporte sellado +₡500`, 2800);
        }
      }
    }
  };
})();
