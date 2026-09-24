function clearInput(){pinchGesture=null;touchX=touchY=0;firing=false;Object.keys(keys).forEach(k=>keys[k]=false);touches.clear();pendingTaps.left=pendingTaps.right=null;mobileJumpHeld=mobileJumpBoost=false;jumpOwner=null;aiming=false;aimOwner=null;touchRoll=touchLift=0;steerPixels.set(0,0,0);weaponPress=weaponItemPress=null;hideWeaponInfo();}
function gestureContext(){return mode+'|'+inside+'|'+eva;}
let lastRoverModeToggleTime = 0;
function toggleRoverLookMode(source = '') {
  const now = inputNow();
  if (now - lastRoverModeToggleTime < 240) {
    // 240ms debounce window prevents double-toggle from synthetic events or touchEnd!
    return;
  }
  lastRoverModeToggleTime = now;
  roverLookOnly = !roverLookOnly;
  roverTouchSteer = 0;
  if (roverLookOnly) {
    toast('Câmera livre ativada · Deslize à direita para orbitar');
  } else {
    pitch = 0; yaw = 0;
    toast('Direção ativada · Deslize à direita para virar');
  }
  haptic();
}

let lastShipModeToggleTime = 0;
function toggleShipLookMode(source = '') {
  const now = inputNow();
  if (now - lastShipModeToggleTime < 240) {
    // 240ms debounce window prevents double-toggle from synthetic events or touchEnd!
    return;
  }
  lastShipModeToggleTime = now;
  if (mode !== 'pilot') return;

  shipLookOnly = !shipLookOnly;
  steerPixels.set(0, 0, 0);
  angularVelocity.set(0, 0, 0);
  if (shipLookOnly) {
    toast('Câmera livre ativada · Deslize à direita para olhar ao redor');
  } else {
    pitch = 0; yaw = 0;
    toast('Controles de voo centralizados.');
  }
  haptic();
}
window.toggleRoverLookMode = toggleRoverLookMode;
window.toggleShipLookMode = toggleShipLookMode;

let lastRoverAutoDriveTime = 0;
function triggerRoverAutoDrive() {
  if (mode === 'foot') return; // Autorun on double click is strictly for vehicles, never on foot!
  const now = inputNow();
  if (now - lastRoverAutoDriveTime < 240) return;
  lastRoverAutoDriveTime = now;
  autoForward = true;
  toast(mode === 'pilot' ? 'Cruzeiro automático. Deslize à esquerda para reassumir.' : 'Aceleração automática ativada. Deslize à esquerda para reassumir.');
  haptic();
}

let lastRightTapTime = 0, lastRightTapX = 0, lastRightTapY = 0;
let lastLeftTapTime = 0, lastLeftTapX = 0, lastLeftTapY = 0;
let lastRightMouseClickTime = 0, lastRightMouseClickX = 0, lastRightMouseClickY = 0;
let lastLeftMouseClickTime = 0, lastLeftMouseClickX = 0, lastLeftMouseClickY = 0;

