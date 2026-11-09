// js/juego/01-base.js · utilidades ($, setH, R), cantidad de zonas (NZ) y PENDIENTES Y BAJADAS (RELIEVE).
// Parte 1 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

let hudExtra = ""; // líneas extra del panel (límite de velocidad y multas)
// Mirar hacia atrás: mantené V (o el botón 👀). MIRA = 1 mira adelante, -1 mira atrás.
let MIRA = 1;
const _el = {},
  $ = (id) => _el[id] || (_el[id] = document.getElementById(id)),
  _hud = {},
  // optimización: solo toca el DOM si el texto cambió
  setH = (id, html) => {
    if (_hud[id] !== html) $(id).innerHTML = _hud[id] = html;
  },
  R = (a, b) => a + Math.random() * (b - a),
  T = THREE;
// Cantidad de zonas de 1 km que tiene el recorrido antes de repetirse (las nuevas están en js/mundo.js
// a js/mundo6.js; la última, la 49, es el Campo de guerra).
const NZ = 50,
  CICLO = NZ * 1000,
  INICIO_MONTANA = 99; // valor del menú "Inicio: Ruta de montaña"

// ===================== PENDIENTES Y BAJADAS =====================
// La lógica del juego usa una carretera plana. Para que haya cuestas, el dibujo se "dobla" en la GPU:
// cada vértice sube o baja según una función de Z, igual para objetos, sombras y recorte.
// El bus se inclina con la pendiente, pierde velocidad al subir y agarra impulso al bajar.
// Para cambiarlas: editá RELIEVE. [zona]: [altura máxima en metros, cantidad de lomas por km]
// Cada zona sube y baja (subida, bajada, valle…) y termina a nivel, así que no afecta túneles, puentes ni rotondas.
// Zonas: 1 Autopista · 3 Ruta del bosque · 9 Circunvalación · 13 Cruce Río Frío (ver la lista ZN más abajo).
const RELIEVE = { 1: [9, 2], 3: [7, 3], 9: [8, 2], 13: [9, 2], 24: [13, 2], 40: [14, 2] }; // 24: Ruta de la Muerte · 40: Cordillera y valle
const relieveZona = (u) => {
  const k = Math.floor(u / 1000),
    c = RELIEVE[((k % NZ) + NZ) % NZ];
  return c ? [c[0], c[1], u - k * 1000] : null;
};
// altura del terreno a una distancia u = -z:  H = A·sin(2πn·s/1000)·sin(π·s/1000)  (0 y plano en los bordes)
const relieveH = (u) => {
  const c = relieveZona(u);
  return c ? c[0] * Math.sin((6.2831853 * c[1] * c[2]) / 1000) * Math.sin((3.1415927 * c[2]) / 1000) : 0;
};
// pendiente (subida > 0 al avanzar)
const relieveP = (u) => (relieveH(u + 1) - relieveH(u - 1)) / 2;
// referencia = posición del jugador (BEND.y = altura bajo el bus). Se comparte (sin clonar) con todos los materiales.
const BEND = { x: 0, y: 0, z: 0, w: 1 };
const bendY = (z) => (BEND.w ? relieveH(-z) - BEND.y : 0);
(function () {
  const glslZona = Object.entries(RELIEVE)
    .map(([z, [a, n]]) => `if(abs(zn-${z}.)<.5){A=${a.toFixed(3)};n=${n.toFixed(1)};}`)
    .join("else ");
  // el guard evita declarar dos veces (three.js incluye "common" dos veces en algunos shaders y
  // los drivers estrictos —Vulkan, Windows/D3D— rechazan el shader y la pantalla queda en blanco)
  T.ShaderChunk.common += `
#ifndef BEND_RELIEVE
#define BEND_RELIEVE
uniform vec4 bendR;
float bendY(float z){
  if(bendR.w<.5)return 0.;
  float u=-z,k=floor(u/1000.),zn=mod(k,${NZ}.),s=u-k*1000.,A=0.,n=1.;
  ${glslZona}
  return A*sin(6.2831853*n*s/1000.)*sin(3.1415927*s/1000.)-bendR.y;
}
#endif`;
  T.ShaderChunk.project_vertex = T.ShaderChunk.project_vertex.replace(
    "mvPosition = modelViewMatrix * mvPosition;",
    "mvPosition = modelMatrix * mvPosition; mvPosition.y += bendY(mvPosition.z); mvPosition = viewMatrix * mvPosition;",
  );
  T.ShaderChunk.worldpos_vertex = T.ShaderChunk.worldpos_vertex.replace(
    "worldPosition = modelMatrix * worldPosition;",
    "worldPosition = modelMatrix * worldPosition; worldPosition.y += bendY(worldPosition.z);",
  );
  const spr = (s) =>
    s.replace(
      "vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );",
      "vec4 mvPosition = modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ); mvPosition.y += bendY(mvPosition.z); mvPosition = viewMatrix * mvPosition;",
    );
  T.ShaderChunk.sprite_vert = spr(T.ShaderChunk.sprite_vert);
  T.ShaderLib.sprite.vertexShader = spr(T.ShaderLib.sprite.vertexShader);
  // three r128 solo sube el uniform "viewMatrix" para algunos materiales (Standard, Basic, Lambert…).
  // Sprites, líneas y el material de sombras lo dejaban en cero: en tarjetas NVIDIA los brillos
  // tapaban toda la pantalla (pantalla blanca). Con skinning=true también lo sube; en objetos que no
  // son SkinnedMesh no tiene otro efecto (maxBones = 0).
  Object.defineProperty(T.Material.prototype, "skinning", { get: () => true, set() {}, configurable: true });
  // UniformsUtils.clone copia por referencia los objetos que no son Vector4 → todos comparten BEND
  for (const k in T.ShaderLib) if (T.ShaderLib[k].uniforms) T.ShaderLib[k].uniforms.bendR = { value: BEND };
  // el recorte por cámara (frustum culling) también usa la altura doblada
  const sp = new T.Sphere();
  T.Frustum.prototype.intersectsObject = function (o) {
    const g = o.geometry;
    if (g.boundingSphere === null) g.computeBoundingSphere();
    sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    sp.center.y += bendY(sp.center.z);
    sp.radius *= 1.1;
    return this.intersectsSphere(sp);
  };
  T.Frustum.prototype.intersectsSprite = function (s) {
    sp.center.set(0, 0, 0);
    sp.radius = 0.75;
    sp.applyMatrix4(s.matrixWorld);
    sp.center.y += bendY(sp.center.z);
    return this.intersectsSphere(sp);
  };
})();
// Las piezas largas (carretera, barandas, calles, terreno) necesitan más vértices para seguir las lomas.
function subdividirLargos(root) {
  const cache = new Map(),
    seg = (d) => Math.min(256, Math.ceil(d / 8));
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.parameters) return;
    const g = o.geometry,
      p = g.parameters;
    let n = cache.get(g);
    if (n === undefined) {
      n = null;
      if (g.type === "BoxGeometry" && p.depth > 24 && p.depthSegments === 1)
        n = new T.BoxGeometry(p.width, p.height, p.depth, 1, 1, seg(p.depth));
      else if (g.type === "PlaneGeometry" && (p.height > 24 || p.width > 24) && p.heightSegments === 1)
        n = new T.PlaneGeometry(
          p.width,
          p.height,
          Math.abs(o.rotation.z) > 0.1 ? seg(p.width) : 1,
          seg(p.height),
        );
      cache.set(g, n);
    }
    if (n) o.geometry = n;
  });
}
// =====================================================================
