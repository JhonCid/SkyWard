function leaveSeatGesture(){if(mode==='pilot'){mode='foot';inside=true;resetFootMotion();foot.copy(layout().atlas?atlasPoint('Cockpit_Exit_Spawn').add(V(0,1.84,0)):layout().seat.clone().add(V(0,.08,1.8)));yaw=pitch=0;}else if(mode==='rover'){mode='foot';const onDeck=(typeof isRoverOnShipDeck==='function'&&isRoverOnShipDeck());if(onDeck){if(typeof dockRoverToShip==='function')dockRoverToShip(true);inside=true;eva=false;const l=layout();foot.copy(rover.position).add(V(1.5,0.4,0));foot.x=THREE.MathUtils.clamp(foot.x,-l.halfX+1.2,l.halfX-1.2);foot.y=layout().atlas?rover.position.y+1.84:1.9;toast('Veículo estacionado na garagem da nave.');}else{inside=rover.parent===ship;eva=!inside&&roverAir;if(inside){foot.copy(layout().spawn);eva=false;}else{player.copy(safeExit(rover.getWorldPosition(V()),rover,station?null:groundPlanet));if(eva){evaFrame.copy(rover.quaternion);evaVelocity.copy(roverVelocity);}}}roverLinearSpeed=0;roverTouchSteer=0;roverLookOnly=false;resetFootMotion();}else if(resting){standUp();}else return;autoForward=false;touchX=touchY=touchRoll=touchLift=0;steerPixels.set(0,0,0);haptic();}
function pinchDown(){if(touches.size!==2)return;const pair=[...touches.values()];if(pair[0].side!==pair[1].side)return;const side=pair[0].side;pinchGesture={ids:pair.map(t=>t.id),kind:side==='right'?'zoom':'seat',distance:Math.hypot(pair[0].lastX-pair[1].lastX,pair[0].lastY-pair[1].lastY),active:false,blocked:false,context:gestureContext()};for(const t of pair){t.pinched=true;t.moved=true;}pendingTaps.left=pendingTaps.right=null;aiming=false;aimOwner=null;if(jumpOwner!==null)keys.Space=false;jumpOwner=null;mobileJumpHeld=mobileJumpBoost=false;if(side==='left')touchX=touchY=0;else touchRoll=touchLift=0;}
function pinchMove(e){if(!pinchGesture)return false;const g=pinchGesture,pair=g.ids.map(id=>touches.get(id)),moving=touches.get(e.pointerId);if(pair.some(t=>!t)||!moving)return false;moving.lastX=e.clientX;moving.lastY=e.clientY;const correctHalf=t=>g.kind==='zoom'?t.lastX>=innerWidth/2:t.lastX<innerWidth/2;if(!pair.every(correctHalf)||g.context!==gestureContext())g.blocked=true;if(g.blocked)return true;if(g.kind==='seat'){const movement=pair.map(t=>({up:t.y-t.lastY,side:Math.abs(t.lastX-t.x)}));if(!g.active&&movement.every(d=>d.up>=48&&d.side<d.up*.7)){g.active=true;leaveSeatGesture();}return true;}
const distance=Math.hypot(pair[0].lastX-pair[1].lastX,pair[0].lastY-pair[1].lastY);if(!g.active&&Math.abs(distance-g.distance)>12)g.active=true;if(g.active){zoomCamera(g.distance/Math.max(20,distance));g.distance=distance;}return true;}

// SkyWard 0.9: persistent controls and independent camera zoom per vehicle.
const controlPrefs={camera:1.65,ship:1.6};
const cameraZoom={foot:1,rover:1,pilot:1};
window.resetCameraZoom = function() {
  cameraZoom.foot = 1;
  cameraZoom.rover = 1;
  cameraZoom.pilot = 1;
  camera.fov = 70;
  camera.updateProjectionMatrix();
  toast('Zoom da câmera redefinido.');
};

let pinchGesture=null;
function setSensitivity(kind,value){if(!(kind in controlPrefs))return;const n=Number(value);if(!Number.isFinite(n))return;controlPrefs[kind]=THREE.MathUtils.clamp(n,.25,4);save();}
function loadControls(){try{const data=JSON.parse(localStorage.getItem('horizonte-v1'))?.skyward?.controls;for(const k of ['camera','ship'])if(Number.isFinite(data?.[k]))controlPrefs[k]=THREE.MathUtils.clamp(data[k],.25,4);}catch{}}
function toggleShipLook(){if(mode!=='pilot'||!started||!$('panel').classList.contains('hidden'))return;shipLookOnly=!shipLookOnly;steerPixels.set(0,0,0);angularVelocity.x=angularVelocity.y=0;}
const cameraZoomTarget = { foot: 1, rover: 1, pilot: 1 };
let camTransitionAlpha = 0; // 0 = first person, 1 = third person
let thirdPersonCamPos = null;
let thirdPersonCamLook = null;

let zoomOverflow = 0;
function zoomCamera(factor) {
  if (!started || !$('panel').classList.contains('hidden') || !Number.isFinite(factor)) return;
  // Increased zoom sensitivity (crisper and more responsive)
  const smoothed = 1 + (factor - 1) * 0.65;

  if (!thirdPerson) {
    // First Person: wide FOV range (down to 0.40 for high cockpit inspection zoom)
    const curTarget = cameraZoomTarget[mode] || 1;
    const newTarget = curTarget * smoothed;
    const maxFovOut = 1.25;
    const minFovIn = (mode === 'pilot') ? 0.38 : 0.65;

    if (newTarget > maxFovOut) {
      // Reached zoom out limit in 1st person
      cameraZoomTarget[mode] = maxFovOut;
      zoomOverflow += (factor - 1);
      // Pushing beyond limit triggers transition to 3rd person!
      if (zoomOverflow > 0.08) {
        thirdPerson = true;
        zoomOverflow = 0;
        cameraZoomTarget[mode] = 0.65;
        toast('Câmera em terceira pessoa.');
      }
      return;
    } else if (newTarget < minFovIn) {
      cameraZoomTarget[mode] = minFovIn;
      zoomOverflow = 0;
      return;
    }
    zoomOverflow = 0;
    cameraZoomTarget[mode] = THREE.MathUtils.clamp(newTarget, minFovIn, maxFovOut);
  } else {
    // Third Person: closer maximum distance limit (max 1.55 instead of 2.8)
    const curTarget = cameraZoomTarget[mode] || 1;
    const newTarget = curTarget * smoothed;
    const minChaseIn = 0.52;
    const maxChaseOut = 1.55;

    if (newTarget < minChaseIn) {
      // Reached zoom in limit in 3rd person
      cameraZoomTarget[mode] = minChaseIn;
      zoomOverflow += (factor - 1);
      // Pushing beyond limit triggers transition to 1st person!
      if (zoomOverflow < -0.08) {
        thirdPerson = false;
        zoomOverflow = 0;
        cameraZoomTarget[mode] = (mode === 'pilot') ? 0.95 : 1.0;
        toast('Câmera em primeira pessoa.');
      }
      return;
    } else if (newTarget > maxChaseOut) {
      cameraZoomTarget[mode] = maxChaseOut;
      zoomOverflow = 0;
      return;
    }
    zoomOverflow = 0;
    cameraZoomTarget[mode] = THREE.MathUtils.clamp(newTarget, minChaseIn, maxChaseOut);
  }
}
window.zoomCamera = zoomCamera;

// SkyWard v0.1.0: Global state for Commodities, Factions & Headlights
