#!/usr/bin/env node
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
// These rules must work without DOM, Three.js, renderer or game startup.
const files=['core/random.js','core/galaxy_graph.js','data/system_names.js','core/system_names.js','data/planets.js','core/planet_definitions.js'];
const code=files.map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const context=vm.createContext({});vm.runInContext(code,context);
const evaluate=expression=>vm.runInContext(expression,context);
assert.equal(evaluate('getSystemName(0,0)'),'ÉOS');
assert.equal(evaluate('getSystemName(1,0)'),'NYX');
assert.equal(evaluate('getPlanetDefs(0,0)[0][0]'),'VÉRDEA');
assert.equal(evaluate('getPlanetDefs(1,0)[0][0]'),'MYCELIA');
assert(evaluate(`(()=>{for(let x=-20;x<=20;x++)for(let y=-20;y<=20;y++){
  const source={x,y}, ns=getSystemNeighbors(x,y);
  if(ns.length<2||ns.length>4)return false;
  for(const dest of ns){const back=getSystemNeighbors(dest.x,dest.y)[getTargetGateIndex(source,dest)];if(back.x!==x||back.y!==y)return false;}
  const planets=getPlanetDefs(x,y);if(planets.length!==3||planets.some(p=>p.length!==10))return false;
  if(JSON.stringify(planets)!==JSON.stringify(getPlanetDefs(x,y)))return false;
}return true;})()`));
assert(evaluate(`(()=>{const a=rng(42),b=rng(42);for(let i=0;i<1000;i++){const n=a();if(n!==b()||n<0||n>=1)return false;}return true;})()`));
console.log('PASS pure rules: 1,681 systems with reciprocal gates, deterministic planets and seeded random.');
