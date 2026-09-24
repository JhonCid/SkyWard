const repairSites=[],rescueSites=[],salvageSites=[];
function initJobs() {
  repairSites.length = 0;
  rescueSites.length = 0;
  salvageSites.length = 0;
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    for (let j = 0; j < 3; j++) {
      const g = new THREE.Group();
      g.position.copy(p.center).add(V(j === 0 ? -14 : 14, p.r + 2, j === 2 ? 38 : -32 + j * 20));
      scene.add(g);
      box(g, 0, 1, 0, 1.6, 2, 1.6, 0x617a85);
      mesh(new THREE.CylinderGeometry(.17, .23, 5, 10), 0x8a9a9d, g, 0, 3.7, 0);
      const bulb = mesh(new THREE.SphereGeometry(.4, 12, 8), mat(0xe6a16c, 1), g, 0, 6.4, 0);
      repairSites.push({ g, p, bulb, index: j });
    }
    const normal = V(.19, 1, .15).normalize(), pos = p.center.clone().addScaledVector(normal, radius(p, normal) + .1), g = new THREE.Group();
    g.position.copy(pos);
    g.quaternion.copy(frameAt(pos, p.center));
    scene.add(g);
    const survivor = person(g, 0, 0, 0xe89e79);
    box(g, 3, 1, 0, 2, 2, 3, 0x79785f);
    rescueSites.push({ g, p, survivor });
  }
  const stDest = destinations.find(d => d.station);
  const stPos = stDest ? stDest.pos : V(1800, 2300, 2400);
  for (let j = 0; j < 2; j++) {
    const g = new THREE.Group();
    g.position.copy(stPos).add(V(-25 + j * 50, 110 + j * 20, 160));
    scene.add(g);
    box(g, 0, 0, 0, 3, 2, 3, 0xa48b67);
    box(g, 0, 1.2, 0, 2.2, .3, 2.2, mat(0x89cedc, .8));
    salvageSites.push({ g, index: j });
  }
}
function clearMissionCargo(){ship.children.filter(c=>c.name==='cargo'||c.name==='passenger').forEach(c=>{ship.remove(c);c.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.map?.dispose();o.material.dispose();}});});}
function acceptJob(type){if(['hunt','bounty','patrol'].includes(type))return acceptCombat(type);if(mission){toast('Conclua ou cancele o contrato atual.');return;}const port=atPort(),def=jobDefs.find(j=>j[0]===type);if(!port||!def){toast('Aceite um contrato perto de um porto.');return;}const origin=destinations.indexOf(port);const validPlanetIndex=(port.p?port.p.i:0)%Math.max(1,planets.length);const possiblePorts=destinations.filter(d=>!d.gate&&d.kind!=='water'&&d!==port);const targetPort=possiblePorts.length>0?possiblePorts[(origin+1)%possiblePorts.length]:(destinations.find(d=>!d.gate&&d.kind!=='water')||port);const targetIndex=destinations.indexOf(targetPort);mission={type,origin,to:targetIndex,startMined:mined,seen:[],done:[],planetIndex:validPlanetIndex,picked:false,label:def[1],reward:def[3]};if(type==='cargo'){cargo=4;const l=layout();for(let j=0;j<4;j++){const c=box(ship,l.rover.x+(shipType===2?0:0),1,shipType===2?5+j*1.7:shipType===1?8:-3+j*1.7,1.3,1.3,1.3,0xd8af73);if(shipType===1)c.position.x=-3+j*1.6;if(shipType===2)c.position.set(-5+(j%2?1:-1),1,5+Math.floor(j/2)*2.2);c.name='cargo';}mission.label='Carga → '+targetPort.name;}if(type==='rescue')mission.label='Resgate → '+(planets[validPlanetIndex]?.def?.[0]||'Planeta');if(type==='repair')mission.label='Manutenção · três torres';if(type==='salvage'){mission.system=0;salvageSites.forEach(x=>{x.g.visible=true;x.g.traverse(o=>o.userData.removed=false);});}refreshMovingBodies();toast('Contrato aceito. G mostra o objetivo.');renderPanel('jobs');}
function missionAction(){if(!mission||mode==='pilot'&&!(mission.type==='rescue'&&mission.picked&&!mission.boarded))return false;const pos=mode==='pilot'?ship.position:mode==='rover'?rover.getWorldPosition(V()):inside?shipPoint(foot):player;if(mission.type==='repair'){const site=repairSites.find(x=>x.p.i===mission.planetIndex&&!mission.done.includes(x.index)&&pos.distanceTo(x.g.position)<5);if(site){mission.done.push(site.index);site.bulb.material=mat(0x8fe8ba,1);toast('Torre reparada · '+mission.done.length+'/3.');return true;}}
if(mission.type==='salvage'){const site=salvageSites.find(x=>x.system===mission.system&&!mission.done.includes(x.index)&&pos.distanceTo(x.g.position)<7);if(site){mission.done.push(site.index);site.g.visible=false;site.g.traverse(o=>o.userData.removed=true);toast('Módulo recuperado · '+mission.done.length+'/2.');return true;}}
if(mission.type==='rescue'&&!mission.picked){const site=rescueSites[mission.planetIndex];if(pos.distanceTo(site.g.position)<6){mission.picked=true;toast('Explorador localizado. Leve a nave a até 80 m e pressione F para embarcá-lo.');return true;}}
if(mission.type==='rescue'&&mission.picked&&!mission.boarded){const site=rescueSites[mission.planetIndex];if(landed&&ship.position.distanceTo(site.g.position)<80){mission.boarded=true;site.survivor.visible=false;site.survivor.traverse(o=>o.userData.removed=true);const passenger=person(ship,shipType===2?4:shipType===1?1.6:3,shipType===2?3:-5,0xe89e79);passenger.name='passenger';mission.label='Resgate · retornar a '+destinations[mission.origin].name;refreshMovingBodies();toast('Explorador a bordo. Retorne ao porto de origem.');return true;}toast('Aproxime e pouse a nave a até 80 m do local do resgate.');return true;}return false;}
function completeJob(){if(!mission)return;if(mission.combat)return completeCombat();const port=atPort();if(!port){toast('Retorne a um porto para entregar.');return;}const m=mission,ok=m.type==='cargo'?port===destinations[m.to]:m.type==='mine'?mined-m.startMined>=3:m.type==='scan'?m.seen.length>=2:m.type==='repair'?m.done.length>=3:m.type==='salvage'?m.done.length>=2:m.boarded&&port===destinations[m.origin];if(!ok){toast('Os objetivos ainda não foram concluídos.');return;}credits+=m.reward;resetJobObjects(m);mission=null;cargo=0;clearMissionCargo();refreshMovingBodies();save();toast('Contrato concluído. Pagamento recebido!');renderPanel('jobs');}
function resetJobObjects(m){if(m.type==='rescue'&&rescueSites[m.planetIndex]){const s=rescueSites[m.planetIndex].survivor;if(s){s.visible=true;s.traverse(o=>o.userData.removed=false);}}if(m.type==='repair')repairSites.filter(s=>s.p.i===m.planetIndex).forEach(s=>s.bulb.material=mat(0xe6a16c,1));}
function cancelJob(){clearCombatMission();if(mission)resetJobObjects(mission);mission=null;cargo=0;clearMissionCargo();refreshMovingBodies();toast('Contrato cancelado.');renderPanel('jobs');}
function currentGoal(){if(mission?.combat&&!boost)return combatGoal();if(target==='ship'||target===-999)return {pos:ship.position.clone(),label:'SUA NAVE (ATLAS)'};if(target&&typeof target==='object'&&target.p)return {pos:target.p.center.clone(),label:(target.p.def[0]||'PLANETA')+' · NÚCLEO'};const from=mode==='pilot'?ship.position:mode==='rover'?rover.getWorldPosition(V()):inside?shipPoint(foot):player,closest=list=>list.reduce((a,b)=>!a||from.distanceTo(b.pos)<from.distanceTo(a.pos)?b:a,null);if(boost)return {pos:boost.approachEnd||boost.tunnelPos||ship.position,label:'IMPULSO · SISTEMA '+(boost.targetName||'DESTINO').toUpperCase()};if(autoGate&&!boost)return {pos:autoGate.pos,label:'ATRAVESSAR ARCO · '+(autoGate.targetName||'DESTINO').toUpperCase()};if(!mission){if(destinations[target])return {pos:destinations[target].pos,label:destinations[target].name.split(' · ')[0].toUpperCase()};return null;}const m=mission;if(m.type==='cargo')return {pos:destinations[m.to].pos,label:'ENTREGA · '+destinations[m.to].name};if(m.type==='mine'&&mined-m.startMined<3)return closest(ores.filter(o=>!o.taken).map(o=>({pos:o.g.getWorldPosition(V()),label:'MINÉRIO · '+o.p.def[0]})));if(m.type==='scan'&&m.seen.length<2)return closest(animals.filter(a=>!m.seen.includes(a.p.i)).map(a=>({pos:a.g.position,label:'FAUNA · '+a.p.def[0]})));if(m.type==='repair'&&m.done.length<3)return closest(repairSites.filter(x=>x.p.i===m.planetIndex&&!m.done.includes(x.index)).map(x=>({pos:x.g.position,label:'REPARAR TORRE · F'})));if(m.type==='salvage'&&m.done.length<2)return closest(salvageSites.filter(x=>x.system===m.system&&!m.done.includes(x.index)).map(x=>({pos:x.g.position,label:'RECUPERAR MÓDULO · EVA + F'})));if(m.type==='rescue'){if(!m.boarded)return {pos:rescueSites[m.planetIndex].g.position,label:m.picked?'POUSE A NAVE PERTO DO EXPLORADOR · F':'LOCALIZAR EXPLORADOR · F'};return {pos:destinations[m.origin].pos,label:'RESGATE · RETORNAR À ORIGEM'};}return closest(destinations.filter(d=>!d.gate&&d.kind!=='water').map(d=>({pos:d.pos,label:'RECEBER PAGAMENTO · '+d.name})));}

window.accept=acceptJob;window.finishJob=completeJob;window.cancelJob=cancelJob;window.currentGoal=currentGoal;

