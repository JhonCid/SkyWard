function manualFlight(dt, air) {
  const piloting = mode === 'pilot';


  const forward = piloting ? axisForward() : 0;
  // Lift using Space (up) and Ctrl (down)
  const lift = piloting ? ((keys.Space ? 1 : 0) - ((keys.ControlLeft || keys.ControlRight) ? 1 : 0) + touchLift) : 0;
  // Strafe using A (left) and D (right)
  const side = piloting ? axisStrafe() : 0;

  if (landed) {
    manualVelocity.set(0, 0, 0);
    angularVelocity.set(0, 0, 0);
    thrustAcceleration = sideSpeed = liftSpeed = 0;
    shipNavQuaternion.copy(ship.quaternion);
    shipTiltPitch = shipTiltRoll = shipTiltYaw = 0;
    if (!piloting || (forward <= 0.05 && lift <= 0.05)) return;
    // Takeoff lifts ship off ground and automatically begins landing gear retraction!
    if (typeof isRoverOnShipDeck === 'function' && isRoverOnShipDeck()) dockRoverToShip(true);
    landed = false;
    shipLookOnly = false; // Decolagem retorna automaticamente ao controle de voo da nave!
    takeoffGrace = 4.0;
    openRamp(false, false);
    const p = groundPlanet || nearest(ship.position);
    const upDir = p ? planetUp(ship.position, p) : UP.clone().applyQuaternion(ship.quaternion);
    ship.position.addScaledVector(upDir, 6.0);
    liftSpeed = 25.0;
    manualVelocity.addScaledVector(upDir, 25.0);
    yaw = pitch = 0;
  }

  if (!manualWasActive) {
    manualVelocity.copy(shipVelocity);
    if (manualVelocity.length() > 2600) manualVelocity.setLength(2600);
    manualWasActive = true;
    shipNavQuaternion.copy(ship.quaternion);
  }

  const response = [3.2, 4.2, 2.9][shipType];
  const maxAngular = [0.75, 1.05, 0.60][shipType] * controlPrefs.ship;
  const gain = 1 - Math.exp(-dt * response);
  const wanted = V();

  if (piloting) {
    // Allow flight steering in both 1st and 3rd person whenever not in free-look mode
    const allowSteer = !shipLookOnly;
    const mouseSteerX = allowSteer ? -steerPixels.x * 0.002 * controlPrefs.ship / Math.max(dt, 0.008) : 0;
    const mouseSteerY = allowSteer ? -steerPixels.y * 0.002 * controlPrefs.ship / Math.max(dt, 0.008) : 0;
    const keySteerX = (keys.ArrowUp ? maxAngular : 0) - (keys.ArrowDown ? maxAngular : 0);
    const keySteerY = (keys.ArrowLeft ? maxAngular : 0) - (keys.ArrowRight ? maxAngular : 0);
    wanted.x = THREE.MathUtils.clamp(mouseSteerX + keySteerX, -maxAngular, maxAngular);
    wanted.y = THREE.MathUtils.clamp(mouseSteerY + keySteerY, -maxAngular, maxAngular);

    // Roll: Q rolls left (+1), E rolls right (-1)!
    wanted.z = THREE.MathUtils.clamp(touchRoll + (keys.KeyQ ? 1 : 0) - (keys.KeyE ? 1 : 0), -1, 1) * maxAngular;
  }

  steerPixels.set(0, 0, 0);
  angularVelocity.lerp(wanted, gain);

  // Rotate Navigational Heading
  const rotQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(angularVelocity.x * dt, angularVelocity.y * dt, angularVelocity.z * dt, 'YXZ'));
  shipNavQuaternion.multiply(rotQ);

  // === PROCEDURAL VISUAL SHIP TILT ANIMATION ===
  // Bounded, smooth, progressive tilt for Space, Ctrl, A, D and mouse steering
  let targetTiltPitch = 0;
  let targetTiltRoll = 0;
  let targetTiltYaw = 0;

  const maxPitchAngle = 0.25; // ~14.3° (increased limit, was ~8.0°)
  const maxRollAngle = 0.36;  // ~20.6° (increased limit, was ~12.5°)
  const maxYawAngle = 0.08;   // ~4.6°

  if (piloting && !landed) {
    // Space: nose pitches up smoothly
    if (keys.Space) targetTiltPitch += maxPitchAngle;
    // Ctrl: nose pitches down smoothly
    if (keys.ControlLeft || keys.ControlRight) targetTiltPitch -= maxPitchAngle;

    // A: bank left (roll > 0 raises right wing, lowers left wing)
    if (keys.KeyA) { targetTiltRoll += maxRollAngle; targetTiltYaw += maxYawAngle; }
    // D: bank right (roll < 0 raises left wing, lowers right wing)
    if (keys.KeyD) { targetTiltRoll -= maxRollAngle; targetTiltYaw -= maxYawAngle; }

    // Touch steering banking
    if (touchX) {
      targetTiltRoll -= touchX * maxRollAngle;
      targetTiltYaw -= touchX * maxYawAngle;
    }

    // Mouse steering dynamic banking
    if (!shipLookOnly) {
      targetTiltRoll += THREE.MathUtils.clamp(angularVelocity.y * 0.28, -0.20, 0.20);
    }
  }

  // Smooth, non-accelerated progressive organic easing (dt * 3.4 instead of jerky 6.5)
  const tiltEase = 1 - Math.exp(-dt * 3.4);
  shipTiltPitch = THREE.MathUtils.lerp(shipTiltPitch, targetTiltPitch, tiltEase);
  shipTiltRoll = THREE.MathUtils.lerp(shipTiltRoll, targetTiltRoll, tiltEase);
  shipTiltYaw = THREE.MathUtils.lerp(shipTiltYaw, targetTiltYaw, tiltEase);

  if (!auto) {
    const tiltQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(shipTiltPitch, shipTiltYaw, shipTiltRoll, 'YXZ'));
    ship.quaternion.copy(shipNavQuaternion).multiply(tiltQ);
  }

  if (!shipLookOnly && piloting) {
    yaw *= Math.exp(-dt * 3);
    pitch *= Math.exp(-dt * 3);
  }

  const accel = (sprinting() ? 100 : [35, 48, 25][shipType]);
  const targetAcceleration = forward * accel;
  thrustAcceleration = THREE.MathUtils.lerp(thrustAcceleration, targetAcceleration, gain);
  const cap = sprinting() ? 2400 : shipTypes[shipType].speed;

  if (piloting) {
    flightSpeed = THREE.MathUtils.clamp(flightSpeed + thrustAcceleration * dt, -35, Math.max(cap, flightSpeed));
  }
  flightSpeed /= 1 + air.density * 0.004 * Math.abs(flightSpeed) * dt;

  // Faster, more responsive lateral and vertical thrusters (over 3x faster sideSpeed, 2x liftSpeed)
  const damping = 1 / (1 + air.density * 2);
  const thrusterGain = 1 - Math.exp(-dt * (response * 1.6));
  sideSpeed = THREE.MathUtils.lerp(sideSpeed, side * 85 * damping, thrusterGain);
  liftSpeed = THREE.MathUtils.lerp(liftSpeed, lift * 90 * damping, thrusterGain);

  const desired = V(sideSpeed, liftSpeed, -flightSpeed).applyQuaternion(shipNavQuaternion);
  manualVelocity.lerp(desired, 1 - Math.exp(-dt * response));
  ship.position.addScaledVector(manualVelocity, dt);
}
function brakeShip(){autoForward=false;auto=null;flightSpeed=0;thrustAcceleration=0;touchX=touchY=0;toast('Freando.');}

