const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
// Execute the local engine; do not inspect or duplicate its implementation.
const THREE=require('../src/shell/three.min.js');
const context=vm.createContext({THREE,window:{},atob,console});
for(const f of ['generated/characters.js','player/character_rig.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),context);
const C=context.window.SkywardCharacters;
assert.equal(C.asset.bones.length,65);assert.equal(C.asset.animations.length,85);
const male=C.create({player:true,helmet:true}),female=C.create({sex:'female'}),npc=C.create({sex:'female'});
assert.strictEqual(female.userData.character.meshes[0].geometry,npc.userData.character.meshes[0].geometry);
assert.notStrictEqual(female.userData.character.bones[0],npc.userData.character.bones[0]);
assert.strictEqual(C.clip('Walk_Loop'),C.clip('Walk_Loop'));
let count=0;
for(const root of [male,female]){
 const s=root.userData.character;
 for(const a of C.asset.animations){
  s.mixer.stopAllAction();s.actions.clear();s.forced=null;C.trigger(s,a.name);C.update(s,.09,{grounded:false});
  for(const fraction of [.1,.5,.9]){
  s.mixer.setTime(a.duration*fraction);
  root.updateMatrixWorld(true);s.skeleton.update();
  for(const m of s.meshes){const p=m.geometry.attributes.position,skin=m.geometry.attributes.skinWeight;for(let i=0;i<p.count;i+=Math.max(1,Math.floor(p.count/150))){const v=new THREE.Vector3().fromBufferAttribute(p,i);m.applyBoneTransform(i,v);assert(Number.isFinite(v.length()));assert(v.length()<10,'exploding skin '+a.name);assert(Math.abs(skin.getX(i)+skin.getY(i)+skin.getZ(i)+skin.getW(i)-1)<1e-5);}}
  count++;
  }
 }
}
for(const lod of [0,1,2]){C.setLOD(female.userData.character,lod);const t=female.userData.character.meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);assert(lod===0?t>=3000&&t<=5000:lod===1?t>=800&&t<=1500:t>=300&&t<=700);}
assert(male.userData.character.meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0)===9849);
console.log(`PASS characters: ${count} body/clip combinations, shared meshes/clips, independent rigs, valid weights and all triangle budgets.`);

// Optional CPU pose export used for visual inspection, without a browser renderer.
if(process.argv.includes('--poses')){
 const out=path.join(__dirname,'../docs/character-poses');fs.mkdirSync(out,{recursive:true});
 for(const [name,config,anim,time] of [['male-idle',{player:true,helmet:true},'Idle_Loop',.5],['male-back',{player:true,helmet:true},'Idle_Loop',.5],['male-run',{player:true,helmet:true},'Jog_Fwd_Loop',.35],['female-idle',{sex:'female'},'Idle_Loop',.5],['male-crouch',{player:true,helmet:true},'Crouch_Idle_Loop',.4],['male-seated',{player:true,helmet:true},'Driving_Loop',.4],['male-jetpack',{player:true,helmet:true,width:1.15,height:1.05},'Jetpack_Loop',.4],['male-jump',{player:true,helmet:true,width:1.15,height:1.05},'Air_Controlled',.4]]){
  const root=C.create(config),s=root.userData.character;s.mixer.stopAllAction();s.mixer.clipAction(C.clip(anim)).reset().play();s.mixer.setTime(time);if(name==='male-back')root.rotation.y=Math.PI;root.updateMatrixWorld(true);s.skeleton.update();
  const parts=s.meshes.map(m=>{const p=m.geometry.attributes.position,vertices=[],normals=[],colors=[];for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);const n=new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.normal,i).add(v);m.applyBoneTransform(i,n);m.applyBoneTransform(i,v);n.sub(v).transformDirection(m.matrixWorld);normals.push(n.toArray());if(m.geometry.attributes.color)colors.push(new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.color,i).toArray());v.applyMatrix4(m.matrixWorld);vertices.push(v.toArray());}return {vertices,normals,colors,color:m.material.color.toArray()};});
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(parts));
 }
}
