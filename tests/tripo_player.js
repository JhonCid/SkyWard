// Contract of this particular Tripo -> UAL conversion, including the visible glove.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const THREE=require('../src/shell/three.min.js'),ctx=vm.createContext({THREE,window:{},atob,console});
for(const f of ['generated/characters.js','player/character_rig.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),ctx);
const C=ctx.window.SkywardCharacters,root=C.create({player:true,helmet:true}),s=root.userData.character;
const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/characters/tripo-conversion.json')));
assert.equal(report.outputTriangles,9849);assert.equal(report.sourceTexturesRetainedInRuntime,false);assert.equal(report.decimation,false);assert(report.smoothSourceNormals);assert(s.meshes.every(m=>m.material.vertexColors&&!m.material.flatShading&&m.geometry.attributes.color));
assert(report.bones.every(b=>Math.abs(b.rotationDeterminant-1)<1e-6));assert.equal(s.config.width,1.15);
assert(C.asset.models.player_lod0.every(id=>C.asset.parts[id].name.startsWith('Tripo_')));
let checks=0;
for(const anim of ['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Driving_Loop','Pistol_Aim_Neutral','Pistol_Aim_Up','Pistol_Aim_Down','Sword_Regular_A','Sword_Regular_B','Jetpack_Loop']){
 const clip=C.clip(anim);assert(clip,anim);s.mixer.stopAllAction();s.mixer.clipAction(clip).reset().play();
 for(const fraction of [.2,.5,.8]){
  s.mixer.setTime(clip.duration*fraction);root.updateMatrixWorld(true);s.skeleton.update();
  for(const side of ['l','r']){
   const hand=s.byName['hand_'+side],palm=hand.localToWorld(new THREE.Vector3(0,.09,0));
   let near=Infinity,far=0,count=0;
   for(const m of s.meshes){
    const a=m.geometry.attributes;
    for(let i=0;i<a.position.count;i++){
     let weight=0;
     for(let k=0;k<4;k++){const name=C.asset.bones[a.skinIndex.array[i*4+k]].name;if(name==='hand_'+side||/^(index|middle|ring|pinky|thumb)_/.test(name)&&name.endsWith('_'+side))weight+=a.skinWeight.array[i*4+k];}
     if(weight<.8)continue;
     const v=new THREE.Vector3().fromBufferAttribute(a.position,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);
     const distance=v.distanceTo(palm);near=Math.min(near,distance);far=Math.max(far,distance);count++;
    }
   }
   assert(count>60,'glove lost during decimation');
   assert(near<.055,anim+': visible glove is detached from the grip '+side+' '+near);
   assert(far<.24,anim+': twisted/exploding hand '+side+' '+far);checks++;
  }
 }
}
const b=fs.readFileSync(path.join(__dirname,'../assets/characters/Explorer-Male.glb'));
const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
assert(!gltf.images&&!gltf.textures,'runtime/export must have solid materials');assert(gltf.materials.every(m=>m.doubleSided===false));
console.log('PASS Tripo player: original-only model, 9849 triangles, proper frame determinants, '+checks+' visible glove/palm checks, no textures or double-sided masking.');
