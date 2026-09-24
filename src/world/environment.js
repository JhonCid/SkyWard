function boatModel(g,kind='skiff'){const c=kind==='cutter'?0x8fa6b9:0xd7ae76;const rows=[[-2.65,.12],[-1.7,1.05],[0,1.2],[1.9,1.1],[2.1,.8]];for(let j=0;j<rows.length-1;j++)for(const side of [-1,1]){const [z,w]=rows[j],[zz,ww]=rows[j+1];panelMesh(g,[[side*w,.65,z],[side*ww,.65,zz],[side*ww*.6,.05,zz],[side*w*.6,.05,z]],c);panelMesh(g,[[0,.05,z],[0,.05,zz],[side*ww*.6,.05,zz],[side*w*.6,.05,z]],0x405968);}box(g,0,.6,0,2.05,.12,3.8,0x536d75);makeSeat(g,0,.55,.45,0x486172);box(g,0,1.35,-.95,1.7,.25,.65,0x456371);const glass=new THREE.MeshStandardMaterial({color:0xa3d1db,transparent:true,opacity:.2,side:THREE.DoubleSide});panelMesh(g,[[-1,1,-1.6],[1,1,-1.6],[.9,2,-1.1],[-.9,2,-1.1]],0x90bac5).material=glass;box(g,0,2.22,.15,2,.12,2.7,c);for(const side of [-1,1]){bone(g,V(side*.95,.65,1.45),V(side*.95,2.2,1.45),.06,c);mesh(new THREE.TorusGeometry(.27,.07,6,12),0x2b4655,g,side*.7,.2,2.15);}g.userData.boat=true;}
function fishModel(g,i){g.userData.aquatic=true;g.userData.dynamic=true;const col=[0x65bac0,0,0xc4e7f4,0xcb91da,0xe2bc6c,0x75dfc1][i];ellipsoid(g,0,0,0,i===3?.8:i===4?.28:.45,i===3?.7:.48,i===4?2.2:i===3?.8:1.5,col,2);if(i===3)for(let j=0;j<5;j++)bone(g,V((j-2)*.25,-.25,.1),V((j-2)*.4,-1.4,.4),.045,col);ellipsoid(g,0,0,-1,.38,.36,.55,col,2);for(const side of [-1,1])panelMesh(g,[[side*.2,0,-.4],[side*(i===5?2:1.2),-.08,.5],[side*.3,.02,.8]],col);const tail=new THREE.Group();tail.position.z=1.2;g.add(tail);panelMesh(tail,[[0,0,0],[0,.75,.8],[0,0,.55],[0,-.75,.8]],col);g.userData.fishTail=tail;}
function bootEnvironment(){for(const p of planets){const random=rng(7219+p.i*723),state={p,random,rain:0,rainTarget:0,weatherIn:35+random()*90,eventIn:480+random()*720,event:null,boats:[],fish:[],plants:[]};environment.push(state);if(wetPlanet(p)){const water=mesh(new THREE.SphereGeometry(seaRadius(p),96,64),new THREE.MeshStandardMaterial({color:([0x1b7384,0x1b7384,0x407caa,0x514d8d,0x318c8b,0x226d6c][(p.theme || p.i) % 6] || 0x1b7384),roughness:.25,metalness:.3,transparent:true,opacity:.84,flatShading:true}),scene,...p.center.toArray());water.userData.noCollision=true;water.material.side=THREE.DoubleSide;p.water=water;p.waterFar=new THREE.SphereGeometry(seaRadius(p),32,20);p.waterNear=water.geometry;const spots=[];for(let k=0;k<500&&spots.length<18;k++){const n=V(random()*2-1,random()*2-1,random()*2-1).normalize();if(radius(p,n)<seaRadius(p)-7)spots.push(n);}state.spots=spots;for(let k=0;k<spots.length;k++){const n=spots[k],g=new THREE.Group();g.position.copy(waterPoint(p,n,-2.5));g.quaternion.copy(frameAt(g.position,p.center));scene.add(g);fishModel(g,p.i);state.fish.push({g,n,phase:random()*6});for(let j=0;j<3;j++){const plant=new THREE.Group();plant.position.copy(surfacePoint(g.position,p,.1));plant.quaternion.copy(frameAt(plant.position,p.center));scene.add(plant);for(let stem=0;stem<4;stem++){const x=(stem-1.5)*.6;bone(plant,V(x,0,0),V(x+.3,3+stem%2,.2),.09,0x408e83);panelMesh(plant,[[x,1,0],[x+1,2,.15],[x+.3,3,0]],p.i===3?0xa775b7:0x6aaa86);}plant.position.add(V(j*.6,0,j*.5));plant.userData.noCollision=true;state.plants.push(plant);}}
for(let k=0;k<Math.min(3,spots.length);k++){const g=new THREE.Group();scene.add(g);boatModel(g,k%2?'cutter':'skiff');g.userData.dynamic=true;const pilot=person(g,0,.3,0x86a6b4);pilot.position.y=.4;pilot.scale.multiplyScalar(.85);state.boats.push({g,n:spots[k],phase:k*2,pilot});}
// Navigation marks a deep-water site; the player's craft remains physical cargo.
if(spots.length)destinations.push({name:p.def[0]+' · Mar aberto',p,pos:waterPoint(p,spots[0],2),kind:'water'});}
const am=p.atmosphere.material;am.uniforms.lightDir={value:(suns[0]||{pos:V(0,9000,-18000)}).pos.clone().sub(p.center).normalize()};am.vertexShader=am.vertexShader.replace('varying vec3 n;', 'varying vec3 wn;varying vec3 n;').replace('void main(){','void main(){wn=normalize(position);');am.fragmentShader=am.fragmentShader.replace('uniform vec3 tint;','uniform vec3 tint;uniform vec3 lightDir;varying vec3 wn;').replace('rim*.07','rim*.07*smoothstep(-.2,.15,dot(normalize(wn),lightDir))');am.needsUpdate=true;
const cloudMat=new THREE.ShaderMaterial({uniforms:{sunDir:{value:(suns[0]||{pos:V(0,9000,-18000)}).pos.clone().sub(p.center).normalize()},tint:{value:new THREE.Color(0xe0e9ec)},cover:{value:.42}},vertexShader:'varying vec3 q;void main(){q=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 q;uniform vec3 sunDir;uniform vec3 tint;uniform float cover;void main(){vec3 n=normalize(q);float a=sin(n.x*23.+sin(n.z*15.)*2.)*cos(n.y*19.-n.z*6.);float b=sin(n.z*47.+n.y*16.)*sin(n.x*39.);float cloud=smoothstep(cover,cover+.28,a*.7+b*.3);float light=.10+.90*smoothstep(-.1,.4,dot(n,sunDir));gl_FragColor=vec4(tint*light,cloud*.76);}',transparent:true,depthWrite:false,side:THREE.DoubleSide});p.cloud=mesh(new THREE.SphereGeometry(p.r+105,48,32),cloudMat,scene,...p.center.toArray());p.cloud.userData.noCollision=true;}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(240*6),3));rainLines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xa8c6df,transparent:true,opacity:.5,depthWrite:false}));rainLines.frustumCulled=false;rainLines.userData.noCollision=true;scene.add(rainLines);disasterFX=new THREE.Group();disasterFX.userData.noCollision=true;scene.add(disasterFX);
for(const a of animals){if(isWater(a.p,planetUp(a.g.position,a.p))){const random=rng(902+a.p.i*19+a.phase);for(let k=0;k<150;k++){const n=V(random()*2-1,random()*2-1,random()*2-1).normalize();if(!isWater(a.p,n)){a.g.position.copy(surfacePoint(a.p.center.clone().add(n),a.p,.1));a.origin.copy(a.g.position);break;}}}}
for(const g of scenery){const p=nearest(g.position);if(isWater(p,planetUp(g.position,p))){g.visible=false;g.userData.submergedLand=true;}}
}
function daylight(p,pos){if(!p)return {light:V(0,1,0),elevation:1,day:1,sunset:0};const sol=(suns[0]&&suns[0].pos)?suns[0].pos:V(0,1200,0);const light=sol.clone().sub(pos).normalize(),up=planetUp(pos,p),elevation=up.dot(light);return {light,elevation,day:THREE.MathUtils.smoothstep(elevation,-0.15,0.15),sunset:1-THREE.MathUtils.smoothstep(Math.abs(elevation),0,0.38)};}
function environmentSky(dt) {
  if (typeof updateHeadlightsState === 'function') updateHeadlightsState();
  const sol = (suns[0] && suns[0].pos) ? suns[0].pos : V(0, 1200, 0);
  if (suns[0]) {
    suns[0].pos.set(0, 1200, 0);
    if (suns[0].sun) suns[0].sun.position.copy(suns[0].pos);
    if (suns[0].halo) suns[0].halo.position.copy(suns[0].pos);
  }
  const { p, alt, density } = atmosphereAt(camera.position);
  const d = daylight(p, camera.position);
  const day = d.day;
  const env = environment.find(e => e.p === p);
  const rain = env?.rain || 0;

  // Cloud deck altitude is at p.r + 105 (alt ≈ 105m)
  // Gradual transition: 0% above 450m, reaching exactly 100% when crossing the clouds at 105m!
  const cloudAlt = 105.0;
  const atmoCeiling = 450.0;
  let atmoProgress = 0.0;
  if (alt <= cloudAlt) {
    atmoProgress = 1.0;
  } else if (alt < atmoCeiling) {
    const normH = (alt - cloudAlt) / (atmoCeiling - cloudAlt);
    atmoProgress = THREE.MathUtils.smoothstep(1.0 - normH, 0.0, 1.0);
  }

  const inSpace = atmoProgress <= 0.001;
  // Clearer celestial space ambient (not pitch black)
  const spaceSky = new THREE.Color(0x070e1a);

  // Sunset & twilight horizon scattering:
  // When sun is setting, atmosphere scatters warm amber, coral and twilight violet
  const elevation = d.elevation !== undefined ? d.elevation : 1.0;
  const sunsetFactor = THREE.MathUtils.clamp(1.0 - Math.abs(elevation) / 0.35, 0, 1);
  const twilightPhase = THREE.MathUtils.clamp((0.15 - elevation) / 0.35, 0, 1);
  const sunsetAmber = new THREE.Color(0xdf6438);
  const twilightViolet = new THREE.Color(0x5c3875);
  const sunsetSkyColor = sunsetAmber.clone().lerp(twilightViolet, twilightPhase);

  // Soft nocturnal atmosphere (never pitch-black breu)
  const nightSkyColor = new THREE.Color(p ? p.def[5] : 0x112233).multiplyScalar(0.08).add(new THREE.Color(0x0a1424));
  const daySkyColor = new THREE.Color(p ? p.def[5] : 0x446688).multiplyScalar(0.48);

  // Atmospheric sky color blends smoothly through day, sunset twilight, and clear starlit night
  const atmoSky = daySkyColor.clone().lerp(sunsetSkyColor, sunsetFactor * 0.85);
  const fullAtmoSky = nightSkyColor.clone().lerp(atmoSky, THREE.MathUtils.clamp(day + sunsetFactor * 0.45, 0, 1));
  fullAtmoSky.multiplyScalar(1 - rain * 0.35);

  const sky = inSpace ? spaceSky : spaceSky.clone().lerp(fullAtmoSky, atmoProgress);
  scene.background = sky;
  scene.fog.color.copy(sky);
  scene.fog.near = inSpace ? 25000 : THREE.MathUtils.lerp(1800, 450, atmoProgress);
  scene.fog.far = inSpace ? 4000000 : THREE.MathUtils.lerp(50000, 3500, atmoProgress);

  starsObj.material.opacity = inSpace ? 1.0 : Math.max(0, 1.0 - atmoProgress * day * 0.98);

  for (const w of planets) {
    w.haze.value = inSpace ? 0 : (w === p ? 0 : atmoProgress * day * 0.06);
    w.hazeColor.value.copy(sky);
    if (w.atmosphere) {
      w.atmosphere.material.uniforms.tint.value.set(w.def[5]).multiplyScalar(inSpace ? 1.0 : (w === p ? 0.2 + 0.8 * day : 1));
      if (w.atmosphere.material.uniforms.lightDir) {
        w.atmosphere.material.uniforms.lightDir.value.copy(sol.clone().sub(w.center).normalize());
      }
    }
    if (w.cloud && w.cloud.material.uniforms && w.cloud.material.uniforms.sunDir) {
      w.cloud.material.uniforms.sunDir.value.copy(sol.clone().sub(w.center).normalize());
    }
  }

  if (inSpace) {
    // Crisp sunlight and lifted ambient in outer space (clearer space)
    sunlight.color.set(0xfff8ee);
    sunlight.intensity = 2.3;
    for (const light of scene.children) {
      if (light.isHemisphereLight) {
        light.intensity = 0.82; // Clearer ambient lighting in space
        light.color.set(0x769ec8);
        light.groundColor.set(0x283446);
      }
    }
  } else {
    // On planet:
    // Directional Sunlight:
    // Warm golden/amber light during sunset, softer illumination instead of pitch-black darkness
    const sunColor = new THREE.Color(0xffefdc).lerp(new THREE.Color(0xff6e30), sunsetFactor * 0.95);
    sunlight.color.copy(sunColor);

    const effectiveSunElevation = THREE.MathUtils.clamp((elevation + 0.12) / 0.32, 0, 1);
    sunlight.intensity = (0.25 + effectiveSunElevation * 2.4 + sunsetFactor * 0.45) * (1 - rain * 0.5);

    for (const light of scene.children) {
      if (light.isHemisphereLight) {
        // Clearer night and warm sunset ambient (night base is 0.42, sunset adds +0.38, day adds +1.35)
        light.intensity = 0.42 + day * 1.35 + sunsetFactor * 0.38;

        const daySkyLight = new THREE.Color(0xc4e9ff);
        const sunsetSkyLight = new THREE.Color(0xffad6e);
        const nightSkyLight = new THREE.Color(0x3e5e82);
        const currentSkyLight = daySkyLight.clone().lerp(sunsetSkyLight, sunsetFactor * 0.8).lerp(nightSkyLight, (1 - day) * 0.7);
        light.color.copy(currentSkyLight);

        const dayGround = new THREE.Color(0x404051);
        const sunsetGround = new THREE.Color(0x56382a);
        const nightGround = new THREE.Color(0x182432);
        const currentGround = dayGround.clone().lerp(sunsetGround, sunsetFactor * 0.8).lerp(nightGround, (1 - day) * 0.7);
        light.groundColor.copy(currentGround);
      }
    }
  }

  if (suns[0] && suns[0].sun) {
    suns[0].sun.material.color.setRGB(8, 6, 3).lerp(new THREE.Color(8, 1.05, 0.12), d.sunset * atmoProgress);
    suns[0].halo.material.color.set(0xffefc6).lerp(new THREE.Color(0xff5823), d.sunset * atmoProgress);
    suns[0].halo.material.opacity = 1 - rain * 0.6;
  }

  if (!inside && mode === 'foot' && wetPlanet(p) && camera.position.distanceTo(p.center) < seaRadius(p)) {
    scene.fog.near = 0;
    scene.fog.far = 65;
    scene.fog.color.set(p.water.material.color);
    scene.background.copy(scene.fog.color);
  }
}
function startDisaster(state,type){if(state.event)return;discardChildren(disasterFX);disasterFX.position.set(0,0,0);disasterFX.quaternion.identity();if(type==='storm'||type==='hurricane')state.rainTarget=1;state.event={type,elapsed:0,impact:controlledPosition().clone(),lastPulse:0};toast('ALERTA AMBIENTAL · '+({meteor:'chuva de meteoros',storm:'tempestade elétrica',hurricane:'ciclone',quake:'atividade sísmica'}[type])+' em 15 segundos. Busque abrigo.');}
function disasterTick(e,dt,local){const ev=e.event;if(!ev)return;ev.elapsed+=dt;if(ev.elapsed<15)return;if(ev.elapsed>48){e.event=null;e.rainTarget=0;e.eventIn=600+e.random()*900;discardChildren(disasterFX);return;}if(!local)return;const t=ev.elapsed-15,pos=controlledPosition(),dist=pos.distanceTo(ev.impact),p=e.p,up=planetUp(pos,p),exposed=mode==='foot'&&!inside&&!station&&!safeZone(pos);if(ev.type==='quake'&&dist<700&&onFootGround){camera.position.add(V(Math.sin(totalTime*37),Math.cos(totalTime*29),Math.sin(totalTime*41)).multiplyScalar(.055));}
if(ev.type==='hurricane'){if(!disasterFX.children.length){for(let k=0;k<12;k++){const ring=mesh(new THREE.TorusGeometry(3+k*1.3,.45,5,20),new THREE.MeshBasicMaterial({color:0x9babb1,transparent:true,opacity:.28,depthWrite:false}),disasterFX,0,k*5,0);ring.rotation.x=Math.PI/2;}}disasterFX.position.copy(surfacePoint(ev.impact,p));disasterFX.quaternion.copy(frameAt(ev.impact,p.center));disasterFX.rotateY(t*1.5);if(dist<180&&exposed){const wind=ev.impact.clone().sub(player).addScaledVector(up,3).normalize().multiplyScalar(dt*5);player.copy(moveActor(player,wind,{up,p}));}}
if(t-ev.lastPulse>(ev.type==='meteor'?3:ev.type==='storm'?4:7)){ev.lastPulse=t;if(ev.type==='meteor'||ev.type==='storm'){const f=frameAt(ev.impact,p.center),impact=surfacePoint(ev.impact.clone().add(V((e.random()-.5)*200,0,(e.random()-.5)*200).applyQuaternion(f)),p,.2);if(ev.type==='meteor'){const g=mesh(new THREE.IcosahedronGeometry(1.2,1),mat(0xffa359,3),disasterFX);g.position.copy(impact).addScaledVector(planetUp(impact,p),180);g.userData.fall={target:impact,ttl:1.2};}else{const verts=[];let old=impact;for(let k=1;k<=8;k++){const next=impact.clone().addScaledVector(up,k*20).add(V(Math.sin(k*13+t)*5,0,Math.cos(k*7+t)*5));verts.push(...old.toArray(),...next.toArray());old=next;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xd7edff}));line.userData.ttl=.25;disasterFX.add(line);if(audioContext&&!audioMuted)tone(42,audioContext.currentTime+.25,.8,.08,fxBus,'sawtooth');if(pos.distanceTo(impact)<9&&exposed){suitShield=Math.max(0,suitShield-18);health=Math.max(1,health-8);}}}}
for(const o of [...disasterFX.children]){if(o.userData.fall){const f=o.userData.fall;f.ttl-=dt;o.position.lerp(f.target,Math.min(1,dt/Math.max(.01,f.ttl)));if(f.ttl<=0){particleBurst(f.target,0xffa266,18,12);if(pos.distanceTo(f.target)<14&&exposed)health=Math.max(1,health-20);disasterFX.remove(o);o.geometry.dispose();o.material.dispose();}}else if(o.userData.ttl!==undefined){o.userData.ttl-=dt;if(o.userData.ttl<=0){disasterFX.remove(o);o.geometry.dispose();o.material.dispose();}}}}
function waterMovement(dt){if(mode!=='foot'||inside||station||resting)return false;const p=groundPlanet||nearest(player),up=planetUp(player,p),depth=seaRadius(p)-radius(p,up),alt=player.distanceTo(p.center)-seaRadius(p);if(depth<1.2||alt>1||!wetPlanet(p))return false;eva=false;groundPlanet=p;onFootGround=false;jetActive=false;const frame=frameAt(player,p.center),delta=V(axisStrafe(),0,-axisForward());if(delta.lengthSq()>1)delta.normalize();delta.applyAxisAngle(UP,yaw).applyQuaternion(frame).multiplyScalar(dt*(sprinting()?4.2:2.7));player.copy(moveActor(player,delta,{up,p,height:1.8,grounded:false}));player.copy(waterPoint(p,planetUp(player,p),.45));if(keys.Space&&jetFuel>0){jumpVelocity=7;jetFuel=Math.max(0,jetFuel-dt*28);player.addScaledVector(up,1);footContext='ground';}return true;}
function environmentTick(dt,paused){if(boost||!planets||planets.length===0)return;environmentSky(dt);const pos=controlledPosition(),p=nearest(pos),near=pos.distanceTo(p.center)<p.r+600;for(const e of environment){const local=e.p===p&&near;if(e.p.water){e.p.water.geometry=e.p.lodIndex>=3?e.p.waterNear:e.p.waterFar;e.p.water.visible=e.p.globe.visible;}e.p.cloud.visible=performancePrefs.clouds&&e.p.globe.visible;e.p.cloud.material.uniforms.cover.value=.48-e.rain*.3;if(!paused)e.p.cloud.rotateY(dt*.0005);for(const f of e.fish){f.g.visible=local&&f.g.position.distanceTo(pos)<160;if(!f.g.visible||paused)continue;const n=f.n.clone().add(V(Math.sin(totalTime*.17+f.phase)*.009,0,Math.cos(totalTime*.17+f.phase)*.009)).normalize();f.g.position.copy(waterPoint(p,n,-2.5));f.g.quaternion.copy(frameAt(f.g.position,p.center));f.g.rotateY(totalTime*.17+f.phase);f.g.userData.fishTail.rotation.y=Math.sin(totalTime*5+f.phase)*.45;}for(const g of e.plants){g.visible=local&&g.position.distanceTo(pos)<120;if(g.visible&&!paused){g.quaternion.copy(frameAt(g.position,e.p.center));g.rotateZ(Math.sin(totalTime*.8+g.position.x)*.06);}}for(const b of e.boats){b.g.visible=local&&b.g.position.distanceTo(pos)<600;if(paused)continue;const n=b.n.clone().add(V(Math.sin(totalTime*.06+b.phase)*.015,0,Math.cos(totalTime*.06+b.phase)*.015)).normalize();const candidate=waterPoint(e.p,n,.2);if(candidate.distanceTo(pos)>6)b.g.position.copy(candidate);b.g.quaternion.copy(frameAt(b.g.position,e.p.center));b.g.rotateY(totalTime*.06+b.phase);if(b.g.visible)animateHuman(b.pilot,dt,true);}
if(paused||!local)continue;e.weatherIn-=dt;e.eventIn-=dt;if(e.weatherIn<=0){e.weatherIn=90+e.random()*150;e.rainTarget=wetPlanet(p)&&e.random()<.32?.65+e.random()*.35:0;}e.rain=THREE.MathUtils.lerp(e.rain,e.rainTarget,1-Math.exp(-dt*.05));if(e.eventIn<=0&&!e.event)startDisaster(e,['meteor','storm','hurricane','quake'][Math.floor(e.random()*(wetPlanet(p)?4:2))*(!wetPlanet(p)?3:1)]||'quake');disasterTick(e,dt,local);}
const local=environment.find(e=>e.p===p);if(disasterFX)disasterFX.visible=near&&!!local?.event;const raining=near&&(local?.rain||0)>.08&&!inside&&!station&&mode!=='pilot',count=quality==='low'?90:240;if(rainLines){rainLines.visible=raining&&particlesEnabled&&performancePrefs.rain;if(rainLines.visible&&!paused){const a=rainLines.geometry.attributes.position,frame=frameAt(pos,p.center);for(let i=0;i<count;i++){const phase=(totalTime*(p.i===2?3:22)+i*1.731)%25,x=Math.sin(i*12.98)*18,z=Math.cos(i*7.23)*18;const v=V(x,20-phase,z).applyQuaternion(frame).add(pos),end=v.clone().addScaledVector(planetUp(pos,p),p.i===2?.2:-1.2);a.setXYZ(i*2,v.x,v.y,v.z);a.setXYZ(i*2+1,end.x,end.y,end.z);}a.needsUpdate=true;rainLines.geometry.setDrawRange(0,count*2);rainLines.material.opacity=(local?.rain||0)*.55;}}
if(mode==='rover'&&rover.parent!==ship&&wetPlanet(p)&&isWater(p,planetUp(rover.position,p))&&!paused){const n=planetUp(rover.position,p),aquatic=['skiff','cutter'].includes(vehicleKind);if(aquatic){rover.position.copy(waterPoint(p,n,.2));roverAir=false;}else{$('state').textContent='VEÍCULO SUBMERSO · USE UMA EMBARCAÇÃO';}}
for(const g of scenery)if(g.userData.submergedLand)g.visible=false;if(near&&local&&local.rain>.1)$('airState').textContent+=' · '+(p.i===2?'NEVE':'CHUVA');if(local&&local.event){const ev=local.event,names={meteor:'METEOROS',storm:'RAIOS',hurricane:'CICLONE',quake:'TREMOR'};$('gestureState').textContent+=' · '+names[ev.type]+(ev.elapsed<15?' EM '+Math.ceil(15-ev.elapsed)+' s':' · BUSQUE ABRIGO');}}

