function animateEntities(dt){for(const a of animals){a.g.userData.legs?.forEach((leg,k)=>leg.rotation.x=Math.sin(totalTime*2.2+k*Math.PI)*.15);if(a.g.userData.tail)a.g.userData.tail.rotation.y=Math.sin(totalTime*.9+a.phase)*.22;}if (weaponView) {
    weaponView.visible = mode === 'foot' && started && $('panel').classList.contains('hidden');
    recoil = Math.max(0, recoil - dt * 6.5);

    // Natural breathing & footstep bobbing
    const bobX = Math.sin(totalTime * 4.5) * 0.003;
    const bobY = -Math.abs(Math.sin(totalTime * 4.5)) * 0.004;

    let posX = 0.30 + bobX, posY = -0.28 + bobY, posZ = -0.62;
    let rotX = 0, rotY = -0.06, rotZ = 0;

    if (typeof aimBlend !== 'undefined' && aimBlend > 0.001) {
      // Natural firearm sight alignment:
      // Weapon is vertically straight (rotZ = 0, no tilt!), positioned slightly to the right of screen center (posX = 0.065)
      // rotY transitions from -0.06 to 0.00 (straight ahead).
      posX = THREE.MathUtils.lerp(posX, 0.065, aimBlend);
      posY = THREE.MathUtils.lerp(posY, -0.16, aimBlend);
      posZ = THREE.MathUtils.lerp(posZ, -0.52, aimBlend);
      rotY = THREE.MathUtils.lerp(rotY, 0.0, aimBlend);
      rotZ = THREE.MathUtils.lerp(rotZ, 0.0, aimBlend);
    }

    // Recoil kickback translation & muzzle rise
    const d = weaponDefs[equipped] || {};
    const kickZ = (d.recoil || 0.8) * 0.09;
    const kickRotX = (d.recoil || 0.8) * 0.16;
    posZ += recoil * kickZ;
    rotX += recoil * kickRotX;

    // Slide reciprocation animation on handgun
    const slideMesh = weaponView.getObjectByName('weaponSlide');
    if (slideMesh) {
      slideMesh.position.z = recoil * 0.045;
    }

    // Reload animation sequence
    if (reloadActive) {
      const p = Math.min(1, Math.max(0, (combatTime - reloadStartTime) / reloadDuration));
      if (p < 0.3) {
        // Dip down & tilt left
        const subP = p / 0.3;
        posY -= Math.sin(subP * Math.PI * 0.5) * 0.12;
        rotZ -= Math.sin(subP * Math.PI * 0.5) * 0.45;
        rotX -= Math.sin(subP * Math.PI * 0.5) * 0.20;
      } else if (p < 0.7) {
        // Insert fresh magazine
        posY -= 0.12;
        rotZ -= 0.45;
        rotX -= 0.20;
      } else if (p < 0.9) {
        // Slide rack
        posY -= 0.12 * (1 - (p - 0.7) / 0.2);
        rotZ -= 0.45 * (1 - (p - 0.7) / 0.2);
        if (slideMesh) slideMesh.position.z = Math.sin((p - 0.7) / 0.2 * Math.PI) * 0.05;
      } else {
        // Return to ready
        const subP = (p - 0.9) / 0.1;
        posY += (1 - subP) * -0.04;
      }

      if (p >= 1.0) {
        reloadActive = false;
        if (d.mag) {
          const needed = d.mag - magazines[equipped];
          const available = Math.min(needed, equipment.ammo);
          magazines[equipped] += available;
          equipment.ammo -= available;
        }
      }
    }

    if (equipped === 'unarmed') {
      const unarmedIdleTimeout = 2.0;
      const isAttacking = meleeActive || ((combatTime - lastUnarmedAttackTime) < unarmedIdleTimeout) || (typeof aiming !== 'undefined' && aiming);
      const targetRaise = isAttacking ? 1.0 : 0.0;
      const blendRate = (targetRaise > unarmedRaiseBlend) ? 18.0 : 3.5;
      unarmedRaiseBlend = THREE.MathUtils.lerp(unarmedRaiseBlend, targetRaise, 1 - Math.exp(-dt * blendRate));

      posX = 0;
      posY = THREE.MathUtils.lerp(-0.75, -0.22, unarmedRaiseBlend) + (unarmedRaiseBlend > 0.1 ? bobY : 0);
      posZ = THREE.MathUtils.lerp(-0.32, -0.50, unarmedRaiseBlend);
      rotX = THREE.MathUtils.lerp(-0.55, 0.0, unarmedRaiseBlend);
      rotY = 0;
      rotZ = 0;

      const leftFist = weaponView.getObjectByName('leftFist');
      const rightFist = weaponView.getObjectByName('rightFist');
      if (leftFist && rightFist) {
        const mp = meleeActive ? Math.min(1.0, Math.max(0, (combatTime - meleeStartTime) / meleeDuration)) : 0;
        const strikeSnap = mp === 0 ? 0 : mp < meleeImpactFraction ? (mp / meleeImpactFraction) : (1 - (mp - meleeImpactFraction) / (1-meleeImpactFraction));
        const strikeDist = strikeSnap * 0.42;

        const leftStrike = (meleeActive && punchHand === 0) ? strikeDist : 0;
        leftFist.position.set(-0.24 + (leftStrike ? 0.12 * strikeSnap : 0), -0.05 + (leftStrike ? 0.04 * strikeSnap : 0), 0.15 - leftStrike);
        leftFist.rotation.set(0, 0, (leftStrike ? -0.40 * strikeSnap : 0));

        const rightStrike = (meleeActive && punchHand === 1) ? strikeDist : 0;
        rightFist.position.set(0.24 - (rightStrike ? 0.12 * strikeSnap : 0), -0.05 + (rightStrike ? 0.04 * strikeSnap : 0), 0.15 - rightStrike);
        rightFist.rotation.set(0, 0, (rightStrike ? 0.40 * strikeSnap : 0));

        if (mp >= 1.0) meleeActive = false;
      }
      weaponView.visible = (unarmedRaiseBlend > 0.005) && mode === 'foot' && started && $('panel').classList.contains('hidden');
    } else if (meleeActive) {
      // Melee blade/sabre slash animation sequence (Pivot centered on player hand)
      const mp = Math.min(1, Math.max(0, (combatTime - meleeStartTime) / meleeDuration));
      if (meleeCombo === 0) {
        // Combo 0: Lethal diagonal slash cutting from top-right down to bottom-left
        if (mp < 0.20) {
          const wP = mp / 0.20;
          posX = THREE.MathUtils.lerp(0.30, 0.32, wP);
          posY = THREE.MathUtils.lerp(-0.28, -0.20, wP);
          posZ = THREE.MathUtils.lerp(-0.62, -0.52, wP);
          rotX = THREE.MathUtils.lerp(0, 0.55, wP);
          rotY = THREE.MathUtils.lerp(-0.06, -0.65, wP);
          rotZ = THREE.MathUtils.lerp(0, 0.60, wP);
        } else if (mp < 0.65) {
          const sP = (mp - 0.20) / 0.45;
          const ease = sP * sP * (3 - 2 * sP);
          posX = THREE.MathUtils.lerp(0.32, 0.08, ease);
          posY = THREE.MathUtils.lerp(-0.20, -0.32, ease);
          posZ = THREE.MathUtils.lerp(-0.52, -0.65, ease);
          rotX = THREE.MathUtils.lerp(0.55, -0.45, ease);
          rotY = THREE.MathUtils.lerp(-0.65, 0.85, ease);
          rotZ = THREE.MathUtils.lerp(0.60, -0.75, ease);
        } else {
          const rP = (mp - 0.65) / 0.35;
          const rEase = 1 - Math.pow(1 - rP, 2);
          posX = THREE.MathUtils.lerp(0.08, 0.30, rEase);
          posY = THREE.MathUtils.lerp(-0.32, -0.28, rEase);
          posZ = THREE.MathUtils.lerp(-0.65, -0.62, rEase);
          rotX = THREE.MathUtils.lerp(-0.45, 0, rEase);
          rotY = THREE.MathUtils.lerp(0.85, -0.06, rEase);
          rotZ = THREE.MathUtils.lerp(-0.75, 0, rEase);
        }
      } else {
        // Combo 1: Visceral horizontal cleave cutting from left across to right
        if (mp < 0.20) {
          const wP = mp / 0.20;
          posX = THREE.MathUtils.lerp(0.30, 0.12, wP);
          posY = THREE.MathUtils.lerp(-0.28, -0.24, wP);
          posZ = THREE.MathUtils.lerp(-0.62, -0.54, wP);
          rotX = THREE.MathUtils.lerp(0, 0.15, wP);
          rotY = THREE.MathUtils.lerp(-0.06, 0.75, wP);
          rotZ = THREE.MathUtils.lerp(0, -0.55, wP);
        } else if (mp < 0.65) {
          const sP = (mp - 0.20) / 0.45;
          const ease = sP * sP * (3 - 2 * sP);
          posX = THREE.MathUtils.lerp(0.12, 0.28, ease);
          posY = THREE.MathUtils.lerp(-0.24, -0.26, ease);
          posZ = THREE.MathUtils.lerp(-0.54, -0.65, ease);
          rotX = THREE.MathUtils.lerp(0.15, -0.08, ease);
          rotY = THREE.MathUtils.lerp(0.75, -0.90, ease);
          rotZ = THREE.MathUtils.lerp(-0.55, 0.45, ease);
        } else {
          const rP = (mp - 0.65) / 0.35;
          const rEase = 1 - Math.pow(1 - rP, 2);
          posX = THREE.MathUtils.lerp(0.28, 0.30, rEase);
          posY = THREE.MathUtils.lerp(-0.26, -0.28, rEase);
          posZ = THREE.MathUtils.lerp(-0.65, -0.62, rEase);
          rotX = THREE.MathUtils.lerp(-0.08, 0, rEase);
          rotY = THREE.MathUtils.lerp(-0.90, -0.06, rEase);
          rotZ = THREE.MathUtils.lerp(0.45, 0, rEase);
        }
      }
      if (mp >= 1.0) meleeActive = false;
    }

    weaponView.position.set(posX, posY, posZ);
    weaponView.rotation.set(rotX, rotY, rotZ);
  }}

