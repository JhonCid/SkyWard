function legacyPerson(parent,x,z,c,seed){const random=rng(seed===undefined?++humanSerial*8917:seed),female=random()<.5,fat=random(),muscle=random(),height=1.58+random()*.36,skin=[0xe1b896,0xbf8c66,0x8b5b43,0x593d32,0xd6ac86][Math.floor(random()*5)],hair=[0x211d1b,0x523625,0xa67c42,0xd4b989,0x77716c][Math.floor(random()*5)],style=Math.floor(random()*5),coat=random()<.32,shoulder=(female?.215:.24)+muscle*.04+fat*.025,hip=(female?.19:.16)+fat*.035,waist=.125+fat*.07;const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(height/1.78);g.userData.actor=true;parent.add(g);const pelvis=new THREE.Group();pelvis.position.y=.87;g.add(pelvis);bodyLoft(pelvis,[[-.12,hip*.8,.115],[0,hip,.14],[.15,waist,.12]],0x354451);const torso=new THREE.Group();torso.position.y=.95;g.add(torso);const fabric=new THREE.Color(c).offsetHSL((random()-.5)*.06,(random()-.5)*.15,(random()-.5)*.12).getHex();bodyLoft(torso,[[0,waist,.13],[.12,waist,.115+fat*.045],[.29,shoulder*.87,.14+(female?.025:0)+muscle*.025],[.43,shoulder,.125],[.49,.09,.08]],fabric);if(coat)bodyLoft(pelvis,[[-.18,hip*1.17,.16],[.06,waist*1.16,.15],[.17,waist*1.12,.13]],fabric);bodyLoft(torso,[[.48,.061,.06],[.56,.063,.06]],skin,10);const head=new THREE.Group();head.position.y=1.51;g.add(head);bodyLoft(head,[[0,.055,.065],[.035,.08,.078,-.009],[.10,.095,.086],[.17,.092,.086,.007],[.23,.067,.065,.01],[.255,.008,.01,.01]],skin,16);for(const side of [-1,1])ellipsoid(head,side*.095,.12,.006,.019,.032,.014,skin,1);if(style!==0){const cap=mesh(new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.57),hair,head,0,.145,.012);cap.scale.set(.104,.118,.096);if(style>=2)ellipsoid(head,0,.095,.06,.102,.10,.05,hair,2);if(style===3)ellipsoid(head,0,.105,.115,.06,.065,.065,hair,2);if(style===4)ellipsoid(head,0,-.035,.075,.105,.16,.055,hair,2);}
const limbs=[],knees=[],elbows=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*hip*.64,.87,0);g.add(leg);bodyLoft(leg,[[0,.098+fat*.02,.105],[-.16,.09+muscle*.015,.088],[-.38,.061,.065]],0x354451);const knee=new THREE.Group();knee.position.y=-.38;leg.add(knee);bodyLoft(knee,[[0,.062,.068],[-.10,.071+muscle*.012,.072],[-.32,.041,.045],[-.38,.045,.046]],0x354451);ellipsoid(knee,0,-.405,-.055,.065,.055,.14,0x27333d,2);const arm=new THREE.Group();arm.position.set(side*shoulder,1.37,0);g.add(arm);ellipsoid(arm,0,0,0,.09+muscle*.013,.10,.093,fabric,2);bodyLoft(arm,[[0,.072+muscle*.016,.078],[-.13,.071+muscle*.015,.074],[-.28,.049,.047]],fabric);const elbow=new THREE.Group();elbow.position.y=-.28;arm.add(elbow);bodyLoft(elbow,[[0,.048,.048],[-.12,.047,.05],[-.245,.03,.036]],coat?fabric:skin);ellipsoid(elbow,0,-.29,-.01,.039,.061,.026,skin,2);ellipsoid(elbow,side*-.035,-.27,-.015,.017,.035,.02,skin,1);arm.rotation.z=side*.06;limbs.push(leg,arm);knees.push(knee);elbows.push(elbow);}g.userData.limbs=limbs;g.userData.human={seed:seed??humanSerial,female,fat,muscle,height,style,torso,head,pelvis,knees,elbows,phase:random()*6,speed:0,last:null};mergeHumanParts(g);return g;}
function legacyAnimateHuman(g, dt, seated = false, airborne = false) {
  const r = g.userData.human;
  if (!r) return;

  const isPlayerAvatar = (g === avatar || (typeof avatar !== 'undefined' && avatar && avatar.userData?.rig === g));
  let speed = 0;
  if (isPlayerAvatar && typeof inside !== 'undefined' && inside) {
    // Inside ship: measure speed strictly from player locomotion input (zero phantom walking during ship flight!)
    const moveInput = Math.hypot(typeof axisForward === 'function' ? axisForward() : 0, typeof axisStrafe === 'function' ? axisStrafe() : 0);
    speed = moveInput > 0.05 ? ((typeof sprinting === 'function' && sprinting()) ? 7.2 : 3.6) : 0;
  } else {
    const pos = g.getWorldPosition(V());
    speed = r.last ? Math.min(12, pos.distanceTo(r.last) / Math.max(dt, 0.001)) : 0;
    r.last = pos;
    if (speed > 8 && mode !== 'foot') speed = 0;
  }

  r.speed = THREE.MathUtils.lerp(r.speed, speed, 1 - Math.exp(-dt * 8));

  // Determine state
  const isSwimming = isPlayerAvatar && (typeof waterMovement === 'function') && (typeof groundPlanet !== 'undefined' && groundPlanet && groundPlanet.water && g.getWorldPosition(V()).distanceTo(groundPlanet.center) < seaRadius(groundPlanet));
  const isJet = isPlayerAvatar && (typeof jetActive !== 'undefined' && jetActive && !onFootGround);
  const isJumping = isPlayerAvatar && !onFootGround && !isJet && !isSwimming && !seated;
  const isSprinting = isPlayerAvatar && (typeof sprinting === 'function' && sprinting() && axisForward() > 0.1);
  const run = isSprinting || r.speed > 4.2;

  // Stride frequency
  const strideFreq = isSwimming ? 4.5 : (run ? 6.8 : (3.2 + r.speed * 1.6));
  r.phase += dt * strideFreq;

  const amount = Math.min(1.0, r.speed / 1.8);
  const blend = 1 - Math.exp(-dt * 15);

  // 1. Pelvis Center-of-Mass Dynamics
  if (!seated && !airborne && !isSwimming && !isJumping) {
    // Realistic running center-of-mass kinematics: mid-stance compression and double-float rise
    const bounce = -Math.abs(Math.sin(r.phase)) * (run ? 0.052 : 0.024) * amount;
    r.pelvis.position.y = 0.87 + bounce;
    r.pelvis.position.x = Math.sin(r.phase) * (run ? 0.028 : 0.014) * amount;
    // Pelvic transverse rotation advances swinging hip forward
    r.pelvis.rotation.y = Math.cos(r.phase) * (run ? 0.11 : 0.045) * amount;
    // Subtle lateral roll into stance leg
    r.pelvis.rotation.z = -Math.sin(r.phase) * (run ? 0.042 : 0.022) * amount;
  } else if (isJumping) {
    const vy = typeof jumpVelocity !== 'undefined' ? jumpVelocity : 0;
    // Dynamic jump pelvis tuck
    r.pelvis.position.y = 0.87 + (vy > 2.0 ? 0.04 : vy > -2.0 ? 0.08 : 0.02);
    r.pelvis.rotation.set(vy > 2.0 ? -0.05 : 0.06, 0, 0);
  } else if (isSwimming) {
    r.pelvis.position.y = 0.87 + Math.sin(r.phase * 0.8) * 0.03;
    r.pelvis.rotation.set(0.6, 0, Math.sin(r.phase) * 0.08);
  } else {
    r.pelvis.position.set(0, 0.87, 0);
    r.pelvis.rotation.set(0, 0, 0);
  }

  // 2. Torso Kinematics
  if (!seated) {
    if (isSwimming) {
      r.torso.rotation.x = 1.15;
      r.torso.rotation.y = Math.sin(r.phase) * 0.12;
      r.head.rotation.x = -0.75;
      r.head.rotation.y = Math.sin(r.phase) * 0.08;
    } else if (isJet) {
      const fwd = typeof axisForward === 'function' ? axisForward() : 0;
      r.torso.rotation.x = 0.28 * Math.max(0.2, fwd);
      r.torso.rotation.y = 0;
      r.head.rotation.x = -0.15;
    } else if (isJumping) {
      // 3-Phase Realistic Human Jump Posture: Takeoff -> Apex Float -> Landing Reach
      const vy = typeof jumpVelocity !== 'undefined' ? jumpVelocity : 0;
      const jumpPitch = vy > 2.5 ? -0.08 : vy > -2.0 ? 0.14 : 0.08;
      r.torso.rotation.x = THREE.MathUtils.lerp(r.torso.rotation.x, jumpPitch, blend);
      r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, 0, blend);
      r.torso.rotation.z = THREE.MathUtils.lerp(r.torso.rotation.z, 0, blend);
      r.head.rotation.x = -jumpPitch * 0.45;
    } else {
      // Running vs Walking: Athletic torso counter-rotation balances leg momentum
      r.torso.rotation.y = -r.pelvis.rotation.y * 1.15;
      r.torso.rotation.z = -r.pelvis.rotation.z * 0.65;
      const forwardLean = (run ? 0.16 : 0.06) * amount;
      const breathe = Math.sin(totalTime * 2.0) * 0.016 * (1 - amount);
      r.torso.rotation.x = forwardLean + breathe;
      r.head.rotation.y = -r.torso.rotation.y * 0.75;
      r.head.rotation.x = -forwardLean * 0.45;
    }
  } else {
    r.torso.rotation.set(0, 0, 0);
    r.head.rotation.set(0, 0, 0);
  }

  // 3. Biomechanical Legs
  for (let side = 0; side < 2; side++) {
    const legPhase = r.phase + side * Math.PI;
    const swing = Math.sin(legPhase);
    const leg = g.userData.limbs[side * 2];
    const arm = g.userData.limbs[side * 2 + 1];

    let thighPose, kneePose;

    if (seated) {
      if (typeof mode !== 'undefined' && mode === 'rover') {
        // Ergonomic automotive driver posture: thighs raised slightly, knees bent with calves reaching forward into footwell pedals
        thighPose = 1.52;
        kneePose = -0.58;
      } else {
        thighPose = 1.35;
        kneePose = -1.35;
      }
    } else if (isSwimming) {
      thighPose = Math.sin(legPhase * 1.4) * 0.40 - 0.12;
      kneePose = -Math.abs(Math.sin(legPhase * 1.4)) * 0.50;
    } else if (isJet) {
      thighPose = 0.20;
      kneePose = -0.48;
    } else if (isJumping) {
      const vy = typeof jumpVelocity !== 'undefined' ? jumpVelocity : 0;
      if (vy > 2.5) {
        // Phase 1: Explosive takeoff - hips and knees extend driving upward
        thighPose = -0.22 + (side === 0 ? 0.04 : -0.04);
        kneePose = -0.15;
      } else if (vy > -2.0) {
        // Phase 2: Apex flight - natural athletic knee tuck clearing ground
        thighPose = 0.46 + (side === 0 ? 0.05 : -0.05);
        kneePose = -0.86;
      } else {
        // Phase 3: Descent and landing preparation - feet reach downward anticipating touch
        thighPose = 0.20 + (side === 0 ? 0.03 : -0.03);
        kneePose = -0.30;
      }
    } else {
      // Natural human locomotion: measured athletic stride, fluid knee flexion
      const strideAmp = run ? 0.68 : 0.46;
      thighPose = swing * strideAmp * amount;

      if (swing < 0) {
        // Forward swing phase: knee flexes smoothly to clear ground (pendulum shortening)
        const swingFlex = Math.sin(Math.max(0, -swing) * Math.PI) * (run ? 0.98 : 0.68);
        kneePose = -swingFlex * amount;
      } else {
        // Stance phase: subtle shock absorption at midstance
        const stanceFlex = Math.sin(legPhase) * (run ? 0.20 : 0.09);
        kneePose = -Math.max(0, stanceFlex) * amount;
      }
    }

    leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, thighPose, blend);
    r.knees[side].rotation.x = THREE.MathUtils.lerp(r.knees[side].rotation.x, kneePose, blend);

    // 4. Natural 3rd Person Weapon Posing & Kinetic Combat
    const isPunching = typeof meleeActive !== 'undefined' && meleeActive && equipped === 'unarmed';
    const isMeleeAttacking = typeof meleeActive !== 'undefined' && meleeActive && (equipped === 'blade' || equipped === 'sabre');
    const isPistol = equipped === 'pistol';
    const isLongGun = equipped === 'rifle' || equipped === 'shotgun';
    const isGrenade = equipped === 'grenade';
    const isOneHanded = equipped === 'tool' || equipped === 'blade' || equipped === 'sabre';
    const isUnarmed = equipped === 'unarmed';
    const inCombat = (typeof aiming !== 'undefined' && aiming) ||
                     (typeof firing !== 'undefined' && firing) ||
                     (typeof recoil !== 'undefined' && recoil > 0.05) ||
                     (typeof combatTime !== 'undefined' && typeof lastShot !== 'undefined' && combatTime - lastShot < 1.4);
    const aimPitch = typeof pitch !== 'undefined' ? pitch : 0;

    if (isPunching) {
      // SOCO COM MÃO ALEATÓRIA EM 3ª PESSOA
      const mp = Math.min(1.0, Math.max(0, (combatTime - meleeStartTime) / meleeDuration));
      const punchSnap = mp < 0.35 ? (mp / 0.35) : (1 - (mp - 0.35) / 0.65);
      const activeSide = (typeof punchHand !== 'undefined' ? punchHand : 1); // 0 = esquerda, 1 = direita

      // Rotação atlética do tronco no golpe
      const torsoRot = (activeSide === 1 ? -0.32 : 0.32) * punchSnap;
      r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, torsoRot, blend);
      r.torso.rotation.x = THREE.MathUtils.lerp(r.torso.rotation.x, 0.06 * punchSnap, blend);

      if (side === activeSide) {
        // Braço golpeador: projeta o punho à frente com extensão do cotovelo
        const targetArmX = 1.35 + aimPitch * 0.70;
        const targetArmY = (side === 1 ? -0.15 : 0.15) + (side === 1 ? -0.12 : 0.12) * punchSnap;
        const targetArmZ = (side === 1 ? -0.05 : 0.05);
        const targetElbowX = THREE.MathUtils.lerp(1.10, 0.18, punchSnap);

        arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetArmX, blend);
        arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, targetArmY, blend);
        arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, targetArmZ, blend);
        r.elbows[side].rotation.x = THREE.MathUtils.lerp(r.elbows[side].rotation.x, targetElbowX, blend);
      } else {
        // Braço oposto: permanece em guarda protegendo o queixo
        const targetArmX = 0.95;
        const targetArmY = (side === 1 ? -0.28 : 0.28);
        const targetArmZ = (side === 1 ? -0.06 : 0.06);
        const targetElbowX = 1.25;

        arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetArmX, blend);
        arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, targetArmY, blend);
        arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, targetArmZ, blend);
        r.elbows[side].rotation.x = THREE.MathUtils.lerp(r.elbows[side].rotation.x, targetElbowX, blend);
      }
    } else if (isMeleeAttacking) {
      // FULL-BODY KINETIC MELEE STRIKE ANIMATION IN 3RD PERSON
      const mp = Math.min(1.0, Math.max(0, (combatTime - meleeStartTime) / meleeDuration));
      if (typeof meleeCombo !== 'undefined' && meleeCombo === 0) {
        // Combo 0: Lethal Overhand Diagonal Slash cutting top-right to bottom-left
        if (mp < 0.22) {
          // Windup: Cocking blade high over right shoulder
          r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, -0.42, blend);
          r.torso.rotation.x = THREE.MathUtils.lerp(r.torso.rotation.x, -0.08, blend);
          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 1.55, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.48, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.30, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, -0.30, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.32, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.50, blend);
          }
        } else if (mp < 0.62) {
          // Heavy Explosive Cut: Lunging forward, twisting hips & shoulders across cut!
          r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, 0.50, blend);
          r.torso.rotation.x = THREE.MathUtils.lerp(r.torso.rotation.x, 0.18, blend);
          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.35, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.65, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 0.70, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, -0.45, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.40, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.40, blend);
          }
        } else {
          // Smooth, organic recovery back to melee guard (elbow bends, blade pulls back to chest!)
          r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, 0, blend);
          r.torso.rotation.x = THREE.MathUtils.lerp(r.torso.rotation.x, 0, blend);
          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.35, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.20, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.20, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.25, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.18, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.65, blend);
          }
        }
      } else {
        // Combo 1: Visceral Horizontal Cleave slicing across torso
        if (mp < 0.22) {
          r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, 0.38, blend);
          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.80, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.70, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.20, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, -0.25, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.30, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.50, blend);
          }
        } else if (mp < 0.62) {
          r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, -0.50, blend);
          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.55, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.75, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 0.60, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, -0.45, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.40, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.40, blend);
          }
        } else {
          // Smooth recovery back to melee guard
          r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, 0, blend);
          r.torso.rotation.x = THREE.MathUtils.lerp(r.torso.rotation.x, 0, blend);
          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.35, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.20, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.20, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.25, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.18, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.65, blend);
          }
        }
      }
    } else if (!seated && !resting && mode === 'foot' && isPistol) {
      // 1. PISTOLA: Duas mãos praticamente juntas, não muito à frente do peito
      const walkBob = Math.sin(r.phase) * amount * 0.06;
      if (side === 1) {
        // Mão direita (empunhadura e gatilho)
        if (inCombat) {
          const targetRotX = 1.05 + aimPitch * 0.70 - (recoil * 0.16);
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetRotX, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.34, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.06, blend);
          r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.15, blend);
        } else {
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.38 + walkBob, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.18, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.04, blend);
          r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 0.75, blend);
        }
      } else {
        // Mão esquerda (apoia junto à direita praticamente juntas não muito à frente do peito)
        if (inCombat) {
          const targetRotX = 1.05 + aimPitch * 0.70 - (recoil * 0.16);
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetRotX, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.34, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0.06, blend);
          r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 1.15, blend);
        } else {
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.38 + walkBob, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.18, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0.04, blend);
          r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.75, blend);
        }
      }
    } else if (!seated && !resting && mode === 'foot' && isLongGun) {
      // 2. METRALHADORA E ESCOPETA: Cabo com mão direita, cano com esquerda, não muito à frente do ombro
      const walkBob = Math.sin(r.phase) * amount * 0.06;
      if (side === 1) {
        // Mão direita no cabo/coronha encaixada junto ao ombro direito
        if (inCombat) {
          const targetRotX = 0.95 + aimPitch * 0.75 - (recoil * 0.16);
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetRotX, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.15, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.05, blend);
          r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.30, blend);
        } else {
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.40 + walkBob, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.15, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.04, blend);
          r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 0.65, blend);
        }
      } else {
        // Mão esquerda segurando o cano/guarda-mão à frente
        if (inCombat) {
          const targetRotX = 1.22 + aimPitch * 0.75 - (recoil * 0.12);
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetRotX, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.28, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0.04, blend);
          r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.80, blend);
        } else {
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.38 - walkBob, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.28, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0, blend);
          r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.95, blend);
        }
      }
    } else if (!seated && !resting && mode === 'foot' && isGrenade) {
      // 3. GRANADA: Pose atlética de preparação, arremesso explosivo e busca no cinto
      const isThrowing = (typeof grenadeThrowing !== 'undefined' && grenadeThrowing);
      const throwProgress = isThrowing ? Math.min(1.0, Math.max(0, (combatTime - grenadeThrowStartTime) / grenadeThrowDuration)) : 0;
      if (isThrowing && throwProgress >= 1.0) {
        grenadeThrowing = false;
      }

      if (isThrowing) {
        // Sequência cinematográfica de arremesso e busca no cinto
        if (throwProgress < 0.35) {
          // Fase 1: Chicote de arremesso à frente (a granada sai da mão dele)
          const p = throwProgress / 0.35;
          const targetArmX = THREE.MathUtils.lerp(1.70, 0.40, p);
          const targetArmY = THREE.MathUtils.lerp(0.38, -0.15, p);
          const targetArmZ = THREE.MathUtils.lerp(0.16, 0.0, p);
          const targetElbowX = THREE.MathUtils.lerp(1.40, 0.30, p);

          r.torso.rotation.y = THREE.MathUtils.lerp(-0.28, 0.35, p);
          r.torso.rotation.x = THREE.MathUtils.lerp(-0.06, 0.12, p);

          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetArmX, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, targetArmY, blend);
            arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, targetArmZ, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, targetElbowX, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, THREE.MathUtils.lerp(1.20, -0.25, p), blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.15, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.45, blend);
          }
        } else if (throwProgress < 0.68) {
          // Fase 2: Mão direita desce até o cinto de utilidades para pegar outra granada
          const p = (throwProgress - 0.35) / 0.33;
          const targetArmX = THREE.MathUtils.lerp(0.40, 0.12, p);
          const targetArmY = THREE.MathUtils.lerp(-0.15, -0.20, p);
          const targetArmZ = THREE.MathUtils.lerp(0.0, -0.05, p);
          const targetElbowX = THREE.MathUtils.lerp(0.30, 0.70, p);

          r.torso.rotation.y = THREE.MathUtils.lerp(0.35, 0.05, p);
          r.torso.rotation.x = THREE.MathUtils.lerp(0.12, 0.02, p);

          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetArmX, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, targetArmY, blend);
            arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, targetArmZ, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, targetElbowX, blend);
          } else {
            const armSwing = -swing * amount * (run ? 0.85 : 0.45);
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, armSwing, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.06, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.25, blend);
          }
        } else {
          // Fase 3: Retira a nova granada do cinto e ergue na mão de volta à prontidão
          const p = (throwProgress - 0.68) / 0.32;
          const targetArmX = THREE.MathUtils.lerp(0.12, 0.36, p);
          const targetArmY = THREE.MathUtils.lerp(-0.20, -0.12, p);
          const targetElbowX = THREE.MathUtils.lerp(0.70, 0.70, p);

          r.torso.rotation.y = THREE.MathUtils.lerp(0.05, 0, p);
          r.torso.rotation.x = THREE.MathUtils.lerp(0.02, 0, p);

          if (side === 1) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetArmX, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, targetArmY, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, targetElbowX, blend);
          } else {
            const armSwing = -swing * amount * (run ? 0.85 : 0.45);
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, armSwing, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.06, blend);
            r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.25, blend);
          }
        }
      } else if (inCombat) {
        // Pose de preparação para arremessar o objeto (mira ativa)
        r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, -0.28, blend);
        if (side === 1) {
          // Braço direito armado para trás e para cima, engatilhado para arremesso
          const targetRotX = 1.65 + aimPitch * 0.35;
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetRotX, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.38, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0.16, blend);
          r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.40, blend);
        } else {
          // Braço esquerdo guia apontado para a frente para equilíbrio de arremesso
          const targetRotX = 1.20 + aimPitch * 0.50;
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetRotX, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.12, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.05, blend);
          r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.40, blend);
        }
      } else {
        r.torso.rotation.y = THREE.MathUtils.lerp(r.torso.rotation.y, 0, blend);
        if (side === 1) {
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.36, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.12, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.04, blend);
          r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 0.70, blend);
        } else {
          const armSwing = -swing * amount * (run ? 0.85 : 0.45);
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, armSwing, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.06, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.04, blend);
          r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.25, blend);
        }
      }
    } else if (!seated && !resting && mode === 'foot' && isOneHanded) {
      // 4. DEMAIS ARMAS DE UMA MÃO (Ferramenta, Lâmina, Sabre): Braço esquerdo NUNCA é levantado!
      if (side === 0) {
        // Braço esquerdo relaxado ao lado do corpo com balanço natural ao caminhar
        const armSwing = -swing * amount * (run ? 0.85 : 0.45);
        arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, armSwing, blend);
        arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, 0.05, blend);
        arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.04, blend);
        r.elbows[0].rotation.x = THREE.MathUtils.lerp(r.elbows[0].rotation.x, 0.22 + Math.max(0, swing) * amount * 0.30, blend);
      } else {
        // Braço direito operando a arma de uma mão
        const walkBob = Math.sin(r.phase) * amount * 0.06;
        if (equipped === 'tool') {
          if (inCombat) {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 1.25 + aimPitch, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.12, blend);
            arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.05, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 0.45, blend);
          } else {
            arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.32 + walkBob, blend);
            arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.10, blend);
            arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, -0.04, blend);
            r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 0.45, blend);
          }
        } else {
          // Lâmina ou Sabre em guarda corporal próxima
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0.35 + walkBob, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -0.20, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, 0, blend);
          r.elbows[1].rotation.x = THREE.MathUtils.lerp(r.elbows[1].rotation.x, 1.20, blend);
        }
      }
    } else if (!seated && !resting && mode === 'foot' && isUnarmed) {
      // 5. DESARMADO (PUNHOS): Guarda marcial com punhos erguidos perto do queixo em combate
      if (inCombat) {
        const targetRotX = 0.92 + aimPitch * 0.45;
        const targetRotY = side === 1 ? -0.28 : 0.28;
        const targetRotZ = side === 1 ? -0.06 : 0.06;
        const targetElbowX = 1.15;

        arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetRotX, blend);
        arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, targetRotY, blend);
        arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, targetRotZ, blend);
        r.elbows[side].rotation.x = THREE.MathUtils.lerp(r.elbows[side].rotation.x, targetElbowX, blend);
      } else {
        const armSwing = -swing * amount * (run ? 0.85 : 0.45);
        arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, armSwing, blend);
        arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, side === 1 ? -0.06 : 0.06, blend);
        arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, side === 1 ? 0.04 : -0.04, blend);
        r.elbows[side].rotation.x = THREE.MathUtils.lerp(r.elbows[side].rotation.x, run ? 1.15 : 0.25 + Math.max(0, swing) * amount * 0.35, blend);
      }
    } else {
      // Unarmed or seated arm animation
      if (isJumping) {
        const vy = typeof jumpVelocity !== 'undefined' ? jumpVelocity : 0;
        const armLift = vy > 2.0 ? 0.65 : vy > -2.0 ? 0.38 : 0.16;
        arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, armLift, blend);
        arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, side === 1 ? -0.15 : 0.15, blend);
        arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, side === 1 ? -0.25 : 0.25, blend);
        r.elbows[side].rotation.x = THREE.MathUtils.lerp(r.elbows[side].rotation.x, 0.85, blend);
      } else {
        if (seated) {
          // Ergonomic cockpit / vehicle driving posture:
          // Arms track steering wheel rotation smoothly: turning right lowers right arm & raises left arm, turning left does the inverse!
          const isRoverDriving = (typeof mode !== 'undefined' && mode === 'rover');
          const steerDirection = isRoverDriving && (typeof axisStrafe === 'function') ? axisStrafe() : 0;
          const steerArmOffset = (side === 0 ? 1 : -1) * steerDirection * 0.25;

          const targetArmX = 0.68 + steerArmOffset;
          const targetArmY = (side === 1 ? -0.22 : 0.22) - steerDirection * 0.18;
          const targetArmZ = (side === 1 ? -0.08 : 0.08) - steerDirection * 0.12;
          const targetElbowX = 0.95 + steerArmOffset * 0.30;

          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetArmX, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, targetArmY, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, targetArmZ, blend);
          r.elbows[side].rotation.x = THREE.MathUtils.lerp(r.elbows[side].rotation.x, targetElbowX, blend);
        } else {
          const armSwing = -swing * amount * (run ? 0.85 : 0.45);
          arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, armSwing, blend);
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, side === 1 ? -0.06 : 0.06, blend);
          arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, side === 1 ? 0.04 : -0.04, blend);
          r.elbows[side].rotation.x = THREE.MathUtils.lerp(r.elbows[side].rotation.x, run ? 1.15 : 0.25 + Math.max(0, swing) * amount * 0.35, blend);
        }
      }
    }
  }
}

function mergeHumanParts(root){for(const child of [...root.children])if(!child.isMesh)mergeHumanParts(child);const pieces=root.children.filter(o=>o.isMesh&&!o.material.transparent);if(pieces.length<2)return;const positions=[],normals=[],colors=[];for(const o of pieces){o.updateMatrix();const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrix);positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);const c=o.material.color;for(let j=0;j<geo.attributes.position.count;j++)colors.push(c.r,c.g,c.b);geo.dispose();root.remove(o);o.geometry.dispose();o.material.dispose();}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const m=mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.85,side:THREE.DoubleSide}),root);m.castShadow=true;}

