// js/juego/18-bucle.js · el bucle principal: actualiza y dibuja cada cuadro.
// Parte 18 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

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
    if (cm_ == 0 || MIRA < 0) {
      const tz = B.z - Math.cos(B.h) * 22 * MIRA;
      cam.lookAt(B.x - Math.sin(B.h) * 22 * MIRA, 2.6 + B.y + bendY(tz), tz);
    }
    rd.render(sc, cam);
    cam.position.y = py;
    cam.quaternion.copy(_qCam);
  } catch (e) {
    console.error(e);
  }
}
requestAnimationFrame(loop);
