function applySoftResistance(current, delta, minLimit, maxLimit, bufferZone) {
  if (delta > 0) {
    const distToMax = maxLimit - current;
    if (distToMax <= 0) return 0;
    if (distToMax < bufferZone) {
      const t = distToMax / bufferZone;
      return delta * (t * t);
    }
  } else if (delta < 0) {
    const distToMin = current - minLimit;
    if (distToMin <= 0) return 0;
    if (distToMin < bufferZone) {
      const t = distToMin / bufferZone;
      return delta * (t * t);
    }
  }
  return delta;
}

function lookInput(dx, dy) {
  if (!started || !$('panel').classList.contains('hidden')) return;
  const factor = (touchEnabled ? .0028 : .0018) * controlPrefs.camera;
  if (typeof vehicleCamIdleTime !== 'undefined') vehicleCamIdleTime = 0;
  if (typeof footCamIdleTime !== 'undefined') footCamIdleTime = 0;

  if (mode === 'foot' && typeof thirdPerson !== 'undefined' && thirdPerson && typeof footFreeCam !== 'undefined' && footFreeCam) {
    const rawDYaw = -dx * factor * (aiming ? .48 : 1);
    const rawDPitch = -dy * factor * (aiming ? .48 : 1);
    footOrbitYaw += rawDYaw;
    pitch = THREE.MathUtils.clamp(pitch + rawDPitch, -1.45, 1.45);
    return;
  }

  if (mode === 'rover') {
    if (!roverLookOnly) {
      // === MODO DE DIREÇÃO (STEERING MODE) ===
      // Mouse horizontal movement deflects steering input smoothly and progressively:
      const mouseSteerDelta = -dx * 0.0011;
      roverSteerInput = THREE.MathUtils.clamp(roverSteerInput + mouseSteerDelta, -1.0, 1.0);

      // Animate steering yoke and wheel steer knuckles immediately on mouse input!
      if (rover.userData.steeringWheel) {
        rover.userData.steeringWheel.rotation.z = roverSteerInput * 0.75;
      }
      if (rover.userData.steerKnuckles) {
        for (const k of rover.userData.steerKnuckles) {
          k.obj.rotation.x = 0;
          k.obj.rotation.z = 0;
          k.obj.rotation.y = roverSteerInput * 0.45;
        }
      }

      // Vehicular Ackermann physics: vehicle chassis ONLY rotates when in motion!
      // Clamped to at most 0.055 rad per event to eliminate wild/hyper-fast mouse whipping!
      if (Math.abs(roverLinearSpeed) > 0.1) {
        const speedFrac = Math.min(1.0, Math.max(0.35, Math.abs(roverLinearSpeed) / 2.0));
        const turnDir = roverLinearSpeed >= 0 ? 1 : -1;
        const speedDamping = THREE.MathUtils.clamp(1.0 - (Math.abs(roverLinearSpeed) - 15) / 90, 0.55, 1.0);
        const turnAmount = THREE.MathUtils.clamp(-dx * 0.00130 * speedFrac * turnDir * speedDamping, -0.055, 0.055);
        rover.rotateY(turnAmount);
      }
      pitch = THREE.MathUtils.clamp(pitch - dy * factor, -1.15, 1.15);
      return;
    } else {
      // === MODO LIVRE (FREE CAMERA MODE) ===
      // Moving mouse rotates camera freely around/inside rover without steering the vehicle!
      const rawDYaw = -dx * factor;
      const rawDPitch = -dy * factor;
      if (thirdPerson) {
        yaw += rawDYaw;
        if (typeof vehicleCamYaw !== 'undefined') vehicleCamYaw += rawDYaw;
        pitch = THREE.MathUtils.clamp(pitch + rawDPitch, -1.45, 1.45);
      } else {
        yaw = THREE.MathUtils.clamp(yaw + rawDYaw, -2.4, 2.4);
        pitch = THREE.MathUtils.clamp(pitch + rawDPitch, -0.65, 1.15);
      }
      return;
    }
  }

  if (mode === 'pilot' && !landed && !auto && !boost && !shipLookOnly) {
    steerPixels.x += dy;
    steerPixels.y += dx;
  } else {
    const sensitivity = aiming ? .48 : 1;
    if (resting && resting.kind === 'bed') {
      const isThird = typeof thirdPerson !== 'undefined' && thirdPerson;
      if (isThird) {
        // In 3rd person on bed: camera orbits freely 360 around the bed and avatar!
        yaw += -dx * factor * sensitivity;
        pitch = THREE.MathUtils.clamp(pitch + -dy * factor * sensitivity, -1.45, 1.45);
        return;
      }
      // In 1st person on bed:
      // Limitation backwards (yaw clamped around Math.PI: neck cannot turn backwards through pillow into headboard/wall)
      const rawDYaw = -dx * factor * sensitivity;
      const rawDPitch = -dy * factor * sensitivity;
      yaw = THREE.MathUtils.clamp(yaw + rawDYaw, Math.PI - 1.25, Math.PI + 1.25);
      // Limitation downwards (cannot look down through chest into mattress, but free to look up at ceiling)
      pitch = THREE.MathUtils.clamp(pitch + rawDPitch, -0.35, 1.35);
      return;
    }
    const isSeated = (mode === 'pilot') || (mode === 'rover') || !!resting;
    if (isSeated) {
      // Seated camera rotation: wide range, cannot look completely behind or into lap, with smooth progressive resistance
      const rawDYaw = -dx * factor * sensitivity;
      const rawDPitch = -dy * factor * sensitivity;
      // Expanded cockpit seated look range (wide yaw & deep downward pitch to reach all console buttons)
      const isThird = typeof thirdPerson !== 'undefined' && thirdPerson;
      let dYaw, dPitch;
      if ((mode === 'pilot' || mode === 'rover') && isThird) {
        if (mode === 'rover') {
          if (typeof vehicleCamIdleTime !== 'undefined') vehicleCamIdleTime = 0;
          yaw += rawDYaw;
          if (typeof vehicleCamYaw !== 'undefined') {
            vehicleCamYaw += rawDYaw;
          }
          pitch = THREE.MathUtils.clamp(pitch + rawDPitch, -1.45, 1.45);
          return;
        }
        dYaw = rawDYaw;
        dPitch = rawDPitch;
        yaw += dYaw;
        pitch = THREE.MathUtils.clamp(pitch + dPitch, -1.45, 1.45);
      } else {
        dYaw = applySoftResistance(yaw, rawDYaw, -2.90, 2.90, 0.40);
        dPitch = applySoftResistance(pitch, rawDPitch, -1.35, 1.30, 0.25);
        yaw += dYaw;
        pitch = THREE.MathUtils.clamp(pitch + dPitch, -0.65, 1.15);
      }
    } else {
      yaw -= dx * factor * sensitivity;
      pitch = THREE.MathUtils.clamp(pitch - dy * factor * sensitivity, -1.35, 1.35);
    }
  }
}

let lastMiddleToggle = -1000;
function toggleCockpitCameraLook(e) {
  if (e && e.button !== undefined && e.button !== 1) return;
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  const now = inputNow();
  if (now - lastMiddleToggle < 200) return;
  lastMiddleToggle = now;

  if (mode === 'foot' && typeof thirdPerson !== 'undefined' && thirdPerson) {
    toggleFootFreeCam();
    return;
  }
  if (mode === 'rover') {
    toggleRoverLookMode('middle_mouse');
    return;
  }
  if (mode === 'pilot') {
    toggleShipLookMode('middle_mouse');
    return;
  }
}
window.toggleCockpitCameraLook = toggleCockpitCameraLook;
window.lookInput = lookInput;
window.cockpit3DButtons = cockpit3DButtons;

