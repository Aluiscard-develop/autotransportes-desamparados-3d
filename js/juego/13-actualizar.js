// js/juego/13-actualizar.js · lo que pasa en cada cuadro: manejo, choques, paradas, cámara y HUD (función upd).
// Parte 13 de 18 del juego. index.html carga estas partes en orden (01, 02, 03…);
// todas comparten las mismas variables, así que una parte puede usar lo que definió una anterior.

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
    if ((zw == 1 || zw == 4 || zw == 9 || zw == 25 || zw == 30 || zw == 35 || zw == 41) && Math.abs(B.x) < 0.55 + PV.hw) {
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
  const clz = CLIMA[zl] || {};
  ground.material.color.setHex(
    clz.suelo != null ? clz.suelo : zl == 24 ? 0xa8a27a : zl == 3 || zl == 5 || zl == 6 || zl == 27 ? 0x8fb080 : 0xffffff,
  );
  const fn = (clz.niebla ? clz.niebla[0] : zl == 24 ? 6 : zl == 3 || zl == 5 || zl == 6 ? 40 : 90) * (1 - 0.3 * rnv),
    ff = (clz.niebla ? clz.niebla[1] : zl == 24 ? 150 : zl == 3 || zl == 5 || zl == 6 ? 330 : 560) * (1 - 0.4 * rnv);
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
  nt += ((zl == 12 ? 1 : clz.oscuro || 0) - nt) * Math.min(1, dt * 0.8);
  rnv += ((RAIN || clz.lluvia ? 1 : 0) - rnv) * Math.min(1, dt * 0.7);
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
            : 60);
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
  const miraAntes = MIRA;
  MIRA = keys.KeyV || keys.TV ? -1 : 1;
  if (cm_ == 0 || MIRA < 0) {
    // mirando atrás, la cámara se pone adelante del vehículo y mira hacia atrás
    const tg = _v1.set(B.x - fx * PV.cd * MIRA, PV.ch + B.y, B.z - fz * PV.cd * MIRA);
    if (MIRA != miraAntes) cam.position.copy(tg);
    else cam.position.lerp(tg, 1 - Math.exp(-dt * 4));
    cam.position.x += sk;
    cam.position.y += sk * 0.6;
    cam.lookAt(B.x + fx * 22 * MIRA, 2.6 + B.y, B.z + fz * 22 * MIRA);
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
