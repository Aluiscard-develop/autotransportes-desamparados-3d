// =====================================================================
// RENDIMIENTO · el menú "🎨 Gráficos" (Automático, Ultra, Normal y Bajo) y lo que hace que el
// juego vaya fluido en PCs de pocos recursos. Los números están en js/ajustes.js (AJUSTES.graficos).
//
//   AUTOMÁTICO · mira qué tan potente es la PC para elegir el nivel de inicio. Mientras jugás mide
//                los cuadros por segundo: si va lento baja la resolución y, si no alcanza, baja el
//                nivel (Ultra → Normal → Bajo). Si va sobrado, vuelve a subir la resolución.
//   BAJO       · sin sombras, sin bordes suaves, menos resolución, más niebla (se dibuja menos a lo
//                lejos) y menos gente y tornados en el apocalipsis.
//
// Se carga después de js/ajustes.js y antes del juego. Sus funciones usan rd, sc, cam y sun,
// que se crean después (en js/juego/02-escena.js), así que solo se llaman cuando el juego ya existe.
// Para revisar desde la consola del navegador: CALIDAD
// =====================================================================
const CALIDAD = (() => {
  const G = AJUSTES.graficos,
    NIVELES = ["bajo", "normal", "ultra"],
    CLAVE = "adg-graficos";
  const leer = () => {
    try {
      return localStorage.getItem(CLAVE);
    } catch (e) {
      return null;
    }
  };
  const guardar = (v) => {
    try {
      localStorage.setItem(CLAVE, v);
    } catch (e) {}
  };

  // ¿Qué tan potente es esta PC? Se mira la tarjeta de video, los núcleos y la memoria.
  function detectar() {
    let gpu = "";
    try {
      const c = document.createElement("canvas"),
        gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (gl) {
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
        const lc = gl.getExtension("WEBGL_lose_context");
        if (lc) lc.loseContext();
      }
    } catch (e) {}
    const nucleos = navigator.hardwareConcurrency || 4,
      memoria = navigator.deviceMemory || 8,
      tactil = matchMedia("(pointer:coarse)").matches,
      // video por software, Intel viejos (HD Graphics / GMA) y celulares viejos
      debil =
        /swiftshader|llvmpipe|softpipe|software|basic render|gma|intel\(r\) hd graphics|hd graphics [0-9]{3,4}|mali-[4t]|adreno \(tm\) [2-5]\d\d|powervr|vivante/i.test(
          gpu,
        ),
      // tarjetas dedicadas
      fuerte = /nvidia|geforce|quadro|rtx|gtx|radeon (rx|pro|r9)|apple m\d/i.test(gpu);
    let nivel = "normal";
    if (debil || nucleos <= 2 || memoria <= 2) nivel = "bajo";
    else if (!tactil && fuerte && nucleos >= 6) nivel = "ultra";
    return { gpu, nucleos, memoria, tactil, nivel };
  }

  const pc = detectar();
  const guardado = leer();
  const C = {
    pc,
    eleccion: ["auto", ...NIVELES].includes(guardado) ? guardado : "auto", // lo que eligió el jugador
    nivel: "normal", // el nivel que se está usando
    res: 1, // resolución actual (el modo automático la mueve)
    resMax: 1,
    vista: 1,
    efectos: 1,
    fps: 0,
  };
  C.nivel = C.eleccion == "auto" ? pc.nivel : C.eleccion;
  // los bordes suaves solo se pueden elegir al crear el renderizador (al cargar la página)
  C.antialias = G[C.nivel].antialias;

  // Vuelve a armar los materiales (hace falta al prender o apagar las sombras).
  function recompilar() {
    sc.traverse((o) => {
      const m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => (x.needsUpdate = true));
    });
  }
  function ponerRes(r) {
    C.res = r;
    rd.setPixelRatio(Math.min(devicePixelRatio, r));
    rs();
  }
  function ponerNivel(n, mantenerRes) {
    const p = G[n];
    C.nivel = n;
    GQ = n == "ultra" ? 1 : 0;
    C.vista = p.vista;
    C.efectos = p.efectos;
    C.resMax = p.resolucion;
    const conSombras = p.sombras > 0,
      tipo = p.sombrasSuaves ? T.PCFSoftShadowMap : T.PCFShadowMap;
    if (rd.shadowMap.enabled != conSombras || (conSombras && rd.shadowMap.type != tipo)) {
      rd.shadowMap.enabled = conSombras;
      rd.shadowMap.type = tipo;
      recompilar();
    }
    if (conSombras && sun.shadow.mapSize.x != p.sombras) {
      sun.shadow.mapSize.set(p.sombras, p.sombras);
      if (sun.shadow.map) {
        sun.shadow.map.dispose();
        sun.shadow.map = null;
      }
    }
    ponerRes(mantenerRes ? Math.min(C.res, C.resMax) : C.resMax);
  }

  // Se llama desde applyGfx (js/juego/12-menu.js) al empezar y cada vez que se cambia el menú.
  C.aplicar = (eleccion) => {
    if (!["auto", ...NIVELES].includes(eleccion)) eleccion = "auto";
    if (eleccion != C.eleccion) guardar(eleccion);
    const antes = C.eleccion;
    C.eleccion = eleccion;
    if (eleccion == "auto") {
      // al volver a Automático se arranca del nivel que le sirve a la PC
      if (antes != "auto" || !C.listo) ponerNivel(pc.nivel);
    } else ponerNivel(eleccion);
    C.listo = true;
    reiniciarMedicion(3);
  };

  // ----- modo automático: mide y ajusta -----
  let ventT = 0,
    ventN = 0,
    trabajo = 0,
    espera = 3,
    lentas = 0,
    rapidas = 0,
    sinMejora = 0,
    fpsAntes = 0,
    tope = false, // la pantalla no da más cuadros (por ejemplo 30 Hz): no tiene sentido bajar más
    yaSubio = false;
  function reiniciarMedicion(seg) {
    ventT = ventN = trabajo = 0;
    espera = seg;
  }
  function bajarNivel() {
    const i = NIVELES.indexOf(C.nivel);
    if (i <= 0) return false;
    ponerNivel(NIVELES[i - 1]);
    if (typeof msg == "function")
      msg("⚙ Gráficos en " + NIVELES[i - 1].toUpperCase() + " para que vaya más fluido", 2500);
    return true;
  }
  // msCuadro: tiempo desde el cuadro anterior · msTrabajo: lo que tardó el juego en este cuadro
  C.medir = (msCuadro, msTrabajo) => {
    if (C.eleccion != "auto" || tope || state != "play" || document.hidden) return reiniciarMedicion(1);
    if (msCuadro > 250) return; // pausa, cambio de pestaña o carga
    if (espera > 0) {
      espera -= msCuadro / 1000;
      return;
    }
    ventT += msCuadro;
    ventN++;
    trabajo += msTrabajo;
    if (ventT < 1500) return;
    const fps = (1000 * ventN) / ventT,
      ocupado = trabajo / ventT; // fracción del tiempo que el juego estuvo trabajando
    C.fps = Math.round(fps);
    reiniciarMedicion(0);
    const A = G.auto;
    // ¿la última bajada sirvió de algo?
    if (fpsAntes) {
      sinMejora = fps < fpsAntes * 1.05 && ocupado < 0.5 ? sinMejora + 1 : 0;
      fpsAntes = 0;
      if (sinMejora >= 2) {
        // va igual de lento con menos gráficos y el juego casi no trabaja: es el límite de la pantalla
        tope = true;
        ponerRes(C.resMax);
        return;
      }
    }
    if (fps < A.fpsMeta) {
      rapidas = 0;
      lentas++;
      if (C.res > A.resolucionMinima + 0.01) {
        fpsAntes = fps;
        ponerRes(Math.max(A.resolucionMinima, C.res * (fps < A.fpsMeta * 0.7 ? 0.8 : 0.9)));
        reiniciarMedicion(0.5);
      } else if (lentas >= 2) {
        lentas = 0;
        fpsAntes = fps;
        if (bajarNivel()) reiniciarMedicion(2);
      }
    } else {
      lentas = 0;
      if (fps < A.fpsSubir) return (rapidas = 0);
      rapidas++;
      if (C.res < C.resMax - 0.01 && rapidas >= 2) {
        ponerRes(Math.min(C.resMax, C.res * 1.1));
        rapidas = 0;
      } else if (C.nivel == "bajo" && !yaSubio && rapidas >= 6) {
        // va sobrado en Bajo: prueba Normal una sola vez (si después va lento, vuelve a Bajo y se queda)
        yaSubio = true;
        rapidas = 0;
        ponerNivel("normal");
        reiniciarMedicion(3);
      }
    }
  };

  // ----- ver menos lejos (nivel Bajo) -----
  // La niebla se acerca y la cámara deja de dibujar lo que queda detrás de la niebla.
  // El cielo, el sol, las nubes y la cúpula morada se acercan a la cámara (y se achican igual)
  // para que se sigan viendo del mismo tamaño.
  const LEJOS = 1500,
    fondo = [],
    guardados = [];
  let fogN = 0,
    fogF = 0,
    activo = false;
  C.fondo = (...objs) => fondo.push(...objs.filter(Boolean));
  C.antesDeDibujar = () => {
    activo = C.vista < 1;
    if (!activo) {
      if (cam.far != LEJOS) {
        cam.far = LEJOS;
        cam.updateProjectionMatrix();
      }
      return;
    }
    fogN = sc.fog.near;
    fogF = sc.fog.far;
    sc.fog.near = fogN * C.vista;
    sc.fog.far = Math.max(80, fogF * C.vista);
    const lejos = Math.min(LEJOS, sc.fog.far + 40);
    if (Math.abs(cam.far - lejos) > 2) {
      cam.far = lejos;
      cam.updateProjectionMatrix();
    }
    const k = Math.min(1, (cam.far * 0.9) / 1000),
      c = cam.position;
    fondo.forEach((o, i) => {
      const g = guardados[i] || (guardados[i] = { p: new T.Vector3(), s: new T.Vector3() });
      g.p.copy(o.position);
      g.s.copy(o.scale);
      o.position.set(c.x + (g.p.x - c.x) * k, c.y + (g.p.y - c.y) * k, c.z + (g.p.z - c.z) * k);
      o.scale.multiplyScalar(k);
    });
  };
  C.despuesDeDibujar = () => {
    if (!activo) return;
    sc.fog.near = fogN;
    sc.fog.far = fogF;
    fondo.forEach((o, i) => {
      o.position.copy(guardados[i].p);
      o.scale.copy(guardados[i].s);
    });
  };
  return C;
})();
