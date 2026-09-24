function batchArchitecture(root){root.updateWorldMatrix(true,true);const buckets=new Map(),inv=root.matrixWorld.clone().invert();root.traverse(o=>{if(!root.userData.batchUnit&&hasAncestorFlag(o,'batchUnit')||!root.userData.detailRoot&&hasAncestorFlag(o,'detailRoot'))return;if(!o.isMesh||o.material.transparent||o.material.map||o.geometry.type==='PlaneGeometry'||hasAncestorFlag(o,'actor')||hasAncestorFlag(o,'dynamic'))return;const m=o.material,key=[m.color?.getHex(),m.emissive?.getHex(),m.emissiveIntensity,m.roughness].join(':');if(!buckets.has(key))buckets.set(key,{m,list:[]});buckets.get(key).list.push(o);});for(const {m,list} of buckets.values()){if(list.length<3)continue;const arrays=[],normals=[];for(const o of list){const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));arrays.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);geo.dispose();o.layers.set(31);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arrays,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.computeBoundingSphere();const merged=mesh(g,m.clone(),root);merged.castShadow=true;merged.receiveShadow=true;merged.userData.noCollision=true;}}

function settlementPoint(s,x,z,offset=0){const n=V(x,s.p.r,z).normalize().applyQuaternion(s.frame);return s.p.center.clone().addScaledVector(n,radius(s.p,n)+offset);}
function settlementLocal(s,world){const v=world.clone().sub(s.p.center).applyQuaternion(s.frame.clone().invert());return V(v.x*s.p.r/v.y,0,v.z*s.p.r/v.y);}
function curvedPatch(s,x,z,w,d,color,offset=.12){if(Math.max(w,d)>110&&Math.min(w,d)<30){const longX=w>d,n=Math.ceil(Math.max(w,d)/95);for(let i=0;i<n;i++)curvedPatch(s,x+(longX?(-w/2+w*(i+.5)/n):0),z+(!longX?(-d/2+d*(i+.5)/n):0),longX?w/n:w,longX?d:d/n,color,offset);return null;}const geo=new THREE.PlaneGeometry(w,d,Math.max(2,Math.ceil(w/9)),Math.max(2,Math.ceil(d/9)));geo.rotateX(-Math.PI/2);const a=geo.attributes.position;for(let i=0;i<a.count;i++){const v=settlementPoint(s,x+a.getX(i),z+a.getZ(i),offset).sub(s.root.position);a.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();const m=mesh(geo,color,s.root);m.userData.surfaceOnly=true;m.receiveShadow=true;return m;}
function surfaceGroup(s,x,z){const g=new THREE.Group(),pos=settlementPoint(s,x,z,.18);g.position.copy(pos).sub(s.root.position);g.quaternion.copy(frameAt(pos,s.p.center));s.root.add(g);g.userData.batchUnit=true;s.lots.push(g);return g;}
function residentialBlock(g,random,p,index){
  const h=8+Math.floor(random()*5)*7,w=14+random()*9,d=15+random()*8,col=new THREE.Color(p.def[5]).lerp(new THREE.Color(0x77848b),.65).getHex();
  box(g,0,h/2,0,w,h,d,col);
  box(g,0,h+.2,0,w+1,.4,d+1,0x394f5b);
  const details=new THREE.Group();
  g.add(details);
  g.userData.details=details;
  details.userData.detailRoot=true;
  details.userData.batchUnit=true;
  for(let y=4;y<h-2;y+=5){
    box(details,0,y,-d/2-.05,w-3,1.6,.08,mat(index%3?0x779caa:0xbcc9ae,.25));
    box(details,0,y,d/2+.05,w-3,1.6,.08,mat(0x85a4b0,.2));
  }
  box(details,0,1.6,d/2+.15,2,3.2,.15,0x203c4d);
  if(index%3===0){
    mesh(new THREE.CylinderGeometry(w*.35,w*.4,h*.55,8),col,g,w*.15,h*.275,d*.15);
    box(g,w*.15,h*.55,d*.15,w*.65,.3,w*.65,0x425567);
  }
  if(index%2===0){
    box(g,0,h+1.2,0,w*.5,2,d*.6,0x516771);
  }
  g.userData.height=h;
}
function townPath(s,t,scale=1){const a=t*Math.PI*2,r=(s.kind==='city'?110:35)*(1+.18*Math.sin(a*3+s.p.i+scale*.8)+.10*Math.cos(a*5+s.index-scale));return V(Math.cos(a)*r*scale,0,Math.sin(a)*r*.85*scale);}
function townRoad(s,points,width=9){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],d=b.clone().sub(a),n=V(-d.z,0,d.x).normalize().multiplyScalar(width/2);const corners=[a.clone().add(n),a.clone().sub(n),b.clone().sub(n),b.clone().add(n)].map(v=>settlementPoint(s,v.x,v.z,.17).sub(s.root.position).toArray());const o=panelMesh(s.root,corners,0x354a53);o.userData.surfaceOnly=true;}s.roads.push(...points.slice(0,-1));}
function createSettlement(root,p,normal,kind,index,isMain=false){const random=rng(7781+p.i*887+index*379+(kind==='village'?53:0)),center=p.center.clone().addScaledVector(normal,radius(p,normal)+.15),s={root,p,normal,frame:frameAt(center,p.center),center,kind,index,half:kind==='city'?240:80,lots:[],roads:[],isMain,name:p.def[0]+' · '+(kind==='city'?'Cidade ':'Vilarejo ')+(index+1),portKey:isMain?p.i:null};root.position.copy(center);root.userData.curvedCity=true;settlements.push(s);const city=kind==='city';for(const scale of city?[.54,1,1.7]:[1]){const points=Array.from({length:97},(_,i)=>townPath(s,i/96,scale));townRoad(s,points,city?10:7);}
for(let j=0;j<(city?7:3);j++){const a=j/(city?7:3)+.025*Math.sin(j*5),end=townPath(s,a,city?1.82:1.45),points=[];for(let i=0;i<=20;i++){const t=i/20,curve=Math.sin(t*Math.PI)*18;points.push(V(end.x*t+Math.sin(a*6.28)*curve,0,end.z*t-Math.cos(a*6.28)*curve));}townRoad(s,points,8);}
curvedPatch(s,0,0,42,42,0x718988,.26);curvedPatch(s,0,0,1,28,p.def[5],.29);curvedPatch(s,0,0,28,1,p.def[5],.29);
  // Modular High-Tech Hangar & Shipyard Operations Terminal (stationed 29.5m away from pad to clear large ship wings)
  const termGroup = surfaceGroup(s, 29.5, 3.5);
  termGroup.name = 'hangarTerminal';
  termGroup.userData.hangarTerminal = true;
  termGroup.userData.actor = true;
  // Raised hexagonal foundation platform with hazard safety curb
  box(termGroup, 0, 0.08, 0, 3.6, 0.16, 3.6, 0x202d38);
  box(termGroup, 0, 0.18, 0, 3.2, 0.08, 3.2, 0x2c3e4c);
  // Heavy industrial housing & cooling heatsink
  box(termGroup, 0, 0.72, 0, 1.15, 1.15, 0.95, 0x182430);
  box(termGroup, 0, 0.72, -0.42, 0.95, 0.90, 0.14, 0x111a24);
  // Dual-tier tactical console deck & holographic flight operations display
  box(termGroup, 0, 1.25, 0.12, 1.35, 0.22, 0.90, 0x243846);
  const termScreen = mesh(new THREE.PlaneGeometry(0.92, 0.54), mat(0x42f5d7, 2.8), termGroup, 0, 1.58, 0.16);
  termScreen.rotation.x = -0.38;
  termScreen.userData.noCollision = true;
  const topScreen = mesh(new THREE.PlaneGeometry(0.68, 0.30), mat(0x7ee2c8, 1.8), termGroup, 0, 2.05, -0.08);
  topScreen.rotation.x = 0.15;
  topScreen.userData.noCollision = true;
  // Telemetry antenna mast with aviation strobe beacon
  mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.4, 8), 0x5a7686, termGroup, -0.95, 2.1, -0.6);
  mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0xff5722, 2.5), termGroup, -0.95, 2.85, -0.6);
  // Safety perimeter guide bollards with magnetic glow rings
  for (const bX of [-1.35, 1.35]) {
    mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.90, 10), 0x384c59, termGroup, bX, 0.55, 0.95);
    mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 16), mat(0xffd54f, 1.6), termGroup, bX, 0.82, 0.95);
  }const services=city?[...storeSets[p.i],'clothes','workshop']:['jobs',index%2?'medical':'supplies',p.i===2?'workshop':'clothes'],occupied=[];
