function planetLocalNormal(p, worldN) {
  if (!p) return worldN;
  const angle = (p.spinAngle || 0);
  if (Math.abs(angle) < 1e-6) return worldN;
  return worldN.clone().applyAxisAngle(UP, -angle);
}
window.planetLocalNormal = planetLocalNormal;

const $=id=>document.getElementById(id), V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z), UP=V(0,1,0), clock=new THREE.Clock();
const mobileDevice=(typeof navigator!=='undefined'&&(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&innerWidth<1300)))||(typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches);
const shops=[],enemies=[],projectiles=[],combatParticles=[];
let touchEnabled=!!mobileDevice,quality=mobileDevice?'low':'high',particlesEnabled=true,touchX=0,touchY=0,firing=false,recoil=0,lastShot=-10,reloadUntil=0,combatTime=0,lastHurt=-100,ambushAt=180,enemySerial=0,damageFlash=0,activeShop=null,threat=null,weaponView=null,ambientDust=null;
let health=100,suitShield=50,hull=320,shipShield=140,vehicleHealth=150,vehicleKind='rover',equipped='unarmed';
const equipment={weapons:['pistol','rifle','shotgun','blade','sabre'],ships:[0],vehicles:['rover'],ammo:140,grenades:3,medkits:3};
const magazines={pistol:15,rifle:30,shotgun:8};
