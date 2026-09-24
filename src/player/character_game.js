// Compatibility bridge: keep gameplay/colliders/save format unchanged.
let characterRigEnabled=true;
try{characterRigEnabled=localStorage.getItem('skyward-character-system')!=='legacy';}catch{}
function person(parent,x,z,color,seed){
  if(!characterRigEnabled)return legacyPerson(parent,x,z,color,seed);
  const serial=seed===undefined?++humanSerial*8917:seed,random=rng(serial),sex=random()<.5?'female':'male';
  const config={sex,color,seed:serial,helmet:random()<.18,height:.93+random()*.14,width:.89+random()*.24,skin:[0xe1b896,0xbf8c66,0x8b5b43,0x593d32,0xd6ac86][Math.floor(random()*5)],hair:[0x211d1b,0x523625,0xa67c42,0xd4b989,0x77716c][Math.floor(random()*5)],hairStyle:Math.floor(random()*3),accent:[0xb15543,0x82936c,0xd8a465,0x5d8f9e][Math.floor(random()*4)]};
  const roles=['civil','técnico','piloto','comerciante'],role=Math.floor(random()*roles.length);config.role=roles[role];config.accessory=['none','tool','pack','bag'][role];
  const g=SkywardCharacters.create(config);g.position.set(x,0,z);parent.add(g);return g;
}
function makeAvatar(){
  if(!characterRigEnabled)return legacyMakeAvatar();
  if(avatar){if(avatar.userData.rig?.userData.character)SkywardCharacters.dispose(avatar.userData.rig);scene.remove(avatar);discardChildren(avatar);}
  const root=new THREE.Group();root.userData.noCollision=true;root.userData.dynamic=true;
  const color=outfit==='arctic'?0xb9c9cb:outfit==='night'?0x293342:0x535660;
  const accent=outfit==='ranger'?0x82936c:outfit==='engineer'?0xd8a465:outfit==='arctic'?0x5d8f9e:0x9c2340;
  const rig=SkywardCharacters.create({player:true,helmet:true,sex:'male',width:1.15,height:1.05,fabric:0x22262b,color,accent});root.add(rig);root.userData.rig=rig;scene.add(root);avatar=root;updateAvatarWeapon();
}
function animateHuman(g,dt,seated=false,airborne=false){
  const s=g.userData.character;if(!s)return legacyAnimateHuman(g,dt,seated,airborne);
  const isPlayer=avatar&&avatar.userData.rig===g;
  const position=g.getWorldPosition(V()),previous=s.speed;
  let speed=s.lastPosition?position.distanceTo(s.lastPosition)/Math.max(dt,.001):0;
  s.lastPosition=position.clone();if(speed>12)speed=0;
  const input={speed,seated,grounded:!airborne};
  if(isPlayer){
    input.speed=mode==='foot'&&!resting?Math.min(1,Math.hypot(axisForward(),axisStrafe()))*(sprinting()?7.2:3.6):0;
    input.driving=mode==='rover';input.grounded=onFootGround||mode!=='foot';input.vertical=jumpVelocity;
    input.jet=jetActive||eva;input.pitch=pitch;input.recoil=recoil;
    input.backward=axisForward()<-.1&&!(thirdPerson&&footFreeCam&&!aiming&&!firing&&!(s.aimRequestUntil>combatTime));
    input.seatHeight=mode==='rover'?.82:mode==='pilot'?.08:.30;
    input.swimming=!!(groundPlanet?.water&&!inside&&waterMovement&&position.distanceTo(groundPlanet.center)<seaRadius(groundPlanet));
    input.armed=mode==='foot'&&!resting&&['pistol','rifle','shotgun','tool'].includes(equipped)&&(aiming||firing||reloadActive||s.aimRequestUntil>combatTime);
    input.reload=reloadActive;input.fire=firing;input.blade=mode==='foot'&&['blade','sabre'].includes(equipped);
    input.acceleration=(input.speed-previous)/Math.max(dt,.016);
    if(collisionReady&&avatar.visible)input.ground=(pos,up)=>floorProbe(pos,up,inside?null:groundPlanet,0,.45,avatar);
    // The legacy camera already handles bed orientation; use the neutral clip for lying down.
    if(resting?.kind==='bed'){input.seated=false;input.grounded=false;input.jet=false;input.speed=0;}
  }else{
    input.talking=speed<.2&&position.distanceTo(controlledPosition())<3.2;
  }
  SkywardCharacters.update(s,dt,input);
  if(isPlayer&&avatarWeapon&&avatarWeapon.parent===s.byName.hand_r&&['pistol','rifle','shotgun','tool'].includes(equipped)){
    const hand=s.byName.hand_r,base=avatar.getWorldQuaternion(new THREE.Quaternion()),desired=base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-.95));
    if(input.armed){const up=V(0,1,0).applyQuaternion(base),target=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(V(),aimDirection(false),up));desired.slerp(target,s.aimBlend||0);}
    const palm=hand.localToWorld(V(0,.09,0)),up=V(0,1,0).applyQuaternion(desired);
    avatarWeapon.position.copy(hand.worldToLocal(palm.addScaledVector(up,.085)));
    avatarWeapon.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(desired));
    avatar.updateMatrixWorld(true);
    if(input.armed&&!input.reload&&['rifle','shotgun'].includes(equipped)){
      const target=avatarWeapon.localToWorld(V(.025,-.075,-.32));SkywardCharacters.handTarget(s,'l',target);
    }
  }
}
function riggedAvatarWeapon(){
  const s=avatar?.userData.rig?.userData.character;if(!s)return false;
  const hand=s.byName.hand_r;let holder=hand.getObjectByName('avatarWeaponHolder');
  if(!holder){holder=new THREE.Group();holder.name='avatarWeaponHolder';holder.position.set(0,.09,.015);holder.rotation.set(Math.PI/2,0,Math.PI);hand.add(holder);}
  holder.position.set(0,.09,.015);holder.rotation.set(Math.PI/2,0,Math.PI);
  if(['blade','sabre'].includes(equipped)){
    // Blade -Z follows the palm's local +Z; align the grip centre with the palm.
    holder.quaternion.setFromAxisAngle(V(0,1,0),Math.PI);
    holder.position.copy(V(0,.09,0).sub(V(0,0,(equipped==='sabre'?.12:.10)*.88).applyQuaternion(holder.quaternion)));
  }
  discardChildren(holder);
  if(mode==='foot'&&equipped&&!(equipped==='grenade'&&equipment.grenades<=0))makeWeapon(holder,equipped,true);
  holder.traverse(o=>{o.userData.noCollision=true;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});avatarWeapon=holder;return true;
}
function updateCharacterLODs(){
  for(const n of npcs){const s=n.g.userData.character;if(!s)continue;const distance=n.g.getWorldPosition(V()).distanceTo(camera.position),factor=performancePrefs.characterDistance;SkywardCharacters.setLOD(s,distance>85*factor?2:distance>28*factor?1:0);}
}
function characterSettings(){return `<section><h3>Personagens</h3><p>Sistema atual: ${characterRigEnabled?'animações dos pacotes':'procedural anterior'}.</p><button onclick="setCharacterAnimationMode('${characterRigEnabled?'legacy':'rigged'}')">Usar ${characterRigEnabled?'sistema anterior':'novas animações'} e reiniciar</button></section>`;}
window.setCharacterAnimationMode=function(value){if(!['legacy','rigged'].includes(value))return;save();try{localStorage.setItem('skyward-character-system',value);}catch{toast('Não foi possível salvar a preferência.');return;}location.reload();};
window.characterAnimation={get enabled(){return characterRigEnabled;},play(name){const s=avatar?.userData.rig?.userData.character;return !!s&&SkywardCharacters.trigger(s,name);},get player(){return avatar?.userData.rig?.userData.character;}};
