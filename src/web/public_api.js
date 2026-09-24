window.getAiming = () => aiming; window.getFiring = () => firing; window.setAiming = (v) => { aiming = v; }; window.setFiring = (v) => { firing = v; };
window.switchCandidate = switchCandidate; window.useShipInterior = useShipInterior; window.standUp = standUp; window.getResting = () => resting; window.getInside = () => inside; window.setInside = (v) => inside = v;
window.menu=menu;window.layout=layout;window.lookInput=lookInput;window.closeMenu=closeMenu;window.debugState=()=>({mode,inside,landed,eva,guideEnabled,shipType,boost:!!boost,credits,mission,planets:planets.length,animals:animals.length,npcs:npcs.length,position:ship.position.toArray(),roverOnboard:rover.parent===ship,auto:!!auto,shipLookOnly});window.currentSystem=currentSystem;window.loadSystem=loadSystem;window.loadSystemInSpace=loadSystemInSpace;window.loadPlanetSurface=loadPlanetSurface;window.unloadPlanetSurface=unloadPlanetSurface;window.gates=gates;window.triggerBoost=triggerBoost;window.leaveSeatGesture=leaveSeatGesture;window.aquaticDriveSpeed=aquaticDriveSpeed;window.getRoverLookOnly=()=>roverLookOnly;window.axisForward=axisForward;window.getAutoForward=()=>autoForward;window.__test={camera,scene,sunlight,getBoost:()=>boost,ship,rover,planets,destinations,gates,currentSystem,loadSystem,loadSystemInSpace,loadPlanetSurface,unloadPlanetSurface,triggerBoost,interact,scan,land,update,getPlayer:()=>player,getFoot:()=>foot,setTarget:i=>target=i,getMode:()=>mode,setMode:m=>mode=m,getLanded:()=>landed,setLanded:l=>landed=l,getSideSpeed:()=>sideSpeed,getLiftSpeed:()=>liftSpeed,getAngularVelocity:()=>angularVelocity,recall,getThirdPerson:()=>thirdPerson,getInside:()=>inside,setInside:(v)=>inside=v,switchCandidate,useShipInterior,standUp,getResting:()=>resting,setThirdPerson:v=>thirdPerson=v,setAiming:v=>{aiming=v;},getAiming:()=>aiming,getFiring:()=>firing,setFiring:v=>{firing=v;},npcs,traffic,getNpcs:()=>npcs,getTraffic:()=>traffic,openRamp:(o,q)=>openRamp(o,q),finishLanding:(pose,p,st)=>finishLanding(pose,p,st)};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

function terminalSelectShip(i) {
  shipType = 0;
  toast('Atlas é sua nave oficial na plataforma.');
  renderPanel('hangarTerminal');
}
window.terminalSelectShip = terminalSelectShip;

function terminalSelectVehicle(kind) {
  vehicleKind = 'rover';
  toast('Rover de exploração está preparado na garagem.');
  renderPanel('hangarTerminal');
}
window.terminalSelectVehicle = terminalSelectVehicle;

function toggleFootFreeCam() {
  footFreeCam = !footFreeCam;
  footOrbitYaw = 0;
  footCamIdleTime = 0;
  toast(footFreeCam ? 'Câmera orbital livre (a pé) ativada.' : 'Câmera direcional padrão (a pé) ativada.');
}
window.toggleFootFreeCam = toggleFootFreeCam;

window.setRoverLookOnly = (v) => { roverLookOnly = v; };
window.getVehicleCamYaw = () => (typeof vehicleCamYaw !== 'undefined' ? vehicleCamYaw : 0);

window.getShipLookOnly = () => shipLookOnly;
window.setShipLookOnly = (v) => { shipLookOnly = v; };

window.waterCarve = waterCarve;

window.__atlasTest={get rig(){return atlasRig;},config:ATLAS,stepRamp:updateAtlasGate,stepDoor:updateAtlasDoor,refresh:refreshMovingBodies,move:moveActor,floor:floorProbe,placeRover:atlasPlaceRover,drive:atlasRoverMove,point:atlasPoint,getBodies:()=>movingBodies,push:spherePush,prepare:()=>{collisionReady=true;remodelRover();refreshMovingBodies();},gear:updateLandingGears};
