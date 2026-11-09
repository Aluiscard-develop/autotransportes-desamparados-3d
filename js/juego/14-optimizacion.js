// js/juego/14-optimizacion.js · liberar memoria, congelar el escenario estático y efectos por cuadro (gfxTick).
// Parte 14 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

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
