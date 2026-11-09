// js/juego/02-escena.js · renderizador, cámara, cielo, sol, nubes, lluvia y suelo.
// Parte 2 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

// bordes suaves y resolución según el modo de gráficos (js/rendimiento.js)
const rd = new T.WebGLRenderer({ antialias: CALIDAD.antialias, powerPreference: "high-performance" });
rd.setPixelRatio(Math.min(devicePixelRatio, AJUSTES.graficos[CALIDAD.nivel].resolucion));
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
let GQ = CALIDAD.nivel == "ultra" ? 1 : 0, // 1 = Ultra realista (lo maneja js/rendimiento.js)
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
