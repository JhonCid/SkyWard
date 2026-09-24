let flareIntensity = 0;
function drawLensFlare(ctx, canvas, dt) {
  if (!ctx || typeof ctx.save !== 'function' || !suns.length || !suns[0] || !suns[0].pos) return;
  const sunPos = suns[0].pos.clone();
  
  // 1. Check if camera is looking towards the sun
  camera.updateMatrixWorld(true);
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const toSun = sunPos.clone().sub(camera.position).normalize();
  const sunDot = camDir.dot(toSun);
  
  let targetIntensity = 0;
  if (sunDot > 0.08) {
    const proj = sunPos.clone().project(camera);
    if (proj.z < 1.0 && Math.abs(proj.x) < 1.4 && Math.abs(proj.y) < 1.4) {
      let occluded = false;
      // A. Planet occlusion
      for (const p of planets) {
        if (!p.center) continue;
        const dCamPlanet = camera.position.distanceTo(p.center);
        const dCamSun = camera.position.distanceTo(sunPos);
        if (dCamPlanet < dCamSun && dCamPlanet > p.r) {
          const ray = new THREE.Ray(camera.position, toSun);
          const hit = ray.intersectSphere(new THREE.Sphere(p.center, p.r + 2), new THREE.Vector3());
          if (hit) { occluded = true; break; }
        }
      }

      // B. Ship cockpit & cabin occlusion (never bleeds through hull, roof, or bulkhead)
      if (!occluded && typeof ship !== 'undefined' && ship) {
        if (mode === 'pilot' && !thirdPerson) {
          // Inside pilot seat: can ONLY see sun through forward canopy glass
          const toSunShip = toSun.clone().applyQuaternion(ship.quaternion.clone().invert());
          // Forward canopy is facing forward (z < -0.15), elevated (-0.10 < y < 0.75), within canopy width (|x| < 0.75)
          if (toSunShip.z >= -0.15 || toSunShip.y < -0.10 || toSunShip.y > 0.75 || Math.abs(toSunShip.x) > 0.75) {
            occluded = true; // Roof, bulkhead, floor or side hull blocks sun
          }
        } else if (inside && mode === 'foot') {
          // Inside ship on foot: enclosed cabin blocks sun unless standing right at open rear ramp looking out
          const l = layout();
          const nearEntry = foot.distanceTo(l.entry) < 3.0;
          if (rampOpen && nearEntry) {
            const toSunShip = toSun.clone().applyQuaternion(ship.quaternion.clone().invert());
            if (toSunShip.dot(l.normal) < 0.4) occluded = true;
          } else {
            occluded = true;
          }
        } else if (!inside && mode !== 'pilot') {
          // Outside on foot / EVA: check if ship blocks sun ray
          const dShip = camera.position.distanceTo(ship.position);
          if (dShip < 120) {
            const ray = new THREE.Raycaster(camera.position, toSun, 0.2, 120);
            const hits = ray.intersectObject(ship, true);
            if (hits.some(h => h.object.isMesh && (!h.object.material.transparent || h.object.material.opacity > 0.6))) {
              occluded = true;
            }
          }
        }
      }

      // C. Rover cabin & chassis occlusion (never bleeds through roof or rear)
      if (!occluded && typeof rover !== 'undefined' && rover) {
        const roverWorldPos = rover.getWorldPosition(new THREE.Vector3());
        if (mode === 'rover' && !thirdPerson) {
          // Inside rover 1st person: can ONLY see sun through windshield/side glass
          const toSunRover = toSun.clone().applyQuaternion(rover.getWorldQuaternion(new THREE.Quaternion()).invert());
          // Windshield/side glass: z < 0.10, -0.05 < y < 0.65, |x| < 0.85
          if (toSunRover.y > 0.65 || toSunRover.z >= 0.10 || toSunRover.y < -0.05) {
            occluded = true; // Solid roof, rear armor or floor blocks sun
          }
        } else if (mode !== 'rover' || thirdPerson) {
          // Outside rover or in 3rd person: check if rover chassis blocks sun ray
          const dRover = camera.position.distanceTo(roverWorldPos);
          if (dRover < 35) {
            const ray = new THREE.Raycaster(camera.position, toSun, 0.2, 35);
            const hits = ray.intersectObject(rover, true);
            if (hits.some(h => h.object.isMesh && (!h.object.material.transparent || h.object.material.opacity > 0.6))) {
              occluded = true;
            }
          }
        }
      }
      if (!occluded) {
        const centerFalloff = Math.max(0, (sunDot - 0.08) / 0.92);
        targetIntensity = centerFalloff * 0.72;
      }
    }
  }
  
  flareIntensity = THREE.MathUtils.lerp(flareIntensity, targetIntensity, 1 - Math.exp(-dt * 9));
  if (flareIntensity <= 0.005) return;
  
  const proj = sunPos.clone().project(camera);
  const sunScreenX = (proj.x * 0.5 + 0.5) * canvas.width;
  const sunScreenY = (-proj.y * 0.5 + 0.5) * canvas.height;
  const screenCenterX = canvas.width * 0.5;
  const screenCenterY = canvas.height * 0.5;
  const axisX = screenCenterX - sunScreenX;
  const axisY = screenCenterY - sunScreenY;
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // A. Soft, warm radiant corona around the sun
  const coronaR = Math.min(canvas.width, canvas.height) * 0.42;
  const coronaGrad = ctx.createRadialGradient(sunScreenX, sunScreenY, 0, sunScreenX, sunScreenY, coronaR);
  coronaGrad.addColorStop(0, `rgba(255, 245, 220, ${flareIntensity * 0.55})`);
  coronaGrad.addColorStop(0.25, `rgba(255, 210, 140, ${flareIntensity * 0.28})`);
  coronaGrad.addColorStop(0.55, `rgba(255, 160, 90, ${flareIntensity * 0.10})`);
  coronaGrad.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(sunScreenX, sunScreenY, coronaR, 0, Math.PI * 2);
  ctx.fill();
  
  // B. Gentle anamorphic horizontal streak
  const streakLen = canvas.width * 0.7;
  const streakH = 5;
  const streakGrad = ctx.createLinearGradient(sunScreenX - streakLen, sunScreenY, sunScreenX + streakLen, sunScreenY);
  streakGrad.addColorStop(0, 'rgba(160, 230, 255, 0)');
  streakGrad.addColorStop(0.35, `rgba(200, 240, 255, ${flareIntensity * 0.12})`);
  streakGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flareIntensity * 0.38})`);
  streakGrad.addColorStop(0.65, `rgba(255, 220, 160, ${flareIntensity * 0.12})`);
  streakGrad.addColorStop(1, 'rgba(255, 200, 140, 0)');
  ctx.fillStyle = streakGrad;
  ctx.fillRect(sunScreenX - streakLen, sunScreenY - streakH * 0.5, streakLen * 2, streakH);
  
  // C. Subtle optical flare rings/ghosts along lens optical axis
  const ghosts = [
    { pos: 0.38, r: 16, color: `rgba(180, 220, 255, ${flareIntensity * 0.14})` },
    { pos: 0.72, r: 28, color: `rgba(220, 180, 255, ${flareIntensity * 0.10})` },
    { pos: 1.25, r: 12, color: `rgba(255, 220, 140, ${flareIntensity * 0.12})` },
    { pos: 1.60, r: 40, color: `rgba(140, 240, 220, ${flareIntensity * 0.06})` }
  ];
  for (const g of ghosts) {
    const gx = sunScreenX + axisX * g.pos;
    const gy = sunScreenY + axisY * g.pos;
    const gGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.r);
    gGrad.addColorStop(0, g.color);
    gGrad.addColorStop(0.7, g.color);
    gGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, g.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
window.getFlareIntensity = () => flareIntensity;
window.drawLensFlare = drawLensFlare;

