function useMedkit(){if(equipment.medkits<1){toast('Você está sem kits médicos.');return;}if(health>=100){toast('Sua vida já está completa.');return;}equipment.medkits--;health=Math.min(100,health+55);save();toast('Kit médico utilizado.');}
function selectVehicle(kind){if(kind!=='rover'){toast('Rover é seu único veículo de exploração.');return;}vehicleKind='rover';renderPanel('fleet');}
function fleetSelect(i){if(typeof window.changeShip==='function'&&window.changeShip!==fleetSelect){window.changeShip(i);return;}shipType=i;buildShip();renderPanel('fleet');}

function shipMaxHull(){return 320;}
function spawnEnemy(type,pos,p=null,tag=null){pos=hostilePosition(pos,p);const g=new THREE.Group();g.position.copy(pos);g.userData.combatEnemy=true;scene.add(g);const flying=type==='pirateShip'||type==='militaryShip',beast=type==='animal';let rig=null;if(flying)fighterModel(g,type==='militaryShip');else if(beast)sculptAnimal(g,p.i,true);else{rig=person(g,0,0,type==='military'?0x617886:0x9b6350);const gun=new THREE.Group();gun.position.set(.35,1.2,-.25);rig.add(gun);makeWeapon(gun,'rifle');}if(p)g.quaternion.copy(frameAt(pos,p.center));g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});const e={id:++enemySerial,g,rig,type,p,tag,flying,beast,hp:flying?180:beast?65:90,maxHp:flying?180:beast?65:90,alive:true,origin:pos.clone(),warn:flying?2400:beast?85:125,aggro:flying?850:beast?28:52,alert:false,shotAt:combatTime+1.5,phase:enemySerial*.8};enemies.push(e);return e;}
function initEnemies(){for(const p of planets){for(let k=0;k<2;k++){const n=V(k?.48:-.46,1,k?-.39:.35).normalize();spawnEnemy(k?(p.i%2?'military':'raider'):'animal',p.center.clone().addScaledVector(n,radius(p,n)+.12),p);}}spawnEnemy('pirateShip',V(2700,3700,1400));spawnEnemy('militaryShip',V(-2800,4300,-1600));}
function enemyCenter(e){return e.g.position.clone().addScaledVector(e.p?e.g.position.clone().sub(e.p.center).normalize():UP,e.flying?0:e.beast?1:1.05);}
function enemyName(e){return e.beast?'FAUNA HOSTIL':e.type==='militaryShip'?'CAÇA MILITAR HOSTIL':e.type==='pirateShip'?'PIRATAS ESPACIAIS':e.type==='military'?'SOLDADO HOSTIL':'SAQUEADOR';}
function obstacleDistance(from,to,ignore=null){const delta=to.clone().sub(from),length=delta.length();if(length<.001)return Infinity;const ray=new THREE.Raycaster(from,delta.normalize(),.06,length),mid=from.clone().add(to).multiplyScalar(.5),sphere=new THREE.Sphere(mid,length*.5+2);const candidates=[...queryStatic(mid,length*.5+2),...movingBodies].filter(b=>b.obj.isMesh&&!b.obj.userData.removed&&!hasAncestorFlag(b.obj,'combatEnemy')&&(!ignore||!belongsTo(b.obj,ignore))&&b.world.intersectsSphere(sphere)).map(b=>b.obj);ray.layers.enable(31);const hit=ray.intersectObjects(candidates,false)[0];let best=hit?hit.distance:Infinity;for(const p of planets){const sphereHit=ray.ray.intersectSphere(new THREE.Sphere(p.center,p.r-18),V());if(sphereHit){const d=from.distanceTo(sphereHit);if(d>.1&&d<length)best=Math.min(best,d);}}return best;}
function segmentHit(a,b,center,r){const delta=b.clone().sub(a),length=delta.length();if(length<.001)return a.distanceTo(center)<r?0:null;const ray=new THREE.Ray(a,delta.normalize()),hit=ray.intersectSphere(new THREE.Sphere(center,r),V());if(!hit)return null;const d=a.distanceTo(hit);return d<=length?d:null;}
function particleBurst(pos,color,count=20,power=7){if(!particlesEnabled)return;const max=quality==='low'?100:360;for(let j=0;j<count&&combatParticles.length<max;j++){const v=V(combatRng()-.5,combatRng()-.3,combatRng()-.5).normalize().multiplyScalar(power*(.3+combatRng()));combatParticles.push({pos:pos.clone(),v,life:.3+combatRng()*.8,color:new THREE.Color(color)});}}
const transientFX=[];
function traceFX(from, to, color = 0x42f5d7, isPellet = false) {
  const dir = to.clone().sub(from);
  const dist = dir.length();
  if (dist < 0.05) return;
  dir.normalize();

  // 1. 3D Muzzle Flash Starburst at barrel tip
  if (!isPellet) {
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const flashMesh = mesh(new THREE.ConeGeometry(0.065, 0.18, 6), flashMat, scene, from.x, from.y, from.z);
    flashMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    flashMesh.userData.noCollision = true;
    transientFX.push({
      o: flashMesh,
      life: 0.05,
      ttl: 0.05,
      update: (dt, p) => {
        flashMesh.scale.setScalar(1 + (1 - p) * 1.6);
        flashMat.opacity = p * 0.95;
      }
    });
  }

  // 2. High-Velocity 3D Energized Plasma Bolt Tracer
  const boltLen = Math.min(1.5, Math.max(0.45, dist * 0.18));
  const boltRadius = isPellet ? 0.024 : 0.042;
  const boltGeo = new THREE.CylinderGeometry(boltRadius * 0.4, boltRadius, boltLen, 6);
  const boltMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  const boltMesh = new THREE.Mesh(boltGeo, boltMat);
  boltMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  boltMesh.position.copy(from).addScaledVector(dir, boltLen * 0.5);
  boltMesh.userData.noCollision = true;
  scene.add(boltMesh);

  const speed = isPellet ? 650 : 850;
  const duration = Math.min(0.25, Math.max(0.05, dist / speed));
  let elapsed = 0;

  transientFX.push({
    o: boltMesh,
    life: duration,
    ttl: duration,
    update: (dt, p) => {
      elapsed += dt;
      const progress = Math.min(1, elapsed / duration);
      const curPos = from.clone().lerp(to, progress);
      boltMesh.position.copy(curPos);
      boltMat.opacity = Math.min(1, p * 1.8);
      if (progress >= 0.96 && dist > 1.2) {
        particleBurst(to, color, isPellet ? 8 : 18, 2.5);
      }
    }
  });
}
function blastFX(pos,r=8){if(audioContext&&pos.distanceTo(controlledPosition())<2500){tone(48,audioContext.currentTime,.5,.13,fxBus,'sawtooth');tone(90,audioContext.currentTime,.3,.08,fxBus,'triangle');}const o=mesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffb47b,transparent:true,opacity:.65,wireframe:true,depthWrite:false,toneMapped:false}),scene,...pos.toArray());o.userData.noCollision=true;transientFX.push({o,life:.55,ttl:.55,r});particleBurst(pos,0xffb866,36,r*2);}
function damageEnemy(e,damage){if(!e.alive)return;e.hp-=damage;e.alert=true;particleBurst(enemyCenter(e),e.beast?0xb5bf98:0xffc482,6,3);if(e.hp<=0){e.alive=false;e.g.visible=false;e.g.traverse(o=>o.userData.removed=true);blastFX(enemyCenter(e),e.flying?16:2.5);if(mission?.combat&&mission.tag===e.tag)mission.kills++;credits+=e.flying?120:30;save();toast(enemyName(e)+' neutralizado.');}}
function playerTarget(){if(mode==='pilot'||inside)return {pos:ship.position.clone().add(V(0,1,0)),r:6,vehicle:'ship'};if(mode==='rover')return {pos:rover.getWorldPosition(V()).add(V(0,1,0)),r:2,vehicle:'rover'};const up=eva?UP:player.clone().sub((groundPlanet||nearest(player)).center).normalize();return {pos:player.clone().addScaledVector(up,-.8),r:.7,vehicle:'suit'};}
function hurtPlayer(amount){if(safeZone(controlledPosition())||boost)return;lastHurt=combatTime;damageFlash=Math.min(.7,damageFlash+.3);if(mode==='pilot'||inside){const shield=Math.min(shipShield,amount);shipShield-=shield;hull-=amount-shield;}else if(mode==='rover')vehicleHealth-=amount;else{const shield=Math.min(suitShield,amount);suitShield-=shield;health-=amount-shield;}if(health<=0||hull<=0||vehicleHealth<=0)emergencyRespawn();}
function emergencyRespawn(){const pos=controlledPosition(),port=destinations.filter(d=>!d.gate&&d.kind!=='water').reduce((a,b)=>pos.distanceTo(a.pos)<pos.distanceTo(b.pos)?a:b);clearCombatMission();if(mission)resetJobObjects(mission);mission=null;clearMissionCargo();cargo=0;credits=Math.max(0,credits-150);health=100;suitShield=50;hull=shipMaxHull();shipShield=140;vehicleHealth=vehicleKind==='hauler'?240:vehicleKind==='scout'?100:150;auto=null;boost=null;landed=true;ship.position.copy(port.pos).add(port.p?planetUp(port.pos,port.p).multiplyScalar(2):V(0,2,0));ship.quaternion.copy(port.p?frameAt(port.pos,port.p.center):new THREE.Quaternion());resetFootMotion();mode='pilot';inside=true;eva=false;flightSpeed=0;groundPlanet=port.p||null;station=port.station||null;firing=false;keys.KeyW=keys.KeyS=false;touchX=touchY=0;save();toast('Resgate de emergência ao porto. Serviço: até 150 CR.');}
// === REALISTIC PROCEDURAL ACOUSTIC WEAPON SOUND SYNTHESIZER (ZERO ROBOTIC BEEPS) ===
