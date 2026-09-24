#!/usr/bin/env node
const {spawnSync}=require('child_process');
const path=require('path');
for(const file of ['../build.js','core_rules.js','character_assets.js','tripo_player.js','character_regressions.js','atlas_v3_tests.js','atlas_runtime_tests.js','character_runtime_tests.js']){
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
console.log('All checks passed: pure rules, character assets/runtime and 18 Atlas/gameplay checks.');
