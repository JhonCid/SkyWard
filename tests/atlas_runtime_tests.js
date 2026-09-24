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
window.startLoadingGame();
setTimeout(()=>{try{
 const t=window.__test,a=window.__atlasTest,V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
 window.closeMenu();t.setMode('foot');t.setInside(true);t.getFoot().copy(window.layout().spawn);
 for(let i=0;i<30;i++)t.update(1/60);
 assert(t.getFoot().distanceTo(window.layout().spawn)<.7,'spawn stays on deck');
 console.log('PASS full world loads and player remains on Atlas deck');
 t.setMode('rover');t.setInside(true);t.ship.add(t.rover);t.rover.position.copy(window.layout().rover);t.rover.rotation.set(-a.config.angle,Math.PI,0);t.openRamp(true,true);
 pressKey('KeyW');for(let i=0;i<180&&t.rover.parent===t.ship;i++)t.update(1/60);releaseKey('KeyW');
 assert.notEqual(t.rover.parent,t.ship,'rover drives out through full ramp');
 console.log('PASS WASD drives rover through ramp onto ground');
 const local=V(0,.33-9*Math.tan(a.config.angle),20),world=t.ship.localToWorld(local.clone());t.rover.position.copy(world);t.rover.quaternion.copy(t.ship.quaternion);t.setInside(false);t.setMode('rover');t.update(.001);
 assert.equal(t.rover.parent,t.ship,'rover boards from ramp');assert(t.getInside());
 console.log('PASS rover returns onto ramp and attaches without teleporting');
 window.leaveSeatGesture();assert.equal(t.getMode(),'foot');assert(t.getInside());assert(Math.abs(t.getFoot().y-(t.rover.position.y+1.84))<.05);
 console.log('PASS exiting rover positions player above moving ramp');
 t.recall();t.openRamp(false,false);for(let i=0;i<130;i++)t.update(1/60);
 assert(t.ship.getObjectByName('door').userData.progress<.001,'ramp closes from cockpit');assert.equal(t.rover.parent,t.ship);
 assert(Math.abs(t.rover.position.y-.33)<.03,'rover rests on closed deck');
 console.log('PASS cockpit closes ramp and retains rover');
 const before=t.rover.getWorldPosition(V());const offset=V(100,30,-20);t.ship.position.add(offset);t.ship.updateMatrixWorld(true);const after=t.rover.getWorldPosition(V());assert(after.distanceTo(before.add(offset))<1e-5);
 console.log('PASS rover travels with ship');
 console.log('6 loaded-game checks passed.');process.exit(0);
 }catch(e){console.error(e);process.exit(1);}},800);
