function enemyFire(e,target){const from=enemyCenter(e),delta=target.pos.clone().sub(from),dist=delta.length();if(obstacleDistance(from,target.pos,target.vehicle==='ship'?ship:target.vehicle==='rover'?rover:null)<dist-1)return;const speed=e.flying?360:100,lead=mode==='pilot'?shipVelocity.clone().multiplyScalar(dist/speed*.35):V();const velocity=target.pos.clone().add(lead).sub(from).normalize().multiplyScalar(speed),o=mesh(new THREE.SphereGeometry(e.flying?.35:.07,6,4),new THREE.MeshBasicMaterial({color:0xff9869,toneMapped:false}),scene,...from.toArray());o.userData.noCollision=true;projectiles.push({o,pos:from.clone(),v:velocity,life:e.flying?5:2,damage:e.flying?19:9,enemy:true});}
function explodeGrenade(b){blastFX(b.pos,14);for(const e of enemies)if(e.alive){const dist=enemyCenter(e).distanceTo(b.pos);if(dist<14&&obstacleDistance(b.pos,enemyCenter(e))>=dist-1)damageEnemy(e,125*(1-dist/20));}const target=playerTarget(),dist=target.pos.distanceTo(b.pos);if(dist<12&&obstacleDistance(b.pos,target.pos)>=dist-1)hurtPlayer(90*(1-dist/14));}
let grenadeTrajectoryLine = null;

