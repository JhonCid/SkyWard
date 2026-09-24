function flightObstacle(a,b){
 const delta=b.clone().sub(a),len=delta.length();if(len<.01)return null;
 const atlas=layout().atlas,margin=atlas?65:25,dir=delta.clone().normalize();
 const candidates=queryStatic(a,len+margin).filter(body=>!body.torus&&!body.obj.userData.surfaceOnly&&body.bounds.getSize(V()).y>3.5&&body.world.distanceToPoint(a)<len+margin);
 const offsets=atlas?[V(),V(-34,0,24),V(34,0,24),V(-20,0,8),V(20,0,8),V(0,1,-42),V(0,0,36)]:[V()];let nearestHit=null,best=len;
 for(const off of offsets){const origin=a.clone().add(off.applyQuaternion(ship.quaternion)),ray=new THREE.Ray(origin,dir);
  for(const body of candidates){const hit=ray.intersectBox(body.world.clone().expandByScalar(atlas?2:(shipType===2?6:4)),V());if(hit){const d=origin.distanceTo(hit);if(d<best&&d>.05){best=d;nearestHit=a.clone().addScaledVector(dir,Math.max(0,d-1));}}}
 }return nearestHit;
}

function autoDestination() {
  if (!auto) return null;
  if (auto.gate) {
    autoGate = gates[auto.gate - 1] || null;
    return auto;
  }
  autoGate = null;
  return auto;
}


// === CARGO STORAGE (MARKET & REFINERY REMOVED) ===
function getTotalCargo() {
  return mission?.type === 'cargo' ? 4 : 0;
}

function toggleHeadlights() {
  if (typeof cycleHeadlightMode === 'function') {
    cycleHeadlightMode();
  } else {
    shipHeadlightsActive = !shipHeadlightsActive;
    const spotIntensity = shipHeadlightsActive ? 16.0 : 0;
    if (shipHeadlightL) shipHeadlightL.intensity = spotIntensity;
    if (shipHeadlightR) shipHeadlightR.intensity = spotIntensity;
    if (roverHeadlight) roverHeadlight.intensity = shipHeadlightsActive ? 8.0 : 0;
    if (typeof shipExteriorLights !== 'undefined') {
      for (const item of shipExteriorLights) {
        if (item.light) item.light.intensity = shipHeadlightsActive ? item.onIntensity : 0;
        if (item.material) item.material.emissiveIntensity = shipHeadlightsActive ? (item.onEmissive || 1.8) : 0.05;
      }
    }
  }
  toast(shipHeadlightsActive ? 'Faróis e luzes externas ativados.' : 'Faróis e luzes externas desligados.');
}
window.toggleHeadlights = toggleHeadlights;
window.isHeadlightsActive = () => shipHeadlightsActive;
window.shipCommodities = shipCommodities;
window.reputation = reputation;
window.getTotalCargo = getTotalCargo;
window.VERSION = VERSION;
window.suns = suns;

window.shipInteractables = shipInteractables;

let vehicleCamIdleTime = 0, footFreeCam = false, footCamIdleTime = 0, footOrbitYaw = 0;
window.getFootFreeCam = () => footFreeCam;
window.setFootFreeCam = v => footFreeCam = v;
window.getFootOrbitYaw = () => footOrbitYaw;
window.setFootOrbitYaw = v => footOrbitYaw = v;
window.getVehicleCamIdleTime = () => vehicleCamIdleTime;
window.setVehicleCamIdleTime = v => vehicleCamIdleTime = v;
window.getFootCamIdleTime = () => footCamIdleTime;
window.setFootCamIdleTime = v => footCamIdleTime = v;

window.setResting = v => resting = v;

let smoothRoverCamTarget = null, vehicleCamYaw = 0, lastFootWalkAngle = 0;
window.getVehicleCamYaw = () => vehicleCamYaw;
window.setVehicleCamYaw = v => vehicleCamYaw = v;
window.getSmoothRoverCamTarget = () => smoothRoverCamTarget;

window.settlements = settlements;

window.storeDefs = storeDefs;
window.products = products;

window.equipment = equipment;

let grenadeThrowing = false, grenadeThrowStartTime = 0, grenadeThrowDuration = 0.85;
window.getGrenadeThrowing = () => grenadeThrowing;
window.setGrenadeThrowing = v => { grenadeThrowing = v; };
let footFreeCamMoveAngle = null;

function atPort(){
  const pos = controlledPosition();
  return destinations.find(d => !d.gate && d.kind !== 'water' && pos.distanceTo(d.pos) < (d.settlement ? d.settlement.half * 1.5 : 120));
}
function boardingAction(){
  if(mode === 'pilot'){ interact(); exitShip(); } else boardShip();
}
window.atPort = atPort;
window.boardingAction = boardingAction;
