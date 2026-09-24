let smoothCamUp = new THREE.Vector3(0, 1, 0);
window.getSmoothCamUp = () => smoothCamUp;

function updateFootV05(dt){if(waterMovement(dt))return;if(resting){if(keys.Space){standUp();keys.Space=false;}return;}const context=inside?'ship':eva?'eva':station?'station':'ground';if(footContext!==context){jumpVelocity=0;onFootGround=true;jumpHeld=0;footContext=context;}const f=axisForward(),s=axisStrafe(),p=groundPlanet||nearest(player);
const currentWorldPos = inside ? shipPoint(foot) : player;
const onPlanetOrStation = !!(groundPlanet || (p && currentWorldPos.distanceTo(p.center) < p.r + ATMOSPHERE + 500) || station);

if (onPlanetOrStation) {
  eva = false;
  evaVelocity.set(0, 0, 0);
}

// Internal artificial gravity: ALWAYS active inside the ship when in flight!
// Artificial gravity is ONLY disabled when the ship is parked/landed on a planet or station.
const useWorldGravInside = inside && landed && onPlanetOrStation;
const frame = inside ? (useWorldGravInside ? (station ? station.getWorldQuaternion(new THREE.Quaternion()) : walkFrame(currentWorldPos, p)) : ship.quaternion) : (onPlanetOrStation ? (station ? station.getWorldQuaternion(new THREE.Quaternion()) : walkFrame(player, p)) : (eva ? evaFrame : walkFrame(player, p)));
const up = UP.clone().applyQuaternion(frame);
const world = inside ? currentWorldPos.clone() : player.clone();
let move = V(s,0,-f);
if (move.lengthSq()>1) move.normalize();
const isFreeCam = (thirdPerson && typeof footFreeCam !== 'undefined' && footFreeCam);
const isMoving = Math.hypot(s, f) > 0.05;

let moveAngle;
if (isFreeCam) {
  if (!aiming) {
    if (isMoving) {
      if (typeof footFreeCamMoveAngle === 'undefined' || footFreeCamMoveAngle === null) {
        footFreeCamMoveAngle = (yaw + footOrbitYaw);
      }
    } else {
      footFreeCamMoveAngle = null;
    }
    moveAngle = (footFreeCamMoveAngle !== null) ? footFreeCamMoveAngle : (yaw + footOrbitYaw);
  } else {
    footFreeCamMoveAngle = null;
    moveAngle = (yaw + footOrbitYaw);
  }
} else {
  moveAngle = yaw;
}
move.applyAxisAngle(UP, moveAngle).applyQuaternion(frame).multiplyScalar((inside?(sprinting()?9:6):(sprinting()?15:8))*dt);
if(eva){const q=frame.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'))),thruster=V(s,(keys.Space?1:0)-(keys.ControlLeft?1:0),-f);if(thruster.lengthSq()>1)thruster.normalize();thruster.applyQuaternion(q).multiplyScalar(sprinting()?80:22);const radial=planetUp(player,p),alt=player.distanceTo(p.center)-radius(p,radial);if(alt<ATMOSPHERE)evaVelocity.addScaledVector(radial,-7*dt);const delta=evaVelocity.clone().add(thruster).multiplyScalar(dt);player.copy(moveActor(player,delta,{up:radial,grounded:false}));const floor=floorProbe(player,radial,p,1.8,1);if(floor&&player.clone().sub(floor).dot(radial)<.15){player.copy(floor);eva=false;groundPlanet=p;station=null;evaVelocity.set(0,0,0);resetFootMotion();}return;}
const floor=floorProbe(world,up,inside||station?null:p,1.8,.8);if(onFootGround&&(!floor||world.clone().sub(floor).dot(up)>.35))onFootGround=false;const down=!!keys.Space;if(down&&!jumpWasDown&&onFootGround){jumpVelocity=6.8;onFootGround=false;jumpHeld=0;}jumpHeld=down?jumpHeld+dt:0;if(mobileJumpHeld&&!onFootGround&&jumpVelocity<=0)mobileJumpBoost=true;jetActive=down&&(mobileJumpHeld?mobileJumpBoost:jumpHeld>.24)&&!onFootGround&&jetFuel>0;if(jetActive){jetFuel=Math.max(0,jetFuel-dt*28);jumpVelocity=Math.min(9+jetLevel*2,jumpVelocity+dt*(21+jetLevel*2.5));if(particlesEnabled&&combatTime% .08<dt)particleBurst(world.clone().addScaledVector(up,-1.2),0x87ddec,3,2);}if(!onFootGround)jumpVelocity-=14*dt;else{jetFuel=Math.min(jetCapacity(),jetFuel+dt*20);jumpVelocity=0;}jumpWasDown=down;
if(onFootGround){const candidate=world.clone().add(move),support=floorProbe(candidate,up,inside||station?null:p,1.8,.32);if(!support||candidate.clone().sub(support).dot(up)>.30){onFootGround=false;jumpVelocity=-14*dt;}}const delta=move.addScaledVector(up,jumpVelocity*dt),intended=world.clone().add(delta),next=moveActor(world,delta,{up,p:inside||station?null:p,grounded:false});const correction=next.clone().sub(intended).dot(up);if(jumpVelocity>0&&correction<-.02)jumpVelocity=0;const support=floorProbe(next,up,inside||station?null:p,1.8,Math.max(1,Math.abs(jumpVelocity*dt)+.6));if(support&&jumpVelocity<=0&&next.clone().sub(support).dot(up)<.12&&next.clone().sub(support).dot(up)>-.4){next.copy(support);jumpVelocity=0;onFootGround=true;}else if(p&&!inside&&!station){const terrain=groundEye(next,p,1.8);if(next.clone().sub(terrain).dot(up)<0){next.copy(terrain);jumpVelocity=0;onFootGround=true;}}
if(inside){
  foot.copy(localPoint(next));
  const rel=foot.clone().sub(layout().entry);
  const rampDist=rel.dot(layout().normal);
  // Natural physical ramp walking: Player walks all the way down the 7m ramp deck slope.
  // When player reaches the bottom of the ramp (ramp length 7.2m) onto the ground:
  if(rampOpen && rampDist>=(layout().rampLength||7.0) && totalTime>transitionUntil){
    exitShip();
  }
}else{
  player.copy(next);
  // Unconditional physical terrain floor (prevents falling through grass/ground into limbo)
  if (p && !inside && !station) {
    const pNorm = planetUp(player, p);
    const minH = radius(p, pNorm) + 1.8;
    if (player.distanceTo(p.center) < minH) {
      player.copy(p.center).addScaledVector(pNorm, minH);
      jumpVelocity = Math.max(0, jumpVelocity);
      onFootGround = true;
    }
  }
  // Natural physical ramp walking: Player walks up the ramp slope and steps through the doorway
  const l=layout();
  const rel=localPoint(player).sub(l.entry);
  const rampDist=rel.dot(l.normal);
  if(rampOpen && inDoor(localPoint(player), 0.3) && rampDist<=0.3 && rampDist>=-2.0 && totalTime>transitionUntil){
    foot.copy(localPoint(player));
    inside=true;
    eva=false;
    transitionUntil=totalTime+0.6;
    toast('Você entrou na nave.');
  }
}}
