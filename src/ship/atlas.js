// Atlas v3: baked metres, nose along -Z, deck at Y=.33. Source GLB is in assets/.
const ATLAS={scale:2,deckY:.33,hinge:V(0,.33,11),angle:Math.atan2(2.4,8.3),length:Math.hypot(16.6,4.8),rampRun:16.6,gearHeight:5.25};
let atlasRig=null;
function atlasFloats(s){const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return new Float32Array(bytes.buffer);}
function atlasMaterials(){return ATLAS_ASSET.materials.map(m=>{const p=m.pbrMetallicRoughness||{},c=p.baseColorFactor||[1,1,1,1];const mat=new THREE.MeshStandardMaterial({color:new THREE.Color(...c.slice(0,3)),metalness:p.metallicFactor??1,roughness:p.roughnessFactor??1,side:THREE.DoubleSide,transparent:m.alphaMode==='BLEND',opacity:c[3],depthWrite:m.alphaMode!=='BLEND',emissive:new THREE.Color(...(m.emissiveFactor||[0,0,0])),emissiveIntensity:m.extensions?.KHR_materials_emissive_strength?.emissiveStrength||1});mat.name=m.name;return mat;});}
function atlasPoint(name){return V(...ATLAS_ASSET.nodes.find(n=>n.name===name).origin);}
function buildAtlas(){
 const materials=atlasMaterials(),nodes=new Map();atlasRig={nodes,doors:[],pistons:[],gears:[]};
 for(const n of ATLAS_ASSET.nodes){
  if(n.name==='CargoRamp_Hydraulics')continue; // replaced by articulated, bounded telescopes
  const group=new THREE.Group();group.name=n.name;ship.add(group);nodes.set(n.name,group);
  n.parts.forEach((p,i)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(atlasFloats(p.p),3));geo.setAttribute('normal',new THREE.BufferAttribute(atlasFloats(p.n),3));geo.computeBoundingBox();geo.computeBoundingSphere();const o=new THREE.Mesh(geo,materials[p.mat].clone());o.name=n.name+'__'+i;o.userData.thinPanel=true;o.userData.atlasSurface=true;o.castShadow=!o.material.transparent;o.receiveShadow=true;if(/Lights|Glow|Hazard_Lines|Screen|Guidance|Holographic/.test(n.name))o.userData.noCollision=true;if(o.material.transparent)o.userData.viewport=true;group.add(o);});
 }
 const ramp=new THREE.Group();ramp.name='ramp';ramp.position.copy(ATLAS.hinge);ramp.userData.dynamic=true;ship.add(ramp);atlasRig.ramp=ramp;
 for(const name of ['CargoRamp_Solid_Deck','CargoRamp_Hazard_Lines']){const o=nodes.get(name);ramp.add(o);o.position.copy(ATLAS.hinge).negate();o.traverse(m=>{if(m.isMesh)m.userData.rampDeck=true;});}
 // The ramp closes flat into the ventral bay, rather than rotating through the roof.
 const state=new THREE.Group();state.name='door';state.userData.progress=1;state.userData.target=1;ship.add(state);
 for(const side of [-1,1]){
  const root=new THREE.Group();root.name='Atlas_Ramp_Piston_'+side;root.userData.noCollision=true;ship.add(root);
  const sleeve=mesh(new THREE.CylinderGeometry(.075,.075,1,12),0x28333c,root),rod=mesh(new THREE.CylinderGeometry(.058,.058,1,12),0xb3c3ce,root);
  // Both anchors stay within the side channel. Neither cylinder can protrude past an anchor.
  const fixed=V(side*3.34,-.1,23.5),moving=V(side*3.34,-4.1,12.3);
  bone(root,fixed,V(side*3.52,-.1,23.5),.07,0x526472);
  const clevis=bone(ramp,V(side*3.15,-3.55,12.3),moving,.065,0x526472);if(clevis)clevis.userData.noCollision=true;
  const joint=mesh(new THREE.SphereGeometry(.095,10,8),0xa1b4c1,root);mesh(new THREE.SphereGeometry(.095,10,8),0xa1b4c1,root,...fixed.toArray());
  atlasRig.pistons.push({root,sleeve,rod,joint,fixed,moving,length:0});
 }
 for(const name of ['Cockpit','CrewQuarters','Engineering','Hygiene','MedBay','OpsRoom']){
  const leaves=[...nodes].filter(([n])=>n.startsWith('Door_'+name+'_')).map(([,o])=>o);
  const panel=nodes.get('DoorPanel_'+name+'_Screen');if(!panel||!leaves.length)continue;
  const sideDoor=leaves.length===1,axis=sideDoor?'z':'x';
  const group=new THREE.Group();group.name='Atlas_Door_'+name;ship.add(group);
  const bounds=new THREE.Box3();leaves.forEach(o=>{group.add(o);o.updateMatrixWorld(true);for(const m of o.children)bounds.union(m.geometry.boundingBox);});
  const center=bounds.getCenter(V()),size=bounds.getSize(V());
  const d={kind:'door',atlas:true,o:group,point:atlasPoint('DoorPanel_'+name+'_Screen'),doorPoint:center,normal:sideDoor?V(1,0,0):V(0,0,1),half:sideDoor?size.z/2:size.x/2,open:false,progress:0,label:'Porta · '+name,leaves:leaves.map(o=>({o,axis,travel:(sideDoor?1:(o.name.includes('PortLeaf')?1:-1))*(sideDoor?size.z+.1:size.x/2+.08)}))};
  group.userData.dynamic=true;shipInteractables.push(d);atlasRig.doors.push(d);
 }
 for(const loc of ['Gear_Port','Gear_Starboard','Interior']){const o=nodes.get('CargoRamp_Panel_'+loc+'_Screen');const light=o.children[0];shipInteractables.push({kind:'gate',o,light,point:atlasPoint(o.name),outside:loc!=='Interior',label:'Acionar rampa'});}
 for(const loc of ['Nose','Port','Starboard']){
  const g=new THREE.Group();g.name='Atlas_Gear_'+loc;g.userData.dynamic=true;ship.add(g);
  const anchor=atlasPoint('LandingGear_'+loc+'_Housing');g.position.copy(anchor);
  for(const suffix of ['Struts','Footpad']){const o=nodes.get('LandingGear_'+loc+'_'+suffix);g.add(o);o.position.copy(anchor).negate();}
  if(loc!=='Nose')for(const suffix of ['Housing','Screen']){const panel=nodes.get('CargoRamp_Panel_Gear_'+loc+'_'+suffix);g.add(panel);panel.position.copy(anchor).negate();}
  atlasRig.gears.push(g);landingGears.push({atlas:true,g});
 }
 // Two short tread ramps bridge the authored 44 cm flight-deck risers.
 for(const [z0,y0,z1,y1] of [[-22.5,.335,-24.08,.775],[-24.45,.775,-25.55,1.168]]){
  const tread=panelMesh(ship,[[-1.02,y0,z0],[1.02,y0,z0],[1.02,y1,z1],[-1.02,y1,z1]],0x293a48);tread.name='Atlas_Cockpit_Access';tread.userData.thinPanel=true;tread.userData.atlasSurface=true;
 }
 registerAtlasFurniture();bindAtlasCockpit();mountShipHeadlights();cabinLights();
 ship.add(rover);rover.position.copy(layout().rover);rover.rotation.set(-ATLAS.angle,Math.PI,0);
 updateAtlasGate(0);ship.updateMatrixWorld(true);if(collisionReady)refreshMovingBodies();
 ship.userData.atlasV3=true;
}
function bindAtlasCockpit(){
 cockpit3DButtons.length=0;
 const actions={Cockpit_Screen_Left_PowerBrake:'brake',Cockpit_Screen_Center_RadarScan:'map',Cockpit_Screen_Right_FlightAvionics:'land',Cockpit_Button_Ramp_Toggle:'ramp',Cockpit_Button_Lights_Toggle:'lights'};
 ship.traverse(o=>{if(!o.isMesh)return;const action=actions[o.material.name];if(!action)return;
  // Original screen geometry is retained; generated telemetry is mapped to its dominant plane.
  const p=o.geometry.attributes.position,b=o.geometry.boundingBox,size=b.getSize(V()),axes=['x','y','z'].sort((a,c)=>size[c]-size[a]),uv=[];
  for(let i=0;i<p.count;i++){const v=V(p.getX(i),p.getY(i),p.getZ(i));uv.push(1-(v[axes[0]]-b.min[axes[0]])/size[axes[0]],(v[axes[1]]-b.min[axes[1]])/size[axes[1]]);}
  o.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const tex=makeMfdTelemetryTexture(action);o.material.map=tex;o.material.emissiveMap=tex;o.material.emissive.setHex(0xffffff);o.material.emissiveIntensity=.65;
  Object.assign(o.userData,{isCockpitButton:true,action,label:({brake:'Frear nave',map:'Mapa estelar',land:'Pousar',ramp:'Acionar rampa',lights:'Faróis'})[action],execute:()=>executeCockpitAction(action)});cockpit3DButtons.push(o);
 });
}
function atlasSegment(o,a,b){const delta=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(UP,delta.clone().normalize());o.scale.y=delta.length();}
function updateAtlasGate(dt){
 if(!atlasRig)return;
 const state=ship.getObjectByName('door').userData;if(dt>0&&state.target===0&&doorwayOccupied()){state.target=1;rampOpen=true;}let t=state.progress??1,target=state.target??1;
 t+=Math.sign(target-t)*Math.min(Math.abs(target-t),dt*.65);state.progress=t;
 atlasRig.ramp.rotation.x=-ATLAS.angle*(1-THREE.MathUtils.smoothstep(t,0,1));
 const q=atlasRig.ramp.quaternion;
 for(const p of atlasRig.pistons){const a=p.fixed,b=p.moving.clone().applyQuaternion(q).add(ATLAS.hinge),length=a.distanceTo(b),dir=b.clone().sub(a).normalize();
  // Nested sections telescope with 12% overlap; endpoints remain exactly at the pins.
  atlasSegment(p.sleeve,a,a.clone().addScaledVector(dir,length*.56));atlasSegment(p.rod,a.clone().addScaledVector(dir,length*.44),b);p.length=length;p.joint.position.copy(b);
 }
 // Cargo carried by the deck follows its height through the entire cycle, even when not driven.
 if(rover.parent===ship&&rover.position.z>=ATLAS.hinge.z){atlasPlaceRover(rover.position,rover.rotation.y);}
 for(const i of shipInteractables)if(i.kind==='gate'){if(i.outside){i.light.updateWorldMatrix(true,false);i.point.copy(i.light.geometry.boundingBox.getCenter(V()).applyMatrix4(i.light.matrixWorld));ship.worldToLocal(i.point);}i.light.material.emissive.setHex(rampOpen?0x73cba6:0xffae35);}
}
function updateAtlasDoor(d,dt){const target=d.open?1:0;d.progress+=Math.sign(target-d.progress)*Math.min(Math.abs(target-d.progress),dt*1.5);for(const leaf of d.leaves)leaf.o.position[leaf.axis]=leaf.travel*THREE.MathUtils.smoothstep(d.progress,0,1);d.o.visible=d.progress<.999;d.o.traverse(o=>o.userData.removed=d.progress>=.999);}
function atlasRampSlope(){return ATLAS.angle+atlasRig.ramp.rotation.x;}
function atlasPlaceRover(pos,heading){const slope=atlasRampSlope(),distance=Math.max(0,pos.z-ATLAS.hinge.z);pos.y=ATLAS.deckY-distance*Math.tan(slope);rover.rotation.set(Math.cos(heading)*slope,heading,0,'YXZ');}
function atlasRoverMove(next,origin){
 const l=layout(),slope=atlasRampSlope(),run=ATLAS.length*Math.cos(slope),half=1.22;
 // The rover stays in the cargo bay: the engineering door is for people.
 next.x=THREE.MathUtils.clamp(next.x,-l.doorHalf+half,l.doorHalf-half);next.z=Math.max(10.8,next.z);
 const t=ship.getObjectByName('door').userData.progress;
 if(t<.98)next.z=Math.min(next.z,ATLAS.hinge.z+run-2.1);
 rover.position.copy(next);atlasPlaceRover(rover.position,new THREE.Euler().setFromQuaternion(rover.quaternion,'YXZ').y);
 if(t>=.98&&next.z>=ATLAS.hinge.z+run-.25){scene.attach(rover);inside=false;roverAir=false;roverVelocity.set(0,0,0);}
}
// Cache triangle bounds once. Exact triangle contacts preserve holes in combined hull meshes.
function atlasSurfacePush(center,r,b){
 const local=center.clone().applyMatrix4(b.inv),p=b.obj.geometry.attributes.position;
 if(!b.obj.geometry.userData.atlasTriangles){const list=[];for(let i=0;i<p.count;i+=3){const tri=new THREE.Triangle(V().fromBufferAttribute(p,i),V().fromBufferAttribute(p,i+1),V().fromBufferAttribute(p,i+2));list.push({tri,bounds:new THREE.Box3().setFromPoints([tri.a,tri.b,tri.c])});}b.obj.geometry.userData.atlasTriangles=list;}
 let best=null,depth=0;const scale=Math.min(Math.abs(b.scale.x),Math.abs(b.scale.y),Math.abs(b.scale.z)),rr=r/scale;
 for(const item of b.obj.geometry.userData.atlasTriangles){if(item.bounds.distanceToPoint(local)>rr)continue;const closest=item.tri.closestPointToPoint(local,V()),delta=local.clone().sub(closest),len=delta.length();if(len<rr&&rr-len>depth){if(len>.00001)delta.divideScalar(len);else item.tri.getNormal(delta);depth=rr-len;best=delta.multiplyScalar((depth+.001)*scale).applyQuaternion(b.rotation);}}
 return best;
}
function registerAtlasFurniture(){
 const n=atlasRig.nodes,bedPoint=atlasPoint('Crew_Bunk_Navy_Mattresses');
 const bed=new THREE.Group();bed.position.copy(bedPoint).add(V(0,-.76,0));bed.name='Atlas_Bed_Interaction';ship.add(bed);
 shipInteractables.push({kind:'bed',o:bed,point:bedPoint.clone().add(V(.7,1,0)),label:'Deitar na cama'});
 const locker=new THREE.Group();locker.position.copy(atlasPoint('Airlock_Suit_Lockers'));ship.add(locker);shipInteractables.push({kind:'locker',o:locker,point:locker.position.clone().add(V(-.5,1,0)),label:'Armário EVA'});
}
