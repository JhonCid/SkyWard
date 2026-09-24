function bindTouch(){
  const canvas=renderer.domElement;

  function handleMousePress(e) {
    if (e.button === 1) {
      toggleCockpitCameraLook(e);
      return;
    } else if (e.button === 2) {
      e.preventDefault();
      if (aimCapable()) aiming = true;
    } else if (e.button === 0) {
      if (mode === 'pilot') {
        if (shipLookOnly) {
          const clickedBtn = targetedCockpitButton || findCockpitButtonAt(e.clientX, e.clientY);
          if (clickedBtn && clickedBtn.userData?.execute) {
            clickedBtn.userData.execute();
            haptic();
            return;
          } else {
            toast('Mire em um instrumento do painel para interagir.');
          }
          return;
        }
        if (!shipLookOnly) {
          firing = true;
          firePlayer();
        }
      } else if (mode === 'rover') {
        return;
      } else {
        firing = true;
        firePlayer();
      }
    }
  }

  function handleMouseRelease(e) {
    if (e.button === 2) aiming = false;
    if (e.button === 0) firing = false;
  }

  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      touchDown(e);
    } else {
      handleMousePress(e);
    }
  });

  // Mousedown handles chorded mouse buttons (e.g. clicking left button while holding right button for ADS fire!)
  canvas.addEventListener('mousedown', handleMousePress);

  canvas.addEventListener('pointerup', e => {
    if (e.pointerType === 'touch') touchEnd(e);
    else handleMouseRelease(e);
  });
  canvas.addEventListener('mouseup', handleMouseRelease);
  window.addEventListener('pointerup', e => {
    if (e.pointerType !== 'touch') handleMouseRelease(e);
  });
  window.addEventListener('mouseup', handleMouseRelease);
window.addEventListener('mousedown', e => {
  if (e.button === 1) toggleCockpitCameraLook(e);
});
window.addEventListener('auxclick', e => {
  if (e.button === 1) toggleCockpitCameraLook(e);
});canvas.addEventListener('pointermove',touchMove);canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch')touchEnd(e);else firing=false;});canvas.addEventListener('pointercancel',e=>{touchEnd(e,true);firing=false;});canvas.addEventListener('lostpointercapture',e=>touchEnd(e,true));canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('auxclick',e=>{
  if(e.button===1){
    e.preventDefault();
    if(mode==='rover') toggleRoverLookMode('middle_click');
    else if(mode==='foot' && thirdPerson) toggleFootFreeCam();
  }
});canvas.addEventListener('dblclick',e=>{
  if (mode === 'foot') {
    // No modo a pé no computador com mouse, cliques rápidos são disparos de arma - NUNCA ativar corrida automática!
    return;
  }
  if (e.clientX < innerWidth / 2) {
    if (mode === 'pilot') auto = null;
    triggerRoverAutoDrive();
    return;
  }
  // Duplo clique na parte DIREITA da tela: Alterna entre Camera Livre e Direcao!
  if (mode === 'rover') {
    toggleRoverLookMode('dblclick');
  } else if (mode === 'pilot') {
    toggleShipLookMode('dblclick');
  }
});canvas.addEventListener('wheel',e=>{if(started&&$('panel').classList.contains('hidden')){e.preventDefault();zoomCamera(Math.exp(THREE.MathUtils.clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1),-120,120)*.0006));}},{passive:false});bindWeaponButton();
addEventListener('blur',()=>{clearInput();autoForward=false;});document.addEventListener?.('visibilitychange',()=>{if(document.hidden){clearInput();autoForward=false;}});addEventListener('keydown',e=>{if(!started)return;if(e.code==='KeyW'||e.code==='KeyS'||e.code==='KeyA'||e.code==='KeyD'){if(mode==='foot')autoForward=false;}if(e.code==='Tab'){e.preventDefault();menu('inventory');return;}if(!$('panel').classList.contains('hidden'))return;const map={Digit1:'pistol',Digit2:'blade',Digit3:'rifle',Digit4:'shotgun',Digit5:'sabre',Digit6:'grenade',Digit7:'tool',Digit8:'unarmed',Digit0:'unarmed'};if(map[e.code])equipWeapon(map[e.code]);if(e.code==='KeyR'&&mode==='foot')reloadWeapon();if(e.code==='KeyC'&&mode==='foot')useMedkit();if(e.code==='KeyL')toggleHeadlights();});}
function inputTick(dt){const context=gestureContext();if(gestureMode!==context){pinchGesture=null;touches.clear();pendingTaps.left=pendingTaps.right=null;touchX=touchY=0;if(mobileJumpHeld)keys.Space=false;mobileJumpHeld=mobileJumpBoost=false;jumpOwner=null;aiming=false;aimOwner=null;if(gestureMode.split('|')[0]!==mode)autoForward=false;shipLookOnly=false;angularVelocity.set(0,0,0);gestureMode=context;}advanceTouch();if(aiming&&!aimCapable()){aiming=false;aimOwner=null;}aimBlend=THREE.MathUtils.lerp(aimBlend,aiming?1:0,1-Math.exp(-dt*10));if(!$('actionStrip').classList.contains('hidden'))refreshActionStrip();$('gestureState').textContent=(autoForward?(mode==='pilot'?'CRUZEIRO':'CORRIDA')+' AUTO':'')+(mode==='pilot'&&shipLookOnly?' · CÂMERA LIVRE':'')+(mode==='rover'?(roverLookOnly?' · CÂMERA LIVRE':' · DIREÇÃO'):'');}
function inputAfterTick(){if(weaponView&&aimBlend>.001&&!thirdPerson){if(equipped==='unarmed'){weaponView.position.set(0,THREE.MathUtils.lerp(weaponView.position.y,-0.22,aimBlend),-0.50);weaponView.rotation.set(0,0,0);}else{weaponView.position.x=THREE.MathUtils.lerp(.30,0.065,aimBlend);weaponView.position.y=THREE.MathUtils.lerp(-.28,-.16,aimBlend);weaponView.position.z=THREE.MathUtils.lerp(-.62,-.52,aimBlend);weaponView.rotation.y=THREE.MathUtils.lerp(-0.06,0.0,aimBlend);weaponView.rotation.z=THREE.MathUtils.lerp(0.0,0.0,aimBlend);}}const qw=$('quickWeapon');if(qw){if(mode==='rover'){qw.classList.add('hidden');}else{qw.classList.remove('hidden');qw.textContent=mode==='pilot'?'Canhões':weaponDefs[equipped].name;qw.classList.toggle('aiming',aiming);}}}

