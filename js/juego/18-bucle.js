// js/juego/18-bucle.js · el bucle principal: actualiza y dibuja cada cuadro.
// Parte 18 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

let last = performance.now();
function loop(n) {
  requestAnimationFrame(loop);
  const t0 = performance.now(),
    msCuadro = n - last;
  const dt = Math.min(0.05, Math.max(0, msCuadro / 1000));
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
    if (cm_ == 0 || MIRA < 0) {
      const tz = B.z - Math.cos(B.h) * 22 * MIRA;
      cam.lookAt(B.x - Math.sin(B.h) * 22 * MIRA, 2.6 + B.y + bendY(tz), tz);
    }
    CALIDAD.antesDeDibujar(); // nivel Bajo: niebla más cerca y no dibuja lo que queda detrás
    rd.render(sc, cam);
    CALIDAD.despuesDeDibujar();
    cam.position.y = py;
    cam.quaternion.copy(_qCam);
  } catch (e) {
    console.error(e);
  }
  CALIDAD.medir(msCuadro, performance.now() - t0); // modo automático: ¿va fluido?
}
requestAnimationFrame(loop);
