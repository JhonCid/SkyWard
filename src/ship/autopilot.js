function hasDirectLineOfSight(from, to, planet) {
  if (!planet) return true;
  const d = to.clone().sub(from);
  const len = d.length();
  if (len < 1) return true;
  const dir = d.clone().divideScalar(len);

  // 1. Ray-sphere intersection test against planet terrain body
  const toCenter = planet.center.clone().sub(from);
  const proj = toCenter.dot(dir);
  if (proj > 20 && proj < len - 20) {
    const perp = toCenter.clone().sub(dir.clone().multiplyScalar(proj));
    const blockRadius = planet.r + 40; // Solid terrain horizon block
    if (perp.length() < blockRadius) return false;
  }

  // 2. Surface horizon test ONLY IF destination 'to' is on THIS planet's surface
  const distToPlanet = to.distanceTo(planet.center);
  if (distToPlanet < planet.r + 350) {
    const targetNorm = planetUp(to, planet);
    const toShip = from.clone().sub(to).normalize();
    // If surface normal points away from ship (angle > 84 deg), target is over the horizon!
    if (targetNorm.dot(toShip) < 0.10) return false;
  }

  // 3. Surface horizon test if departure 'from' is on THIS planet's surface
  const distFromPlanet = from.distanceTo(planet.center);
  if (distFromPlanet < planet.r + 50) {
    const shipNorm = planetUp(from, planet);
    if (shipNorm.dot(dir) < 0.05) return false;
  }

  return true;
}
window.hasDirectLineOfSight = hasDirectLineOfSight;

function getSmartAutopilotWaypoint(d, air) {
  const shipPos = ship.position.clone();
  const destPos = d.pos.clone().add(d.p ? planetUp(d.pos, d.p).multiplyScalar(2) : V(0, 2, 0));
  const destPlanet = d.p;
  const nearP = nearest(shipPos);
  const distToNearP = shipPos.distanceTo(nearP.center);
  const nearAtmoH = nearP.atmosphereHeight || 3200;
  const nearSafeOrbitR = nearP.r + nearAtmoH + 900;
  const isNearPlanet = distToNearP < nearP.r + 14000;

  // =========================================================================
  // CASE 1: TARGET IS ON THE SAME PLANET (OR SHIP IS ALREADY AT TARGET PLANET)
  // =========================================================================
  if (destPlanet && (destPlanet === nearP || shipPos.distanceTo(destPlanet.center) < destPlanet.r + 15000)) {
    const p = destPlanet;
    const targetNorm = planetUp(destPos, p);
    const shipNorm = planetUp(shipPos, p);
    const atmoH = p.atmosphereHeight || 3200;
    const safeOrbitR = p.r + atmoH + 900;
    const curAlt = shipPos.distanceTo(p.center) - radius(p, shipNorm);
    const hasLOS = hasDirectLineOfSight(shipPos, destPos, p);

    // If destination is on the far side of the planet (or occluded by horizon/terrain):
    // The ship MUST climb to safe orbit and orbit around the planet until it has line of sight!
    if (!hasLOS) {
      // 1. If currently low in atmosphere or near ground, first ascend radially to safe orbit
      if (curAlt < atmoH + 300) {
        const climbNorm = shipNorm.clone().lerp(targetNorm, 0.15).normalize();
        return p.center.clone().addScaledVector(climbNorm, safeOrbitR);
      }
      // 2. High safe orbital circumnavigation along the great-circle arc
      const angle = shipNorm.angleTo(targetNorm);
      const stepAngle = Math.min(angle, 0.42);
      const stepNorm = shipNorm.clone().lerp(targetNorm, stepAngle / Math.max(0.01, angle)).normalize();
      return p.center.clone().addScaledVector(stepNorm, safeOrbitR);
    }

    // Direct line of sight exists! Transition to controlled atmospheric descent cone:
    if (curAlt > 280) {
      const coneAlt = Math.max(220, Math.min(curAlt * 0.65, safeOrbitR - p.r));
      return destPos.clone().addScaledVector(targetNorm, coneAlt);
    }
    return destPos;
  }

  // =========================================================================
  // CASE 2: TARGET IS OUTSIDE CURRENT PLANET (ANOTHER PLANET, GATE, OR STATION)
  // =========================================================================
  // Check if current nearby planet obstructs the direct line to destination
  if (isNearPlanet) {
    const curAlt = shipPos.distanceTo(nearP.center) - radius(nearP, planetUp(shipPos, nearP));
    const losToDest = hasDirectLineOfSight(shipPos, destPos, nearP);

    if (!losToDest) {
      // Current planet obstructs destination!
      // If still inside atmosphere or near ground, climb radially out to safe orbit first:
      if (curAlt < nearAtmoH + 300) {
        const escNorm = planetUp(shipPos, nearP);
        return nearP.center.clone().addScaledVector(escNorm, nearSafeOrbitR);
      }
      // In orbit: fly along great circle tangent around near planet until clear of the planet's occlusion:
      const directDir = destPos.clone().sub(shipPos).normalize();
      let tangent = directDir.clone().sub(planetUp(shipPos, nearP).multiplyScalar(directDir.dot(planetUp(shipPos, nearP))));
      if (tangent.lengthSq() < 0.01) tangent = planetUp(shipPos, nearP);
      tangent.normalize();

      const stepNorm = planetUp(shipPos, nearP).clone().addScaledVector(tangent, 0.45).normalize();
      return nearP.center.clone().addScaledVector(stepNorm, nearSafeOrbitR);
    }

    // Line of sight to destination is clear! If still deep in atmosphere, climb cleanly out:
    if (curAlt < nearAtmoH + 200) {
      const escNorm = planetUp(shipPos, nearP).clone().lerp(destPos.clone().sub(shipPos).normalize(), 0.35).normalize();
      return nearP.center.clone().addScaledVector(escNorm, nearSafeOrbitR);
    }
  }

  // Check if any intermediate celestial body obstructs the path across deep space
  const lineStart = shipPos.clone();
  const toWp = destPos.clone().sub(lineStart);
  const distToWp = toWp.length();
  if (distToWp > 200) {
    const lineDir = toWp.clone().normalize();
    for (const b of planets) {
      if (b === destPlanet || (nearP && b === nearP)) continue;
      const toCenter = b.center.clone().sub(lineStart);
      const proj = toCenter.dot(lineDir);
      if (proj > 200 && proj < distToWp - 200) {
        const perp = toCenter.clone().sub(lineDir.clone().multiplyScalar(proj));
        const safeRadius = b.r + (b.atmosphereHeight || 3500) + 1400;
        if (perp.length() < safeRadius) {
          let avoidDir = perp.clone().negate().normalize();
          if (avoidDir.lengthSq() < 0.1) avoidDir = UP.clone();
          return b.center.clone().addScaledVector(avoidDir, safeRadius + 800);
        }
      }
    }
  }

  // Flying across space to another planet:
  // If target on the destination planet is on its far side, aim for the near-side orbit entry point
  if (destPlanet && distToWp > destPlanet.r + 2000) {
    const hasLOSAtDest = hasDirectLineOfSight(shipPos, destPos, destPlanet);
    if (!hasLOSAtDest) {
      const destAtmoH = destPlanet.atmosphereHeight || 3200;
      const destSafeOrbitR = destPlanet.r + destAtmoH + 1100;
      const shipToDestP = shipPos.clone().sub(destPlanet.center).normalize();
      return destPlanet.center.clone().addScaledVector(shipToDestP, destSafeOrbitR);
    }
  }

  return destPos;
}
window.getSmartAutopilotWaypoint = getSmartAutopilotWaypoint;

