function updatePlayerCamera(dt){const aboard=mode==='pilot',driving=mode==='rover';let eye,q,up,focus;
if(resting){eye=shipPoint(resting.point);q=ship.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ')));}
else if(aboard){eye=shipPoint(layout().seat.clone().add(V(0,0.72,0.05)));q=ship.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ')));}
else if(driving){
  const p = groundPlanet || nearest(rover.position);
  const planetUpVec = (rover.parent === ship) ? UP.clone().applyQuaternion(ship.quaternion) : planetUp(rover.position, p);
  const baseFrame = (rover.parent === ship) ? ship.quaternion : walkFrame(rover.position, p);
  const isLookOnly = typeof roverLookOnly !== 'undefined' && roverLookOnly;

  const roverHeadingDir = rover.getWorldDirection(new THREE.Vector3()).negate();
  const localRoverDir = roverHeadingDir.applyQuaternion(baseFrame.clone().invert());
  const roverHeadingYaw = Math.atan2(-localRoverDir.x, -localRoverDir.z);

  if (!thirdPerson) {
    eye = rover.localToWorld(V(0, 1.20, 0.10));
    // In 1st person steering mode (!roverLookOnly): locked forward looking out windshield
    // In free camera mode: free look inside cockpit
    const effectiveYaw = isLookOnly ? yaw : 0;
    q = rover.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, effectiveYaw, 0, 'YXZ')));
  } else {
    if (typeof vehicleCamYaw === 'undefined' || isNaN(vehicleCamYaw)) vehicleCamYaw = roverHeadingYaw;
    
    // In steering mode (!roverLookOnly): camera ALWAYS smoothly follows behind rover heading!
    if (!isLookOnly) {
      let diff = Math.atan2(Math.sin(roverHeadingYaw - vehicleCamYaw), Math.cos(roverHeadingYaw - vehicleCamYaw));
      vehicleCamYaw += diff * (1 - Math.exp(-dt * 7.5));
    }
    
    q = baseFrame.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, vehicleCamYaw, 0, 'YXZ')));
    eye = rover.localToWorld(V(0, 1.20, 0.10));
  }
}
else{
  eye=inside?shipPoint(foot):player.clone();
  const baseQ = (inside?ship.quaternion:eva?evaFrame:walkFrame(player,groundPlanet||nearest(player))).clone();
  const effectiveYaw = (thirdPerson && typeof footFreeCam !== 'undefined' && footFreeCam) ? (yaw + footOrbitYaw) : yaw;
  q = baseQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,effectiveYaw,0,'YXZ')));

  // Realistic First-Person Procedural Camera Dynamics
  if (!thirdPerson && !resting) {
    const moveSpeed = Math.hypot(axisForward(), axisStrafe());
    const isSprint = sprinting() && axisForward() > 0.1;

    // A. Locomotion Head Bobbing (rhythmic vertical bounce, lateral sway, and organic roll bank)
    if (onFootGround && moveSpeed > 0.05) {
      const bobFreq = isSprint ? 12.0 : 8.5;
      camBobPhase += dt * bobFreq;
      const bobY = -Math.abs(Math.sin(camBobPhase)) * (isSprint ? 0.046 : 0.022) * moveSpeed;
      const bobX = Math.cos(camBobPhase * 0.5) * (isSprint ? 0.026 : 0.013) * moveSpeed;
      const bobRoll = -Math.cos(camBobPhase * 0.5) * (isSprint ? 0.022 : 0.010) * moveSpeed;
      const bobPitch = Math.sin(camBobPhase) * (isSprint ? 0.014 : 0.006) * moveSpeed;

      eye.add(V(bobX, bobY, 0).applyQuaternion(q));
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(bobPitch, 0, bobRoll, 'YXZ')));
    }

    // B. Jump Lift & Landing Compression Dip
    if (onFootGround && !camWasGrounded) {
      // Impact landing compression
      camLandDip = Math.min(0.14, Math.max(0.04, Math.abs(jumpVelocity) * 0.018));
    }
    camWasGrounded = onFootGround;
    if (camLandDip > 0.001) {
      camLandDip = THREE.MathUtils.lerp(camLandDip, 0, 1 - Math.exp(-dt * 14));
      eye.add(V(0, -camLandDip, 0).applyQuaternion(q));
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-camLandDip * 0.45, 0, 0, 'YXZ')));
    }

    // C. Jetpack Thruster Micro-Rumble
    if (jetActive) {
      const jY = Math.sin(totalTime * 48) * 0.0022;
      const jX = Math.cos(totalTime * 36) * 0.0018;
      const jRoll = Math.sin(totalTime * 55) * 0.0025;
      eye.add(V(jX, jY, 0).applyQuaternion(q));
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, jRoll, 'YXZ')));
    }

    // D. Weapon Reload Kinetic Camera Sway
    if (typeof reloadActive !== 'undefined' && reloadActive) {
      const rp = Math.min(1.0, Math.max(0, (combatTime - reloadStartTime) / reloadDuration));
      let rX = 0, rY = 0, rPitch = 0, rRoll = 0;
      if (rp >= 0.15 && rp < 0.28) {
        // Mag release dip
        const sub = (rp - 0.15) / 0.13;
        rY = -Math.sin(sub * Math.PI) * 0.008;
        rRoll = -Math.sin(sub * Math.PI) * 0.006;
      } else if (rp >= 0.48 && rp < 0.62) {
        // Forceful mag insertion slap
        const sub = (rp - 0.48) / 0.14;
        rY = Math.sin(sub * Math.PI) * 0.012;
        rPitch = Math.sin(sub * Math.PI) * 0.010;
        rRoll = Math.sin(sub * Math.PI) * 0.006;
      } else if (rp >= 0.74 && rp < 0.88) {
        // Slide / bolt rack tug
        const sub = (rp - 0.74) / 0.14;
        rX = -Math.sin(sub * Math.PI) * 0.008;
        rRoll = -Math.sin(sub * Math.PI) * 0.008;
      }
      eye.add(V(rX, rY, 0).applyQuaternion(q));
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rPitch, 0, rRoll, 'YXZ')));
    }

    // E. Melee Attack Kinetic Forward Lunge & Screen Torque
    if (typeof meleeActive !== 'undefined' && meleeActive) {
      const mp = Math.min(1.0, Math.max(0, (combatTime - meleeStartTime) / meleeDuration));
      if (mp >= 0.18 && mp < 0.65) {
        const cut = Math.sin((mp - 0.18) / 0.47 * Math.PI);
        const lungeZ = -0.16 * cut; // explosive forward lunge!
        const lungePitch = -0.045 * cut; // aggressive downward cut angle
        const lungeRoll = (typeof meleeCombo !== 'undefined' && meleeCombo === 0 ? -0.05 : 0.04) * cut;
        eye.add(V(0, 0, lungeZ).applyQuaternion(q));
        q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(lungePitch, 0, lungeRoll, 'YXZ')));
      }
    }
  }
}
// 3-Second Inactivity Auto-Alignment for Free Orbit Cameras
  if (mode === 'rover' && thirdPerson && (typeof roverLookOnly !== 'undefined' && roverLookOnly)) {
    if (Math.abs(roverLinearSpeed) > 0.5) {
      if (typeof vehicleCamIdleTime !== 'undefined') {
        vehicleCamIdleTime += dt;
        if (vehicleCamIdleTime >= 3.0) {
          const p = groundPlanet || nearest(rover.position);
          const baseFrame = (rover.parent === ship) ? ship.quaternion : walkFrame(rover.position, p);
          const travelDir = rover.getWorldDirection(new THREE.Vector3()).negate();
          if (roverLinearSpeed < 0) travelDir.negate();
          const localDir = travelDir.applyQuaternion(baseFrame.clone().invert());
          const targetHeadingYaw = Math.atan2(-localDir.x, -localDir.z);
          let diff = Math.atan2(Math.sin(targetHeadingYaw - vehicleCamYaw), Math.cos(targetHeadingYaw - vehicleCamYaw));
          vehicleCamYaw += diff * (1 - Math.exp(-dt * 2.2));
        }
      }
    } else {
      if (typeof vehicleCamIdleTime !== 'undefined') vehicleCamIdleTime = 0;
    }
  }

  if (mode === 'foot' && thirdPerson && typeof footFreeCam !== 'undefined' && footFreeCam) {
    // In free camera mode, camera orientation is strictly independent and stays wherever the user orbits it
    if (typeof footCamIdleTime !== 'undefined') footCamIdleTime = 0;
  }

  up=UP.clone().applyQuaternion(aboard?ship.quaternion:driving?rover.getWorldQuaternion(new THREE.Quaternion()):inside?ship.quaternion:eva?evaFrame:walkFrame(player,groundPlanet||nearest(player)));
