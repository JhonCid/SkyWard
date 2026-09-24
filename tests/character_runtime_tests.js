#!/usr/bin/env node
/**
 * SkyWard CI / Automated Headless Regression Test Suite
 * Runs all system verification tests in headless simulation.
 */
const fs = require('fs');
const path = require('path');

global.window = global;
global.innerWidth = 1920;
global.innerHeight = 1080;
global.devicePixelRatio = 1;
const mockCtx = {
  createRadialGradient: () => ({ addColorStop: () => {} }),
  fillRect: () => {}, clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
  stroke: () => {}, strokeRect: () => {}, arc: () => {}, fill: () => {}, fillText: () => {},
};

let pointerDownCbs = [], pointerUpCbs = [], mouseDownCbs = [], mouseUpCbs = [], auxClickCbs = [], keydownCbs = [], keyupCbs = [];
global.addEventListener = (ev, cb) => {
  if (ev === 'keydown') keydownCbs.push(cb);
  if (ev === 'keyup') keyupCbs.push(cb);
  if (ev === 'mousedown') mouseDownCbs.push(cb);
  if (ev === 'mouseup') mouseUpCbs.push(cb);
  if (ev === 'auxclick') auxClickCbs.push(cb);
  if (ev === 'pointerdown') pointerDownCbs.push(cb);
  if (ev === 'pointerup') pointerUpCbs.push(cb);
};
global.removeEventListener = () => {};

function pressKey(code) { keydownCbs.forEach(cb => cb({ code, preventDefault: () => {} })); }
function releaseKey(code) { keyupCbs.forEach(cb => cb({ code, preventDefault: () => {} })); }

let canvasListeners = {};
const canvasMock = {
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  addEventListener: (ev, cb) => { (canvasListeners[ev] = canvasListeners[ev] || []).push(cb); },
  removeEventListener: () => {}, setAttribute: () => {}, getContext: () => mockCtx,
  setPointerCapture: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 })
};

const elements = new Map();
function getOrCreate(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id, style: {},
      classList: {
        _classes: new Set(id === 'startMenu' ? [] : ['hidden']),
        add: function(c) { this._classes.add(c); },
        remove: function(c) { this._classes.delete(c); },
        toggle: function(c, force) {
          if (force === undefined) {
            if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c);
          } else if (force) this._classes.add(c); else this._classes.delete(c);
        },
        contains: function(c) { return this._classes.has(c); }
      },
      textContent: '', innerHTML: '', dataset: {},
      addEventListener: () => {}, removeEventListener: () => {}, getContext: () => mockCtx, setPointerCapture: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
    });
  }
  return elements.get(id);
}

global.document = {
  createElement: (tag) => (tag === 'canvas' ? canvasMock : {
    style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, setAttribute: () => {}, getContext: () => mockCtx,
  }),
  createElementNS: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false } }),
  body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} }, prepend: () => {}, appendChild: () => {} },
  getElementById: (id) => getOrCreate(id),
  exitPointerLock: () => {}
};
global.localStorage = { getItem: key => key==='skyward-character-system'&&process.env.SKYWARD_TEST_LEGACY?'legacy':null, setItem: () => {} };
let simulatedTime = 1000;
global.performance = { now: () => simulatedTime };
global.requestAnimationFrame = () => 1;

