const shipTypes=[{name:'ATLAS v3 / cargueiro',color:0x1e5282,speed:190,cap:18}];
window.shipTypes=shipTypes;const ship=new THREE.Group();scene.add(ship);let shipType=0,rampOpen=true;
const layouts=[{atlas:true,halfX:5.2,halfZ:44,cockpit:V(-1.1,3.69,-29.3),seat:V(-1.1,2.97,-27.936),entry:V(0,.33,11),normal:V(0,0,1),doorHalf:3.2,spawn:V(0,2.17,7),rover:V(0,-2.27,20),roverYaw:Math.PI,rampLength:16.6,desc:'Atlas v3 · seis portas, rampa ventral e rover'}];
function layout(){return layouts[shipType];}

let transitionUntil=0;
function entryWorld(){return shipPoint(layout().entry);}

function toggleRamp(){if(rampOpen&&doorwayOccupied()){toast('Entrada ocupada.');return;}openRamp(!rampOpen,false);toast('Rampa '+(rampOpen?'aberta.':'fechada.'));}
function boardShip(){resetFootMotion();if(mode==='pilot'){interact();return;}if(mode==='rover'){latch();return;}if(inside){exitShip();return;}if(player.distanceTo(entryWorld())>12){toast('Aproxime-se da entrada da nave. T retorna de qualquer lugar.');return;}openRamp(true);inside=true;eva=false;mode='foot';foot.copy(layout().spawn);yaw=0;pitch=0;transitionUntil=totalTime+.8;toast('Embarque concluído. Siga até o cockpit e pressione E.');}
function exitShip(){
  resetFootMotion();
  openRamp(true);
  inside=false;
  resting=null;
  mode='foot';
  const p = groundPlanet || nearest(player);
  const onPlanetOrStation = !!(groundPlanet || (p && player.distanceTo(p.center) < p.r + ATMOSPHERE + 500) || station);
  eva = !landed && !onPlanetOrStation;
  evaFrame.copy(ship.quaternion);
  evaVelocity.set(0, 0, 0);

  // Seamless natural exit: player is already at the physical ramp bottom, no teleporting or snapping
  player.copy(shipPoint(foot));

  transitionUntil = totalTime + 0.6;
  toast(eva ? 'EVA ativo no vácuo espacial.' : 'Desembarque concluído.');
}
function inDoor(local,extra=0){const l=layout(),rel=local.clone().sub(l.entry),across=l.normal.x?rel.z:rel.x;return Math.abs(across)<l.doorHalf-.5+extra;}
function insideMove(delta){const up=UP.clone().applyQuaternion(ship.quaternion),world=shipPoint(foot),m=delta.clone().applyQuaternion(ship.quaternion),next=moveActor(world,m,{up,height:1.8,grounded:true});foot.copy(localPoint(next));const rel=foot.clone().sub(layout().entry);if(rampOpen&&inDoor(foot)&&rel.dot(layout().normal)>.7&&totalTime>transitionUntil)exitShip();}

function nearbyHangarTerminal() {
  const pos = controlledPosition();
  for (const s of settlements) {
    if (s.root) {
      const term = s.root.getObjectByName('hangarTerminal');
      if (term && term.getWorldPosition(V()).distanceTo(pos) < 6.5) return term;
    }
  }
  for (const d of destinations) {
    if (d.station) {
      const term = d.station.getObjectByName('hangarTerminal');
      if (term && term.getWorldPosition(V()).distanceTo(pos) < 6.5) return term;
    }
  }
  return null;
}
window.nearbyHangarTerminal = nearbyHangarTerminal;

