function cabinLights() {
  const l = layout();
  // Cockpit instrument and console light (cozy, warm sci-fi cockpit)
  const cockLight = new THREE.PointLight(0xbde8ff, 2.2, 14, 1.2);
  cockLight.position.copy(l.cockpit).add(V(0, 0.7, 0.6));
  cockLight.name = 'cockpitLight';
  ship.add(cockLight);

  // Pilot seat light
  const seatLight = new THREE.PointLight(0xffedd5, 1.6, 9, 1.2);
  seatLight.position.copy(l.seat).add(V(0, 1.3, 0));
  ship.add(seatLight);

  // Cabin interior ceiling lights across the length
  const zs = [-l.halfZ * 0.65, -l.halfZ * 0.2, l.halfZ * 0.3, l.halfZ * 0.75];
  for (const z of zs) {
    const light = new THREE.PointLight(0xdcf0ff, 3.2, 16, 1.2);
    light.position.set(shipType === 2 ? 3 : 0, 2.85, z);
    light.name = 'cabinLight';
    ship.add(light);
  }

  // Ship interior soft ambient fill
  const cabinAmb = new THREE.PointLight(0x5a7895, 1.2, 28, 1.2);
  cabinAmb.position.set(0, 2.7, 0);
  ship.add(cabinAmb);

  // Ship exterior hull soft fill: subtle, non-glowing starlight bounce
  const hullFill = new THREE.PointLight(0x5a7895, 0.85, 30, 1.5);
  hullFill.position.set(0, 4.5, -2);
  hullFill.name = 'hullFill';
  ship.add(hullFill);

  // Exterior headlights & synchronized running lights are mounted in mountShipHeadlights()
}
function gateSwitches(){const l=layout(),tangent=V().crossVectors(UP,l.normal),base=l.entry.clone().addScaledVector(tangent,l.doorHalf+.45).setY(1.45);for(const outside of [false,true]){const point=base.clone().addScaledVector(l.normal,outside?.32:-.32),g=new THREE.Group();g.position.copy(point);g.quaternion.setFromUnitVectors(V(0,0,1),l.normal.clone().multiplyScalar(outside?1:-1));ship.add(g);box(g,0,0,0,.28,.4,.08,0x263d4b);const light=box(g,0,0,.05,.17,.24,.02,mat(0x8dccb0,.7));shipInteractables.push({kind:'gate',o:g,light,point,outside,label:'Acionar portão'});} }
function switchCandidate(){
  if(mode!=='foot')return null;
  const pos=inside?foot:localPoint(player);
  if(!inside && typeof nearbyHangarTerminal === 'function'){
    const term = nearbyHangarTerminal();
    if(term && term.getWorldPosition(V()).distanceTo(player) < 6.5){
      return { kind: 'terminal', point: term.getWorldPosition(V()), label: 'Acessar Terminal de Hangar' };
    }
  }
  // View direction of player inside ship (forward in ship local space)
  const lookDir=inside?V(-Math.sin(yaw),0,-Math.cos(yaw)):V(0,0,-1);
  let best=null, bestScore=Infinity;
  for(const i of shipInteractables){
    if(i.kind==='gate' ? (i.outside===inside) : !inside) continue;
    const toTarget=V(i.point.x-pos.x, 0, i.point.z-pos.z);
    const dist=toTarget.length();
    // Bed requires standing right next to it (1.35m); doors and gates have wider reach (2.4m)
    const maxDist=i.kind==='bed'?1.35:i.kind==='bench'?1.5:i.kind==='locker'?1.6:(i.kind==='gate'?2.4:2.4);
    if(dist>maxDist) continue;
    const dot=dist>0.05?(toTarget.x*lookDir.x + toTarget.z*lookDir.z)/dist:1;
    // Bed strictly requires facing towards it (never interact with bed when facing the bedroom door!)
    if(i.kind==='bed' && dot<0.25) continue;
    if((i.kind==='locker'||i.kind==='bench') && dot<-0.1) continue;
    // Weight score by alignment with crosshair so facing an object strongly prioritizes it
    const score=dist - dot*1.6;
    if(score<bestScore){
      bestScore=score;
      best=i;
    }
  }
  return best;
}
function doorwayOccupied(item){if(layout().atlas&&!item){const local=inside?foot:localPoint(player),slope=atlasRampSlope(),end=ATLAS.hinge.z+ATLAS.length*Math.cos(slope);if(mode==='foot'&&Math.abs(local.x)<3.6&&local.z>ATLAS.hinge.z-.5&&local.z<end+.6)return true;if(rover.parent===ship&&rover.position.z>end-2.1)return true;return false;}const l=layout(),point=item?.doorPoint||item?.point||l.entry,normal=item?.normal||l.normal,half=item?.half||l.doorHalf,local=mode==='rover'?localPoint(rover.getWorldPosition(V())):inside?foot:localPoint(player),d=local.clone().sub(point),t=V().crossVectors(UP,normal);return Math.abs(d.dot(normal))<.7&&Math.abs(d.dot(t))<half+.4&&local.y<3.5;}
function useShipInterior(){
  if(resting){standUp();return true;}
  const found=switchCandidate();
  if(!found)return false;
  if(found.kind==='terminal'){
    menu('hangarTerminal');
    return true;
  }
  if(found.kind==='gate'){
    if(!rampOpen||!doorwayOccupied())openRamp(!rampOpen,false);
    else toast('Entrada ocupada. Afaste-se para fechar o portão.');
    return true;
  }
  if(found.kind==='door'){
    if(found.open&&doorwayOccupied(found)){toast('Passagem ocupada. Afaste-se para fechar.');return true;}
    found.open=!found.open;
    toast(found.open?'Abrindo passagem.':'Fechando passagem.');
  }else if(found.kind==='locker'){
    activeLocker=found;
    menu('locker');
  }else if(found.kind==='bed'){
    const bedPos=found.o.position;
    resting={
      kind:'bed',
      returnPoint:foot.clone(),
      // Eye positioned on the pillow (pillow top is 1.06, eye at 1.08, z = -1.0)
      point:bedPos.clone().add(V(0, 1.08, -1.0)),
      // Avatar root positioned so back rests on mattress and head aligns on pillow
      avatar:bedPos.clone().add(V(0, 1.05, 0.49)),
      angle:0
    };
    yaw=Math.PI; // Looking along the bed towards the feet and ceiling
    pitch=0.45;  // Looking relaxed upwards towards the ceiling
    toast('Deitado na cama. Pressione E ou Espaço para levantar.');
  }else{
    resting={
      kind:found.kind,
      returnPoint:foot.clone(),
      point:found.point.clone().add(V(0,.35,0)),
      avatar:found.o.position.clone().add(V(0,.6,0))
    };
    yaw=0;
    pitch=0;
    toast('Sentado. Pressione E ou Espaço para levantar.');
  }
  return true;
}
function openRamp(open=true,immediate=true){if(!open&&layout().atlas&&doorwayOccupied()){toast('Afaste-se da rampa para fechar.');return;}rampOpen=open;const door=ship.getObjectByName('door');door.userData.target=open?1:0;if(immediate)door.userData.progress=door.userData.target;updateGateGeometry(0);}
function updateGateGeometry(dt){if(layout().atlas){updateAtlasGate(dt);return;}const door=ship.getObjectByName('door'),ramp=ship.getObjectByName('ramp');if(!door||!ramp)return;let t=door.userData.progress??1,target=door.userData.target??(rampOpen?1:0);t=THREE.MathUtils.clamp(t+Math.sign(target-t)*Math.min(Math.abs(target-t),dt*1.6),0,1);door.userData.progress=t;door.position.y=2.4+t*2.3;door.scale.y=Math.max(.001,1-t);door.visible=t<.995;door.userData.removed=t>.995;ramp.visible=t>.01;ramp.userData.removed=t<.01;ramp.quaternion.setFromAxisAngle(UP,Math.atan2(layout().normal.x,layout().normal.z)).multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0),(1-t)*-Math.PI/2));ramp.traverse(o=>o.userData.removed=t<.01);for(const i of shipInteractables)if(i.kind==='gate'){i.light.material.color.set(rampOpen?0x8dccb0:0xd6a168);i.light.material.emissive.copy(i.light.material.color);}}
function tickInteriors(dt,paused){if(!paused){updateGateGeometry(dt);for(const d of shipInteractables)if(d.kind==='door'){if(d.atlas){updateAtlasDoor(d,dt);continue;}const target=d.open?1:0;d.progress=THREE.MathUtils.clamp(d.progress+Math.sign(target-d.progress)*Math.min(Math.abs(target-d.progress),dt*2),0,1);for(const part of d.o.children)part.position.x=part.userData.doorSide*d.half*(.5+d.progress);d.o.visible=d.progress<.995;d.o.traverse(o=>o.userData.removed=d.progress>.995);}}const i=switchCandidate();let promptText = '';
  if (mode === 'foot') {
    const pos = inside ? shipPoint(foot) : player;
    if (inside) {
      if (!resting && foot.distanceTo(layout().seat) < 2.6) {
        promptText = 'Sentar na cadeira do piloto';
      } else if (resting) {
        promptText = resting.kind === 'bed' ? 'Levantar da cama' : 'Levantar da cadeira';
      } else if (i) {
        if (i.kind === 'gate') promptText = rampOpen ? 'Fechar rampa' : 'Abrir rampa';
        else if (i.kind === 'door') promptText = i.open ? 'Fechar porta' : 'Abrir porta';
        else if (i.kind === 'bed') promptText = 'Deitar na cama';
        else if (i.kind === 'bench') promptText = 'Sentar na cadeira';
        else if (i.kind === 'locker') promptText = 'Abrir armário';
      } else {
        const rel = foot.clone().sub(layout().entry);
        if (rampOpen && inDoor(foot, 0.8) && rel.dot(layout().normal) > -1.0) {
          promptText = 'Descer rampa';
        }
      }
    } else {
      const distToEntry = player.distanceTo(entryWorld());
      const nearRover = player.distanceTo(rover.getWorldPosition(V())) < 3.5;
      const nearNpc = npcs.find(n => player.distanceTo(n.g.getWorldPosition(V())) < 3.8);
      const nearAnimal = animals.find(a => player.distanceTo(a.g.position) < 3.8);
      if (distToEntry < 10) {
        promptText = 'Subir rampa da nave';
      } else if (nearRover) {
        promptText = 'Embarcar no veículo';
      } else if (nearNpc) {
        promptText = nearNpc.shop ? 'Realizar compras' : 'Iniciar conversa';
      } else if (nearAnimal) {
        promptText = 'Acariciar animal';
      }
    }
  } else if (mode === 'pilot') {
    if (targetedCockpitButton) {
      promptText = 'Apertar botão: ' + (targetedCockpitButton.userData.label || '');
    } else if (landed) {
      promptText = 'Levantar da cadeira';
    }
  } else if (mode === 'rover') {
    promptText = '2 dedos ↑ à esq. para sair [R]';
  }
  $('interiorPrompt').textContent = promptText;}

