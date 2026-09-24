function updateSky(dt) {
  if (boost || !planets || planets.length === 0) {
    const bg = new THREE.Color(0x070e1a);
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 25000, 4000000);
    starsObj.position.copy(camera.position);
    starsObj.material.opacity = 1;
    camera.fov = THREE.MathUtils.lerp(camera.fov, 104, Math.min(1, dt * 3));
    camera.updateProjectionMatrix();
    return { p: planets[0] || null, alt: 999999, density: 0 };
  }
  const { p, alt, density } = atmosphereAt(camera.position);
  if (!p || !p.def) return { p: null, alt: 999999, density: 0 };

  // Natural continuous sky color gradient from deep space black into planet atmosphere
  const spaceColor = new THREE.Color(0x070e1a);
  const atmoColor = new THREE.Color(p.def[5]).multiplyScalar(0.42).lerp(new THREE.Color(p.def[3]).multiplyScalar(0.55), 0.35);
  const targetSky = spaceColor.clone().lerp(atmoColor, density);

  if (!scene.background) scene.background = new THREE.Color(0x020409);
  scene.background.lerp(targetSky, 1 - Math.exp(-dt * 3.5));

  const fogNear = THREE.MathUtils.lerp(25000, 400, density);
  const fogFar = THREE.MathUtils.lerp(4000000, 3200, density);
  scene.fog = new THREE.Fog(scene.background, fogNear, fogFar);

  for (const world of planets) {
    world.haze.value = (world === p) ? 0 : density * 0.06;
    world.hazeColor.value.copy(scene.background);
  }
  starsObj.position.copy(camera.position);
  starsObj.material.opacity = THREE.MathUtils.clamp(1.0 - density * 1.15, 0, 1);

  const solPos = (suns[0] && suns[0].pos) ? suns[0].pos : V(0, 1200, 0),
        lightDir = solPos.clone().sub(camera.position).normalize();
  sunlight.position.copy(camera.position).addScaledVector(lightDir, 250);
  sunlight.target.position.copy(camera.position);
  const baseFov = thirdPerson ? 70 : THREE.MathUtils.clamp(70 * cameraZoom[mode], 35, 100);
  const targetFov = boost ? 104 : aiming ? (equipped === 'rifle' ? 44 : equipped === 'tool' ? 46 : 52) : baseFov + heat * 3;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, dt * 4));
  camera.updateProjectionMatrix();
  return { p, alt, density };
}
// === 3D HYPER-WARP PARTICLE STREAM (REAL WORLD-SPACE PARTICLES PASSING SHIP) ===
