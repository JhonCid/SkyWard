const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const THREE=require('../src/shell/three.min.js'),ctx=vm.createContext({THREE,window:{},atob,console});
for(const f of ['generated/characters.js','player/character_rig.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),ctx);
const C=ctx.window.SkywardCharacters,make=()=>C.create({player:true,helmet:true}).userData.character;
const tick=(s,input,n=90)=>{for(let i=0;i<n;i++)C.update(s,1/60,input);};
const centers={Head:[0,1.682,.004],Hair_0:[0,1.686,-.005],Hair_1:[0,1.681,-.008],Hair_2:[0,1.686,-.005],Helmet:[0,1.691,.005],Visor:[0,1.691,.005]};
let triangles=0;
for(const part of Object.values(C.asset.parts)){
 const bytes=Buffer.from(part.position,'base64'),v=new Float32Array(Uint8Array.from(bytes).buffer);
 const normals=new Float32Array(Uint8Array.from(Buffer.from(part.normal,'base64')).buffer);
 let signed=0,absolute=0;
 for(let i=0;i<v.length;i+=9){
  const a=new THREE.Vector3().fromArray(v,i),b=new THREE.Vector3().fromArray(v,i+3),c=new THREE.Vector3().fromArray(v,i+6);
  const normal=b.clone().sub(a).cross(c.clone().sub(a));
  assert(normal.length()>1e-11,'degenerate face: '+part.name);
  if(part.color){for(let k=0;k<9;k+=3)assert(Math.abs(new THREE.Vector3().fromArray(normals,i+k).length()-1)<1e-5,'invalid source smooth normal');}
  else assert(normal.clone().normalize().dot(new THREE.Vector3().fromArray(normals,i))>.999,'normal disagrees with winding: '+part.name);
  if(centers[part.name]){
   const radial=a.clone().add(b).add(c).multiplyScalar(1/3).sub(new THREE.Vector3(0,1.69,.005));
   const volume=normal.dot(radial);signed+=volume;absolute+=Math.abs(volume);
  }
  triangles++;
 }
 // Anatomical ears/jaw are locally concave. Require outward signed volume and
 // at least 99% of the absolute volume contribution, rather than a spherical head.
 if(centers[part.name])assert(signed/absolute>.98,'inverted anatomical head/cap: '+part.name);
}
const s=make();tick(s,{armed:true,pitch:.6,fire:true,grounded:true},240);const pose=s.byName.spine_02.quaternion.clone();tick(s,{armed:true,pitch:.6,fire:true,grounded:true},1200);assert(pose.angleTo(s.byName.spine_02.quaternion)<.03,'posture accumulated over continuous fire');
const up=s.byName.hand_r.getWorldPosition(new THREE.Vector3()).y;tick(s,{armed:true,pitch:-.6,grounded:true});const down=s.byName.hand_r.getWorldPosition(new THREE.Vector3()).y;assert(up-down>.15,'aim must move arms vertically');
tick(s,{jet:true,armed:true,pitch:.3,grounded:false});assert([...s.actions].some(([n,a])=>n==='Jetpack_Loop:lower'&&a.getEffectiveWeight()>.9));assert([...s.actions].some(([n,a])=>n.startsWith('Pistol_Aim')&&a.getEffectiveWeight()>.1));
tick(s,{speed:3.6,backward:true,grounded:true});assert(s.actions.get('Walk_Loop:all').timeScale<0);
const air=make();C.update(air,.08,{grounded:false,vertical:-.2});assert(!air.air,'tiny ground gaps must not trigger falling');tick(air,{grounded:false,vertical:-4},20);assert(air.air);
const seat=make();tick(seat,{seated:true,driving:true,seatHeight:.82});assert(Math.abs(seat.byName.pelvis.getWorldPosition(new THREE.Vector3()).y-.82)<.001);C.update(seat,.016,{grounded:true});assert(!seat.forced,'no exit animation after teleport out');assert.equal(seat.visual.position.y,0);
for(let i=0;i<3;i++){C.trigger(s,'OverhandThrow','upper',.85);tick(s,{speed:3.6,grounded:true},15);assert(s.actions.get('OverhandThrow:upper').getEffectiveWeight()>.9);assert(s.actions.get('Walk_Loop:lower').getEffectiveWeight()>.1);tick(s,{grounded:true},50);assert(!s.forced);}
console.log('PASS character regressions: '+triangles+' consistent triangle normals, 24s stable continuous aim, arm pitch, jetpack/aim layering, backward gait, ground grace, seat height, instant exit and repeated moving throws.');