// Smooth zoom interpolation
if (typeof cameraZoomTarget !== 'undefined') {
  cameraZoom[mode] = THREE.MathUtils.lerp(cameraZoom[mode], cameraZoomTarget[mode] || 1, 1 - Math.exp(-dt * 9));
}
if (typeof camTransitionAlpha !== 'undefined') {
  camTransitionAlpha = THREE.MathUtils.lerp(camTransitionAlpha, thirdPerson ? 1 : 0, 1 - Math.exp(-dt * 7));
}

if (camTransitionAlpha > 0.001) {
  if (driving && thirdPerson) {
    const p = groundPlanet || nearest(rover.position);
    const planetUpVec = (rover.parent === ship) ? UP.clone().applyQuaternion(ship.quaternion) : planetUp(rover.position, p);
    const rawFocus = rover.localToWorld(V(0, 0.85, 0));
    // CRITICAL: The camera orbit center in 3rd person must ALWAYS remain anchored directly on the rover chassis!
    // Never lag behind horizontally during high-speed driving. Only smooth vertical terrain bounce.
    if (!smoothRoverCamTarget) {
      smoothRoverCamTarget = rawFocus.clone();
    } else {
      const p = groundPlanet || nearest(rover.position);
      const planetUpVec = (rover.parent === ship) ? UP.clone().applyQuaternion(ship.quaternion) : planetUp(rover.position, p);
      const vertDiff = rawFocus.clone().sub(smoothRoverCamTarget).dot(planetUpVec);
      const smoothVert = THREE.MathUtils.lerp(0, vertDiff, 1 - Math.exp(-dt * 9.0));
      smoothRoverCamTarget.copy(rawFocus).addScaledVector(planetUpVec, smoothVert - vertDiff);
    }
    focus = smoothRoverCamTarget;

    const offsetDist = (cameraZoom[mode] || 1) * 7.0;
    const offsetHeight = 2.4;
    const camLookDir = V(0, 0, -1).applyQuaternion(q);
    const targetChasePos = safeChaseCamera(focus, camLookDir.clone().multiplyScalar(-offsetDist).addScaledVector(planetUpVec, offsetHeight), rover, false);
    const targetChaseLook = focus.clone().addScaledVector(camLookDir, 40);

    if (!thirdPersonCamPos) {
      thirdPersonCamPos = targetChasePos.clone();
      thirdPersonCamLook = targetChaseLook.clone();
    } else {
      thirdPersonCamPos.lerp(targetChasePos, 1 - Math.exp(-dt * 14.0));
      thirdPersonCamLook.lerp(targetChaseLook, 1 - Math.exp(-dt * 18.0));
    }
    // Up vector is strictly aligned with the planet!
    smoothCamUp.copy(planetUpVec);
  } else {
    focus = aboard ? shipPoint(V(0, 2, 0)) : eye.clone().addScaledVector(up, -0.2);
    const offset = V(aboard ? 0 : 0.7, aboard ? 13 : 0.8, aboard ? Math.max(40, layout().halfZ * 2.7) : resting ? 3 : 4.6)
      .multiplyScalar(cameraZoom[mode])
      .applyQuaternion(q);
    const targetChasePos = safeChaseCamera(focus, offset, aboard ? ship : null, aboard);
    const targetChaseLook = focus.clone().add(V(0, 0, aboard ? -100 : -40).applyQuaternion(q));

    if (!thirdPersonCamPos) {
      thirdPersonCamPos = targetChasePos.clone();
      thirdPersonCamLook = targetChaseLook.clone();
    } else {
      thirdPersonCamPos.copy(targetChasePos);
      thirdPersonCamLook.copy(targetChaseLook);
    }
    if (!aboard) {
      smoothCamUp.copy(up);
    } else {
      const targetCamUp = UP.clone().applyQuaternion(q);
      smoothCamUp.lerp(targetCamUp, 1 - Math.exp(-dt * 18.0)).normalize();
    }
  }

  if (camTransitionAlpha >= 0.999) {
    camera.position.copy(thirdPersonCamPos);
    const m4 = new THREE.Matrix4();
    m4.lookAt(thirdPersonCamPos, thirdPersonCamLook, smoothCamUp);
    const targetChaseQ = new THREE.Quaternion().setFromRotationMatrix(m4);
    // Instant rotation response: ZERO delay when turning camera on foot, ship or orbiting rover!
    camera.quaternion.copy(targetChaseQ);
    camera.up.copy(smoothCamUp);
  } else {
    camera.position.lerpVectors(eye, thirdPersonCamPos, camTransitionAlpha);
    const m4 = new THREE.Matrix4();
    m4.lookAt(camera.position, thirdPersonCamLook, smoothCamUp);
    const chaseRot = new THREE.Quaternion().setFromRotationMatrix(m4);
    camera.quaternion.slerpQuaternions(q, chaseRot, camTransitionAlpha);
    camera.up.copy(smoothCamUp);
  }
} else {
  const targetCamUp = UP.clone().applyQuaternion(q);
  smoothCamUp.lerp(targetCamUp, 1 - Math.exp(-dt * 18.0)).normalize();
  camera.quaternion.copy(q);
  camera.position.copy(eye);
  camera.up.copy(smoothCamUp);
  if (thirdPersonCamPos) {
    thirdPersonCamPos.copy(eye);
  }
}
if(avatar){avatar.visible=thirdPerson;if(avatarWeapon)avatarWeapon.visible=thirdPerson&&mode==='foot'&&!resting;avatar.scale.setScalar(1);const rig=avatar.userData.rig;rig.rotation.set(0,0,0);if(aboard||driving){avatar.position.copy(aboard?shipPoint(rig.userData.character?layout().seat.clone():layout().seat.clone().setY(.8)):rover.localToWorld(V(0,-0.22,0.12)));avatar.quaternion.copy(aboard?ship.quaternion:rover.getWorldQuaternion(new THREE.Quaternion()));}else if(resting){
  avatar.position.copy(shipPoint(resting.avatar));
  if(resting.kind==='bed'){
    avatar.quaternion.copy(ship.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.PI));
    rig.rotation.x=Math.PI/2; // Supine: chest and face point upwards (barriga para cima), back rests on mattress
    rig.rotation.y=resting.angle||0;
    for(let s=0;s<2;s++){
      const sideSign=s===0?-1:1;
      if(rig.userData?.limbs?.[s*2]) rig.userData.limbs[s*2].rotation.set(0,0,0);
      if(rig.userData?.knees?.[s]) rig.userData.knees[s].rotation.set(0,0,0);
      if(rig.userData?.limbs?.[s*2+1]) rig.userData.limbs[s*2+1].rotation.set(0,0,sideSign*0.12);
      if(rig.userData?.elbows?.[s]) rig.userData.elbows[s].rotation.set(0,0,0);
    }
  } else {
    avatar.quaternion.copy(ship.quaternion);
    rig.rotation.x=0;
    rig.rotation.y=resting.angle||0;
  }
}else{
  avatar.position.copy(eye).addScaledVector(up,-1.8);
  const base=inside?ship.quaternion:eva?evaFrame:walkFrame(player,groundPlanet||nearest(player));
  let avatarAngle = yaw;
  const isFreeCamInCam = (thirdPerson && typeof footFreeCam !== 'undefined' && footFreeCam);
  const fInCam = typeof axisForward === 'function' ? axisForward() : 0;
  const sInCam = typeof axisStrafe === 'function' ? axisStrafe() : 0;
  const isMovingInCam = Math.hypot(sInCam, fInCam) > 0.05;
  const moveAngleInCam = (typeof footFreeCamMoveAngle !== 'undefined' && footFreeCamMoveAngle !== null) ? footFreeCamMoveAngle : (yaw + (typeof footOrbitYaw !== 'undefined' ? footOrbitYaw : 0));

  if (isFreeCamInCam) {
    if (!aiming&&!firing&&!(avatar?.userData.rig?.userData.character?.aimRequestUntil>combatTime)) {
      if (isMovingInCam) {
        const moveDir = Math.atan2(sInCam, fInCam);
        avatarAngle = moveAngleInCam - moveDir;
        lastFootWalkAngle = avatarAngle;
      } else if (typeof lastFootWalkAngle !== 'undefined' && lastFootWalkAngle !== null) {
        avatarAngle = lastFootWalkAngle;
      }
    } else {
      avatarAngle = yaw + (typeof footOrbitYaw !== 'undefined' ? footOrbitYaw : 0);
      lastFootWalkAngle = avatarAngle;
    }
  }
  avatar.quaternion.copy(base).multiply(new THREE.Quaternion().setFromAxisAngle(UP, avatarAngle));
}animateHuman(rig,dt,aboard||driving||resting?.kind==='bench'||resting?.kind==='bed',!onFootGround&&mode==='foot');}
if(weaponView){if(equipped==='unarmed'){weaponView.visible=(unarmedRaiseBlend>0.005)&&mode==='foot'&&!thirdPerson&&!resting&&$('panel').classList.contains('hidden');}else{weaponView.visible=mode==='foot'&&!thirdPerson&&!resting&&$('panel').classList.contains('hidden');}}$('jetHud').classList.toggle('hidden',mode!=='foot'||eva);$('jetFill').style.width=(jetFuel/jetCapacity()*100)+'%';$('jetText').textContent='JETPACK '+Math.round(jetFuel/jetCapacity()*100)+'%'+(jetActive?' · IMPULSO':'');}
