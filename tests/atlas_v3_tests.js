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
global.localStorage = { getItem: () => null, setItem: () => {} };
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
eval(html.substring(s2 + '<script>'.length, e2));


const assert=require('assert');
const t=window.__test,a=window.__atlasTest,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name);}
t.ship.position.set(0,0,0);t.ship.quaternion.identity();t.setMode('pilot');t.setInside(true);t.getFoot().copy(window.layout().spawn);a.prepare();
test('Atlas default and named authored parts',()=>{assert(t.ship.userData.atlasV3);assert.equal(a.rig.nodes.size,129);assert.equal(a.rig.doors.length,6);assert.equal(window.landingGears.length,3);});
test('Cockpit original surfaces expose all five commands',()=>{assert.deepEqual([...new Set(window.cockpit3DButtons.map(o=>o.userData.action))].sort(),['brake','land','lights','map','ramp']);});
test('Full ramp cycle: telescopes shrink, retain anchors, carry rover',()=>{t.openRamp(true,true);let previous=a.rig.pistons[0].length;const opened=previous;t.openRamp(false,false);for(let i=0;i<120;i++){a.stepRamp(1/60);const p=a.rig.pistons[0];assert(p.length<=previous+1e-7);previous=p.length;for(const part of [p.sleeve,p.rod]){assert(part.scale.y>0);assert(part.scale.y<p.length);assert(Number.isFinite(part.position.y));}}assert(previous<opened);assert(Math.abs(t.rover.position.y-.33)<.03);assert(Math.abs(a.rig.ramp.rotation.x+a.config.angle)<1e-7);t.openRamp(true,true);assert(Math.abs(t.rover.position.y+2.272)<.05);});
test('Six doors open, remove collision, close and restore authored coordinates',()=>{for(const d of a.rig.doors){d.open=true;a.stepDoor(d,2);assert.equal(d.progress,1);assert(d.o.userData.removed);d.open=false;a.stepDoor(d,2);assert.equal(d.progress,0);assert(!d.o.userData.removed);for(const p of d.leaves)assert.equal(p.o.position[p.axis],0);}});
test('Collider follows triangles rather than the hollow hull bounding box',()=>{a.refresh();const eye=V(0,2.17,4);const next=a.move(eye,V(0,0,-.4),{up:V(0,1,0),grounded:false});console.log('corridor contact',next.toArray());assert(next.distanceTo(eye.clone().add(V(0,0,-.4)))<.05);});
test('Deck and full ramp provide continuous foot support',()=>{a.refresh();for(const z of [10.8,12,16,20,24,27]){const y=.33-Math.max(0,z-11)*Math.tan(a.config.angle);const eye=V(0,y+1.84,z);const floor=a.floor(eye,V(0,1,0),null,1.8,.7);console.log('support',z,floor?.toArray());assert(floor,'floor at '+z);assert(Math.abs(floor.y-eye.y)<.15,'height at '+z);}});
test('Cargo opening gives rover clear overhead space throughout ramp cycle',()=>{t.setMode('pilot');t.ship.add(t.rover);t.rover.position.copy(window.layout().rover);const state=t.ship.getObjectByName('door').userData;const decks=[];t.ship.traverse(o=>{if(o.isMesh&&/Interior_Deck_Flooring|CargoBay_Gantry|Cabin_Airtight/.test(o.name))decks.push(o);});for(let i=0;i<=20;i++){state.progress=i/20;state.target=i/20;a.stepRamp(0);t.ship.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(t.rover);const ray=new THREE.Raycaster(V(0,box.min.y+.15,20),V(0,1,0),0,box.max.y-box.min.y-.15);const hits=ray.intersectObjects(decks,false);assert.equal(hits.length,0,'roof clearance at '+i+': '+hits.map(h=>h.object.name));}t.openRamp(true,true);});
test('Rover exits at actual ramp tip and remains blocked when ramp closed',()=>{t.openRamp(false,true);a.drive(V(0,0,40),t.rover.position.clone());assert.equal(t.rover.parent,t.ship);assert(t.rover.position.z<29);t.openRamp(true,true);a.drive(V(0,0,28),t.rover.position.clone());assert.notEqual(t.rover.parent,t.ship);});
test('Three imported landing gears retract and deploy',()=>{t.setLanded(false);a.gear(2);assert(window.landingGears.every(g=>!g.g.visible));t.setLanded(true);a.gear(2);assert(window.landingGears.every(g=>g.g.visible&&g.g.scale.y===1));});

test('Player can approach and cross each opened doorway',()=>{t.ship.add(t.rover);t.rover.position.copy(window.layout().rover);t.setMode('foot');t.setInside(true);for(const d of a.rig.doors){d.open=true;a.stepDoor(d,2);}a.refresh();for(const d of a.rig.doors){const center=d.doorPoint.clone();center.y=d.label.includes('Cockpit')?2.615:2.17;const start=center.clone().addScaledVector(d.normal,.55),delta=d.normal.clone().multiplyScalar(-1.1);const result=a.move(start,delta,{up:V(0,1,0),grounded:false});console.log('door clearance',d.label,'start',start.toArray(),'result',result.toArray(),result.distanceTo(start.clone().add(delta)).toFixed(3));assert(result.distanceTo(start.clone().add(delta))<.4,d.label);}});
test('Both cockpit risers are walkable without jumping',()=>{a.refresh();let pos=V(0,2.175,-22.4);for(let i=0;i<42;i++)pos=a.move(pos,V(0,0,-.1),{up:V(0,1,0),grounded:true});console.log('cockpit access',pos.toArray());assert(pos.z<-26.4);assert(pos.y>2.9);});
test('Pistons never intersect hull or ramp throughout animation',()=>{t.setMode('pilot');t.openRamp(true,true);const meshes=[];t.ship.traverse(o=>{if(o.isMesh&&o.userData.atlasSurface&&!o.material.transparent&&!/Hazard|Screen|Guidance|Lights/.test(o.name))meshes.push(o);});const state=t.ship.getObjectByName('door').userData;for(let i=0;i<=60;i++){state.progress=i/60;state.target=i/60;a.stepRamp(0);t.ship.updateMatrixWorld(true);for(const p of a.rig.pistons)for(const obj of [p.sleeve,p.rod]){const len=obj.scale.y;for(let k=0;k<8;k++){const radial=V(Math.cos(k*Math.PI/4)*.075,0,Math.sin(k*Math.PI/4)*.075).applyQuaternion(obj.quaternion);const dir=V(0,1,0).applyQuaternion(obj.quaternion);const start=obj.position.clone().add(radial).addScaledVector(dir,-len/2+.015);const ray=new THREE.Raycaster(start,dir,.005,len-.03);const hits=ray.intersectObjects(meshes,false);assert.equal(hits.length,0,'piston collision at '+i+': '+hits.map(h=>h.object.name).join(','));}}}t.openRamp(true,true);});
console.log(checks+' Atlas integration checks passed.');process.exit(0);
