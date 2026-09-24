function menu(tab='settings'){closeWeaponPicker();$('actionStrip').classList.add('hidden');clearInput();document.body.classList.add('in-menu');document.exitPointerLock?.();$('panel').classList.remove('hidden');renderPanel(tab)}
function closeMenu(){$('panel').classList.add('hidden');document.body.classList.remove('in-menu');save();}

window.choose=i=>{target=i;renderPanel('map')};
window.engage=()=>{if(mode!=='pilot'){toast('Sente-se no cockpit antes de viajar.');return;}auto=destinations[target];landed=false;openRamp(false,false);flightSpeed=0;closeMenu();toast('Piloto automático ativo. Rotas entre sistemas usam os arcos.');};

window.changeShip=i=>{if(!landed||!atPort()||mode!=='pilot'||mission||rover.parent!==ship){toast('Troque no cockpit, pousado em um porto, sem contrato e com o veículo a bordo.');return;}shipType=i;buildShip();yaw=0;pitch=0;renderPanel('fleet');toast('Nova nave preparada. '+layout().desc);};
function scan(){if(missionAction())return;if(mode==='pilot'){toast('Saia da nave para usar a ferramenta de campo.');return}const pos=mode==='rover'?rover.getWorldPosition(V()):inside?shipPoint(foot):player;const a=animals.find(a=>pos.distanceTo(a.g.position)<65);if(a){scanned.add(a.p.i);if(mission?.type==='scan'&&!mission.seen.includes(a.p.i))mission.seen.push(a.p.i);save();toast('Fauna catalogada: '+a.p.def[6]+' · '+a.p.def[0]);return}const fish=environment.flatMap(e=>e.fish.map(f=>({f,p:e.p}))).find(a=>a.f.g.position.distanceTo(pos)<65);if(fish){scanned.add(fish.p.i);if(mission?.type==='scan'&&!mission.seen.includes(fish.p.i))mission.seen.push(fish.p.i);save();toast('Fauna aquática catalogada · '+fish.p.def[0]);return;}toast('Nenhum espécime de fauna a 65 m para catalogar.');}

addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat||!started)return;if(e.code==='Escape'){if($('panel').classList.contains('hidden'))menu('settings');else closeMenu();return;}if(!$('panel').classList.contains('hidden'))return;if(e.code==='KeyB'){if(mode==='pilot'||mode==='rover'){leaveSeatGesture();}else boardShip();}if(e.code==='KeyR'){if(mode==='pilot'||mode==='rover'){leaveSeatGesture();return;}}if(e.code==='KeyT')recall();if(e.code==='KeyG')toggleGuide();if(e.code==='KeyU')toggleAudio();if(e.code==='KeyE'){
  // Key E: In pilot mode, rolls ship right (handled in manualFlight). On foot, interacts!
  if(mode!=='pilot'){
    interact();
  }
}
if(e.code==='KeyF'){
  // Key F: In pilot mode, executes landing. On foot, uses scan/tool/mission action!
  if(mode==='pilot'){
    if(typeof window.land==='function')window.land();else land();
    return;
  } else if(resting){
    standUp();
    return;
  } else {
    scan();
  }
}
if((e.code==='KeyZ'||e.code==='AltLeft')&&mode==='pilot'){
  toggleCockpitCameraLook(e);
  return;
}if(e.code==='KeyM')menu('map');if(e.code==='KeyJ')menu('jobs');if(e.code==='KeyH')menu('fleet');if(e.code==='KeyO')toggleRamp();
if(e.code==='KeyR'){
  // Key R: In pilot mode, stands up from seat! On foot, reloads weapon. In rover, latches into hold!
  if(mode==='pilot'){
    mode='foot';
    inside=true;
    resetFootMotion();
    foot.copy(layout().atlas?atlasPoint('Cockpit_Exit_Spawn').add(V(0,1.84,0)):layout().seat.clone().add(V(0,.08,1.8)));
    yaw=0; pitch=0;
    toast('Você levantou do assento [R].');
    return;
  } else if(mode==='foot'){
    reloadWeapon();
  } else {
    latch();
  }
}
if(e.code==='KeyL'){if(typeof window.toggleHeadlights==='function')window.toggleHeadlights();else toggleHeadlights();}
if(e.code==='KeyP'){auto=null;toast('Controle manual.')}if(e.code==='KeyX')brakeShip();});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false)});
renderer.domElement.onclick=()=>{if(!touchEnabled&&started&&$('panel').classList.contains('hidden'))renderer.domElement.requestPointerLock?.()};
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement)lookInput(e.movementX,e.movementY)});
let eva=false,evaFrame=new THREE.Quaternion(),evaVelocity=V(),shipVelocity=V(),roverAir=false,roverVelocity=V(),guideEnabled=true;