const htmlPath = path.join(__dirname, '..', 'SkyWard.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const s1 = html.indexOf('<script>');
const s2 = html.indexOf('<script>', s1 + 1);
const e1 = html.indexOf('</script>');
const e2 = html.lastIndexOf('</script>');

eval(html.substring(s1 + '<script>'.length, e1));
global.THREE = module.exports;
global.THREE.WebGLRenderer = function() {
  return { setSize: () => {}, setPixelRatio: () => {}, setClearColor: () => {}, setViewport: () => {}, setScissor: () => {}, setScissorTest: () => {}, clear: () => {}, render: () => {}, domElement: canvasMock, shadowMap: {} };
};
global.__strikeSounds=[];
eval(html.substring(s2 + '<script>'.length, e2).replace('function playWeaponSound(id) {', 'function playWeaponSound(id) { window.__strikeSounds.push({kind:id,time:window.characterAnimation?.player?.time});'));

const assert=require('assert');
window.startLoadingGame();
setTimeout(()=>{try{
 const t=window.__test,C=window.SkywardCharacters;
 window.closeMenu();t.setMode('foot');t.setInside(true);t.setThirdPerson(true);t.getFoot().copy(window.layout().spawn);
 for(let i=0;i<10;i++)t.update(1/60);
 let s=window.characterAnimation.player;
 if(process.env.SKYWARD_TEST_LEGACY){assert(!s);assert(!window.characterAnimation.enabled);pressKey('KeyW');for(let i=0;i<30;i++)t.update(1/60);releaseKey('KeyW');console.log('PASS legacy fallback loads and moves with original procedural avatar.');process.exit(0);}
 assert(s&&s.config.player&&s.config.sex==='male'&&s.config.helmet);
 assert(s.meshes.every(m=>m.isSkinnedMesh));
 pressKey('KeyW');for(let i=0;i<45;i++)t.update(1/60);releaseKey('KeyW');
 assert([...s.actions].some(([name,a])=>name.includes('Walk_Loop')&&a.getEffectiveWeight()>.1));
 const shipBefore=t.ship.position.clone(),footBefore=t.getFoot().clone();
 for(let i=0;i<30;i++)C.update(s,1/60,{speed:5,grounded:false,jet:true,vertical:3});
 assert(t.ship.position.equals(shipBefore));assert(t.getFoot().equals(footBefore));
 window.equipWeapon('rifle');t.setAiming(true);for(let i=0;i<30;i++)t.update(1/60);t.setAiming(false);
 assert(window.getAvatarWeapon().parent===s.byName.hand_r);
 assert([...s.actions].some(([name,a])=>name.includes('Pistol_Aim_Neutral:upper')&&a.getEffectiveWeight()>.1));
 function capture(name,frame=window.getAvatar(),extras=[]){
   if(!process.argv.includes('--poses'))return;
   const root=window.getAvatar();root.updateMatrixWorld(true);frame.updateMatrixWorld(true);s.skeleton.update();const inv=frame.matrixWorld.clone().invert(),parts=[];
   function mesh(m){if(!m.isMesh)return;for(let parent=m;parent&&parent!==root.parent;parent=parent.parent)if(!parent.visible)return;const p=m.geometry.attributes.position,ix=m.geometry.index,vertices=[];for(let k=0;k<(ix?ix.count:p.count);k++){const i=ix?ix.getX(k):k,v=new THREE.Vector3().fromBufferAttribute(p,i);if(m.isSkinnedMesh)m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld).applyMatrix4(inv);vertices.push(v.toArray());}parts.push({vertices,color:m.material.color.toArray()});}
   root.traverse(mesh);extras.forEach(mesh);
   const out=path.join(__dirname,'../docs/character-poses');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(parts));
 }
 capture('male-aim');
 t.setAiming(true);window.lookInput(0,-600);for(let i=0;i<45;i++)t.update(1/60);capture('male-aim-up');window.lookInput(0,1200);for(let i=0;i<45;i++)t.update(1/60);capture('male-aim-down');window.lookInput(0,-600);t.setAiming(false);
 window.makeAvatar();s=window.characterAnimation.player;assert(s&&s.meshes.length);for(let i=0;i<10;i++)t.update(1/60);
 const npc=t.npcs.find(n=>n.g.userData.character);assert(npc,'rigged NPC generated in actual world');
 assert(npc.g.userData.character.bones[0]!==s.bones[0]);
 C.setLOD(npc.g.userData.character,2);assert.equal(npc.g.userData.character.lod,2);
 // Regressions in the actual game's combat clock, rather than only mixer calls.
 const strikeSounds=global.__strikeSounds;strikeSounds.length=0;
 window.equipWeapon('unarmed');t.setFiring(true);
 const strikes=[];let previousUntil=null;
 for(let i=0;i<150;i++){t.update(1/60);const f=s.forced;if(f&&f.until!==previousUntil){strikes.push({name:f.name,at:s.time,until:f.until});previousUntil=f.until;}}
 t.setFiring(false);assert(strikes.length>=3,'held attack should chain');
 for(let i=1;i<strikes.length;i++){assert.notEqual(strikes[i].name,strikes[i-1].name,'alternate punching hands');assert(strikes[i].at>=strikes[i-1].until-.04,'do not restart a running strike');}
 for(let i=0;i<60;i++)t.update(1/60);
 const punchSounds=strikeSounds.filter(e=>e.kind==='unarmed');assert.equal(punchSounds.length,strikes.length);
 for(let i=0;i<strikes.length;i++){const fraction=strikes[i].name==='Punch_Jab'?.24:.30;assert(Math.abs(punchSounds[i].time-(strikes[i].until-.48+.48*fraction))<.06,'sound must align with punch extension');}

 window.equipWeapon('sabre');t.setFiring(true);const cuts=[];let cutUntil;
 for(let i=0;i<100;i++){t.update(1/60);if(s.forced&&s.forced.until!==cutUntil){cuts.push(s.forced.name);cutUntil=s.forced.until;}
 if(i===15)capture('male-sword-a');if(i===55)capture('male-sword-b');
 const grip=window.getAvatarWeapon().localToWorld(new THREE.Vector3(0,0,.12*.88)),palm=s.byName.hand_r.localToWorld(new THREE.Vector3(0,.09,0));assert(grip.distanceTo(palm)<.0001,'sword grip detached from palm');}
 t.setFiring(false);assert(cuts.includes('Sword_Regular_A')&&cuts.includes('Sword_Regular_B'));for(let i=0;i<60;i++)t.update(1/60);
 window.getEquipment().grenades=5;window.equipWeapon('grenade');pressKey('KeyW');
 for(let attempt=0;attempt<2;attempt++){window.firePlayer();assert.equal(s.forced?.name,'OverhandThrow');assert.equal(s.forced?.mask,'upper');for(let i=0;i<90;i++)t.update(1/60);assert(!window.getGrenadeThrowing(),'throw state must expire');}releaseKey('KeyW');
 window.equipWeapon('pistol');for(let i=0;i<40;i++)t.update(1/60);
 const effectsBefore=window.getTransientFX().length;window.firePlayer();assert.equal(window.getTransientFX().length,effectsBefore,'no shot before ready');
 let emitted=false;for(let i=0;i<35;i++){t.update(1/60);if(window.getTransientFX().length>effectsBefore)emitted=true;}assert(emitted,'tap must fire once after raise');
 t.setMode('rover');for(let i=0;i<40;i++)t.update(1/60);
 const roverHip=t.rover.worldToLocal(s.byName.pelvis.getWorldPosition(new THREE.Vector3()));assert(Math.abs(roverHip.y-.60)<.015,'pelvis must rest over the rover cushion');
 for(const side of ['l','r']){const ankle=t.rover.worldToLocal(s.byName['foot_'+side].getWorldPosition(new THREE.Vector3()));assert(ankle.y>.50&&ankle.y<.58,'driver feet must stay above cabin floor');}
 const seatMeshes=[];t.rover.traverse(m=>{if(m.isMesh&&[0x22303c,0x19242d].includes(m.material.color?.getHex()))seatMeshes.push(m);});capture('male-rover-seat',t.rover,seatMeshes);
 t.setMode('pilot');for(let i=0;i<40;i++)t.update(1/60);const shipHip=t.ship.worldToLocal(s.byName.pelvis.getWorldPosition(new THREE.Vector3()));assert(Math.abs(shipHip.y-(window.layout().seat.y+.08))<.015,'pelvis must use Atlas seat height');capture('male-pilot-seat');
 t.setMode('foot');t.setInside(true);t.getFoot().copy(window.layout().spawn);t.update(1/60);assert(!s.forced,'vehicle exit must not play getting up');
 console.log('PASS combat regressions: alternating completed punches, moving repeat throws and delayed hip-fire.');
 const snap=window.debugState();assert.equal(typeof snap.credits,'number');assert(t.getInside());
 console.log('PASS integrated player/NPC rigs, locomotion, upper-body aiming, hand attachment, avatar rebuild, LOD and visual-only displacement.');
 process.exit(0);
 }catch(e){console.error(e);process.exit(1);}},800);

