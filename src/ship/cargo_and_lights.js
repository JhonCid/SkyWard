function updatePhysicalCargoHold() {
  if (shipCargoGroup) {
    discardChildren(shipCargoGroup);
  }
}
window.updatePhysicalCargoHold = updatePhysicalCargoHold;

function mountShipHeadlights() {
  const l = layout();
  if (typeof shipExteriorLights !== 'undefined') shipExteriorLights.length = 0;

  // Single powerful headlight mounted strictly on the lower front (ventral chin) of the ship
  // Positioned low and forward of the cockpit so ZERO light leaks into the cabin
  const noseZ = l.atlas ? -44.5 : l.cockpit.z - 3.2;
  const noseY = 0.22;
  const noseX = 0;

  // Projector lens material (high-intensity glowing beacon when active)
  const headlightLensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xd8f5ff,
    emissiveIntensity: shipHeadlightsActive ? 2.8 : 0.05,
    roughness: 0.15,
    metalness: 0.25
  });

  // Ventral housing on the lower front nose
  box(ship, noseX, noseY, noseZ + 0.22, 0.95, 0.46, 0.55, 0x19232b);
  // High-intensity glass projector lens
  const lens = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16), headlightLensMat, ship, noseX, noseY, noseZ);
  lens.rotation.x = Math.PI / 2;
  lens.name = 'headlightLens';

  // Primary long-range external projection spotlight (zero interior light leak)
  shipHeadlightL = new THREE.SpotLight(0xe8f4ff, shipHeadlightsActive ? 5.5 : 0, 950, Math.PI / 5, 0.40, 1.2);
  shipHeadlightL.position.set(noseX, noseY, noseZ - 0.2);
  const targetObj = new THREE.Object3D();
  targetObj.position.set(noseX, noseY - 2.0, noseZ - 80);
  ship.add(shipHeadlightL);
  ship.add(targetObj);
  shipHeadlightL.target = targetObj;
  shipHeadlightR = null;
}
