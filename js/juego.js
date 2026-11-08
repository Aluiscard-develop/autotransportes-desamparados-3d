let hudExtra = ""; // líneas extra del panel (límite de velocidad y multas)
const _el = {},
  $ = (id) => _el[id] || (_el[id] = document.getElementById(id)),
  _hud = {},
  // optimización: solo toca el DOM si el texto cambió
  setH = (id, html) => {
    if (_hud[id] !== html) $(id).innerHTML = _hud[id] = html;
  },
  R = (a, b) => a + Math.random() * (b - a),
  T = THREE;
// Cantidad de zonas de 1 km que tiene el recorrido antes de repetirse (las nuevas están en js/mundo.js,
// js/mundo2.js y js/mundo3.js).
const NZ = 35,
  CICLO = NZ * 1000,
  INICIO_MONTANA = 99; // valor del menú "Inicio: Ruta de montaña"

// ===================== PENDIENTES Y BAJADAS =====================
// La lógica del juego usa una carretera plana. Para que haya cuestas, el dibujo se "dobla" en la GPU:
// cada vértice sube o baja según una función de Z, igual para objetos, sombras y recorte.
// El bus se inclina con la pendiente, pierde velocidad al subir y agarra impulso al bajar.
// Para cambiarlas: editá RELIEVE. [zona]: [altura máxima en metros, cantidad de lomas por km]
// Cada zona sube y baja (subida, bajada, valle…) y termina a nivel, así que no afecta túneles, puentes ni rotondas.
// Zonas: 1 Autopista · 3 Ruta del bosque · 9 Circunvalación · 13 Cruce Río Frío (ver la lista ZN más abajo).
const RELIEVE = { 1: [9, 2], 3: [7, 3], 9: [8, 2], 13: [9, 2], 24: [13, 2] }; // 24: Ruta de la Muerte
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