function updateGrenadeTrajectory() {
  const isAimingGrenade = mode === 'foot' && equipped === 'grenade' && (typeof aiming !== 'undefined' && aiming);
  if (!isAimingGrenade) {
    if (grenadeTrajectoryLine) grenadeTrajectoryLine.visible = false;
    return;
  }

  if (!grenadeTrajectoryLine) {
    const maxPts = 40;
    const positions = new Float32Array(maxPts * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineDashedMaterial({
      color: 0x7ee2c8,
      dashSize: 0.6,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    grenadeTrajectoryLine = new THREE.Line(geo, mat);
    grenadeTrajectoryLine.computeLineDistances();
    grenadeTrajectoryLine.frustumCulled = false;
    grenadeTrajectoryLine.userData.noCollision = true;
    scene.add(grenadeTrajectoryLine);
  }

  grenadeTrajectoryLine.visible = true;
  const { from: gFrom, throwVel: gVel, p } = getGrenadeOriginAndVelocity();

  let simPos = gFrom.clone();
  let simVel = gVel.clone();
  const dtSim = 0.040;
  const attr = grenadeTrajectoryLine.geometry.attributes.position;

  for (let step = 0; step < 40; step++) {
    attr.setXYZ(step, simPos.x, simPos.y, simPos.z);
    const upNorm = planetUp(simPos, p);
    simVel.addScaledVector(upNorm, -14.0 * dtSim);
    simPos.addScaledVector(simVel, dtSim);

    const rSphere = 0.12;
    const minCenterDist = radius(p, upNorm) + rSphere;
    if (simPos.distanceTo(p.center) <= minCenterDist) {
      simPos.copy(p.center).addScaledVector(upNorm, minCenterDist);
      const vNorm = simVel.dot(upNorm);
      if (vNorm < 0) {
        simVel.addScaledVector(upNorm, -vNorm * 1.52).multiplyScalar(0.75);
      }
    }
  }
  attr.needsUpdate = true;
  grenadeTrajectoryLine.computeLineDistances();
}

function updateProjectiles(dt) {
  const target = playerTarget();
  updateGrenadeTrajectory();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const b = projectiles[i];
    b.life -= dt;

    if (b.grenade) {
      // 1. Gravity acceleration (14 m/s^2)
      const p = groundPlanet || nearest(b.pos);
      const upNorm = planetUp(b.pos, p);
      b.v.addScaledVector(upNorm, -14.0 * dt);

      // Sub-step spherical collision to avoid tunneling through surfaces
      const rSphere = b.radius || 0.12;
      const subSteps = 2;
      const subDt = dt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        const next = b.pos.clone().addScaledVector(b.v, subDt);
        let collided = false;
        let contactNormal = null;

        // A. Spherical ground collider against planetary terrain
        const pNorm = planetUp(next, p);
        const terrainAlt = radius(p, pNorm);
        const curDist = next.distanceTo(p.center);
        const minCenterDist = terrainAlt + rSphere;

        if (curDist < minCenterDist) {
          next.copy(p.center).addScaledVector(pNorm, minCenterDist);
          contactNormal = pNorm.clone();
          collided = true;
        }

        // B. Spherical collider against platforms, sidewalks, city buildings, crates, props
        if (typeof nearbyBodies === 'function') {
          const bodies = nearbyBodies(next, rSphere + 1.2, b.o);
          for (const body of bodies) {
            if (body.obj.userData?.noCollision || body.obj.userData?.surfaceOnly) continue;
            const push = spherePush(next, rSphere, body);
            if (push) {
              next.add(push);
              const pushLen = push.length();
              if (pushLen > 0.0001) {
                const norm = push.clone().divideScalar(pushLen);
                contactNormal = contactNormal ? contactNormal.add(norm).normalize() : norm;
                collided = true;
              }
            }
          }
        }

        // C. Clean normal reflection with restitution & friction (never bounce backwards or sideways randomly!)
        if (collided && contactNormal) {
          const vDot = b.v.dot(contactNormal);
          if (vDot < 0) {
            const vNormVec = contactNormal.clone().multiplyScalar(vDot);
            const vTangVec = b.v.clone().sub(vNormVec);

            const restitution = (Math.abs(vDot) > 1.5) ? 0.52 : 0.32;
            const friction = 0.78;

            b.v.copy(vTangVec.multiplyScalar(friction)).addScaledVector(contactNormal, -vDot * restitution);

            // Natural sphere rolling physics: rotation axis is perpendicular to contact normal and movement direction
            if (vTangVec.lengthSq() > 0.04) {
              b.rotAxis = new THREE.Vector3().crossVectors(contactNormal, vTangVec).normalize();
              b.rotSpeed = vTangVec.length() / rSphere;
            }

            if (Math.abs(vDot) > 1.2 && audioContext && !audioMuted) {
              tone(250 + Math.random() * 40, audioContext.currentTime, 0.035, 0.05, fxBus, 'triangle');
            }
          }
        }

        b.pos.copy(next);
      }

      b.o.position.copy(b.pos);

      // Spherical rolling and tumbling
      if (b.rotAxis && b.rotSpeed > 0.05) {
        b.o.rotateOnAxis(b.rotAxis, b.rotSpeed * dt);
        b.rotSpeed *= Math.exp(-dt * 2.2);
      }

      // Detonation on fuse expiration
      if (b.life <= 0) {
        explodeGrenade(b);
        scene.remove(b.o);
        discardChildren(b.o);
        projectiles.splice(i, 1);
      }
      continue;
    }

    const old = b.pos.clone();
    const next = b.pos.clone().addScaledVector(b.v, dt);
    const dist = old.distanceTo(next);
    const wall = obstacleDistance(old, next, b.enemy ? (target.vehicle === 'ship' ? ship : target.vehicle === 'rover' ? rover : null) : null);
    if (wall < dist) {
      b.pos.copy(old).addScaledVector(b.v.clone().normalize(), Math.max(0, wall - 0.1));
      b.life = 0;
      particleBurst(b.pos, 0xffba78, 5, 3);
    } else {
      b.pos.copy(next);
    }
    if (b.enemy && segmentHit(old, b.pos, target.pos, target.r) !== null) {
      hurtPlayer(b.damage);
      b.life = 0;
    }
    b.o.position.copy(b.pos);
    if (b.life <= 0) {
      scene.remove(b.o);
      if (b.o.geometry) b.o.geometry.dispose();
      if (b.o.material) b.o.material.dispose();
      projectiles.splice(i, 1);
    }
  }
}
