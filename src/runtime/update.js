function update(dt){inputTick(dt);totalTime+=dt;if(!started)return;const paused=!$('panel').classList.contains('hidden');if(!paused){tickInteriors(dt,false);flyShip(dt);updateCitizens(dt,false);refreshMovingBodies();if(mode==='foot'){updateFootV05(dt);
}else if(mode==='rover'){
  const f=axisForward(), keySteer=(-axisStrafe());
  if (Math.abs(keySteer) > 0.05) {
    roverSteerInput = keySteer;
  } else {
    // Mouse steer re-centers progressively without runaway spinning
    roverSteerInput = THREE.MathUtils.lerp(roverSteerInput, 0, 1 - Math.exp(-dt * 14.0));
    if (Math.abs(roverSteerInput) < 0.002) roverSteerInput = 0;
  }
  const steer = roverSteerInput;

  // Dynamic steering yoke (volante) & wheel turning (pneus) animations in both 1st and 3rd person!
  if (rover.userData.steeringWheel) {
    const targetYokeAngle = steer * 0.75;
    rover.userData.steeringWheel.rotation.z = THREE.MathUtils.lerp(rover.userData.steeringWheel.rotation.z, targetYokeAngle, 1 - Math.exp(-dt * 14));
  }
  if (rover.userData.steerKnuckles) {
    const targetKnuckleAngle = steer * 0.45;
    for (const k of rover.userData.steerKnuckles) {
      k.obj.rotation.x = 0;
      k.obj.rotation.z = 0;
      k.obj.rotation.y = THREE.MathUtils.lerp(k.obj.rotation.y, targetKnuckleAngle, 1 - Math.exp(-dt * 14));
    }
  }

  // Terrestrial vehicles only turn their body when moving forward or reverse (Ackermann kinematics)
  // When stopped (linear speed == 0), body does NOT turn!
  const speedFrac = Math.min(1.0, Math.max(0.42, Math.abs(roverLinearSpeed) / 1.8));
  const turnDir = roverLinearSpeed >= 0 ? 1 : -1;
  const speedDamping = THREE.MathUtils.clamp(1.0 - (Math.abs(roverLinearSpeed) - 15) / 75, 0.50, 1.0);
  // Base turn rate increased to 2.50 rad/s (~143 deg/sec) so A and D steering is fast, agile and responsive!
  const turn = steer * dt * 2.50 * speedFrac * turnDir * speedDamping;
  rover.rotateY(turn);

  if(roverAir){
    rover.position.addScaledVector(roverVelocity,dt);
    const p=nearest(rover.position),n=rover.position.clone().sub(p.center).normalize(),alt=rover.position.distanceTo(p.center)-radius(p,n);
    if(alt<ATMOSPHERE)roverVelocity.addScaledVector(n,-7*dt);
    if(alt<0.35){
      roverAir=false;
      groundPlanet=p;
      station=null;
      rover.position.copy(surfacePoint(rover.position,p,0.29));
      rover.quaternion.copy(frameAt(rover.position,p.center));
    }
  }else{
    const onboard=rover.parent===ship,
          p=(onboard?groundPlanet:null)||nearest(rover.getWorldPosition(V())),
          up=onboard?UP.clone().applyQuaternion(ship.quaternion):UP.clone().applyQuaternion(walkFrame(rover.getWorldPosition(V()),p)),
          q=rover.getWorldQuaternion(new THREE.Quaternion()),
          driveSpeed=aquaticDriveSpeed();

    // Heavy planetary vehicle inertia: gradual traction buildup that prevents sudden 19G launches
    if (f > 0.05) {
      const maxFwd = driveSpeed * f;
      if (onboard) {
        roverLinearSpeed = THREE.MathUtils.lerp(roverLinearSpeed, maxFwd, 1 - Math.exp(-dt * 4.0));
      } else {
        const progress = Math.min(1.0, Math.max(0, roverLinearSpeed / Math.max(1, maxFwd)));
        const rate = 0.70 + progress * 0.90;
        roverLinearSpeed = THREE.MathUtils.lerp(roverLinearSpeed, maxFwd, 1 - Math.exp(-dt * rate));
      }
    } else if (f < -0.05) {
      if (roverLinearSpeed > 0.8) {
        // Active braking while moving forward
        const brakeRate = 5.0;
        roverLinearSpeed = THREE.MathUtils.lerp(roverLinearSpeed, 0, 1 - Math.exp(-dt * brakeRate));
      } else {
        // Reverse acceleration
        const maxRev = -Math.min(22, driveSpeed * 0.35) * Math.abs(f);
        const revRate = 2.8;
        roverLinearSpeed = THREE.MathUtils.lerp(roverLinearSpeed, maxRev, 1 - Math.exp(-dt * revRate));
      }
    } else {
      // Natural rolling resistance / coasting deceleration
      const coastRate = onboard ? 4.0 : 1.8;
      roverLinearSpeed = THREE.MathUtils.lerp(roverLinearSpeed, 0, 1 - Math.exp(-dt * coastRate));
      if (Math.abs(roverLinearSpeed) < 0.08) roverLinearSpeed = 0;
    }

    const delta = V(0, 0, -roverLinearSpeed * dt).applyQuaternion(q);

    // Dynamic wheel roll animation matching actual physical rolling speed
    if (rover.userData.wheelRollers) {
      const rollDelta = (-roverLinearSpeed * dt) / 0.42;
      for (const roller of rover.userData.wheelRollers) {
        roller.rotation.x += rollDelta;
      }
    }

    if(onboard){
      const origin=rover.position.clone();
      const next=origin.clone().add(delta.applyQuaternion(ship.quaternion.clone().invert()));
      if(layout().atlas){atlasRoverMove(next,origin);}else{
      rover.position.copy(next);
      const rel=rover.position.clone().sub(layout().entry);
      const rampDist = rel.dot(layout().normal);

      const curEuler = new THREE.Euler().setFromQuaternion(rover.quaternion, 'YXZ');

      // Realistic physical ramp descent & climb: rover pitches along the ramp slope
      if (rampDist > 0.2) {
        const rampProgress = Math.min(1, rampDist / 7.0);
        rover.position.y = THREE.MathUtils.lerp(0.33, -1.52, rampProgress);
        const fwdLocal = new THREE.Vector3(0, 0, -1).applyEuler(curEuler);
        const rampPitch = -fwdLocal.dot(layout().normal) * 0.22;
        rover.quaternion.setFromEuler(new THREE.Euler(rampPitch, curEuler.y, 0, 'YXZ'));
      } else {
        rover.position.y = 0.33;
        rover.quaternion.setFromEuler(new THREE.Euler(0, curEuler.y, 0, 'YXZ'));
      }

      // Keep rover clamped within garage / ramp bounds
      const l = layout();
      rover.position.x = THREE.MathUtils.clamp(rover.position.x, -l.halfX + 1.6, l.halfX - 1.6);
      rover.position.z = THREE.MathUtils.clamp(rover.position.z, l.cockpit.z + 5.0, l.entry.z + 6.9);

      // Seamless ramp exit: rover drives all the way down the 7.2m ramp to ground level before detaching
      if(rampOpen && inDoor(rover.position) && rampDist >= 6.8){
        scene.attach(rover);
        inside=false;
        roverAir=false;
        roverVelocity.set(0, 0, 0);
        toast('Veículo fora da nave. B perto da entrada para embarcar.');
      }
      }
    }else{
      // Check if rover has driven up the ramp and into the ship garage
      const localRover = ship.worldToLocal(rover.position.clone());
      const relRover = localRover.clone().sub(layout().entry);
      const rampD = relRover.dot(layout().normal);
      const atlasOnRamp=layout().atlas&&rampD>=-.2&&rampD<ATLAS.rampRun-.8&&Math.abs(localRover.x)<layout().doorHalf-1.12&&Math.abs(localRover.y-(ATLAS.deckY-Math.max(0,rampD)*Math.tan(atlasRampSlope())))<.8;
      if(rampOpen && (layout().atlas?atlasOnRamp:(inDoor(localRover, 1.0) && rampD < 0.5 && rampD > -2.0 && localRover.y > -1.5 && localRover.y < 3.0))){
        dockRoverToShip(true);
        inside=true;
        toast('Veículo a bordo da nave.');
        return; // CRITICAL: Stop here! Do NOT let ground physics lerp rover.position with world coordinates!
      }
      // ROVER ON PLANET GROUND: Physics simulation matching terrain slope, hills, ramps and bumps!
      const intendedPos=rover.position.clone().add(delta);

      // 4-wheel ground contact sampling
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(rover.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rover.quaternion);
      const frontPos = intendedPos.clone().addScaledVector(fwd, 1.25);
      const rearPos = intendedPos.clone().addScaledVector(fwd, -1.25);
      const leftPos = intendedPos.clone().addScaledVector(right, -0.85);
      const rightPos = intendedPos.clone().addScaledVector(right, 0.85);

      const hF = floorProbe(frontPos.clone().addScaledVector(up, 1.5), up, p, layout().atlas?0:0.38, 6.0, rover) || (p ? surfacePoint(frontPos, p, 0.38) : frontPos);
      const hR = floorProbe(rearPos.clone().addScaledVector(up, 1.5), up, p, layout().atlas?0:0.38, 6.0, rover) || (p ? surfacePoint(rearPos, p, 0.38) : rearPos);
      const hL = floorProbe(leftPos.clone().addScaledVector(up, 1.5), up, p, layout().atlas?0:0.38, 6.0, rover) || (p ? surfacePoint(leftPos, p, 0.38) : leftPos);
      const hRt = floorProbe(rightPos.clone().addScaledVector(up, 1.5), up, p, layout().atlas?0:0.38, 6.0, rover) || (p ? surfacePoint(rightPos, p, 0.38) : rightPos);

      // Surface terrain slope vectors
      const groundFwd = hF.clone().sub(hR);
      const groundRight = hRt.clone().sub(hL);

      if (groundFwd.lengthSq() > 0.01 && groundRight.lengthSq() > 0.01) {
        groundFwd.normalize();
        groundRight.normalize();
        let groundNorm = new THREE.Vector3().crossVectors(groundRight, groundFwd).normalize();
        if (groundNorm.dot(up) < 0) groundNorm.negate();

        // Smoothly align vehicle pitch and roll with the terrain incline!
        const targetMat = new THREE.Matrix4().makeBasis(groundRight, groundNorm, groundFwd.clone().negate());
        const targetQ = new THREE.Quaternion().setFromRotationMatrix(targetMat);
        rover.quaternion.slerp(targetQ, 1 - Math.exp(-dt * 14));
      }

      // Center chassis elevation with suspension damping
      const targetCenter = hF.clone().add(hR).add(hL).add(hRt).multiplyScalar(0.25);
      rover.position.lerp(targetCenter, 1 - Math.exp(-dt * 20));
    }
  }
}}
updatePlayerCamera(dt);
if (target && typeof target === 'object' && target.type === 'planetCore' && target.p) {
  const pDist = controlledPosition().distanceTo(target.p.center);
  const atmoLimit = target.p.r + (target.p.atmosphereHeight || 3200);
  if (pDist <= atmoLimit) {
    target = -1;
  }
}
const {p,alt,density}=updateSky(dt);$('place').textContent=alt<ATMOSPHERE?p.def[0]+' / '+p.def[1+biome(camera.position.clone().sub(p.center).normalize(),p.i)]:'SISTEMA ' + (currentSystem.name || 'ÉOS').toUpperCase();$('state').textContent=boost?'IMPULSO INTERSISTEMAS':mode==='pilot'?(auto?'PILOTO AUTOMÁTICO':landed?'POUSADO':'VOO MANUAL'):mode==='rover'?'VEÍCULO TERRESTRE':inside?'INTERIOR DA NAVE':eva?'EVA':'EXPLORAÇÃO A PÉ';$('speed').textContent=Math.abs(mode==='rover'?roverLinearSpeed:flightSpeed).toFixed(0);$('alt').textContent=Math.max(0,alt).toFixed(0);$('credits').textContent=credits.toLocaleString('pt-BR');$('objective').textContent=mission?mission.label+(mission.type==='scan'?' · '+mission.seen.length+'/2':mission.type==='repair'||mission.type==='salvage'?' · '+mission.done.length+'/'+(mission.type==='repair'?3:2):''):'';$('shipname').textContent=shipTypes[shipType].name;$('cargo').textContent=cargo+'/'+shipTypes[shipType].cap+' · '+(rover.parent===ship?'VEÍCULO A BORDO':'VEÍCULO EM SOLO');if($('toast')){$('toast').style.display='none';$('toast').style.opacity='0';}$('airState').textContent=boost?'TRÂNSITO · '+Math.max(0,6-boost.elapsed).toFixed(1)+' s':density>.005?'ATMOSFERA · DENSIDADE '+Math.round(density*100)+'% · ARRASTO ATIVO':'VÁCUO · SEM ARRASTO';const dist=(inside?shipPoint(foot):player).distanceTo(entryWorld());$('boardHint').textContent=mode==='pilot'?(landed?'Levantar da cadeira':'Pilotagem manual'):inside?(foot.distanceTo(layout().entry)<4?'Descer rampa':'Caminhar pelo interior'):dist<12?'Subir rampa da nave':'';updateGuide();updateCockpitRaycast();updateAudio(dt,paused);updateFlightFx(dt);for(const a of animals)a.g.visible=camera.position.distanceTo(a.g.position)<3500;v04Tick(dt,paused);v05Tick(dt,paused);updateSurfaceStreaming(controlledPosition());inputAfterTick();environmentTick(dt,paused);if(paused)tickInteriors(0,true);}


