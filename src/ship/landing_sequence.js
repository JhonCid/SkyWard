// === ARTICULATED LANDING GEARS & PROCEDURAL SHIP TILT ===
const landingGears = [];
let shipGearProgress = 1.0; // 1.0 = deployed (on ground), 0.0 = retracted (in flight)
let shipGearSuspension = 0.0; // Touchdown compression bounce
let takeoffGrace = 0.0;
let shipTiltPitch = 0, shipTiltRoll = 0, shipTiltYaw = 0;
const shipNavQuaternion = new THREE.Quaternion();
let landingSequence = null;
window.landingGears = landingGears;
window.getShipGearProgress = () => shipGearProgress;
window.getShipTilt = () => ({ pitch: shipTiltPitch, roll: shipTiltRoll, yaw: shipTiltYaw });
window.getLandingSequence = () => landingSequence;
window.getTakeoffGrace = () => takeoffGrace;

function finishLanding(pose,p,st){ship.position.copy(pose.pos);ship.quaternion.copy(pose.q);shipNavQuaternion.copy(pose.q);shipTiltPitch=shipTiltRoll=shipTiltYaw=0;landed=true;landingSequence=null;takeoffGrace=0;auto=null;flightSpeed=0;shipVelocity.set(0,0,0);manualVelocity.set(0,0,0);angularVelocity.set(0,0,0);thrustAcceleration=sideSpeed=liftSpeed=0;manualWasActive=false;if(inside||mode==='pilot'){groundPlanet=p||null;station=st||null;}openRamp(true,false);if(mode==='pilot'&&!thirdPerson){shipLookOnly=true;steerPixels.set(0,0,0);toast('Nave pousada · Câmera livre ativada. Decole para pilotar.');}}
function startLandingSequence(targetPose, p, st) {
  landingSequence = {
    active: true,
    targetPose,
    p,
    st,
    startPos: ship.position.clone(),
    startQ: ship.quaternion.clone(),
    elapsed: 0,
    duration: 3.0
  };
  auto = null;
  flightSpeed = 0;
  thrustAcceleration = 0;
  toast('Sequência de pouso iniciada · Trens de pouso estendendo…');
}

function land() {
  if (mode !== 'pilot' || boost || (landingSequence && landingSequence.active)) return;
  const p = nearest(ship.position);
  const n = planetUp(ship.position, p);
  const h = ship.position.distanceTo(p.center) - radius(p, n);
  const st = destinations.find(d => d.station && ship.position.distanceTo(d.pos) < 150);

  if (st) {
    const targetPose = landingPose(st.pos, null);
    startLandingSequence(targetPose, null, st.station);
    return;
  }

  if (h >= 95) {
    toast('Aproxime-se a menos de 90 m da superfície para pousar [F].');
    return;
  }

  // Find clear landing site with intelligent obstacle avoidance
  let targetPose = landingPose(ship.position, p);
  let clearSiteFound = !flightObstacle(ship.position, targetPose.pos);

  if (!clearSiteFound) {
    // Spiral search for nearest unobstructed, level landing zone
    toast('Detectada estrutura/obstrução no solo. Desviando para zona livre…');
    const base = frameAt(ship.position, p.center);
    const searchRadii = [18, 32, 50, 70];
    const searchAngles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];

    for (const r of searchRadii) {
      if (clearSiteFound) break;
      for (const a of searchAngles) {
        const offset = V(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(base);
        const candPos = ship.position.clone().add(offset);
        const candPose = landingPose(candPos, p);
        if (!flightObstacle(ship.position, candPose.pos)) {
          targetPose = candPose;
          clearSiteFound = true;
          break;
        }
      }
    }
  }

  if (!clearSiteFound) {
    toast('Superfície muito acidentada para pouso seguro. Nivele a nave.');
    return;
  }

  startLandingSequence(targetPose, p, null);
}