function touchDown(e){
  if(e.pointerType!=='touch'||!started||!$('panel').classList.contains('hidden'))return;
  if(!touchEnabled)setTouch(true);
  e.preventDefault?.();
  // Ensure the left locomotion side is strictly the left 45% of the screen.
  // The right 55% of the screen is strictly combat, actions, interactions, aiming, and camera.
  const now=inputNow(),side=e.clientX < innerWidth * 0.45 ? 'left' : 'right';
  advanceTouch(now);

  if(mode==='foot'){
    // When touching on the right side on foot, immediately invalidate any pending left tap
    // so left locomotion and right attack/action taps can never combine into autoForward!
    if(side==='right'){
      pendingTaps.left = null;
    } else {
      pendingTaps.right = null;
    }
  }

  if(mode==='foot' && typeof thirdPerson !== 'undefined' && thirdPerson && side==='left'){
    const leftTouches = Array.from(touches.values()).filter(t => t.side === 'left');
    if(leftTouches.length >= 1){
      toggleFootFreeCam();
      haptic();
      return;
    }
  }

  if(mode==='pilot'){
    if(side==='right'){
      const interval=now-lastRightTapTime;
      if(lastRightTapTime>0 && interval>30 && interval<550){
        lastRightTapTime=0;
        toggleShipLookMode('touchDown');
        const t={id:e.pointerId,side,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,at:now,moved:false,isDouble:true,context:gestureContext()};
        touches.set(t.id,t);
        renderer.domElement.setPointerCapture?.(t.id);
        return;
      }
    } else if(side==='left'){
      const interval=now-lastLeftTapTime;
      if(lastLeftTapTime>0 && interval>30 && interval<550){
        lastLeftTapTime=0;
        triggerRoverAutoDrive();
        const t={id:e.pointerId,side,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,at:now,moved:false,isDouble:true,context:gestureContext()};
        touches.set(t.id,t);
        renderer.domElement.setPointerCapture?.(t.id);
        return;
      }
    }
  }

  if(mode==='rover'){
    if(side==='right'){
      const interval=now-lastRightTapTime;
      if(lastRightTapTime>0 && interval>30 && interval<550){
        lastRightTapTime=0;
        toggleRoverLookMode('touchDown');
        const t={id:e.pointerId,side,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,at:now,moved:false,isDouble:true,context:gestureContext()};
        touches.set(t.id,t);
        renderer.domElement.setPointerCapture?.(t.id);
        return;
      }
    } else if(side==='left'){
      const interval=now-lastLeftTapTime;
      if(lastLeftTapTime>0 && interval>30 && interval<550){
        lastLeftTapTime=0;
        triggerRoverAutoDrive();
        const t={id:e.pointerId,side,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,at:now,moved:false,isDouble:true,context:gestureContext()};
        touches.set(t.id,t);
        renderer.domElement.setPointerCapture?.(t.id);
        return;
      }
    }
  }

  if(aiming && mode==='foot' && side==='left'){
    firePlayer();
    return;
  }
  if(touches.size>=2)return;
  const pending=pendingTaps[side],second=!!pending&&now-pending.at<=DOUBLE_MS;
  if(second)pendingTaps[side]=null;
  const t={id:e.pointerId,side,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,at:now,moved:false,second,held:false,aim:false,isDouble:false,context:gestureContext()};
  touches.set(t.id,t);
  pinchDown();
  renderer.domElement.setPointerCapture?.(t.id);
}
function startSecondHold(t){if(t.held)return;t.held=true;haptic();if(mode==='pilot'){if(t.side==='right'){touchRoll=touchLift=0;}}else if(mode==='foot'&&jumpOwner===null){jumpOwner=t.id;mobileJumpHeld=true;mobileJumpBoost=false;jumpWasDown=false;keys.Space=true;}}
function touchMove(e){const t=touches.get(e.pointerId);if(!t)return;e.preventDefault();if(t.pinched&&!pinchGesture)return;if(pinchMove(e))return;advanceTouch(inputNow());const dx=e.clientX-t.x,dy=e.clientY-t.y,mx=e.clientX-t.lastX,my=e.clientY-t.lastY;if(Math.hypot(dx,dy)>45){t.moved=true;if(mode==='rover'||mode==='pilot'){if(t.side==='right')lastRightTapTime=0;else if(t.side==='left')lastLeftTapTime=0;}}else if(Math.hypot(dx,dy)>DRAG_PX){t.moved=true;}if(t.second&&t.moved&&!t.held)startSecondHold(t);
if(t.side==='left'&&t.moved){autoForward=false;const scale=Math.min(95,innerWidth*.18),len=Math.max(1,Math.hypot(dx,dy)/scale);touchX=THREE.MathUtils.clamp(dx/len/scale,-1,1);touchY=THREE.MathUtils.clamp(dy/len/scale,-1,1);if(mode==='pilot')auto=null;}
if(t.side==='right'&&t.moved){
  if(mode==='pilot'&&t.second&&t.held){
    touchRoll=THREE.MathUtils.clamp(-dx/90,-1,1);
    touchLift=THREE.MathUtils.clamp(-dy/90,-1,1);
  } else if(mode==='rover'){
    if(!roverLookOnly){
      const steerScale = Math.min(100, innerWidth * 0.20);
      roverTouchSteer = THREE.MathUtils.clamp(dx / steerScale, -1, 1);
    } else {
      roverTouchSteer = 0;
      lookInput(mx, my);
    }
  } else {
    lookInput(mx,my);
  }
}t.lastX=e.clientX;t.lastY=e.clientY;}
function touchEnd(e,cancel=false){
  const t=touches.get(e.pointerId);
  if(!t)return;
  e.preventDefault?.();
  advanceTouch(inputNow());
  touches.delete(t.id);
  if(pinchGesture?.ids.includes(t.id))pinchGesture=null;
  if(t.side==='left'){touchX=touchY=0;}
  if(t.side==='right'){if(t.second){touchRoll=touchLift=0;}if(mode==='rover')roverTouchSteer=0;}
  if(aimOwner===t.id){aiming=false;aimOwner=null;}
  if(jumpOwner===t.id){keys.Space=false;mobileJumpHeld=mobileJumpBoost=false;jumpOwner=null;}
  if(cancel||t.pinched||t.context!==gestureContext())return;
  const duration=inputNow()-t.at;
  const totalDist = Math.hypot(e.clientX - t.x, e.clientY - t.y);
  const isTap = !t.held && !t.aim && duration < HOLD_MS && (totalDist < 45 || !t.moved);
  if(!isTap)return;

  // 1. Vehicle Rover Mode Handling
  if(mode === 'rover'){
    if(!t.isDouble){
      if(duration < 450 && totalDist < 55){
        if(t.side === 'right'){
          lastRightTapTime = inputNow();
          lastRightTapX = e.clientX;
          lastRightTapY = e.clientY;
        } else if(t.side === 'left'){
          lastLeftTapTime = inputNow();
          lastLeftTapX = e.clientX;
          lastLeftTapY = e.clientY;
        }
      } else {
        if(t.side === 'right') lastRightTapTime = 0;
        else if(t.side === 'left') lastLeftTapTime = 0;
      }
    }
    return;
  }

  // 2. Spaceship Pilot Mode Handling (Double-Tap toggles Free Camera / Flight Controls)
  if(mode === 'pilot'){
    if(!t.isDouble){
      if(duration < 450 && totalDist < 55){
        if(t.side === 'right'){
          lastRightTapTime = inputNow();
          lastRightTapX = e.clientX;
          lastRightTapY = e.clientY;
        } else if(t.side === 'left'){
          lastLeftTapTime = inputNow();
          lastLeftTapX = e.clientX;
          lastLeftTapY = e.clientY;
        }
      } else {
        if(t.side === 'right') lastRightTapTime = 0;
        else if(t.side === 'left') lastLeftTapTime = 0;
      }
    }
    if(t.second){
      if(t.side === 'right'){
        toggleShipLookMode('touchEnd_second');
        return;
      } else if(t.side === 'left'){
        triggerRoverAutoDrive();
        return;
      }
    }
    // Single tap interactions in cockpit
    if(shipLookOnly && inside && !t.isDouble){
      const targetBtn = targetedCockpitButton || findCockpitButtonAt(e.clientX, e.clientY);
      if(targetBtn && targetBtn.userData?.execute){
        targetBtn.userData.execute();
        haptic();
        return;
      } else {
        toast('Mire ou toque em um instrumento do painel para interagir.');
      }
      return;
    }
    if(!shipLookOnly && !t.isDouble && t.side === 'right'){
      firePlayer();
      return;
    }
    return;
  }

  // 3. Foot Mode Handling (Right side is strictly combat/actions, LEFT side is autorun)
  if(mode === 'foot'){
    if(t.side === 'right'){
      // Right side on foot is strictly for combat / weapons / interactions.
      // NEVER activate autoForward on the right side!
      autoForward = false;
      if(t.second){
        firePlayer();
      } else {
        pendingTaps['right'] = { at: inputNow(), context: t.context };
      }
      return;
    } else if(t.side === 'left'){
      // Left side on foot: double tap activates autoForward (corrida automática)
      if(t.second){
        autoForward = true;
        toast('Corrida automática ativada. Deslize à esquerda para reassumir.');
        haptic();
      } else {
        pendingTaps['left'] = { at: inputNow(), context: t.context };
      }
      return;
    }
  }

  // Fallback for other contexts
  if(t.second){
    if(t.side === 'left'){
      autoForward = true;
      toast('Corrida automática ativada. Deslize à esquerda para reassumir.');
    } else {
      firePlayer();
    }
  } else {
    pendingTaps[t.side] = { at: inputNow(), context: t.context };
  }
}
function advanceTouch(now=inputNow()){if(!started)return;if(!$('panel').classList.contains('hidden'))return;for(const side of ['left','right']){
  const tap=pendingTaps[side];
  if(tap&&now-tap.at>DOUBLE_MS){
    pendingTaps[side]=null;
    if(tap.context===gestureContext()){
      if(side==='right'){
        if(mode==='pilot'){
          if(!shipLookOnly){
            // No modo de voo, 1 clique na direita aciona o ataque da nave!
            firePlayer();
          } else {
            // No modo de mover a câmera, 1 clique faz interagir com os elementos do painel!
            if(targetedCockpitButton){
              targetedCockpitButton.userData.execute();
            } else {
              toast('Mire em um instrumento do painel para interagir.');
            }
          }
        } else if(mode==='rover'){
          // No rover, clique simples não sai do veículo nem faz nada
        } else {
          interact();
        }
      } else {
        if(mode!=='rover'){
          firePlayer();
        }
      }
    }
  }
}
for(const t of touches.values()){if(t.pinched||t.context!==gestureContext())continue;const elapsed=now-t.at;if(mode!=='rover'&&t.second&&!t.held&&elapsed>=SECOND_HOLD_MS)startSecondHold(t);else if(!t.second&&t.side==='right'&&!t.moved&&!t.aim&&elapsed>=350&&mode==='foot'&&aimCapable()){t.aim=true;aiming=true;aimOwner=t.id;haptic();}}
if(weaponPress&&!weaponPress.moved&&!weaponPress.held&&now-weaponPress.at>=HOLD_MS){weaponPress.held=true;haptic();showWeaponPicker();}
if(weaponItemPress&&!weaponItemPress.held&&!weaponItemPress.moved&&now-weaponItemPress.at>=HOLD_MS){weaponItemPress.held=true;weaponInfoHeld=true;haptic();showWeaponInfo(weaponItemPress.id);}}

