const VERSION='0.3.2',settlements=[],traffic=[],planetLODs=[],shipInteractables=[],cockpit3DButtons=[];let targetedCockpitButton=null;
const settlementProfiles=[{cities:2,villages:3},{cities:1,villages:1},{cities:0,villages:1},{cities:1,villages:2},{cities:1,villages:2},{cities:0,villages:0}];
let camBobPhase = 0, camLandDip = 0, camWasGrounded = true, camMeleeShake = 0;
let thirdPerson=false,avatar=null,resting=null,jumpVelocity=0,jetFuel=100,jumpHeld=0,jumpWasDown=false,onFootGround=true,jetActive=false,footContext='',activeLocker=null,lodTimer=0;
const outfitColors={explorer:0x78a9b5,ranger:0x879b67,engineer:0xd7a267,arctic:0xd6dfe2,night:0x5d6284};
let outfit='explorer',jetLevel=0,ownedOutfits=['explorer'];
const locker={ammo:0,grenades:0,medkits:0};
const staticGrid=new Map();let gridReady=false;
const statV05={planetTriangles:0,visibleSettlements:0,visibleTraffic:0};
function jetCapacity(){return [100,150,210][jetLevel];}
function planetUp(pos,p){if(!p||!p.center)return V(0,1,0);return pos.clone().sub(p.center).normalize();}