const rd = new T.WebGLRenderer({ antialias: true });
rd.setPixelRatio(Math.min(devicePixelRatio, 2));
rd.shadowMap.enabled = true;
rd.shadowMap.type = T.PCFSoftShadowMap;
rd.outputEncoding = T.sRGBEncoding;
rd.toneMapping = T.ACESFilmicToneMapping;
document.body.appendChild(rd.domElement);
const sc = new T.Scene();
sc.fog = new T.Fog(0xbcd6ee, 90, 560);
const cam = new T.PerspectiveCamera(62, 1, 0.5, 1500);
function rs() {
  rd.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener("resize", rs);
rs();
// cielo
const sky = new T.Mesh(
  new T.SphereGeometry(1000, 48, 32),
  new T.ShaderMaterial({
    uniforms: { nt: { value: 0 }, sd: { value: new T.Vector3(460, 693, 306).normalize() } },
    side: T.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader:
      "varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `uniform float nt;uniform vec3 sd;varying vec3 v;
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
void main(){vec3 d=normalize(v);float h=max(d.y,0.);
vec3 c=mix(vec3(.74,.84,.95),vec3(.16,.42,.8),pow(h,.5));
c=mix(c,vec3(.86,.88,.9),pow(1.-h,10.)*.35);
float s=max(dot(d,sd),0.),day=1.-nt;
c+=vec3(1.,.82,.55)*pow(s,6.)*.22*day+vec3(1.,.95,.82)*pow(s,90.)*.45*day;
c=mix(c,vec3(.68,.76,.84),1.-smoothstep(-.2,0.,d.y));
c*=1.-nt*.96;
vec3 nc=mix(vec3(.05,.08,.16),vec3(.008,.015,.04),pow(h,.35))*nt;
float st=step(.9975,h3(floor(d*380.)))*smoothstep(.04,.35,d.y)*smoothstep(.55,1.,nt);
gl_FragColor=vec4(c+nc*.6+vec3(st)*(.6+.4*h3(floor(d*97.))),1.);}`,
  }),
);
sc.add(sky);
let ENV = null;
// En tablets y celulares los reflejos (PMREM) fallan en varios drivers y dejan superficies negras o sin color,
// así que solo se usan en computadoras.
const TACTIL = matchMedia("(pointer:coarse)").matches;
if (!TACTIL)
  try {
    const es = new T.Scene();
    es.add(new T.Mesh(sky.geometry, sky.material));
    ENV = new T.PMREMGenerator(rd).fromScene(es, 0, 1, 2000).texture;
  } catch (e) {}
// Renderizadores por software (sin tarjeta gráfica real) dibujan los reflejos en negro: se desactivan ahí.
try {
  const g = rd.getContext(),
    ext = g.getExtension("WEBGL_debug_renderer_info"),
    nombre = ext ? String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
  if (/swiftshader|llvmpipe|software|basic render/i.test(nombre)) ENV = null;
} catch (e) {}
const sunM = new T.Mesh(
  new T.SphereGeometry(35, 16, 12),
  new T.MeshBasicMaterial({ color: 0xfff4c8, fog: false }),
);
sc.add(sunM);
const sun = new T.DirectionalLight(0xfff1d6, 1.7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc2 = sun.shadow.camera;
sc2.left = sc2.bottom = -45;
sc2.right = sc2.top = 45;
sc2.far = 300;
sc2.near = 10;
sun.shadow.bias = -0.0005;
const hemi = new T.HemisphereLight(0xcfe6ff, 0x4a5d3a, 0.75);
sc.add(sun, sun.target, hemi);
const cl = new T.Group(),
  cm = new T.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    fog: false,
  });
const cG = (() => {
  const g = new T.SphereGeometry(1, 16, 12),
    p = g.attributes.position,
    c = [];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i),
      k = 0.62 + 0.38 * Math.min(1, Math.max(0, (y + 0.5) / 1.1));
    c.push(k * 0.97, k * 0.98, k);
  }
  g.setAttribute("color", new T.Float32BufferAttribute(c, 3));
  return g;
})();
for (let i = 0; i < 18; i++) {
  const g = new T.Group(),
    a = R(0, 6.28),
    r = R(250, 800),
    n = 4 + ((Math.random() * 4) | 0);
  for (let j = 0; j < n; j++) {
    const s = new T.Mesh(cG, cm),
      q = R(22, 48) * (1 - (Math.abs(j - n / 2) / n) * 0.8);
    s.scale.set(q * R(1, 1.35), q * R(0.42, 0.55), q);
    s.position.set(j * 28 - n * 14, R(-4, 8) + q * 0.15, R(-16, 16));
    g.add(s);
  }
  g.position.set(Math.cos(a) * r, R(130, 220), Math.sin(a) * r);
  cl.add(g);
}
sc.add(cl);
// texturas
function cv(w, h, f) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  f(x, w, h);
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  t.anisotropy = 8;
  return t;
}
const gTex = cv(64, 64, (x, w, h) => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,245,210,1)");
  g.addColorStop(0.25, "rgba(255,225,160,.5)");
  g.addColorStop(1, "rgba(255,200,120,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
});
const glowM = new T.SpriteMaterial({
    map: gTex,
    blending: T.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.2,
  }),
  rGlow = new T.SpriteMaterial({
    map: gTex,
    color: 0xff3030,
    blending: T.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.2,
  });
const sunG = new T.Sprite(
  new T.SpriteMaterial({
    map: gTex,
    blending: T.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.85,
    fog: false,
  }),
);
sunG.scale.setScalar(520);
sc.add(sunG);
const nz = cv(128, 128, (x, w, h) => {
  const d = x.createImageData(w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = (90 + Math.random() * 80) | 0;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
});
nz.wrapS = nz.wrapT = T.RepeatWrapping;
let GQ = matchMedia("(pointer:coarse)").matches ? 0 : 1,
  RAIN = 0,
  rnv = 0;
const RN = 2200,
  rp = new Float32Array(RN * 6);
for (let i = 0; i < RN; i++) {
  const x = R(-45, 45),
    y = R(0, 30),
    z = R(-45, 45);
  rp[i * 6] = x;
  rp[i * 6 + 1] = y;
  rp[i * 6 + 2] = z;
  rp[i * 6 + 3] = x;
  rp[i * 6 + 4] = y - 1.3;
  rp[i * 6 + 5] = z;
}
const rgeo = new T.BufferGeometry();
rgeo.setAttribute("position", new T.BufferAttribute(rp, 3));
const rain = new T.LineSegments(
  rgeo,
  new T.LineBasicMaterial({ color: 0xb8cde0, transparent: true, opacity: 0.45, fog: false }),
);
rain.frustumCulled = false;
rain.visible = false;
sc.add(rain);
const grassT = cv(512, 512, (x, w, h) => {
  x.fillStyle = "#4c8737";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 170; i++) {
    const r = R(18, 80),
      px = R(0, w),
      py = R(0, h),
      c = `hsla(${R(78, 112) | 0},${R(28, 52) | 0}%,${R(24, 42) | 0}%,`;
    for (const ox of [-w, 0, w])
      for (const oy of [-h, 0, h]) {
        const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
        g.addColorStop(0, c + ".32)");
        g.addColorStop(1, c + "0)");
        x.fillStyle = g;
        x.fillRect(px + ox - r, py + oy - r, 2 * r, 2 * r);
      }
  }
  for (let i = 0; i < 9000; i++) {
    const px = R(0, w),
      py = R(0, h);
    x.strokeStyle = `hsla(${R(80, 118) | 0},${R(35, 60) | 0}%,${R(20, 50) | 0}%,.55)`;
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + R(-1.5, 1.5), py - R(2, 5));
    x.stroke();
  }
  for (let i = 0; i < 40; i++) {
    x.fillStyle = ["#f4e36a", "#ffffff", "#f2a6c8"][i % 3];
    x.fillRect(R(0, w), R(0, h), 2, 2);
  }
});
grassT.wrapS = grassT.wrapT = T.RepeatWrapping;
grassT.repeat.set(110, 110);
const ground = new T.Mesh(
  new T.PlaneGeometry(2000, 2000),
  new T.MeshStandardMaterial({ map: grassT, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
ground.receiveShadow = true;
sc.add(ground);
const CH = 120,
  N = 8;
let RZ = -250,
  wasJam = 0,
  CK = 0,
  wallet = 30000,
  fuel = 100,
  fuT = 0,
  fuW = 0,
  pullT = 0,
  pullSide = 0,
  CZ = 0,
  mlT = 0,
  mlDone = 0,
  R2 = -7250,
  R3 = -11250,
  R4 = -12250,
  R5 = -23250, // Rotonda de las Naciones (zona 23)
  tbT = 0,
  tbDone = 0,
  nt = 0,
  BZ = -6500,
  trT = 0,
  trOn = 0,
  tx = 0,
  trHitT = 0,
  dgOn = 0,
  dgT = 0,
  dgV = 0,
  dEm = 0,
  nit = 0,
  heat = 0,
  hst = 0,
  onFire = false,
  em = 0,
  raceOn = 0,
  raceT = 0,
  wy = -3,
  rbMsg = 0,
  skin = 0,
  sz = 0,
  st0 = 0;
const S = (t, w, h, bg, fg, fs) =>
  cv(w, h, (x) => {
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.fillStyle = fg;
    x.font = "bold " + fs + "px system-ui,Arial";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(t, w / 2, h / 2 + 2);
  });
const GZ = [-1700, -4950, -7900, -9100, -10100, -13050, -14000, -15900, -17800],
  EXRL = [[-13050, -13780]],
  EXR = [
    [-570, -1400],
    [-3470, -4300],
    [-5470, -6300],
    [-11570, -12400],
    [-4560, -4740],
    [-12580, -12820],
    [-17280, -17420],
    [-17570, -17630],
    ...GZ.map((z) => [z + 25, z - 25]),
  ],
  HB = [
    [-5190, -5310],
    [-6780, -6920],
    [-8660, -8940],
  ];
const JAM = [
    [-1050, -1950],
    [-3050, -3550],
    [-8000, -8650],
    [-9100, -9900],
    [-13050, -13900],
    [-10050, -10950],
    [-14050, -14950],
    [-19150, -19850],
    [-21000, -21235],
    [-22050, -22950],
  ],
  inJam = (z) => JAM.some((r) => z - CZ < r[0] && z - CZ > r[1]);
const RC = (z) => {
  let b = RZ;
  for (const c of [R2, R3, R4, R5]) if (Math.abs(z - c) < Math.abs(z - b)) b = c;
  return b;
};
const pn = (w, d, c, x, y, z, ry = 0) => {
  const m = new T.Mesh(
    new T.PlaneGeometry(w, d),
    new T.MeshStandardMaterial({
      color: c,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = ry;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
};
const wT = cv(128, 128, (x, w, h) => {
  x.fillStyle = "#d3d9de";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    x.fillStyle = `rgba(0,0,0,${R(0.02, 0.06)})`;
    x.fillRect(R(0, w), R(0, h), R(2, 6), R(2, 6));
  }
  for (let j = 0; j < 4; j++) {
    x.fillStyle = "rgba(0,0,0,.1)";
    x.fillRect(0, j * 32 + 29, w, 3);
  }
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const X = i * 32 + 5,
        Y = j * 32 + 6,
        g = x.createLinearGradient(X, Y, X + 22, Y + 20);
      g.addColorStop(0, "#7fa2c2");
      g.addColorStop(0.45, "#36506e");
      g.addColorStop(1, "#1c2a3d");
      x.fillStyle = "#8f9aa4";
      x.fillRect(X - 2, Y - 2, 26, 24);
      x.fillStyle = g;
      x.fillRect(X, Y, 22, 20);
      x.fillStyle = "rgba(255,255,255,.22)";
      x.beginPath();
      x.moveTo(X + 3, Y + 20);
      x.lineTo(X + 9, Y);
      x.lineTo(X + 13, Y);
      x.lineTo(X + 7, Y + 20);
      x.fill();
      x.fillStyle = "#8f9aa4";
      x.fillRect(X + 10, Y, 2, 20);
    }
});
wT.wrapS = wT.wrapT = T.RepeatWrapping;
const wE = cv(128, 128, (x, w, h) => {
  x.fillStyle = "#000";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      if (Math.random() < 0.5) {
        const X = i * 32 + 5,
          Y = j * 32 + 6;
        x.fillStyle = ["#ffd58a", "#ffe9b8", "#cfe6ff", "#ffc070"][(Math.random() * 4) | 0];
        x.globalAlpha = R(0.55, 1);
        x.fillRect(X, Y, 22, 20);
        x.globalAlpha = 1;
      }
});
wE.wrapS = wE.wrapT = T.RepeatWrapping;
const FAC = [];
const crb = cv(64, 64, (x, w, h) => {
  x.fillStyle = "#d62828";
  x.fillRect(0, 0, w, 32);
  x.fillStyle = "#fff";
  x.fillRect(0, 32, w, 32);
});
crb.wrapS = crb.wrapT = T.RepeatWrapping;
crb.repeat.set(1, CH / 3);
const facade = (w, h, d, c) => {
  const t = wT.clone();
  t.needsUpdate = true;
  t.repeat.set(w / 8, h / 8);
  const e = wE.clone();
  e.needsUpdate = true;
  e.repeat.copy(t.repeat);
  const mt = new T.MeshStandardMaterial({
    map: t,
    color: c,
    roughness: 0.45,
    metalness: 0.25,
    emissive: 0xffffff,
    emissiveMap: e,
    emissiveIntensity: 0,
  });
  FAC.push(mt);
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mt);
  m.castShadow = m.receiveShadow = true;
  return m;
};
const mm = (w, h, d, c, x, y, z, o = {}) => {
  const m = new T.Mesh(
    new T.BoxGeometry(w, h, d),
    new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o)),
  );
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
};
const roadT = cv(512, 512, (x, w, h) => {
  x.fillStyle = "#2d3035";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 16000; i++) {
    const v = R(18, 95) | 0;
    x.fillStyle = `rgba(${v},${v},${v + 5},${R(0.15, 0.5)})`;
    x.fillRect(R(0, w), R(0, h), R(1, 2.6), R(1, 2.6));
  }
  [-5.25, -1.75, 1.75, 5.25].forEach((lm) =>
    [-0.8, 0.8].forEach((o) => {
      const cx = ((lm + o + 7) / 14) * w,
        g = x.createLinearGradient(cx - 13, 0, cx + 13, 0);
      g.addColorStop(0, "rgba(8,8,10,0)");
      g.addColorStop(0.5, "rgba(8,8,10,.26)");
      g.addColorStop(1, "rgba(8,8,10,0)");
      x.fillStyle = g;
      x.fillRect(cx - 13, 0, 26, h);
    }),
  );
  for (let i = 0; i < 3; i++) {
    const v = R(32, 58) | 0;
    x.fillStyle = `rgba(${v},${v},${v + 4},.4)`;
    x.fillRect(R(40, w - 140), R(0, h - 110), R(40, 120), R(30, 110));
  }
  x.strokeStyle = "rgba(12,12,14,.55)";
  x.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    let px = R(30, w - 30),
      py = R(0, h - 100);
    x.beginPath();
    x.moveTo(px, py);
    for (let k = 0; k < 8; k++) {
      px += R(-9, 9);
      py += R(4, 13);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  x.fillStyle = "#f4f4f0";
  x.fillRect(16, 0, 8, h);
  x.fillRect(w - 24, 0, 8, h);
  x.fillRect(w * 0.25 - 3, h * 0.05, 6, h * 0.32);
  x.fillRect(w * 0.75 - 3, h * 0.05, 6, h * 0.32);
  x.fillStyle = "#ffc400";
  x.fillRect(w / 2 - 10, 0, 6, h);
  x.fillRect(w / 2 + 4, 0, 6, h);
  for (let i = 0; i < 5000; i++) {
    x.fillStyle = `rgba(40,40,44,${R(0.1, 0.45)})`;
    x.fillRect(R(0, w), R(0, h), R(1, 2), R(1, 2));
  }
});
roadT.wrapS = roadT.wrapT = T.RepeatWrapping;
roadT.repeat.set(1, CH / 14);
const roadM = new T.MeshStandardMaterial({ map: roadT, roughness: 0.85 }),
  roadG = new T.PlaneGeometry(14, CH);
// props
const M = (c) => new T.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });
const sh = (g) => {
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
};
const TG = {
    tr: new T.CylinderGeometry(0.22, 0.42, 3, 7),
    co: new T.ConeGeometry(1, 1, 8),
    ic: new T.IcosahedronGeometry(1, 0),
    dd: new T.DodecahedronGeometry(1, 0),
    pt: new T.CylinderGeometry(0.17, 0.3, 7.2, 7),
    lf: new T.BoxGeometry(0.55, 0.05, 3.8),
    nut: new T.SphereGeometry(0.2, 6, 5),
  },
  TM = {
    tr: M(0x5b3a1e),
    pt: M(0x8a6a48),
    nut: M(0x6b4a22),
    lv: [...Array(7)].map((_, i) =>
      M(new T.Color().setHSL(0.22 + i * 0.024, 0.42 + (i % 3) * 0.09, 0.2 + (i % 3) * 0.05).getHex()),
    ),
    pl: [M(0x4c9a3a), M(0x5aa83e), M(0x3f8a34)],
  };
const pk_ = (a) => a[(Math.random() * a.length) | 0];
function tree() {
  const g = new T.Group(),
    r = Math.random();
  if (r < 0.4) {
    const t = new T.Mesh(TG.tr, TM.tr);
    t.position.y = 1.5;
    g.add(t);
    const m = pk_(TM.lv);
    [
      [2.7, 3.4, 3.9],
      [2.2, 3, 5.6],
      [1.6, 2.6, 7.1],
      [1, 2.1, 8.5],
    ].forEach(([rr, hh, y]) => {
      const c = new T.Mesh(TG.co, m);
      c.scale.set(rr, hh, rr);
      c.position.y = y;
      c.rotation.y = R(0, 6);
      g.add(c);
    });
  } else if (r < 0.85) {
    const t = new T.Mesh(TG.tr, TM.tr);
    t.position.y = 1.6;
    t.scale.set(1.15, 1.1, 1.15);
    g.add(t);
    const m = pk_(TM.lv),
      n = 4 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const b = new T.Mesh(i % 2 ? TG.ic : TG.dd, m),
        s = R(1.5, 2.4);
      b.scale.set(s, s * R(0.75, 0.95), s);
      b.position.set(R(-1.3, 1.3), R(4.3, 6.4), R(-1.3, 1.3));
      b.rotation.set(R(0, 3), R(0, 3), 0);
      g.add(b);
    }
  } else {
    const tg = new T.Group(),
      t = new T.Mesh(TG.pt, TM.pt);
    t.position.y = 3.6;
    tg.add(t);
    const m = pk_(TM.pl);
    for (let i = 0; i < 8; i++) {
      const pv = new T.Group(),
        l = new T.Mesh(TG.lf, m);
      l.position.z = 1.6;
      pv.add(l);
      pv.position.y = 7.2;
      pv.rotation.set(0, (i * Math.PI) / 4 + R(-0.2, 0.2), 0);
      pv.rotateX(R(0.4, 0.8));
      tg.add(pv);
    }
    for (let i = 0; i < 3; i++) {
      const c = new T.Mesh(TG.nut, TM.nut);
      c.position.set(Math.cos(i * 2.1) * 0.3, 6.9, Math.sin(i * 2.1) * 0.3);
      tg.add(c);
    }
    tg.rotation.z = R(-0.16, 0.16);
    tg.rotation.y = R(0, 6);
    g.add(tg);
  }
  return sh(g);
}
const hc = [0xf2d0a4, 0xe9a8a0, 0xa8d0e6, 0xf5e27a, 0xbfe0b0, 0xf3efe4, 0xd8b8e6, 0x9fd6c8, 0xf6b77a],
  HRF = [0xb5482d, 0x8a3a2a, 0x6b7078, 0x3d6b8a, 0xa0522d].map(M);
const HG = {
    b: new T.BoxGeometry(7, 3.5, 7),
    r: new T.ConeGeometry(6, 2.6, 4),
    band: new T.BoxGeometry(7.06, 0.7, 7.06),
    door: new T.BoxGeometry(1.1, 2.1, 0.1),
    win: new T.BoxGeometry(1.3, 1.05, 0.1),
    fr: new T.BoxGeometry(1.55, 1.3, 0.06),
    st: new T.BoxGeometry(1.7, 0.2, 0.7),
  },
  winM = new T.MeshStandardMaterial({
    color: 0x2b4a66,
    roughness: 0.15,
    metalness: 0.3,
    emissive: 0xffc070,
    emissiveIntensity: 0,
  }),
  HDM = [M(0x6b3d22), M(0x2a5a8a), M(0x8a2a2a)],
  HFM = M(0xf7f7f2),
  HSM = M(0xb0aaa0);
function house() {
  const g = new T.Group(),
    col = new T.Color(pk_(hc)),
    b = new T.Mesh(HG.b, M(col.getHex()));
  b.position.y = 1.75;
  const r = new T.Mesh(HG.r, pk_(HRF));
  r.rotation.y = Math.PI / 4;
  r.position.y = 4.8;
  const bd = new T.Mesh(HG.band, M(col.clone().multiplyScalar(0.7).getHex()));
  bd.position.y = 0.35;
  const dr = new T.Mesh(HG.door, pk_(HDM));
  dr.position.set(1.6, 1.05, 3.52);
  const sp = new T.Mesh(HG.st, HSM);
  sp.position.set(1.6, 0.1, 3.8);
  g.add(b, r, bd, dr, sp);
  [
    [-1.5, 2, 3.52, 0],
    [3.52, 2, -0.6, Math.PI / 2],
    [-3.52, 2, -0.6, Math.PI / 2],
  ].forEach(([x, y, z, ry]) => {
    const f = new T.Mesh(HG.fr, HFM),
      w = new T.Mesh(HG.win, winM);
    f.position.set(x, y, z);
    w.position.set(x, y, z);
    f.rotation.y = w.rotation.y = ry;
    w.position.x += Math.sign(x) * (Math.abs(x) > 3 ? 0.03 : 0);
    w.position.z += z > 3 ? 0.03 : 0;
    g.add(f, w);
  });
  return sh(g);
}
function mount() {
  const rr = R(70, 140),
    hh = R(90, 210),
    ge = new T.ConeGeometry(rr, hh, 16, 7),
    p = ge.attributes.position,
    col = [],
    c = new T.Color(),
    hue = R(0.26, 0.36),
    sd = R(0, 100),
    snow = hh > 175;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      t = (y + hh / 2) / hh;
    if (t < 0.995) {
      const n =
        1 +
        0.2 * Math.sin(x * 0.045 + sd) * Math.cos(z * 0.05 + sd * 1.3) +
        0.09 * Math.sin((x + z) * 0.12 + sd);
      p.setX(i, x * n);
      p.setZ(i, z * n);
      if (t > 0.02) p.setY(i, y + Math.sin(x * 0.07 + z * 0.06 + sd) * hh * 0.035);
    }
    const nz_ = 0.5 + 0.5 * Math.sin(x * 0.11 + sd) * Math.cos(z * 0.09);
    if (t < 0.55) c.setHSL(hue + nz_ * 0.04, 0.38, 0.24 + nz_ * 0.06);
    else if (t < 0.78)
      c.setHSL(hue + 0.04, 0.22, 0.22 + nz_ * 0.05).lerp(
        new T.Color(0.42, 0.39, 0.35),
        ((t - 0.55) / 0.23) * 0.7,
      );
    else if (snow && t > 0.86) c.setRGB(0.92, 0.94, 0.97);
    else c.setRGB(0.45 + nz_ * 0.06, 0.42 + nz_ * 0.05, 0.38);
    col.push(c.r, c.g, c.b);
  }
  ge.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  ge.computeVertexNormals();
  const m = new T.Mesh(
    ge,
    new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
  );
  // radio real de la base (con el relieve), para que la montaña no se meta en la carretera
  let rb = 0;
  for (let i = 0; i < p.count; i++) rb = Math.max(rb, Math.hypot(p.getX(i), p.getZ(i)));
  m.userData.rb = rb;
  return m;
}
function pole() {
  const g = new T.Group(),
    p = new T.Mesh(new T.CylinderGeometry(0.15, 0.2, 9, 6), M(0x6b5a48));
  p.position.y = 4.5;
  const a = new T.Mesh(new T.BoxGeometry(2.4, 0.2, 0.2), M(0x4a3b2c));
  a.position.y = 8.6;
  g.add(p, a);
  return sh(g);
}
const chunks = [];
for (let i = 0; i < N; i++) {
  const g = new T.Group(),
    r = new T.Mesh(roadG, roadM);
  r.rotation.x = -Math.PI / 2;
  r.position.z = -CH / 2;
  r.receiveShadow = true;
  g.add(r);
  const pr = [];
  for (let j = 0; j < 14; j++) {
    const o = tree();
    pr.push({ o, t: 0 });
    g.add(o);
  }
  for (let j = 0; j < 7; j++) {
    const o = house();
    pr.push({ o, t: 1 });
    g.add(o);
  }
  for (let j = 0; j < 6; j++) {
    const o = mount();
    pr.push({ o, t: 2 });
    g.add(o);
  }
  for (let j = 0; j < 8; j++) {
    const o = pole();
    o.position.set(j % 2 ? -8.4 : 8.4, 0, -(j >> 1) * 30 - 12);
    g.add(o);
    pr.push({ o, t: 3 });
  }
  const bar = mm(0.9, 0.9, CH, 0xbdbdb8, 0, 0.45, -CH / 2);
  g.add(bar);
  pr.push({ o: bar, t: 5 });
  for (let j = 0; j < 4; j++) {
    const l = new T.Group(),
      e = { emissive: 0xffe9a0, emissiveIntensity: 1.2 };
    l.add(
      mm(0.25, 9, 0.25, 0x8a8f94, 0, 4.5, 0),
      mm(7, 0.2, 0.2, 0x8a8f94, 0, 9, 0),
      mm(0.9, 0.25, 0.5, 0xfff2c0, -3.4, 8.8, 0, e),
      mm(0.9, 0.25, 0.5, 0xfff2c0, 3.4, 8.8, 0, e),
    );
    l.position.set(0, 0, -15 - j * 30);
    g.add(l);
    pr.push({ o: l, t: 4 });
  }
  const rl = new T.Group();
  [-1, 1].forEach((q) =>
    rl.add(
      mm(0.3, 1, CH, 0xc8ccd0, q * 7.4, 0.55, -CH / 2),
      mm(0.9, 1.6, CH, 0xc4414d, q * 7.2, -0.8, -CH / 2),
    ),
  );
  g.add(rl);
  pr.push({ o: rl, t: 6 });
  const sl = new T.Mesh(
    new T.PlaneGeometry(7, CH * 0.8),
    new T.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.9 }),
  );
  sl.rotation.x = -Math.PI / 2;
  sl.position.set(15, 0.01, -CH / 2);
  g.add(sl);
  pr.push({ o: sl, t: 7 });
  for (let j = 0; j < 5; j++) {
    const h = 28 + j * 13,
      o = facade(9 + (j % 3) * 2, h, 9 + (j % 2) * 3, [0xc8d0d8, 0xb8c4d0, 0xd9d2c8, 0x9fb0c4, 0xc5ccd4][j]);
    g.add(o);
    pr.push({ o, t: 8, h: h / 2 });
  }
  const lrd = new T.Mesh(new T.PlaneGeometry(8, CH), roadM);
  lrd.rotation.x = -Math.PI / 2;
  lrd.position.set(-30, 0.005, -CH / 2);
  lrd.receiveShadow = true;
  g.add(lrd);
  pr.push({ o: lrd, t: 10 });
  pr.push({ o: r, t: 11 });
  {
    const bg = new T.Group();
    [-1, 1].forEach((q) => {
      for (let j = 0; j < 6; j++) {
        const bu = new T.Mesh(
          new T.SphereGeometry(0.6, 8, 6),
          new T.MeshStandardMaterial({ color: j % 2 ? 0xd62828 : 0xffffff, roughness: 0.5 }),
        );
        bu.position.set(q * 7.6, 0.1, -10 - j * 20);
        bg.add(bu);
      }
    });
    g.add(bg);
    pr.push({ o: bg, t: 12 });
    const cg = new T.Group();
    [-1, 1].forEach((q) =>
      cg.add(
        mm(0.7, 0.12, CH, 0xffffff, q * 7.35, 0.06, -CH / 2, { map: crb }),
        mm(0.9, 0.9, CH, 0x1a1a1a, q * 9.2, 0.45, -CH / 2),
        mm(0.92, 0.15, CH, 0xffffff, q * 9.2, 0.8, -CH / 2),
      ),
    );
    g.add(cg);
    pr.push({ o: cg, t: 13 });
  }
  {
    const bb = new T.Group(),
      bt = ["HOTEL", "BANCO", "FERRETERÍA", "FARMACIA", "PIZZERÍA", "TALLER"][(Math.random() * 6) | 0],
      pl2 = new T.Mesh(
        new T.PlaneGeometry(8, 3),
        new T.MeshBasicMaterial({
          map: S(
            bt,
            512,
            192,
            ["#1b4fa8", "#c8201f", "#0a6e3a", "#b8770a"][(Math.random() * 4) | 0],
            "#fff",
            72,
          ),
        }),
      );
    pl2.position.y = 8.5;
    bb.add(mm(0.4, 8, 0.4, 0x666666, 0, 4, 0), pl2, mm(8.2, 3.2, 0.1, 0x444444, 0, 8.5, -0.1));
    g.add(bb);
    pr.push({ o: bb, t: 9 });
  }
  sc.add(g);
  chunks.push({ g, k: i, pr });
}
function scatter(c) {
  const zn = Math.floor((c.k * CH + CH / 2) / 1000) % NZ,
    Z = (...a) => a.includes(zn);
  c.pr.forEach((p) => {
    const s = Math.random() < 0.5 ? -1 : 1,
      o = p.o,
      t = p.t,
      wz = () => -c.k * CH + o.position.z,
      w = () => Math.abs(wz() - RC(wz())) < 135, // rotondas (y los carriles externos de La Y Griega)
      nb = () => Math.abs(wz() - BZ) < 140,
      hz = () => HB.some((r) => wz() - CZ < r[0] && wz() - CZ > r[1]),
      rt = () =>
        (o.position.x > 3 && EXR.some((r) => wz() - CZ < r[0] && wz() - CZ > r[1])) ||
        (o.position.x < -3 && EXRL.some((r) => wz() - CZ < r[0] && wz() - CZ > r[1])),
      lf = () => {
        if (Math.abs(o.position.x + 30) < 10) o.position.x = -42 - R(0, 8);
      },
      zc = -c.k * CH - CH / 2 - CZ;
    if (p.f) return p.f(c, p, zn, { s, nb, hz, rt, w }); // lotes de js/mundo.js
    if (t == 11) {
      o.visible = !Z(16);
      return;
    }
    if (t == 12) {
      o.visible = Z(16);
      return;
    }
    if (t == 13) {
      o.visible = Z(17);
      return;
    }
    if (t == 10) {
      o.visible = Z(0, 1, 3, 4, 7, 8, 9, 13, 14, 15) && !HB.some((r) => zc < r[0] + 60 && zc > r[1] - 60);
      return;
    }
    if (t == 9) {
      o.position.set(s * R(12, 18), 0, -R(10, CH - 10));
      o.visible = Z(0, 1, 3, 4, 7, 8, 9, 11, 13, 14, 15, 19, 20, 21, 23) && !hz() && !rt() && !nb();
      return;
    }
    if (t == 3) {
      o.visible = !w() && !nb() && Z(0, 3, 4, 7, 9, 11, 13, 14, 15, 21, 23) && !hz() && !rt();
      return;
    }
    if (t == 4) {
      o.visible = Z(1, 9, 25, 30);
      return;
    }
    if (t == 5) {
      o.visible = Z(1, 4, 9, 25, 30);
      return;
    }
    if (t == 6) {
      o.visible = Z(2, 10);
      return;
    }
    if (t == 7) {
      o.visible = Z(3, 13);
      return;
    }
    if (t == 8) {
      o.position.set(s * R(18, 50), p.h, -R(0, CH));
      lf();
      o.visible = Z(8) && !w() && !hz() && !rt();
      return;
    }
    const f = Z(3, 5, 6, 24, 27);
    if (t == 0) {
      o.position.set(s * (Z(1) ? R(15, 45) : f ? R(9, 36) : R(11, 48)), 0, -R(0, CH));
      o.scale.setScalar(f ? R(1.3, 2.6) : R(0.8, 1.5));
      lf();
      o.visible = !Z(2, 8, 16, 18, 19, 20, 28, 29) && !nb() && !hz() && !rt();
      if (w()) o.position.x = s * R(90, 120);
    } else if (t == 1) {
      o.position.set(s * R(13, 32), 0, -R(0, CH));
      o.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      lf();
      o.visible = Z(0, 4, 7, 13, 21, 23) && !nb() && !hz() && !rt();
      if (w()) o.position.x = s * R(90, 120);
    } else {
      // montañas: el borde de la base queda siempre lejos de la carretera y de las calles laterales
      const k = R(0.8, 1.7),
        borde =
          (Z(5, 6, 24) ? 55 + R(0, 110) : Z(2, 16) ? 140 + R(0, 220) : 80 + R(0, 240)) +
          (Z(8) && s > 0 ? 170 : 0); // zona 8: deja libre la carretera a Vara Blanca
      o.scale.setScalar(k);
      o.position.set(s * (o.userData.rb * k + borde), (o.geometry.parameters.height * k) / 2 - 4, -R(0, CH));
      o.visible = !Z(27) && !((s < 0 && Z(26)) || (s > 0 && Z(30, 31))); // ni en el mar, la bahía, el canal ni encima de los volcanes
    }
  });
}
chunks.forEach(scatter);
// autobus
const bus = new T.Group(),
  body = new T.Group();
bus.add(body);
const bx = (w, h, d, c, x, y, z, o = {}) => {
  const m = new T.Mesh(
    new T.BoxGeometry(w, h, d),
    new T.MeshPhysicalMaterial(
      Object.assign(
        {
          color: c,
          roughness: 0.35,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          side: T.DoubleSide,
          envMap: ENV,
          envMapIntensity: 0.3,
        },
        o,
      ),
    ),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  body.add(m);
  return m;
};
// Carrocería: antes era una sola caja que tapaba las ventanas (desde adentro solo se veía blanco).
// Ahora: parte baja hasta la línea de ventanas (y=1.75), techo aparte, columnas y vidrios de verdad.
const mBody = bx(2.6, 1.35, 11.5, 0xf4f6f8, 0, 1.075, 0),
  mB1 = bx(2.62, 0.4, 11.52, 0x3aa8d8, 0, 0.72, 0),
  mB2 = bx(2.63, 0.4, 11.53, 0x1a3a8a, 0, 1.12, 0),
  mFr = bx(2.62, 0.8, 0.06, 0x1a3a8a, 0, 1.1, -5.78);
const mTecho = bx(2.6, 0.25, 11.5, 0xf4f6f8, 0, 2.875, 0);
mTecho.material = mBody.material; // mismo color que la carrocería (cambia con la pintura)
bx(2.5, 0.12, 11.2, 0xdcdfe3, 0, 3.05, 0);
bx(1.6, 0.3, 2.2, 0xaab0b6, 0, 3.25, -1);
// vidrios laterales y trasero: un poco polarizados
const gl = {
  color: 0x6d8fa3,
  roughness: 0.02,
  metalness: 0.1,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
};
// parabrisas: claro para ver bien desde la cabina
const glF = {
  color: 0xdff2fa,
  roughness: 0.01,
  metalness: 0.1,
  transparent: true,
  opacity: 0.09,
  depthWrite: false,
};
bx(0.06, 1, 9.8, 0, 1.325, 2.25, 0.2, gl);
bx(0.06, 1, 9.8, 0, -1.325, 2.25, 0.2, gl);
[-1, 1].forEach((s) => {
  bx(0.06, 1, 1, 0, s * 1.325, 2.25, -5.22, glF); // ventanita lateral junto al chofer
  bx(0.1, 1, 0.12, 0x1c1f24, s * 1.32, 2.25, -4.72); // columna detrás de la ventanita
  bx(0.07, 1.05, 0.08, 0x1c1f24, s * 1.27, 2.25, -5.74); // columnas del parabrisas
  bx(0.08, 1, 0.65, 0xf4f6f8, s * 1.31, 2.25, 5.43).material = mBody.material; // cierre trasero
  bx(0.16, 1, 0.1, 0xf4f6f8, s * 1.22, 2.25, 5.74).material = mBody.material;
});
bx(2.4, 1.3, 0.06, 0, 0, 2.2, -5.77, glF); // PARABRISAS
bx(2.5, 0.08, 0.1, 0x111317, 0, 2.77, -5.76); // marco de hule superior
bx(2.5, 0.08, 0.1, 0x111317, 0, 1.77, -5.76); // marco inferior
bx(2.38, 0.2, 0.07, 0x1b4f63, 0, 2.64, -5.775, { transparent: true, opacity: 0.55, depthWrite: false }); // franja polarizada
// limpiaparabrisas
[
  [-0.62, 0.22],
  [0.52, 0.3],
].forEach(([x, a]) => {
  const w = bx(0.95, 0.03, 0.03, 0x15171a, x, 1.86, -5.82);
  w.rotation.z = a;
});
// tablero a todo lo ancho, retrovisor interno y visera
bx(2.4, 0.12, 0.55, 0x2a2f36, 0, 1.8, -5.45);
bx(0.24, 0.07, 0.03, 0x111317, 0.1, 2.66, -5.64);
bx(0.6, 0.03, 0.2, 0x2a2f36, -0.8, 2.735, -5.55);
bx(2.3, 1, 0.06, 0, 0, 2.2, 5.77, gl);
for (let z = -3.2; z < 5; z += 1.6) [-1, 1].forEach((s) => bx(0.08, 1, 0.12, 0xf4f6f8, s * 1.33, 2.25, z));
bx(0.12, 0.6, 0.25, 0x111, -1.55, 2.1, -5.1);
bx(0.12, 0.6, 0.25, 0x111, 1.55, 2.1, -5.1);
bx(2.65, 0.5, 0.3, 0xf4f6f8, 0, 0.55, -5.8);
bx(2.65, 0.5, 0.3, 0xf4f6f8, 0, 0.55, 5.8);
const hl = { color: 0xfff6c0, emissive: 0xfff2a0, emissiveIntensity: 1.5 };
[-0.95, 0.95].forEach((x) => {
  const m = bx(0.4, 0.25, 0.1, 0, x, 0.9, -5.78, hl),
    sp = new T.Sprite(glowM);
  sp.scale.setScalar(2.4);
  m.add(sp);
});
const tm = new T.MeshStandardMaterial({ color: 0x550000, emissive: 0xff0000, emissiveIntensity: 0.3 });
[-0.95, 0.95].forEach((x) => {
  const m = new T.Mesh(new T.BoxGeometry(0.4, 0.25, 0.1), tm),
    sp = new T.Sprite(rGlow);
  sp.scale.setScalar(1.8);
  m.add(sp);
  m.position.set(x, 0.9, 5.78);
  body.add(m);
});
const sm = new T.MeshBasicMaterial({
    map: S("GRUPO ATD  ·  AUTOTRANSPORTES DESAMPARADOS", 1024, 48, "#1a3a8a", "#fff", 34),
  }),
  sp = new T.PlaneGeometry(8.6, 0.4);
[1, -1].forEach((s) => {
  const m = new T.Mesh(sp, sm);
  m.position.set(s * 1.33, 1.12, 0.1);
  m.rotation.y = (s * Math.PI) / 2;
  body.add(m);
});
const dm_ = new T.Mesh(
  new T.PlaneGeometry(2, 0.4),
  new T.MeshBasicMaterial({ map: S("SAN JOSÉ - DESAMPARADOS", 512, 96, "#111", "#ffb020", 44) }),
);
dm_.position.set(0, 2.92, -5.79);
dm_.rotation.y = Math.PI;
const ck = new T.Mesh(
  new T.PlaneGeometry(2.5, 0.16),
  new T.MeshBasicMaterial({
    map: cv(256, 24, (x, w, h) => {
      for (let i = 0; i < 32; i++)
        for (let j = 0; j < 3; j++) {
          x.fillStyle = (i + j) % 2 ? "#d62828" : "#fff";
          x.fillRect(i * 8, j * 8, 8, 8);
        }
    }),
  }),
);
ck.position.set(0, 1.25, -5.82);
ck.rotation.y = Math.PI;
body.add(ck);
const gt = new T.Mesh(
  new T.PlaneGeometry(1.1, 0.22),
  new T.MeshBasicMaterial({ map: S("GRUPO ATD", 256, 52, "#1a3a8a", "#fff", 36) }),
);
gt.position.set(-0.6, 1.45, -5.82);
gt.rotation.y = Math.PI;
body.add(gt);
const SK = [
  {
    b: 0xf4f6f8,
    s: 0x3aa8d8,
    t: 0x1a3a8a,
    side: "GRUPO ATD  ·  AUTOTRANSPORTES DESAMPARADOS",
    bg: "#1a3a8a",
    dest: "SAN JOSÉ - DESAMPARADOS",
    fr: "GRUPO ATD",
  },
  {
    b: 0xc8201f,
    s: 0xf2f2f2,
    t: 0xc8201f,
    side: "TUBULARIAS · SANTA TERESA · ORIENTE",
    bg: "#a81818",
    dest: "CAIO",
    fr: "SANTA TERESA",
  },
  {
    b: 0xf1ede0,
    s: 0xe5b323,
    t: 0xe7e2d0,
    side: "COSTA RICA · MERCEDES-BENZ",
    bg: "#d9a81e",
    dest: "MERCEDES-BENZ",
    fr: "ICE",
  },
  {
    b: 0xf4f6f8,
    s: 0x8fd3e8,
    t: 0x1b3fb0,
    side: "GRUPO ATD  ·  DESAMPARADOS  ·  PORVENIR",
    bg: "#1b3fb0",
    dest: "28 · PORVENIR",
    fr: "DESAMPARADOS",
  },
];
// Buses extra que se manejan con la misma carrocería del bus (js/mundo3.js): vehículo → pintura de SK.
const BUS_EXTRA = {},
  esBus = (i) => i < 4 || BUS_EXTRA[i] != null;
function applySkin(i) {
  const k = SK[i],
    fg = k.fg || (i == 2 ? "#222" : "#fff");
  mBody.material.color.setHex(k.b);
  mB1.material.color.setHex(k.s);
  mB2.material.color.setHex(k.t);
  mFr.material.color.setHex(k.t);
  [
    [sm, S(k.side, 1024, 48, k.bg, fg, 34)],
    [dm_.material, S(k.dest, 512, 96, "#111", "#ffb020", 44)],
    [gt.material, S(k.fr, 256, 52, k.bg, fg, 36)],
  ].forEach(([m, t]) => {
    m.map = t;
    m.needsUpdate = true;
  });
}
const hs = new T.SpotLight(0xfff3d0, 2.2, 80, 0.55, 0.5);
hs.position.set(0, 1, -5.6);
hs.target.position.set(0, 0, -30);
bus.add(hs, hs.target);
// ===== otros vehículos =====
let cur = body,
  PV,
  PB,
  VWL = [];
const VM = {};
const wh = (g, r, w, x, y, z, c, hc, L) => {
  const p = new T.Group(),
    t = new T.Mesh(
      new T.CylinderGeometry(r, r, w, 18).rotateZ(Math.PI / 2),
      new T.MeshStandardMaterial({ color: c, roughness: 0.9 }),
    ),
    h = new T.Mesh(
      new T.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 12).rotateZ(Math.PI / 2),
      new T.MeshStandardMaterial({ color: hc, metalness: 0.8, roughness: 0.3 }),
    );
  t.castShadow = true;
  p.add(t, h);
  p.position.set(x, y, z);
  p.userData.r = r;
  g.add(p);
  L.push(p);
  return p;
};
const lt = (x, y, z) => {
    const m = mm(0.4, 0.25, 0.1, 0xfff6c0, x, y, z, { emissive: 0xfff2a0, emissiveIntensity: 1.5 }),
      sp = new T.Sprite(glowM);
    sp.scale.setScalar(1.8);
    m.add(sp);
    return m;
  },
  CH2 = { metalness: 0.9, roughness: 0.2 };
function mkV(k, fn) {
  const g = new T.Group(),
    w = [];
  fn(g, w);
  g.traverse((o) => {
    if (o.isMesh && o.material && o.material.roughness === 0.8 && !o.material.envMap) {
      o.material.envMap = ENV;
      o.material.envMapIntensity = 0.15;
    }
  });
  g.visible = false;
  bus.add(g);
  VM[k] = { g, w };
}
mkV(4, (g, w) => {
  const r = 0xc8201f,
    b = 0x1a1a1a,
    tn = 0xb07a45;
  g.add(
    mm(1.8, 0.7, 3.2, r, 0, 0.9, 0),
    mm(1.7, 0.5, 1.2, r, 0, 1.3, -1.05),
    mm(1.9, 0.35, 0.25, b, 0, 0.7, -1.75),
    mm(1.5, 0.9, 0.06, 0xbfe0f0, 0, 1.75, -0.55, { transparent: true, opacity: 0.4 }),
    mm(0.9, 0.4, 0.9, tn, -0.4, 1.35, 0.3),
    mm(0.9, 0.4, 0.9, tn, 0.4, 1.35, 0.3),
    mm(0.9, 0.8, 0.15, tn, -0.4, 1.8, 0.8),
    mm(0.9, 0.8, 0.15, tn, 0.4, 1.8, 0.8),
    mm(1.8, 0.08, 0.08, b, 0, 2.6, -0.55),
    mm(1.8, 0.08, 0.08, b, 0, 2.6, 1.2),
    mm(0.04, 1.6, 0.04, b, -0.9, 2.2, 1.5),
  );
  [-0.9, 0.9].forEach((x) =>
    g.add(
      mm(0.08, 1.2, 0.08, b, x, 2.0, -0.55),
      mm(0.08, 1.2, 0.08, b, x, 2.0, 1.2),
      mm(0.08, 0.08, 1.8, b, x, 2.6, 0.3),
      mm(0.5, 0.15, 1.4, 0x333333, x, 1.45, -1),
      mm(0.5, 0.15, 1.4, 0x333333, x, 1.45, 1.1),
    ),
  );
  [-0.55, -0.2, 0.2, 0.55].forEach((x) =>
    g.add(mm(0.22, 0.22, 0.22, 0xfff6c0, x, 2.75, -0.55, { emissive: 0xfff2a0, emissiveIntensity: 1.5 })),
  );
  [
    [-0.95, -1.1],
    [0.95, -1.1],
    [-0.95, 1.1],
    [0.95, 1.1],
  ].forEach(([x, z]) => wh(g, 0.62, 0.5, x, 0.62, z, 0x151515, 0xaaaaaa, w));
});
mkV(5, (g, w) => {
  const gr = 0x7aa93a,
    tn = 0xd8c288;
  g.add(
    mm(2.4, 0.8, 4.2, gr, 0, 1, 0),
    mm(2.2, 0.35, 1.4, gr, 0, 1.25, -2),
    mm(1.7, 0.7, 1.9, gr, 0, 1.75, 0.3),
    mm(0.22, 0.22, 2.4, 0x555555, 0, 1.85, -1.6),
    mm(0.05, 1.4, 0.05, 0x111111, 0.7, 2.9, 1),
  );
  [-1, 1].forEach((q) => {
    g.add(mm(0.8, 0.9, 4.4, tn, q * 1.45, 0.5, 0, { roughness: 1 }));
    for (let i = 0; i < 4; i++) wh(g, 0.55, 0.8, q * 1.45, 0.55, -1.65 + i * 1.1, 0xd8c288, 0x444444, w);
    const p = new T.Mesh(
      new T.PlaneGeometry(1.2, 0.4),
      new T.MeshBasicMaterial({ map: S("MCR", 128, 43, "#7aa93a", "#111", 30) }),
    );
    p.position.set(q * 0.86, 1.8, 0.3);
    p.rotation.y = (q * Math.PI) / 2;
    g.add(p);
  });
});
mkV(6, (g, w) => {
  const y = 0xe3b100;
  g.add(
    mm(1.6, 0.9, 1.4, y, 0, 1.45, 0.7),
    mm(1.3, 0.35, 1.3, y, 0, 1, -0.2),
    mm(1.4, 0.1, 1.4, y, 0, 2, 0.7),
    mm(0.95, 0.9, 0.12, 0xdddddd, 0, 1, -1.7, CH2),
    mm(0.8, 0.5, 0.9, 0x888888, 0, 1.55, -0.9, CH2),
    mm(1.7, 0.3, 3.6, 0x222222, 0, 0.5, 0),
    lt(0, 1, -1.78),
  );
  [-0.5, 0, 0.5].forEach((x) => g.add(mm(0.12, 0.12, 1.4, 0xcccccc, x * 0.9, 1.95, -1, CH2)));
  [-1, 1].forEach((q) =>
    g.add(
      mm(0.12, 0.12, 2.4, 0xcccccc, q * 0.95, 0.55, 0.3, CH2),
      mm(0.12, 0.12, 0.12, 0xcccccc, q * 0.9, 1.2, -1.3, CH2),
    ),
  );
  [-1, 1].forEach((q) => {
    wh(g, 0.45, 0.28, q * 0.85, 0.45, -1.6, 0x151515, 0xc8201f, w);
    wh(g, 0.6, 0.55, q * 0.95, 0.6, 1.2, 0x151515, 0xc8201f, w);
  });
});
mkV(7, (g, w) => {
  const b = 0x2a56b8,
    rd = 0xc8201f,
    bk = 0x9c8a6a;
  g.add(
    mm(1.4, 1.1, 2, b, 0, 1.5, 0.4),
    mm(1, 0.8, 1.6, b, 0, 1.3, -1.2),
    mm(0.9, 0.7, 0.1, 0xcfcfcf, 0, 1.3, -2.05, CH2),
    mm(1.2, 0.9, 1, 0x8a5a32, 0, 2.3, 0.8),
    mm(1.5, 0.08, 1.4, b, 0, 2.9, 0.8),
    mm(1.8, 0.12, 1.3, bk, 0, 0.5, -3.3),
    mm(1.8, 0.7, 0.1, bk, 0, 0.85, -3.9),
    mm(0.1, 0.7, 1.3, bk, -0.9, 0.85, -3.3),
    mm(0.1, 0.7, 1.3, bk, 0.9, 0.85, -3.3),
  );
  [-0.25, 0.25].forEach((x) => g.add(mm(0.12, 1.4, 0.12, 0xcccccc, x, 2.3, -0.7, CH2)));
  [-1, 1].forEach((q) => {
    wh(g, 0.9, 0.6, q * 1.15, 0.9, 1.1, 0x151515, rd, w);
    wh(g, 0.5, 0.35, q * 0.85, 0.5, -1.5, 0x151515, rd, w);
    g.add(mm(0.14, 0.14, 2.6, rd, q * 0.9, 1, -2), mm(0.14, 0.8, 0.14, rd, q * 0.9, 1.3, -0.8));
  });
});
mkV(8, (g, w) => {
  const o = 0xe08a1e;
  g.add(
    mm(1, 0.5, 2.4, o, 0, 0.8, 0),
    mm(0.9, 0.4, 1.1, o, 0, 0.95, -1.3),
    mm(0.8, 0.9, 0.06, 0xcfe8f5, 0, 1.6, -0.7, { transparent: true, opacity: 0.4 }),
    mm(0.8, 0.25, 1.3, 0x6b5a48, 0, 1.15, 0.9),
    mm(0.7, 0.35, 2.2, 0x111111, 0, 0.3, 0.8),
    mm(1.4, 0.06, 0.06, 0x333333, 0, 1.3, -0.5),
    lt(0, 1, -1.9),
  );
  [-0.6, 0.6].forEach((x) => {
    const k = mm(0.18, 0.1, 1.9, 0x222222, x, 0.2, -1.1);
    k.rotation.x = 0.12;
    g.add(k);
  });
  [-0.8, -0.1, 0.6, 1.4].forEach((z) => wh(g, 0.2, 0.7, 0, 0.25, z, 0x333333, 0x777777, w));
});
mkV(9, (g, w) => {
  const o = 0xb8672a,
    wg = new T.Group(),
    pr = new T.Group();
  g.add(
    mm(1.2, 0.6, 1.8, o, 0, 1, 0),
    mm(0.9, 0.3, 0.9, 0x555555, 0, 1.4, 0.3),
    mm(0.08, 3, 0.08, 0x222222, 0, 2.8, -0.4),
    mm(0.08, 3, 0.08, 0x222222, -0.5, 2.8, 0.5),
    mm(0.08, 3, 0.08, 0x222222, 0.5, 2.8, 0.5),
    mm(0.06, 0.06, 1.2, 0x222222, 0, 0.6, -1.2),
    mm(0.5, 0.5, 0.5, o, 0, 1.4, 1),
  );
  wg.add(
    mm(7.5, 0.12, 2.6, 0xcfdde6, 0, 0, 0),
    mm(7.6, 0.13, 0.4, 0xc8662a, -1.2, 0, -0.2),
    mm(7.6, 0.13, 0.4, 0xc8662a, 1.2, 0, -0.2),
  );
  wg.position.y = 4.5;
  g.add(wg);
  g.userData.wing = wg;
  [-0.9, 0.9].forEach((x) => wh(g, 0.4, 0.3, x, 0.4, 0.7, 0x222222, 0xc8662a, w));
  wh(g, 0.33, 0.25, 0, 0.33, -1.4, 0x222222, 0xc8662a, w);
  pr.add(mm(0.08, 1.4, 0.2, 0x222222, 0, 0, 0));
  pr.position.set(0, 1.5, 1.3);
  g.add(pr);
  g.userData.pr = pr;
});
mkV(10, (g, w) => {
  g.add(
    mm(2.4, 0.5, 2.8, 0x3a3d42, 0, 1, 0),
    mm(2.5, 0.25, 2.9, 0xe0a21a, 0, 1.25, 0),
    mm(0.3, 0.3, 0.3, 0xeeeeee, 0, 2.8, 0.2),
    mm(0.04, 1.2, 0.04, 0xaaaaaa, 0.9, 2, 0.9),
    lt(-0.7, 1.1, -1.45),
    lt(0.7, 1.1, -1.45),
  );
  const d = new T.Mesh(
    new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new T.MeshStandardMaterial({
      color: 0xcfe6f2,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.2,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );
  d.position.set(0, 1.35, -0.2);
  d.scale.setScalar(1.15);
  g.add(d);
  const ds = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), M(0xdddddd));
  ds.position.set(0.9, 2.7, 0.9);
  g.add(ds);
  [-1.2, 0, 1.2].forEach((z) =>
    [-1, 1].forEach((q) => {
      g.add(mm(0.8, 0.1, 0.1, 0xaaaaaa, q * 1.4, 0.85, z));
      wh(g, 0.55, 0.35, q * 1.8, 0.55, z, 0x151515, 0xdddddd, w);
    }),
  );
});
mkV(11, (g, w) => {
  const o = 0xe58a1f,
    k = 0x222222;
  g.add(
    mm(0.9, 0.5, 3.2, o, 0, 0.6, 0),
    mm(0.55, 0.3, 1.6, o, 0, 0.45, -2.1),
    mm(0.8, 0.12, 0.9, k, 0, 0.9, -0.2),
    mm(2, 0.08, 0.55, o, 0, 0.22, -2.8),
    mm(0.08, 0.3, 0.55, o, -1, 0.3, -2.8),
    mm(0.08, 0.3, 0.55, o, 1, 0.3, -2.8),
    mm(0.55, 0.7, 0.7, 0x888888, 0, 1, 0.7, CH2),
    mm(2, 0.1, 0.7, o, 0, 1.55, 2),
    mm(0.1, 0.7, 0.7, o, -1, 1.25, 2),
    mm(0.1, 0.7, 0.7, o, 1, 1.25, 2),
    mm(0.1, 0.8, 0.1, k, 0, 1, 1.9),
    mm(0.5, 0.4, 1.6, o, -0.7, 0.55, 0.3),
    mm(0.5, 0.4, 1.6, o, 0.7, 0.55, 0.3),
  );
  const hh = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), M(0xeeeeee));
  hh.position.set(0, 1.05, -0.2);
  g.add(hh);
  [-0.9, 0.9].forEach((x) => {
    wh(g, 0.38, 0.35, x, 0.38, -1.5, 0x151515, 0xbbbbbb, w);
    wh(g, 0.46, 0.5, x * 1.02, 0.46, 1.5, 0x151515, 0xbbbbbb, w);
  });
});
mkV(12, (g, w) => {
  const c = 0x2bb5c0,
    o = 0xe08a1e;
  g.add(
    mm(2, 1.8, 1.7, c, 0, 1.9, 0.2),
    mm(1.9, 0.9, 1.6, c, 0, 1.3, -1.6),
    mm(0.9, 0.55, 0.9, 0xcccccc, 0, 2, -1.7, CH2),
    mm(1.7, 1, 0.15, 0xdddddd, 0, 1.2, -2.45, CH2),
    mm(2.3, 0.4, 0.4, 0xcccccc, 0, 0.6, -2.7, CH2),
    mm(1.7, 0.5, 5.6, 0x222222, 0, 0.7, 0.4),
    mm(1.9, 0.5, 2.2, o, 0, 1, 1.9),
    mm(1.5, 1.1, 0.08, 0xbfe0f0, 0, 2.3, -0.6, { transparent: true, opacity: 0.45 }),
    mm(2.4, 0.12, 0.9, 0xdddddd, 0, 3.4, 2.3),
    mm(0.12, 1.2, 0.12, 0x222222, -0.9, 2.8, 2.3),
    mm(0.12, 1.2, 0.12, 0x222222, 0.9, 2.8, 2.3),
    lt(-0.7, 1.2, -2.55),
    lt(0.7, 1.2, -2.55),
  );
  [-1, 1].forEach((q) => {
    g.add(mm(0.12, 1.2, 0.12, 0xcccccc, q * 1.1, 3, -0.4, CH2), mm(0.5, 0.3, 1.3, o, q * 1.05, 0.9, -1.8));
    wh(g, 0.6, 0.45, q * 1.05, 0.6, -1.8, 0x151515, 0xbbbbbb, w);
    wh(g, 0.65, 0.55, q * 1.05, 0.65, 1.9, 0x151515, 0xbbbbbb, w);
  });
});
mkV(13, (g, w) => {
  const c = 0x2fb34a,
    b = 0x222222;
  g.add(
    mm(1.8, 1, 1.8, c, 0, 2.6, 0.2),
    mm(1.7, 0.6, 1.5, c, 0, 2.2, -1.5),
    mm(1.7, 0.9, 0.15, 0xdddddd, 0, 2.3, -2.3, CH2),
    mm(1.8, 0.6, 1.8, c, 0, 2.3, 1.6),
    mm(1.5, 0.9, 0.06, 0xbfe0f0, 0, 2.95, -0.7, { transparent: true, opacity: 0.45 }),
    mm(2, 0.5, 4.8, b, 0, 1.6, 0),
    mm(0.08, 1, 0.08, b, -0.8, 3.3, 0.9),
    mm(0.08, 1, 0.08, b, 0.8, 3.3, 0.9),
    mm(1.7, 0.08, 0.08, b, 0, 3.8, 0.9),
    mm(0.15, 1.4, 0.15, 0xaaaaaa, 0.9, 3.2, -0.6, CH2),
    lt(-0.6, 2.3, -2.4),
    lt(0.6, 2.3, -2.4),
  );
  [
    [-1.5, -1.6],
    [1.5, -1.6],
    [-1.5, 1.7],
    [1.5, 1.7],
  ].forEach(([x, z]) => {
    wh(g, 1.1, 0.9, x, 1.1, z, 0x2a1d14, 0xbbbbbb, w);
    g.add(mm(0.14, 1.2, 0.14, 0xf2c200, x * 0.8, 1.8, z));
  });
});
mkV(14, (g, w) => {
  const c = 0x2b79d6;
  g.add(
    mm(1.7, 0.7, 3.4, c, 0, 0.85, 0),
    mm(1.5, 0.55, 1.7, c, 0, 1.45, 0.2),
    mm(1.52, 0.4, 1.6, 0xbfe0f0, 0, 1.5, 0.2, { transparent: true, opacity: 0.5 }),
    mm(0.8, 0.12, 0.9, 0x1a1a1a, 0, 1.2, -1.1),
    mm(1.8, 0.3, 0.3, 0x888888, 0, 0.55, -1.8),
    mm(1.7, 0.1, 0.5, 0x222222, 0, 1.65, 1.8),
    mm(0.1, 0.4, 0.1, 0x222222, -0.7, 1.45, 1.8),
    mm(0.1, 0.4, 0.1, 0x222222, 0.7, 1.45, 1.8),
    lt(-0.6, 0.9, -1.72),
    lt(0.6, 0.9, -1.72),
  );
  [-1, 1].forEach((q) =>
    [-1.2, 1.2].forEach((z) => wh(g, 0.42, 0.3, q * 0.9, 0.42, z, 0x151515, 0xbbbbbb, w)),
  );
});
const smT = cv(64, 64, (x, w, h) => {
  for (let i = 0; i < 7; i++) {
    const px = 32 + R(-9, 9),
      py = 32 + R(-9, 9),
      r = R(12, 24),
      g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,.5)");
    g.addColorStop(0.6, "rgba(255,255,255,.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }
});
const FX = [];
for (let i = 0; i < 80; i++) {
  const m = new T.Sprite(
    new T.SpriteMaterial({ map: smT, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
  );
  m.visible = false;
  sc.add(m);
  FX.push({ m, t: 0, l: 1, v: new T.Vector3() });
}
const fireL = new T.PointLight(0xff7a18, 0, 22);
sc.add(fireL);
mkV(15, (g, w) => {
  const y = 0xf2c200,
    k = 0x151515;
  g.add(
    mm(1.5, 0.6, 2.2, y, 0, 0.95, 0.2),
    mm(1.4, 0.45, 1.2, y, 0, 1, -1.1),
    mm(0.6, 0.4, 0.5, k, 0, 1.3, -0.4),
    mm(0.9, 0.35, 0.9, k, 0, 1.35, 0.8),
    mm(1.6, 0.15, 0.3, k, 0, 0.8, -1.75),
    mm(0.9, 0.5, 0.06, 0xbfe0f0, 0, 1.55, -0.7, { transparent: true, opacity: 0.4 }),
    mm(0.12, 1.1, 0.12, 0xcccccc, -0.6, 1.5, 1.2, CH2),
    lt(-0.4, 1, -1.72),
    lt(0.4, 1, -1.72),
  );
  [-1, 1].forEach((q) => {
    g.add(mm(0.55, 0.6, 3.2, k, q * 0.95, 0.5, 0.1), mm(0.6, 0.15, 3.3, y, q * 0.95, 0.85, 0.1));
    [-1.2, -0.4, 0.4, 1.2].forEach((z) => wh(g, 0.3, 0.55, q * 0.95, 0.35, z, 0x2a2a2a, 0xf2c200, w));
  });
  const hd = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), M(0xe0b08a));
  hd.position.set(0, 2.2, 0.5);
  g.add(mm(0.5, 0.7, 0.35, 0x151f3a, 0, 1.7, 0.5), hd);
});
mkV(16, (g, w) => {
  const o = 0xe8561a,
    k = 0x151515;
  g.add(
    mm(2.7, 0.55, 5.3, k, 0, 0.4, 0),
    mm(2.2, 0.7, 4.6, o, 0, 1, 0),
    mm(1.9, 0.45, 1.6, o, 0, 0.95, -2.4),
    mm(1.7, 0.6, 0.06, 0xbfe0f0, 0, 1.7, -1, { transparent: true, opacity: 0.4 }),
    mm(0.08, 1.2, 0.08, k, -0.8, 1.8, -0.9),
    mm(0.08, 1.2, 0.08, k, 0.8, 1.8, -0.9),
    mm(1.7, 0.08, 0.08, k, 0, 2.4, -0.9),
    mm(0.5, 0.4, 0.5, 0x666666, -0.5, 1.5, 0.2),
    mm(0.5, 0.4, 0.5, 0x666666, 0.5, 1.5, 0.2),
    mm(0.5, 0.4, 0.5, 0x666666, 0, 1.5, 0.9),
    lt(-0.5, 1, -2.65),
    lt(0.5, 1, -2.65),
  );
  const du = new T.Mesh(
    new T.CylinderGeometry(1.15, 1.15, 0.5, 24, 1, true).rotateX(Math.PI / 2),
    new T.MeshStandardMaterial({ color: o, side: T.DoubleSide, roughness: 0.4, metalness: 0.3 }),
  );
  du.position.set(0, 2, 2.3);
  g.add(du);
  const fan = new T.Group();
  for (let i = 0; i < 4; i++) {
    const b = mm(0.18, 2, 0.05, 0x222222, 0, 0, 0);
    b.rotation.z = (i * Math.PI) / 4;
    fan.add(b);
  }
  fan.position.set(0, 2, 2.3);
  g.add(fan);
  g.userData.fan = fan;
  [-0.5, 0.5].forEach((x) => g.add(mm(0.08, 1.2, 0.9, o, x, 2, 2.8)));
});
mkV(17, (g, w) => {
  const gr = 0x6fc23a,
    b = 0x222222;
  g.add(
    mm(1.2, 0.3, 3.2, 0x555555, 0, 0.95, 0),
    mm(0.9, 0.5, 1, b, 0, 1.3, 0.3),
    mm(1.7, 0.12, 0.12, gr, 0, 2.4, -0.9),
    mm(1.7, 0.12, 0.12, gr, 0, 2.4, 0.9),
    mm(1.7, 0.12, 0.12, gr, 0, 2, -1.3),
    mm(1.5, 0.5, 0.06, 0x1a2a3a, 0, 1.6, -0.95, { transparent: true, opacity: 0.5 }),
    mm(0.9, 0.6, 0.9, gr, 0, 1.9, 1.7),
    mm(0.4, 0.8, 0.5, gr, 0, 2.2, 2),
  );
  for (const x of [-0.8, 0.8])
    g.add(
      mm(0.12, 1.4, 0.12, gr, x, 1.7, -0.9),
      mm(0.12, 1.4, 0.12, gr, x, 1.7, 0.9),
      mm(0.12, 0.12, 2.2, gr, x, 2.4, 0),
      mm(0.12, 0.9, 0.12, gr, x, 1.4, -1.5),
      mm(0.12, 0.12, 3.2, gr, x, 1, 0),
      mm(0.12, 0.12, 2.2, gr, x, 1.8, 0),
    );
  [
    [-1.25, -1.2],
    [1.25, -1.2],
    [-1.25, 1.3],
    [1.25, 1.3],
  ].forEach(([x, z]) => {
    wh(g, 0.75, 0.6, x, 0.75, z, 0x151515, 0xd62828, w);
    const sp = mm(0.18, 1, 0.18, 0x2a56d8, x * 0.85, 1.3, z);
    sp.rotation.z = x > 0 ? -0.35 : 0.35;
    g.add(sp);
  });
});
mkV(18, (g, w) => {
  const b = 0x2a6fc9,
    en = new T.Mesh(
      new T.CylinderGeometry(0.85, 0.85, 2.6, 20).rotateX(Math.PI / 2),
      new T.MeshStandardMaterial({
        color: b,
        metalness: 0.3,
        roughness: 0.35,
        envMap: ENV,
        envMapIntensity: 0.35,
      }),
    ),
    cp = new T.Mesh(
      new T.CylinderGeometry(0.95, 0.95, 0.5, 20).rotateX(Math.PI / 2),
      new T.MeshStandardMaterial({ color: 0xd89a2a, metalness: 0.8, roughness: 0.25 }),
    );
  en.position.set(0, 1, 1.3);
  cp.position.set(0, 1, 2.8);
  en.castShadow = true;
  g.add(en, cp);
  g.add(
    mm(0.9, 0.4, 2.6, b, 0, 0.55, -1.2),
    mm(0.6, 0.3, 1, b, 0, 0.6, -2.4),
    mm(0.5, 0.4, 0.5, 0x222222, 0, 1, -0.5),
    mm(0.9, 0.3, 1.1, 0x333333, 0, 0.5, 0.5),
    mm(0.06, 0.9, 0.06, 0x111111, 0, 1, -0.9),
    mm(0.4, 0.04, 0.04, 0x111111, 0, 1.4, -0.9),
  );
  [-0.35, -0.12, 0.12, 0.35].forEach((x) => g.add(mm(0.14, 0.5, 0.14, 0x222222, x, 1.95, 1, CH2)));
  [-1, 1].forEach((q) => {
    wh(g, 0.3, 0.25, q * 0.5, 0.3, -2.3, 0x151515, 0xbbbbbb, w);
    wh(g, 0.78, 0.5, q * 1.1, 0.78, 1.5, 0x151515, 0xbbbbbb, w);
  });
});
mkV(19, (g, w) => {
  const t = 0x2fc4c8,
    p = 0xd05bd0,
    pu = 0x8a3fc7,
    br = 0x7a4a32;
  g.add(
    mm(1.9, 0.6, 4.2, t, 0, 0.85, 0),
    mm(1.85, 0.35, 1.6, p, 0, 1.2, -1.3),
    mm(1.2, 0.12, 3.2, p, 0, 1.2, 0.3),
    mm(1.7, 0.5, 0.06, 0xbfe0f0, 0, 1.55, -0.6, { transparent: true, opacity: 0.4 }),
    mm(0.8, 0.3, 0.8, br, -0.45, 1.2, 0.5),
    mm(0.8, 0.3, 0.8, br, 0.45, 1.2, 0.5),
    mm(0.8, 0.6, 0.2, br, -0.45, 1.55, 1),
    mm(0.8, 0.6, 0.2, br, 0.45, 1.55, 1),
    mm(1.9, 0.2, 0.2, 0xdddddd, 0, 0.55, -2.15, CH2),
    mm(0.9, 0.4, 0.1, 0x333333, 0, 0.95, -2.12),
    mm(0.2, 0.6, 1.2, t, -0.95, 1.3, 1.7),
    mm(0.2, 0.6, 1.2, t, 0.95, 1.3, 1.7),
    lt(-0.7, 1, -2.15),
    lt(0.7, 1, -2.15),
    lt(-0.35, 1, -2.15),
    lt(0.35, 1, -2.15),
  );
  [-1, 1].forEach((q) => [-1.3, 1.3].forEach((z) => wh(g, 0.5, 0.3, q * 0.95, 0.5, z, 0x151515, pu, w)));
});
mkV(20, (g, w) => {
  const b = 0x1e5fd6,
    k = 0x151515;
  g.add(
    mm(1, 0.55, 2.2, b, 0, 0.85, -0.1),
    mm(0.9, 0.4, 1, b, 0, 0.9, -1.3),
    mm(0.7, 0.35, 1.6, k, 0, 1.1, 0.9),
    mm(0.7, 0.7, 0.06, 0xbfe0f0, 0, 1.5, -0.9, { transparent: true, opacity: 0.4 }),
    mm(1.5, 0.06, 0.06, k, 0, 1.35, -0.6),
    mm(0.06, 0.06, 1, 0xcccccc, -0.6, 1.3, 0, CH2),
    mm(0.06, 0.06, 1, 0xcccccc, 0.6, 1.3, 0, CH2),
    mm(0.8, 0.3, 2.3, k, 0, 0.35, 1),
    mm(0.6, 0.6, 0.8, k, 0, 0.9, 1.9),
    lt(0, 1, -1.8),
  );
  [-0.6, 0.6].forEach((x) => {
    const sk = mm(0.2, 0.1, 2, b, x, 0.18, -1.4);
    sk.rotation.x = 0.14;
    g.add(sk);
  });
  [-0.5, 0.3, 1.1, 1.8].forEach((z) => wh(g, 0.2, 0.7, 0, 0.28, z, 0x333333, 0x777777, w));
});
// 🐲 Oruga turbo: todoterreno de orugas con alerón trasero y motor súper rápido
const ORUGA_TEX = cv(64, 64, (x, w, h) => {
  x.fillStyle = "#18191b";
  x.fillRect(0, 0, w, h);
  x.fillStyle = "#3b3d40";
  for (let i = 0; i < 8; i++) x.fillRect(0, i * 8, w, 4);
  x.fillStyle = "#56595d";
  x.fillRect(0, 0, 6, h);
  x.fillRect(w - 6, 0, 6, h);
});
ORUGA_TEX.wrapS = ORUGA_TEX.wrapT = T.RepeatWrapping;
ORUGA_TEX.repeat.set(1, 6);
mkV(21, (g, w) => {
  const k = 0x1c1f24,
    v = 0x7cff2e,
    gr = 0x3a3f46,
    trM = new T.MeshStandardMaterial({ map: ORUGA_TEX, roughness: 0.9 });
  [-1, 1].forEach((q) => {
    const t = new T.Mesh(new T.BoxGeometry(0.62, 0.8, 4.6), trM);
    t.position.set(q * 1.22, 0.45, 0);
    t.castShadow = true;
    g.add(t);
    [-2.3, 2.3].forEach((z) => {
      const c = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.62, 14).rotateZ(Math.PI / 2), trM);
      c.position.set(q * 1.22, 0.45, z);
      g.add(c);
    });
    for (let i = 0; i < 5; i++) wh(g, 0.3, 0.1, q * 1.56, 0.42, -1.7 + i * 0.85, 0x222222, v, w);
    g.add(mm(0.72, 0.12, 4.9, v, q * 1.22, 0.92, 0));
  });
  const nariz = mm(1.9, 0.12, 1.2, v, 0, 1.42, -1.6);
  nariz.rotation.x = -0.18;
  g.add(
    mm(1.9, 0.55, 4.2, k, 0, 1.05, 0),
    mm(1.7, 0.3, 1.4, k, 0, 1.25, -1.9),
    nariz,
    mm(1.4, 0.55, 1.5, 0x9fd8ff, 0, 1.6, -0.2, {
      transparent: true,
      opacity: 0.45,
      metalness: 0.3,
      roughness: 0.05,
    }),
    mm(1.5, 0.08, 1.6, k, 0, 1.9, -0.2),
    mm(0.6, 0.35, 0.9, gr, 0, 1.55, 1.2),
    mm(0.5, 0.18, 0.6, v, 0, 1.82, 1.2),
    lt(-0.6, 1.15, -2.62),
    lt(0.6, 1.15, -2.62),
  );
  [-0.35, 0.35].forEach((x) =>
    g.add(
      mm(0.16, 0.16, 0.5, 0xaaaaaa, x, 1.25, 2.25, CH2),
      mm(0.14, 0.14, 0.05, 0xff7a18, x, 1.25, 2.5, { emissive: 0xff5a00, emissiveIntensity: 2 }),
    ),
  );
  // alerón trasero
  [-0.75, 0.75].forEach((x) => g.add(mm(0.08, 0.75, 0.18, k, x, 1.75, 2.05)));
  g.add(mm(2.4, 0.08, 0.6, v, 0, 2.15, 2.1));
  [-1.2, 1.2].forEach((x) => g.add(mm(0.05, 0.35, 0.7, k, x, 2.15, 2.1)));
});
const PVS = [
  {
    bus: 1,
    acc: 9,
    max: 32,
    off: 10,
    od: 0.8,
    br: 24,
    dr: 0.12,
    turn: 0.95,
    sf: 0.035,
    sl: 0.4,
    gp: 6,
    hl: 5.75,
    hw: 1.3,
    cd: 15,
    ch: 6.4,
    dm: 1,
    cr: 0.35,
    sk: 0.12,
    rl: 1,
    bob: 0.01,
    bf: 9,
    ob: 0,
    fc: 1,
    hz: -5.6,
    i: 650,
    r: 1500,
    c: 2,
    w: "sawtooth",
  },
  {
    acc: 11,
    max: 30,
    off: 24,
    od: 0.12,
    br: 20,
    dr: 0.1,
    turn: 1.15,
    sf: 0.03,
    sl: 0.7,
    gp: 5,
    hl: 1.8,
    hw: 1,
    cd: 9,
    ch: 3.8,
    dm: 1.2,
    cr: 0.4,
    sk: 0.2,
    rl: 2.2,
    bob: 0.03,
    bf: 12,
    ob: 0.05,
    fc: 0.9,
    hz: -1.8,
    s: [-0.4, 1.9, -0.2],
    i: 800,
    r: 3200,
    c: 2,
    w: "sawtooth",
  },
  {
    tank: 1,
    acc: 4,
    max: 14,
    off: 14,
    od: 0,
    br: 12,
    dr: 0.08,
    turn: 0.9,
    sf: 0,
    sl: 0,
    gp: 12,
    hl: 2.3,
    hw: 1.5,
    cd: 11,
    ch: 4.6,
    dm: 0.2,
    cr: 0.93,
    sk: 0.15,
    rl: 0.4,
    bob: 0.008,
    bf: 6,
    ob: 0.03,
    fc: 2.2,
    hz: -2.4,
    s: [0, 2.5, -0.6],
    i: 600,
    r: 1400,
    c: 3,
    w: "sawtooth",
  },
  {
    acc: 16,
    max: 42,
    off: 12,
    od: 0.7,
    br: 22,
    dr: 0.07,
    turn: 1.1,
    sf: 0.022,
    sl: 1,
    gp: 2.4,
    hl: 2.1,
    hw: 1,
    cd: 8.5,
    ch: 3.5,
    dm: 1.3,
    cr: 0.3,
    sk: 0.25,
    rl: 2.4,
    bob: 0.015,
    bf: 14,
    ob: 0.04,
    fc: 1.4,
    hz: -2.2,
    s: [0, 1.9, 0.2],
    i: 900,
    r: 5200,
    c: 4,
    w: "square",
  },
  {
    acc: 5,
    max: 16,
    off: 12,
    od: 0.3,
    br: 14,
    dr: 0.1,
    turn: 0.9,
    sf: 0.03,
    sl: 0.25,
    gp: 7,
    hl: 2.6,
    hw: 1.5,
    cd: 10,
    ch: 4.5,
    dm: 0.5,
    cr: 0.7,
    sk: 0.2,
    rl: 1.3,
    bob: 0.02,
    bf: 7,
    ob: 0.05,
    fc: 1,
    hz: -3,
    s: [0, 2.7, 0.2],
    i: 600,
    r: 1300,
    c: 1.5,
    w: "sawtooth",
  },
  {
    acc: 14,
    max: 36,
    off: 30,
    od: 0.08,
    br: 16,
    dr: 0.08,
    turn: 1.2,
    sf: 0.025,
    sl: 1.1,
    gp: 1.6,
    hl: 1.6,
    hw: 0.8,
    cd: 8.5,
    ch: 3.4,
    dm: 1.2,
    cr: 0.4,
    sk: 0.1,
    rl: 2,
    bob: 0.015,
    bf: 15,
    ob: 0.03,
    fc: 0.8,
    hz: -1.5,
    s: [0, 1.7, 0.6],
    i: 1200,
    r: 5500,
    c: 1,
    w: "sawtooth",
  },
  {
    acc: 7,
    max: 22,
    off: 15,
    od: 0.2,
    br: 12,
    dr: 0.12,
    turn: 1,
    sf: 0.03,
    sl: 0.6,
    gp: 3,
    hl: 1.5,
    hw: 1,
    cd: 8,
    ch: 3.6,
    dm: 1.6,
    cr: 0.3,
    sk: 0.15,
    rl: 2.5,
    bob: 0.025,
    bf: 11,
    ob: 0.06,
    fc: 0.5,
    hz: -1.6,
    fly: 1,
    fs: 22,
    s: [0, 2, 0.4],
    i: 1800,
    r: 4200,
    c: 1,
    w: "sawtooth",
  },
  {
    acc: 6,
    max: 18,
    off: 18,
    od: 0.05,
    br: 12,
    dr: 0.1,
    turn: 1.4,
    sf: 0.02,
    sl: 0.2,
    gp: 6,
    hl: 2,
    hw: 1.6,
    cd: 9,
    ch: 3.8,
    dm: 1.1,
    cr: 0.4,
    sk: 0.1,
    rl: 1.5,
    bob: 0.04,
    bf: 8,
    ob: 0.08,
    fc: 0.4,
    hz: -2,
    s: [0, 2.4, -0.3],
    i: 600,
    r: 2400,
    c: 6,
    w: "sine",
    e: 1,
  },
  {
    acc: 20,
    max: 58,
    off: 14,
    od: 0.6,
    br: 32,
    dr: 0.05,
    turn: 1.05,
    sf: 0.012,
    sl: 0.8,
    gp: 4,
    hl: 2.4,
    hw: 0.95,
    cd: 8.5,
    ch: 3.2,
    dm: 1.4,
    cr: 0.25,
    sk: 0.3,
    rl: 1.6,
    bob: 0.008,
    bf: 20,
    ob: 0.05,
    fc: 1.8,
    hz: -2.9,
    s: [0, 1.2, 0.2],
    i: 3200,
    r: 11500,
    c: 4,
    w: "sawtooth",
  },
  {
    acc: 7,
    max: 30,
    off: 14,
    od: 0.4,
    br: 20,
    dr: 0.1,
    turn: 0.85,
    sf: 0.03,
    sl: 0.3,
    gp: 6,
    hl: 3.3,
    hw: 1.3,
    cd: 12,
    ch: 5,
    dm: 0.6,
    cr: 0.6,
    sk: 0.2,
    rl: 1.2,
    bob: 0.015,
    bf: 8,
    ob: 0.04,
    fc: 1.3,
    hz: -3,
    s: [-0.5, 2.7, -0.5],
    i: 500,
    r: 1300,
    c: 3,
    w: "sawtooth",
    hf: [138, 175],
    air: 1,
  },
  {
    crush: 1,
    acc: 9,
    max: 26,
    off: 24,
    od: 0.1,
    br: 14,
    dr: 0.1,
    turn: 1,
    sf: 0.03,
    sl: 0.5,
    gp: 4,
    hl: 2.8,
    hw: 1.9,
    cd: 11,
    ch: 5,
    dm: 0.5,
    cr: 0.97,
    sk: 0.25,
    rl: 2.5,
    bob: 0.07,
    bf: 6,
    ob: 0.15,
    fc: 1.5,
    hz: -2.6,
    s: [-0.4, 3.4, -0.2],
    i: 700,
    r: 3500,
    c: 4,
    w: "sawtooth",
  },
  {
    acc: 15,
    max: 46,
    off: 30,
    od: 0.12,
    br: 26,
    dr: 0.07,
    turn: 1.25,
    sf: 0.018,
    sl: 0.9,
    gp: 3.2,
    hl: 1.9,
    hw: 0.95,
    cd: 8.5,
    ch: 3.4,
    dm: 1.1,
    cr: 0.3,
    sk: 0.2,
    rl: 2,
    bob: 0.015,
    bf: 15,
    ob: 0.04,
    fc: 1.2,
    hz: -1.9,
    s: [-0.35, 1.6, -0.1],
    i: 1000,
    r: 6800,
    c: 2,
    w: "sawtooth",
    tb: 3,
  },
  {
    acc: 8,
    max: 20,
    off: 20,
    od: 0.03,
    br: 14,
    dr: 0.1,
    turn: 1.1,
    sf: 0.02,
    sl: 0.15,
    gp: 9,
    hl: 1.9,
    hw: 1.2,
    cd: 8.5,
    ch: 3.4,
    dm: 0.9,
    cr: 0.5,
    sk: 0.1,
    rl: 0.8,
    bob: 0.02,
    bf: 10,
    ob: 0.03,
    fc: 0.6,
    hz: -2,
    s: [0, 1.9, 0.3],
    i: 700,
    r: 2800,
    c: 2,
    w: "sawtooth",
  },
  {
    hover: 1,
    acc: 7,
    max: 34,
    off: 34,
    od: 0.02,
    br: 7,
    dr: 0.03,
    turn: 1.05,
    sf: 0.02,
    sl: 1.5,
    gp: 0.9,
    hl: 2.8,
    hw: 1.6,
    cd: 10,
    ch: 4,
    dm: 1,
    cr: 0.4,
    sk: 0,
    rl: 1.8,
    bob: 0.03,
    bf: 3,
    ob: 0,
    fc: 0.7,
    hz: -2.6,
    s: [0, 1.9, -0.3],
    i: 1200,
    r: 3600,
    c: 1.5,
    w: "sawtooth",
    nz: 3,
  },
  {
    acc: 7,
    max: 20,
    off: 20,
    od: 0.03,
    br: 18,
    dr: 0.1,
    turn: 1.35,
    sf: 0.02,
    sl: 0.2,
    gp: 9,
    hl: 2,
    hw: 1.6,
    cd: 9,
    ch: 3.8,
    dm: 0.8,
    cr: 0.5,
    sk: 0.1,
    rl: 3,
    bob: 0.05,
    bf: 7,
    ob: 0.1,
    fc: 0.9,
    hz: -2,
    s: [0, 1.9, 0],
    i: 800,
    r: 3500,
    c: 2,
    w: "sawtooth",
  },
  {
    beast: 1,
    acc: 18,
    max: 60,
    off: 12,
    od: 0.7,
    br: 20,
    dr: 0.05,
    turn: 0.75,
    sf: 0.03,
    sl: 0.7,
    gp: 3.5,
    hl: 2.6,
    hw: 1.1,
    cd: 9,
    ch: 3.4,
    dm: 1.3,
    cr: 0.3,
    sk: 0.3,
    rl: 1.2,
    bob: 0.01,
    bf: 18,
    ob: 0.05,
    fc: 2.2,
    hz: -2.2,
    s: [0, 1.5, -0.2],
    i: 1200,
    r: 7500,
    c: 4,
    w: "sawtooth",
  },
  {
    acc: 10,
    max: 36,
    off: 12,
    od: 0.7,
    br: 20,
    dr: 0.09,
    turn: 0.95,
    sf: 0.03,
    sl: 0.5,
    gp: 5,
    hl: 2.4,
    hw: 1.05,
    cd: 9,
    ch: 3.5,
    dm: 1.1,
    cr: 0.35,
    sk: 0.15,
    rl: 1.4,
    bob: 0.04,
    bf: 7,
    ob: 0.05,
    fc: 1.2,
    hz: -2.4,
    s: [-0.4, 1.6, 0],
    i: 600,
    r: 2400,
    c: 4,
    w: "sawtooth",
  },
  {
    acc: 16,
    max: 40,
    off: 34,
    od: 0.06,
    br: 18,
    dr: 0.07,
    turn: 1.25,
    sf: 0.022,
    sl: 1.2,
    gp: 1.8,
    hl: 1.7,
    hw: 0.8,
    cd: 8.5,
    ch: 3.4,
    dm: 1.2,
    cr: 0.4,
    sk: 0.1,
    rl: 2.2,
    bob: 0.012,
    bf: 16,
    ob: 0.03,
    fc: 0.9,
    hz: -1.6,
    s: [0, 1.7, 0.4],
    i: 1300,
    r: 6500,
    c: 1,
    w: "sawtooth",
  },
  {
    acc: 24,
    max: 68,
    off: 64,
    od: 0.02,
    br: 30,
    dr: 0.05,
    turn: 1.15,
    sf: 0.012,
    sl: 0.35,
    gp: 11,
    hl: 2.6,
    hw: 1.55,
    cd: 10,
    ch: 4.2,
    dm: 0.35,
    cr: 0.85,
    sk: 0.05,
    rl: 0.6,
    bob: 0.006,
    bf: 20,
    ob: 0.02,
    fc: 1.4,
    hz: -2.6,
    s: [0, 1.75, -0.3],
    i: 1100,
    r: 8200,
    c: 4,
    w: "sawtooth",
    tb: 3,
    nz: 1.4,
  },
];
PVS.forEach((p, i) => {
  p.hr = [0.5, 0.6, 0.35, 0.9, 0.5, 0.6, 0.4, 0.3, 1.1, 0.5, 0.6, 0.8, 0.4, 0.5, 0.4, 1, 0.6, 0.6, 0.7][i];
  p.ez = [4.5, -1.2, 1.5, -1.1, -1.2, -1, 1.3, 0, 0.8, -1.6, -1.6, -1, 1, 2.2, 0.3, 1.3, -1.4, -1, 2.4][i];
});
const PARTS = [
    { id: "s1", n: "Motor alto rendimiento", e: "⚙️", t: "S", d: "+25% aceleración", x: { acc: 1.25 } },
    {
      id: "s2",
      n: "Escape de competencia",
      e: "💨",
      t: "S",
      d: "+10% veloc. máxima",
      x: { mx: 1.1, acc: 1.05 },
    },
    {
      id: "s3",
      n: "Bujías de iridio",
      e: "⚡",
      t: "S",
      d: "+10% acel., −10% gasto",
      x: { acc: 1.1, fc: 0.9 },
    },
    { id: "s4", n: "Volante y tablero", e: "🎛️", t: "S", d: "+15% giro y agarre", x: { tn: 1.15, gp: 1.15 } },
    { id: "s5", n: "Alerón", e: "🪽", t: "S", d: "+30% agarre", x: { gp: 1.3, mx: 0.97 } },
    {
      id: "s6",
      n: "Rines de radios",
      e: "🛞",
      t: "S",
      d: "+15% agarre y terreno",
      x: { gp: 1.15, off: 1.1 },
    },
    {
      id: "a1",
      n: "Turbo",
      e: "🌪️",
      t: "A",
      d: "+20% acel., +8% máx., silbido",
      x: { acc: 1.2, mx: 1.08, fc: 1.15, tb: 2 },
    },
    {
      id: "a2",
      n: "Radiador de competencia",
      e: "🧊",
      t: "A",
      d: "−45% calentamiento del motor",
      x: { hr: 0.55 },
    },
    { id: "b1", n: "Colector de escape", e: "🔩", t: "B", d: "+7% aceleración", x: { acc: 1.07 } },
    { id: "b2", n: "Botella de nitro", e: "🧪", t: "B", d: "Nitro 60 (Shift/N)", x: { nit: 60 } },
    {
      id: "b3",
      n: "ECU (chip)",
      e: "📟",
      t: "B",
      d: "+8% acel., −5% gasto",
      x: { acc: 1.08, mx: 1.04, fc: 0.95 },
    },
    {
      id: "b4",
      n: "Llantas de carrera",
      e: "⭕",
      t: "B",
      d: "+25% agarre, +10% frenos",
      x: { gp: 1.25, br: 1.1 },
    },
    {
      id: "d1",
      n: "Contrapeso",
      e: "⚓",
      t: "D",
      d: "−20% daño, +10% agarre, −8% acel.",
      x: { dm: 0.8, gp: 1.1, acc: 0.92 },
    },
    { id: "c1", n: "Imán de colones", e: "🧲", t: "C", d: "+25% ganancias", x: { cm: 1.25 } },
    {
      id: "c2",
      n: "Aleta aerodinámica",
      e: "🔺",
      t: "C",
      d: "+5% máx., menos fricción",
      x: { mx: 1.05, dr: 0.9 },
    },
    { id: "e1", n: "Tablero de instrumentos", e: "🧭", t: "E", d: "−8% gasto", x: { fc: 0.92 } },
    { id: "e2", n: "Cohete", e: "🚀", t: "E", d: "Nitro enorme 100, +10% gasto", x: { nit: 100, fc: 1.1 } },
    {
      id: "f1",
      n: "Propulsores gemelos",
      e: "🛩️",
      t: "F",
      d: "Nitro 60, −5% giro",
      x: { nit: 60, tn: 0.95 },
    },
    {
      id: "p1",
      n: "Proyección de choque",
      e: "💥",
      t: "S",
      d: "Te lanza al chocar y lanza el carro golpeado; −15% daño",
      x: { proj: 1, dm: 0.85 },
    },
    { id: "n1", n: "Inyectores", e: "💉", t: "B", d: "+6% acel., −5% gasto", x: { acc: 1.06, fc: 0.95 } },
    { id: "n2", n: "Árbol de levas", e: "🎚️", t: "B", d: "+5% acel., +3% máx.", x: { acc: 1.05, mx: 1.03 } },
    {
      id: "n3",
      n: "Pistones forjados",
      e: "🔨",
      t: "A",
      d: "+10% acel., −10% calor",
      x: { acc: 1.1, hr: 0.9 },
    },
    { id: "n4", n: "Intercooler", e: "❄️", t: "A", d: "−30% calor, +4% acel.", x: { hr: 0.7, acc: 1.04 } },
    { id: "n5", n: "Enfriador de aceite", e: "🛢️", t: "B", d: "−20% calentamiento", x: { hr: 0.8 } },
    { id: "n6", n: "Amortiguadores", e: "🛠️", t: "B", d: "+10% agarre y terreno", x: { gp: 1.1, off: 1.1 } },
    {
      id: "n7",
      n: "Barra estabilizadora",
      e: "📏",
      t: "C",
      d: "+8% giro, +6% agarre",
      x: { tn: 1.08, gp: 1.06 },
    },
    { id: "n8", n: "Frenos de carbono", e: "🛑", t: "A", d: "+30% frenado", x: { br: 1.3 } },
    {
      id: "n9",
      n: "Diferencial autoblocante",
      e: "🔗",
      t: "B",
      d: "+5% acel., +8% agarre",
      x: { acc: 1.05, gp: 1.08 },
    },
    { id: "n10", n: "Embrague de competencia", e: "🦶", t: "C", d: "+6% aceleración", x: { acc: 1.06 } },
    { id: "n11", n: "Parachoques reforzado", e: "🛡️", t: "D", d: "−15% daño", x: { dm: 0.85 } },
    {
      id: "n12",
      n: "Jaula antivuelco",
      e: "🔲",
      t: "D",
      d: "−15% daño, −3% giro",
      x: { dm: 0.85, tn: 0.97 },
    },
    {
      id: "n13",
      n: "Chasis aligerado",
      e: "🪶",
      t: "B",
      d: "+10% acel., +4% máx., +10% daño",
      x: { acc: 1.1, mx: 1.04, dm: 1.1 },
    },
    { id: "n14", n: "Tanque de gran capacidad", e: "⛽", t: "D", d: "−15% gasto", x: { fc: 0.85 } },
    {
      id: "n15",
      n: "Neumáticos todoterreno",
      e: "🌍",
      t: "C",
      d: "+20% terreno, +5% agarre",
      x: { off: 1.2, gp: 1.05 },
    },
    { id: "n16", n: "Faros de largo alcance", e: "💡", t: "F", d: "+8% ganancias", x: { cm: 1.08 } },
  ],
  TUN = [...Array(19)].map(() => ({})),
  TIERC = { S: 5000, A: 4000, B: 2500, C: 1800, D: 1200, E: 3000, F: 2000 },
  TC = { S: "#ff7f7f", A: "#ffbf7f", B: "#ffdf7f", D: "#bfff7f", C: "#7fff7f", E: "#7fffff", F: "#7fbfff" };
function tuned(b, k) {
  k = k == null ? CK : k;
  const p = Object.assign({}, b),
    T0 = TUN[k] || {};
  p.nit = 0;
  p.cm = 1;
  p.tb = b.tb || 1;
  for (const q of PARTS) {
    const l = T0[q.id] | 0;
    if (!l) continue;
    const f = l / 3,
      e = q.x,
      m = (v) => Math.max(0.2, 1 + (v - 1) * f);
    if (e.acc) p.acc *= m(e.acc);
    if (e.mx) {
      p.max *= m(e.mx);
      p.off *= m(e.mx);
    }
    if (e.gp) p.gp *= m(e.gp);
    if (e.tn) p.turn *= m(e.tn);
    if (e.br) p.br *= m(e.br);
    if (e.dm) p.dm *= m(e.dm);
    if (e.fc) p.fc *= m(e.fc);
    if (e.nit) p.nit += e.nit * f;
    if (e.cm) p.cm *= m(e.cm);
    if (e.tb) p.tb *= m(e.tb);
    if (e.dr) p.dr *= m(e.dr);
    if (e.off) p.off *= m(e.off);
    if (e.proj && l >= 1) p.proj = 1;
    if (e.hr) p.hr *= m(e.hr);
  }
  return p;
}
function setVeh(i) {
  const b = esBus(i);
  body.visible = b;
  wheels.forEach((w) => (w.visible = b));
  Object.keys(VM).forEach((k) => (VM[k].g.visible = +k == i));
  CK = b ? 0 : i - 3;
  PB = PVS[CK];
  PV = tuned(PB);
  cur = b ? body : VM[i].g;
  VWL = b ? [] : VM[i].w;
  if (b) applySkin(i < 4 ? i : BUS_EXTRA[i]);
  hs.position.set(0, 1, PV.hz);
  hs.target.position.set(0, 0, PV.hz - 25);
}
body.add(dm_);
bx(1.2, 0.5, 0.7, 0x222a33, -0.8, 1.7, -4.9);
const stw = new T.Mesh(new T.TorusGeometry(0.28, 0.04, 6, 16), new T.MeshStandardMaterial({ color: 0x111 }));
stw.position.set(-0.8, 2, -4.55);
stw.rotation.x = -0.9;
body.add(stw);
// interior
const fT = cv(64, 64, (x, w, h) => {
  x.fillStyle = "#8a8f94";
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "#d5d9dc";
  x.lineWidth = 2;
  for (let i = 0; i < w; i += 16)
    for (let j = 0; j < h; j += 16) {
      x.beginPath();
      x.moveTo(i + 2, j + 2);
      x.lineTo(i + 14, j + 14);
      x.moveTo(i + 14, j + 2);
      x.lineTo(i + 2, j + 14);
      x.stroke();
    }
});
fT.wrapS = fT.wrapT = T.RepeatWrapping;
fT.repeat.set(10, 44);
const fl = new T.Mesh(
  new T.PlaneGeometry(2.4, 11),
  new T.MeshStandardMaterial({ map: fT, roughness: 0.5, metalness: 0.4 }),
);
fl.rotation.x = -Math.PI / 2;
fl.position.y = 0.72;
fl.receiveShadow = true;
body.add(fl);
const stC = new T.BoxGeometry(0.95, 0.4, 0.5),
  stB = new T.BoxGeometry(0.95, 0.7, 0.1),
  stM = new T.MeshStandardMaterial({ color: 0x3d4650, roughness: 0.8 }),
  stY = new T.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.6 });
for (let r = 0; r < 8; r++)
  [-1, 1].forEach((s) => {
    const m = s > 0 && r < 2 ? stY : stM,
      c = new T.Mesh(stC, m),
      b = new T.Mesh(stB, m),
      z = -2.6 + r;
    c.position.set(s * 0.78, 0.92, z);
    b.position.set(s * 0.78, 1.45, z + 0.23);
    body.add(c, b);
  });
const pG = new T.CylinderGeometry(0.03, 0.03, 2.25, 6),
  rG = new T.BoxGeometry(0.05, 0.05, 9.4);
for (let i = 0; i < 5; i++)
  [-1, 1].forEach((s) => {
    const p = new T.Mesh(pG, stY);
    p.position.set(s * 0.28, 1.85, -2.2 + i * 2);
    body.add(p);
  });
[-1, 1].forEach((s) => {
  const r = new T.Mesh(rG, stY);
  r.position.set(s * 0.28, 2.68, 0.9);
  body.add(r);
});
bx(0.8, 0.05, 1.4, 0xeeeeee, 0, 2.73, 1.5, { emissive: 0xffffff, emissiveIntensity: 0.6 });
const il = new T.PointLight(0xffffff, 0.7, 14);
il.position.set(0, 2.6, 0);
body.add(il);
const ppl = [],
  cords = [];
for (let r = 0; r < 8; r++)
  [-1, 1].forEach((q) =>
    [-0.24, 0.24].forEach((o) => {
      const g = new T.Group(),
        b = new T.Mesh(
          new T.CylinderGeometry(0.2, 0.22, 0.7, 8),
          new T.MeshStandardMaterial({
            color: new T.Color().setHSL(Math.random(), 0.5, 0.45),
            roughness: 0.8,
          }),
        ),
        h = new T.Mesh(
          new T.SphereGeometry(0.15, 10, 8),
          new T.MeshStandardMaterial({
            color: [0xe0b08a, 0xc58c63, 0x8d5a3a][(Math.random() * 3) | 0],
            roughness: 0.7,
          }),
        );
      b.position.y = 1.5;
      h.position.y = 2.0;
      g.add(b, h);
      g.position.set(q * 0.78 + o, 0, -2.6 + r + 0.15);
      g.visible = false;
      body.add(g);
      ppl.push(g);
    }),
  );
ppl.sort(() => Math.random() - 0.5);
[-1, 1].forEach((q) => {
  const g = new T.Group();
  g.add(mm(0.03, 0.03, 9.8, 0x7a5230, q * 1.12, 2.66, 0.3));
  for (let i = 0; i < 5; i++)
    g.add(
      mm(0.02, 0.4, 0.02, 0x7a5230, q * 1.12, 2.45, -2.4 + i * 2.1),
      mm(0.12, 0.05, 0.05, 0xd0a060, q * 1.12, 2.23, -2.4 + i * 2.1),
    );
  body.add(g);
  cords.push(g);
});
const parS = new T.Mesh(
  new T.PlaneGeometry(1.4, 0.32),
  new T.MeshBasicMaterial({ map: S("PARANDO", 256, 58, "#150000", "#ff3030", 40) }),
);
parS.position.set(0, 2.55, -5.2);
parS.visible = false;
body.add(parS);
function pull() {
  pullT = 0.6;
  pullSide = Math.random() < 0.5 ? 0 : 1;
  bell();
}
const wheels = [],
  wg = new T.CylinderGeometry(0.55, 0.55, 0.45, 16).rotateZ(Math.PI / 2),
  wm = new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }),
  hm = new T.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.3 });
[[-3.6], [3.4]].forEach(([z]) =>
  [-1, 1].forEach((s) => {
    const w = new T.Group(),
      t = new T.Mesh(wg, wm),
      h = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.47, 10).rotateZ(Math.PI / 2), hm);
    t.castShadow = true;
    w.add(t, h);
    w.position.set(s * 1.2, 0.55, z);
    bus.add(w);
    wheels.push(w);
  }),
);
sc.add(bus);
setVeh(0);
// tráfico
const gm = new T.MeshStandardMaterial({
    color: 0x9fb8c8,
    metalness: 0.3,
    roughness: 0.05,
    transparent: true,
    opacity: 0.35,
  }),
  dk = new T.MeshStandardMaterial({ color: 0x111 });
const CG = {
    body: new T.BoxGeometry(1.9, 0.7, 4.3),
    cab: new T.BoxGeometry(1.62, 0.6, 2.2),
    roof: new T.BoxGeometry(1.58, 0.09, 1.85),
    sk: new T.BoxGeometry(1.96, 0.28, 4.05),
    bp: new T.BoxGeometry(1.94, 0.24, 0.2),
    hl: new T.BoxGeometry(0.4, 0.15, 0.06),
    gr: new T.BoxGeometry(0.8, 0.16, 0.04),
    tl: new T.BoxGeometry(1.6, 0.2, 0.1),
    mr: new T.BoxGeometry(0.22, 0.14, 0.08),
  },
  gm2 = new T.MeshStandardMaterial({
    color: 0x1b2733,
    metalness: 0.6,
    roughness: 0.06,
    envMap: ENV,
    envMapIntensity: 1.1,
    transparent: true,
    opacity: 0.88,
  }),
  hlM = new T.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 1 }),
  CPAL = [0xf4f4f4, 0xc0c4c8, 0x1c1c1e, 0x9b1b1b, 0x1e4fa3, 0x2d6b3e, 0xd9d2c0, 0x6a6e74, 0xe0a21a, 0x3a3a40];
// optimización: una sola pintura por color, compartida por todos los carros
const PINTURAS = new Map();
function pintura(c) {
  const k = c.getHex();
  if (!PINTURAS.has(k))
    PINTURAS.set(
      k,
      Object.assign(
        new T.MeshStandardMaterial({
          color: c,
          metalness: 0.35,
          roughness: 0.28,
          envMap: ENV,
          envMapIntensity: 0.7,
        }),
        { userData: { pintura: 1 } },
      ),
    );
  return PINTURAS.get(k);
}
function mkCar() {
  const g = new T.Group(),
    c =
      Math.random() < 0.75
        ? new T.Color(pk_(CPAL))
        : new T.Color().setHSL(Math.round(Math.random() * 12) / 12, 0.8, 0.5),
    pm = pintura(c);
  const a = new T.Mesh(CG.body, pm);
  a.position.y = 0.8;
  const b = new T.Mesh(CG.cab, gm2);
  b.position.set(0, 1.45, 0.25);
  const rf = new T.Mesh(CG.roof, pm);
  rf.position.set(0, 1.78, 0.3);
  const w = new T.Mesh(CG.sk, dk);
  w.position.y = 0.36;
  const l = new T.Mesh(CG.tl, tm);
  l.position.set(0, 0.95, 2.16);
  g.add(a, b, rf, w, l);
  [-2.2, 2.2].forEach((z) => {
    const bp = new T.Mesh(CG.bp, dk);
    bp.position.set(0, 0.55, z);
    g.add(bp);
  });
  const gr = new T.Mesh(CG.gr, dk);
  gr.position.set(0, 0.72, -2.17);
  g.add(gr);
  [-1, 1].forEach((q) => {
    const h = new T.Mesh(CG.hl, hlM),
      sp = new T.Sprite(glowM);
    sp.scale.setScalar(1.3);
    h.add(sp);
    h.position.set(q * 0.65, 0.92, -2.16);
    const mr = new T.Mesh(CG.mr, pm);
    mr.position.set(q * 1.02, 1.25, -0.75);
    g.add(h, mr);
  });
  [
    [-1, -1.4],
    [1, -1.4],
    [-1, 1.4],
    [1, 1.4],
  ].forEach(([sx, z]) => {
    const t = new T.Mesh(TW, TWM),
      h = new T.Mesh(HW, HWM);
    t.position.set(sx * 0.95, 0.34, z);
    h.position.set(sx * 0.95, 0.34, z);
    t.castShadow = true;
    g.add(t, h);
  });
  return sh(g);
}
const TW = new T.CylinderGeometry(0.34, 0.34, 0.24, 12).rotateZ(Math.PI / 2),
  TWM = new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }),
  HW = new T.CylinderGeometry(0.18, 0.18, 0.26, 10).rotateZ(Math.PI / 2),
  HWM = new T.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.3 });
const wr = (g, pts, r) =>
  pts.forEach(([x, z]) => {
    const t = new T.Mesh(new T.CylinderGeometry(r, r, 0.4, 14).rotateZ(Math.PI / 2), TWM),
      h = new T.Mesh(new T.CylinderGeometry(r * 0.5, r * 0.5, 0.42, 10).rotateZ(Math.PI / 2), HWM);
    t.position.set(x, r, z);
    h.position.set(x, r, z);
    t.castShadow = true;
    g.add(t, h);
  });
// ===== AMBULANCIA (tráfico y accidentes) =====
const AMBG = {
    cab: new T.BoxGeometry(2, 1.45, 1.5),
    caja: new T.BoxGeometry(2.15, 2.25, 3.7),
    franja: new T.BoxGeometry(2.17, 0.32, 5.25),
    vid: new T.BoxGeometry(1.8, 0.6, 0.06),
    luz: new T.BoxGeometry(0.42, 0.16, 0.22),
    rueda: new T.CylinderGeometry(0.42, 0.42, 0.32, 14).rotateZ(Math.PI / 2),
    txt: new T.PlaneGeometry(2.6, 0.42),
    cruz: new T.PlaneGeometry(0.75, 0.75),
  },
  AMBM = {
    blanco: new T.MeshStandardMaterial({ color: 0xf6f7f8, roughness: 0.35, metalness: 0.15 }),
    rojo: new T.MeshStandardMaterial({ color: 0xd62828, roughness: 0.4 }),
    txt: new T.MeshBasicMaterial({ map: S("AMBULANCIA", 384, 62, "#ffffff", "#d62828", 44) }),
    cruz: new T.MeshBasicMaterial({
      map: cv(64, 64, (x) => {
        x.fillStyle = "#fff";
        x.fillRect(0, 0, 64, 64);
        x.fillStyle = "#d62828";
        x.fillRect(24, 6, 16, 52);
        x.fillRect(6, 24, 52, 16);
      }),
    }),
  };
function mkAmbulancia() {
  const g = new T.Group(),
    add = (geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };
  add(AMBG.cab, AMBM.blanco, 0, 1.15, -1.85);
  add(AMBG.caja, AMBM.blanco, 0, 1.6, 0.75);
  add(AMBG.franja, AMBM.rojo, 0, 1.05, -0.1);
  add(AMBG.vid, gm2, 0, 1.55, -2.62).rotation.x = -0.25;
  add(CG.bp, dk, 0, 0.55, -2.65);
  add(CG.bp, dk, 0, 0.55, 2.62);
  [-1, 1].forEach((q) => {
    const h = add(CG.hl, hlM, q * 0.68, 0.85, -2.62),
      sp = new T.Sprite(glowM);
    sp.scale.setScalar(1.3);
    h.add(sp);
    add(AMBG.txt, AMBM.txt, q * 1.08, 2.15, 0.75).rotation.y = (q * Math.PI) / 2;
    add(AMBG.cruz, AMBM.cruz, q * 1.081, 1.55, 1.9).rotation.y = (q * Math.PI) / 2;
    add(AMBG.rueda, TWM, q * 0.95, 0.42, -1.75);
    add(AMBG.rueda, TWM, q * 0.95, 0.42, 1.6);
  });
  add(AMBG.cruz, AMBM.cruz, 0, 1.75, 2.61);
  // luces de emergencia: rojas y blancas, alternadas
  const luces = [0xff2020, 0xffffff, 0xff2020].map((c, i) => {
    const mat = new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 }),
      sm = new T.SpriteMaterial({
        map: gTex,
        color: c,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
      m = add(AMBG.luz, mat, -0.7 + i * 0.7, 2.8, -1.05),
      sp = new T.Sprite(sm);
    sp.scale.setScalar(2.6);
    m.add(sp);
    return { mat, sm };
  });
  g.userData.amb = luces;
  g.userData.hl = 2.7;
  return sh(g);
}
function mkVeh(zz) {
  const nv = typeof vehNuevo == "function" && vehNuevo(zz); // js/mundo.js
  if (nv) return nv;
  const r = Math.random();
  if (r > 0.96) return mkAmbulancia();
  if (r < 0.3) {
    const g = new T.Group();
    if (r < 0.15) {
      const cc = [0x2a56b8, 0xd8d8d8, 0xb02a2a][(Math.random() * 3) | 0];
      g.add(
        mm(2.5, 2.6, 2.2, cc, 0, 1.7, -3.9),
        mm(2.5, 3, 8.4, 0xe8ebee, 0, 2, 1.1),
        mm(2.3, 0.5, 10.8, 0x222, 0, 0.55, -0.2),
      );
      wr(
        g,
        [
          [-1.1, -3.9],
          [1.1, -3.9],
          [-1.1, 1.4],
          [1.1, 1.4],
          [-1.1, 3.6],
          [1.1, 3.6],
        ],
        0.6,
      );
      g.userData.hl = 5.4;
    } else {
      const k = SK[(Math.random() * SK.length) | 0];
      g.add(
        mm(2.6, 2.7, 10.4, k.b, 0, 1.7, 0),
        mm(2.62, 0.5, 10.42, k.s, 0, 1, 0),
        mm(2.64, 0.9, 9, 0xbfd8e8, 0, 2.3, 0, {
          metalness: 0.2,
          roughness: 0.05,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      wr(
        g,
        [
          [-1.2, -3.4],
          [1.2, -3.4],
          [-1.2, 3.4],
          [1.2, 3.4],
        ],
        0.55,
      );
      g.userData.hl = 5.3;
    }
    return g;
  }
  const o = mkCar();
  o.userData.hl = 2.2;
  return o;
}
const cars = [];
let tl_ = 0;
function mkAcc() {
  const g = new T.Group(),
    a = mkCar(),
    b = mkCar(),
    p = mkCar();
  a.position.set(-0.8, 0, -2);
  a.rotation.set(0, 0.7, 0.12);
  b.position.set(1.2, 0, 2.5);
  b.rotation.set(0, -0.5, -0.1);
  p.position.set(3.4, 0, 7.5);
  p.rotation.y = 0.35;
  const r = mm(0.5, 0.2, 0.4, 0xff2020, -0.35, 1.95, 0, { emissive: 0xff0000, emissiveIntensity: 2 }),
    u = mm(0.5, 0.2, 0.4, 0x2050ff, 0.35, 1.95, 0, { emissive: 0x2255ff, emissiveIntensity: 0 });
  p.add(r, u);
  g.add(a, b, p);
  g.userData.l = [r.material, u.material];
  g.userData.sm = [0, 1, 2, 3].map((i) => {
    const m = new T.Mesh(
      new T.SphereGeometry(0.7, 8, 6),
      new T.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.5 }),
    );
    m.position.set(-0.8, 2, -2);
    g.add(m);
    return m;
  });
  for (let k = 0; k < 4; k++) {
    const c = new T.Mesh(new T.ConeGeometry(0.25, 0.7, 8), M(0xff6a00));
    c.position.set((k % 2) * 1.6, 0.35, 12 + k * 3);
    g.add(c);
  }
  for (let k = 0; k < 6; k++) g.add(mm(R(0.2, 0.5), 0.12, R(0.2, 0.5), 0x333333, R(-2, 3), 0.06, R(-4, 5)));
  const am = mkAmbulancia(); // la ambulancia atiende el accidente
  am.position.set(-0.4, 0, 8.6);
  am.rotation.y = 0.15;
  g.add(am);
  g.userData.amb = am.userData.amb;
  g.userData.hl = 4.6;
  return g;
}
const LN = [-5.25, -1.75, 1.75, 5.25];
function mkBoat() {
  const g = new T.Group();
  g.add(
    mm(1.8, 0.6, 4.4, 0xf4f6f8, 0, 0.5, 0),
    mm(1.82, 0.2, 4.42, 0x1b4fa8, 0, 0.3, 0),
    mm(1.2, 0.7, 1.4, 0xbfd8e8, 0, 1.1, 0.3, { transparent: true, opacity: 0.5 }),
    mm(0.1, 1.4, 0.1, 0x888888, 0, 1.6, -0.9),
  );
  g.userData.hl = 2.4;
  return g;
}
function spawn(z) {
  if (zoneAt(z - CZ) == 18) return;
  const lz =
      LZ.includes(zoneAt(z - CZ)) &&
      !HB.some((r) => z - CZ < r[0] + 60 && z - CZ > r[1] - 60) &&
      Math.random() < 0.25,
    zz = zoneAt(z - CZ),
    wt = zz == 16,
    rc = zz == 17,
    x = lz
      ? Math.random() < 0.5
        ? -28.5
        : -31.5
      : rc
        ? LN[2 + ((Math.random() * 2) | 0)]
        : LN[(Math.random() * 4) | 0],
    on = x == -28.5 || (x < 0 && x > -10),
    jm = inJam(z),
    sp = jm ? 16 : 30;
  if (cars.some((c) => c.x0 == x && Math.abs(c.z - z) < sp + (c.hl || 2))) return;
  if (!jm && !wt && !rc && Math.random() < 0.05) {
    const o = mkAcc();
    o.position.set(x, 0, z);
    sc.add(o);
    cars.push({ o, x, x0: x, hl: 4.6, z, vz: 0, v0: 0, jv: 0, vx: 0, hit: 0, stat: 1 });
    return;
  }
  const o = wt ? mkBoat() : mkVeh(zz);
  o.position.set(x, 0, z);
  o.rotation.y = on ? Math.PI : 0;
  sc.add(o);
  const v = rc ? -R(26, 40) : on ? R(13, 19) : -R(8, 13);
  const vAmb = o.userData.amb ? 1.6 : 1; // las ambulancias van más rápido
  cars.push({
    o,
    x,
    x0: x,
    hl: o.userData.hl || 2.2,
    z,
    vz: (jm ? v * 0.2 : v) * vAmb,
    v0: v * vAmb,
    jv: R(0.5, 3),
    vx: 0,
    hit: 0,
  });
}
// parada
const STOPD = 500;
let stop = null;
function mkStop(i) {
  const g = new T.Group(),
    z = -STOPD * (i + 1);
  const zn = new T.Mesh(
    new T.PlaneGeometry(7, 17),
    new T.MeshBasicMaterial({ color: 0x2fff7a, transparent: true, opacity: 0.35, fog: false }),
  );
  zn.rotation.x = -Math.PI / 2;
  zn.position.set(3.6, 0.05, z);
  g.add(zn);
  // ----- PARADA REMODELADA -----
  // Andén de concreto con bahía pintada, caseta de vidrio con techo verde, pantalla LED con la
  // próxima ruta, banca, mapa de rutas, basurero y maceteras. Mira hacia la carretera (-x).
  const s = new T.Group();
  s.position.set(9.5, 0, z);
  const bx_ = (w, h, d, c, x, y, zz, o) => {
    const m = new T.Mesh(
      new T.BoxGeometry(w, h, d),
      new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)),
    );
    m.position.set(x, y, zz);
    s.add(m);
    return m;
  };
  const tx_ = (t, w, h, bg, fg, fs, x, y, zz, ry = -Math.PI / 2, luz) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: S(t, (w * 128) | 0, (h * 128) | 0, bg, fg, fs * 2), toneMapped: !luz }),
    );
    p.position.set(x, y, zz);
    p.rotation.y = ry;
    s.add(p);
    return p;
  };
  const vid = { color: 0xbfe3f5, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false };
  bx_(3.2, 0.22, 16, 0xc9c6bf, 0.4, 0.11, 0); // andén
  bx_(0.25, 0.24, 16, 0xf2c200, -1.25, 0.12, 0); // cordón amarillo
  bx_(0.12, 3, 0.12, 0x37474f, 1.6, 1.5, -3, { metalness: 0.7, roughness: 0.3 });
  bx_(0.12, 3, 0.12, 0x37474f, 1.6, 1.5, 3, { metalness: 0.7, roughness: 0.3 });
  bx_(0.12, 3, 0.12, 0x37474f, -0.4, 1.5, -3, { metalness: 0.7, roughness: 0.3 });
  bx_(0.12, 3, 0.12, 0x37474f, -0.4, 1.5, 3, { metalness: 0.7, roughness: 0.3 });
  bx_(2.8, 0.18, 7, 0x2e7d32, 0.5, 3.05, 0); // techo verde
  bx_(2.9, 0.08, 7.1, 0xdfe6ea, 0.5, 3.18, 0, { metalness: 0.6, roughness: 0.3 });
  bx_(0.05, 2.4, 5.8, 0, 1.6, 1.5, 0, vid); // vidrio de atrás
  bx_(1.8, 2.4, 0.05, 0, 0.6, 1.5, -3, vid); // vidrios de los lados
  bx_(1.8, 2.4, 0.05, 0, 0.6, 1.5, 3, vid);
  bx_(0.6, 0.12, 4.4, 0x8d6e63, 1.1, 0.62, 0.4); // banca
  bx_(0.12, 0.5, 4.4, 0x8d6e63, 1.38, 0.9, 0.4);
  [-1.5, 2.3].forEach((q) => bx_(0.5, 0.5, 0.12, 0x455a64, 1.1, 0.36, q));
  // pantalla LED (próximo bus) y letrero
  bx_(0.25, 0.7, 2.6, 0x111111, 0.5, 2.6, 0);
  tx_(pk_(["🚌 ATD  2 min", "🚌 LUMACA  4 min", "🚌 28 PORVENIR 1 min", "🚌 ATD  6 min"]), 2.4, 0.5, "#050505", "#ffb020", 20, 0.36, 2.6, 0, -Math.PI / 2, 1);
  tx_("PARADA · REMODELADA", 6.6, 0.42, "#2e7d32", "#ffffff", 20, -0.95, 3.05, 0);
  // panel de anuncio iluminado y mapa de rutas
  bx_(0.2, 2.2, 1.4, 0x263238, 1.45, 1.4, -3.7);
  tx_("MAPA DE RUTAS", 1.2, 1.9, "#e3f2fd", "#0d47a1", 13, 1.33, 1.4, -3.7, -Math.PI / 2, 1);
  // poste con el letrero de PARADA
  bx_(0.12, 3.8, 0.12, 0x777777, -0.9, 1.9, 5);
  tx_("PARADA", 1.6, 0.6, "#ffd23f", "#111111", 30, -0.9, 3.6, 5.07, 0);
  tx_("PARADA", 1.6, 0.6, "#ffd23f", "#111111", 30, -0.9, 3.6, 4.93, Math.PI);
  // basurero y maceteras con arbustos
  bx_(0.5, 0.9, 0.5, 0x2e7d32, -0.6, 0.67, -4.6);
  [-6.5, 6.5].forEach((q) => {
    bx_(1.2, 0.6, 1.2, 0x9e9e9e, 0.8, 0.52, q);
    const b = new T.Mesh(new T.IcosahedronGeometry(0.75, 0), M(0x3f8f3a));
    b.position.set(0.8, 1.3, q);
    s.add(b);
  });
  const pp = [];
  for (let i = 0; i < 6; i++) {
    const p = new T.Group(),
      b = new T.Mesh(
        new T.CylinderGeometry(0.25, 0.3, 1.2, 8),
        M(new T.Color().setHSL(Math.random(), 0.6, 0.5).getHex()),
      ),
      h = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), M(0xe0b08a));
    b.position.y = 0.8;
    h.position.y = 1.65;
    p.add(b, h);
    p.position.set(R(-0.9, 0.4), 0.22, R(-2.6, 2.6));
    s.add(p);
    pp.push(p);
  }
  sh(s);
  {
    const q = zoneAt(z);
    if (q == 2 || q == 5 || q == 16 || Math.abs((-z % CICLO) - 6500) < 135) s.visible = false;
  }
  g.add(s);
  sc.add(g);
  return { z, g, zn, pp, t: 0 };
}
// rotonda La Y Griega
const rb = new T.Group(),
  pO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
const ring = new T.Mesh(
  new T.CircleGeometry(27, 64),
  new T.MeshStandardMaterial(Object.assign({ color: 0x3b3e44, roughness: 0.9 }, pO)),
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.02;
ring.receiveShadow = true;
rb.add(ring);
const wl = new T.Mesh(
  new T.RingGeometry(25.6, 25.9, 64),
  new T.MeshBasicMaterial({
    color: 0xeeeeee,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  }),
);
wl.rotation.x = -Math.PI / 2;
wl.position.y = 0.03;
rb.add(wl);
const cb = new T.Mesh(new T.CylinderGeometry(11.7, 11.7, 0.4, 48), M(0xe6e6e6)),
  isl = new T.Mesh(new T.CylinderGeometry(11, 11, 0.5, 48), M(0x3f8f3a));
cb.position.y = 0.2;
isl.position.y = 0.25;
cb.receiveShadow = isl.receiveShadow = true;
rb.add(cb, isl);
const yM = new T.MeshStandardMaterial({ color: 0x1b4fa8, roughness: 0.3, metalness: 0.5 }),
  pl = new T.Mesh(new T.CylinderGeometry(3, 3.4, 1.2, 24), M(0xf5f5f5)),
  st2 = new T.Mesh(new T.BoxGeometry(1.1, 6, 1.1), yM);
pl.position.y = 1;
st2.position.y = 4.6;
pl.castShadow = st2.castShadow = true;
rb.add(pl, st2);
[-1, 1].forEach((s) => {
  const a = new T.Mesh(new T.BoxGeometry(1, 5.2, 1), yM);
  a.position.set(s * 1.25, 9.7, 0);
  a.rotation.z = -s * 0.5;
  a.castShadow = true;
  rb.add(a);
});
[0, Math.PI].forEach((r) => {
  const p = new T.Mesh(
    new T.PlaneGeometry(4.4, 0.8),
    new T.MeshBasicMaterial({ map: S("ROTONDA LA Y GRIEGA", 512, 96, "#f5f5f5", "#1b4fa8", 42) }),
  );
  p.position.set(0, 1, r ? -3.5 : 3.5);
  p.rotation.y = r;
  rb.add(p);
});
for (let i = 0; i < 8; i++) {
  const t = tree(),
    a = (i * Math.PI) / 4;
  t.scale.setScalar(0.75);
  t.position.set(Math.cos(a) * 8, 0.4, Math.sin(a) * 8);
  rb.add(t);
}
function gs(x, z, ry) {
  const g = new T.Group(),
    p = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 3, 6), M(0x777)),
    b = new T.Mesh(
      new T.PlaneGeometry(4.2, 1.3),
      new T.MeshBasicMaterial({ map: S("ROTONDA · LA Y GRIEGA", 512, 160, "#0a7a43", "#fff", 34) }),
    );
  b.position.y = 3.4;
  p.position.y = 1.5;
  g.add(p, b);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  rb.add(g);
}
gs(22, 75, 0);
gs(-22, -75, Math.PI);
rb.position.z = RZ;
rb.updateMatrix();
sc.add(rb);
const md = new T.Group();
md.add(
  mm(26, 5.5, 12, 0x1c1c1e, 0, 2.75, 0),
  mm(27, 0.5, 13, 0xf2f2f2, 0, 5.7, 0),
  mm(3, 12, 2.6, 0xd62828, -11.5, 6, 6.8),
  mm(10, 3, 0.2, 0x1a3a5a, -1, 2, 6.05, { metalness: 0.8, roughness: 0.1 }),
);
const pk = new T.Mesh(
  new T.PlaneGeometry(26, 16),
  new T.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.9 }),
);
pk.rotation.x = -Math.PI / 2;
pk.position.set(0, 0.03, 14);
md.add(pk);
const mp = (t, w, h, bg, fg, fs, x, y, z) => {
  const p = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: S(t, (w * 40) | 0, (h * 40) | 0, bg, fg, fs) }),
  );
  p.position.set(x, y, z);
  md.add(p);
};
mp("McDonald’s", 8, 1.2, "#1c1c1e", "#fff", 44, 1.5, 4.4, 6.1);
mp("M", 2.4, 2.4, "#d62828", "#ffc72c", 96, -11.5, 9, 8.15);
md.position.set(70, 0, -6); // más afuera: por aquí pasa el carril externo
md.rotation.y = -Math.PI / 2;
rb.add(md);
// zonas
const ZN = [
    "Centro urbano",
    "Autopista",
    "Puente atirantado",
    "Ruta del bosque",
    "Peaje Quick Pass",
    "Túnel Zurquí",
    "Ruta de la montaña · puente de madera",
    "Rotonda del Walmart · cruce ferroviario",
    "San José · Estadio Nacional",
    "Circunvalación × Ruta 27",
    "Rotonda Rancho de Guanacaste",
    "Rotonda del Bicentenario",
    "Rotonda de la Bandera (noche)",
    "Cruce Río Frío · Pococí",
    "Obras en construcción",
    "Terminal de buses",
    "Pista de agua",
    "Pista de carreras",
    "Pista de prueba (sin carros)",
  ],
  zoneAt = (z) => Math.floor(Math.max(0, -z) / 1000) % NZ;
const wo = new T.Group();
sc.add(wo);
let cyc = 0,
  tolled = 0,
  zPrev = -1;
const wNrm = (() => {
  const S_ = 256,
    c = document.createElement("canvas");
  c.width = c.height = S_;
  const x = c.getContext("2d"),
    d = x.createImageData(S_, S_),
    W_ = [
      [3, 1, 0.5, 0],
      [-2, 4, 0.35, 1.3],
      [5, -3, 0.22, 2.1],
      [1, 7, 0.15, 0.7],
      [9, 2, 0.08, 4],
    ];
  for (let j = 0; j < S_; j++)
    for (let i = 0; i < S_; i++) {
      let dx = 0,
        dy = 0;
      const u = i / S_,
        v = j / S_;
      for (const [a, b, amp, ph] of W_) {
        const k = Math.cos(6.2832 * (a * u + b * v) + ph) * amp;
        dx += k * a;
        dy += k * b;
      }
      let nx = -dx * 0.08,
        ny = -dy * 0.08,
        l = Math.hypot(nx, ny, 1);
      const o = (j * S_ + i) * 4;
      d.data[o] = ((nx / l) * 0.5 + 0.5) * 255;
      d.data[o + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      d.data[o + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      d.data[o + 3] = 255;
    }
  x.putImageData(d, 0, 0);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(170, 170);
  return t;
})();
const water = new T.Mesh(
  new T.PlaneGeometry(2000, 2000),
  new T.MeshStandardMaterial({
    color: 0x26708f,
    roughness: 0.08,
    metalness: 0.5,
    envMap: ENV,
    envMapIntensity: 1.3,
    normalMap: wNrm,
    normalScale: new T.Vector2(0.55, 0.55),
  }),
);
water.rotation.x = -Math.PI / 2;
water.position.y = -3;
water.visible = false;
sc.add(water);
function tower(z) {
  const g = new T.Group(),
    c = 0xc9c9c4,
    v = [];
  [-1, 1].forEach((q) => {
    g.add(mm(1.8, 42, 1.8, c, q * 8.2, 15, 0));
    for (let i = 0; i < 10; i++)
      for (const d of [-1, 1]) {
        const y = 38 - i * 1.5;
        v.push(q * 8.2, y, 0, q * 7.2, 0.9, d * (9 + i * 7.5));
      }
  });
  g.add(mm(17, 1.5, 1.6, c, 0, 34, 0), mm(17, 1.5, 1.6, c, 0, 20, 0));
  const ge = new T.BufferGeometry();
  ge.setAttribute("position", new T.Float32BufferAttribute(v, 3));
  g.add(new T.LineSegments(ge, new T.LineBasicMaterial({ color: 0xd8434f })));
  g.position.z = z;
  wo.add(g);
}
tower(-2250);
tower(-2750);
function toll(z) {
  const g = new T.Group();
  g.add(mm(34, 0.9, 9, 0xd0d3d5, 0, 6, 0));
  [-8, 0, 8].forEach((x) => g.add(mm(1.1, 6, 1.1, 0x777, x, 3, 0)));
  [-7.7, 0, 7.7].forEach((x) => g.add(mm(1.6, 0.9, 14, 0xf2c200, x, 0.45, 0)));
  [-3.5, 3.5].forEach((x) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(3, 0.9),
      new T.MeshBasicMaterial({ map: S("↓ QUICK PASS", 384, 112, "#111", "#37ff6b", 44) }),
    );
    p.position.set(x, 5.2, 4.6);
    g.add(p);
    for (let i = 0; i < 3; i++) {
      const k = new T.Mesh(new T.ConeGeometry(0.28, 0.8, 8), M(0xff6a00));
      k.position.set(x + (i - 1) * 1.4, 0.4, 7 + i * 2.5);
      g.add(k);
    }
  });
  const lg = new T.Mesh(
    new T.PlaneGeometry(6, 0.8),
    new T.MeshBasicMaterial({ map: S("PEAJE", 256, 64, "#0a6e3a", "#fff", 44) }),
  );
  lg.position.set(0, 7.2, 4.6);
  g.add(lg);
  g.position.z = z;
  wo.add(g);
}
toll(-4250);
function tunnel(z) {
  const g = new T.Group(),
    y = 0xe3b100;
  [1, -1].forEach((q) => {
    const f = q * 60;
    g.add(mm(28, 18, 3, y, -21.5, 9, f), mm(28, 18, 3, y, 21.5, 9, f), mm(15, 11, 3, y, 0, 12.5, f));
  });
  g.add(
    mm(0.8, 7.2, 120, 0x555a5e, -7.9, 3.6, 0),
    mm(0.8, 7.2, 120, 0x555a5e, 7.9, 3.6, 0),
    mm(16.6, 0.8, 120, 0x4a4e52, 0, 7.5, 0),
    mm(60, 14.5, 120, 0x3d6b38, 0, 14.75, 0),
    mm(22, 7.5, 120, 0x3d6b38, -19, 3.75, 0),
    mm(22, 7.5, 120, 0x3d6b38, 19, 3.75, 0),
  );
  [-3.5, 3.5].forEach((x) =>
    g.add(mm(0.35, 0.12, 116, 0xff9a2e, x, 7, 0, { emissive: 0xff8a1e, emissiveIntensity: 2 })),
  );
  g.position.z = z;
  wo.add(g);
}
tunnel(-5250);
rd.localClippingEnabled = true;
const cp1 = new T.Plane(new T.Vector3(0, 0, 1), 0),
  cp2 = new T.Plane(new T.Vector3(0, 0, -1), 0);
ground.material.clippingPlanes = [cp1, cp2];
ground.material.clipIntersection = true;
const cany = new T.Mesh(
  new T.PlaneGeometry(2000, 2000),
  new T.MeshStandardMaterial({ color: 0x2f5d34, roughness: 1 }),
);
cany.rotation.x = -Math.PI / 2;
cany.position.y = -45;
sc.add(cany);
function mkTrain(n) {
  const g = new T.Group();
  g.add(mm(3, 3.2, 8, 0xe3b100, 0, 2.3, 0));
  for (let i = 1; i <= n; i++)
    g.add(
      mm(3, 3.4, 9, 0x6a4a8a, 0, 2.4, i * 9.6 + 1),
      mm(3.04, 0.8, 8, 0x9fc4e8, 0, 2.8, i * 9.6 + 1, { emissive: 0x335577 }),
    );
  return g;
}
function wood() {
  const g = new T.Group(),
    L = 260,
    H = L / 2,
    cb = [],
    hg = [],
    ps = [];
  const wt = cv(64, 64, (x, w, h) => {
    for (let i = 0; i < 4; i++) {
      x.fillStyle = ["#a9602d", "#b9703a", "#9a5428", "#b06a35"][i];
      x.fillRect(0, i * 16, w, 15);
    }
  });
  wt.wrapS = wt.wrapT = T.RepeatWrapping;
  wt.repeat.set(1, L / 4);
  const dk = new T.Mesh(
    new T.BoxGeometry(13.4, 0.3, L),
    new T.MeshStandardMaterial({ map: wt, roughness: 0.9 }),
  );
  dk.position.y = 0.1;
  dk.receiveShadow = true;
  g.add(dk);
  [-1, 1].forEach((q) => {
    g.add(
      mm(0.14, 0.14, L, 0xe8742a, q * 6.5, 1.3, 0),
      mm(0.14, 0.14, L, 0xe8742a, q * 6.5, 0.6, 0),
      mm(0.8, 12, 0.8, 0x6b5a48, q * 6.5, 6, -H),
      mm(0.8, 12, 0.8, 0x6b5a48, q * 6.5, 6, H),
    );
    for (let i = 0; i <= 52; i++) {
      const z = -H + i * 5,
        y = 1.8 + 10 * (z / H) ** 2,
        y0 = 1.8 + 10 * ((z - 5) / H) ** 2;
      if (i) cb.push(q * 6.5, y0, z - 5, q * 6.5, y, z);
      hg.push(q * 6.5, y, z, q * 6.5, 1.3, z);
      if (i % 2 == 0) ps.push(q * 6.5, 0.3, z, q * 6.5, 1.5, z);
    }
  });
  const ln = (a, c) => {
    const ge = new T.BufferGeometry();
    ge.setAttribute("position", new T.Float32BufferAttribute(a, 3));
    return new T.LineSegments(ge, new T.LineBasicMaterial({ color: c }));
  };
  g.add(ln(cb, 0xe8742a), ln(hg, 0x2f5fd8), ln(ps, 0x2f5fd8));
  [1, -1].forEach((q) => g.add(mm(2000, 46, 8, 0x7d7364, 0, -23, q * (H + 4))));
  const A = new T.Group(),
    rc = 0x9c5a3c,
    P = (z) => 34 * (1 - (z / H) ** 2);
  A.add(mm(5, 0.8, L, 0x555555, 0, 0, 0));
  for (let i = 0; i < 20; i++) {
    const z0 = -H + i * 13,
      dy = P(z0 + 13) - P(z0),
      m = mm(0.7, 0.7, Math.hypot(13, dy), rc, 0, (P(z0) + P(z0 + 13)) / 2, z0 + 6.5);
    m.rotation.x = -Math.atan2(dy, 13);
    A.add(m);
  }
  for (let z = -H + 13; z < H; z += 13) A.add(mm(0.3, P(z), 0.3, rc, 0, P(z) / 2, z));
  A.position.x = -48;
  g.add(A);
  const tr = mkTrain(5);
  tr.rotation.y = Math.PI;
  tr.position.set(-48, 0.4, -300);
  g.add(tr);
  g.position.z = -6500;
  wo.add(g);
  return tr;
}
const trA = wood();
// rotonda del Walmart
(function () {
  const g = new T.Group(),
    pO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const r = new T.Mesh(
    new T.CircleGeometry(27, 64),
    new T.MeshStandardMaterial(Object.assign({ color: 0x3b3e44, roughness: 0.9 }, pO)),
  );
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.02;
  g.add(r);
  const w = new T.Mesh(
    new T.RingGeometry(25.6, 25.9, 64),
    new T.MeshBasicMaterial({
      color: 0xeeeeee,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
  );
  w.rotation.x = -Math.PI / 2;
  w.position.y = 0.03;
  g.add(w);
  const c = new T.Mesh(new T.CylinderGeometry(11.7, 11.7, 0.4, 48), M(0xe6e6e6)),
    i = new T.Mesh(new T.CylinderGeometry(11, 11, 0.5, 48), M(0x3f8f3a));
  c.position.y = 0.2;
  i.position.y = 0.25;
  g.add(c, i);
  for (let k = 0; k < 7; k++) {
    const t = tree(),
      a = (k * Math.PI) / 3.5;
    t.scale.setScalar(0.8);
    t.position.set(Math.cos(a) * 8, 0.4, Math.sin(a) * 8);
    g.add(t);
  }
  [0, Math.PI].forEach((q) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(6, 1.6),
      new T.MeshBasicMaterial({ map: S("ROTONDA DEL WALMART", 512, 136, "#0a5a9a", "#fff", 40) }),
    );
    p.position.set(0, 2.2, q ? -0.5 : 0.5);
    p.rotation.y = q;
    g.add(p);
  });
  g.position.z = -7250;
  wo.add(g);
  const ms = new T.Group();
  ms.add(
    mm(36, 9, 30, 0x2b3350, 0, 4.5, 0),
    mm(36.2, 0.5, 30.2, 0xc8201f, 0, 6.3, 0),
    mm(38, 0.4, 9, 0x0d6b3a, 0, 4.4, 19),
    mm(0.5, 4.4, 0.5, 0x555555, -17, 2.2, 22),
    mm(0.5, 4.4, 0.5, 0x555555, 17, 2.2, 22),
  );
  const pk = new T.Mesh(
    new T.PlaneGeometry(40, 26),
    new T.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.9 }),
  );
  pk.rotation.x = -Math.PI / 2;
  pk.position.set(0, 0.03, 28);
  ms.add(pk);
  [
    ["MEGASUPER", 16, 3, "#2b3350", "#fff", 60, 0, 7.7],
    ["Ahorro todos los días", 9, 1.1, "#2b3350", "#fff", 34, -9, 5.4],
  ].forEach(([t, w2, h, bg, fg, fs, x, y]) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(w2, h),
      new T.MeshBasicMaterial({ map: S(t, (w2 * 40) | 0, (h * 40) | 0, bg, fg, fs) }),
    );
    p.position.set(x, y, 15.1);
    ms.add(p);
  });
  ms.position.set(70, 0, -7250);
  ms.rotation.y = -Math.PI / 2;
  wo.add(ms);
})();
// cruce ferroviario
const cx = new T.Group(),
  slp = cv(64, 32, (x, w, h) => {
    x.fillStyle = "#4a3b2c";
    x.fillRect(0, 0, w, h);
    x.fillStyle = "#2a2018";
    x.fillRect(4, 0, 10, h);
  });
slp.wrapS = slp.wrapT = T.RepeatWrapping;
slp.repeat.set(160, 1);
const bed = new T.Mesh(
  new T.PlaneGeometry(240, 3.4),
  new T.MeshStandardMaterial({
    map: slp,
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  }),
);
bed.rotation.x = -Math.PI / 2;
bed.position.y = 0.04;
cx.add(bed);
[-0.75, 0.75].forEach((z) => cx.add(mm(240, 0.15, 0.15, 0xb8bcc0, 0, 0.14, z)));
const lamM = new T.MeshStandardMaterial({ color: 0x550000, emissive: 0xff0000, emissiveIntensity: 0.2 }),
  arms = [1, -1].map((q) => {
    const a = new T.Group(),
      b = new T.Mesh(
        new T.BoxGeometry(7, 0.14, 0.14),
        new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x661111 }),
      );
    b.position.x = -q * 3.5;
    a.add(b);
    a.position.set(q * 8.2, 1.1, 2.4);
    a.rotation.z = -q * 1.2;
    cx.add(a, mm(0.2, 3, 0.2, 0x888888, q * 8.2, 1.5, 2.4));
    const l = new T.Mesh(new T.SphereGeometry(0.25, 8, 6), lamM);
    l.position.set(q * 8.2, 3.2, 2.4);
    cx.add(l);
    const sg = new T.Mesh(
      new T.PlaneGeometry(1.6, 1.6),
      new T.MeshBasicMaterial({ map: S("TREN", 128, 128, "#f2c200", "#111", 36) }),
    );
    sg.position.set(q * 9.6, 2.4, 2.4);
    cx.add(sg);
    return a;
  });
const trC = mkTrain(5);
trC.rotation.y = Math.PI / 2;
trC.position.set(999, 0.4, 0);
cx.add(trC);
cx.position.z = -7750;
wo.add(cx);
// ===== ciudades y carreteras nuevas =====
const W = (...a) => wo.add(...a),
  crs = [];
function lines(a, c, g) {
  const ge = new T.BufferGeometry();
  ge.setAttribute("position", new T.Float32BufferAttribute(a, 3));
  const l = new T.LineSegments(ge, new T.LineBasicMaterial({ color: c }));
  g.add(l);
}
// puente colgante verde (ruta del bosque)
(function () {
  const g = new T.Group(),
    c = 0x2f9f5a,
    v = [];
  g.add(mm(48, 0.25, 2.4, c, 0, 9, 0), mm(48, 1.2, 0.1, c, 0, 9.7, 1.2), mm(48, 1.2, 0.1, c, 0, 9.7, -1.2));
  [-1, 1].forEach((q) => {
    [-1.3, 1.3].forEach((z) => {
      g.add(mm(0.35, 16, 0.35, c, q * 13, 8, z));
      v.push(q * 13, 15, z, q * 24, 9.7, z);
    });
    g.add(mm(0.3, 0.3, 2.9, c, q * 13, 15, 0));
  });
  for (const z of [-1.3, 1.3])
    for (let i = 0; i < 26; i++) {
      const x1 = -13 + i,
        x2 = x1 + 1,
        y = (x) => 11 + (x / 13) ** 2 * 4;
      v.push(x1, y(x1), z, x2, y(x2), z);
      if (i % 2 == 0) v.push(x1, y(x1), z, x1, 9.7, z);
    }
  lines(v, c, g);
  g.position.z = -3250;
  W(g);
})();
// San José: estadio, condominio
(function () {
  const g = new T.Group(),
    wm = new T.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.6, side: T.DoubleSide });
  const bl = new T.Mesh(new T.CylinderGeometry(30, 34, 16, 40, 1, true), wm);
  bl.scale.z = 1.7;
  bl.position.y = 8;
  const pt = new T.Mesh(new T.CircleGeometry(26, 32), M(0x3f8f3a));
  pt.rotation.x = -Math.PI / 2;
  pt.position.y = 0.1;
  pt.scale.y = 1.7;
  const ar = new T.Mesh(new T.CylinderGeometry(24, 24, 76, 32, 1, true, Math.PI / 2, Math.PI), wm);
  ar.rotation.x = Math.PI / 2;
  ar.position.y = 6;
  g.add(bl, pt, ar);
  g.position.set(-85, 0, -8500);
  W(g);
  const co = new T.Group(),
    rf = new T.Mesh(new T.ConeGeometry(11, 5, 4), M(0xb5482d));
  rf.rotation.y = Math.PI / 4;
  rf.position.y = 25;
  co.add(
    mm(18, 22, 12, 0xe9b57a, 0, 11, 0),
    mm(4, 24, 4, 0x8a4a3a, -7, 12, 6.5),
    mm(19, 0.8, 13, 0xb5482d, 0, 22.3, 0),
    rf,
  );
  co.position.set(48, 0, -8450);
  W(co);
})();
// Circunvalación × Ruta 27
(function () {
  const g = new T.Group(),
    a = 0x3b3e44,
    pm = new T.MeshStandardMaterial({
      color: a,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  g.add(pn(7, 90, a, 29.5, 0.03, 0), pn(7, 90, a, 46.5, 0.03, 0), pn(10, 90, 0x3f8f3a, 38, 0.04, 0));
  const r = new T.Mesh(new T.RingGeometry(5, 12, 40, 1, 0, Math.PI), pm);
  r.rotation.x = -Math.PI / 2;
  r.position.set(38, 0.03, -45);
  const d = new T.Mesh(new T.CircleGeometry(5, 24), M(0x3f8f3a));
  d.rotation.x = -Math.PI / 2;
  d.position.set(38, 0.04, -45);
  g.add(r, d, mm(0.4, 7, 0.4, 0x777777, -8.5, 3.5, 60), mm(0.4, 7, 0.4, 0x777777, 8.5, 3.5, 60));
  const sg = new T.Mesh(
    new T.PlaneGeometry(14, 2.6),
    new T.MeshBasicMaterial({ map: S("CIRCUNVALACIÓN × RUTA 27", 512, 100, "#0a6e3a", "#fff", 34) }),
  );
  sg.position.set(0, 6, 60);
  g.add(sg);
  g.position.z = -9500;
  W(g);
})();
// Rancho de Guanacaste: óvalos a cada lado del paso a desnivel
(function () {
  const g = new T.Group();
  [-1, 1].forEach((q) => {
    const e = new T.Mesh(
        new T.CircleGeometry(1, 40),
        new T.MeshStandardMaterial({
          color: 0x3b3e44,
          roughness: 0.9,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      ),
      i = new T.Mesh(new T.CircleGeometry(1, 40), M(0x3f8f3a));
    [e, i].forEach((m) => {
      m.rotation.x = -Math.PI / 2;
      m.position.x = q * 29;
    });
    e.position.y = 0.03;
    e.scale.set(24, 36, 1);
    i.position.y = 0.06;
    i.scale.set(13, 26, 1);
    g.add(e, i);
  });
  g.position.z = -10500;
  W(g);
})();
// rotondas Bicentenario y Bandera
function rnd(z, k) {
  const g = new T.Group(),
    pO = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const r = new T.Mesh(
    new T.CircleGeometry(27, 64),
    new T.MeshStandardMaterial(Object.assign({ color: 0x3b3e44, roughness: 0.9 }, pO)),
  );
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.02;
  const w = new T.Mesh(
    new T.RingGeometry(25.6, 25.9, 64),
    new T.MeshBasicMaterial({
      color: 0xeeeeee,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
  );
  w.rotation.x = -Math.PI / 2;
  w.position.y = 0.03;
  const c = new T.Mesh(new T.CylinderGeometry(11.7, 11.7, 0.4, 48), M(0xe6e6e6)),
    i = new T.Mesh(new T.CylinderGeometry(11, 11, 0.5, 48), M(0x3f8f3a));
  c.position.y = 0.2;
  i.position.y = 0.25;
  g.add(r, w, c, i);
  if (k == "b") {
    const t = cv(512, 512, (x, w, h) => {
      x.fillStyle = "#4f9a3f";
      x.fillRect(0, 0, w, h);
      x.strokeStyle = "#fff";
      x.lineWidth = 4;
      for (let n = 0; n < 7; n++) {
        x.beginPath();
        x.arc(166 + n * 30, 336, 120 + n * 18, 3.6, 5.4);
        x.stroke();
      }
      x.beginPath();
      x.arc(170, 300, 50, 0, 6.3);
      x.stroke();
    });
    const d = new T.Mesh(new T.CircleGeometry(11, 48), new T.MeshBasicMaterial({ map: t }));
    d.rotation.x = -Math.PI / 2;
    d.position.y = 0.52;
    g.add(d);
  } else {
    const fl = cv(240, 160, (x, w, h) => {
      ["#1d3f9a", "#fff", "#d62828", "#fff", "#1d3f9a"].forEach((c, j) => {
        x.fillStyle = c;
        x.fillRect(0, [0, 32, 64, 96, 128][j] * 1, w, [32, 32, 32, 32, 32][j]);
      });
    });
    g.add(mm(0.25, 13, 0.25, 0xf2f2f2, 0, 6.5, 0));
    const fg = new T.Mesh(
      new T.PlaneGeometry(4.5, 3),
      new T.MeshBasicMaterial({ map: fl, side: T.DoubleSide }),
    );
    fg.position.set(2.4, 11, 0);
    g.add(fg);
    [
      [25.2, 0x3b7bff],
      [11.8, 0xff3b4f],
    ].forEach(([rr, cc]) => {
      const n = new T.Mesh(new T.TorusGeometry(rr, 0.18, 6, 90), new T.MeshBasicMaterial({ color: cc }));
      n.rotation.x = Math.PI / 2;
      n.position.y = 0.4;
      g.add(n);
    });
    for (let n = 0; n < 10; n++) {
      const a = n * 0.628,
        l = new T.Mesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: 0xfff2b0 }));
      l.position.set(Math.cos(a) * 7, 0.8, Math.sin(a) * 7);
      g.add(l);
    }
  }
  [0, Math.PI].forEach((q) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(6, 0.9),
      new T.MeshBasicMaterial({
        map: S(
          k == "b" ? "ROTONDA DEL BICENTENARIO" : k == "n" ? "ROTONDA DE LAS NACIONES" : "ROTONDA DE LA BANDERA",
          512,
          77,
          "#f5f5f5",
          "#1b4fa8",
          32,
        ),
      }),
    );
    p.position.set(0, 1.2, q ? -11.6 : 11.6);
    p.rotation.y = q;
    g.add(p);
  });
  g.position.z = z;
  W(g);
}
rnd(-11250, "b");
rnd(-12250, "f");
// Cruce Río Frío: paso peatonal, comercios, ramal
(function () {
  const g = new T.Group(),
    c = 0xbfc4c8;
  g.add(mm(26, 0.4, 3, c, 0, 6.4, 0), mm(26, 1, 0.12, c, 0, 7.2, 1.5), mm(26, 1, 0.12, c, 0, 7.2, -1.5));
  [-1, 1].forEach((q) => {
    g.add(mm(1.4, 6.4, 3.2, 0x9aa0a4, q * 11, 3.2, 0));
    const r = mm(15.4, 0.4, 3, c, q * 19, 3.2, 0);
    r.rotation.z = -q * 0.43;
    g.add(r);
  });
  g.position.z = -13400;
  W(g);
  [-1, 1].forEach((q) =>
    W(
      mm(46, 5.5, 18, 0xf1ede4, q * 55, 2.75, -13450 + q * 20),
      mm(47, 0.7, 19, 0xd94a54, q * 55, 5.8, -13450 + q * 20),
    ),
  );
  W(pn(9, 120, 0x3b3e44, 24, 0.03, -13400, 0.3));
})();
// Obras: grúas torre, estructuras, viaducto prefabricado
function crane(x, z, h) {
  const g = new T.Group(),
    o = 0xe8742a,
    j = new T.Group();
  g.add(mm(1.4, h, 1.4, o, 0, h / 2, 0));
  j.position.y = h;
  j.add(
    mm(38, 1, 1, o, 11, 0, 0),
    mm(2.4, 1.8, 2.4, 0x777777, -9, -0.4, 0),
    mm(2.2, 2.2, 2.2, 0xd8d8d8, 1.5, -1.6, 1.3),
    mm(0.5, 4, 0.5, o, -0.5, 2.5, 0),
  );
  g.add(j);
  g.position.set(x, 0, z);
  crs.push(j);
  W(g);
}
function frame(x, z, n) {
  const g = new T.Group();
  for (let k = 0; k < n; k++) g.add(mm(14, 0.4, 14, 0x9a9a96, 0, k * 3.4 + 0.2, 0));
  for (const a of [-6.5, 6.5])
    for (const b of [-6.5, 6.5]) g.add(mm(0.6, n * 3.4, 0.6, 0x8a8a86, a, n * 1.7, b));
  g.add(mm(14, 3, 0.5, 0xdcd2c0, 0, 1.5, -6.5));
  g.position.set(x, 0, z);
  W(g);
}
frame(-40, -14450, 9);
frame(42, -14550, 12);
crane(-26, -14450, 32);
crane(28, -14550, 42);
crane(-55, -14560, 26);
W(
  mm(30, 1.4, 90, 0xb9b9b4, -70, 5, -14500),
  mm(2, 5, 2, 0x9a9a96, -62, 2.5, -14470),
  mm(2, 5, 2, 0x9a9a96, -78, 2.5, -14470),
  mm(2, 5, 2, 0x9a9a96, -62, 2.5, -14530),
  mm(2, 5, 2, 0x9a9a96, -78, 2.5, -14530),
);
// salidas, mall, túneles
const sd = (px, pz, a, b, c, d) => {
    const dx = c - a,
      dz = d - b,
      t = Math.max(0, Math.min(1, ((px - a) * dx + (pz - b) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(px - a - t * dx, pz - b - t * dz);
  },
  XS = [];
[
  [-700, "Ruta 27 · Caldera"],
  [-3600, "Ruta 32 · Limón"],
  [-5600, "Cartago · Ruta 2"],
  [-11700, "Ruta 1 · Guanacaste"],
].forEach(([z0, nm]) => {
  [
    [7, z0, 60, z0 - 90],
    [60, z0 - 90, 60, z0 - 600],
    [60, z0 - 600, 7, z0 - 690],
  ].forEach(([x1, z1, x2, z2]) => {
    XS.push([x1, z1, x2, z2, 5]);
    const dx = x2 - x1,
      dz = z2 - z1,
      L = Math.hypot(dx, dz),
      ry = Math.atan2(-dx, -dz),
      mx_ = (x1 + x2) / 2,
      mz_ = (z1 + z2) / 2;
    W(pn(11, L, 0xe8e8e8, mx_, 0.025, mz_, ry), pn(10, L, 0x3b3e44, mx_, 0.03, mz_, ry));
  });
  const sg = new T.Mesh(
    new T.PlaneGeometry(5.2, 1.4),
    new T.MeshBasicMaterial({ map: S("SALIDA · " + nm, 512, 138, "#0a6e3a", "#fff", 38) }),
  );
  sg.position.set(9.8, 3.6, z0 + 120);
  W(sg, mm(0.15, 3.6, 0.15, 0x777777, 9.8, 1.8, z0 + 120));
});
XS.push([7, -4650, 55, -4650, 5], [77, -4725, 77, -4575, 30]);
GZ.forEach((gz) => XS.push([29, gz - 14, 29, gz + 14, 22]));
GZ.forEach((gz) => {
  const g = new T.Group(),
    r = 0xd62828;
  g.add(
    pn(44, 32, 0x3b3e44, 29, 0.03, 0),
    mm(22, 0.7, 14, 0xf4f4f4, 26, 5.6, 0),
    mm(22.2, 0.4, 14.2, r, 26, 5.2, 0),
    mm(8, 4, 12, 0xe8e2d4, 45, 2, 0),
    mm(8.4, 0.4, 12.4, r, 45, 4.2, 0),
    mm(0.3, 10, 0.3, 0x888888, 12, 5, -9),
  );
  [
    [-8, -5],
    [8, -5],
    [-8, 5],
    [8, 5],
  ].forEach(([x, z]) => g.add(mm(0.5, 5.6, 0.5, 0x999999, 26 + x, 2.8, z)));
  [-7, 7].forEach((x) =>
    [-3, 3].forEach((z) =>
      g.add(mm(0.9, 1.6, 0.7, r, 26 + x, 0.8, z), mm(0.92, 0.5, 0.72, 0xffffff, 26 + x, 1.5, z)),
    ),
  );
  const sg = new T.Mesh(
    new T.PlaneGeometry(7, 1.6),
    new T.MeshBasicMaterial({
      map: S("GASOLINERA", 512, 117, r == 0xd62828 ? "#d62828" : "#c00", "#fff", 64),
    }),
  );
  sg.position.set(12, 9.5, -9);
  sg.rotation.y = -Math.PI / 2;
  g.add(sg);
  g.position.z = gz;
  W(g);
});
const LZ = [0, 1, 3, 4, 7, 8, 9, 13, 14, 15],
  onLf = (x, z) =>
    x < -25.5 &&
    x > -34.5 &&
    LZ.includes(zoneAt(z - CZ)) &&
    !HB.some((r) => z - CZ < r[0] + 60 && z - CZ > r[1] - 60);
// Pistas extra donde se puede manejar sin salirse (js/mundo3.js agrega los carriles externos de la
// Rotonda de La Y Griega y el patio de la Terminal Lumaca). Cada una es una función (x, z) => true/false.
const PISTAS_EXTRA = [];
const onXs = (x, z) => Math.abs(x) > 5 && XS.some((q) => sd(x, z - CZ, q[0], q[1], q[2], q[3]) < q[4]);
(function () {
  const g = new T.Group(),
    fm = facade(60, 24, 150, 0xc9d1d8);
  fm.position.set(135, 12, 0);
  g.add(fm);
  const sg = new T.Mesh(
    new T.PlaneGeometry(40, 6.3),
    new T.MeshBasicMaterial({ map: S("MEGA MALL", 1024, 160, "#1b2a4a", "#ffd23f", 110) }),
  );
  sg.position.set(104.9, 19.5, 0);
  sg.rotation.y = -Math.PI / 2;
  g.add(sg);
  g.add(
    mm(2, 8, 26, 0x14202e, 104.2, 4, 0, { metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.7 }),
    mm(8, 0.6, 32, 0xc8201f, 101, 8.5, 0),
    pn(60, 150, 0x3b3e44, 77, 0.03, 0),
    pn(48, 10, 0x3b3e44, 31, 0.03, 0),
  );
  const im = new T.InstancedMesh(
      new T.BoxGeometry(2, 1.3, 4.2),
      new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.4 }),
      240,
    ),
    m4 = new T.Matrix4();
  let n = 0;
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 28; j++)
      if (Math.random() < 0.65 && n < 240) {
        m4.setPosition(56 + i * 6, 0.8, -66 + j * 4.8);
        im.setMatrixAt(n, m4);
        if (im.setColorAt) im.setColorAt(n, new T.Color().setHSL(Math.random(), 0.85, 0.5));
        n++;
      }
  im.count = n;
  g.add(im);
  g.position.z = -4650;
  W(g);
})();
tunnel(-6850);
(function () {
  const L = 240,
    c = 0x8e9399,
    g = new T.Group();
  g.add(
    mm(0.8, 6.5, L, c, -7.9, 3.25, 0),
    mm(0.8, 6.5, L, c, 7.9, 3.25, 0),
    mm(16.6, 0.8, L, 0xa9aeb3, 0, 6.9, 0),
    mm(44, 8, L, 0x4f8a3a, 0, 11.4, 0),
    mm(14, 7.4, L, 0x9a9fa4, -15.4, 3.7, 0),
    mm(14, 7.4, L, 0x9a9fa4, 15.4, 3.7, 0),
  );
  [-3.5, 3.5].forEach((x) =>
    g.add(mm(0.35, 0.12, L - 4, 0xcfe8ff, x, 6.4, 0, { emissive: 0xbfe0ff, emissiveIntensity: 2.5 })),
  );
  for (let i = -L / 2 + 15; i < L / 2; i += 30)
    [-3.5, 3.5].forEach((x) => g.add(mm(1.2, 1.2, 3, 0x666b70, x, 6, i)));
  for (let i = -L / 2 + 20; i < L / 2; i += 60)
    [1, -1].forEach((q) => {
      const p = new T.Mesh(
        new T.PlaneGeometry(3, 0.9),
        new T.MeshBasicMaterial({ map: S("SALIDA", 192, 58, "#0a6e3a", "#fff", 34) }),
      );
      p.position.set(q * 7.45, 4.6, i);
      p.rotation.y = (-q * Math.PI) / 2;
      g.add(p);
    });
  for (let k = 0; k < 10; k++) {
    const t = tree();
    t.position.set(R(-19, 19), 15.4, -L / 2 + 12 + (k * (L - 24)) / 9);
    g.add(t);
  }
  [1, -1].forEach((q) => {
    const p = new T.Mesh(
      new T.PlaneGeometry(14, 1.8),
      new T.MeshBasicMaterial({ map: S("CARRETERA SUBTERRÁNEA", 512, 66, "#1b2a4a", "#fff", 34) }),
    );
    p.position.set(0, 8.2, q * (L / 2 + 0.1));
    p.rotation.y = q > 0 ? 0 : Math.PI;
    g.add(p);
  });
  g.position.z = -8800;
  W(g);
})();
// Parque Nacional Río Frío (salida a la izquierda)
const BN = [
  { x0: 12, x1: 60, z: -12700, r: 45, a: 3500, m: "🎡 Parque de diversiones", t: 0, d: 0 },
  { x0: -112, x1: -68, z: -13750, r: 30, a: 2500, m: "🌳 Parque Nacional Río Frío", t: 0, d: 0 },
];
(function () {
  const g = new T.Group();
  [
    [-7, -13150, -90, -13250],
    [-90, -13250, -90, -13700],
  ].forEach(([x1, z1, x2, z2]) => {
    XS.push([x1, z1, x2, z2, 5]);
    const dx = x2 - x1,
      dz = z2 - z1,
      L = Math.hypot(dx, dz),
      ry = Math.atan2(-dx, -dz),
      mx_ = (x1 + x2) / 2,
      mz_ = (z1 + z2) / 2;
    g.add(pn(11, L, 0xe8e8e8, mx_, 0.025, mz_, ry), pn(10, L, 0x3b3e44, mx_, 0.03, mz_, ry));
  });
  XS.push([-90, -13720, -90, -13780, 24]);
  g.add(
    pn(48, 70, 0x6b6258, -90, 0.03, -13750),
    pn(80, 9, 0x2d6a8a, -90, 0.05, -13830),
    mm(4, 0.3, 11, 0x8a5a32, -90, 0.5, -13830),
  );
  g.add(
    mm(1.6, 6, 1.6, 0x6b4a2a, -98, 3, -13700),
    mm(1.6, 6, 1.6, 0x6b4a2a, -82, 3, -13700),
    mm(18, 1.4, 1.2, 0x5a3d22, -90, 6.3, -13700),
    mm(6, 3.5, 5, 0x8a5a32, -112, 1.75, -13740),
    mm(7, 0.4, 6, 0x2f6b3a, -112, 3.7, -13740),
  );
  const s2 = new T.Mesh(
    new T.PlaneGeometry(14, 1.4),
    new T.MeshBasicMaterial({ map: S("PARQUE NACIONAL RÍO FRÍO", 512, 51, "#0a5a2a", "#fff", 34) }),
  );
  s2.position.set(-90, 6.3, -13699.3);
  g.add(s2);
  const s3 = new T.Mesh(
    new T.PlaneGeometry(5.2, 1.4),
    new T.MeshBasicMaterial({ map: S("SALIDA · Parque Nacional Río Frío", 512, 138, "#0a6e3a", "#fff", 26) }),
  );
  s3.position.set(-9.8, 3.6, -13030);
  g.add(s3, mm(0.15, 3.6, 0.15, 0x777777, -9.8, 1.8, -13030));
  for (let k = 0; k < 45; k++) {
    const t = tree(),
      z = R(-13950, -13250),
      dx = (Math.random() < 0.5 ? -1 : 1) * R(14, 48);
    if (z > -13800 && z < -13690 && Math.abs(dx) < 26) continue;
    t.scale.setScalar(R(1.4, 2.6));
    t.position.set(-90 + dx, 0, z);
    g.add(t);
  }
  W(g);
})();
// Parque de diversiones (zona nocturna)
const amu = (function () {
  const g = new T.Group(),
    cl = [0xe63946, 0xf4a261, 0x2a9d8f, 0x457b9d, 0xffd166, 0x9b5de5],
    em = (c) => ({ emissive: c, emissiveIntensity: 0.8 });
  XS.push([7, -12700, 60, -12700, 5], [40, -12740, 40, -12660, 22]);
  g.add(
    pn(90, 120, 0x8a8f94, 105, 0.03, -12700),
    pn(52, 10, 0x3b3e44, 33, 0.03, -12700),
    pn(40, 80, 0x3b3e44, 40, 0.03, -12700),
    mm(2, 8, 2, 0xe63946, 62, 4, -12708),
    mm(2, 8, 2, 0xe63946, 62, 4, -12692),
    mm(2, 2, 18, 0xffd166, 62, 8.5, -12700, em(0xffaa00)),
  );
  const gt = new T.Mesh(
    new T.PlaneGeometry(16, 1.8),
    new T.MeshBasicMaterial({ map: S("PARQUE DE DIVERSIONES", 512, 58, "#e63946", "#fff", 34) }),
  );
  gt.position.set(61.2, 8.5, -12700);
  gt.rotation.y = -Math.PI / 2;
  g.add(gt);
  const rs = new T.Mesh(
    new T.PlaneGeometry(6, 1.4),
    new T.MeshBasicMaterial({ map: S("Parque de diversiones", 512, 119, "#e63946", "#fff", 40) }),
  );
  rs.position.set(9.5, 4, -12560);
  g.add(rs, mm(0.15, 4, 0.15, 0x777777, 9.5, 2, -12560));
  const fw = new T.Group(),
    pv = new T.Group(),
    cabs = [];
  pv.rotation.y = Math.PI / 2;
  pv.position.set(112, 22, -12680);
  fw.add(
    new T.Mesh(
      new T.TorusGeometry(18, 0.35, 8, 48),
      new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x6688ff, emissiveIntensity: 0.8 }),
    ),
  );
  for (let i = 0; i < 6; i++) {
    const sp = mm(0.25, 36, 0.25, 0xdddddd, 0, 0, 0);
    sp.rotation.z = (i * Math.PI) / 6;
    fw.add(sp);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6,
      c = mm(1.8, 1.6, 1.8, cl[i % 6], Math.cos(a) * 18, Math.sin(a) * 18, 0, em(cl[i % 6]));
    fw.add(c);
    cabs.push(c);
  }
  pv.add(fw);
  g.add(pv);
  [-1, 1].forEach((q) => {
    const l = mm(0.7, 24, 0.7, 0xcccccc, 112, 11, -12680 + q * 4.5);
    l.rotation.x = -q * 0.39;
    g.add(l);
  });
  const cr = new T.Group();
  cr.position.set(85, 0, -12740);
  cr.add(new T.Mesh(new T.CylinderGeometry(6, 6, 0.5, 24), M(0xffd166)), mm(1, 0.1, 1, 0xffffff, 0, 6.8, 0));
  const cn = new T.Mesh(new T.ConeGeometry(7, 3, 24), M(0xe63946));
  cn.position.y = 6.5;
  cr.add(cn);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    cr.add(
      mm(0.2, 5, 0.2, 0xffffff, Math.cos(a) * 4.5, 2.8, Math.sin(a) * 4.5),
      mm(0.8, 1.2, 1.8, cl[i], Math.cos(a) * 4.5, 1.4, Math.sin(a) * 4.5, em(cl[i])),
    );
  }
  g.add(cr);
  const P = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    P.push(new T.Vector3(130 + 16 * Math.cos(t), 9 + 6 * Math.sin(3 * t) + 5, -12700 + 40 * Math.sin(t)));
  }
  for (let i = 0; i < 48; i++) {
    const a = P[i],
      b = P[(i + 1) % 48],
      L = a.distanceTo(b),
      m = mm(0.5, 0.3, L + 0.2, 0xe63946, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    m.lookAt(b);
    g.add(m);
    if (i % 4 == 0) g.add(mm(0.35, a.y, 0.35, 0xcccccc, a.x, a.y / 2, a.z));
  }
  const cart = mm(2, 1.2, 3, 0xffd166, 0, 0, 0, em(0xffaa00));
  g.add(cart);
  [
    [75, -12660],
    [75, -12690],
    [88, -12665],
  ].forEach(([x, z], i) => g.add(mm(5, 3, 5, cl[i], x, 1.5, z), mm(5.4, 0.4, 5.4, 0xffffff, x, 3.2, z)));
  W(g);
  return { fw, cabs, cr, cart, P, t: 0 };
})();
// pista de agua y pista de carreras
(function () {
  const g = new T.Group();
  [
    [-70, -16400, 26],
    [85, -16700, 20],
    [-60, -16900, 16],
  ].forEach(([x, z, r]) => {
    const i = new T.Mesh(new T.CylinderGeometry(r, r + 4, 3, 24), M(0xe6d3a3));
    i.position.set(x, 0.5, z);
    i.receiveShadow = true;
    g.add(i);
    for (let k = 0; k < 6; k++) {
      const t = tree();
      t.position.set(x + R(-r * 0.6, r * 0.6), 1.9, z + R(-r * 0.6, r * 0.6));
      g.add(t);
    }
  });
  const lh = new T.Group();
  lh.add(
    mm(5, 16, 5, 0xffffff, 0, 8, 0),
    mm(5.2, 3, 5.2, 0xd62828, 0, 4, 0),
    mm(5.2, 3, 5.2, 0xd62828, 0, 10, 0),
    mm(6, 0.6, 6, 0x333333, 0, 16.3, 0),
    mm(3, 2.4, 3, 0xffe9a0, 0, 17.8, 0, { emissive: 0xffd060, emissiveIntensity: 1.2 }),
  );
  lh.position.set(-70, 2, -16400);
  g.add(lh, mm(8, 0.5, 30, 0x8a5a32, 18, 0.3, -16040), mm(8, 0.5, 30, 0x8a5a32, -18, 0.3, -16040));
  W(g);
})();
(function () {
  const g = new T.Group(),
    ck = cv(256, 32, (x, w, h) => {
      for (let i = 0; i < 32; i++)
        for (let j = 0; j < 4; j++) {
          x.fillStyle = (i + j) % 2 ? "#111" : "#fff";
          x.fillRect(i * 8, j * 8, 8, 8);
        }
    });
  [
    [-17100, "SALIDA"],
    [-17900, "META"],
  ].forEach(([z, t]) => {
    g.add(
      mm(0.8, 7, 0.8, 0x555555, -9, 3.5, z),
      mm(0.8, 7, 0.8, 0x555555, 9, 3.5, z),
      pn(14, 1.2, 0xffffff, 0, 0.06, z),
    );
    const b = new T.Mesh(
      new T.PlaneGeometry(19, 1.4),
      new T.MeshBasicMaterial({ map: ck, side: T.DoubleSide }),
    );
    b.position.set(0, 7.2, z);
    const l = new T.Mesh(
      new T.PlaneGeometry(6, 1.2),
      new T.MeshBasicMaterial({ map: S(t, 256, 51, "#d62828", "#fff", 40) }),
    );
    l.position.set(0, 5.9, z + 0.1);
    g.add(b, l);
  });
  for (let i = 0; i < 5; i++)
    g.add(
      mm(8, 1 + i * 1.2, 60, 0x9aa0a8, 28 + i * 8, (1 + i * 1.2) / 2, -17350),
      mm(
        7.6,
        0.3,
        58,
        [0xd62828, 0x1b4fa8, 0xf2c200, 0x2a9d8f, 0xe8e8e8][i],
        28 + i * 8,
        1 + i * 1.2 + 0.15,
        -17350,
      ),
    );
  g.add(
    mm(44, 0.4, 60, 0xdddddd, 44, 9, -17350),
    mm(0.5, 9, 0.5, 0x777777, 24, 4.5, -17322),
    mm(0.5, 9, 0.5, 0x777777, 24, 4.5, -17378),
    mm(10, 5, 40, 0xe8ecef, 50, 2.5, -17600),
    mm(10.4, 0.5, 40.4, 0xd62828, 50, 5.2, -17600),
  );
  const bz = new T.Mesh(
    new T.PlaneGeometry(8, 1.6),
    new T.MeshBasicMaterial({ map: S("BOXES", 256, 51, "#111", "#ffd23f", 40) }),
  );
  bz.position.set(44.9, 3.5, -17600);
  bz.rotation.y = -Math.PI / 2;
  g.add(bz);
  W(g);
})();
// pista de prueba (zona 18, sin carros)
const RAMPS = [
  { x: 5, z: -18200, h: 2.5 },
  { x: -5, z: -18400, h: 4 },
  { x: 5, z: -18700, h: 5.5 },
];
(function () {
  const g = new T.Group(),
    z0 = -18000,
    pw = { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 };
  g.add(
    pn(130, 1000, 0x6e7378, 0, 0.02, z0 - 500),
    pn(9, 400, 0xf2f2f2, -35, 0.025, z0 - 300),
    pn(8, 400, 0x2f3236, -35, 0.03, z0 - 300),
    pn(8, 0.6, 0xffffff, -35, 0.04, z0 - 100),
    pn(8, 0.6, 0xffffff, -35, 0.04, z0 - 500),
  );
  g.add(
    mm(0.3, 4, 0.3, 0x444444, -30, 2, z0 - 100),
    mm(0.5, 0.5, 0.3, 0xd62828, -30, 3.6, z0 - 100, { emissive: 0xff2020, emissiveIntensity: 1.5 }),
    mm(0.5, 0.5, 0.3, 0xf2c200, -30, 3, z0 - 100, { emissive: 0xffcc00, emissiveIntensity: 1.5 }),
    mm(0.5, 0.5, 0.3, 0x2fd05a, -30, 2.4, z0 - 100, { emissive: 0x22ff66, emissiveIntensity: 1.5 }),
  );
  const sr = new T.Mesh(
    new T.RingGeometry(29.6, 30.2, 64),
    new T.MeshBasicMaterial(Object.assign({ color: 0xffffff }, pw)),
  );
  sr.rotation.x = -Math.PI / 2;
  sr.position.set(35, 0.035, z0 - 300);
  g.add(sr);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12,
      c = new T.Mesh(new T.ConeGeometry(0.3, 0.8, 8), M(0xff6a00));
    c.position.set(35 + Math.cos(a) * 32, 0.4, z0 - 300 + Math.sin(a) * 32);
    g.add(c);
  }
  for (let i = 0; i < 10; i++) {
    const c = new T.Mesh(new T.ConeGeometry(0.35, 0.9, 8), M(i % 2 ? 0xff6a00 : 0xffffff));
    c.position.set(-52 + (i % 2 ? 1.5 : -1.5), 0.45, z0 - 130 - i * 30);
    g.add(c);
  }
  RAMPS.forEach((r) => {
    const L = Math.hypot(12, r.h),
      m = mm(8, 0.3, L, 0xf2c200, r.x, r.h / 2, r.z);
    m.rotation.x = Math.atan(r.h / 12);
    g.add(m);
  });
  for (let i = 0; i < 30; i++) g.add(mm(16, 0.18, 0.6, 0x333333, 0, 0.1, z0 - 860 - i * 1.4));
  g.add(
    mm(1.2, 1.2, 1000, 0x1a1a1a, -64, 0.6, z0 - 500),
    mm(1.2, 1.2, 1000, 0x1a1a1a, 64, 0.6, z0 - 500),
    mm(1.25, 0.2, 1000, 0xffffff, -64, 1.1, z0 - 500),
    mm(1.25, 0.2, 1000, 0xffffff, 64, 1.1, z0 - 500),
  );
  const sg = new T.Mesh(
    new T.PlaneGeometry(18, 2),
    new T.MeshBasicMaterial({ map: S("PISTA DE PRUEBA · SIN TRÁFICO", 512, 57, "#1b2a4a", "#fff", 30) }),
  );
  sg.position.set(0, 7, z0 - 15);
  g.add(sg, mm(0.8, 7, 0.8, 0x555555, -9.5, 3.5, z0 - 15), mm(0.8, 7, 0.8, 0x555555, 9.5, 3.5, z0 - 15));
  W(g);
})();
// Terminal de buses
(function () {
  const g = new T.Group();
  g.add(
    pn(46, 80, 0x3b3e44, 34, 0.03, 0),
    mm(34, 0.5, 30, 0xd0d3d5, 30, 6.5, -2),
    mm(10, 9, 44, 0xe8ecef, 52, 4.5, -2),
  );
  for (const z of [-14, 0, 14]) for (const x of [16, 44]) g.add(mm(0.6, 6.5, 0.6, 0x888888, x, 3.25, z));
  for (let i = 0; i < 5; i++) {
    const k = SK[i % 3];
    const b = new T.Group();
    b.add(
      mm(2.6, 2.7, 10.4, k.b, 0, 1.7, 0),
      mm(2.62, 0.5, 10.42, k.s, 0, 1, 0),
      mm(2.64, 0.9, 9, 0xbfd8e8, 0, 2.3, 0, {
        metalness: 0.2,
        roughness: 0.05,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    b.rotation.y = Math.PI / 2;
    b.position.set(36, 0, -26 + i * 11);
    g.add(b);
    g.add(mm(0.15, 0.05, 11, 0xffffff, 29.5, 0.05, -26 + i * 11 + 5.5));
  }
  const sg = new T.Mesh(
    new T.PlaneGeometry(16, 2.4),
    new T.MeshBasicMaterial({ map: S("TERMINAL DE BUSES", 512, 77, "#0a5a9a", "#fff", 46) }),
  );
  sg.position.set(46.9, 8.4, -2);
  sg.rotation.y = -Math.PI / 2;
  g.add(sg);
  const s2 = new T.Mesh(
    new T.PlaneGeometry(6, 1.2),
    new T.MeshBasicMaterial({ map: S("TERMINAL", 256, 51, "#0a5a9a", "#fff", 34) }),
  );
  s2.position.set(9, 4, 30);
  g.add(s2, mm(0.3, 4, 0.3, 0x777777, 9, 2, 30));
  g.position.z = -15500;
  W(g);
})();
// estado
const B = { x: 3.5, z: 0, h: 0, v: 0, st: 0 };
let state = "menu",
  time = 0,
  cash = 0,
  pas = 0,
  dmg = 0,
  si = 0,
  shake = 0,
  cm_ = 0,
  msgT = 0;
const keys = {};
addEventListener("keydown", (e) => {
  const k = e.code;
  keys[k] = 1;
  if (k == "Escape" || k == "KeyM") {
    toggleMenu();
    return;
  }
  if (e.key && e.key.length == 1) keys["Key" + e.key.toUpperCase()] = 1;
  if (AC && AC.state == "suspended") AC.resume();
  if (k == "KeyC") cm_ = (cm_ + 1) % 4;
  if (k == "KeyH") horn();
  if (k == "KeyR" && state != "menu") start();
  if ((state == "menu" || state == "over") && (k == "Enter" || k == "Space")) start();
  if (["Space", "ArrowUp", "ArrowDown"].includes(k)) e.preventDefault();
});
addEventListener("keyup", (e) => {
  keys[e.code] = 0;
  if (e.key && e.key.length == 1) keys["Key" + e.key.toUpperCase()] = 0;
});
addEventListener("blur", () => {
  for (const k in keys) keys[k] = 0;
});
document.querySelectorAll("[data-k]").forEach((b) => {
  const k = b.dataset.k;
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    keys[k] = 1;
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((v) => b.addEventListener(v, () => (keys[k] = 0)));
});
$("stop").addEventListener("click", () => (cm_ = (cm_ + 1) % 4));
let AC,
  E = {};
const GB = [0, 5, 9, 14, 20, 27, 40];
function audio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const mg = AC.createGain(),
      cp = AC.createDynamicsCompressor();
    mg.gain.value = 1;
    mg.connect(cp);
    cp.connect(AC.destination);
    const o1 = AC.createOscillator(),
      o2 = AC.createOscillator(),
      lp = AC.createBiquadFilter(),
      g1 = AC.createGain(),
      g2 = AC.createGain();
    o1.type = "sawtooth";
    o2.type = "square";
    lp.type = "lowpass";
    lp.Q.value = 2;
    g1.gain.value = 0;
    g2.gain.value = 0.5;
    o1.connect(lp);
    o2.connect(g2);
    g2.connect(lp);
    lp.connect(g1);
    g1.connect(mg);
    const nb = AC.createBuffer(1, AC.sampleRate, AC.sampleRate),
      d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = AC.createBufferSource();
    ns.buffer = nb;
    ns.loop = true;
    const bp = AC.createBiquadFilter(),
      g3 = AC.createGain();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    g3.gain.value = 0;
    ns.connect(bp);
    bp.connect(g3);
    g3.connect(mg);
    const tb = AC.createOscillator(),
      g4 = AC.createGain();
    g4.gain.value = 0;
    tb.connect(g4);
    g4.connect(mg);
    const rn = AC.createBufferSource(),
      hp = AC.createBiquadFilter(),
      rg = AC.createGain();
    rn.buffer = nb;
    rn.loop = true;
    hp.type = "highpass";
    hp.frequency.value = 1800;
    rg.gain.value = 0;
    rn.connect(hp);
    hp.connect(rg);
    rg.connect(mg);
    rn.start();
    E.rg = rg;
    o1.start();
    o2.start();
    ns.start();
    tb.start();
    Object.assign(E, { mg, o1, o2, lp, g1, g3, bp, tb, g4, nb, rpm: 650, g: 0, cut: 0 });
  } catch (e) {}
}
function hiss() {
  if (!AC || !E.nb) return;
  const s = AC.createBufferSource(),
    f = AC.createBiquadFilter(),
    g = AC.createGain(),
    t = AC.currentTime;
  s.buffer = E.nb;
  f.type = "highpass";
  f.frequency.value = 2500;
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  s.connect(f);
  f.connect(g);
  g.connect(E.mg);
  s.start(t);
  s.stop(t + 1);
}
// motor diésel trasero (tipo Mercedes-Benz 4 cil., Caio Apache S21): ralentí ~650 rpm, 6 cambios
function eng(G, play, dt) {
  if (!AC || !E.o1) return;
  const v = (Math.abs(B.v) * 32) / PV.max;
  let g = 0;
  for (let i = 1; i < 6; i++) if (v > GB[i]) g = i;
  if (PV.e) g = 0;
  if (E.o1.type != PV.w) E.o1.type = PV.w;
  if (g != E.g) {
    E.cut = 0.18;
    E.g = g;
  }
  const fr = Math.min(1, (v - GB[g]) / (GB[g + 1] - GB[g])),
    th = G && play ? 1 : 0;
  let tr = v < 0.5 ? PV.i + th * PV.r * 0.7 : PV.i + PV.r * 0.2 + fr * PV.r * 0.7 + th * PV.r * 0.1;
  if (E.cut > 0) {
    E.cut -= dt;
    tr -= 250;
  }
  E.rpm += (tr - E.rpm) * Math.min(1, dt * (tr > E.rpm ? 5 : 9));
  const f = (E.rpm / 60) * PV.c,
    t = AC.currentTime;
  E.o1.frequency.setTargetAtTime(f, t, 0.03);
  E.o2.frequency.setTargetAtTime(f / 2, t, 0.03);
  E.lp.frequency.setTargetAtTime(600 + E.rpm * 0.35 + th * 500, t, 0.05);
  E.g1.gain.setTargetAtTime(
    play ? (0.2 + 0.14 * th + (0.05 * (E.rpm - PV.i)) / PV.r) * (E.cut > 0 ? 0.35 : 1) : 0,
    t,
    0.05,
  );
  E.g3.gain.setTargetAtTime(play ? (0.04 + 0.08 * th) * (PV.nz || 1) * (E.rpm / (PV.i + PV.r)) : 0, t, 0.05);
  E.bp.frequency.setTargetAtTime(600 + E.rpm * 0.6, t, 0.05);
  E.tb.frequency.setTargetAtTime(1400 + E.rpm * 1.4, t, 0.1);
  E.g4.gain.setTargetAtTime(
    play ? ((th * Math.max(0, E.rpm - PV.i - PV.r * 0.25)) / PV.r) * 0.012 * (PV.tb || 1) : 0,
    t,
    0.1,
  );
  if (E.rg) E.rg.gain.setTargetAtTime(RAIN && state == "play" ? 0.07 : 0, t, 0.3);
}
function bell() {
  if (!AC) return;
  const t = AC.currentTime;
  [0, 0.28].forEach((d, i) => {
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = "sine";
    o.frequency.value = i ? 1175 : 1568;
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5);
    o.connect(g);
    g.connect(E.mg || AC.destination);
    o.start(t + d);
    o.stop(t + d + 0.55);
  });
}
function horn() {
  if (!AC) return;
  (PV.hf || [311, 392]).forEach((f) => {
    const o = AC.createOscillator();
    o.type = "square";
    o.frequency.value = f;
    const g = AC.createGain();
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(AC.destination);
    o.start();
    o.stop(AC.currentTime + 0.5);
  });
}
function msg(t, ms = 2200) {
  const m = $("msg");
  m.textContent = t;
  m.style.opacity = 1;
  msgT = ms / 1000;
}
function start() {
  wallet += cash;
  cash = 0;
  save();
  const q = $("bs");
  if (q) {
    skin = +q.value;
    sz = +$("zs").value;
  }
  const zi = sz == INICIO_MONTANA ? 0 : sz; // zona donde aparece el bus
  audio();
  applyGfx();
  if (AC && AC.state == "suspended") AC.resume();
  fuel = 100;
  fuT = 0;
  fuW = 0;
  pullT = 0;
  heat = 0;
  hst = 0;
  onFire = false;
  raceOn = 0;
  st0 = 2 * zi;
  Object.assign(B, { y: 0, vy: 0, fl: 0, tk: 0, lv: 0, x: 5.25, z: -1000 * zi, h: 0, v: 0, st: 0 });
  RZ = zi ? -CICLO - 250 : -250;
  rbMsg = 0;
  rb.position.z = RZ;
  rb.updateMatrix();
  cyc = 0;
  wo.position.z = 0;
  wo.updateMatrix();
  tolled = 0;
  R2 = -7250;
  R3 = -11250;
  R4 = -12250;
  R5 = -23250;
  tbDone = 0;
  mlDone = 0;
  BN.forEach((b) => (b.d = 0));
  CZ = 0;
  BZ = -6500;
  trT = 10;
  trOn = 0;
  trHitT = 0;
  zPrev = -1;
  setVeh(skin);
  chunks.forEach(scatter);
  time = 90;
  cash = 0;
  pas = 0;
  dmg = 0;
  si = 0;
  shake = 0;
  cars.forEach((c) => liberar(c.o));
  cars.length = 0;
  if (stop) liberar(stop.g);
  stop = mkStop(st0);
  state = "play";
  nit = PV.nit;
  $("rs").style.display = "none";
  $("ovr").innerHTML = "";
  $("ov").style.display = "none";
  cam.position.set(3.5, 6, 15 - 1000 * zi);
}
function over(t) {
  state = "over";
  $("rs").style.display = "none";
  $("ov").style.display = "flex";
  $("ovr").innerHTML =
    `<h2>${t}</h2><p>Paradas completadas: <b>${si}</b> · Ganancias: <b>₡${cash.toLocaleString("es-CR")}</b></p>`;
}
$("go").onclick = start;
const VN = [
    "Bus ATD",
    "Bus Mercedes rojo",
    "Bus Mercedes blanco y amarillo",
    "Bus Busscar Porvenir",
    "Jeep todoterreno",
    "Tanque MCR",
    "Hot rod",
    "Tractor",
    "Moto de nieve",
    "Ultraligero",
    "Rover lunar",
    "Fórmula F1",
    "Camión de carreras",
    "Camión monstruo",
    "Auto de rally",
    "Oruga amarilla",
    "Aerodeslizador",
    "Crawler verde",
    "The Beast",
    "Convertible retro",
    "Moto de nieve PRO X",
    "Oruga turbo todoterreno",
  ],
  VI = [
    "🚌",
    "🚌",
    "🚌",
    "🚌",
    "🚙",
    "🪖",
    "🏎",
    "🚜",
    "🛷",
    "🪂",
    "🌙",
    "🏁",
    "🚛",
    "🦖",
    "🏎",
    "🐝",
    "🌊",
    "🦎",
    "🚀",
    "💖",
    "🔷",
    "🐲",
  ];
let gv = 0,
  gf = "*";
const keyOf = (i) => (esBus(i) ? 0 : i - 3);
function save() {
  try {
    localStorage.setItem("adg", JSON.stringify({ w: wallet, t: TUN }));
  } catch (e) {}
}
try {
  const d = JSON.parse(localStorage.getItem("adg") || "null");
  if (d) {
    wallet = d.w;
    d.t.forEach((o, i) => {
      if (TUN[i]) TUN[i] = o;
    });
  }
} catch (e) {}
const sts = (p) => [
  ["Aceleración", p.acc / 20],
  ["Velocidad", p.max / 60],
  ["Agarre", p.gp / 12],
  ["Frenos", p.br / 32],
  ["Manejo", p.turn / 1.5],
  ["Resistencia", 1 / p.dm / 2.5],
  ["Enfriamiento", 1 / p.hr / 3],
  ["Nitro", p.nit / 160],
  ["Ahorro", 1 / p.fc / 1.6],
];
function renderGar() {
  const k = keyOf(gv),
    base = PVS[k],
    tp = tuned(base, k),
    b0 = sts(Object.assign({}, base, { nit: 0 })),
    t0 = sts(tp);
  $("gar").innerHTML =
    `<div class="gh"><button id="gx">✕ Cerrar</button><b>🔧 TUNING</b><span>🪙 ₡${wallet.toLocaleString("es-CR")}</span></div>
<div class="gv"><button id="gl">◀</button><div class="gi">${VI[gv]}<div>${VN[gv]}</div></div><button id="gr">▶</button></div>
<div class="gs">${t0.map((r, i) => `<div class="sb"><span>${r[0]}</span><div><i style="width:${Math.min(100, b0[i][1] * 100)}%"></i><u style="width:${Math.min(100, Math.max(r[1], b0[i][1]) * 100)}%"></u></div></div>`).join("")}</div>
<div class="gt">${["*", "S", "A", "B", "C", "D", "E", "F"].map((t) => `<button class="tf${gf == t ? " on" : ""}" data-t="${t}" style="background:${t == "*" ? "#fff" : TC[t]}">${t == "*" ? "Todas" : t}</button>`).join("")}<button id="gz" class="tf" style="background:#ddd">↺ Resetear</button></div>
<div class="gg">${PARTS.filter((p) => gf == "*" || p.t == gf)
      .map((p) => {
        const l = TUN[k][p.id] | 0,
          c = TIERC[p.t] * (l + 1);
        return `<div class="gc" style="border-color:${TC[p.t]}"><div class="gtt" style="background:${TC[p.t]}">${p.t}</div><div class="ge">${p.e}</div><b>${p.n}</b><div class="pp">${"●".repeat(l) + "○".repeat(5 - l)}</div><small>${p.d}</small><button class="up" data-id="${p.id}" ${l >= 5 || wallet < c ? "disabled" : ""}>${l >= 5 ? "MÁX" : "⬆ ₡" + c.toLocaleString("es-CR")}</button></div>`;
      })
      .join("")}</div>`;
  const g = $("gar");
  g.querySelector("#gx").onclick = closeGarage;
  g.querySelector("#gl").onclick = () => {
    gv = (gv + VN.length - 1) % VN.length;
    $("bs").value = gv;
    renderGar();
  };
  g.querySelector("#gr").onclick = () => {
    gv = (gv + 1) % VN.length;
    $("bs").value = gv;
    renderGar();
  };
  g.querySelectorAll(".tf[data-t]").forEach(
    (d) =>
      (d.onclick = () => {
        gf = d.dataset.t;
        renderGar();
      }),
  );
  g.querySelector("#gz").onclick = () => {
    for (const p of PARTS) {
      const l = TUN[k][p.id] | 0;
      for (let i = 0; i < l; i++) wallet += Math.round(TIERC[p.t] * (i + 1) * 0.7);
    }
    TUN[k] = {};
    save();
    if (k == CK) PV = tuned(PB);
    renderGar();
  };
  g.querySelectorAll(".up").forEach(
    (d) =>
      (d.onclick = () => {
        const id = d.dataset.id,
          p = PARTS.find((x) => x.id == id),
          l = TUN[k][id] | 0,
          c = TIERC[p.t] * (l + 1);
        if (l < 5 && wallet >= c) {
          wallet -= c;
          TUN[k][id] = l + 1;
          save();
          if (k == CK) PV = tuned(PB);
          renderGar();
        }
      }),
  );
}
function openGarage() {
  if (state == "play") toggleMenu();
  wallet += cash;
  cash = 0;
  gv = +$("bs").value;
  gf = "*";
  save();
  $("gar").style.display = "block";
  renderGar();
}
function closeGarage() {
  $("gar").style.display = "none";
  PV = tuned(PB);
  save();
}
function resume() {
  state = "play";
  PV = tuned(PB);
  applyGfx();
  nit = Math.min(nit, PV.nit);
  $("ov").style.display = "none";
}
function toggleMenu() {
  if (state == "play") {
    state = "paused";
    if (E.g1) {
      E.g1.gain.value = 0;
      E.g3.gain.value = 0;
      E.g4.gain.value = 0;
    }
    $("bs").value = skin;
    $("zs").value = zoneAt(B.z);
    $("rs").style.display = "inline-block";
    $("ov").style.display = "flex";
  } else if (state == "paused") resume();
}
$("rs").onclick = resume;
$("mb").onclick = toggleMenu;
$("wb").onclick = openGarage;
$("tg").onclick = openGarage;
function applyGfx() {
  GQ = +$("gq").value;
  RAIN = +$("wx").value;
  const m = GQ ? 4096 : 2048;
  if (sun.shadow.mapSize.x != m) {
    sun.shadow.mapSize.set(m, m);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
  }
  rd.setPixelRatio(Math.min(devicePixelRatio, GQ ? 2 : 1.25));
  rs();
  roadM.bumpMap = GQ ? nz : null;
  roadM.bumpScale = 0.9;
  roadM.envMap = null; // la carretera nunca usa reflejos: así se ve con color en cualquier dispositivo
  roadM.needsUpdate = true;
  ground.material.bumpMap = GQ ? nz : null;
  ground.material.bumpScale = 1.4;
  ground.material.needsUpdate = true;
}
$("gq").value = GQ;
applyGfx();
// Ya no se puede perder: si el vehículo se destroza, queda como nuevo y seguís manejando.
function end() {
  dmg = 0;
  onFire = false;
  heat = 0;
  shake = 0.6;
  msg("🔧 ¡Aquí nadie pierde! Tu vehículo quedó como nuevo", 2500);
}
const _v1 = new T.Vector3(),
  _v2 = new T.Vector3();
function upd(dt) {
  const L = keys.ArrowLeft || keys.KeyA || keys.TL,
    Rt = keys.ArrowRight || keys.KeyD || keys.TR,
    G = keys.ArrowUp || keys.KeyW || keys.TG,
    Br = keys.ArrowDown || keys.KeyS || keys.TB,
    HB = keys.Space;
  const play = state == "play";
  B.st += ((play ? (L ? 1 : 0) - (Rt ? 1 : 0) : 0) - B.st) * Math.min(1, dt * 6);
  B.y = B.y || 0;
  B.vy = B.vy || 0;
  B.tk = B.tk || 0;
  const bo =
    play && PV.nit > 0 && nit > 0 && (keys.ShiftLeft || keys.ShiftRight || keys.KeyN || keys.TN) ? 1 : 0;
  if (bo) {
    nit = Math.max(0, nit - 30 * dt);
    B.v += (B.v < PV.max * 1.3 ? PV.acc * 1.2 * dt : 0) * (B.fl ? 0 : 1);
    shake = Math.max(shake, 0.15);
  } else nit = Math.min(PV.nit, nit + 2 * dt);
  const wet = zoneAt(B.z) == 16 && !PV.hover && !B.fl && B.y < 1;
  const off =
      !MONT.on &&
      !B.fl &&
      zoneAt(B.z) != 16 &&
      Math.abs(B.x) > 7.4 &&
      Math.hypot(B.x, B.z - RC(B.z)) > 27.5 &&
      !onXs(B.x, B.z) &&
      !onLf(B.x, B.z) &&
      !PISTAS_EXTRA.some((f) => f(B.x, B.z)),
    mx = (off ? PV.off : PV.max) * (bo ? 1.3 : 1) * (wet ? 0.6 : 1);
  if (play && B.fl) {
    B.v += ((PV.fs || 22) - (G ? 5 : 0) + (Br ? 9 : 0) - B.v) * 0.5 * dt;
  } else if (play) {
    if (G) B.v += PV.acc * (onFire ? 0.55 : 1) * (1 - Math.max(0, B.v) / mx) * dt;
    if (Br) {
      if (B.v > 0.3) B.v -= PV.br * dt;
      else B.v = Math.max(B.v - 6 * dt, -PV.max * 0.15);
    }
    if (HB) B.v -= Math.sign(B.v) * Math.min(Math.abs(B.v), PV.br * 1.2 * dt);
  }
  B.v -= B.v * PV.dr * dt;
  if (wet) B.v -= B.v * 0.25 * dt;
  if (!B.fl && B.v > mx * 1.02) B.v -= (B.v - mx) * 1.2 * dt;
  if (!G && !Br) B.v -= Math.sign(B.v) * Math.min(Math.abs(B.v), 2 * dt);
  if (off) {
    B.v -= B.v * PV.od * dt;
    shake = Math.max(shake, PV.sk);
  }
  const yr = PV.tank
    ? B.st * PV.turn * (Math.abs(B.v) < 1 ? 1 : 0.6)
    : (B.st * PV.turn * Math.max(-1, Math.min(1, B.v / 6))) / (1 + Math.abs(B.v) * PV.sf);
  B.h += yr * dt;
  B.lv = ((B.lv || 0) + yr * B.v * PV.sl * dt) * Math.exp(-PV.gp * (wet ? 0.35 : 1) * dt);
  if (PV.fly && play) {
    if (!B.fl) {
      if (G && B.v > 14) {
        B.tk += dt;
        if (B.tk > 2.5) {
          B.fl = 1;
          B.vy = 3;
          B.tk = 0;
          msg("🪂 ¡Despegaste! ↑ subir · ↓ bajar", 3500);
        } else if (B.tk > 0.3 && !B.hint) {
          B.hint = 1;
          msg("Mantené ↑ para despegar…", 2000);
        }
      } else {
        B.tk = Math.max(0, B.tk - dt * 2);
        B.hint = 0;
      }
    } else {
      let ty = G ? 7 : Br ? -9 : -1.2;
      if (B.v < 11) ty -= (11 - B.v) * 0.8;
      B.vy += (ty - B.vy) * Math.min(1, dt * 1.3);
      B.y += B.vy * dt;
      B.lv = 0;
      if (B.y > 150) {
        B.y = 150;
        B.vy = Math.min(B.vy, 0);
      }
      if (B.y <= 0) {
        B.y = 0;
        if (B.vy < -9) {
          dmg += Math.abs(B.vy) * 3;
          shake = 1;
          msg("💥 Aterrizaje brusco", 2000);
          B.v *= 0.4;
          if (dmg >= 100) {
            dmg = 100;
            end();
          }
        } else msg("🛬 Aterrizaste", 1500);
        B.fl = 0;
        B.vy = 0;
        B.tk = 0;
      }
    }
  }
  {
    let onr = null;
    if (play && !B.fl && !B.bal && zoneAt(B.z) == 18)
      for (const r of RAMPS) {
        const rz = wo.position.z + r.z;
        if (Math.abs(B.x - r.x) < 4.3 && B.z < rz + 6 && B.z > rz - 6) {
          B.y = (r.h * (rz + 6 - B.z)) / 12;
          onr = r;
        }
      }
    if (onr) {
      B.ron = onr;
      B.rp = Math.atan(onr.h / 12);
      shake = Math.max(shake, 0.1);
    } else {
      B.rp = 0;
      if (B.ron && !B.bal && !B.fl) {
        B.vy = (Math.abs(B.v) * B.ron.h) / 12 + 2.5;
        B.bal = 1;
      }
      B.ron = 0;
    }
  }
  if (B.bal) {
    B.vy -= 20 * dt;
    B.y += B.vy * dt;
    B.lv = 0;
    if (B.y <= 0) {
      B.y = 0;
      B.vy = 0;
      B.bal = 0;
      shake = 0.7;
      if (!PV.crush && zoneAt(B.z) != 18) {
        dmg += 4;
        if (dmg >= 100) {
          dmg = 100;
          end();
        }
      }
      msg("💥 Aterrizaje", 1200);
    }
  }
  const fx = -Math.sin(B.h),
    fz = -Math.cos(B.h);
  B.x += (fx * B.v + Math.cos(B.h) * B.lv) * dt;
  B.z += (fz * B.v - Math.sin(B.h) * B.lv) * dt;
  if (play && B.y < 8 && !MONT.on) {
    let hit = 0;
    for (const q of [-PV.hl * 0.8, 0, PV.hl * 0.8]) {
      const px = B.x + fx * q,
        pz = B.z + fz * q - RC(B.z),
        d = Math.hypot(px, pz);
      if (d < 11.3 + PV.hw) {
        const k = (11.3 + PV.hw - d) / (d || 1);
        B.x += px * k;
        B.z += pz * k;
        hit = 1;
      }
    }
    if (hit) {
      dmg += Math.abs(B.v) * 0.9 * PV.dm * dt;
      B.v *= Math.pow(0.15, dt);
      shake = Math.max(shake, 0.3);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
  }
  if (play && B.y < 8 && !MONT.on) {
    const zw = zoneAt(B.z),
      tn = [
        [-5250, 62],
        [-6850, 62],
        [-8800, 123],
      ].some((a) => Math.abs(B.z - (wo.position.z + a[0])) < a[1]);
    let wh = 0;
    if ((zw == 1 || zw == 4 || zw == 9 || zw == 25 || zw == 30) && Math.abs(B.x) < 0.55 + PV.hw) {
      B.x = B.x < 0 ? -0.55 - PV.hw : 0.55 + PV.hw;
      wh = 1;
    }
    if (zw == 17 && Math.abs(B.x) > 8.3 - PV.hw) {
      B.x = Math.sign(B.x) * (8.3 - PV.hw);
      wh = 1;
    }
    if ((zw == 2 || zw == 10 || zw == 24) && Math.abs(B.x) > 7.1 - PV.hw) {
      B.x = Math.sign(B.x) * (7.1 - PV.hw);
      wh = 1;
    }
    if (tn && Math.abs(B.x) > 7.4 - PV.hw) {
      B.x = Math.sign(B.x) * (7.4 - PV.hw);
      wh = 1;
    }
    if (Math.abs(B.z - BZ) < 132 && Math.abs(B.x) > 7.1 - PV.hw) {
      B.x = Math.sign(B.x) * (7.1 - PV.hw);
      wh = 1;
    }
    if (wh) {
      dmg += Math.abs(B.v) * 0.35 * PV.dm * dt;
      B.v *= Math.pow(0.4, dt);
      shake = Math.max(shake, 0.25);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
  }
  bus.position.set(B.x, B.y, B.z);
  bus.rotation.y = B.h;
  cur.rotation.z = -(yr * B.v * 0.012 + B.st * B.v * 0.0035) * PV.rl * 0.3;
  cur.rotation.x = ((G ? -0.012 : 0) + (Br ? 0.02 : 0)) * PV.rl * Math.min(1, B.v / 10);
  cur.position.y =
    PV.bob * Math.sin((performance.now() / 1000) * PV.bf) * Math.min(1, Math.abs(B.v) / 8) +
    (off ? PV.ob * Math.sin(performance.now() / 38) : 0) +
    ((B.hop = Math.max(0, (B.hop || 0) - dt)) > 0 ? Math.sin((Math.PI * B.hop) / 0.5) * 0.9 : 0);
  if (PV.hover) cur.position.y += 0.25;
  if (wet || (PV.hover && zoneAt(B.z) == 16)) cur.position.y += Math.sin(performance.now() / 380) * 0.12;
  if (B.fl) {
    cur.rotation.z = -B.st * 0.45;
    cur.rotation.x = B.vy * 0.03;
    cur.position.y = 0;
  }
  if (B.bal) {
    cur.rotation.x = -B.vy * 0.05;
    cur.rotation.z = Math.sin(performance.now() / 120) * 0.3;
  }
  if (B.rp) {
    cur.rotation.x = -B.rp;
  }
  wheels.forEach((w) => (w.children[0].rotation.x -= (B.v * dt) / 0.55));
  VWL.forEach((w) => (w.rotation.x -= (B.v * dt) / w.userData.r));
  if (cur.userData.wing) {
    cur.userData.wing.rotation.z = Math.sin(performance.now() / 700) * 0.04 - B.st * 0.12;
    cur.userData.pr.rotation.z += dt * 70;
  }
  if (cur.userData.fan) cur.userData.fan.rotation.z += dt * 45;
  tm.emissiveIntensity = (Br || HB) && B.v > 0.3 ? 2.5 : 0.3;
  stw.rotation.z = B.st * 1.2;
  // mundo
  ground.position.set(Math.round(B.x / 10) * 10, -0.02, Math.round(B.z / 10) * 10);
  sky.position.copy(cam.position);
  cl.position.set(B.x, 0, B.z);
  sun.position.set(B.x + 60, 90, B.z + 40);
  sun.target.position.set(B.x, 0, B.z);
  const kb = Math.floor(-B.z / CH);
  chunks.forEach((c) => {
    let m = false;
    while (c.k < kb - 1) {
      c.k += N;
      m = true;
    }
    while (c.k > kb + N - 2) {
      c.k -= N;
      m = true;
    }
    if (m) {
      c.g.position.z = -c.k * CH;
      scatter(c);
    } else c.g.position.z = -c.k * CH;
  });
  if (B.z < RZ - 220) {
    RZ -= CICLO;
    rb.position.z = RZ;
    rb.updateMatrix();
    rbMsg = 0;
    chunks.forEach((c) => {
      if (Math.abs(-c.k * CH - CH / 2 - RZ) < CH + 60) scatter(c);
    });
  }
  if (!rbMsg && B.z > RZ && B.z - RZ < 110) {
    rbMsg = 1;
    msg("🚧 Rotonda de La Y Griega EN OBRAS: rodeá la isla o usá el carril externo de la derecha (pasa directo)", 4000);
  }
  const cy = Math.floor((-B.z + 100) / CICLO);
  if (cy != cyc) {
    cyc = cy;
    wo.position.z = -CICLO * cy;
    wo.updateMatrix();
    tolled = 0;
    tbDone = 0;
    mlDone = 0;
    BN.forEach((b) => (b.d = 0));
    CZ = wo.position.z;
    R2 = wo.position.z - 7250;
    R3 = wo.position.z - 11250;
    R4 = wo.position.z - 12250;
    R5 = wo.position.z - 23250;
    BZ = wo.position.z - 6500;
    chunks.forEach(scatter);
  }
  const zb = zoneAt(B.z),
    zl = zoneAt(B.z - 120);
  if (zb != zPrev) {
    zPrev = zb;
    if (!MONT.on)
      msg(
        "📍 " +
          ZN[zb] +
          (zb == 16
            ? PV.hover
              ? " · ¡tu aerodeslizador flota!"
              : " · solo el aerodeslizador rinde al 100%"
            : ""),
        3000,
      );
  }
  const jm = inJam(B.z - 40);
  if (jm && !wasJam && !MONT.on) msg("🚗🚗 PRESA: tráfico lento", 3000);
  wasJam = jm;
  for (const c of cars)
    if (c.stat && !c.warn && !MONT.on && c.z < B.z && B.z - c.z < 220) {
      c.warn = 1;
      msg("⚠ ACCIDENTE adelante: reducí la velocidad", 3000);
    }
  const br = zl == 2 || zl == 16;
  ground.visible = !br;
  water.visible = br;
  wy += ((zb == 16 ? -0.15 : -3) - wy) * Math.min(1, dt * 3);
  water.position.set(B.x, wy, B.z);
  ground.material.color.setHex(zl == 24 ? 0xa8a27a : zl == 3 || zl == 5 || zl == 6 || zl == 27 ? 0x8fb080 : 0xffffff);
  const fn = (zl == 24 ? 6 : zl == 3 || zl == 5 || zl == 6 ? 40 : 90) * (1 - 0.3 * rnv),
    ff = (zl == 24 ? 150 : zl == 3 || zl == 5 || zl == 6 ? 330 : 560) * (1 - 0.4 * rnv);
  sc.fog.near += (fn - sc.fog.near) * Math.min(1, dt);
  sc.fog.far += (ff - sc.fog.far) * Math.min(1, dt);
  const tz = wo.position.z - 4250;
  if (!tolled && !MONT.on && B.y < 5 && B.z < tz && B.z > tz - 30) {
    tolled = 1;
    cash = Math.max(0, cash - 800);
    msg("🚧 Peaje Quick Pass: −₡800", 2500);
  }
  cany.position.set(B.x, -45, B.z);
  cp1.constant = -(BZ + 130);
  cp2.constant = BZ - 130;
  trA.position.z += 9 * dt;
  if (trA.position.z > 150) trA.position.z = -340;
  trT += dt;
  if (trT > 24 && !trOn) {
    trOn = 1;
    tx = 260;
    horn();
  }
  if (trOn) {
    tx -= 24 * dt;
    if (tx < -300) {
      trOn = 0;
      trT = 0;
    }
  }
  trC.position.x = trOn ? tx : 999;
  const gate = trOn && tx < 170 && tx > -70,
    cz = wo.position.z - 7750;
  arms.forEach((a, i) => {
    const q = i ? -1 : 1;
    a.rotation.z += ((gate ? 0 : -q * 1.2) - a.rotation.z) * Math.min(1, dt * 3);
  });
  lamM.emissiveIntensity = gate ? (Math.sin(performance.now() / 150) > 0 ? 3 : 0.3) : 0.2;
  trHitT -= dt;
  if (
    play &&
    !MONT.on &&
    B.y < 5 &&
    trOn &&
    trHitT <= 0 &&
    Math.abs(B.z - cz) < 7.4 &&
    B.x > tx - 5 &&
    B.x < tx + 56
  ) {
    trHitT = 2;
    dmg += 40;
    B.v *= 0.1;
    B.z += B.z > cz ? 9 : -9;
    shake = 1.2;
    msg("¡Chocaste con el tren! 🚆💥", 2000);
    if (dmg >= 100) {
      dmg = 100;
      end();
    }
  }
  crs.forEach((j, i) => (j.rotation.y += dt * 0.12 * (i % 2 ? -1 : 1)));
  {
    const hv = Math.abs(B.v) / PV.max;
    heat = 0; // los vehículos ya no se sobrecalientan (antes: subía al ir a fondo)
    void hv;
    const st = heat >= 90 ? 3 : heat >= 65 ? 2 : heat >= 35 ? 1 : 0;
    if (st != hst) {
      hst = st;
      if (st == 1) msg("💨 Humo blanco: el motor se calienta", 2500);
      if (st == 2) msg("⚫ Humo negro: ¡soltá el acelerador!", 2500);
      if (st == 3) msg("🔥 ¡SE INCENDIA EL MOTOR! Soltá el acelerador", 3000);
    }
    onFire = heat >= 90 || (onFire && heat > 60);
    if (onFire && play) {
      dmg += 5 * dt;
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
    em += dt * (onFire ? 34 : st == 2 ? 20 : st == 1 ? 14 : 0);
    while (em >= 1) {
      em--;
      const p = FX.find((q) => q.t <= 0);
      if (!p) break;
      const fr = onFire && Math.random() < 0.5;
      p.fire = fr;
      p.t = p.l = fr ? 0.5 : 1.6;
      p.m.material.color.setHex(
        fr ? (Math.random() < 0.5 ? 0xff7a18 : 0xffd23f) : st == 1 ? 0xf2f2f2 : 0x1a1a1a,
      );
      p.o = 0;
      p.m.position.set(B.x - fx * PV.ez + R(-0.3, 0.3), B.y + 1.1, B.z - fz * PV.ez + R(-0.3, 0.3));
      p.v.set(-fx * B.v * 0.5 + R(-0.5, 0.5), fr ? R(1, 2) : R(1.5, 3), -fz * B.v * 0.5 + R(-0.5, 0.5));
    }
  }
  {
    const dk =
      off && Math.abs(B.v) > 6 ? 1 : Math.abs(B.lv) > 2.5 && Math.abs(B.v) > 8 && !B.fl && !B.bal ? 2 : 0;
    if (GQ && dk && play) {
      dEm += dt * (dk == 1 ? 18 : 14);
      while (dEm >= 1) {
        dEm--;
        const p = FX.find((q) => q.t <= 0);
        if (!p) break;
        p.fire = false;
        p.o = 0.3;
        p.t = p.l = dk == 1 ? 1.1 : 0.9;
        p.m.material.color.setHex(dk == 1 ? 0x9a8668 : 0xd8d8d8);
        p.m.position.set(
          B.x - fx * PV.hl * 0.8 + R(-0.6, 0.6),
          B.y + 0.3,
          B.z - fz * PV.hl * 0.8 + R(-0.6, 0.6),
        );
        p.v.set(R(-0.6, 0.6), R(0.6, 1.4), R(-0.6, 0.6));
      }
    }
  }
  FX.forEach((p) => {
    if (p.t > 0) {
      p.t -= dt;
      const u = 1 - p.t / p.l;
      p.m.position.addScaledVector(p.v, dt);
      p.m.scale.setScalar(p.fire ? 0.7 - u * 0.4 : 0.6 + u * 2.2);
      p.m.material.opacity = (p.fire ? 0.9 : p.o || 0.55) * (1 - u);
      p.m.visible = p.t > 0;
    } else p.m.visible = false;
  });
  fireL.intensity = onFire ? 2 + Math.random() * 1.5 : 0;
  fireL.position.set(B.x - fx * PV.ez, B.y + 1.6, B.z - fz * PV.ez);
  {
    const r0 = wo.position.z - 17100,
      rf = wo.position.z - 17900;
    if (play && !MONT.on && !raceOn && B.z < r0 && B.z > r0 - 40 && B.y < 5) {
      raceOn = 1;
      raceT = 0;
      msg("🏁 ¡Largada!", 1500);
    }
    if (raceOn) {
      raceT += dt;
      if (B.z < rf) {
        raceOn = 0;
        const pr_ = raceT < 22 ? 5000 : raceT < 32 ? 3000 : 1500;
        cash += pr_;
        msg("🏁 Meta: " + raceT.toFixed(1) + " s  +₡" + pr_, 3500);
      }
      if (B.z > r0 + 60) raceOn = 0;
    }
  }
  {
    const z0 = wo.position.z - 18000;
    if (play && !MONT.on && zoneAt(B.z) == 18) {
      if (B.z < z0 - 860 && B.z > z0 - 905 && Math.abs(B.x) < 15 && Math.abs(B.v) > 10)
        shake = Math.max(shake, 0.25);
      const d0 = z0 - 100,
        d1 = z0 - 500;
      if (!dgOn && B.z < d0 && B.z > d0 - 30 && B.x < -30 && B.x > -40 && B.y < 2) {
        dgOn = 1;
        dgT = 0;
        dgV = 0;
        msg("🚦 Prueba de aceleración: ¡a fondo!", 2000);
      }
      if (dgOn) {
        dgT += dt;
        dgV = Math.max(dgV, Math.abs(B.v) * 3.6);
        if (B.z < d1) {
          dgOn = 0;
          msg("🏁 400 m: " + dgT.toFixed(1) + " s · máx " + dgV.toFixed(0) + " km/h", 4000);
        }
        if (B.x > -26 || B.x < -44 || B.z > d0 + 40) dgOn = 0;
      }
    }
  }
  amu.fw.rotation.z += dt * 0.25;
  amu.cabs.forEach((c) => (c.rotation.z = -amu.fw.rotation.z));
  amu.cr.rotation.y += dt * 0.6;
  amu.t += dt * 0.6;
  {
    const i = Math.floor(amu.t) % 48,
      f = amu.t % 1,
      a = amu.P[i],
      b = amu.P[(i + 1) % 48];
    amu.cart.position.lerpVectors(a, b, f);
    amu.cart.rotation.y = Math.atan2(-(b.x - a.x), -(b.z - a.z));
  }
  BN.forEach((b) => {
    if (
      play &&
      !MONT.on &&
      !b.d &&
      Math.abs(B.z - (wo.position.z + b.z)) < b.r &&
      B.x > b.x0 &&
      B.x < b.x1 &&
      Math.abs(B.v) < 1.5
    ) {
      b.t += dt;
      if (b.t > 2) {
        b.d = 1;
        cash += b.a;
        msg(b.m + ": +₡" + b.a, 2800);
        hiss();
      }
    } else b.t = 0;
  });
  nt += ((zl == 12 ? 1 : 0) - nt) * Math.min(1, dt * 0.8);
  rnv += ((RAIN ? 1 : 0) - rnv) * Math.min(1, dt * 0.7);
  sky.material.uniforms.nt.value = Math.min(1, nt + 0.3 * rnv);
  sc.fog.color.setRGB(
    (0.74 - 0.71 * nt) * (1 - 0.3 * rnv),
    (0.84 - 0.79 * nt) * (1 - 0.28 * rnv),
    (0.93 - 0.83 * nt) * (1 - 0.22 * rnv),
  );
  sun.intensity = (1.7 - 1.55 * nt) * (1 - 0.55 * rnv);
  hemi.intensity = (0.75 - 0.58 * nt) * (1 - 0.2 * rnv);
  cm.color.setScalar((1 - 0.85 * nt) * (1 - 0.35 * rnv));
  rd.toneMappingExposure = 1 + 0.35 * nt;
  if (play) {
    fuel = 100; // ⛽ gasolina infinita en todos los vehículos
  }
  const gzn = GZ.map((z) => z + CZ).find((z) => Math.abs(B.z - z) < 14);
  if (play && !MONT.on && gzn != null && B.x > 12 && B.x < 44 && Math.abs(B.v) < 1.5 && fuel < 99) {
    fuT += dt;
    if (fuT > 2) {
      const cc = Math.round((100 - fuel) * 15);
      fuel = 100;
      heat = 0;
      nit = PV.nit;
      cash = Math.max(0, cash - cc);
      msg("⛽ Tanque lleno −₡" + cc, 2500);
      hiss();
    }
  } else fuT = 0;
  if (play && !MONT.on && PV.bus && stop && !stop.bell && pas > 0 && B.z > stop.z && B.z - stop.z < 260) {
    stop.bell = 1;
    pull();
  }
  const par = play && !MONT.on && PV.bus && stop && stop.bell;
  parS.visible = !!par && Math.floor(performance.now() / 400) % 2 == 0;
  $("par").style.display = par ? "block" : "none";
  if (pullT > 0) {
    pullT -= dt;
    cords[pullSide].position.y = pullT > 0 ? -0.22 * Math.sin((Math.PI * pullT) / 0.6) : 0;
  }
  ppl.forEach((g, i) => {
    g.visible = i < Math.min(pas, 32);
    g.position.y = Math.sin(performance.now() / 200 + i) * 0.012 * Math.min(1, Math.abs(B.v) / 10);
  });
  sunM.position.set(cam.position.x + 460, 693, cam.position.z + 306);
  sunM.visible = nt < 0.5 && rnv < 0.6;
  sunG.position.copy(sunM.position);
  sunG.visible = !!GQ && nt < 0.5 && rnv < 0.6;
  glowM.opacity = (0.05 + 0.85 * nt + 0.3 * rnv) * GQ;
  rGlow.opacity = ((Br || HB) && B.v > 0.3 ? 0.8 : 0.2) * (0.4 + 0.6 * Math.max(nt, rnv)) * GQ;
  roadM.roughness = 0.85 - 0.5 * rnv;
  roadM.envMapIntensity = 0.05 + 0.5 * rnv;
  if (RAIN || rnv > 0.02) {
    rain.visible = true;
    const a = rgeo.attributes.position.array;
    for (let i = 0; i < RN; i++) {
      const j = i * 6;
      a[j + 1] -= 38 * dt;
      a[j + 4] = a[j + 1] - 1.3;
      if (a[j + 1] < 0) {
        a[j + 1] = 30;
        a[j + 4] = 28.7;
      }
    }
    rgeo.attributes.position.needsUpdate = true;
    rain.position.set(Math.round(cam.position.x / 60) * 60, 0, Math.round(cam.position.z / 60) * 60);
    rain.material.opacity = 0.45 * rnv;
  } else rain.visible = false;
  const tbz = wo.position.z - 15500;
  if (
    play &&
    !MONT.on &&
    !tbDone &&
    Math.abs(B.z - tbz) < 40 &&
    B.x > 12 &&
    B.x < 44 &&
    Math.abs(B.v) < 1.5
  ) {
    tbT += dt;
    if (tbT > 2) {
      tbDone = 1;
      cash += 3000;
      msg("🚌 Terminal de buses: +₡3000", 2800);
      hiss();
    }
  } else tbT = 0;
  const mz = wo.position.z - 4650;
  if (
    play &&
    !MONT.on &&
    !mlDone &&
    Math.abs(B.z - mz) < 70 &&
    B.x > 52 &&
    B.x < 100 &&
    Math.abs(B.v) < 1.5
  ) {
    mlT += dt;
    if (mlT > 2) {
      mlDone = 1;
      cash += 4000;
      msg("🛍 MEGA MALL: +₡4000", 2800);
      hiss();
    }
  } else mlT = 0;
  // tráfico
  const lvl = 1 + si * 0.06;
  for (
    let n = 0;
    n < 10 &&
    cars.length <
      (MONT.on || zoneAt(B.z - 250) == 18
        ? 0
        : inJam(B.z - 250)
          ? 62
          : [16, 17].includes(zoneAt(B.z - 250))
            ? 14
            : 48);
    n++
  )
    spawn(B.z - R(120, 650));
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];
    if (zoneAt(c.z - CZ) == 18) {
      liberar(c.o);
      cars.splice(i, 1);
      continue;
    }
    if (!c.hit) {
      const dc = c.z - RC(c.z);
      if (Math.abs(dc) < 28) {
        const t = 1 - Math.abs(dc) / 28,
          q = t * t * (3 - 2 * t);
        c.x = Math.sign(c.x0) * (Math.abs(c.x0) + (17 - Math.abs(c.x0)) * q);
      } else c.x = c.x0;
    }
    // js/mundo.js: darle campo a las emergencias (c.cede, c.libre) y frenar antes del incendio (c.tope)
    if (!c.hit && typeof cocheTick == "function") cocheTick(c, dt);
    if (!c.stat && !c.hit) {
      let tv = inJam(c.z) && !c.libre ? Math.sign(c.v0) * c.jv : c.v0;
      const d = Math.sign(c.v0);
      for (const o of cars) {
        if (o === c || o.hit || o.x0 !== c.x0 || (c.libre && o.cede)) continue;
        const gp = (o.z - c.z) * d;
        if (gp > 0 && gp < c.hl + o.hl + 10)
          tv = d * Math.min(Math.abs(tv), gp < c.hl + o.hl + 4 ? 0 : Math.abs(o.vz));
      }
      if (c.tope != null) tv = d * Math.min(Math.abs(tv), c.tope);
      c.vz += (tv - c.vz) * Math.min(1, dt * 2);
    }
    c.z += c.vz * (c.hit ? 0.4 : lvl > 1.6 ? 1.15 : 1) * dt;
    c.x += c.vx * dt;
    if (c.vy) {
      c.y = (c.y || 0) + c.vy * dt;
      c.vy -= 24 * dt;
      if (c.y <= 0) {
        c.y = 0;
        c.vy = 0;
      }
    }
    c.o.position.set(c.x, c.y || 0, c.z);
    if (c.stat) {
      const t = performance.now(),
        l = c.o.userData.l,
        w = Math.floor(t / 250) % 2;
      l[0].emissiveIntensity = w ? 2 : 0;
      l[1].emissiveIntensity = w ? 0 : 2;
      c.o.userData.sm.forEach((m, k) => {
        const u = ((t / 1000) * 0.6 + k * 0.25) % 1;
        m.position.y = 1.8 + u * 4;
        m.material.opacity = 0.5 * (1 - u);
        m.scale.setScalar(0.8 + u * 1.4);
      });
    }
    if (c.hit) {
      c.o.rotation.y += c.hit * dt * 3;
      c.o.rotation.z = Math.sin(c.hit) * 0.2;
      c.vx *= 0.98;
    }
    if (c.z > B.z + 90 || c.z < B.z - 800 || Math.abs(c.x) > 40) {
      liberar(c.o);
      cars.splice(i, 1);
      continue;
    }
    if (play && !c.hit && B.y < 4) {
      const dx = c.x - B.x,
        dz = c.z - B.z,
        lx = dx * Math.cos(B.h) - dz * Math.sin(B.h),
        lf = -dx * Math.sin(B.h) - dz * Math.cos(B.h);
      if (Math.abs(lx) < PV.hw + 1 && Math.abs(lf) < PV.hl + c.hl + 0.3) {
        const rel = Math.hypot(B.v * fx, B.v * fz - c.vz);
        if (!PV.crush) dmg += Math.max(2, rel * 0.9) * PV.dm;
        B.v *= PV.cr;
        c.hit = 1;
        c.vx = PV.crush ? 0 : (lx > 0 ? 1 : -1) * (PV.tank ? 16 : 9);
        if (PV.tank || PV.crush) c.o.scale.y = 0.3;
        if (PV.crush) B.hop = 0.5;
        if (PV.proj && rel > 6) {
          c.vy = 13;
          c.y = 0.1;
          c.vx *= 2.5;
          if (!B.fl && !PV.crush) {
            B.bal = 1;
            B.vy = 6 + Math.min(8, rel * 0.22);
            B.y = 0.1;
          }
        }
        shake = PV.crush ? 0.35 : 0.8;
        msg(PV.crush ? "🛞 ¡Aplastaste un carro!" : "¡CHOQUE! 💥", 1200);
        multa("chocar", 1000);
        if (dmg >= 100) {
          dmg = 100;
          end();
        }
      }
    }
  }
  // parada
  if (play && stop && !MONT.on) {
    const ins = Math.abs(B.z - stop.z) < 6 && B.x > 0.8 && B.x < 6.8 && Math.abs(B.v) < 1.5 && B.y < 1;
    stop.zn.material.opacity = 0.3 + 0.12 * Math.sin(performance.now() / 200);
    if (ins) {
      stop.t += dt;
      if (stop.t > 1.1) {
        const sub = 5 + ((Math.random() * 6) | 0),
          baj = Math.floor(pas * R(0.3, 0.6));
        pas = pas - baj + sub;
        cash += Math.round(sub * 650 * PV.cm);
        si++;
        msg(`¡Suben ${sub}, bajan ${baj}!  +₡${sub * 650}`, 2800);
        hiss();
        const old = stop;
        stop = mkStop(si + st0);
        setTimeout(() => liberar(old.g), 1500);
      }
    } else stop.t = 0;
    if (B.z < stop.z - 30) {
      cash = Math.max(0, cash - 1000);
      si++;
      msg("¡Te pasaste de la parada! −₡1000", 2500);
      multa("pasarte la parada", 0);
      liberar(stop.g);
      stop = mkStop(si + st0);
    }
    setH(
      "stop",
      `🚏 Próxima parada: <b>${Math.max(0, Math.round(B.z - stop.z))} m</b>${ins ? " · ¡frená!" : ""}`,
    );
  }

  // cámara
  const sk = shake * (Math.random() - 0.5);
  shake = Math.max(0, shake - dt * 1.5);
  if (cm_ == 0) {
    const tg = _v1.set(B.x - fx * PV.cd, PV.ch + B.y, B.z - fz * PV.cd);
    cam.position.lerp(tg, 1 - Math.exp(-dt * 4));
    cam.position.x += sk;
    cam.position.y += sk * 0.6;
    cam.lookAt(B.x + fx * 22, 2.6 + B.y, B.z + fz * 22);
  } else {
    bus.updateMatrixWorld();
    const V = (
        PV.bus
          ? [0, [-0.8, 2.55, -4.3], [0, 2.45, 4.9], [0.78, 2.15, 1.1]]
          : [0, PV.s, [0, 0.9, 0.3 - PV.hl], [PV.hw + 3.8, 2.4, PV.hl * 0.8]]
      )[cm_],
      Lk = (
        PV.bus
          ? [0, [-0.8 - B.st * 8, 2.2, -40], [0, 2.0, -30], [-0.3, 2.0, -30]]
          : [0, [PV.s[0] - B.st * 8, PV.s[1] - 0.2, -30], [0, 0.9, -30], [0, 1.2, -6]]
      )[cm_];
    cam.position.copy(bus.localToWorld(_v1.set(V[0] + sk, V[1], V[2])));
    cam.lookAt(bus.localToWorld(_v2.set(Lk[0], Lk[1], Lk[2])));
  }
  const fv = 62 + Math.max(0, B.v) * 0.55 + (bo ? 10 : 0);
  if (Math.abs(cam.fov - fv) > 0.1) {
    cam.fov += (fv - cam.fov) * 0.1;
    cam.updateProjectionMatrix();
  }
  // HUD
  setH(
    "spd",
    `${Math.abs(B.v * 3.6) | 0} <small>km/h</small>${PV.fly ? "<br><small>⛰ " + (B.y | 0) + " m</small>" : ""}`,
  );
  const dmw = (dmg | 0) + "%";
  if ($("dm").style.width != dmw) $("dm").style.width = dmw;
  setH(
    "tl",
    `⏱ Tiempo infinito ∞<br>📍 ${MONT.on ? MONT.lugar : ZN[zoneAt(B.z)]}<br>₡ ${cash.toLocaleString("es-CR")}<br>👥 ${pas} / 40<br>⛽ ∞${PV.nit ? "<br>🔥 " + Math.round((nit / PV.nit) * 100) + "%" : ""}<br>🌡 ${heat | 0}%${onFire ? " 🔥" : ""}${hudExtra}`,
  );
  eng(G, play, dt);
  if (PV.air && Br && Math.abs(B.v) > 6 && performance.now() - (B.ah || 0) > 1100) {
    B.ah = performance.now();
    hiss();
  }
  if (msgT > 0) {
    msgT -= dt;
    if (msgT <= 0) $("msg").style.opacity = 0;
  }
}
// ===== mejoras gráficas por cuadro (no tocan la jugabilidad) =====
const trEl = $("tr");
let lastS = -1,
  _qCam = new T.Quaternion();
subdividirLargos(sc);

// ===================== OPTIMIZACIÓN =====================
// Recursos compartidos: nunca se liberan.
const COMPARTIDO = new Set([
  ...Object.values(CG),
  ...Object.values(AMBG),
  ...Object.values(AMBM),
  TW,
  HW,
  TWM,
  HWM,
  dk,
  tm,
  hlM,
  gm,
  gm2,
  glowM,
  rGlow,
  gTex,
]);
// Quita un objeto de la escena y libera su memoria de GPU (antes quedaba ocupada para siempre).
function liberar(o) {
  if (!o) return;
  if (o.parent) o.parent.remove(o);
  o.traverse((m) => {
    if (m.geometry && !m.isSprite && !COMPARTIDO.has(m.geometry)) m.geometry.dispose();
    const mt = m.material;
    if (mt && !COMPARTIDO.has(mt) && !mt.userData.pintura) {
      if (mt.map && !COMPARTIDO.has(mt.map)) mt.map.dispose();
      mt.dispose();
    }
  });
}
// Congela las matrices de lo que no se mueve; solo se recalculan cuando el grupo cambia de lugar.
function congelar(root, animados) {
  root.traverse((o) => {
    if (animados.has(o)) return;
    o.updateMatrix();
    o.matrixAutoUpdate = false;
  });
}
congelar(wo, new Set([...crs, ...arms, ...amu.cabs, amu.fw, amu.cr, amu.cart, trA, trC]));
congelar(rb, new Set());
function relieveTick(dt) {
  const u = -B.z;
  BEND.x = u;
  BEND.y = relieveH(u); // el terreno se dibuja relativo a la altura bajo el bus
  BEND.w = MONT.on ? 0 : 1;
  // gravedad: al subir se pierde velocidad, al bajar se gana
  if (state == "play" && !MONT.on && !B.fl && !B.bal && B.y < 1)
    B.v -= 9.8 * 0.55 * relieveP(u) * Math.cos(B.h) * dt;
}
function gfxTick(dt) {
  relieveTick(dt);
  // luces de las ambulancias (en el tráfico y en los accidentes)
  const wa = Math.floor(performance.now() / 140) % 2;
  for (const c of cars) {
    const L = c.o.userData.amb;
    if (L)
      for (let i = 0; i < L.length; i++) {
        const on = (i % 2 == 0) == !!wa;
        L[i].mat.emissiveIntensity = on ? 3 : 0.15;
        L[i].sm.opacity = on ? 0.9 : 0;
      }
  }
  const n = Math.min(1, nt * 1.15 + rnv * 0.3);
  FAC.forEach((m) => (m.emissiveIntensity = n * 1.15));
  winM.emissiveIntensity = n;
  hlM.emissiveIntensity = 0.7 + 1.6 * Math.max(nt, rnv * 0.5);
  wNrm.offset.x += dt * 0.012;
  wNrm.offset.y += dt * 0.007;
  FX.forEach((p) => {
    if (p.m.visible) {
      p.m.scale.multiplyScalar(1.7);
      p.m.material.blending = p.fire ? T.AdditiveBlending : T.NormalBlending;
    }
  });
  const s = Math.round(Math.min(1, Math.abs(B.v) / (((PV && PV.max) || 30) * 1.3)) * 100) / 100;
  if (s !== lastS) {
    lastS = s;
    trEl.style.setProperty("--s", s);
  }
}
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

// ===================== CARRETERA A VARA BLANCA (zona 8) =====================
// Salida a la derecha en San José · Estadio Nacional: carretera de montaña de 2 carriles que sube a un paso
// de 24 m, con barandas, un derrumbe que tapa un carril, una presa de carros y una piedra que rueda cerro abajo.
// Vuelve a la autopista antes del túnel. Coordenadas del primer ciclo del mundo (dentro del grupo "wo").
const VB_ALTURA = 24, // altura del paso de montaña (m)
  VB_ANCHO = 4.2; // medio ancho de la carretera (2 carriles)
const VB = (() => {
  const P = [],
    ease = (t) => t * t * (3 - 2 * t);
  for (let i = 0; i <= 25; i++) {
    const t = i / 25; // rampa de salida
    P.push({ x: 7 + 93 * ease(t), z: -8030 - 100 * t, h: 0 });
  }
  for (let i = 1; i <= 108; i++) {
    const u = i / 108; // tramo de montaña: curvas y subida/bajada
    P.push({
      x: 100 + 14 * Math.sin(u * Math.PI * 3),
      z: -8130 - 430 * u,
      h: (VB_ALTURA * (1 - Math.cos(2 * Math.PI * u))) / 2,
    });
  }
  for (let i = 1; i <= 25; i++) {
    const t = i / 25; // regreso a la autopista
    P.push({ x: 100 - 93 * ease(t), z: -8560 - 90 * t, h: 0 });
  }
  let L = 0;
  P.forEach((p, i) => {
    const a = P[Math.max(0, i - 1)],
      b = P[Math.min(P.length - 1, i + 1)],
      dx = b.x - a.x,
      dz = b.z - a.z,
      l = Math.hypot(dx, dz);
    p.tx = dx / l;
    p.tz = dz / l;
    p.nx = -p.tz; // derecha según el sentido de marcha
    p.nz = p.tx;
    if (i) L += Math.hypot(p.x - P[i - 1].x, p.z - P[i - 1].z);
    p.s = L;
  });
  return P;
})();
const vbEn = (i, lat, dy = 0) => {
  const p = VB[Math.max(0, Math.min(VB.length - 1, Math.round(i)))];
  return { x: p.x + p.nx * lat, y: p.h + dy, z: p.z + p.nz * lat };
};
// zonas libres de casas/árboles del borde y segmentos manejables (sin castigo de "fuera de pista")
EXR.push([-7990, -8170], [-8520, -8680]);
for (let i = 1; i < VB.length; i++) XS.push([VB[i - 1].x, VB[i - 1].z, VB[i].x, VB[i].z, 5]);
// cinta de triángulos que sigue el camino: f(p) → [[x,y,z] lado A, [x,y,z] lado B]
function cinta(f, colores) {
  const pos = [],
    uv = [],
    col = [],
    idx = [];
  VB.forEach((p, i) => {
    const [a, b] = f(p);
    pos.push(...a, ...b);
    uv.push(0, p.s / 12, 1, p.s / 12);
    if (colores) col.push(...colores[0], ...colores[1]);
    if (i) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  });
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  if (colores) g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const vbTex = cv(128, 256, (x, w, h) => {
  x.fillStyle = "#2f3237";
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) {
    const v = R(25, 90) | 0;
    x.fillStyle = `rgba(${v},${v},${v + 4},${R(0.2, 0.5)})`;
    x.fillRect(R(0, w), R(0, h), 1.5, 1.5);
  }
  x.fillStyle = "#f2f2ee";
  x.fillRect(5, 0, 5, h);
  x.fillRect(w - 10, 0, 5, h);
  x.fillStyle = "#ffc400";
  x.fillRect(w / 2 - 2, 0, 4, h * 0.55);
});
vbTex.wrapS = vbTex.wrapT = T.RepeatWrapping;
const vbG = new T.Group();
{
  const carretera = new T.Mesh(
      cinta((p) => [
        [p.x - p.nx * VB_ANCHO, p.h + 0.06, p.z - p.nz * VB_ANCHO],
        [p.x + p.nx * VB_ANCHO, p.h + 0.06, p.z + p.nz * VB_ANCHO],
      ]),
      new T.MeshStandardMaterial({ map: vbTex, roughness: 0.85, side: T.DoubleSide }),
    ),
    roca = [0.5, 0.45, 0.4],
    pasto = [0.3, 0.45, 0.22],
    tierra = new T.MeshStandardMaterial({ map: nz, vertexColors: true, roughness: 1, side: T.DoubleSide });
  carretera.receiveShadow = true;
  vbG.add(carretera);
  // laderas del cerro (de la orilla de la carretera hasta el suelo)
  [-1, 1].forEach((q) => {
    const m = new T.Mesh(
      cinta(
        (p) => [
          [p.x + p.nx * q * VB_ANCHO, p.h, p.z + p.nz * q * VB_ANCHO],
          [p.x + p.nx * q * (VB_ANCHO + 3 + p.h * 1.3), -0.4, p.z + p.nz * q * (VB_ANCHO + 3 + p.h * 1.3)],
        ],
        [roca, pasto],
      ),
      tierra,
    );
    m.receiveShadow = true;
    vbG.add(m);
    // barandas metálicas
    const b = new T.Mesh(
      cinta((p) => [
        [p.x + p.nx * q * (VB_ANCHO + 0.15), p.h + 0.45, p.z + p.nz * q * (VB_ANCHO + 0.15)],
        [p.x + p.nx * q * (VB_ANCHO + 0.15), p.h + 0.95, p.z + p.nz * q * (VB_ANCHO + 0.15)],
      ]),
      new T.MeshStandardMaterial({ color: 0xc9ced3, metalness: 0.7, roughness: 0.35, side: T.DoubleSide }),
    );
    b.castShadow = true;
    vbG.add(b);
  });
  // postes de las barandas (solo donde la carretera va alta)
  const postes = new T.InstancedMesh(new T.BoxGeometry(0.15, 1, 0.15), M(0x8a8f94), 240),
    m4 = new T.Matrix4();
  let n = 0;
  for (let i = 26; i < 134; i += 2)
    for (const q of [-1, 1]) {
      const c = vbEn(i, q * (VB_ANCHO + 0.15), 0.5);
      m4.makeTranslation(c.x, c.y, c.z);
      postes.setMatrixAt(n++, m4);
    }
  postes.count = n;
  postes.frustumCulled = false;
  vbG.add(postes);
  // montañas y árboles alrededor
  for (let k = 0; k < 7; k++) {
    const mt = mount(),
      kk = R(0.9, 1.4),
      i = 30 + k * 14,
      c = vbEn(i, mt.userData.rb * kk + 45 + R(0, 60) + VB[i].h * 1.3);
    mt.scale.setScalar(kk);
    mt.position.set(c.x, (mt.geometry.parameters.height * kk) / 2 - 4, c.z);
    vbG.add(mt);
  }
  for (let k = 0; k < 40; k++) {
    const i = 26 + ((Math.random() * 108) | 0),
      q = Math.random() < 0.5 ? -1 : 1,
      t = tree(),
      c = vbEn(i, q * (VB_ANCHO + 6 + VB[i].h * 1.3 + R(2, 14)));
    t.position.set(c.x, 0, c.z);
    t.scale.setScalar(R(1, 1.8));
    vbG.add(t);
  }
  // rótulos
  const rotulo = (tex, w, h, x, y, z, ry = 0) => {
    const pl = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 }),
    );
    pl.position.set(x, y, z);
    pl.rotation.y = ry;
    vbG.add(pl, mm(0.15, y, 0.15, 0x777777, x, y / 2, z - 0.05));
  };
  const aviso = (l1, l2, l3) =>
    cv(256, 256, (x) => {
      x.fillStyle = "#111";
      x.beginPath();
      x.moveTo(128, 2);
      x.lineTo(254, 128);
      x.lineTo(128, 254);
      x.lineTo(2, 128);
      x.fill();
      x.fillStyle = "#f2c200";
      x.beginPath();
      x.moveTo(128, 13);
      x.lineTo(243, 128);
      x.lineTo(128, 243);
      x.lineTo(13, 128);
      x.fill();
      x.fillStyle = "#111";
      x.textAlign = "center";
      x.font = "bold 30px system-ui,Arial";
      x.fillText(l1, 128, 100);
      x.fillText(l2, 128, 140);
      x.fillText(l3, 128, 180);
    });
  rotulo(S("SALIDA · CARRETERA VARA BLANCA", 512, 138, "#0a6e3a", "#fff", 30), 6.4, 1.6, 9.8, 4, -7955);
  rotulo(aviso("⚠ CUIDADO", "DERRUMBES", "Y PRESA"), 2.6, 2.6, 12.6, 3.6, -7980);
  rotulo(S("↗ VARA BLANCA", 256, 64, "#0a6e3a", "#fff", 36), 3, 0.75, 10, 3.2, -8005);
  {
    const c = vbEn(32, VB_ANCHO + 1.8);
    rotulo(
      aviso("ZONA DE", "DERRUMBES", "⚠"),
      2.2,
      2.2,
      c.x,
      VB[32].h + 3,
      c.z,
      Math.atan2(-VB[32].tx, -VB[32].tz),
    );
  }
  {
    const c = vbEn(60, VB_ANCHO + 1.8);
    rotulo(
      aviso("PRESA", "ADELANTE", "🚗🚗"),
      2.2,
      2.2,
      c.x,
      VB[60].h + 3,
      c.z,
      Math.atan2(-VB[60].tx, -VB[60].tz),
    );
  }
}
// obstáculos: derrumbe y presa (carril derecho) y piedra que cae del cerro (carril derecho, más adelante)
const VB_OBS = [],
  ROCA_G = new T.DodecahedronGeometry(1, 0),
  ROCA_M = [M(0x7a6a58), M(0x8c8378), M(0x5f5348)],
  hazM = new T.MeshStandardMaterial({ color: 0xff9a1a, emissive: 0xff8a00, emissiveIntensity: 2 });
function vbRoca(r, x, y, z, choca = true) {
  const m = new T.Mesh(ROCA_G, pk_(ROCA_M));
  m.scale.set(r * R(0.85, 1.2), r * R(0.6, 0.85), r * R(0.85, 1.2));
  m.rotation.set(R(0, 3), R(0, 3), R(0, 3));
  m.position.set(x, y + r * 0.45, z);
  m.castShadow = m.receiveShadow = true;
  vbG.add(m);
  if (choca) VB_OBS.push({ x, z, h: y, r: r * 1.05 });
  return m;
}
const VB_DERRUMBE = 76;
{
  vbRoca(1.9, ...Object.values(vbEn(VB_DERRUMBE, 2.1)));
  for (let k = 0; k < 9; k++) {
    const c = vbEn(VB_DERRUMBE + R(-2, 2), R(0.6, 3.8));
    vbRoca(R(0.35, 1), c.x, c.y, c.z, k < 3);
  }
  for (let k = 0; k < 6; k++) {
    // piedras en la ladera
    const c = vbEn(VB_DERRUMBE + R(-4, 4), VB_ANCHO + R(2, 9), -R(2, 6));
    vbRoca(R(0.8, 2), c.x, c.y, c.z, false);
  }
  // la presa: carros detenidos con las intermitentes
  for (let k = 0; k < 7; k++) {
    const i = VB_DERRUMBE - 2 - k * 2,
      c = vbEn(i, 2),
      car = mkCar(),
      p = VB[i],
      pend = (VB[i + 1].h - VB[i - 1].h) / (VB[i + 1].s - VB[i - 1].s);
    car.rotation.order = "YXZ";
    car.rotation.y = Math.atan2(-p.tx, -p.tz);
    car.rotation.x = Math.atan(pend);
    car.position.set(c.x, c.y, c.z);
    [-1, 1].forEach((q) => {
      const hz = new T.Mesh(CG.hl, hazM);
      hz.position.set(q * 0.85, 0.95, 2.16);
      car.add(hz);
    });
    vbG.add(car);
    VB_OBS.push({ x: c.x, z: c.z, h: c.y, r: 2.4 });
  }
}
// piedra que rueda cerro abajo cuando el bus se acerca
const VB_CAE = 104,
  vbCae = (() => {
    const fin = vbEn(VB_CAE, 2),
      ini = vbEn(VB_CAE + 3, 26, 22),
      m = vbRoca(1.6, ini.x, ini.y, ini.z, false),
      o = { x: fin.x, z: fin.z, h: fin.y, r: 1.7, off: true };
    VB_OBS.push(o);
    // cerro de donde cae
    const cerro = mount(),
      c = vbEn(VB_CAE + 3, cerro.userData.rb * 0.6 + VB_ANCHO + 3 + VB[VB_CAE].h * 1.3);
    cerro.scale.setScalar(0.6);
    cerro.position.set(c.x, cerro.geometry.parameters.height * 0.3 - 4, c.z);
    vbG.add(cerro);
    return { m, ini, fin, o, t: -1 };
  })();
wo.add(vbG);
congelar(vbG, new Set([vbCae.m])); // escenario estático: no recalcular matrices
let vbVuelta = false, // true al volver de la montaña: no volver a entrar enseguida
  vbAviso = 0,
  vbChoqueT = 0,
  vbSobre = false;
function varaBlancaTick(dt) {
  if (MONT.on) return;
  const zr = B.z - wo.position.z,
    blink = Math.floor(performance.now() / 450) % 2;
  hazM.emissiveIntensity = blink ? 2.5 : 0.1;
  // piedra que cae: se reinicia cuando el bus se aleja
  if (vbCae.t >= 0 && vbCae.t < 1) {
    vbCae.t = Math.min(1, vbCae.t + dt / 1.5);
    const t = vbCae.t,
      a = vbCae.ini,
      b = vbCae.fin;
    vbCae.m.position.set(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t * t + 1.6 * 0.45 + Math.abs(Math.sin(t * 9)) * 2 * (1 - t),
      a.z + (b.z - a.z) * t,
    );
    vbCae.m.rotation.x += dt * 9;
    vbCae.m.rotation.z += dt * 6;
    if (t >= 1) {
      vbCae.o.off = false;
      shake = Math.max(shake, 0.4);
    }
  }
  const lejos = zr > -7950 || zr < -8720 || B.x < 6;
  if (lejos) {
    vbVuelta = false;
    if (vbSobre && !B.fl && !B.bal) B.y = 0;
    vbSobre = false;
    if (vbCae.t >= 1 && (zr > -7800 || zr < -8900)) {
      vbCae.t = -1;
      vbCae.o.off = true;
      vbCae.m.position.set(vbCae.ini.x, vbCae.ini.y + 0.7, vbCae.ini.z);
    }
    vbAviso = 0;
    return;
  }
  if (state != "play" || B.fl) return;
  // punto más cercano del camino
  let best = 1e9,
    bi = 0,
    bt = 0;
  for (let i = 1; i < VB.length; i++) {
    const a = VB[i - 1],
      b = VB[i],
      dx = b.x - a.x,
      dz = b.z - a.z,
      t = Math.max(0, Math.min(1, ((B.x - a.x) * dx + (zr - a.z) * dz) / (dx * dx + dz * dz))),
      d = Math.hypot(B.x - a.x - dx * t, zr - a.z - dz * t);
    if (d < best) {
      best = d;
      bi = i;
      bt = t;
    }
  }
  const a = VB[bi - 1],
    b = VB[bi],
    h = a.h + (b.h - a.h) * bt,
    qx = a.x + (b.x - a.x) * bt,
    qz = a.z + (b.z - a.z) * bt,
    nx = a.nx + (b.nx - a.nx) * bt,
    nz = a.nz + (b.nz - a.nz) * bt,
    lat = (B.x - qx) * nx + (zr - qz) * nz,
    pie = VB_ANCHO + 3 + h * 1.3;
  if (Math.abs(lat) < VB_ANCHO + 0.4 && (B.y > h - 2.5 || h < 2.5)) {
    // sobre la carretera de montaña
    if (!B.bal) B.y = h;
    vbSobre = true;
    // pasando la presa y el derrumbe empieza la Ruta de montaña de 150 km
    if (bi >= 108 && bi <= 112 && !vbVuelta) {
      montEntrar(60, Math.min(Math.abs(B.v), 15));
      return;
    }
    if (!vbAviso && bi > 20) {
      vbAviso = 1;
      msg("⛰ Carretera a Vara Blanca: ¡cuidado con derrumbes y presa!", 3500);
    }
    // barandas: no te deja caer del cerro
    const lim = VB_ANCHO - 0.5 - (PV.hw - 1) * 0.5;
    if (h > 1.5 && Math.abs(lat) > lim) {
      const k = Math.sign(lat) * lim - lat;
      B.x += nx * k;
      B.z += nz * k;
      dmg += Math.abs(B.v) * 0.35 * PV.dm * dt;
      B.v *= Math.pow(0.4, dt);
      shake = Math.max(shake, 0.25);
    }
    // inclinación del bus con la pendiente
    const pend = (b.h - a.h) / (b.s - a.s),
      fx = -Math.sin(B.h),
      fz = -Math.cos(B.h),
      tx = a.tx,
      tz = a.tz;
    cur.rotation.x += Math.atan(pend * (fx * tx + fz * tz));
    // gravedad en la cuesta
    B.v -= 9.8 * 0.55 * pend * (fx * tx + fz * tz) * dt;
    // la piedra cae cuando te acercás
    if (vbCae.t < 0 && bi > VB_CAE - 22 && bi < VB_CAE - 6) {
      vbCae.t = 0;
      msg("⚠ ¡DERRUMBE! Cuidado con la piedra", 2500);
    }
    // choques con el derrumbe y la presa
    vbChoqueT -= dt;
    for (const o of VB_OBS) {
      if (o.off || Math.abs(B.y - o.h) > 3) continue;
      for (const q of [-PV.hl * 0.8, 0, PV.hl * 0.8]) {
        const px = B.x + fx * q,
          pz = zr + fz * q,
          d = Math.hypot(px - o.x, pz - o.z),
          r = o.r + PV.hw * 0.9;
        if (d < r) {
          const k = (r - d) / (d || 1);
          B.x += (px - o.x) * k;
          B.z += (pz - o.z) * k;
          if (vbChoqueT <= 0 && Math.abs(B.v) > 1.5) {
            vbChoqueT = 1;
            dmg += Math.max(2, Math.abs(B.v) * 0.9) * PV.dm;
            shake = Math.max(shake, 0.6);
            msg(o.r > 2.2 ? "💥 ¡Chocaste un carro de la presa!" : "💥 ¡Chocaste con el derrumbe!", 1500);
            if (dmg >= 100) {
              dmg = 100;
              end();
            }
          }
          B.v *= 0.3;
          break;
        }
      }
    }
  } else if (Math.abs(lat) < pie && B.y < h - 1) {
    // contra la ladera del cerro desde abajo: no se puede atravesar
    const k = Math.sign(lat) * (pie + 0.2) - lat;
    B.x += nx * k;
    B.z += nz * k;
    B.v *= 0.3;
    shake = Math.max(shake, 0.3);
  } else if (vbSobre && !B.bal) {
    B.y = 0;
    vbSobre = false;
  }
}

// ===================== RUTA DE MONTAÑA A VARA BLANCA (150 km) =====================
// Se entra por la carretera a Vara Blanca (después de la presa) o desde el menú ("Inicio: Ruta de montaña").
// El camino (150 km) se calcula una vez y se dibuja por pedazos de 200 m alrededor del bus.
// Tiene curvas, muchas subidas, precipicios (con y sin barandas), volcanes, parques nacionales, bombas
// para echar gasolina y, en el km 44, el peligroso puente de madera del Río Caliente.
// Para no perder precisión con números enormes, el mundo se "re-centra" cerca del bus cada 1.5 km.
const MT = { PASO: 5, LARGO: 150000, W: 4.2, ZB: 60000 },
  MN = MT.LARGO / MT.PASO + 1,
  MPX = new Float64Array(MN),
  MPZ = new Float64Array(MN),
  MPH = new Float64Array(MN),
  MPT = new Float64Array(MN),
  mSm = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  },
  PUENTE = { s0: 44000, s1: 44130, h: 72 }, // km 44: Puente del Río Caliente
  M_BOMBAS = [...Array(15)].map((_, n) => 8000 + n * 10000),
  M_PARQUES = [
    { s: 4000, f: 14000, n: "PARQUE NACIONAL BRAULIO CARRILLO" },
    { s: 16000, f: 26000, n: "PARQUE NACIONAL VOLCÁN POÁS" },
    { s: 62000, f: 76000, n: "PARQUE NACIONAL TAPANTÍ" },
    { s: 82000, f: 94000, n: "PARQUE NACIONAL VOLCÁN IRAZÚ" },
    { s: 100000, f: 112000, n: "PARQUE NACIONAL JUAN CASTRO BLANCO" },
    { s: 132000, f: 147000, n: "PARQUE NACIONAL VOLCÁN ARENAL" },
  ],
  M_VOLCANES = [
    { s: 20500, n: "Volcán Poás", lat: -780, tipo: "lago" },
    { s: 52000, n: "Volcán Barva", lat: 720, tipo: "dormido" },
    { s: 88000, n: "Volcán Irazú", lat: -820, tipo: "dormido" },
    { s: 121000, n: "Volcán Turrialba", lat: 760, tipo: "activo" },
    { s: 140000, n: "Volcán Arenal", lat: -680, tipo: "cono" },
  ];
// el camino: rumbo con curvas suaves (siempre avanza) y alturas con subidas y bajadas
(function () {
  const rumbo = (s) =>
      0.55 * Math.sin(s / 820 + 0.4) +
      0.35 * Math.sin(s / 310 + 1.3) +
      0.22 * Math.sin(s / 123 + 2.2) +
      0.1 * Math.sin(s / 2900),
    rumboPuente = rumbo(PUENTE.s0 - 100);
  let x = 0,
    z = 0;
  for (let i = 0; i < MN; i++) {
    const s = i * MT.PASO,
      recto = mSm(PUENTE.s0 - 250, PUENTE.s0 - 100, s) * (1 - mSm(PUENTE.s1 + 100, PUENTE.s1 + 250, s)),
      th = rumbo(s) * (1 - recto) + rumboPuente * recto;
    MPT[i] = th;
    MPX[i] = x;
    MPZ[i] = z;
    x += Math.cos(th) * MT.PASO;
    z += Math.sin(th) * MT.PASO;
    let h = 85 + 50 * Math.sin(s / 2100 + 0.3) + 30 * Math.sin(s / 700 + 2.1) + 10 * Math.sin(s / 240 + 0.7);
    h = 20 + (h - 20) * mSm(0, 700, s) * (1 - mSm(MT.LARGO - 700, MT.LARGO, s));
    const p = mSm(PUENTE.s0 - 500, PUENTE.s0 - 60, s) * (1 - mSm(PUENTE.s1 + 60, PUENTE.s1 + 500, s));
    MPH[i] = h * (1 - p) + PUENTE.h * p;
  }
})();
// lado de la montaña: k > 0 pared que sube, k < 0 precipicio, k ≈ 0 plano (bombas, parques, inicio y final)
function mPlano(s) {
  let e = mSm(250, 450, s) * (1 - mSm(MT.LARGO - 500, MT.LARGO - 300, s));
  for (const b of M_BOMBAS) e = Math.min(e, mSm(60, 160, Math.abs(s - b)));
  for (const p of M_PARQUES) e = Math.min(e, mSm(40, 120, Math.abs(s - p.s)));
  return e;
}
function mK(s, q) {
  let k =
    Math.max(-1, Math.min(1, 1.3 * Math.sin(s / 950 + 0.7) + 0.5 * Math.sin(s / 2600 + 1.9))) * mPlano(s);
  if (q > 0) k = -k;
  // miradores: del lado del volcán el terreno baja para que se vea completo
  for (const v of M_VOLCANES)
    if (Math.sign(v.lat) === q) {
      const w = 1 - mSm(1200, 2000, Math.abs(s - v.s));
      if (w > 0) k = k * (1 - w) - 0.85 * w;
    }
  const g = mSm(PUENTE.s0 - 420, PUENTE.s0 - 300, s) * (1 - mSm(PUENTE.s1 + 300, PUENTE.s1 + 420, s));
  return k * (1 - g) - g; // cañón del Río Caliente: precipicio a los dos lados
}
const M_LAT = [0, 10, 50, 220, 800],
  M_CU = [
    [0.45, 0.43, 0.4],
    [0.5, 0.48, 0.45],
    [0.38, 0.45, 0.3],
    [0.3, 0.42, 0.25],
    [0.32, 0.45, 0.26],
  ],
  M_CD = [
    [0.45, 0.43, 0.4],
    [0.4, 0.38, 0.33],
    [0.32, 0.45, 0.25],
    [0.28, 0.42, 0.22],
    [0.32, 0.45, 0.26],
  ];
const mAlt = (h, k) =>
  k >= 0
    ? [h, h + 25 * k, h + 90 * k, h + 160 * k, 0]
    : [h, h * (1 + 0.65 * k), h * (1 + 0.95 * k), h * (1 + k), 0];
function mTerrY(i, q, lat) {
  const hs = mAlt(MPH[i], mK(i * MT.PASO, q)),
    d = lat - MT.W;
  for (let j = 1; j < M_LAT.length; j++)
    if (d <= M_LAT[j])
      return hs[j - 1] + ((hs[j] - hs[j - 1]) * (d - M_LAT[j - 1])) / (M_LAT[j] - M_LAT[j - 1]);
  return 0;
}
const mHash = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const mEnPuente = (s) => s > PUENTE.s0 + 2 && s < PUENTE.s1 - 2;
// barandas: siempre en el cañón (menos en el puente); en el resto, solo en algunos tramos con precipicio
function mBaranda(s, q) {
  if (s > PUENTE.s0 - 8 && s < PUENTE.s1 + 8) return false;
  if (s > PUENTE.s0 - 420 && s < PUENTE.s1 + 420) return true;
  return mK(s, q) < -0.3 && mHash(Math.floor(s / 200) * 2 + (q > 0 ? 1 : 0)) > 0.35;
}
// punto del camino desplazado a un lado (lat > 0 = derecha según el sentido de marcha), relativo al origen O
function mPunto(i, lat, y, O) {
  const th = MPT[i];
  return [MPX[i] - Math.sin(th) * lat - O[0], y, MPZ[i] + Math.cos(th) * lat - O[1]];
}
const mYaw = (i) => Math.atan2(-Math.cos(MPT[i]), -Math.sin(MPT[i])); // para que un objeto "mire" hacia quien viene
function malla(rows, fcol, fcolor, fuv) {
  const pos = [],
    col = [],
    uv = [],
    idx = [];
  let nc = 0;
  rows.forEach((i, r) => {
    const c = fcol(i);
    nc = c.length;
    c.forEach((p, j) => {
      pos.push(...p);
      if (fcolor) col.push(...fcolor(i, j));
      if (fuv) uv.push(...fuv(i, j));
    });
    if (r)
      for (let j = 0; j < nc - 1; j++) {
        const a = (r - 1) * nc + j,
          b = a + 1,
          c2 = r * nc + j,
          d = c2 + 1;
        idx.push(a, c2, b, b, c2, d);
      }
  });
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  if (fcolor) g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  if (fuv) g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const mRoadM = new T.MeshStandardMaterial({ map: vbTex, roughness: 0.85, side: T.DoubleSide }),
  mTerrM = new T.MeshStandardMaterial({ map: nz, vertexColors: true, roughness: 1, side: T.DoubleSide }),
  mRailM = new T.MeshStandardMaterial({
    color: 0xc9ced3,
    metalness: 0.7,
    roughness: 0.35,
    side: T.DoubleSide,
  }),
  mPostM = M(0x8a8f94),
  mPostG = new T.BoxGeometry(0.15, 1, 0.15),
  mMaderaM = M(0x8a5a32),
  mMaderaOscM = M(0x5e3b20),
  mSogaM = M(0xb08a55),
  mRocaM = M(0x6d625a),
  mRioM = new T.MeshStandardMaterial({
    color: 0x3d9db0,
    roughness: 0.15,
    metalness: 0.2,
    emissive: 0x0b2b33,
  });
[
  mRoadM,
  mTerrM,
  mRailM,
  mPostM,
  mPostG,
  mMaderaM,
  mMaderaOscM,
  mSogaM,
  mRocaM,
  mRioM,
  smT,
  nz,
  vbTex,
  ROCA_G,
  ...ROCA_M,
].forEach((o) => COMPARTIDO.add(o));
Object.values(TG).forEach((o) => COMPARTIDO.add(o));
[TM.tr, TM.pt, TM.nut, ...TM.lv, ...TM.pl].forEach((o) => COMPARTIDO.add(o));
const avisoTex = (l1, l2, l3) =>
  cv(256, 256, (x) => {
    x.fillStyle = "#111";
    x.beginPath();
    x.moveTo(128, 2);
    x.lineTo(254, 128);
    x.lineTo(128, 254);
    x.lineTo(2, 128);
    x.fill();
    x.fillStyle = "#f2c200";
    x.beginPath();
    x.moveTo(128, 13);
    x.lineTo(243, 128);
    x.lineTo(128, 243);
    x.lineTo(13, 128);
    x.fill();
    x.fillStyle = "#111";
    x.textAlign = "center";
    x.font = "bold 28px system-ui,Arial";
    x.fillText(l1, 128, 100);
    x.fillText(l2, 128, 138);
    x.fillText(l3, 128, 176);
  });
// rótulo en un poste al lado del camino
function mRotulo(g, O, i, lat, tex, w, h, alto = 3) {
  const P = mPunto(i, lat, MPH[i] + alto, O),
    pl = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 }),
    );
  pl.position.set(...P);
  pl.rotation.y = mYaw(i);
  const poste = mm(0.15, alto, 0.15, 0x777777, P[0], P[1] - alto / 2, P[2]);
  g.add(pl, poste);
}
const MONT = {
  on: false,
  ox: 0,
  oz: 0,
  i: 0,
  s: 0,
  lugar: "",
  pedazos: new Map(),
  humos: [],
  vistos: new Set(),
  segura: 0,
  caidaT: 0,
  cayendo: false,
  cruje: 0,
  puente: null,
  carga: 0,
};
// volcanes
function mVolcan(v) {
  const g = new T.Group(),
    cono = v.tipo === "cono",
    rt = cono ? 40 : 95,
    rb = cono ? 520 : 620,
    hh = cono ? 700 : 460,
    ge = new T.CylinderGeometry(rt, rb, hh, 32, 10, true),
    p = ge.attributes.position,
    col = [],
    c = new T.Color(),
    sd = R(0, 10);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      t = (y + hh / 2) / hh,
      n = 1 + 0.07 * Math.sin(Math.atan2(z, x) * 7 + sd) * (1 - t) + 0.04 * Math.sin(y * 0.05 + sd);
    p.setX(i, x * n);
    p.setZ(i, z * n);
    if (t < 0.25) c.setRGB(0.2, 0.34, 0.17);
    else if (t < 0.6) c.setRGB(0.3, 0.24, 0.2).lerp(new T.Color(0.2, 0.34, 0.17), ((0.6 - t) / 0.35) * 0.6);
    else c.setRGB(0.2, 0.18, 0.18).lerp(new T.Color(0.3, 0.24, 0.2), Math.max(0, (0.8 - t) / 0.2));
    col.push(c.r, c.g, c.b);
  }
  ge.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  ge.computeVertexNormals();
  const m = new T.Mesh(
    ge,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: T.DoubleSide }),
  );
  m.position.y = hh / 2 - 3;
  g.add(m);
  const crater = new T.Mesh(
    new T.CircleGeometry(rt * 0.97, 24),
    v.tipo === "lago"
      ? new T.MeshStandardMaterial({ color: 0x4fd1c5, emissive: 0x0a5550, roughness: 0.1 })
      : v.tipo === "dormido"
        ? M(0x3a3330)
        : new T.MeshBasicMaterial({ color: 0xff6a10 }),
  );
  crater.rotation.x = -Math.PI / 2;
  crater.position.y = hh - 6;
  g.add(crater);
  if (v.tipo === "activo" || v.tipo === "cono") {
    const brillo = new T.Sprite(
      new T.SpriteMaterial({
        map: gTex,
        color: 0xff5a10,
        blending: T.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8,
      }),
    );
    brillo.scale.setScalar(rt * 5);
    brillo.position.y = hh;
    g.add(brillo);
  }
  // fumarola: humo (o vapor del lago) que sube y se deshace
  for (let k = 0; k < 8; k++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: smT,
        color: v.tipo === "lago" ? 0xffffff : v.tipo === "dormido" ? 0xcfcfcf : 0x8a8580,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    sp.position.set(R(-rt * 0.4, rt * 0.4), hh, R(-rt * 0.4, rt * 0.4));
    g.add(sp);
    MONT.humos.push({
      m: sp,
      y0: hh,
      t: k / 8,
      alto: v.tipo === "dormido" ? 120 : 300,
      ancho: rt * 1.4,
      vel: 0.05,
    });
  }
  return g;
}
// el puente de madera del Río Caliente
function mPuente(O) {
  const i0 = PUENTE.s0 / MT.PASO,
    i1 = PUENTE.s1 / MT.PASO,
    a = mPunto(i0, 0, PUENTE.h, O),
    b = mPunto(i1, 0, PUENTE.h, O),
    L = Math.hypot(b[0] - a[0], b[2] - a[2]),
    g = new T.Group(),
    tablero = new T.Group();
  g.position.set((a[0] + b[0]) / 2, PUENTE.h, (a[2] + b[2]) / 2);
  g.rotation.y = mYaw(i0);
  g.add(tablero);
  // tablas (algunas faltan: ¡cuidado!)
  const n = Math.floor(L / 0.6),
    tablas = new T.InstancedMesh(new T.BoxGeometry(4.8, 0.14, 0.5), mMaderaM, n),
    m4 = new T.Matrix4(),
    q = new T.Quaternion(),
    e = new T.Euler();
  let c = 0;
  for (let k = 0; k < n; k++) {
    if (k > 6 && k < n - 6 && Math.random() < 0.07) continue;
    e.set(R(-0.02, 0.02), R(-0.05, 0.05), R(-0.02, 0.02));
    q.setFromEuler(e);
    m4.compose(
      new T.Vector3(R(-0.1, 0.1), -0.07 + R(-0.03, 0.03), -L / 2 + k * 0.6 + 0.3),
      q,
      new T.Vector3(1, 1, 1),
    );
    tablas.setMatrixAt(c++, m4);
  }
  tablas.count = c;
  tablas.frustumCulled = false;
  tablas.receiveShadow = true;
  tablero.add(tablas);
  [-2.1, 2.1].forEach((x) => tablero.add(mm(0.3, 0.3, L, 0x5e3b20, x, -0.3, 0)));
  // sogas de las barandas y colgantes
  const soga = (pts, r) => {
    const t = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, r, 5), mSogaM);
    return t;
  };
  [-2.45, 2.45].forEach((x) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const z = -L / 2 + (k / 24) * L,
        u = (2 * z) / L;
      pts.push(new T.Vector3(x, 1.15 - 0.35 * (1 - u * u), z));
    }
    tablero.add(soga(pts, 0.05));
    for (let z = -L / 2 + 3; z < L / 2; z += 3) {
      const u = (2 * z) / L;
      tablero.add(mm(0.04, 1.15 - 0.35 * (1 - u * u), 0.04, 0xb08a55, x, (1.15 - 0.35 * (1 - u * u)) / 2, z));
    }
    // cable principal entre las torres
    const pc = [];
    for (let k = 0; k <= 24; k++) {
      const z = -L / 2 - 1 + (k / 24) * (L + 2),
        u = (2 * z) / (L + 2);
      pc.push(new T.Vector3(x * 1.06, 7.6 - 6 * (1 - u * u), z));
    }
    g.add(soga(pc, 0.09));
  });
  // torres de troncos con el rótulo
  const tex = S("PUENTE DEL RÍO CALIENTE", 512, 80, "#5e3b20", "#ffe9b0", 40);
  [-1, 1].forEach((lado) => {
    const z = lado * (L / 2 + 1);
    [-2.7, 2.7].forEach((x) => {
      const t = new T.Mesh(new T.CylinderGeometry(0.3, 0.38, 9, 8), mMaderaOscM);
      t.position.set(x, 3.5, z);
      t.castShadow = true;
      g.add(t);
    });
    g.add(mm(6.2, 0.45, 0.45, 0x5e3b20, 0, 7.8, z));
    const r = new T.Mesh(
      new T.PlaneGeometry(4.8, 0.75),
      new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide }),
    );
    r.position.set(0, 7.1, z + lado * 0.3);
    g.add(r);
  });
  // el río caliente abajo, con vapor
  const rio = new T.Group(),
    agua = new T.Mesh(new T.PlaneGeometry(1400, 26), mRioM);
  agua.rotation.x = -Math.PI / 2;
  rio.add(agua);
  rio.position.set(g.position.x, 0.4, g.position.z);
  rio.rotation.y = g.rotation.y;
  for (let k = 0; k < 14; k++) {
    const r = new T.Mesh(ROCA_G, pk_(ROCA_M));
    r.scale.setScalar(R(1, 3));
    r.position.set(R(-300, 300), 0.3, (Math.random() < 0.5 ? -1 : 1) * R(13, 18));
    rio.add(r);
  }
  for (let k = 0; k < 12; k++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({ map: smT, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 }),
    );
    sp.position.set(R(-80, 80), 1, R(-8, 8));
    rio.add(sp);
    MONT.humos.push({ m: sp, y0: 1, t: k / 12, alto: 45, ancho: 14, vel: 0.12 });
  }
  return { g, tablero, rio };
}
// pared de roca que cierra el cañón a cada lado del puente
function mParedCanon(i, O) {
  const pos = [],
    idx = [];
  const lats = [];
  for (const q of [-1, 1]) {
    const hs = mAlt(MPH[i], mK(i * MT.PASO, q));
    M_LAT.forEach((l, j) => lats.push([q * (MT.W + l), hs[j]]));
  }
  lats.sort((a, b) => a[0] - b[0]);
  lats.forEach(([l, y], k) => {
    pos.push(...mPunto(i, l, y, O), ...mPunto(i, l, 0, O));
    if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k);
  });
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x9a8a78, roughness: 1, side: T.DoubleSide }));
}
// un pedazo de 200 m del camino con todo lo que hay alrededor
function mPedazo(c) {
  const i0 = c * 40,
    i1 = Math.min(MN - 1, i0 + 40);
  if (i0 >= MN - 1 || c < 0) return null;
  const O = [MPX[i0], MPZ[i0]],
    g = new T.Group(),
    filas = [];
  for (let i = i0; i <= i1; i++) filas.push(i);
  const tramos = (pred) => {
    const out = [];
    let cur = null;
    filas.forEach((i) => {
      if (pred(i)) {
        if (!cur) out.push((cur = []));
        cur.push(i);
      } else cur = null;
    });
    return out.filter((r) => r.length > 1);
  };
  for (const r of tramos((i) => !mEnPuente(i * MT.PASO))) {
    const carretera = new T.Mesh(
      malla(
        r,
        (i) => [mPunto(i, -MT.W, MPH[i] + 0.06, O), mPunto(i, MT.W, MPH[i] + 0.06, O)],
        null,
        (i, j) => [j, (i * MT.PASO) / 12],
      ),
      mRoadM,
    );
    carretera.receiveShadow = true;
    g.add(carretera);
    for (const q of [-1, 1]) {
      const t = new T.Mesh(
        malla(
          r,
          (i) => {
            const hs = mAlt(MPH[i], mK(i * MT.PASO, q));
            return M_LAT.map((l, j) => mPunto(i, q * (MT.W + l), hs[j], O));
          },
          (i, j) => (mK(i * MT.PASO, q) >= 0 ? M_CU : M_CD)[j],
          (i, j) => [j * 3, (i * MT.PASO) / 20],
        ),
        mTerrM,
      );
      t.receiveShadow = true;
      g.add(t);
    }
  }
  // barandas
  for (const q of [-1, 1])
    for (const r of tramos((i) => mBaranda(i * MT.PASO, q))) {
      const b = new T.Mesh(
        malla(r, (i) => [
          mPunto(i, q * (MT.W + 0.15), MPH[i] + 0.45, O),
          mPunto(i, q * (MT.W + 0.15), MPH[i] + 0.95, O),
        ]),
        mRailM,
      );
      b.castShadow = true;
      g.add(b);
      const postes = new T.InstancedMesh(mPostG, mPostM, Math.ceil(r.length / 2)),
        m4 = new T.Matrix4();
      r.forEach((i, n) => {
        if (n % 2 == 0)
          postes.setMatrixAt(n / 2, m4.makeTranslation(...mPunto(i, q * (MT.W + 0.15), MPH[i] + 0.5, O)));
      });
      postes.frustumCulled = false;
      g.add(postes);
    }
  // árboles (bosque espeso en los parques nacionales) y montañas de fondo
  const sMed = (i0 + 20) * MT.PASO,
    parque = M_PARQUES.find((p) => sMed >= p.s && sMed <= p.f),
    nArb = parque ? 34 : 12;
  for (let k = 0; k < nArb; k++) {
    const i = i0 + ((Math.random() * (i1 - i0)) | 0),
      q = Math.random() < 0.5 ? -1 : 1,
      lat = MT.W + R(13, parque ? 120 : 200),
      s = i * MT.PASO;
    if (s > PUENTE.s0 - 60 && s < PUENTE.s1 + 60) continue;
    const t = tree();
    t.position.set(...mPunto(i, q * lat, mTerrY(i, q, lat), O));
    t.scale.setScalar(R(1.2, 2.4));
    g.add(t);
  }
  {
    const mt = mount(),
      kk = R(1.4, 2.8),
      q = Math.random() < 0.5 ? -1 : 1,
      i = i0 + 20;
    mt.scale.setScalar(kk);
    mt.position.set(
      ...mPunto(
        i,
        q * (MT.W + 300 + mt.userData.rb * kk + R(0, 400)),
        (mt.geometry.parameters.height * kk) / 2 - 4,
        O,
      ),
    );
    g.add(mt);
  }
  // kilómetros
  for (const i of filas)
    if (i > 0 && (i * MT.PASO) % 1000 === 0)
      mRotulo(
        g,
        O,
        i,
        MT.W + 1.3,
        S("KM " + (i * MT.PASO) / 1000, 128, 64, "#ffffff", "#111", 34),
        1.1,
        0.55,
        1.3,
      );
  const enPedazo = (s) => s >= i0 * MT.PASO && s < i1 * MT.PASO;
  // bombas de gasolina
  for (const b of M_BOMBAS)
    if (enPedazo(b)) {
      const i = b / MT.PASO,
        sg = new T.Group(),
        P = mPunto(i, MT.W + 8, MPH[i] + 0.04, O);
      sg.position.set(...P);
      sg.rotation.y = mYaw(i);
      const piso = new T.Mesh(new T.PlaneGeometry(14, 40), M(0x5a5d62));
      piso.rotation.x = -Math.PI / 2;
      sg.add(piso, mm(12, 0.5, 16, 0xf4f4f4, 0, 5.5, 0), mm(12.2, 0.3, 16.2, 0xd62828, 0, 5.15, 0));
      [-5, 5].forEach((x) => [-6, 6].forEach((z) => sg.add(mm(0.4, 5.2, 0.4, 0x999999, x, 2.6, z))));
      [-2.5, 2.5].forEach((x) =>
        sg.add(mm(0.9, 1.6, 0.6, 0xd62828, x, 0.8, 0), mm(0.92, 0.45, 0.62, 0xffffff, x, 1.45, 0)),
      );
      g.add(sg);
      mRotulo(
        g,
        O,
        i + 24,
        MT.W + 1.5,
        S("⛽ BOMBA · Km " + b / 1000, 256, 64, "#d62828", "#fff", 30),
        2.6,
        0.65,
        2.6,
      );
    }
  // portones de los parques nacionales
  for (const p of M_PARQUES)
    if (enPedazo(p.s)) {
      const i = p.s / MT.PASO,
        pg = new T.Group();
      pg.position.set(...mPunto(i, 0, MPH[i], O));
      pg.rotation.y = mYaw(i);
      [-1, 1].forEach((x) => {
        const t = new T.Mesh(new T.CylinderGeometry(0.4, 0.5, 8, 8), mMaderaOscM);
        t.position.set(x * (MT.W + 1.2), 4, 0);
        pg.add(t);
      });
      pg.add(mm(2 * MT.W + 4, 0.6, 0.6, 0x5e3b20, 0, 7.6, 0));
      const r = new T.Mesh(
        new T.PlaneGeometry(2 * MT.W + 1, 1.1),
        new T.MeshBasicMaterial({ map: S(p.n, 1024, 128, "#5e3b20", "#ffe9b0", 50), side: T.DoubleSide }),
      );
      r.position.set(0, 6.6, 0.32);
      pg.add(r);
      g.add(pg);
    }
  // volcanes (con un mirador en la orilla)
  for (const v of M_VOLCANES)
    if (enPedazo(v.s)) {
      const i = v.s / MT.PASO,
        vg = mVolcan(v);
      vg.position.set(...mPunto(i, v.lat, 0, O));
      g.add(vg);
      mRotulo(
        g,
        O,
        i - 10,
        Math.sign(v.lat) * (MT.W + 1.5),
        S("🌋 MIRADOR · " + v.n.toUpperCase(), 512, 80, "#0a5a2a", "#fff", 34),
        3.6,
        0.6,
        2.6,
      );
    }
  // el km 44: puente peligroso y avisos
  if (enPedazo(PUENTE.s0)) {
    MONT.puente = mPuente(O);
    g.add(MONT.puente.g, MONT.puente.rio);
    g.add(mParedCanon(PUENTE.s0 / MT.PASO, O), mParedCanon(PUENTE.s1 / MT.PASO, O));
  }
  if (enPedazo(PUENTE.s0 - 250)) {
    mRotulo(
      g,
      O,
      (PUENTE.s0 - 250) / MT.PASO,
      MT.W + 1.8,
      avisoTex("⚠ PUENTE", "PELIGROSO", "MÁX 20 km/h"),
      2.6,
      2.6,
      3.4,
    );
    mRotulo(
      g,
      O,
      (PUENTE.s0 - 150) / MT.PASO,
      MT.W + 1.8,
      S("RÍO CALIENTE · KM 44", 512, 80, "#0a6e3a", "#fff", 38),
      3.6,
      0.6,
      3,
    );
  }
  if (c === 0)
    mRotulo(
      g,
      O,
      12,
      MT.W + 1.8,
      S("RUTA DE MONTAÑA · VARA BLANCA → 150 km", 1024, 96, "#0a6e3a", "#fff", 44),
      6,
      0.6,
      3.2,
    );
  if (enPedazo(MT.LARGO - 300))
    mRotulo(
      g,
      O,
      (MT.LARGO - 300) / MT.PASO,
      MT.W + 1.8,
      S("🏁 META · 150 km", 512, 96, "#d62828", "#fff", 50),
      4,
      0.75,
      3.4,
    );
  return { g, O };
}
const montG = new T.Group();
montG.visible = false;
sc.add(montG);
function mColocar(p) {
  p.g.position.set(p.O[0] - MONT.ox, 0, MT.ZB + p.O[1] - MONT.oz);
}
function mQuitarPedazo(c) {
  const p = MONT.pedazos.get(c);
  if (!p) return;
  MONT.humos = MONT.humos.filter((h) => {
    let o = h.m;
    while (o && o !== p.g) o = o.parent;
    return !o;
  });
  if (MONT.puente && MONT.puente.g.parent === p.g) MONT.puente = null;
  liberar(p.g);
  MONT.pedazos.delete(c);
}
function mStream(s, todos) {
  const c0 = Math.floor((s - 400) / 200),
    c1 = Math.floor((s + 1400) / 200);
  for (const c of [...MONT.pedazos.keys()]) if (c < c0 - 1 || c > c1 + 1) mQuitarPedazo(c);
  let hechos = 0;
  for (let c = c0; c <= c1; c++)
    if (!MONT.pedazos.has(c) && (todos || hechos < 2)) {
      const p = mPedazo(c);
      if (!p) continue;
      montG.add(p.g);
      mColocar(p);
      MONT.pedazos.set(c, p);
      hechos++;
    }
}
const fundido = document.createElement("div");
fundido.style.cssText = "position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:8";
document.body.appendChild(fundido);
function mFundido() {
  fundido.style.transition = "none";
  fundido.style.opacity = 1;
  void fundido.offsetWidth;
  fundido.style.transition = "opacity .7s";
  fundido.style.opacity = 0;
}
// coloca el bus en el kilómetro s (carril derecho)
function mPonerBus(i, vel) {
  const th = MPT[i];
  MONT.ox = MPX[i];
  MONT.oz = MPZ[i];
  for (const p of MONT.pedazos.values()) mColocar(p);
  B.x = -Math.sin(th) * 1.9;
  B.z = MT.ZB + Math.cos(th) * 1.9;
  B.h = Math.atan2(-Math.cos(th), -Math.sin(th));
  B.y = MPH[i];
  B.v = vel;
  B.bal = 0;
  B.vy = 0;
  MONT.i = i;
  MONT.segura = i;
  cam.position.set(B.x - Math.cos(th) * 15, B.y + PV.ch, B.z - Math.sin(th) * 15);
  bus.position.set(B.x, B.y, B.z);
}
function montEntrar(s0, vel = 0) {
  if (MONT.on) return;
  MONT.on = true;
  if (chase) terminarPersecucion();
  cars.forEach((c) => liberar(c.o));
  cars.length = 0;
  wo.visible = rb.visible = water.visible = false;
  chunks.forEach((c) => (c.g.visible = false));
  if (stop) stop.g.visible = false;
  montG.visible = true;
  MONT.vistos.clear();
  MONT.cayendo = false;
  MONT.caidaT = 0;
  const i = Math.round(s0 / MT.PASO);
  mPonerBus(i, vel);
  mStream(s0, true);
  cam.far = 3200;
  cam.updateProjectionMatrix();
  mFundido();
  msg("⛰ Ruta de montaña a Vara Blanca · 150 km · ¡cuidado con los precipicios!", 4000);
}
function montSalir(alVB) {
  if (!MONT.on) return;
  MONT.on = false;
  for (const c of [...MONT.pedazos.keys()]) mQuitarPedazo(c);
  montG.visible = false;
  wo.visible = rb.visible = true;
  chunks.forEach((c) => (c.g.visible = true));
  if (stop) stop.g.visible = true;
  cam.far = 1500;
  cam.updateProjectionMatrix();
  if (alVB) {
    // de vuelta a la bajada de Vara Blanca, que lleva a la autopista
    vbVuelta = true;
    vbAviso = 1; // que no tape el mensaje del premio
    const p = VB[120];
    B.x = p.x;
    B.z = p.z;
    B.y = p.h;
    B.h = Math.atan2(-p.tx, -p.tz);
    B.v = 0;
    B.bal = 0;
    cam.position.set(B.x - p.tx * 15, B.y + PV.ch, B.z - p.tz * 15);
    if (stop) liberar(stop.g);
    st0 = Math.ceil(-B.z / 500) - si;
    stop = mkStop(si + st0);
    mFundido();
  }
}
// iniciar directo en la montaña desde el menú, y limpiar al reiniciar
const _startOriginal = start;
start = function () {
  montSalir(false);
  _startOriginal();
  if (sz == INICIO_MONTANA) montEntrar(60);
};
$("go").onclick = start;
let mAvisoBomba = 0;
function montTick(dt) {
  if (!MONT.on) return;
  // escena de montaña: niebla lejana para ver paisajes, sin recortes del suelo, sin agua
  sc.fog.near = 500;
  sc.fog.far = 2900;
  cp1.constant = 1e9;
  ground.visible = true;
  water.visible = false;
  wo.visible = rb.visible = false;
  // humo de volcanes y vapor del río
  for (const h of MONT.humos) {
    h.t = (h.t + dt * h.vel) % 1;
    const u = h.t;
    h.m.position.y = h.y0 + u * h.alto;
    h.m.scale.setScalar(h.ancho * (0.4 + u));
    h.m.material.opacity = 0.55 * Math.sin(Math.PI * u);
  }
  // re-centrar el mundo cerca del bus
  if (Math.abs(B.x) > 1500 || Math.abs(B.z - MT.ZB) > 1500) {
    const dx = B.x,
      dz = B.z - MT.ZB;
    MONT.ox += dx;
    MONT.oz += dz;
    B.x -= dx;
    B.z -= dz;
    cam.position.x -= dx;
    cam.position.z -= dz;
    bus.position.set(B.x, B.y, B.z);
    FX.forEach((p) => {
      p.m.position.x -= dx;
      p.m.position.z -= dz;
    });
    for (const p of MONT.pedazos.values()) mColocar(p);
  }
  // dónde está el bus en el camino
  const mx = B.x + MONT.ox,
    mz = B.z - MT.ZB + MONT.oz;
  let best = 1e18,
    bi = MONT.i,
    bt = 0;
  for (let i = Math.max(0, MONT.i - 60); i < Math.min(MN - 1, MONT.i + 60); i++) {
    const dx = MPX[i + 1] - MPX[i],
      dz = MPZ[i + 1] - MPZ[i],
      t = Math.max(0, Math.min(1, ((mx - MPX[i]) * dx + (mz - MPZ[i]) * dz) / (dx * dx + dz * dz))),
      d = (mx - MPX[i] - dx * t) ** 2 + (mz - MPZ[i] - dz * t) ** 2;
    if (d < best) {
      best = d;
      bi = i;
      bt = t;
    }
  }
  MONT.i = bi;
  const s = (bi + bt) * MT.PASO,
    h = MPH[bi] + (MPH[bi + 1] - MPH[bi]) * bt,
    th = MPT[bi],
    nx = -Math.sin(th),
    nz = Math.cos(th),
    qx = MPX[bi] + (MPX[bi + 1] - MPX[bi]) * bt,
    qz = MPZ[bi] + (MPZ[bi + 1] - MPZ[bi]) * bt,
    lat = (mx - qx) * nx + (mz - qz) * nz,
    q = Math.sign(lat) || 1,
    k = mK(s, q),
    enPuente = mEnPuente(s),
    kmh = Math.abs(B.v) * 3.6;
  MONT.s = s;
  mStream(s, false);
  // nombre del lugar y avisos
  const parque = M_PARQUES.find((p) => s >= p.s && s <= p.f),
    volcan = M_VOLCANES.find((v) => Math.abs(s - v.s) < 3000);
  MONT.lugar = parque ? parque.n.replace("PARQUE NACIONAL", "P.N.") : volcan ? volcan.n : "Ruta de montaña";
  const avisar = (clave, texto, ms = 3500) => {
    if (!MONT.vistos.has(clave)) {
      MONT.vistos.add(clave);
      msg(texto, ms);
    }
  };
  if (parque && s - parque.s < 300)
    avisar(
      parque.n,
      "🌳 Bienvenido al " + parque.n.toLowerCase().replace("parque nacional", "Parque Nacional"),
    );
  if (volcan && Math.abs(s - volcan.s) < 1300) avisar(volcan.n, "🌋 ¡" + volcan.n + " a la vista!");
  if (s > PUENTE.s0 - 400 && s < PUENTE.s0)
    avisar(
      "puente",
      "⚠ Km 44: Puente del Río Caliente. ¡Muy peligroso! Pasá despacio y por el centro",
      4500,
    );
  setH("stop", `⛰ <b>Km ${(s / 1000).toFixed(1)}</b> / 150 · ${MONT.lugar}`);
  hudExtra = "";
  // vaivén del puente
  if (MONT.puente) {
    const fuerza = enPuente ? 0.012 + 0.035 * Math.min(1, kmh / 40) : 0.006;
    MONT.puente.tablero.rotation.z = Math.sin(performance.now() / 600) * fuerza;
  }
  if (state != "play") return;
  // llegada a la meta
  if (s >= MT.LARGO - 60) {
    cash += 50000;
    msg("🏁 ¡Llegaste! 150 km de montaña a Vara Blanca · Premio ₡50 000", 5000);
    montSalir(true);
    return;
  }
  // caída al precipicio o al río: se vuelve a la carretera
  if (MONT.cayendo) {
    if (!B.bal && B.y < h - 3) {
      MONT.caidaT += dt;
      if (MONT.caidaT > 1.6) {
        MONT.cayendo = false;
        mPonerBus(MONT.segura, 0);
        mFundido();
        msg("🚑 De vuelta en la carretera", 2000);
      }
    }
    return;
  }
  // el ultraligero puede aterrizar en la carretera
  if (B.fl) {
    if (Math.abs(lat) < MT.W && B.y <= h + 0.5 && B.vy < 0) {
      B.fl = 0;
      B.y = h;
      B.vy = 0;
      msg("🛬 Aterrizaste en la carretera", 1500);
    }
    return;
  }
  if (B.bal) return;
  const ancho = enPuente ? 2.4 : MT.W,
    baranda = !enPuente && mBaranda(s, q),
    pared = !enPuente && k > 0.15,
    plano = !enPuente && Math.abs(k) <= 0.15,
    limite = baranda ? MT.W - 0.5 - (PV.hw - 1) * 0.5 : pared ? MT.W + 0.3 : plano ? MT.W + 8 : ancho + 0.6;
  if (Math.abs(lat) > limite) {
    if (baranda || pared || plano) {
      // pared de roca, baranda o borde del plano: no te deja pasar
      const kk = q * limite - lat;
      B.x += nx * kk;
      B.z += nz * kk;
      dmg += Math.abs(B.v) * 0.35 * PV.dm * dt;
      B.v *= Math.pow(0.4, dt);
      shake = Math.max(shake, 0.25);
    } else {
      // ¡al vacío!
      MONT.cayendo = true;
      MONT.caidaT = 0;
      B.bal = 1;
      B.vy = 1;
      dmg += 30 * PV.dm;
      shake = 1;
      msg(enPuente ? "😱 ¡Te caíste del puente al Río Caliente!" : "😱 ¡Te caíste al precipicio!", 2500);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
      return;
    }
  }
  B.y = h;
  if (Math.abs(lat) < MT.W - 1 && !enPuente && s > 50) MONT.segura = bi;
  // pendiente: inclinación del vehículo y gravedad
  const fx = -Math.sin(B.h),
    fz = -Math.cos(B.h),
    al = fx * Math.cos(th) + fz * Math.sin(th),
    pend = (MPH[bi + 1] - MPH[bi]) / MT.PASO;
  cur.rotation.x += Math.atan(pend * al);
  B.v -= 9.8 * 0.55 * pend * al * dt;
  // el puente cruje si vas rápido; muy rápido, se quiebran las tablas
  if (enPuente) {
    if (kmh > 75) {
      MONT.cayendo = true;
      MONT.caidaT = 0;
      B.bal = 1;
      B.vy = 0;
      dmg += 30 * PV.dm;
      shake = 1;
      msg("💥 ¡Se quebraron las tablas del puente!", 2500);
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
      return;
    }
    if (kmh > 25) {
      dmg += (kmh - 25) * 0.06 * PV.dm * dt;
      shake = Math.max(shake, 0.2 + (kmh - 25) * 0.01);
      MONT.cruje -= dt;
      if (MONT.cruje <= 0) {
        MONT.cruje = 2.5;
        msg("⚠ ¡El puente cruje! Pasá despacio (máx 20 km/h)", 2000);
      }
      if (dmg >= 100) {
        dmg = 100;
        end();
      }
    }
  }
  // bombas: detenete en la bomba para llenar el tanque
  const bomba = M_BOMBAS.find((b) => Math.abs(s - b) < 22);
  if (bomba != null && lat > MT.W + 1.5 && lat < MT.W + 15 && Math.abs(B.v) < 1.5 && fuel < 99) {
    mAvisoBomba += dt;
    if (mAvisoBomba > 2) {
      const cc = Math.round((100 - fuel) * 15);
      fuel = 100;
      heat = 0;
      nit = PV.nit;
      cash = Math.max(0, cash - cc);
      msg("⛽ Tanque lleno −₡" + cc, 2500);
      hiss();
      mAvisoBomba = 0;
    }
  } else mAvisoBomba = 0;
}

let last = performance.now();
function loop(n) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0, (n - last) / 1000));
  last = n;
  try {
    if (state != "paused") {
      upd(dt);
      gfxTick(dt);
      policiaTick(dt);
      varaBlancaTick(dt);
      montTick(dt);
      if (typeof mundoTick == "function") mundoTick(dt);
    } else sirena(false);
  } catch (e) {
    console.error(e);
  }
  try {
    const py = cam.position.y;
    _qCam.copy(cam.quaternion);
    cam.position.y += bendY(cam.position.z);
    if (cm_ == 0) {
      const tz = B.z - Math.cos(B.h) * 22;
      cam.lookAt(B.x - Math.sin(B.h) * 22, 2.6 + B.y + bendY(tz), tz);
    }
    rd.render(sc, cam);
    cam.position.y = py;
    cam.quaternion.copy(_qCam);
  } catch (e) {
    console.error(e);
  }
}
requestAnimationFrame(loop);
