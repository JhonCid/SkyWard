function updateCelestialOrbits(dt) {
  for (const p of planets) {
    if (!p) continue;

    // 1. Planetary Spin around polar axis
    if (p.globe) {
      p.spinAngle = (p.spinAngle || 0) + dt * (p.rotSpeed || 0.0004);
      p.globe.rotation.y = p.spinAngle;
      if (p.cloud) p.cloud.rotation.y = p.spinAngle * 1.15;
    }

    // 2. Moons orbiting their parent planet
    if (p.isMoon && p.parentPlanet) {
      p.moonAngle = (p.moonAngle || 0) + dt * (p.moonOrbitSpeed || 0.0025);
      p.center.copy(p.parentPlanet.center).add(
        V(Math.cos(p.moonAngle) * p.moonOrbitRadius, Math.sin(p.moonAngle * 0.7) * 400, Math.sin(p.moonAngle) * p.moonOrbitRadius)
      );
      if (p.globe) p.globe.position.copy(p.center);
      if (p.atmosphere) p.atmosphere.position.copy(p.center);
    }
  }
}
window.updateCelestialOrbits = updateCelestialOrbits;


