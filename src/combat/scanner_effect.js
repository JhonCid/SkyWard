function scannerBeamFX(from, to, color = 0x42f5d7) {
  const dir = to.clone().sub(from);
  const dist = dir.length();
  if (dist < 0.05) return;
  dir.normalize();

  // Cylindrical luminous scanner laser beam (NO bullet projectile!)
  const beamGeo = new THREE.CylinderGeometry(0.024, 0.024, dist, 8);
  const beamMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.position.copy(from).addScaledVector(dir, dist * 0.5);
  beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  beamMesh.userData.noCollision = true;
  scene.add(beamMesh);

  transientFX.push({
    o: beamMesh,
    life: 0.12,
    ttl: 0.12,
    update: (dt, p) => {
      beamMat.opacity = p * 0.85;
    }
  });
}
window.scannerBeamFX = scannerBeamFX;


