#!/usr/bin/env node
// Small source search: never loads embedded geometry or Three.js into an AI prompt.
const fs=require('fs'),path=require('path');
const query=process.argv.slice(2).join(' ');
if(!query){console.error('Usage: node tools/find.js functionName');process.exit(1);}
const src=path.join(__dirname,'../src'),files=JSON.parse(fs.readFileSync(path.join(src,'manifest.json'),'utf8'));
let matches=0;
for(const file of files){if(file.startsWith('generated/'))continue;const lines=fs.readFileSync(path.join(src,file),'utf8').split('\n');for(let i=0;i<lines.length;i++)if(lines[i].toLowerCase().includes(query.toLowerCase())){console.log(`src/${file}:${i+1}: ${lines[i].trim().slice(0,220)}`);matches++;}}
if(!matches)console.log('No matches.');
