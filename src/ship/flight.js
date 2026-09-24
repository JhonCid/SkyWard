function flyShip(dt) {
  applyGasGiantFlightDynamics(dt);
  updateLandingGears(dt);
  if (auto || boost) {
    manualWasActive = false;
    angularVelocity.set(0, 0, 0);
    steerPixels.set(0, 0, 0);
  }
  const prev = ship.position.clone();
  gateCooldown = Math.max(0, gateCooldown - dt);

  // Majestic Interstellar Hyper-Jump (13.5s 3-phase journey across deep void)
  if (boost) {
    boost.elapsed += dt;

    // Phase 1: Departure gate acceleration (0s to 2.5s)
    if (boost.elapsed < 2.5) {
      flightSpeed = THREE.MathUtils.lerp(flightSpeed, 4500, dt * 2.5);
      ship.position.addScaledVector(boost.warpDir, flightSpeed * dt);
      $('airState').textContent = 'SALTO INTERESTELAR · HIPERESPAÇO';
      $('gestureState').textContent = 'ACELERAÇÃO DE PARTIDA · ENTRANDO NO VÁCUO';
    }
    // Phase 2: True Interstellar Void Cruise (2.5s to 8.5s)
    else if (boost.elapsed < 8.5) {
      if (!boost.unloadedOld) {
        boost.unloadedOld = true;
        unloadCurrentSystem();
      }
      flightSpeed = 6500;
      const progress = (boost.elapsed - 2.5) / 6.0;
      const lyRemaining = Math.max(0.1, (1 - progress) * boost.lightYears).toFixed(1);
      $('airState').textContent = 'TRÂNSITO INTERESTELAR · ' + lyRemaining + ' AL · SISTEMA ' + boost.targetName;
      $('gestureState').textContent = 'CRUZEIRO EM HIPERESPAÇO · VELOCIDADE DE DOBRA';
    }
    // Phase 3: Destination system emergence and approach (8.5s to 13.5s)
    else {
      if (!boost.loaded) {
        boost.loaded = true;
        boost.loadedAt = boost.elapsed;
        loadSystemInSpace(boost.targetCoord);
        const destGate = gates[boost.targetGateIndex] || gates[0];
        const arrivalDir = destGate.normal.clone().negate();
        boost.arrivalDir = arrivalDir;
        boost.destGate = destGate;
        // Ship emerges 14,000m out in deep space, flying towards arrival gate
        boost.approachStart = destGate.pos.clone().addScaledVector(arrivalDir, -14000);
        boost.approachEnd = destGate.pos.clone().addScaledVector(arrivalDir, (destGate.halfLength || 250) + 800);
        ship.position.copy(boost.approachStart);
        ship.quaternion.setFromUnitVectors(V(0, 0, -1), arrivalDir);
      }

      const travelRemaining = Math.max(0.001, boost.duration - boost.loadedAt);
      const subT = Math.min(1, Math.max(0, (boost.elapsed - boost.loadedAt) / travelRemaining));
      const ease = subT * (2 - subT);
      ship.position.lerpVectors(boost.approachStart, boost.approachEnd, ease);
      ship.quaternion.setFromUnitVectors(V(0, 0, -1), boost.arrivalDir);
      flightSpeed = THREE.MathUtils.lerp(2200, 450, ease);

      $('airState').textContent = 'APROXIMAÇÃO FINAL · SISTEMA ' + currentSystem.name;
      $('gestureState').textContent = 'DESACELERAÇÃO · CRUZANDO ARCO DE CHEGADA';
    }

    if (boost.elapsed >= boost.duration && boost.loaded) {
      const destGate = boost.destGate || gates[0];
      const finalDir = boost.arrivalDir || (destGate ? destGate.normal.clone().negate() : V(0, 0, -1));
      if (destGate) {
        // Seamless exit: continue flying forward into the solar system, aligned towards inner planets
        const exitPos = destGate.pos.clone().addScaledVector(finalDir, (destGate.halfLength || 250) + 800);
        ship.position.copy(exitPos);
        ship.quaternion.setFromUnitVectors(V(0, 0, -1), finalDir);
        shipVelocity.copy(finalDir).multiplyScalar(450);
      }
      boost = null;
      flightSpeed = 450;
      gateCooldown = 15;
      toast('Chegada ao Sistema ' + currentSystem.name + ' · ' + planets.length + ' planetas · ' + gates.length + ' arcos');
    }
    shipVelocity.copy(ship.position).sub(prev).divideScalar(dt);
    ship.updateMatrixWorld(true);
    heat = 0;
    return;
  }

    // Automated cinematic landing sequence execution
  if (landingSequence && landingSequence.active) {
    landingSequence.elapsed += dt;
    const progress = Math.min(1.0, landingSequence.elapsed / landingSequence.duration);
    const ease = THREE.MathUtils.smoothstep(progress, 0, 1);
    const up = landingSequence.p ? planetUp(landingSequence.targetPose.pos, landingSequence.p) : UP;

    // Soft cushioned descent: starts higher and approaches softly
    const hoverAlt = Math.max(0, (1 - ease) * 14);
    const intermediatePos = landingSequence.targetPose.pos.clone().addScaledVector(up, hoverAlt);

    ship.position.lerpVectors(landingSequence.startPos, intermediatePos, ease);
    ship.quaternion.slerpQuaternions(landingSequence.startQ, landingSequence.targetPose.q, ease);
    shipNavQuaternion.copy(ship.quaternion);
    shipTiltPitch = shipTiltRoll = shipTiltYaw = 0;

    manualVelocity.set(0, 0, 0);
    angularVelocity.set(0, 0, 0);
    sideSpeed = 0;
    liftSpeed = 0;
    flightSpeed = THREE.MathUtils.lerp(flightSpeed, 0, 1 - Math.exp(-dt * 6));

    updateLandingGears(dt);

    $('airState').textContent = 'POUSO AUTOMÁTICO · TRENS DE POUSO ATIVOS';
    $('gestureState').textContent = progress < 0.7 ? 'ALINHANDO E DESVIANDO DE OBSTÁCULOS' : 'TOQUE AMORTECIDO NO SOLO';

    if (progress >= 1.0) {
      shipGearSuspension = 1.0; // Trigger suspension spring compression bounce!
      finishLanding(landingSequence.targetPose, landingSequence.p, landingSequence.st);
      toast('Pouso concluído com sucesso.');
    }
    shipVelocity.copy(ship.position).sub(prev).divideScalar(Math.max(.001, dt));
    ship.updateMatrixWorld(true);
    return;
  }
  const air = atmosphereAt(ship.position);
  if (auto) {
    const d = autoDestination(), p = d.p;
    const pose = d.gate ? null : (d._landing?.type === shipType ? d._landing.pose : (d._landing = { type: shipType, pose: landingPose(d.pos, p) }).pose);

    // Smooth, stable Autopilot for Arcos (10 aligned rings corridor)
    if (d.gate) {
      const gate = gates[d.gate - 1];
      if (gate) {
        const axis = gate.normal.clone().normalize();
        const corridorHalf = gate.halfLength || 250;
        const leadIn = gate.pos.clone().addScaledVector(axis, -corridorHalf - 800);

        if (!auto._gatePhase) auto._gatePhase = 'approach';
        const toShip = ship.position.clone().sub(gate.pos);
        const distAlong = toShip.dot(axis);
        const lateralDist = toShip.clone().addScaledVector(axis, -distAlong).length();

        if (auto._gatePhase === 'approach') {
          if (distAlong > -corridorHalf - 600 || ship.position.distanceTo(leadIn) < 380 || (distAlong < 0 && lateralDist < 250)) {
            auto._gatePhase = 'corridor';
          }
        }

        if (auto._gatePhase === 'corridor') {
          const targetQ = new THREE.Quaternion().setFromUnitVectors(V(0, 0, -1), axis);
          ship.quaternion.slerp(targetQ, 1 - Math.exp(-dt * 4.0));
          flightSpeed = THREE.MathUtils.lerp(flightSpeed, 450, 1 - Math.exp(-dt * 3.0));
          const forward = V(0, 0, -1).applyQuaternion(ship.quaternion);
          ship.position.addScaledVector(forward, flightSpeed * dt);

          // Centering guide
          const lateralOffset = toShip.clone().addScaledVector(axis, -distAlong);
          if (lateralOffset.length() > 0.5) {
            ship.position.addScaledVector(lateralOffset.normalize(), -Math.min(lateralOffset.length(), dt * 25));
          }

          if (Math.abs(distAlong) < 80) {
            triggerBoost(gate);
          }
        } else {
          const toLead = leadIn.clone().sub(ship.position);
          const distToLead = toLead.length();
          const targetQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(ship.position, ship.position.clone().add(toLead), UP));
          ship.quaternion.slerp(targetQ, 1 - Math.exp(-dt * 2.5));
          const forward = V(0, 0, -1).applyQuaternion(ship.quaternion);
          const targetSpeed = Math.min(2400, Math.max(80, distToLead * 0.8));
          flightSpeed = THREE.MathUtils.lerp(flightSpeed, targetSpeed, 1 - Math.exp(-dt * 2.5));
          ship.position.addScaledVector(forward, flightSpeed * dt);
        }
      }
    } else {
      let waypoint = getSmartAutopilotWaypoint(d, air);
      if (d.station && Math.hypot(ship.position.x - d.pos.x, ship.position.z - d.pos.z) > 8 && ship.position.distanceTo(d.pos) > 50) waypoint = d.pos.clone().add(V(0, 180, 0));
      const departingStation = destinations.find(x => x.station && ship.position.distanceTo(x.pos) < 130);
      if (departingStation && ship.position.y < departingStation.pos.y + 100 && ship.position.distanceTo(d.pos) > 180) waypoint = ship.position.clone().setY(departingStation.pos.y + 150);

      const hasLOS = p ? hasDirectLineOfSight(ship.position, d.pos, p) : true;
      const distToPad = pose ? ship.position.distanceTo(pose.pos) : Infinity;
      const finalApproach = !!pose && distToPad < 220 && hasLOS;

      const targetPos = finalApproach ? pose.pos : waypoint;
      const toTarget = targetPos.clone().sub(ship.position);
      const dist = toTarget.length();

      if (finalApproach) {
        const up = p ? planetUp(pose.pos, p) : UP, delta = ship.position.clone().sub(pose.pos), alt = delta.dot(up), lateral = delta.clone().addScaledVector(up, -alt).length();
        let landWp = pose.pos.clone();
        if (lateral > 5) {
          landWp.addScaledVector(up, Math.max(25, alt));
        }
        ship.quaternion.slerp(pose.q, 1 - Math.exp(-dt * 4.5));
        shipNavQuaternion.copy(ship.quaternion);
        shipTiltPitch = THREE.MathUtils.lerp(shipTiltPitch, 0, 1 - Math.exp(-dt * 6.0));
        shipTiltRoll = THREE.MathUtils.lerp(shipTiltRoll, 0, 1 - Math.exp(-dt * 6.0));
        shipTiltYaw = THREE.MathUtils.lerp(shipTiltYaw, 0, 1 - Math.exp(-dt * 6.0));

        const landDir = landWp.sub(ship.position);
        const ldd = landDir.length();
        if (ldd > 0.05) {
          flightSpeed = Math.min(14, Math.max(1.2, ldd * 0.75));
          ship.position.addScaledVector(landDir.normalize(), Math.min(ldd, flightSpeed * dt));
        }
        if (dist < 1.2 && ship.quaternion.angleTo(pose.q) < 0.08) {
          finishLanding(pose, p, d.station);
        }
      } else if (dist > 35) {
        const targetQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(ship.position, ship.position.clone().add(toTarget), UP));
        ship.quaternion.slerp(targetQ, 1 - Math.exp(-dt * 2.8));
        const forward = V(0, 0, -1).applyQuaternion(ship.quaternion);
        const limit = air.density > .001 ? Math.sqrt(90 / (.004 * air.density)) : 3000;
        const targetSpeed = Math.min(limit, Math.max(80, dist * 0.75));
        flightSpeed = THREE.MathUtils.lerp(flightSpeed, targetSpeed, 1 - Math.exp(-dt * 3));
        ship.position.addScaledVector(forward, flightSpeed * dt);
      } else {
        // Intermediate waypoint passed: maintain speed smoothly along flight path
        const forward = V(0, 0, -1).applyQuaternion(ship.quaternion);
        ship.position.addScaledVector(forward, flightSpeed * dt);
      }
    }
  } else manualFlight(dt, air);

  if (!landed) {
    const hit = flightObstacle(prev, ship.position);
    if (hit) {
      ship.position.copy(hit);
      manualVelocity.set(0, 0, 0);
      flightSpeed = 0;
      auto = null;
      toast('Obstáculo detectado. Frenagem de emergência.');
    }
    if (takeoffGrace > 0) takeoffGrace -= dt;
    if (takeoffGrace <= 0 && !landingSequence) {
      const p = nearest(ship.position), n = ship.position.clone().sub(p.center).normalize();
      const groundAlt = radius(p, n);
      const curDist = ship.position.distanceTo(p.center);
      const h = curDist - groundAlt;
      const vertSpeed = shipVelocity.dot(n);
      if (h < 0.4) {
        ship.position.copy(p.center).addScaledVector(n, groundAlt + 0.4);
        if (vertSpeed < 0) {
          shipVelocity.addScaledVector(n, -vertSpeed);
          manualVelocity.y = Math.max(0, manualVelocity.y);
        }
        if (h < 1.0 && (vertSpeed < -1.5 || flightSpeed < 35)) {
          finishLanding(landingPose(ship.position, p), p, null);
        }
      } else if (h < 1.0 && vertSpeed < -2.0) {
        finishLanding(landingPose(ship.position, p), p, null);
      }
    }
    for (const g of gates) if (gateCooldown === 0 && crossesGate(prev, ship.position, g)) {
      triggerBoost(g);
      break;
    }
  }
  heat = THREE.MathUtils.lerp(heat, Math.min(1, air.density * Math.pow(Math.abs(flightSpeed) / 400, 2)), Math.min(1, dt * 2));
  shipVelocity.copy(ship.position).sub(prev).divideScalar(Math.max(.001, dt));
  ship.updateMatrixWorld(true);
}

