let reloadActive = false, reloadDuration = 1.6, reloadStartTime = 0;
let meleeActive = false, meleeDuration = 0.38, meleeStartTime = 0, meleeCombo = 0;

function reloadWeapon() {
  const d = weaponDefs[equipped];
  if (!d.mag || reloadUntil > combatTime || magazines[equipped] >= d.mag || equipment.ammo < 1) return;
  reloadDuration = equipped === 'pistol' ? 1.35 : equipped === 'shotgun' ? 1.9 : 1.65;
  reloadUntil = combatTime + reloadDuration;
  reloadActive = true;
  reloadStartTime = combatTime;
  toast('Recarregando ' + d.name + '…');

  if (audioContext) {
    tone(240, audioContext.currentTime + 0.1, 0.08, 0.05, fxBus, 'triangle');
    tone(180, audioContext.currentTime + reloadDuration * 0.5, 0.12, 0.08, fxBus, 'square');
    tone(320, audioContext.currentTime + reloadDuration * 0.78, 0.07, 0.05, fxBus, 'sawtooth');
  }
}

let pendingMeleeHit=null, pendingRiggedShot=false, meleeImpactFraction=.35;
function riggedFireReady(){
  const s=avatar?.userData.rig?.userData.character;
  if(!s||!thirdPerson)return true;
  s.aimRequestUntil=combatTime+.4;pendingRiggedShot=equipped;
  if((s.aimBlend||0)<.94||!avatarWeapon)return false;
  const forward=V(0,0,-1).applyQuaternion(avatarWeapon.getWorldQuaternion(new THREE.Quaternion()));
  return forward.dot(aimDirection(false))>.99;
}
function updateCharacterCombat(){
  if(reloadActive&&combatTime>=reloadStartTime+reloadDuration)reloadActive=false;
  if(meleeActive&&combatTime>=meleeStartTime+meleeDuration)meleeActive=false;
  if(grenadeThrowing&&combatTime>=grenadeThrowStartTime+grenadeThrowDuration)grenadeThrowing=false;
  if(pendingMeleeHit&&combatTime>=pendingMeleeHit.at){const hit=pendingMeleeHit;pendingMeleeHit=null;if(mode==='foot'&&!resting&&equipped===hit.kind)resolveMeleeHit(hit.kind);}
  if(pendingRiggedShot&&(pendingRiggedShot!==equipped||mode!=='foot'||resting))pendingRiggedShot=false;
  if(pendingRiggedShot&&!firing){if(mode==='foot'&&!resting&&weaponDefs[equipped]?.mag)firePlayer();else pendingRiggedShot=false;}
}
function resolveMeleeHit(kind){
  const d=weaponDefs[kind];playWeaponSound(kind);
  const dir=aimDirection(false),from=(inside?shipPoint(foot):player.clone()).add(V(0,1.4,0));
  const to=from.clone().addScaledVector(dir,d.range);let chosen=null,nearestHit=d.range;
  for(const e of enemies){if(!e.alive)continue;const hit=segmentHit(from,to,enemyCenter(e),e.flying?6:e.beast?2:1.4);if(hit!==null&&hit<nearestHit){chosen=e;nearestHit=hit;}}
  if(chosen){damageEnemy(chosen,d.damage);particleBurst(from.clone().addScaledVector(dir,nearestHit),d.color,kind==='unarmed'?10:16,kind==='unarmed'?1.8:2.5);}
}
function firePlayer() {
  if (equipped === 'tool' && mode === 'foot' && !resting && started && $('panel').classList.contains('hidden')) {
    if (combatTime - lastShot < 0.22) return;
    lastShot = combatTime;
    playWeaponSound('tool');
    scan();
    return;
  }
    if (resting || !started || !$('panel').classList.contains('hidden') || reloadUntil > combatTime || mode === 'rover') return;
  const naval = mode === 'pilot';
  const d = naval ? { damage: 30, range: 2400, rate: 0.18, soundPitch: 85 } : weaponDefs[equipped];
  if (combatTime - lastShot < (naval ? 0.18 : d.rate)) return;

  const rig=avatar?.userData.rig?.userData.character;
  if(!naval&&rig&&['unarmed','blade','sabre'].includes(equipped)&&combatTime<meleeStartTime+meleeDuration&&meleeActive)return;
  if(!naval&&d.mag&&!riggedFireReady())return;
  pendingRiggedShot=false;
  lastShot = combatTime;
  recoil = 1.0;

  // Melee attack handling (Blades, Sabres, and Unarmed Punches)
  if (!naval && (equipped === 'blade' || equipped === 'sabre' || equipped === 'unarmed')) {
    meleeActive = true;
    meleeStartTime = combatTime;
    meleeDuration = equipped === 'unarmed' ? 0.28 : equipped === 'sabre' ? 0.36 : 0.40;
    meleeCombo = (meleeCombo + 1) % 2;

    if(equipped==='unarmed'){punchHand=meleeCombo;lastUnarmedAttackTime=combatTime;}
    if(rig){
      meleeDuration=equipped==='unarmed'?.48:.62;
      const clip=equipped==='unarmed'?(meleeCombo?'Punch_Cross':'Punch_Jab'):(meleeCombo?'Sword_Regular_A':'Sword_Regular_B');
      SkywardCharacters.trigger(rig,clip,'upper',meleeDuration);
      meleeImpactFraction={Punch_Jab:.24,Punch_Cross:.30,Sword_Regular_A:.54,Sword_Regular_B:.46}[clip];
      pendingMeleeHit={kind:equipped,at:combatTime+meleeDuration*meleeImpactFraction};
    }else resolveMeleeHit(equipped);
    return;
  }

  // Calculate true 3D barrel tip position
  const dir = aimDirection(naval);
  let from;
  if (naval) {
    from = shipPoint(V(0, 1.7, -layout().halfZ - 1.5));
  } else {
    if (!thirdPerson && weaponView) {
      weaponView.updateMatrixWorld(true);
      from = weaponView.localToWorld(getMuzzleOffset(equipped).clone());
    } else if (thirdPerson && avatarWeapon) {
      avatarWeapon.updateMatrixWorld(true);
      from = avatarWeapon.localToWorld(getMuzzleOffset(equipped).clone());
    } else {
      from = (inside ? shipPoint(foot) : player.clone()).add(V(0, 1.4, 0)).addScaledVector(dir, 0.5);
    }
  }

  if (!naval && equipped === 'grenade') {
    if (equipment.grenades <= 0) {
      equipWeapon('unarmed');
      toast('Sem granadas no inventário.');
      return;
    }
    equipment.grenades--;
    grenadeThrowing = true;
    grenadeThrowStartTime = combatTime;
    grenadeThrowDuration = 0.85;
    if(rig)SkywardCharacters.trigger(rig,'OverhandThrow','upper',grenadeThrowDuration);

    const { from: gFrom, throwVel: gVel } = getGrenadeOriginAndVelocity();

    // Spawn identical 3D Grenade model (matches the exact one held in hand)
    const gObj = new THREE.Group();
    gObj.name = 'thrownGrenade';
    gObj.userData.noCollision = true;
    makeWeapon(gObj, 'grenade');
    gObj.position.copy(gFrom);
    scene.add(gObj);
    gObj.traverse(o => { o.userData.noCollision = true; });

    // Physical ballistic arc: unified velocity vector matching the trajectory arc 100%
    projectiles.push({
      o: gObj,
      pos: gFrom.clone(),
      v: gVel.clone(),
      life: 3.5,
      totalLife: 3.5,
      grenade: true,
      radius: 0.12,
      rotAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      rotSpeed: 10.0
    });

    // Temporarily hide weapon in hand at release point (grenade leaves hand)
    if (weaponView) weaponView.visible = false;
    if (avatarWeapon) avatarWeapon.visible = false;

    // After hand reaches down to belt and grabs another grenade, make it visible again
    setTimeout(() => {
      if (equipped === 'grenade' && equipment.grenades > 0) {
        rebuildWeapon();
        updateAvatarWeapon();
        if (weaponView && mode === 'foot' && !thirdPerson && !resting) weaponView.visible = true;
        if (avatarWeapon && mode === 'foot' && thirdPerson && !resting) avatarWeapon.visible = true;
      }
    }, 580);

    if (equipment.grenades <= 0) {
      setTimeout(() => {
        if (equipped === 'grenade' && equipment.grenades <= 0) {
          toast('Granadas esgotadas. Alternando para Desarmado.');
          equipWeapon('unarmed');
        }
      }, 750);
    }
    return;
  }

  if (!naval && d.mag) {
    magazines[equipped]--;
    if (magazines[equipped] === 0) reloadWeapon();
  }

  // Camera recoil kick
  if (!naval && !thirdPerson) {
    pitch = THREE.MathUtils.clamp(pitch + (d.recoil || 0.5) * 0.024, -1.35, 1.35);
  }

  if (naval) {
    if (audioContext) { tone(55, audioContext.currentTime, 0.22, 0.35, fxBus, 'sawtooth'); tone(32, audioContext.currentTime, 0.28, 0.45, fxBus, 'triangle'); }
  } else {
    playWeaponSound(equipped);
  }

  // Shotgun multi-pellet spread
  if (!naval && equipped === 'shotgun') {
    const pelletCount = d.pellets || 6;
    for (let p = 0; p < pelletCount; p++) {
      const spreadDir = dir.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08
      )).normalize();

      const to = from.clone().addScaledVector(spreadDir, d.range);
      const blocked = obstacleDistance(from, to, null);
      let chosen = null, nearestHit = Math.min(d.range, blocked);
      for (const e of enemies) {
        if (!e.alive) continue;
        const hit = segmentHit(from, to, enemyCenter(e), e.flying ? 7 : e.beast ? 1.4 : 0.85);
        if (hit !== null && hit < nearestHit) { chosen = e; nearestHit = hit; }
      }
      if (chosen) damageEnemy(chosen, Math.round(d.damage / pelletCount));
      traceFX(from, from.clone().addScaledVector(spreadDir, nearestHit), d.color || 0xff6b38, true);
    }
    return;
  }

  // Single projectile / laser bolt
  const to = from.clone().addScaledVector(dir, d.range);
  const blocked = obstacleDistance(from, to, naval ? ship : null);
  let chosen = null, nearestHit = Math.min(d.range, blocked);
  for (const e of enemies) {
    if (!e.alive) continue;
    const hit = segmentHit(from, to, enemyCenter(e), e.flying ? 7 : e.beast ? 1.4 : 0.85);
    if (hit !== null && hit < nearestHit) { chosen = e; nearestHit = hit; }
  }
  if (chosen) damageEnemy(chosen, d.damage);
  traceFX(from, from.clone().addScaledVector(dir, nearestHit), naval ? 0x8fe7ff : (d.color || 0x38efba), false);
}
