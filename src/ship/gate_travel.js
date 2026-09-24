function crossesGate(a, b, g) {
  const da = a.clone().sub(g.pos).dot(g.normal);
  const db = b.clone().sub(g.pos).dot(g.normal);
  if ((da <= 0 && db >= 0) || (da >= 0 && db <= 0)) {
    const denom = da - db;
    const t = Math.abs(denom) > 1e-6 ? da / denom : 0.5;
    const p = a.clone().add(b.clone().sub(a).multiplyScalar(THREE.MathUtils.clamp(t, 0, 1)));
    const latSq = p.clone().sub(g.pos).addScaledVector(g.normal, -p.clone().sub(g.pos).dot(g.normal)).lengthSq();
    if (latSq <= 145 * 145) return true;
  }
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const along = mid.clone().sub(g.pos).dot(g.normal);
  if (Math.abs(along) < (g.halfLength || 250)) {
    const latSq = mid.clone().sub(g.pos).addScaledVector(g.normal, -along).lengthSq();
    if (latSq <= 140 * 140) return true;
  }
  return false;
}

function triggerBoost(g) {
  landed = false;
  openRamp(false,false);
  if (auto?.gate) auto = null;
  autoGate = null;
  gateCooldown = 18;
  if (rover.parent !== ship) {
    ship.attach(rover);
    rover.position.copy(layout().rover);
    rover.rotation.set(0, layout().roverYaw, 0);
    inside = true;
    roverAir = false;
  }
  const warpDir = g.normal.clone().normalize();
  const ly = (3.4 + hash2D(g.targetCoord.x, g.targetCoord.y, 42) * 4.8).toFixed(1);
  boost = {
    startGate: g,
    targetCoord: g.targetCoord,
    targetName: g.targetName,
    targetGateIndex: g.targetGateIndex,
    elapsed: 0,
    duration: 13.5,
    warpDir,
    startPos: ship.position.clone(),
    tunnelPos: g.pos.clone().addScaledVector(warpDir, 8000),
    lightYears: parseFloat(ly),
    loaded: false,
    loadedAt: 0,
    unloadedOld: false,
    approachStart: null,
    approachEnd: null,
    arrivalDir: null
  };
  ship.quaternion.setFromUnitVectors(V(0, 0, -1), warpDir);
  toast('ARCO ATIVADO · Salto Interestelar para ' + g.targetName + ' (' + ly + ' AL)');
  if (audioContext) [110, 220, 440, 880].forEach((f, i) => tone(f, audioContext.currentTime + i * .1, 2.2, .14, fxBus, 'triangle'));
}