for(let j=0;j<services.length;j++){const phase=j/services.length+.025,road=townPath(s,phase),out=road.clone().normalize(),pos=road.clone().addScaledVector(out,26),g=surfaceGroup(s,pos.x,pos.z),before=shops.length;buildStore(g,p,0,p.i);const shop=shops[before];shop.g.position.set(0,0,0);shop.g.rotation.y=Math.atan2(-out.x,-out.z);shop.type=services[j];shop.def=storeDefs[shop.type];shop.portKey=s.portKey;shop.settlement=s;redecorateShop(shop);g.userData.shop=shop;occupied.push({x:pos.x,z:pos.z,r:23});}
let built=0;for(let attempt=0;attempt<(city?150:35)&&built<(city?18:6);attempt++){const a=random()*Math.PI*2,r=Math.sqrt(random())*s.half*.98,x=Math.cos(a)*r,z=Math.sin(a)*r*.9,size=city?11+random()*8:11;if(Math.hypot(x,z)<38||occupied.some(o=>Math.hypot(x-o.x,z-o.z)<size*.72+o.r+1.5)||s.roads.some(v=>Math.hypot(x-v.x,z-v.z)<size*.66+7))continue;const g=surfaceGroup(s,x,z),near=s.roads.reduce((a,b)=>Math.hypot(x-a.x,z-a.z)<Math.hypot(x-b.x,z-b.z)?a:b);g.rotateY(Math.atan2(near.x-x,near.z-z));residentialBlock(g,random,p,built);const scale=size/22;g.scale.set(scale,city?.75+random()*1.35:.4+random()*.35,scale);occupied.push({x,z,r:size*.72});built++;}
s.buildingCount=built;
for(let k=0;k<(city?6:2);k++){const phase=k/(city?32:8),local=townPath(s,phase,1.075),anchor=surfaceGroup(s,local.x,local.z),g=person(anchor,0,0,[0xb29f76,0x83a9a4,0xa78da9][k%3]);npcs.push({g,city:anchor,settlement:s,routeBase:local,base:g.position.clone(),name:['Mara','Caio','Luna','Alan','Sara','Noah'][k%6]+' · morador',role:k%6,phase,walkPhase:phase,path:[V()],way:0,wait:0,travel:0});anchor.userData.small=true;}
for(let k=0;k<(city?6:2);k++){const point=townPath(s,k/(city?26:8),1.075),g=surfaceGroup(s,point.x,point.z);mesh(new THREE.CylinderGeometry(.1,.18,5,6),0x405766,g,0,2.5,0);ellipsoid(g,0,5,0,.6,.15,.6,mat(p.def[5],.8));g.userData.small=true;}
for(let k=0;k<(city?4:1);k++){const point=townPath(s,(k+.2)/4,.53),g=surfaceGroup(s,point.x,point.z);mesh(new THREE.CylinderGeometry(3.5,4,.5,16),0x70867c,g,0,.3,0);ellipsoid(g,0,1,0,2,.6,2,0x467f78);for(const side of [-1,1])box(g,side*6,.6,0,1.4,.4,3,0x8b795d);}
if(city)for(let k=0;k<7;k++)spawnTraffic(s,k);return s;}

