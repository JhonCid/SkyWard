// Shared geometry/clips, independent bones and AnimationMixer per character.
// No fetch, loaders, image textures or external dependencies at runtime.
const SkywardCharacters = (() => {
  const A=CHARACTER_ASSET, geometryCache=new Map(), clipCache=new Map(), materialCache=new Map();
  const vec=()=>new THREE.Vector3(), quat=()=>new THREE.Quaternion();
  const decode=(s,Type=Float32Array)=>{const b=atob(s),v=new Uint8Array(b.length);for(let i=0;i<b.length;i++)v[i]=b.charCodeAt(i);return new Type(v.buffer);};
  const inverses=decode(A.inverseBind), names=A.bones.map(b=>b.name);
  const upper=new Set(names.filter(n=>/^(spine|neck|Head|clavicle|upperarm|lowerarm|hand|index|middle|ring|pinky|thumb)/.test(n)));
  const rawClips=new Map(A.animations.map(a=>[a.name,a]));
  function clip(name,mask='all') {
    const key=name+':'+mask;if(clipCache.has(key))return clipCache.get(key);
    if(name==='Air_Controlled'||name==='Jetpack_Loop'){
      const jump=clip('Jump_Loop',mask),idle=clip('Idle_Loop',mask),base=new Map(idle.tracks.map(t=>[t.name,t]));
      const tracks=jump.tracks.map(t=>{const r=t.clone(),b=base.get(t.name);if(!b)return r;
        const n=t.getValueSize();for(let i=0;i<r.values.length;i+=n){
          if(n===4){const q=quat().fromArray(b.values).slerp(quat().fromArray(t.values,i),name==='Jetpack_Loop'?.24:.32);q.toArray(r.values,i);}
          else for(let k=0;k<n;k++)r.values[i+k]=b.values[k];
        }return r;});
      const result=new THREE.AnimationClip(key,jump.duration,tracks);clipCache.set(key,result);return result;
    }
    const a=rawClips.get(name);if(!a)return null;
    const tracks=[];
    for(const t of a.tracks){
      if(mask==='upper'&&!upper.has(t.bone)||mask==='lower'&&upper.has(t.bone))continue;
      const property={translation:'position',rotation:'quaternion',scale:'scale'}[t.path];
      const values=decode(t.values),times=decode(t.times);
      if(t.bone==='root'&&t.path==='translation')for(let i=0;i<values.length;i+=3){values[i]=0;values[i+2]=0;}
      const Track=t.path==='rotation'?THREE.QuaternionKeyframeTrack:THREE.VectorKeyframeTrack;
      tracks.push(new Track(t.bone+'.'+property,times,values,t.interpolation==='STEP'?THREE.InterpolateDiscrete:THREE.InterpolateLinear));
    }
    const result=new THREE.AnimationClip(key,a.duration,tracks);clipCache.set(key,result);return result;
  }
  function geometry(model,hairStyle=0,accessory='none') {
    const cacheKey=model+':'+hairStyle+':'+accessory;
    if(geometryCache.has(cacheKey))return geometryCache.get(cacheKey);
    const groups=new Map();
    for(const id of A.models[model]){const p=A.parts[id];if(p.name.startsWith('Hair_')&&p.name!=='Hair_'+hairStyle)continue;if(p.name.startsWith('Accessory_')&&p.name!=='Accessory_'+accessory)continue;if(!groups.has(p.material))groups.set(p.material,[]);groups.get(p.material).push(p);}
    const result=[];
    for(const [material,parts] of groups){
      const g=new THREE.BufferGeometry(),total=parts.reduce((n,p)=>n+p.vertices,0);
      for(const [field,attribute,size,Type] of [['position','position',3,Float32Array],['normal','normal',3,Float32Array],['joints','skinIndex',4,Uint16Array],['weights','skinWeight',4,Float32Array]]){
        const buffer=new Type(total*size);let offset=0;for(const p of parts){const a=decode(p[field],Type);buffer.set(a,offset);offset+=a.length;}g.setAttribute(attribute,new THREE.BufferAttribute(buffer,size));
      }
      if(parts.every(p=>p.color)){const colors=new Float32Array(total*3);let offset=0;for(const p of parts){const c=decode(p.color);colors.set(c,offset);offset+=c.length;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));}
      g.userData.sharedCharacter=true;g.computeBoundingSphere();
      // World cleanup owns instances, while this cache owns geometry for the session.
      g.dispose=()=>{};result.push({geometry:g,material});
    }
    geometryCache.set(cacheKey,result);return result;
  }
  function material(index,config) {
    const color=index===0?config.fabric:index===1?config.color:index===3?config.accent:index===6?config.skin:index===7?config.hair:null;
    const key=index+':'+color;if(materialCache.has(key))return materialCache.get(key);
    const m=new THREE.MeshStandardMaterial({flatShading:index!==8,vertexColors:index===8,roughness:index===4?.25:.82,metalness:[2,4].includes(index)?.45:.06});
    if(color!=null)m.color.setHex(color);else m.color.fromArray(A.palette[index][1]).convertSRGBToLinear();
    if(index===5){m.emissive.copy(m.color);m.emissiveIntensity=.7;}
    m.userData.sharedCharacter=true;m.dispose=()=>{};materialCache.set(key,m);return m;
  }
  function create(config={}) {
    config={sex:'male',player:false,helmet:false,color:config.player?0x535660:0x415764,fabric:config.player?0x22262b:undefined,accent:config.player?0x9c2340:0xa74735,skin:0xb68867,hair:0x30231f,height:config.player?1.05:1,width:config.player?1.15:1,hairStyle:0,accessory:'none',role:'civil',...config};
    const root=new THREE.Group(),visual=new THREE.Group();root.add(visual);visual.rotation.y=Math.PI;visual.scale.set(A.scale*config.width,A.scale*config.height,A.scale*config.width);
    root.userData.actor=true;root.userData.noCollision=true;
    const bones=A.bones.map(b=>{const o=new THREE.Bone();o.name=b.name;o.position.fromArray(b.translation);o.quaternion.fromArray(b.rotation);o.scale.fromArray(b.scale);return o;});
    A.bones.forEach((b,i)=>(b.parent<0?visual:bones[b.parent]).add(bones[i]));
    const skeleton=new THREE.Skeleton(bones,bones.map((b,i)=>new THREE.Matrix4().fromArray(inverses,i*16))),byName=Object.fromEntries(bones.map(b=>[b.name,b]));
    const meshes=[],mixer=new THREE.AnimationMixer(visual),actions=new Map();
    const state={root,visual,bones,byName,skeleton,meshes,mixer,actions,config,lod:-1,speed:0,lastPosition:null,phase:0,air:false,wasSeated:false,landUntil:0,time:0,forced:null,lean:0,pelvisOffset:0};
    root.userData.character=state;
    root.userData.human={height:1.8*config.height,female:config.sex==='female',torso:byName.spine_03,head:byName.Head,pelvis:byName.pelvis,knees:[byName.calf_l,byName.calf_r],elbows:[byName.lowerarm_l,byName.lowerarm_r]};
    setLOD(state,0);update(state,0,{speed:0});return root;
  }
  function setLOD(s,lod) {
    lod=s.config.player?0:Math.max(0,Math.min(2,lod));if(s.lod===lod)return;
    for(const m of s.meshes)s.visual.remove(m);s.meshes.length=0;
    const name=s.config.player?'player_lod0':s.config.sex+(s.config.helmet?'_helmet':'')+'_lod'+lod;
    for(const part of geometry(name,s.config.hairStyle,s.config.accessory)){
      const m=new THREE.SkinnedMesh(part.geometry,material(part.material,s.config));m.bind(s.skeleton,new THREE.Matrix4());m.frustumCulled=false;m.castShadow=lod===0;m.receiveShadow=true;m.userData.noCollision=true;m.userData.sharedCharacter=true;s.visual.add(m);s.meshes.push(m);
    }
    s.lod=lod;
  }
  function action(s,name,mask='all',loop=true) {
    const c=clip(name,mask);if(!c)return null;
    let a=s.actions.get(c.name);if(!a){a=s.mixer.clipAction(c);a.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);a.clampWhenFinished=!loop;a.setEffectiveWeight(0);a.play();s.actions.set(c.name,a);}return a;
  }
  function trigger(s,name,mask='all',duration=null) {
    if(!rawClips.has(name))return false;
    const a=action(s,name,mask,false),length=duration||clip(name,mask).duration;a.reset().setLoop(THREE.LoopOnce,1).setEffectiveTimeScale(clip(name,mask).duration/length).play();a.clampWhenFinished=true;s.forced={name,mask,until:s.time+length};return true;
  }
  function update(s,dt,input={}) {
    dt=Math.max(0,Math.min(dt,.1));s.time+=dt;const smooth=1-Math.exp(-dt*12);
    s.speed=THREE.MathUtils.lerp(s.speed,Math.max(0,input.speed||0),smooth);
    // Undo last frame's IK/posture before the mixer, including constant tracks that
    // Three.js deliberately does not rewrite when their sampled value is unchanged.
    if(s.cleanPose)s.bones.forEach((b,i)=>{b.position.copy(s.cleanPose[i].p);b.quaternion.copy(s.cleanPose[i].q);b.scale.copy(s.cleanPose[i].s);});
    s.visual.position.set(0,0,0);
    s.airTime=input.grounded===false?(s.airTime||0)+dt:0;
    const grounded=input.grounded!==false||(!input.jet&&s.airTime<.16&&(input.vertical||0)<1);
    s.aimBlend=THREE.MathUtils.lerp(s.aimBlend||0,input.armed?1:0,1-Math.exp(-dt*20));
    if(s.air&&grounded)s.landUntil=s.time+.22;
    if(!!input.seated!==s.wasSeated){s.forced=null;for(const a of s.actions.values())a.setEffectiveWeight(0);s.landUntil=0;}
    s.wasSeated=!!input.seated;s.air=!grounded;
    if(s.forced&&s.time>=s.forced.until)s.forced=null;
    const wanted=new Map(),armed=!!input.armed&&!input.seated&&!input.swimming&&!s.forced;
    const mask=armed||input.blade||s.forced?.mask==='upper'?'lower':'all';
    const want=(name,weight=1,m=mask,loop=true)=>{const a=action(s,name,m,loop);if(a)wanted.set(a,weight);};
    if(s.forced&&s.forced.mask==='all')want(s.forced.name,1,s.forced.mask,false);
    else if(input.seated)want(input.driving?'Driving_Loop':'Sitting_Idle_Loop');
    else if(input.swimming)want(s.speed>.4?'Swim_Fwd_Loop':'Swim_Idle_Loop');
    else if(input.jet)want('Jetpack_Loop');
    else if(!grounded)want('Air_Controlled');
    else if(input.crouch)want(s.speed>.3?'Crouch_Fwd_Loop':'Crouch_Idle_Loop');
    else if(s.speed<.15)want(input.talking?'Idle_Talking_Loop':'Idle_Loop');
    else {
      const knots=[0,3.6,5.4,7.2],clips=['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop'];
      let k=0;while(k<2&&s.speed>knots[k+1])k++;const t=THREE.MathUtils.clamp((s.speed-knots[k])/(knots[k+1]-knots[k]),0,1);want(clips[k],1-t);want(clips[k+1],t);
    }
    if(armed){
      if(input.reload)want('Pistol_Reload',1,'upper');
      else {const pitch=THREE.MathUtils.clamp(input.pitch||0,-1.35,1.35),amount=Math.min(1,Math.abs(pitch)/1.15);want('Pistol_Aim_Neutral',1-amount,'upper');want(pitch>=0?'Pistol_Aim_Up':'Pistol_Aim_Down',amount,'upper');}
    }
    if(input.blade&&!s.forced&&!input.seated)want('Sword_Idle',1,'upper');
    if(s.forced?.mask==='upper')want(s.forced.name,1,'upper',false);
    for(const a of s.actions.values()){
      const target=wanted.get(a)||0,weight=THREE.MathUtils.lerp(a.getEffectiveWeight(),target,dt===0?1:smooth);
      a.enabled=weight>.0001||target>0;a.setEffectiveWeight(weight);
      if(a.enabled&&target>0&&/Walk_Loop|Jog_Fwd_Loop|Sprint_Loop/.test(a.getClip().name))a.setEffectiveTimeScale((input.backward?-1:1)*THREE.MathUtils.clamp(s.speed/(/Sprint/.test(a.getClip().name)?7.2:/Jog/.test(a.getClip().name)?5.4:3.6),.55,1.6));
    }
    s.mixer.update(dt);
    s.cleanPose??=s.bones.map(b=>({p:vec(),q:quat(),s:vec()}));
    s.bones.forEach((b,i)=>{s.cleanPose[i].p.copy(b.position);s.cleanPose[i].q.copy(b.quaternion);s.cleanPose[i].s.copy(b.scale);});
    const pelvis=s.byName.pelvis,spine=s.byName.spine_02;
    s.lean=THREE.MathUtils.lerp(s.lean,THREE.MathUtils.clamp((input.acceleration||0)*.014,-.09,.09)+(input.jet?.12:0),smooth);
    // Corrections use the visual frame's axes transformed into each bone's parent.
    function tilt(bone,angle){const axis=new THREE.Vector3(1,0,0).applyQuaternion(s.root.getWorldQuaternion(quat())).applyQuaternion(bone.parent.getWorldQuaternion(quat()).invert());bone.quaternion.premultiply(quat().setFromAxisAngle(axis,angle));s.root.updateMatrixWorld(true);}
    s.root.updateMatrixWorld(true);
    tilt(spine,s.lean);
    if(armed){tilt(s.byName.spine_01,THREE.MathUtils.clamp(input.pitch||0,-1.1,1.1)*.12);tilt(spine,Math.max(0,input.recoil||0)*.025);}
    if(input.seated){
      const hip=s.visual.worldToLocal(pelvis.getWorldPosition(vec()));
      s.visual.position.y=(input.seatHeight??.82)-hip.y*A.scale*s.config.height;
      s.visual.position.z=hip.z*A.scale*s.config.width;
    }
    s.root.updateMatrixWorld(true);
    if(input.driving){
      // Fit the driver to the shallow rover footwell without moving its collider.
      for(const [side,sign] of [['l',-1],['r',1]]){
        legTarget(s,side,s.root.localToWorld(new THREE.Vector3(sign*.23,.76,-.68)),s.root.localToWorld(new THREE.Vector3(sign*.26,1.14,-.25)));
      }
    }
    if(grounded&&!input.seated&&!input.swimming&&!input.jet&&input.ground&&s.lod===0)feet(s,input.ground,dt);
    s.skeleton.update();
  }
  function feet(s,probe,dt) {
    const up=new THREE.Vector3(0,1,0).transformDirection(s.root.matrixWorld),targets=[];
    for(const side of ['l','r']){
      const foot=s.byName['foot_'+side],pos=foot.getWorldPosition(vec()),surface=probe(pos,up);
      if(!surface)continue;
      const correction=surface.clone().addScaledVector(up,.097*s.config.height).sub(pos).dot(up);
      if(Math.abs(correction)>.25)continue;
      targets.push({side,target:pos.clone().addScaledVector(up,THREE.MathUtils.clamp(correction,-.14,.14))});
    }
    // Small visual pelvis correction; never moves the collider or player position.
    const drop=targets.length?Math.min(0,...targets.map(t=>t.target.clone().sub(s.byName['foot_'+t.side].getWorldPosition(vec())).dot(up))):0;
    s.pelvisOffset=THREE.MathUtils.lerp(s.pelvisOffset,drop,1-Math.exp(-dt*10));
    const p=s.byName.pelvis,local=up.clone().applyQuaternion(p.parent.getWorldQuaternion(quat()).invert()).multiplyScalar(s.pelvisOffset/A.scale);p.position.add(local);s.root.updateMatrixWorld(true);
    for(const {side,target} of targets)for(let pass=0;pass<3;pass++)for(const name of ['calf_','thigh_']){
      const joint=s.byName[name+side],foot=s.byName['foot_'+side],origin=joint.getWorldPosition(vec()),from=foot.getWorldPosition(vec()).sub(origin),to=target.clone().sub(origin);
      if(from.lengthSq()<1e-8||to.lengthSq()<1e-8)continue;
      const delta=quat().setFromUnitVectors(from.normalize(),to.normalize()),world=joint.getWorldQuaternion(quat()),parent=joint.parent.getWorldQuaternion(quat());
      const angle=2*Math.acos(Math.min(1,Math.abs(delta.w)));if(angle>.15)delta.slerp(quat(),1-.15/angle);
      joint.quaternion.copy(parent.invert().multiply(delta).multiply(world));s.root.updateMatrixWorld(true);
    }
  }
  function dispose(root){const s=root.userData.character;if(!s)return;s.mixer.stopAllAction();s.mixer.uncacheRoot(s.visual);s.skeleton.dispose();}
  function legTarget(s,side,target,pole){
    const hip=s.byName['thigh_'+side],knee=s.byName['calf_'+side],foot=s.byName['foot_'+side];
    const h=hip.getWorldPosition(vec()),k=knee.getWorldPosition(vec()),f=foot.getWorldPosition(vec()),footRotation=foot.getWorldQuaternion(quat());
    const a=h.distanceTo(k),b=k.distanceTo(f),direction=target.clone().sub(h),distance=THREE.MathUtils.clamp(direction.length(),.01,a+b-.002);direction.normalize();
    const bend=pole.clone().sub(h);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
    const along=THREE.MathUtils.clamp((a*a+distance*distance-b*b)/(2*distance),-a,a),height=Math.sqrt(Math.max(0,a*a-along*along));
    const wantedKnee=h.clone().addScaledVector(direction,along).addScaledVector(bend,height);
    function rotate(joint,end,to){const origin=joint.getWorldPosition(vec()),from=end.getWorldPosition(vec()).sub(origin).normalize(),toward=to.clone().sub(origin).normalize(),world=joint.getWorldQuaternion(quat());joint.quaternion.copy(joint.parent.getWorldQuaternion(quat()).invert().multiply(quat().setFromUnitVectors(from,toward)).multiply(world));s.root.updateMatrixWorld(true);}
    rotate(hip,knee,wantedKnee);rotate(knee,foot,h.clone().addScaledVector(direction,distance));
    foot.quaternion.copy(foot.parent.getWorldQuaternion(quat()).invert().multiply(footRotation));s.root.updateMatrixWorld(true);
  }
  function handTarget(s,side,target){
    const end=s.byName['hand_'+side];
    for(let pass=0;pass<5;pass++)for(const name of ['lowerarm_','upperarm_']){
      const joint=s.byName[name+side],origin=joint.getWorldPosition(vec()),from=end.getWorldPosition(vec()).sub(origin),to=target.clone().sub(origin);
      if(from.lengthSq()<1e-8||to.lengthSq()<1e-8)continue;
      const delta=quat().setFromUnitVectors(from.normalize(),to.normalize()),world=joint.getWorldQuaternion(quat()),parent=joint.parent.getWorldQuaternion(quat());
      joint.quaternion.copy(parent.invert().multiply(delta).multiply(world));s.root.updateMatrixWorld(true);
    }
    s.skeleton.update();
  }
  return {create,update,setLOD,trigger,dispose,clip,geometry,handTarget,asset:A};
})();
window.SkywardCharacters=SkywardCharacters;
