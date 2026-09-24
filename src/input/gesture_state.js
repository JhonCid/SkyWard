const touches=new Map(),pendingTaps={left:null,right:null};
let inputNow=()=>performance.now(),autoForward=false,shipLookOnly=false,aiming=false,aimOwner=null,aimBlend=0,mobileJumpHeld=false,mobileJumpBoost=false,jumpOwner=null,gestureMode='pilot',weaponPress=null,weaponItemPress=null,weaponInfoHeld=false;
let recentEquipment=['pistol','blade','tool'],cyclingEquipment=false,stripSignature='';
const steerPixels=V(),angularVelocity=V(),manualVelocity=V();
let thrustAcceleration=0,sideSpeed=0,liftSpeed=0,touchRoll=0,touchLift=0,manualWasActive=false;
const DOUBLE_MS=440,HOLD_MS=480,SECOND_HOLD_MS=170,DRAG_PX=10;
weaponDefs.tool={name:'Ferramenta de campo',damage:0,rate:.6,range:65};
function sprinting(){return !!keys.ShiftLeft||touchEnabled&&autoForward;}
function haptic(){try{navigator.vibrate?.(12);}catch{}}
function aimCapable(){return mode==='foot'&&!resting&&['pistol','rifle','shotgun','tool','grenade','unarmed'].includes(equipped);}