function interact(){if(mode==='foot'&&!resting&&avatar?.userData.rig?.userData.character)SkywardCharacters.trigger(avatar.userData.rig.userData.character,'Interact','upper');if(mode==='pilot'&&targetedCockpitButton){targetedCockpitButton.userData.execute();return;}if(mode==='foot'&&inside&&!resting&&foot.distanceTo(layout().seat)<2.6){mode='pilot';yaw=0;pitch=0;return;}if(useShipInterior())return;
  const termNear = nearbyHangarTerminal(); if(termNear && mode==='foot'){ menu('hangarTerminal'); return; }if(mode==='pilot'){mode='foot';inside=true;resetFootMotion();foot.copy(layout().atlas?atlasPoint('Cockpit_Exit_Spawn').add(V(0,1.84,0)):layout().seat.clone().add(V(0,.08,1.8)));yaw=0;pitch=0;toast('Você pode caminhar. B desembarca pela entrada da nave.');return;}if(mode==='rover'){return;}const pos=inside?shipPoint(foot):player;if(inside&&foot.distanceTo(layout().seat)<2.6){mode='pilot';yaw=0;pitch=0;return;}const roverDist=pos.distanceTo(rover.getWorldPosition(V()));if(roverDist<3.5){mode='rover';eva=false;yaw=0;pitch=0;roverLookOnly=false;roverTouchSteer=0;toast('W avança · S recua · 2 dedos ↑ sai · 2 toques alterna câmera/direção.');return;}if(!inside&&pos.distanceTo(entryWorld())<10){boardShip();return;}if(inside&&foot.distanceTo(layout().spawn)<3){exitShip();return;}const an=animals.find(a=>pos.distanceTo(a.g.position)<3.8);if(an){if(audioContext&&!audioMuted)tone(520,audioContext.currentTime,0.2,0.15,fxBus,'triangle');toast('Você acariciou o animal dócil.');return;}const n=npcs.find(n=>pos.distanceTo(n.g.getWorldPosition(V()))<3.8);if(n){talk(n);return;}if(missionAction())return;toast('Aproxime-se do cockpit, de um habitante, veículo ou entrada. B facilita o embarque.');}

function isRoverOnShipDeck() {
  if (rover.parent === ship) return true;
  const l = layout();
  const local = ship.worldToLocal(rover.getWorldPosition(new THREE.Vector3()));
  if(l.atlas){const d=local.z-ATLAS.hinge.z;return Math.abs(local.x)<l.doorHalf&&d>=-1&&d<=ATLAS.length*Math.cos(atlasRampSlope())&&Math.abs(local.y-(ATLAS.deckY-d*Math.tan(atlasRampSlope())))<2;}
  if (Math.abs(local.x) > l.halfX + 1.2) return false;
  if (local.y < -1.8 || local.y > 4.2) return false;
  const minZ = Math.min(l.cockpit.z, -l.halfZ) - 2;
  const maxZ = Math.max(l.entry.z, l.halfZ) + 8;
  if (local.z < minZ || local.z > maxZ) return false;
  const rel = local.clone().sub(l.entry);
  const rampDist = rel.dot(l.normal);
  return rampDist <= 7.0;
}

function dockRoverToShip(preserveRelativePos = true) {
  if (rover.parent !== ship) {
    ship.attach(rover);
  }
  const l = layout();
  if(l.atlas){if(!preserveRelativePos)rover.position.copy(l.rover);atlasPlaceRover(rover.position,new THREE.Euler().setFromQuaternion(rover.quaternion,'YXZ').y);roverVelocity.set(0,0,0);roverLinearSpeed=0;roverAir=false;return;}
  if (preserveRelativePos) {
    rover.position.x = THREE.MathUtils.clamp(rover.position.x, -l.halfX + 1.6, l.halfX - 1.6);
    rover.position.z = THREE.MathUtils.clamp(rover.position.z, l.rover.z - 4.0, l.entry.z + 0.5);
    rover.position.y = 0.33;
    const curEuler = new THREE.Euler().setFromQuaternion(rover.quaternion, 'YXZ');
    rover.quaternion.setFromEuler(new THREE.Euler(0, curEuler.y, 0, 'YXZ'));
  } else {
    rover.position.copy(l.rover);
    rover.rotation.set(0, l.roverYaw, 0);
  }
  roverVelocity.set(0, 0, 0);
  roverLinearSpeed = 0;
  roverAir = false;
}
window.isRoverOnShipDeck = isRoverOnShipDeck;
window.dockRoverToShip = dockRoverToShip;

function latch(){if(mode!=='rover')return;if(rover.parent===ship){toast('Dirija para a entrada. W aponta para a saída.');return;}if(rover.getWorldPosition(V()).distanceTo(entryWorld())<15){openRamp(true);ship.attach(rover);rover.position.copy(layout().rover);rover.rotation.set(0,layout().roverYaw,0);inside=true;roverAir=false;toast('Veículo embarcado e preso no porão.');}else toast('Aproxime o veículo da entrada da nave e pressione B ou R.');}
function recall(){resetFootMotion();const port=destinations.find(d=>d.station&&ship.position.distanceTo(d.pos)<160);groundPlanet=port?null:nearest(ship.position);station=port?.station||null;mode='pilot';inside=true;eva=false;evaVelocity.set(0,0,0);yaw=0;pitch=0;foot.copy(layout().seat);closeMenu();toast('Teletransporte concluído. Você está no cockpit.');}

