const rover=new THREE.Group();box(rover,0,.7,0,2.8,1,4.2,0xe1ac65);box(rover,0,1.4,-.6,2,1,1.6,0x4b788a);for(let x of [-1.5,1.5])for(let z of [-1.4,1.4]){const wheel=mesh(new THREE.CylinderGeometry(.6,.6,.5,20),0x222e3b,rover,x,.3,z);wheel.rotation.z=Math.PI/2;}
buildShip();if(destinations.length>0)ship.position.copy(destinations[0].pos).add(V(0,2,0));
let mode='foot',started=false,landed=true,inside=true,foot=V(-3.5,1.9,-3.7),player=V(),groundPlanet=planets[0],station=null,yaw=0,pitch=0,flightSpeed=0,auto=null,target=0,credits=1200,cargo=0,mission=null,scanned=new Set(),mined=0,totalTime=0;
try{const save=JSON.parse(localStorage.getItem('horizonte-v1'));if(save){credits=save.credits||1200;scanned=new Set(save.scanned||[])}}catch{}
const keys={};let statusMessage='',messageUntil=0;
function toast(s){statusMessage=s;window.statusMessage=s;if(!s)return;soundCue(s);messageUntil=totalTime+4;if($('toast')){$('toast').textContent='';$('toast').style.display='none';}}
function save(){try{localStorage.setItem('horizonte-v1',JSON.stringify({credits,scanned:[...scanned],equipment,skyward:{currentSystem:{x:currentSystem.x,y:currentSystem.y},jetLevel,outfit,ownedOutfits,locker,recentEquipment,controls:controlPrefs,performance:{...performancePrefs,quality,particles:particlesEnabled}}}))}catch{}}
function nearest(pos){if(!planets||planets.length===0)return {r:1000,center:V(0,-999999,0),def:['ESPAÇO PROFUNDO','Vácuo','Vácuo',0,0,0x62d6cc,'',1000],i:0};return planets.reduce((a,p)=>pos.distanceTo(p.center)-p.r<pos.distanceTo(a.center)-a.r?p:a,planets[0]);}
function localPoint(world){return ship.worldToLocal(world.clone())}
function shipPoint(v){return ship.localToWorld(v.clone())}

window.getYaw = () => yaw;
window.getPitch = () => pitch;
window.setYaw = (v) => yaw = v;
window.setPitch = (v) => pitch = v;

window.loadPlanetSurface = loadPlanetSurface;
window.unloadPlanetSurface = unloadPlanetSurface;
window.shipTypes = shipTypes;
window.getYaw = () => yaw;
window.getPitch = () => pitch;
window.setYaw = (v) => yaw = v;
window.setPitch = (v) => pitch = v;

window.toast = toast;
