// =====================================================================
// MUNDO NUEVO
// Se carga después de las partes de js/juego/ y usa sus piezas (mm, pn, S, cv, W, rnd, chunks, cars, B…).
// Qué hay aquí (busca estos títulos con Ctrl+F):
//   LETREROS Y PIEZAS        · ayudas para hacer cajas, carteles y banderas
//   NEGOCIOS                 · KFC, McDonald's, Dunkin', Burger King, bomberos, hospital,
//                              oficinas de Intel, AMD, Microsoft y Windows, fábricas
//   LOTES POR TODO EL JUEGO  · dónde aparecen los negocios a la orilla de la carretera
//   VEHÍCULOS NUEVOS         · camión de bomberos, tráiler, buses nuevos y taxis de Nueva York
//   ZONA 19 · NUEVA YORK     · rascacielos, calles, tren elevado, terminal, bomberos, hospital, Libertad
//   ZONA 20 · PARQUE INDUSTRIAL · Intel, AMD, Microsoft, Windows, fábricas y tren de carga
//   ZONA 21 · FRONTERA       · Migración, aduana, banderas y presa de tráileres
//   ZONA 22 · AUTOPISTA NUEVA · presa en la principal y autopista alterna sin presa
//   ZONA 23 · NACIONES       · Rotonda de las Naciones y avenida de banderas
//   SAN JOSÉ · BOMBEROS Y HOSPITAL · estación y hospital del km 8
//   (las zonas 24 a 31 están en js/mundo2.js)
//   EMERGENCIAS              · ambulancia y camión de bomberos para manejar, incendio gigante del km 9,
//                              presa de 5 km, carril de emergencia, chorro de agua y heridos al hospital
// Gasolina infinita, presas nuevas y la cantidad de zonas (NZ) están en js/juego/ (NZ en 01-base.js, JAM en 03-paisaje.js).
// =====================================================================
(function () {
  ZN[9] = "Autopista Circunvalación × Ruta 27";
  // El incendio gigante (km 9,25). Lo usan el tráfico, la presa y el cuadro a cuadro.
  const INC = { z: -9250, largo: 28, fuego: 100, ciclo: 0, presa: [-4250, -9215], jugador: 0, apagadoT: 99 };
  window.INCENDIO = INC; // para revisar desde la consola del navegador
  ZN.push(
    "Nueva York",
    "Parque industrial · Intel · AMD · Microsoft",
    "Frontera · Migración",
    "Autopista nueva · alterna sin presa",
    "Rotonda de las Naciones",
  );

  // ===================== LETREROS Y PIEZAS =====================
  // Geometrías y materiales compartidos: se crean una sola vez y nunca se liberan.
  const _geo = new Map(),
    _mat = new Map();
  const compartir = (o) => (COMPARTIDO.add(o), o);
  const geoCaja = (w, h, d) => {
    const k = w + "," + h + "," + d;
    if (!_geo.has(k)) _geo.set(k, compartir(new T.BoxGeometry(w, h, d)));
    return _geo.get(k);
  };
  const mat = (c, o) => {
    const k = c + (o ? JSON.stringify(o) : "");
    if (!_mat.has(k))
      _mat.set(k, compartir(new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o))));
    return _mat.get(k);
  };
  const VIDRIO = { metalness: 0.6, roughness: 0.12 };
  const LUZ = (c) => ({ emissive: c, emissiveIntensity: 1.4 });
  // caja(g, ancho, alto, largo, color, x, y, z, opciones)
  const caja = (g, w, h, d, c, x, y, z, o) => {
    const m = new T.Mesh(geoCaja(w, h, d), mat(c, o));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const cilindro = (g, r, h, c, x, y, z, o) => {
    const m = new T.Mesh(compartir(new T.CylinderGeometry(r, r, h, 16)), mat(c, o));
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const piso = (g, w, d, c, x, z, y = 0.03, ry = 0) => {
    const m = pn(w, d, c, x, y, z, ry);
    m.material.dispose();
    m.material = mat(c, { roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    g.add(m);
    return m;
  };
  // Fachada con ventanas que se encienden de noche. Comparte un material por color
  // (las ventanas se ajustan al tamaño en la geometría, no en la textura).
  const _fachadas = {};
  const fachada = (w, h, d, c) => {
    if (!_fachadas[c]) {
      const t = wT.clone(),
        e = wE.clone();
      t.needsUpdate = e.needsUpdate = true;
      const mt = compartir(
        new T.MeshStandardMaterial({ map: t, color: c, roughness: 0.45, metalness: 0.25, emissive: 0xffffff, emissiveMap: e, emissiveIntensity: 0 }),
      );
      FAC.push(mt);
      _fachadas[c] = mt;
    }
    const geo = new T.BoxGeometry(w, h, d),
      uv = geo.attributes.uv,
      caras = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x −x +y −y +z −z
    for (let i = 0; i < uv.count; i++) {
      const [a, b] = caras[i >> 2];
      uv.setXY(i, (uv.getX(i) * a) / 8, (uv.getY(i) * b) / 8);
    }
    const m = new T.Mesh(geo, _fachadas[c]);
    m.castShadow = m.receiveShadow = true;
    return m;
  };
  // Junta todas las piezas que usan el mismo material en una sola malla: muchas menos llamadas de dibujo.
  // Los sprites (brillos), líneas y mallas instanciadas se quedan aparte.
  function fusionar(raiz) {
    raiz.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(raiz.matrixWorld).invert(),
      porMat = new Map(),
      sueltos = [];
    raiz.traverse((o) => {
      if (o === raiz) return;
      const rel = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && !o.material.vertexColors && o.geometry.attributes.normal) {
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        g.applyMatrix4(rel);
        if (!porMat.has(o.material)) porMat.set(o.material, []);
        porMat.get(o.material).push(g);
      } else if (o.isSprite || o.isLine || o.isInstancedMesh || o.isPoints || o.isMesh) sueltos.push([o, rel]); // lo que no se puede juntar queda aparte
    });
    const out = new T.Group();
    for (const [mt, gs] of porMat) {
      let n = 0;
      gs.forEach((g) => (n += g.attributes.position.count));
      const pos = new Float32Array(n * 3),
        nor = new Float32Array(n * 3),
        uv = new Float32Array(n * 2);
      let k = 0;
      gs.forEach((g) => {
        pos.set(g.attributes.position.array, k * 3);
        nor.set(g.attributes.normal.array, k * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, k * 2);
        k += g.attributes.position.count;
        g.dispose();
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new T.BufferAttribute(nor, 3));
      geo.setAttribute("uv", new T.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const m = new T.Mesh(geo, mt);
      m.castShadow = m.receiveShadow = true;
      out.add(m);
    }
    for (const [o, rel] of sueltos) {
      if (o.parent) o.parent.remove(o);
      rel.decompose(o.position, o.quaternion, o.scale);
      o.matrixAutoUpdate = true;
      out.add(o);
    }
    return out;
  }
  // Cartel con texto. Mira hacia +z.
  const _carteles = new Map();
  const texCartel = (t, ancho, alto, fondo, letra) => {
    const k = [t, ancho, alto, fondo, letra].join("|");
    if (!_carteles.has(k)) {
      const cw = 512,
        ch = Math.max(48, Math.round((cw * alto) / ancho)),
        fs = Math.min(ch * 0.72, (cw * 1.55) / Math.max(1, t.length));
      _carteles.set(k, compartir(S(t, cw, ch, fondo, letra, Math.round(fs))));
    }
    return _carteles.get(k);
  };
  const planoTex = (tex, ancho, alto, doble) => {
    const m = new T.Mesh(
      compartir(new T.PlaneGeometry(ancho, alto)),
      compartir(new T.MeshBasicMaterial({ map: tex, side: doble ? T.DoubleSide : T.FrontSide })),
    );
    return m;
  };
  const cartel = (g, t, ancho, alto, fondo, letra, x, y, z, ry = 0, doble) => {
    const m = planoTex(texCartel(t, ancho, alto, fondo, letra), ancho, alto, doble);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    g.add(m);
    return m;
  };
  // Cartel dibujado a mano (logos con cuadritos, etc.)
  const cartelDibujo = (g, ancho, alto, dibujo, x, y, z, ry = 0) => {
    const ch = Math.max(48, Math.round((512 * alto) / ancho)),
      m = planoTex(compartir(cv(512, ch, dibujo)), ancho, alto);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    g.add(m);
    return m;
  };
  const texto = (x, t, cx, cy, fs, color, fuente = "system-ui,Arial") => {
    x.fillStyle = color;
    x.font = "bold " + fs + "px " + fuente;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(t, cx, cy);
  };
  const cuatroCuadros = (x, cx, cy, l, colores) => {
    const s = l / 2 - l * 0.03;
    colores.forEach((c, i) => {
      x.fillStyle = c;
      x.fillRect(cx - l / 2 + (i % 2) * (l - s), cy - l / 2 + (i >> 1) * (l - s), s, s);
    });
  };

  // ----- banderas -----
  const franjas = (x, w, h, cols, vertical) =>
    cols.forEach((c, i) => {
      x.fillStyle = c;
      if (vertical) x.fillRect((i * w) / cols.length, 0, w / cols.length + 1, h);
      else x.fillRect(0, (i * h) / cols.length, w, h / cols.length + 1);
    });
  const estrella = (x, cx, cy, r, c) => {
    x.fillStyle = c;
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        rr = i % 2 ? r * 0.42 : r;
      x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.fill();
  };
  const circulo = (x, cx, cy, r, c) => {
    x.fillStyle = c;
    x.beginPath();
    x.arc(cx, cy, r, 0, 7);
    x.fill();
  };
  const BANDERAS = {
    "Costa Rica": (x, w, h) => franjas(x, w, h, ["#002b7f", "#fff", "#ce1126", "#ce1126", "#fff", "#002b7f"]),
    Nicaragua: (x, w, h) => franjas(x, w, h, ["#0067c6", "#fff", "#0067c6"]),
    Panamá: (x, w, h) => {
      franjas(x, w, h, ["#fff", "#fff"]);
      x.fillStyle = "#d21034";
      x.fillRect(w / 2, 0, w / 2, h / 2);
      x.fillStyle = "#072357";
      x.fillRect(0, h / 2, w / 2, h / 2);
      estrella(x, w / 4, h / 4, h / 8, "#072357");
      estrella(x, (3 * w) / 4, (3 * h) / 4, h / 8, "#d21034");
    },
    México: (x, w, h) => {
      franjas(x, w, h, ["#006847", "#fff", "#ce1126"], 1);
      circulo(x, w / 2, h / 2, h / 7, "#8c5a2b");
    },
    "Estados Unidos": (x, w, h) => {
      franjas(x, w, h, [...Array(13)].map((_, i) => (i % 2 ? "#fff" : "#b22234")));
      x.fillStyle = "#3c3b6e";
      x.fillRect(0, 0, w * 0.4, (h * 7) / 13);
      for (let i = 0; i < 5; i++)
        for (let j = 0; j < 6; j++) circulo(x, w * 0.035 + j * w * 0.066, h * 0.05 + i * h * 0.1, 2.2, "#fff");
    },
    Canadá: (x, w, h) => {
      franjas(x, w, h, ["#d52b1e", "#fff", "#fff", "#d52b1e"], 1);
      estrella(x, w / 2, h / 2, h / 4, "#d52b1e");
    },
    Colombia: (x, w, h) => franjas(x, w, h, ["#fcd116", "#fcd116", "#003893", "#ce1126"]),
    Argentina: (x, w, h) => {
      franjas(x, w, h, ["#74acdf", "#fff", "#74acdf"]);
      circulo(x, w / 2, h / 2, h / 9, "#f6b40e");
    },
    Brasil: (x, w, h) => {
      franjas(x, w, h, ["#009c3b"]);
      x.fillStyle = "#ffdf00";
      x.beginPath();
      x.moveTo(w * 0.08, h / 2);
      x.lineTo(w / 2, h * 0.1);
      x.lineTo(w * 0.92, h / 2);
      x.lineTo(w / 2, h * 0.9);
      x.fill();
      circulo(x, w / 2, h / 2, h * 0.22, "#002776");
    },
    Chile: (x, w, h) => {
      franjas(x, w, h, ["#fff", "#d52b1e"]);
      x.fillStyle = "#0039a6";
      x.fillRect(0, 0, h / 2, h / 2);
      estrella(x, h / 4, h / 4, h / 9, "#fff");
    },
    España: (x, w, h) => franjas(x, w, h, ["#aa151b", "#f1bf00", "#f1bf00", "#aa151b"]),
    Francia: (x, w, h) => franjas(x, w, h, ["#0055a4", "#fff", "#ef4135"], 1),
    Italia: (x, w, h) => franjas(x, w, h, ["#009246", "#fff", "#ce2b37"], 1),
    Alemania: (x, w, h) => franjas(x, w, h, ["#000", "#dd0000", "#ffce00"]),
    Japón: (x, w, h) => {
      franjas(x, w, h, ["#fff"]);
      circulo(x, w / 2, h / 2, h * 0.3, "#bc002d");
    },
    China: (x, w, h) => {
      franjas(x, w, h, ["#de2910"]);
      estrella(x, w * 0.17, h * 0.27, h * 0.15, "#ffde00");
    },
    Perú: (x, w, h) => franjas(x, w, h, ["#d91023", "#fff", "#d91023"], 1),
    Guatemala: (x, w, h) => franjas(x, w, h, ["#4997d0", "#fff", "#4997d0"], 1),
    Honduras: (x, w, h) => franjas(x, w, h, ["#00bce4", "#fff", "#00bce4"]),
    "El Salvador": (x, w, h) => franjas(x, w, h, ["#0f47af", "#fff", "#0f47af"]),
    Venezuela: (x, w, h) => franjas(x, w, h, ["#ffcc00", "#00247d", "#cf142b"]),
    Ucrania: (x, w, h) => franjas(x, w, h, ["#0057b7", "#ffd700"]),
    India: (x, w, h) => {
      franjas(x, w, h, ["#ff9933", "#fff", "#138808"]);
      circulo(x, w / 2, h / 2, h / 9, "#000080");
    },
  };
  const PAISES = Object.keys(BANDERAS);
  const _texBandera = {};
  // bandera(g, país, x, z, altoDelAsta)
  const bandera = (g, pais, x, z, alto = 9) => {
    if (!_texBandera[pais]) _texBandera[pais] = compartir(cv(192, 128, BANDERAS[pais]));
    caja(g, 0.18, alto, 0.18, 0xe8e8e8, x, alto / 2, z, { metalness: 0.6, roughness: 0.3 });
    const p = planoTex(_texBandera[pais], 3, 2, true);
    p.position.set(x + 1.6, alto - 1.1, z);
    g.add(p);
  };

  // ===================== NEGOCIOS =====================
  // Cada negocio mira hacia +z (hacia la carretera) y su frente queda a z = +fondo/2.
  const techoRayado = compartir(
    cv(64, 64, (x, w, h) => {
      for (let i = 0; i < 8; i++) {
        x.fillStyle = i % 2 ? "#fff" : "#c8102e";
        x.fillRect((i * w) / 8, 0, w / 8 + 1, h);
      }
    }),
  );
  function restaurante(nombre, pared, techo, fondo, letra, extra) {
    const g = new T.Group();
    caja(g, 12, 4.5, 10, pared, 0, 2.25, 0);
    if (techo == "rayas") {
      const t = new T.Mesh(geoCaja(12.6, 1.2, 10.6), compartir(new T.MeshStandardMaterial({ map: techoRayado })));
      t.position.y = 5.1;
      g.add(t);
    } else caja(g, 12.6, 1.2, 10.6, techo, 0, 5.1, 0);
    caja(g, 10, 2, 0.12, 0x9cc8e8, 0, 1.6, 5.02, VIDRIO);
    caja(g, 1.6, 2.4, 0.14, 0x333333, -4.2, 1.2, 5.04);
    cartel(g, nombre, 9, 1.1, fondo, letra, 0, 5.1, 5.32);
    // poste con el letrero alto (se ve de lejos)
    caja(g, 0.4, 9, 0.4, 0x777777, 5.5, 4.5, 7.5);
    cartel(g, nombre, 4.2, 2.2, fondo, letra, 5.5, 9.6, 7.5, 0, true);
    piso(g, 14, 5, 0x3b3e44, 0, 7.5);
    if (extra) extra(g);
    return g;
  }
  function estacionBomberos() {
    const g = new T.Group(),
      ladrillo = 0xa23b2a;
    caja(g, 16, 7, 12, ladrillo, 0, 3.5, 0);
    caja(g, 16.4, 0.6, 12.4, 0xe9e2d5, 0, 7.2, 0);
    caja(g, 3.2, 14, 3.2, ladrillo, -9.6, 7, -3);
    caja(g, 3.6, 0.6, 3.6, 0xe9e2d5, -9.6, 14.2, -3);
    [-3.6, 3.6].forEach((x) => {
      caja(g, 5, 5, 0.12, 0xf2f2f2, x, 2.5, 6.02);
      caja(g, 4.4, 4.6, 0.14, 0x8f1414, x, 2.3, 6.04);
    });
    cartel(g, "ESTACIÓN DE BOMBEROS", 11, 1.2, "#b71c1c", "#fff", 0, 6.1, 6.1);
    caja(g, 0.8, 0.5, 0.8, 0xff2020, 0, 7.8, 4, LUZ(0xff2020));
    piso(g, 16, 6, 0x6f7276, 0, 9);
    const camion = camionBomberos();
    camion.rotation.y = Math.PI / 2;
    camion.position.set(0, 0, 9.4);
    g.add(camion);
    return g;
  }
  function hospital() {
    const g = new T.Group(),
      f = fachada(18, 14, 12, 0xeef2f5);
    f.position.y = 7;
    g.add(f);
    caja(g, 18.4, 0.6, 12.4, 0xd7dde2, 0, 14.3, 0);
    caja(g, 1.1, 4, 0.3, 0xe02020, 0, 11, 6.2, LUZ(0xff2020));
    caja(g, 4, 1.1, 0.3, 0xe02020, 0, 11, 6.2, LUZ(0xff2020));
    cartel(g, "HOSPITAL", 9, 1.6, "#ffffff", "#c62828", 0, 8, 6.05);
    caja(g, 8, 0.4, 4, 0xd0d4d8, 0, 3.6, 8);
    [-3.6, 3.6].forEach((x) => caja(g, 0.3, 3.6, 0.3, 0x999999, x, 1.8, 9.8));
    cartel(g, "EMERGENCIAS", 7, 0.8, "#c62828", "#fff", 0, 4.25, 10.02);
    // helipuerto en el techo
    cilindro(g, 4, 0.2, 0x3a7d44, 0, 14.75, 0);
    cartel(g, "H", 3, 3, "#3a7d44", "#ffffff", 0, 14.9, 0).rotation.x = -Math.PI / 2;
    const amb = mkAmbulancia();
    amb.rotation.y = Math.PI / 2;
    amb.position.set(-5.5, 0, 9);
    g.add(amb);
    piso(g, 18, 6, 0x6f7276, 0, 9);
    return g;
  }
  // oficinas: torre de vidrio con el letrero de la marca arriba y un monolito con el nombre
  function oficina(alto, color, letrero, monolito) {
    const g = new T.Group(),
      f = fachada(16, alto, 12, color);
    f.position.y = alto / 2;
    g.add(f);
    caja(g, 16.4, 0.8, 12.4, 0x2b2f33, 0, alto + 0.4, 0);
    letrero(g, 0, alto - 2.6, 6.08);
    caja(g, 5, 2.6, 0.6, 0x22262a, 0, 1.3, 8);
    monolito(g);
    piso(g, 16, 6, 0x6f7276, 0, 9);
    return g;
  }
  const logoMicrosoft = (x, w, h) => {
    x.fillStyle = "#fff";
    x.fillRect(0, 0, w, h);
    cuatroCuadros(x, h * 0.62, h / 2, h * 0.62, ["#f25022", "#7fba00", "#00a4ef", "#ffb900"]);
    texto(x, "Microsoft", w * 0.58, h / 2, h * 0.5, "#5e5e5e");
  };
  const logoWindows = (x, w, h) => {
    x.fillStyle = "#0078d4";
    x.fillRect(0, 0, w, h);
    cuatroCuadros(x, h * 0.62, h / 2, h * 0.6, ["#fff", "#fff", "#fff", "#fff"]);
    texto(x, "Windows", w * 0.58, h / 2, h * 0.52, "#fff");
  };
  const NEGOCIOS = {
    kfc: () => restaurante("KFC", 0xf4f1ea, "rayas", "#c8102e", "#ffffff"),
    mcdonalds: () => restaurante("McDonald's", 0xc8102e, 0xffc72c, "#c8102e", "#ffc72c"),
    dunkin: () =>
      restaurante("DUNKIN'", 0xf6efe6, 0xff671f, "#ffffff", "#da1884", (g) =>
        caja(g, 12.2, 0.5, 10.2, 0xda1884, 0, 4.2, 0),
      ),
    burgerking: () => restaurante("BURGER KING", 0xf5ebdc, 0xd62300, "#ff8732", "#502314"),
    pizzahut: () => restaurante("PIZZA HUT", 0xf2e8dc, 0xc8102e, "#c8102e", "#ffffff"),
    subway: () => restaurante("SUBWAY", 0x0f6b38, 0xfdc20f, "#0f6b38", "#fdc20f"),
    starbucks: () => restaurante("STARBUCKS", 0xece4d6, 0x00704a, "#00704a", "#ffffff"),
    tacobell: () => restaurante("TACO BELL", 0xf4e9f7, 0x702082, "#702082", "#ffffff"),
    wendys: () => restaurante("WENDY'S", 0xf7f2ea, 0xe2203d, "#ffffff", "#e2203d"),
    campero: () => restaurante("POLLO CAMPERO", 0xfff4d6, 0xf5a800, "#e4002b", "#ffffff"),
    popeyes: () => restaurante("POPEYES", 0xfff1e0, 0xf47b20, "#f47b20", "#ffffff"),
    dominos: () => restaurante("DOMINO'S", 0xf2f2f2, 0x006491, "#006491", "#ffffff"),
    bomberos: estacionBomberos,
    hospital,
    intel: () =>
      oficina(
        22,
        0x5a95d6,
        (g, x, y, z) => cartel(g, "intel", 10, 2.6, "#0068b5", "#ffffff", x, y, z),
        (g) => cartel(g, "intel", 4.6, 1.6, "#0068b5", "#ffffff", 0, 1.6, 8.32),
      ),
    amd: () =>
      oficina(
        18,
        0x3a3a3c,
        (g, x, y, z) => cartel(g, "AMD", 9, 2.6, "#000000", "#ffffff", x, y, z),
        (g) => cartel(g, "AMD", 4.6, 1.6, "#000000", "#ffffff", 0, 1.6, 8.32),
      ),
    microsoft: () =>
      oficina(
        20,
        0xc9d6e0,
        (g, x, y, z) => cartelDibujo(g, 12, 2.6, logoMicrosoft, x, y, z),
        (g) => cartelDibujo(g, 4.6, 1.2, logoMicrosoft, 0, 1.6, 8.32),
      ),
    windows: () =>
      oficina(
        26,
        0x2a80d0,
        (g, x, y, z) => cartelDibujo(g, 12, 2.6, logoWindows, x, y, z),
        (g) => cartelDibujo(g, 4.6, 1.2, logoWindows, 0, 1.6, 8.32),
      ),
    fabrica: () => {
      const g = new T.Group();
      caja(g, 20, 8, 12, 0xa9adb1, 0, 4, 0);
      for (let i = 0; i < 4; i++) {
        const t = caja(g, 5.2, 0.4, 7, 0x8a9096, -7.5 + i * 5, 8.9, -1);
        t.rotation.x = 0.35;
      }
      [-5, 5].forEach((x) => caja(g, 4, 4.5, 0.14, 0x6b7075, x, 2.25, 6.02));
      cilindro(g, 0.9, 20, 0xb8b8b8, 8, 10, -3.5);
      [14, 18].forEach((y) => cilindro(g, 0.95, 1.2, 0xd62828, 8, y, -3.5));
      [0.8, 1.3, 1.9].forEach((r, i) => {
        const h = new T.Mesh(
          compartir(new T.SphereGeometry(r, 10, 8)),
          mat(0xd8d8d8, { transparent: true, opacity: 0.55, depthWrite: false }),
        );
        h.position.set(8 + i * 0.8, 20.8 + i * 1.6, -3.5);
        g.add(h);
      });
      cartel(g, "FÁBRICA", 8, 1.2, "#37474f", "#ffffff", 0, 6.8, 6.05);
      piso(g, 20, 6, 0x6f7276, 0, 9);
      return g;
    },
  };
  const _plantillas = {};
  const plantilla = (k) => _plantillas[k] || (_plantillas[k] = fusionar(NEGOCIOS[k]()));
  const copia = (k) => plantilla(k).clone();

  // ===================== LOTES POR TODO EL JUEGO =====================
  // En las zonas con ciudad, cada pedazo de carretera (120 m) tiene 2 lotes a la orilla.
  // Para cambiar dónde aparecen: ZONAS_LOTE. Para cambiar qué aparece: elegirNegocio.
  const ZONAS_LOTE = { 0: 0.85, 1: 0.4, 4: 0.85, 7: 0.85, 8: 0.6, 9: 0.85, 11: 0.85, 13: 0.85, 14: 0.7, 15: 0.85, 20: 0.95, 21: 0.85, 23: 0.9 };
  const COMIDA = ["kfc", "mcdonalds", "dunkin", "burgerking", "pizzahut", "subway", "starbucks", "tacobell", "wendys", "campero", "popeyes", "dominos"],
    TECNO = ["intel", "amd", "microsoft", "windows"];
  function elegirNegocio(zn) {
    // Walmart y Carl's Jr (js/mundo3.js) salen por todo el juego
    const r0 = Math.random();
    if (r0 < 0.1 && NEGOCIOS.walmart) return "walmart";
    if (r0 < 0.22 && NEGOCIOS.carlsjr) return "carlsjr";
    // oficinas del ICE y tiendas kölbi (js/mundo3.js), también por todo el juego
    if (r0 < 0.3 && NEGOCIOS.ice) return "ice";
    if (r0 < 0.38 && NEGOCIOS.kolbi) return "kolbi";
    const r = Math.random();
    if (zn == 20) return r < 0.72 ? pk_(TECNO) : r < 0.86 ? "fabrica" : pk_(COMIDA);
    if (r < 0.55) return pk_(COMIDA);
    if (r < 0.63) return "bomberos";
    if (r < 0.71) return "hospital";
    if (r < 0.93) return pk_(TECNO);
    return "fabrica";
  }
  // tramos (dentro del ciclo) donde ya hay algo fijo: no poner lotes ahí
  const LIBRE_DER = [
      [-7700, -7800],
      [-8380, -8520],
      [-9430, -9570],
      [-13320, -13480],
      [-14480, -14620],
      [-21180, -21320],
      [-21870, -21930],
    ],
    LIBRE_IZQ = [
      [-7700, -7800],
      [-14380, -14520],
      [-21180, -21320],
      [-21380, -21440],
    ];
  const enTramo = (lista, z) => lista.some((r) => z < r[0] && z > r[1]);
  function ponerLote(c, p, zn, h) {
    const o = p.o,
      prob = ZONAS_LOTE[zn];
    o.visible = false;
    if (!prob || Math.random() > prob) return;
    const s = h.s;
    if (zn == 8 && s > 0) return; // la salida a Vara Blanca va por la derecha
    let x = s * R(21, 27);
    if (s < 0 && LZ.includes(zn)) x = -R(45, 50); // la calle lateral izquierda pasa por x = -30
    o.position.set(x, 0, -R(12, CH - 12));
    o.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    const zc = -c.k * CH + o.position.z - CZ;
    if (h.w() || h.nb() || h.hz() || h.rt() || enTramo(s > 0 ? LIBRE_DER : LIBRE_IZQ, zc)) return;
    // no encimarse con el otro lote del mismo pedazo
    for (const q of c.pr)
      if (q !== p && q.t == 20 && q.o.visible && Math.sign(q.o.position.x) == s && Math.abs(q.o.position.z - o.position.z) < 24)
        return;
    const k = elegirNegocio(zn);
    if (!p.cache[k]) {
      p.cache[k] = copia(k);
      o.add(p.cache[k]);
    }
    for (const n in p.cache) p.cache[n].visible = n == k;
    o.visible = true;
    // quitar árboles, casas, postes y vallas que queden encima del negocio
    for (const q of c.pr)
      if (q !== p && [0, 1, 3, 8, 9].includes(q.t) && q.o.visible)
        if (Math.abs(q.o.position.x - x) < 13 && Math.abs(q.o.position.z - o.position.z) < 14) q.o.visible = false;
  }
  chunks.forEach((c) => {
    for (let j = 0; j < 2; j++) {
      const o = new T.Group();
      c.g.add(o);
      c.pr.push({ o, t: 20, f: ponerLote, cache: {} });
    }
  });

  // ===================== VEHÍCULOS NUEVOS =====================
  // El frente de los vehículos del tráfico apunta a -z. hl = mitad del largo.
  const lucesEmergencia = (g, colores, y, z, sep = 0.7) =>
    colores.map((c, i) => {
      const m = new T.Mesh(geoCaja(0.45, 0.22, 0.4), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 })),
        sm = new T.SpriteMaterial({ map: gTex, color: c, blending: T.AdditiveBlending, depthWrite: false, transparent: true }),
        sp = new T.Sprite(sm);
      m.position.set((i - (colores.length - 1) / 2) * sep, y, z);
      sp.scale.setScalar(2.6);
      m.add(sp);
      g.add(m);
      return { mat: m.material, sm };
    });
  const faros = (g, x, y, z) =>
    [-1, 1].forEach((q) => {
      const h = new T.Mesh(CG.hl, hlM),
        sp = new T.Sprite(glowM);
      sp.scale.setScalar(1.3);
      h.add(sp);
      h.position.set(q * x, y, z);
      g.add(h);
    });
  // Cada modelo se arma una sola vez, se funde y después solo se copia (comparte geometría y materiales).
  const _modelos = new Map();
  const deModelo = (k, crear) => {
    if (!_modelos.has(k)) {
      const g0 = crear(),
        ud = g0.userData;
      g0.userData = {};
      const f = fusionar(g0);
      f.traverse((o) => {
        if (o.geometry) COMPARTIDO.add(o.geometry);
        if (o.material) COMPARTIDO.add(o.material);
      });
      (ud.amb || []).forEach((l) => (COMPARTIDO.add(l.mat), COMPARTIDO.add(l.sm)));
      _modelos.set(k, { f, ud });
    }
    const m = _modelos.get(k),
      o = m.f.clone();
    o.userData.hl = m.ud.hl;
    if (m.ud.amb) o.userData.amb = m.ud.amb; // todas las luces del mismo modelo parpadean juntas
    if (m.ud.bomb) o.userData.bomb = 1;
    return o;
  };
  const camionBomberos = () => deModelo("bomberos", crearCamionBomberos);
  // Los carros de siempre también: uno fundido por color (antes eran ~20 piezas por carro).
  const mkCarOriginal = mkCar;
  mkCar = function () {
    const nuevo = mkCarOriginal(),
      k = "carro" + nuevo.children[0].material.color.getHex();
    return deModelo(k, () => nuevo);
  };
  function crearCamionBomberos() {
    const g = new T.Group(),
      rojo = 0xc4161c;
    caja(g, 2.5, 2.6, 3, rojo, 0, 1.75, -3.6);
    caja(g, 2.52, 0.9, 0.1, 0x9fc4e8, 0, 2.45, -5.12, VIDRIO);
    caja(g, 2.5, 2.4, 6.4, rojo, 0, 1.7, 1.1);
    caja(g, 2.3, 0.5, 10, 0x222222, 0, 0.6, -0.6);
    caja(g, 2.54, 0.25, 9.6, 0xffffff, 0, 1.15, -0.6);
    caja(g, 2.54, 0.12, 6.2, 0xffe066, 0, 2.5, 1.1, LUZ(0x665500));
    // escalera
    [-0.5, 0.5].forEach((x) => caja(g, 0.12, 0.12, 8.6, 0xd8d8d8, x, 3.1, 0.6, { metalness: 0.8, roughness: 0.3 }));
    for (let i = 0; i < 9; i++) caja(g, 1, 0.08, 0.08, 0xd8d8d8, 0, 3.1, -3.3 + i * 0.98);
    [-1, 1].forEach((q) => cartel(g, "BOMBEROS", 4.6, 0.7, "#c4161c", "#ffffff", q * 1.27, 1.65, 1.1, (q * Math.PI) / 2));
    faros(g, 0.85, 1, -5.12);
    wr(g, [[-1.1, -3.6], [1.1, -3.6], [-1.1, 2.4], [1.1, 2.4], [-1.1, 3.6], [1.1, 3.6]], 0.55);
    g.userData.amb = lucesEmergencia(g, [0xff2020, 0xffffff, 0xff2020], 3.15, -4.6);
    g.userData.hl = 5.3;
    g.userData.bomb = 1;
    return sh(g);
  }
  const CARGAS = [
    ["TRANSPORTES TICOS", "#1b4fa8"],
    ["CARGA PESADA", "#c62828"],
    ["MUDANZAS DEL VALLE", "#2e7d32"],
    ["FRUTAS DE LA ZONA NORTE", "#ef6c00"],
    ["", "#9e9e9e"],
    ["", "#e0e0e0"],
  ];
  const traila = () => {
    const c = pk_([0xd62828, 0x1b4fa8, 0xf2f2f2, 0x2e7d32, 0xf2b400, 0x333333]),
      carga = pk_(CARGAS);
    return deModelo("traila" + c + carga[0] + carga[1], () => crearTraila(c, carga));
  };
  function crearTraila(c, [txt, fondo]) {
    const g = new T.Group();
    caja(g, 2.5, 2.9, 2.8, c, 0, 2.05, -7.9);
    caja(g, 2.4, 1.3, 1.6, c, 0, 1.25, -9.9);
    caja(g, 2.52, 1, 0.1, 0x9fc4e8, 0, 2.7, -9.32, VIDRIO);
    caja(g, 2.2, 0.5, 19.4, 0x222222, 0, 0.75, -0.5);
    caja(g, 2.6, 3.1, 13.6, new T.Color(fondo).getHex(), 0, 2.75, 2);
    if (txt) [-1, 1].forEach((q) => cartel(g, txt, 10, 1.2, fondo, "#ffffff", q * 1.31, 2.9, 2, (q * Math.PI) / 2));
    [-1, 1].forEach((q) => caja(g, 0.14, 3.2, 0.14, 0xb8b8b8, q * 1.3, 2.6, -8.9));
    faros(g, 0.85, 1, -10.71);
    wr(g, [[-1.1, -9.4], [1.1, -9.4], [-1.1, -7], [1.1, -7], [-1.1, 6.6], [1.1, 6.6], [-1.1, 8], [1.1, 8]], 0.55);
    g.userData.hl = 10;
    return sh(g);
  }
  // buses: (color de la carrocería, color de abajo, letrero de ruta)
  const BUSES = [
    [0xf2b400, 0x222222, "ESCOLAR"],
    [0xf4f6f8, 0x1b4fa8, "NUEVA YORK"],
    [0x2e7d32, 0xf2f2f2, "SAN JOSÉ - CARTAGO"],
    [0xd62828, 0xf2f2f2, "DESAMPARADOS"],
    [0x1565c0, 0xffffff, "HEREDIA"],
    [0xff7043, 0x37474f, "ALAJUELA"],
  ];
  const busNuevo = (i, articulado) => {
    if (i == null) i = (Math.random() * BUSES.length) | 0;
    return deModelo("bus" + i + !!articulado, () => crearBus(i, articulado));
  };
  function crearBus(i, articulado) {
    const g = new T.Group(),
      [c, c2, ruta] = BUSES[i],
      tramos = articulado ? [[-4.6, 9.4], [5.2, 9.4]] : [[0, 11.5]];
    tramos.forEach(([z, L]) => {
      caja(g, 2.6, 2.9, L, c, 0, 1.85, z);
      caja(g, 2.62, 0.55, L + 0.02, c2, 0, 0.75, z);
      caja(g, 2.64, 1, L - 1.2, 0x223344, 0, 2.35, z, VIDRIO);
    });
    if (articulado) caja(g, 2.4, 2.6, 0.9, 0x333333, 0, 1.75, 0.35);
    const fz = tramos[0][0] - tramos[0][1] / 2;
    caja(g, 2.5, 1.2, 0.1, 0x9fc4e8, 0, 2.4, fz - 0.02, VIDRIO);
    cartel(g, ruta, 2.2, 0.35, "#111111", "#ffb300", 0, 3.05, fz - 0.06, Math.PI);
    faros(g, 0.9, 0.95, fz - 0.03);
    const ruedas = [];
    tramos.forEach(([z, L]) => [-1, 1].forEach((q) => [z - L / 2 + 2, z + L / 2 - 2].forEach((w) => ruedas.push([q * 1.15, w]))));
    wr(g, ruedas, 0.55);
    g.userData.hl = articulado ? 9.9 : 5.8;
    return sh(g);
  }
  function taxi() {
    const o = mkCar(),
      am = pintura(new T.Color(0xf6c40e));
    o.traverse((m) => {
      if (m.material && m.material.userData && m.material.userData.pintura) m.material = am;
    });
    caja(o, 0.9, 0.35, 0.4, 0xffffff, 0, 2.05, 0.3, LUZ(0x886600));
    o.userData.hl = 2.2;
    return o;
  }
  // Qué sale en el tráfico de cada zona. null = los carros de siempre.
  window.vehNuevo = function (zz) {
    const r = Math.random();
    // en la presa del incendio salen muchos bomberos y ambulancias que van para allá
    if (INC.fuego > 0 && zz >= 4 && zz <= 9) {
      if (r < 0.09) return camionBomberos();
      if (r < 0.14) return mkAmbulancia();
    }
    if (zz == 19) {
      if (r < 0.35) return taxi();
      if (r < 0.47) return busNuevo(r < 0.41 ? 1 : 0, r < 0.44);
      if (r < 0.51) return camionBomberos();
      return null;
    }
    if (zz == 20 || zz == 21) {
      if (r < 0.42) return traila();
      if (r < 0.46) return camionBomberos();
      return null;
    }
    if (zz == 16) return null; // pista de agua: lanchas
    if (r < 0.035) return camionBomberos();
    if (r < 0.11) return traila();
    if (r < 0.21) return busNuevo(null, r < 0.13);
    return null;
  };

  // ===================== escenario fijo de las zonas nuevas =====================
  const zonaG = new T.Group(); // todo lo fijo (se congela al final)
  W(zonaG);
  const Z = (g, x, z, ry = 0) => {
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    zonaG.add(g);
    return g;
  };
  const DER = -Math.PI / 2, // gira un negocio para que mire a la carretera desde la derecha
    IZQ = Math.PI / 2;
  const portico = (z, t, fondo = "#0a6e3a", letra = "#ffffff") => {
    const g = new T.Group();
    [-9, 9].forEach((x) => caja(g, 0.6, 7.4, 0.6, 0x8a8f94, x, 3.7, 0));
    caja(g, 18.6, 0.7, 0.7, 0x8a8f94, 0, 7.4, 0);
    cartel(g, t, 15, 2.2, fondo, letra, 0, 8.9, 0.4);
    cartel(g, t, 15, 2.2, fondo, letra, 0, 8.9, -0.4, Math.PI);
    return Z(g, 0, z);
  };
  const rascacielos = (x, z, w, h, d, c) => {
    const f = fachada(w, h, d, c);
    f.position.set(x, h / 2, z);
    zonaG.add(f);
    caja(zonaG, w + 0.4, 0.8, d + 0.4, 0x2b2f33, x, h + 0.4, z);
    return f;
  };
  const COLORES_EDIFICIO = [0xc8d0d8, 0xb8c4d0, 0xd9d2c8, 0x9fb0c4, 0xc5ccd4, 0xd8c0a8, 0xa8b8a8, 0x8f9db0];

  // ===================== ZONA 19 · NUEVA YORK =====================
  // Cuadras de 100 m: calles transversales en z = -19050, -19150… y rascacielos a los lados.
  piso(zonaG, 190, 1000, 0x8f9296, 105, -19500, 0.015);
  piso(zonaG, 190, 1000, 0x8f9296, -105, -19500, 0.015);
  for (let k = 0; k < 10; k++) {
    const z = -19050 - k * 100;
    piso(zonaG, 190, 12, 0x34373c, 105, z, 0.025);
    piso(zonaG, 190, 12, 0x34373c, -105, z, 0.025);
    for (let i = 0; i < 6; i++) piso(zonaG, 0.8, 5, 0xf2f2f2, 10.5 + i * 1.6, z, 0.03);
  }
  portico(-19020, "BIENVENIDOS A NUEVA YORK", "#1b2a4a", "#ffd23f");
  const TIENDAS_NY = ["mcdonalds", "dunkin", "kfc", "burgerking", "microsoft", "intel", "dunkin", "mcdonalds", "amd", "windows", "kfc", "burgerking"];
  for (let k = 0; k < 9; k++) {
    const zb = -19100 - k * 100;
    // derecha
    if (k == 2) Z(estacionBomberos(), 26, zb, DER);
    else if (k == 6) Z(hospital(), 28, zb, DER);
    else if (k != 4) {
      Z(copia(TIENDAS_NY[k]), 24, zb + 20, DER);
      Z(copia(TIENDAS_NY[k + 3]), 24, zb - 20, DER);
    }
    if (k != 4) {
      rascacielos(52, zb + 21, 20, R(30, 80), 36, pk_(COLORES_EDIFICIO));
      rascacielos(52, zb - 21, 20, R(30, 80), 36, pk_(COLORES_EDIFICIO));
    }
    if (k != 8) {
      rascacielos(85, zb + 21, 22, R(60, 130), 36, pk_(COLORES_EDIFICIO));
      rascacielos(85, zb - 21, 22, R(60, 130), 36, pk_(COLORES_EDIFICIO));
    }
    rascacielos(128, zb, 30, R(90, 180), 80, pk_(COLORES_EDIFICIO));
    // izquierda (el tren elevado pasa por x = -24)
    if (k != 0) {
      Z(copia(TIENDAS_NY[(k + 5) % 12]), -38, zb + 20, IZQ);
      Z(copia(TIENDAS_NY[(k + 7) % 12]), -38, zb - 20, IZQ);
      rascacielos(-64, zb + 21, 20, R(30, 90), 36, pk_(COLORES_EDIFICIO));
      rascacielos(-64, zb - 21, 20, R(30, 90), 36, pk_(COLORES_EDIFICIO));
    }
    rascacielos(-96, zb + 21, 22, R(60, 140), 36, pk_(COLORES_EDIFICIO));
    rascacielos(-96, zb - 21, 22, R(60, 140), 36, pk_(COLORES_EDIFICIO));
    rascacielos(-138, zb, 30, R(90, 180), 80, pk_(COLORES_EDIFICIO));
  }
  // pantallas gigantes (como en Times Square) en la cuadra 3
  {
    const zb = -19400,
      pantallas = [
        ["McDonald's", "#c8102e", "#ffc72c"],
        ["KFC", "#c8102e", "#fff"],
        ["DUNKIN'", "#ff671f", "#fff"],
        ["BURGER KING", "#502314", "#ff8732"],
        ["intel", "#0068b5", "#fff"],
        ["AMD", "#000", "#fff"],
        ["Windows", "#0078d4", "#fff"],
        ["NUEVA YORK", "#111", "#ffd23f"],
      ];
    pantallas.forEach(([t, f, l], i) => {
      const lado = i % 2 ? -1 : 1,
        x = lado > 0 ? 41.8 : -53.8,
        z = zb + 28 - (i >> 1) * 18;
      const m = cartel(zonaG, t, 14, 7, f, l, x, 18 + (i % 3) * 9, z, lado > 0 ? DER : IZQ);
      m.material = compartir(new T.MeshBasicMaterial({ map: m.material.map, toneMapped: false }));
    });
  }
  // torre muy alta con aguja (como el Empire State)
  {
    const g = new T.Group(),
      c = 0xc9c2b2,
      pisos = [
        [34, 150],
        [26, 40],
        [18, 30],
        [10, 20],
      ];
    let y = 0;
    pisos.forEach(([w, h]) => {
      const f = fachada(w, h, w, c);
      f.position.y = y + h / 2;
      g.add(f);
      y += h;
    });
    cilindro(g, 1.2, 14, 0xd8d8d8, 0, y + 7, 0, { metalness: 0.8, roughness: 0.2 });
    cilindro(g, 0.25, 22, 0xd8d8d8, 0, y + 25, 0, { metalness: 0.8, roughness: 0.2 });
    caja(g, 0.8, 0.8, 0.8, 0xff3030, 0, y + 36, 0, LUZ(0xff2020));
    Z(g, 92, -19900);
  }
  // Estatua de la Libertad en un parque (cuadra 0, izquierda)
  {
    piso(zonaG, 70, 80, 0x4f8a3a, -55, -19100, 0.03);
    const g = new T.Group(),
      verde = 0x6fb3a0,
      piedra = 0xb9a98e;
    caja(g, 16, 3, 16, piedra, 0, 1.5, 0);
    caja(g, 9, 12, 9, piedra, 0, 9, 0);
    caja(g, 10, 1, 10, 0xa89880, 0, 15.5, 0);
    const tunica = new T.Mesh(compartir(new T.CylinderGeometry(1.7, 3, 14, 12)), mat(verde));
    tunica.position.y = 23;
    g.add(tunica);
    const cabeza = new T.Mesh(compartir(new T.SphereGeometry(1.4, 12, 10)), mat(verde));
    cabeza.position.y = 31.2;
    g.add(cabeza);
    for (let i = 0; i < 7; i++) {
      const a = -1.3 + (i * 2.6) / 6,
        p = new T.Mesh(compartir(new T.ConeGeometry(0.22, 1.6, 6)), mat(verde));
      p.position.set(Math.sin(a) * 1.3, 32.4, Math.cos(a) * 1.3);
      p.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9);
      g.add(p);
    }
    const brazo = cilindro(g, 0.5, 8, verde, 1.6, 33, 0);
    brazo.rotation.z = -0.2;
    cilindro(g, 0.5, 1.6, 0xc9a227, 2.4, 37.6, 0, { metalness: 0.7, roughness: 0.3 });
    const llama = new T.Mesh(compartir(new T.ConeGeometry(0.75, 1.9, 10)), mat(0xffb020, LUZ(0xff9000)));
    llama.position.set(2.4, 39.3, 0);
    g.add(llama);
    caja(g, 1.2, 2.6, 0.5, verde, -1.9, 25.5, 0.8);
    cartel(g, "LIBERTAD", 7, 1, "#5c6b55", "#f2efe2", 0, 9, 4.55);
    g.scale.setScalar(1.5);
    Z(g, -62, -19100, IZQ);
  }
  // terminal de buses de Nueva York (derecha, cuadra 4: la parada de -19500 queda enfrente)
  {
    const g = new T.Group();
    piso(g, 46, 80, 0x3b3e44, 34, 0);
    caja(g, 34, 0.5, 30, 0xd0d3d5, 30, 6.5, -2);
    caja(g, 12, 16, 60, 0xb8c0c8, 54, 8, -2);
    for (const z of [-14, 0, 14]) for (const x of [16, 44]) caja(g, 0.6, 6.5, 0.6, 0x888888, x, 3.25, z);
    for (let i = 0; i < 5; i++) {
      const b = busNuevo(i % 2 ? 1 : 0, i == 2);
      b.rotation.y = Math.PI / 2;
      b.position.set(36, 0, -26 + i * 11);
      g.add(b);
    }
    cartel(g, "TERMINAL DE BUSES · NUEVA YORK", 22, 2.4, "#0a3d62", "#ffffff", 47.9, 12, -2, DER);
    Z(g, 0, -19500);
  }
  // tren elevado (metro) por la izquierda, con dos estaciones
  {
    const g = new T.Group(),
      gris = 0x6b7075;
    caja(g, 6, 0.8, 1000, gris, -24, 8, -19500);
    [-25.2, -22.8].forEach((x) => caja(g, 0.15, 0.2, 1000, 0x9ea4aa, x, 8.5, -19500, { metalness: 0.8, roughness: 0.3 }));
    for (let z = -19010; z > -20000; z -= 25) caja(g, 1.2, 8, 1.2, gris, -24, 4, z);
    [-19300, -19700].forEach((z) => {
      caja(g, 3, 0.5, 60, 0xa0a4a8, -19.6, 8.4, z);
      caja(g, 3.4, 0.3, 60, 0x2b6cb0, -19.6, 12, z);
      [-25, 25].forEach((d) => caja(g, 0.3, 3.6, 0.3, 0x888888, -18.4, 10.2, z + d));
      cartel(g, "METRO", 4, 1, "#0039a6", "#ffffff", -18.2, 11, z, IZQ);
      cartel(g, "METRO", 4, 1, "#0039a6", "#ffffff", -18.2, 11, z + 20, IZQ);
    });
    zonaG.add(g);
  }
  const metro = new T.Group();
  for (let i = 0; i < 6; i++) {
    caja(metro, 2.8, 3.2, 14, 0xc0c6cc, 0, 1.8, i * 14.6, { metalness: 0.7, roughness: 0.3 });
    caja(metro, 2.84, 0.9, 12, 0x9fc4e8, 0, 2.2, i * 14.6, { emissive: 0x335577, metalness: 0.4, roughness: 0.1 });
    caja(metro, 2.86, 0.3, 14, 0x0039a6, 0, 0.9, i * 14.6);
  }
  metro.position.set(-24, 8.6, -19500);
  W(metro);

  // ===================== ZONA 20 · PARQUE INDUSTRIAL =====================
  portico(-20020, "PARQUE INDUSTRIAL · INTEL · AMD · MICROSOFT", "#37474f");
  const campus = (k, x, z, escala, lado) => {
    const g = copia(k);
    g.scale.setScalar(escala);
    Z(g, x, z, lado > 0 ? DER : IZQ);
    piso(zonaG, 40 * escala, 30 * escala, 0x7d8286, x, z, 0.02);
    // parqueo con carros
    const px = x - lado * 16 * escala;
    piso(zonaG, 14, 40, 0x3b3e44, px, z, 0.025);
    for (let i = 0; i < 6; i++) {
      const car = mkCar();
      car.rotation.y = Math.PI / 2;
      car.position.set(px + (i % 2 ? 3 : -3), 0, z - 15 + i * 6);
      zonaG.add(car);
    }
  };
  campus("intel", 72, -20150, 1.9, 1);
  campus("microsoft", 72, -20420, 1.9, 1);
  campus("windows", 66, -20660, 1.8, 1);
  campus("fabrica", 70, -20880, 1.8, 1);
  campus("amd", -82, -20180, 1.9, -1);
  campus("fabrica", -82, -20390, 1.9, -1);
  campus("amd", -82, -20760, 1.7, -1);
  campus("microsoft", -82, -20930, 1.6, -1);
  // carteles de entrada a cada campus
  [
    ["intel", -20150, 1],
    ["Microsoft", -20420, 1],
    ["Windows", -20660, 1],
    ["AMD", -20180, -1],
    ["INTEL FAB · FÁBRICA DE CHIPS", -20390, -1],
    ["AMD", -20760, -1],
  ].forEach(([t, z, lado]) => {
    const g = new T.Group();
    caja(g, 0.3, 3, 0.3, 0x777777, 0, 1.5, 0);
    cartel(g, t, 6, 1.4, t == "AMD" ? "#000000" : t.startsWith("Win") || t.startsWith("Micro") ? "#0078d4" : "#0068b5", "#ffffff", 0, 3.4, 0.2);
    Z(g, lado * 15, z + 35, lado > 0 ? DER : IZQ);
  });
  // patio de contenedores (izquierda)
  {
    const im = new T.InstancedMesh(compartir(new T.BoxGeometry(2.5, 2.6, 12)), compartir(new T.MeshStandardMaterial({ roughness: 0.6 })), 120),
      m4 = new T.Matrix4(),
      cols = [0xd62828, 0x1b4fa8, 0x2e7d32, 0xf2b400, 0xef6c00, 0x6a1b9a, 0x9e9e9e];
    let n = 0;
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 4; j++)
        for (let h = 0; h < 3; h++)
          if (Math.random() < 0.8 - h * 0.2) {
            m4.setPosition(-62 - i * 3, 1.3 + h * 2.6, -20560 - j * 13);
            im.setMatrixAt(n, m4);
            im.setColorAt(n, new T.Color(pk_(cols)));
            n++;
          }
    im.count = n;
    im.castShadow = true;
    im.frustumCulled = false; // las copias están lejos del centro: el recorte automático las escondía
    zonaG.add(im);
  }
  // tráileres estacionados frente a la fábrica
  for (let i = 0; i < 4; i++) {
    const t = traila();
    t.rotation.y = Math.PI / 2;
    t.position.set(44, 0, -20830 - i * 9);
    zonaG.add(t);
  }
  // tren de carga por la izquierda
  piso(zonaG, 5, 1000, 0x6b5e52, -40, -20500, 0.02);
  [-40.75, -39.25].forEach((x) => caja(zonaG, 0.15, 0.2, 1000, 0x9ea4aa, x, 0.12, -20500, { metalness: 0.8, roughness: 0.3 }));
  const carga = new T.Group();
  caja(carga, 3, 3.6, 14, 0xf2b400, 0, 2.4, 0);
  caja(carga, 3.02, 1, 3, 0x9fc4e8, 0, 3.4, -5.4, VIDRIO);
  for (let i = 1; i <= 14; i++) {
    const c = pk_([0x8d3b2a, 0x1b4fa8, 0x2e7d32, 0x6d6d6d, 0xd62828, 0xef6c00]);
    caja(carga, 2.8, 3.2, 12.4, c, 0, 2.3, i * 13.4);
  }
  carga.position.set(-40, 0, -20500);
  W(carga);

  // ===================== ZONA 21 · FRONTERA =====================
  {
    const zf = -21250,
      g = new T.Group();
    caja(g, 34, 0.9, 12, 0xf2f2f2, 0, 6.6, 0);
    caja(g, 34.2, 0.4, 12.2, 0x1b4fa8, 0, 6.05, 0);
    [-13, 13].forEach((x) => [-4.5, 4.5].forEach((z) => caja(g, 0.8, 6, 0.8, 0x888888, x, 3, z)));
    [-3.5, 0, 3.5].forEach((x) => {
      caja(g, 1, 0.3, 14, 0xf2c200, x, 0.15, 0);
      caja(g, 0.9, 2.6, 2.6, 0xe8ecef, x, 1.6, 0);
      caja(g, 0.92, 0.8, 2.2, 0x9fc4e8, x, 2.2, 0, VIDRIO);
    });
    cartel(g, "MIGRACIÓN · PASAPORTES", 18, 1.6, "#1b4fa8", "#ffffff", 0, 6.6, 6.05);
    cartel(g, "ALTO · MÁX 30 km/h", 8, 1, "#c62828", "#ffffff", 0, 5.2, 6.1);
    Z(g, 0, zf);
    // edificios
    const mig = new T.Group();
    caja(mig, 26, 7, 14, 0xeef2f5, 0, 3.5, 0);
    caja(mig, 26.4, 0.6, 14.4, 0x1b4fa8, 0, 7.3, 0);
    caja(mig, 20, 2, 0.12, 0x9cc8e8, 0, 2.2, 7.02, VIDRIO);
    cartel(mig, "MIGRACIÓN", 12, 1.6, "#1b4fa8", "#ffffff", 0, 5.5, 7.06);
    Z(mig, 30, zf - 40, DER);
    const adu = new T.Group();
    caja(adu, 24, 6, 14, 0xe9e2d5, 0, 3, 0);
    caja(adu, 24.4, 0.6, 14.4, 0x37474f, 0, 6.3, 0);
    cartel(adu, "ADUANA", 10, 1.6, "#37474f", "#ffffff", 0, 4.6, 7.06);
    Z(adu, -30, zf - 30, IZQ);
    const duty = restaurante("DUTY FREE", 0xf4f4f4, 0x6a1b9a, "#6a1b9a", "#ffffff");
    Z(sh(duty), -26, zf - 160, IZQ);
    // fila de banderas de muchos países
    PAISES.slice(0, 12).forEach((p, i) => {
      bandera(zonaG, p, 12 + (i % 2) * 0.1, zf + 30 + i * 9);
      bandera(zonaG, PAISES[(i + 12) % PAISES.length], -12, zf + 30 + i * 9);
    });
    // tráileres esperando turno en el parqueo
    piso(zonaG, 30, 150, 0x3b3e44, 52, zf - 220, 0.025);
    for (let i = 0; i < 6; i++) {
      const t = traila();
      t.position.set(44 + (i % 2) * 8, 0, zf - 160 - i * 22);
      zonaG.add(t);
    }
    portico(-21700, "BIENVENIDOS · WELCOME · BEM-VINDOS", "#0a6e3a");
  }

  // ===================== ZONA 22 · AUTOPISTA NUEVA =====================
  // La principal tiene presa. Por la derecha sale una autopista alterna (x = 40) que no tiene presa.
  {
    EXR.push([-21980, -23000]);
    const tramos = [
      [7, -22020, 40, -22110],
      [40, -22110, 40, -22890],
      [40, -22890, 7, -22980],
    ];
    tramos.forEach(([x1, z1, x2, z2]) => {
      XS.push([x1, z1, x2, z2, 5.5]);
      const dx = x2 - x1,
        dz = z2 - z1,
        L = Math.hypot(dx, dz) + 6,
        ry = Math.atan2(-dx, -dz),
        mx_ = (x1 + x2) / 2,
        mz_ = (z1 + z2) / 2;
      piso(zonaG, 12, L, 0xe8e8e8, mx_, mz_, 0.025, ry);
      piso(zonaG, 11, L, 0x3b3e44, mx_, mz_, 0.03, ry);
    });
    const lin = [];
    for (let z = -22120; z > -22880; z -= 12) lin.push(40, 0.05, z, 40, 0.05, z - 5);
    lines(lin, 0xffffff, zonaG);
    for (let z = -22130; z > -22880; z -= 40) {
      caja(zonaG, 0.25, 9, 0.25, 0x8a8f94, 47, 4.5, z);
      caja(zonaG, 3, 0.2, 0.2, 0x8a8f94, 45.6, 9, z);
      caja(zonaG, 0.9, 0.25, 0.5, 0xfff2c0, 44.4, 8.8, z, { emissive: 0xffe9a0, emissiveIntensity: 1.2 });
    }
    const g = new T.Group();
    [9.5, 16.5].forEach((x) => caja(g, 0.5, 7.4, 0.5, 0x8a8f94, x, 3.7, 0));
    caja(g, 7.6, 0.6, 0.6, 0x8a8f94, 13, 7.4, 0);
    cartel(g, "AUTOPISTA ALTERNA → SIN PRESA", 8, 2.2, "#0a6e3a", "#ffffff", 13, 8.9, 0.4);
    Z(g, 0, -21900);
    portico(-22060, "AUTOPISTA NUEVA · PRESA ADELANTE", "#0a6e3a");
    const fin = new T.Group();
    caja(fin, 0.25, 3, 0.25, 0x777777, 0, 1.5, 0);
    cartel(fin, "FIN AUTOPISTA ALTERNA", 5, 1.2, "#0a6e3a", "#ffffff", 0, 3.4, 0.2);
    Z(fin, 47, -22860);
  }

  // ===================== ZONA 23 · NACIONES =====================
  {
    rnd(-23250, "n");
    PAISES.forEach((p, i) => {
      const a = (i / PAISES.length) * Math.PI * 2 + 0.35,
        x = Math.sin(a) * 33,
        z = Math.cos(a) * 33;
      if (Math.abs(x) > 11) bandera(zonaG, p, x, -23250 + z, 10);
    });
    for (let i = 0; i < 12; i++) {
      const z = -23330 - i * 50;
      if (Math.abs(z + 23500) < 20) continue; // parada
      bandera(zonaG, PAISES[i % PAISES.length], 12, z);
      bandera(zonaG, PAISES[(i + 7) % PAISES.length], -12, z);
    }
    portico(-23060, "ROTONDA DE LAS NACIONES · PAÍSES DEL MUNDO", "#1b2a4a", "#ffd23f");
  }

  // ===================== SAN JOSÉ · BOMBEROS Y HOSPITAL =====================
  // A la derecha, entre la autopista y la carretera a Vara Blanca. El incendio queda a ~1 km.
  const Z_ESTACION = -8230,
    Z_HOSPITAL = -8345;
  EXR.push([-8170, -8400]);
  {
    Z(estacionBomberos(), 27, Z_ESTACION, DER);
    Z(hospital(), 29, Z_HOSPITAL, DER);
    const g = new T.Group();
    caja(g, 0.3, 3, 0.3, 0x777777, 0, 1.5, 0);
    cartel(g, "BOMBEROS Y HOSPITAL · SAN JOSÉ", 6.5, 1.4, "#b71c1c", "#ffffff", 0, 3.4, 0.2);
    Z(g, 11, -8150);
    // dos camiones más esperando en el patio
    for (let i = 0; i < 2; i++) {
      const c = camionBomberos();
      c.position.set(44, 0, Z_ESTACION - 6 + i * 12);
      c.rotation.y = Math.PI / 2;
      zonaG.add(c);
    }
  }

  {
    const porZona = new Map();
    for (const ch of [...zonaG.children]) {
      const k = Math.floor(-ch.position.z / 1000);
      if (!porZona.has(k)) porZona.set(k, new T.Group());
      porZona.get(k).add(ch);
    }
    for (const g of porZona.values()) zonaG.add(fusionar(g));
  }
  congelar(zonaG, new Set());
  chunks.forEach(scatter);

  // ===================== EMERGENCIAS =====================
  // Ambulancia (22) y camión de bomberos (23) para manejar. Tienen sirena, luces y no tienen límite de velocidad.
  const lucesJugador = {};
  const modeloEmergencia = (k, fn) =>
    mkV(k, (g, w) => {
      fn(g, w);
      lucesJugador[k] = [0xff2020, 0x2060ff, 0xff2020].map((c, i, a) => {
        const m = mm(0.5, 0.25, 0.45, c, (i - 1) * 0.65, 0, 0, { emissive: c, emissiveIntensity: 2 });
        g.add(m);
        return m;
      });
    });
  modeloEmergencia(22, (g, w) => {
    const bl = 0xf4f6f8,
      ro = 0xd32f2f;
    g.add(
      mm(2.1, 1.5, 1.9, bl, 0, 1.25, -1.9),
      mm(2.2, 2.3, 3.7, bl, 0, 1.75, 0.95),
      mm(2.22, 0.35, 5.6, ro, 0, 1.1, -0.05),
      mm(1.9, 0.75, 0.1, 0x9fc4e8, 0, 1.7, -2.86, { transparent: true, opacity: 0.6 }),
      mm(2, 0.4, 0.3, 0x333333, 0, 0.6, -2.95),
      lt(-0.7, 1.05, -2.9),
      lt(0.7, 1.05, -2.9),
    );
    [-1, 1].forEach((q) => {
      g.add(mm(0.06, 1, 0.3, ro, q * 1.11, 1.9, 1.6), mm(0.06, 0.3, 1, ro, q * 1.11, 1.9, 1.6));
      wh(g, 0.42, 0.3, q * 0.95, 0.42, -1.8, 0x151515, 0xbbbbbb, w);
      wh(g, 0.42, 0.3, q * 0.95, 0.42, 1.7, 0x151515, 0xbbbbbb, w);
    });
  });
  modeloEmergencia(23, (g, w) => {
    const ro = 0xa80d12;
    g.add(
      mm(2.5, 2.6, 3, ro, 0, 1.75, -3.6),
      mm(2.52, 0.9, 0.1, 0x9fc4e8, 0, 2.45, -5.12, { transparent: true, opacity: 0.6 }),
      mm(2.5, 2.4, 6.4, ro, 0, 1.7, 1.1),
      mm(2.3, 0.5, 10, 0x222222, 0, 0.6, -0.6),
      mm(2.54, 0.25, 9.6, 0xffffff, 0, 1.15, -0.6),
      mm(2.54, 0.12, 6.2, 0xffe066, 0, 2.5, 1.1),
      mm(0.12, 0.12, 8.6, 0xd8d8d8, -0.5, 3.1, 0.6, CH2),
      mm(0.12, 0.12, 8.6, 0xd8d8d8, 0.5, 3.1, 0.6, CH2),
      mm(0.5, 0.5, 1.2, 0xd8d8d8, 0, 3.3, -2.2, CH2), // cañón de agua
      lt(-0.85, 1, -5.15),
      lt(0.85, 1, -5.15),
    );
    for (let i = 0; i < 9; i++) g.add(mm(1, 0.08, 0.08, 0xd8d8d8, 0, 3.1, -3.3 + i * 0.98));
    [-1, 1].forEach((q) => {
      wh(g, 0.55, 0.4, q * 1.1, 0.55, -3.6, 0x151515, 0xbbbbbb, w);
      wh(g, 0.55, 0.4, q * 1.1, 0.55, 2.4, 0x151515, 0xbbbbbb, w);
      wh(g, 0.55, 0.4, q * 1.1, 0.55, 3.6, 0x151515, 0xbbbbbb, w);
    });
  });
  lucesJugador[22].forEach((m) => m.position.set(m.position.x, 2.95, 0));
  lucesJugador[23].forEach((m) => m.position.set(m.position.x, 3.2, -4.6));
  const base = PVS[9]; // camión de carreras: se parte de su manejo
  PVS.push(
    Object.assign({}, base, { acc: 11, max: 40, off: 12, hl: 2.8, hw: 1.15, cd: 11, ch: 4.8, dm: 0.8, cr: 0.5,
      s: [-0.5, 2.1, -1.6], hz: -2.9, hr: 0.6, ez: -1.5, emerg: 1, ambu: 1 }),
    Object.assign({}, base, { acc: 8, max: 34, off: 10, hl: 5.3, hw: 1.3, cd: 16, ch: 6.6, dm: 0.5, cr: 0.6,
      s: [-0.6, 2.8, -3.9], hz: -5.4, hr: 0.5, ez: -3, emerg: 1, bomberos: 1 }),
  );
  VN.push("Ambulancia", "Camión de bomberos");
  VI.push("🚑", "🚒");
  TUN.push({}, {});

  // ----- el incendio gigante -----
  const llamaTex = compartir(
    cv(64, 64, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h * 0.62, 2, w / 2, h * 0.6, w / 2);
      g.addColorStop(0, "rgba(255,250,200,1)");
      g.addColorStop(0.3, "rgba(255,190,60,0.95)");
      g.addColorStop(0.65, "rgba(255,80,10,0.55)");
      g.addColorStop(1, "rgba(120,20,0,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    }),
  );
  const humoTex = compartir(
    cv(64, 64, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    }),
  );
  const fuegoG = new T.Group(),
    llamas = [],
    humos = [],
    llamaM = new T.SpriteMaterial({ map: llamaTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true });
  for (let i = 0; i < 70; i++) {
    const sp = new T.Sprite(llamaM),
      x = R(-22, 22),
      z = R(-INC.largo, INC.largo),
      t = R(8, 22) * (1.3 - Math.abs(x) / 45);
    sp.position.set(x, t * 0.42, z);
    sp.userData = { x, z, t, f: R(0, 6.3), v: R(5, 11) };
    fuegoG.add(sp);
    llamas.push(sp);
  }
  for (let i = 0; i < 34; i++) {
    const m = new T.SpriteMaterial({ map: humoTex, color: 0x2b2b2b, depthWrite: false, transparent: true, opacity: 0.6 }),
      sp = new T.Sprite(m);
    sp.userData = { x: R(-12, 12), z: R(-20, 20), u: i / 34 };
    fuegoG.add(sp);
    humos.push(sp);
  }
  // vehículos quemados a la orilla y el asfalto chamuscado
  {
    const negro = new T.MeshStandardMaterial({ color: 0x1d1b1a, roughness: 1 }),
      quemar = (o) => (o.traverse((m) => m.isMesh && (m.material = negro)), o),
      t = quemar(traila());
    t.position.set(10.5, 0, 6);
    t.rotation.y = 0.5;
    fuegoG.add(t);
    [[-10, -8, 1.2], [9.5, -14, -0.4], [-9.5, 12, 2.6]].forEach(([x, z, r]) => {
      const c = quemar(mkCar());
      c.position.set(x, 0, z);
      c.rotation.y = r;
      fuegoG.add(c);
    });
    const ch = pn(40, INC.largo * 2 + 10, 0x141210, 0, 0.035, 0);
    ch.material.transparent = true;
    ch.material.opacity = 0.75;
    fuegoG.add(ch);
  }
  fuegoG.position.z = INC.z;
  W(fuegoG);
  // chorro de agua del camión de bomberos
  const aguaM = new T.SpriteMaterial({ map: humoTex, color: 0xbfe3ff, depthWrite: false, transparent: true, opacity: 0.85 }),
    gotas = [];
  for (let i = 0; i < 28; i++) {
    const sp = new T.Sprite(aguaM);
    sp.visible = false;
    sp.userData.u = i / 28;
    sc.add(sp);
    gotas.push(sp);
  }

  // ----- tráfico: darle campo a las emergencias y frenar antes del fuego -----
  let emergencias = []; // [x, z, dirección] de cada emergencia con sirena (se recalcula cada cuadro)
  const esEmergencia = (c) => !!c.o.userData.amb;
  window.cocheTick = function (c, dt) {
    const d = Math.sign(c.v0) || -1,
      fz = wo.position.z + INC.z;
    c.libre = false;
    c.tope = null;
    let objetivo = 0;
    if (esEmergencia(c)) {
      // va por el carril de emergencia (entre los dos carriles) y no le afecta la presa
      c.libre = true;
      objetivo = Math.sign(c.x0) * 3.5 - c.x0;
    } else
      for (const [ex, ez, ed] of emergencias)
        if (ed == d && Math.sign(ex || 1) == Math.sign(c.x0) && (c.z - ez) * d > -4 && (c.z - ez) * d < 140) {
          // se abre: el carril de afuera hacia la orilla y el de adentro hacia el centro
          objetivo = Math.abs(c.x0) > 3.5 ? Math.sign(c.x0) * 1.6 : -Math.sign(c.x0) * 1.15;
          break;
        }
    c.ox = (c.ox || 0) + (objetivo - (c.ox || 0)) * Math.min(1, dt * 2.5);
    c.cede = !c.libre && Math.abs(c.ox) > 0.5;
    if (!c.stat) c.x += c.ox;
    if (INC.fuego > 0 && !MONT.on) {
      if (Math.abs(c.z - fz) < INC.largo + 4 && !c.stat) {
        c.x = 100; // apareció dentro del fuego: se quita
        return;
      }
      const margen = INC.largo + (c.libre ? 8 : 16),
        hueco = d < 0 ? c.z - (fz + margen) : fz - margen - c.z;
      if (hueco > -5 && hueco < 400) c.tope = Math.max(0, hueco) * 0.6;
    }
  };

  // ----- cada cuadro -----
  let avisoFuego = -1,
    avisoPresa = -1,
    quemado = 0,
    sirenaOn = false,
    paradoT = 0,
    heridos = 0,
    heridosCiclo = -1;
  const ESTADO_AGUA = $("agua");
  function emergTick(dt, play) {
    // nuevo ciclo o reinicio: el incendio vuelve a empezar
    if (INC.ciclo != cyc) {
      INC.ciclo = cyc;
      INC.fuego = 100;
      INC.jugador = 0;
      INC.apagadoT = 99;
      INC.fin = false;
    }
    const i = JAM.indexOf(INC.presa);
    if (INC.fuego > 0 && i < 0) JAM.push(INC.presa);
    if (INC.fuego <= 0 && i >= 0) JAM.splice(i, 1);
    const fz = wo.position.z + INC.z,
      f = Math.max(0, INC.fuego) / 100,
      t = reloj;
    INC.apagadoT += dt;
    // fuego y humo
    const cerca = Math.abs(B.z - fz) < 1600;
    fuegoG.visible = cerca;
    if (cerca) {
      llamas.forEach((sp) => {
        const u = sp.userData,
          k = f > 0 ? (0.25 + 0.75 * f) * (0.8 + 0.3 * Math.sin(t * u.v + u.f)) : 0;
        sp.visible = k > 0;
        sp.scale.set(u.t * k * 0.75, u.t * k, 1);
        sp.position.y = u.t * k * 0.45;
      });
      const humo = f > 0 ? 0.55 + 0.4 * f : Math.max(0, 0.5 - INC.apagadoT / 40);
      humos.forEach((sp) => {
        const u = sp.userData,
          q = (u.u + t * 0.035) % 1;
        sp.position.set(u.x + q * 25, 6 + q * 95, u.z - q * 10);
        sp.scale.setScalar(8 + q * 40);
        sp.material.opacity = humo * (1 - q) * 0.75;
        sp.material.color.setHex(f > 0 ? 0x2b2b2b : 0xd8d8d8);
        sp.visible = humo > 0;
      });
    }
    // bomberos del tráfico parados en el incendio también lo apagan (despacio: es gigantesco)
    let enIncendio = 0;
    emergencias = [];
    for (const c of cars) {
      if (!c.o.userData.amb || c.hit) continue;
      emergencias.push([c.x0, c.z, Math.sign(c.v0) || -1]);
      if (c.o.userData.bomb && Math.abs(c.z - fz) < INC.largo + 30 && Math.abs(c.vz) < 1) enIncendio++;
    }
    if (play && PV.emerg) emergencias.push([B.x, B.z, Math.cos(B.h) * B.v > 0 ? -1 : 1]);
    if (INC.fuego > 0) INC.fuego -= Math.min(3, enIncendio) * 0.25 * dt;
    // sirena y luces del vehículo de emergencia del jugador
    const sir = play && PV.emerg && Math.abs(B.v) > 0.3;
    if (!chase && sir != sirenaOn) sirena(sir, 0.05);
    sirenaOn = sir;
    const L = lucesJugador[skin];
    if (L) {
      const w = Math.floor(performance.now() / 140) % 2;
      L.forEach((m, k) => (m.material.emissiveIntensity = (k % 2 == 0) == !!w ? 3 : 0.15));
    }
    // chorro de agua (tecla F o botón 💧)
    const bomb = play && PV.bomberos;
    if (ESTADO_AGUA) ESTADO_AGUA.style.display = bomb ? "" : "none";
    const echando = bomb && (keys.KeyF || keys.TF);
    const fx = -Math.sin(B.h),
      fzz = -Math.cos(B.h),
      ox = B.x + fx * (PV.hl - 1),
      oz = B.z + fzz * (PV.hl - 1),
      dist = Math.hypot(B.x, B.z - (fz + INC.largo));
    // hacia dónde apunta el agua: otro fuego cercano (js/mundo2.js) o hacia adelante
    const obj = echando && typeof window.objetivoAgua == "function" ? window.objetivoAgua() : null;
    let ax = fx,
      az = fzz,
      alcance = Math.min(45, Math.max(20, dist)),
      arco = 6;
    if (obj) {
      const dx = obj.x - ox,
        dz = obj.z - oz,
        L = Math.hypot(dx, dz) || 1;
      ax = dx / L;
      az = dz / L;
      alcance = Math.min(90, L);
      arco = 18;
    }
    gotas.forEach((sp) => {
      sp.visible = echando;
      if (!echando) return;
      const u = (sp.userData.u + t * 1.6) % 1;
      sp.position.set(ox + ax * alcance * u + R(-0.3, 0.3), B.y + 3.4 + Math.sin(u * Math.PI) * arco - u * 3, oz + az * alcance * u);
      sp.scale.setScalar(0.6 + u * 2.2);
    });
    if (echando && INC.fuego > 0 && B.z > fz && B.z - fz < INC.largo + 50 && Math.abs(B.x) < 20) {
      INC.fuego -= 2.6 * dt;
      INC.jugador += dt;
      if (Math.random() < dt * 0.7) msg("🚒 ¡Apagando el incendio! " + Math.max(0, Math.ceil(INC.fuego)) + "% de fuego", 1200);
    }
    if (INC.fuego <= 0 && !INC.fin) {
      INC.fin = true;
      INC.apagadoT = 0;
      INC.fuego = 0;
      if (INC.jugador > 3) {
        cash += 20000;
        msg("🚒 ¡APAGASTE EL INCENDIO GIGANTE! +₡20 000 · la presa empieza a moverse", 4500);
      } else msg("🚒 Los bomberos apagaron el incendio: la presa empieza a moverse", 4000);
    }
    if (!play || MONT.on) return;
    const zc = B.z - wo.position.z;
    // avisos
    if (INC.fuego > 0 && zc < -4100 && zc > -4400 && avisoPresa != cyc) {
      avisoPresa = cyc;
      msg("🚒 Presa de 5 km por un INCENDIO GIGANTE en la autopista (km 9) · dale campo a los bomberos", 4500);
    }
    if (INC.fuego > 0 && B.z - fz < 450 && B.z - fz > INC.largo && avisoFuego != cyc) {
      avisoFuego = cyc;
      msg(PV.bomberos ? "🚒 Acercate y mantené F (o 💧) para echar agua" : "🔥 ¡INCENDIO GIGANTE adelante! No pasés por el fuego", 4000);
    }
    // meterse al fuego quema
    if (INC.fuego > 0 && Math.abs(B.z - fz) < INC.largo && Math.abs(B.x) < 17 && B.y < 5) {
      dmg += (PV.bomberos ? 6 : 22) * dt;
      B.v *= Math.pow(0.35, dt);
      shake = Math.max(shake, 0.3);
      if (!quemado) msg("🔥 ¡Te estás quemando! Salí del fuego", 1800);
      quemado = 1;
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    } else quemado = 0;
    // ambulancia: recoger heridos en el incendio y llevarlos al hospital de San José
    if (PV.ambu) {
      paradoT = Math.abs(B.v) < 1.5 ? paradoT + dt : 0;
      if (!heridos && heridosCiclo != cyc && Math.abs(B.z - (fz + INC.largo + 25)) < 45 && paradoT > 1.5) {
        heridos = 3;
        heridosCiclo = cyc;
        msg("🚑 Subiste 3 heridos: llevalos al HOSPITAL de San José (km 8)", 4500);
      }
      const hz = wo.position.z + Z_HOSPITAL,
        hz2 = hz - CICLO; // también sirve el hospital de la vuelta siguiente
      if (heridos && (Math.abs(B.z - hz) < 40 || Math.abs(B.z - hz2) < 40) && B.x > 3 && paradoT > 1.5) {
        cash += 15000;
        msg("🏥 Entregaste " + heridos + " heridos en el hospital +₡15 000", 4000);
        heridos = 0;
      }
    } else heridos = 0;
  }

  // Herramientas que usa js/mundo2.js para construir más mundo.
  window.MUNDO = {
    caja, cilindro, piso, cartel, cartelDibujo, fachada, fusionar, deModelo, bandera, copia, restaurante,
    rascacielos, portico, traila, busNuevo, camionBomberos, lucesEmergencia, faros, compartir, mat, geoCaja,
    planoTex, llamaTex, humoTex, BUSES, NEGOCIOS, COMIDA, TECNO, ZONAS_LOTE, PAISES, COLORES_EDIFICIO, VIDRIO, LUZ,
    DER, IZQ, INC,
  };

  // ===================== CUADRO A CUADRO =====================
  let reloj = 0,
    zAnt = 0,
    migraAviso = -1,
    migraCiclo = -1,
    alternaCiclo = -1;
  window.mundoTick = function (dt) {
    reloj += dt;
    // trenes: van y vienen por su vía
    metro.position.z = -19500 + 400 * Math.sin(reloj * 0.055);
    carga.position.z = -20560 + 360 * Math.sin(reloj * 0.04 + 1);
    if (Math.abs(B.z - zAnt) > 30) INC.ciclo = -1; // reinicio: el incendio vuelve a empezar
    emergTick(dt, state == "play");
    if (state != "play" || MONT.on) {
      zAnt = B.z;
      return;
    }
    if (Math.abs(B.z - zAnt) > 30) migraAviso = migraCiclo = alternaCiclo = -1; // reinicio desde el menú
    const zc = B.z - wo.position.z; // posición dentro del ciclo
    // Migración: pasar despacio
    if (zc < -21000 && zc > -21160 && migraAviso != cyc) {
      migraAviso = cyc;
      msg("🛂 Migración adelante: pasá despacio (máx 30 km/h)", 3000);
    }
    const zm = wo.position.z - 21250;
    // (si el bus "salta" más de 30 m en un cuadro es un reinicio desde el menú, no cuenta)
    if (zAnt >= zm && B.z < zm && zAnt - B.z < 30 && Math.abs(B.x) < 9 && migraCiclo != cyc) {
      migraCiclo = cyc;
      if (Math.abs(B.v) * 3.6 > 30) msg("🛂 ¡Pasaste volando por Migración! La próxima vez pará para el sello", 2600);
      else {
        msg("🛂 Pasaporte sellado · ¡Bienvenido! +₡500", 2600);
        cash += 500;
      }
    }
    // autopista alterna
    if (zc < -22100 && zc > -22900 && B.x > 30 && alternaCiclo != cyc) {
      alternaCiclo = cyc;
      msg("🛣 Autopista alterna: ¡sin presa!", 2600);
    }
    zAnt = B.z;
  };
})();
