
function getGrenadeOriginAndVelocity() {
  const dirCam = V(0, 0, -1).applyQuaternion(camera.quaternion);
  const basePos = inside ? shipPoint(foot) : player.clone();
  const p = groundPlanet || nearest(basePos);
  const upVector = (inside ? UP.clone().applyQuaternion(ship.quaternion) : planetUp(basePos, p)).normalize();

  // Grenade release point: originates directly from the character's hand in world space
  let from = null;
  if (thirdPerson && avatar && avatar.visible) {
    const rig = avatar.userData?.rig;
    const rightElbow = rig?.userData?.human?.elbows?.[1];
    if (avatarWeapon && avatarWeapon.visible) {
      avatarWeapon.updateMatrixWorld(true);
      from = avatarWeapon.getWorldPosition(new THREE.Vector3());
    } else if (rightElbow) {
      rightElbow.updateMatrixWorld(true);
      // Hand palm position in rightElbow local coordinates
      from = rightElbow.localToWorld(new THREE.Vector3(0, -0.285, 0.015));
    }
  } else if (!thirdPerson && weaponView) {
    weaponView.updateMatrixWorld(true);
    from = weaponView.getWorldPosition(new THREE.Vector3());
  }
  if (!from) {
    const rightVector = V().crossVectors(dirCam, upVector).normalize();
    from = basePos.clone()
      .addScaledVector(upVector, 1.40)
      .addScaledVector(dirCam, 0.35)
      .addScaledVector(rightVector, 0.25);
  }

  // Crosshair aim point in 3D world space
  const endPoint = camera.position.clone().addScaledVector(dirCam, 160);
  let hitDist = 160;
  const obst = obstacleDistance(camera.position, endPoint, null);
  if (obst < hitDist) hitDist = obst;
  for (const e of enemies) {
    if (!e.alive) continue;
    const hit = segmentHit(camera.position, endPoint, enemyCenter(e), e.flying ? 7 : e.beast ? 1.4 : 0.85);
    if (hit !== null && hit < hitDist) hitDist = hit;
  }
  const target = camera.position.clone().addScaledVector(dirCam, hitDist);

  // Direction from hand to target point in world space
  const throwDir = target.clone().sub(from).normalize();
  const upDir = planetUp(from, p);
  const throwVel = throwDir.clone().multiplyScalar(22.0).addScaledVector(upDir, 6.0);

  return { from, throwVel, p, upDir };
}