function decoratePlanet(parentRoot,p){
  const count=settlementProfiles[p.i] || {cities:1, villages:1};
  if(count.cities){
    const s0Root = new THREE.Group();
    scene.add(s0Root);
    createSettlement(s0Root,p,UP.clone(),'city',0,true);
    for(let c=1; c<count.cities; c++){
      const a = 1.2 + c * 2.4;
      const norm = V(Math.cos(a)*0.85, 0.15, Math.sin(a)*0.85).normalize();
      const scRoot = new THREE.Group();
      scene.add(scRoot);
      createSettlement(scRoot, p, norm, 'city', c, false);
    }
  }
  for(let v=0; v<(count.villages||0); v++){
    const a = 2.1 + v * 1.9 + p.i * 0.4;
    const norm = V(Math.cos(a)*0.75, -0.28, Math.sin(a)*0.75).normalize();
    const svRoot = new THREE.Group();
    scene.add(svRoot);
    createSettlement(svRoot, p, norm, 'village', v, !count.cities && v === 0);
  }
  if(!count.cities && !count.villages){
    const unRoot = new THREE.Group();
    scene.add(unRoot);
    unRoot.userData.uninhabited=true;
    const beacon=mesh(new THREE.CylinderGeometry(.18,.6,4,8),0x778e99,unRoot,0,2,8);
    label3D(unRoot,'ÁREA DE POUSO · SEM HABITANTES',0,5,8,18);
  }
  finishSettlements();
}
function finishSettlements(){
  for(const s of settlements){
    if(!s.isMain){
      s.portKey=destinations.length;
      if(!destinations.some(d=>d.settlement===s)){
        destinations.push({name:s.name,pos:s.center.clone(),p:s.p,settlement:s,kind:s.kind});
      }
    } else {
      const mainD=destinations.find(d=>d.p===s.p&&d.kind==='planet');
      if(mainD){mainD.name=s.name;mainD.settlement=s;}
    }
    for(const shop of shops)if(shop.settlement===s)shop.portKey=s.portKey;
  }
  for(const p of planets)if(!destinations.some(d=>d.p===p))destinations.push({name:p.def[0]+' · Porto',pos:p.center.clone().add(V(0,p.r+2,0)),p,kind:'planet'});
  buildSpatialIndex();
}
window.finishSettlements = finishSettlements;
function redecorateShop(s){const old=s.g;const parent=old.parent,pos=old.position.clone(),q=old.quaternion.clone();if(s.clerk){const clerkIdx=npcs.findIndex(n=>n.g===s.clerk);if(clerkIdx>=0)npcs.splice(clerkIdx,1);}discardChildren(old);const d=s.def;box(old,0,0,0,27,.3,29,0x697f85);const entryRamp=box(old,0,-.08,16.3,6,.15,4.5,0x697f85);entryRamp.rotation.x=.09;for(const x of [-13.5,13.5])box(old,x,2.7,0,.35,5.4,29,0x5c7381);box(old,0,2.7,-14.5,27,5.4,.35,0x516b78);for(const x of [-8,8]){box(old,x,1,14.5,10,2,.35,0x5c7381);box(old,x,3.5,14.5,10,3,.1,new THREE.MeshStandardMaterial({color:0x86bec7,transparent:true,opacity:.18}));}box(old,0,5.5,0,28,.3,30,0x415967);box(old,0,7.5,0,24,3.5,26,0x6a7e83);label3D(old,d.name,0,6.3,15.1,21);box(old,0,.7,-6,8,1.4,1.6,0x547080);const display=new THREE.Group();display.position.set(7,.8,3);old.add(display);box(old,7,.35,3,5,.7,6,0x405b69);if(s.type==='clothes'){person(display,0,0,0xd7a267);person(old,-8,0,0x5d6284);}else if(s.type==='workshop'){box(display,0,1,0,1.2,1.8,.7,0xa5b6be);for(const x of [-.55,.55])mesh(new THREE.CylinderGeometry(.25,.35,1.2,10),0x485d6b,display,x,1,.35);}else if(s.type==='ships'){fighterModel(display);display.scale.setScalar(.35);}else if(s.type==='ranged'||s.type==='melee'||s.type==='explosives'){makeWeapon(display,s.type==='ranged'?'rifle':s.type==='melee'?'sabre':'grenade');display.scale.setScalar(2);}else{box(display,0,.6,0,3,1.2,3,d.color);}s.clerk=person(old,0,-8,d.color);s.clerk.userData.actor=true;npcs.push({g:s.clerk,city:old,shop:s,base:s.clerk.position.clone(),name:'Atendente · '+d.short,role:0,phase:s.id,path:[s.clerk.position.clone()],way:0,wait:Infinity});}
function spawnTraffic(s,k){const g=new THREE.Group();g.userData.dynamic=true;scene.add(g);const color=[0x618a9f,0xa6acb1,0xb39569,0x758678][k%4];const front=[[-.65,.7,-2.4],[.65,.7,-2.4],[1.1,.65,-.8],[1.05,.6,1.9],[-1.05,.6,1.9],[-1.1,.65,-.8]];panelMesh(g,front,color);for(let i=0;i<front.length;i++){const a=front[i],b=front[(i+1)%front.length];panelMesh(g,[a,b,[b[0]*.75,.3,b[2]],[a[0]*.75,.3,a[2]]],0x334e5e);}panelMesh(g,[[-.78,.72,-1.35],[.78,.72,-1.35],[.68,1.5,-.3],[-.68,1.5,-.3]],0x72a9bd);panelMesh(g,[[-.68,1.5,-.3],[.68,1.5,-.3],[.65,1.4,.85],[-.65,1.4,.85]],color);for(const side of [-1,1]){panelMesh(g,[[side*.78,.72,-1.35],[side*.68,1.5,-.3],[side*.65,1.4,.85],[side*.95,.65,1.4]],0x344f65);box(g,side*.53,.68,-2.31,.36,.12,.1,mat(0xd4faff,2));box(g,side*.73,.64,1.94,.35,.1,.1,mat(0xf76762,1));box(g,side*1.03,.3,.6,.3,.18,1.8,mat(0x67dbea,1));mesh(new THREE.CylinderGeometry(.21,.29,.2,10),mat(0x68d5ee,1),g,side*.62,.36,1.6).rotation.x=Math.PI/2;}traffic.push({g,s,phase:k/7,stopped:false,speed:10+k%3});}
function updateTraffic(dt){statV05.visibleTraffic=0;const pos=controlledPosition();for(const t of traffic){const visible=t.s.root.visible&&pos.distanceTo(t.s.center)<900;t.g.visible=visible;if(!visible)continue;statV05.visibleTraffic++;const len=660,point=phase=>townPath(t.s,phase);const local=point(t.phase),ahead=point(t.phase+8/len),world=settlementPoint(t.s,local.x,local.z,.4),next=settlementPoint(t.s,ahead.x,ahead.z,.4);t.stopped=npcs.some(n=>n.g.visible&&n.g.getWorldPosition(V()).distanceTo(next)<4)||pos.distanceTo(next)<7||pos.distanceTo(world)<5||traffic.some(o=>o!==t&&o.s===t.s&&o.g.position.distanceTo(next)<6);if(!t.stopped)t.phase=(t.phase+dt*t.speed/len)%1;t.g.position.copy(world);const up=planetUp(world,t.s.p),m=new THREE.Matrix4().lookAt(world,next,up);t.g.quaternion.copy(new THREE.Quaternion().setFromRotationMatrix(m));}}

