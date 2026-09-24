function spawnGasGiantLightning(origin) {
  const points = [];
  let cur = origin.clone().add(V((Math.random() - 0.5) * 180, (Math.random() * 80 + 30), (Math.random() - 0.5) * 180));
  points.push(cur.clone());
  const steps = 8;
  for (let s = 0; s < steps; s++) {
    cur.add(V((Math.random() - 0.5) * 30, -(Math.random() * 20 + 12), (Math.random() - 0.5) * 30));
    points.push(cur.clone());
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const boltColor = Math.random() < 0.5 ? 0x90caf9 : 0xce93d8;
  const lineMat = new THREE.LineBasicMaterial({ color: boltColor, linewidth: 2, transparent: true, opacity: 0.95 });
  const line = new THREE.Line(geo, lineMat);
  line.userData.noCollision = true;
  scene.add(line);
  
  particleBurst(cur, boltColor, 20, 10);
  
  if (audioContext && !audioMuted) {
    tone(42 + Math.random() * 12, audioContext.currentTime, 0.7, 0.3, fxBus, 'sawtooth');
  }

  setTimeout(() => {
    scene.remove(line);
    geo.dispose();
    lineMat.dispose();
  }, 100);
}
window.spawnGasGiantLightning = spawnGasGiantLightning;

function applyGasGiantFlightDynamics(dt) {
  const p = nearest(ship.position);
  if (!p || !p.isGasGiant) return;
  const dist = ship.position.distanceTo(p.center);
  const alt = dist - p.r;
  const atmoH = p.atmosphereHeight || 9000;
  const depth = THREE.MathUtils.clamp((atmoH - alt) / atmoH, 0, 1);

  // A. Progressive fill of concentric cloud layers as player descends!
  if (p.gasCloudLayers) {
    for (const l of p.gasCloudLayers) {
      if (l.index === 0) {
        l.mesh.material.uniforms.cover.value = 0.98;
        l.mesh.material.uniforms.density.value = 0.95;
      } else {
        const fill = THREE.MathUtils.clamp((depth - (1 - l.ratio) * 0.5) * 2.2, 0, 1);
        l.mesh.material.uniforms.cover.value = THREE.MathUtils.lerp(l.baseCover, 0.98, fill);
        l.mesh.material.uniforms.density.value = THREE.MathUtils.lerp(0.40, 0.96, fill);
      }
      l.mesh.material.uniforms.time.value += dt;
      l.mesh.rotation.y += dt * (0.00025 + l.index * 0.0001);
    }
  }

  if (alt < atmoH) {
    // B. Thick volumetric fog inside Gas Giant
    if (scene.fog) {
      scene.fog.near = THREE.MathUtils.lerp(500, 8, depth);
      scene.fog.far = THREE.MathUtils.lerp(5000, 95, depth);
      const fogTint = new THREE.Color(p.def[3]).lerp(new THREE.Color(0x06060c), depth * 0.85);
      scene.fog.color.lerp(fogTint, 1 - Math.exp(-dt * 5));
    }

    // C. Extreme buoyant resistance when descending (ascent remains full speed)
    if (liftSpeed < 0 || manualVelocity.y < 0) {
      const descendDrag = 1 / (1 + depth * 6.5);
      liftSpeed *= descendDrag;
      manualVelocity.y *= descendDrag;
    }

    // D. Violent buffeting turbulence (ship rolls and yaws laterally)
    const turbulence = depth * 0.55;
    shipTiltRoll += (Math.sin(totalTime * 19) * 0.32 + Math.cos(totalTime * 25) * 0.24) * turbulence;
    shipTiltYaw += Math.sin(totalTime * 14) * 0.22 * turbulence;
    sideSpeed += (Math.sin(totalTime * 11) * 55) * turbulence;

    // E. Frequent lightning storms inside clouds
    if (depth > 0.25 && Math.random() < dt * (1.8 + depth * 4.5)) {
      spawnGasGiantLightning(ship.position);
    }

    if (depth > 0.75) {
      const dmg = (depth - 0.75) * 85 * dt;
      hurtPlayer(dmg);
      if (Math.random() < dt * 1.5) {
        toast('ALERTA: PRESSÃO CRÍTICA NO NÚCLEO GASOSO // DESCARGAS DE PLASMA');
      }
    }
  }
}


