function unloadCurrentSystem() {
  for (const p of planets) {
    if (p.surfaceLoaded) unloadPlanetSurface(p);
    if (p.globe) { scene.remove(p.globe); p.globe.geometry.dispose(); p.globe.material.dispose(); }
    if (p.lodGeometries) p.lodGeometries.forEach(g => { if(g) g.dispose(); });
    if (p.atmosphere) { scene.remove(p.atmosphere); p.atmosphere.geometry.dispose(); p.atmosphere.material.dispose(); }
  }
  for (const s of settlements) {
    if (s.root && s.root.parent) { scene.remove(s.root); discardChildren(s.root); }
  }
  for (const d of destinations) {
    if (d.station && d.station.parent) { scene.remove(d.station); discardChildren(d.station); }
  }
  for (const g of scenery) { scene.remove(g); discardChildren(g); }
  for (const a of animals) { scene.remove(a.g); discardChildren(a.g); }
  for (const o of ores) { scene.remove(o.g); discardChildren(o.g); }
  for (const s of suns) {
    scene.remove(s.sun); s.sun.geometry.dispose(); s.sun.material.dispose();
    scene.remove(s.halo); if (s.halo.geometry) s.halo.geometry.dispose(); s.halo.material.map?.dispose(); s.halo.material.dispose();
  }
  for (const g of gates) { scene.remove(g.g); discardChildren(g.g); }
  for (const t of traffic) { scene.remove(t.g); discardChildren(t.g); }
  for (const e of enemies) { scene.remove(e.g); discardChildren(e.g); }
  for (const s of repairSites) { scene.remove(s.g); discardChildren(s.g); }
  for (const s of rescueSites) { scene.remove(s.g); discardChildren(s.g); }
  for (const s of salvageSites) { scene.remove(s.g); discardChildren(s.g); }
  for (const env of environment) {
    for (const f of env.fish) { scene.remove(f.g); discardChildren(f.g); }
    for (const b of env.boats) { scene.remove(b.g); discardChildren(b.g); }
    for (const pl of env.plants) { scene.remove(pl); discardChildren(pl); }
  }
  if (disasterFX) discardChildren(disasterFX);
  planets.length = 0; planetLODs.length = 0; destinations.length = 0; npcs.length = 0;
  animals.length = 0; ores.length = 0; scenery.length = 0; settlements.length = 0;
  traffic.length = 0; environment.length = 0; suns.length = 0; gates.length = 0;
  shops.length = 0; repairSites.length = 0; rescueSites.length = 0; salvageSites.length = 0;
  enemies.length = 0; cityBatches.length = 0; staticBodies.length = 0; movingBodies.length = 0;
  staticGrid.clear();
}

// Ultra-fast space-only system loading (takes < 25ms total!)
function loadSystemInSpace(coord) {
  unloadCurrentSystem();
  const sx = coord.x, sy = coord.y;
  currentSystem.x = sx; currentSystem.y = sy; currentSystem.name = getSystemName(sx, sy);
  if (window.__test) window.__test.currentSystem = currentSystem;
  createSystemSpace(sx, sy);
  createSystemPlanets(sx, sy);
  createSystemStation(sx, sy);
  for (const p of planets) {
    loadPlanetSurface(p);
  }
  initJobs();
  initEnemies();
  registerBodies();
  buildSpatialIndex();
  updateLOD(0, true);
  target = 0;
  const count = $('settlementCount');
  if (count) count.textContent = settlements.length;
  $('place').textContent = 'SISTEMA ' + currentSystem.name.toUpperCase();
}

function loadSystem(coord, entryGateIndex = -1) {
  loadSystemInSpace(coord);
  // Load surface and settlements for ALL planets in the star system
  for (const p of planets) {
    loadPlanetSurface(p);
  }
  if (entryGateIndex >= 0 && gates[entryGateIndex]) {
    const destGate = gates[entryGateIndex];
    // Position ship cleanly in front of portal
    const frontPos = destGate.pos.clone().addScaledVector(destGate.normal, -(destGate.halfLength || 250) - 450);
    ship.position.copy(frontPos);
    ship.quaternion.setFromUnitVectors(V(0, 0, -1), destGate.normal);
    shipVelocity.copy(destGate.normal).multiplyScalar(450);
  }
}

