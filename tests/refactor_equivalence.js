#!/usr/bin/env node
// Release audit for the lossless 0.1.41 -> 0.2.0 reorganization.
// Future gameplay changes should change behavior tests, not overwrite this historical hash.
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {assemble}=require('../build');
const root=path.join(__dirname,'..'), baseline=require('./baseline.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const normalize=s=>s.replace(/const VERSION='[^']+'/g,"const VERSION='BASELINE'");
const {html,version,manifest}=assemble();
assert.equal(version,'0.2.0');
assert.equal(sha(normalize(html)),baseline.normalizedHTMLSha256,'Output changed beyond VERSION');
assert.equal(sha(fs.readFileSync(path.join(root,'assets/Atlas_v3.glb'))),baseline.atlasGLBSha256);
assert.equal(sha(fs.readFileSync(path.join(root,'src/shell/three.min.js'))),baseline.threeSha256);
assert.equal(fs.readFileSync(path.join(root,'SkyWard.html'),'utf8'),html,'Stale generated HTML');
assert.equal(fs.readFileSync(path.join(root,'SkyWard-v0.2.0.html'),'utf8'),html);
const active=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(item.name.endsWith('.js'))active.push(path.relative(path.join(root,'src'),p).split(path.sep).join('/'));}}
walk(path.join(root,'src'));
assert.deepEqual(active.filter(x=>!x.startsWith('shell/')).sort(),[...manifest].sort(),'Unlisted or missing active source');
console.log('PASS v0.2.0 HTML equals v0.1.41 byte for byte except VERSION; model and engine unchanged.');
console.log(`HTML: ${baseline.sourceHTMLBytes} -> ${Buffer.byteLength(html)} bytes.`);
