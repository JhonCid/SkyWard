function buildCockpit3DConsole(shipGroup) {
  cockpit3DButtons.length = 0;
  const l = layout();
  const seat = l.seat;

  // Authentic Drake Cutter cockpit console structure directly in front and below pilot
  const dashRoot = new THREE.Group();
  dashRoot.name = 'cockpitConsole';
  dashRoot.userData.dynamic = true; // Retain matrix updates
  dashRoot.position.set(seat.x, seat.y - 0.18, seat.z - 1.15);
  dashRoot.rotation.x = -0.32; // Angled 18° up toward pilot's eyes
  shipGroup.add(dashRoot);

  // Main angled dashboard backplate (slender 0.04m plate behind screens)
  box(dashRoot, 0, 0.02, -0.02, 1.86, 0.44, 0.04, 0x162028);

  // Recessed dark bezels framing each MFD screen
  box(dashRoot, -0.58, 0.02, 0.005, 0.54, 0.36, 0.015, 0x0a1015);
  box(dashRoot, 0, 0.02, 0.005, 0.48, 0.36, 0.015, 0x0a1015);
  box(dashRoot, 0.58, 0.02, 0.005, 0.54, 0.36, 0.015, 0x0a1015);

  // Upper sunshield / visor brow (positioned cleanly ABOVE screens, cannot block view)
  box(dashRoot, 0, 0.25, 0.04, 1.90, 0.04, 0.14, 0x22303a);

  // Lower support pedestal: recessed far under and behind (Z = -0.16), NEVER blocking the screens
  box(dashRoot, 0, -0.38, -0.16, 0.70, 0.36, 0.16, 0x11171d);

  // 1. Left MFD: Power & Propulsion (Drake Cutter Amber Telemetry)
  const leftMfdTex = makeMfdTelemetryTexture('brake');
  const leftMfd = mesh(new THREE.BoxGeometry(0.50, 0.32, 0.02), new THREE.MeshStandardMaterial({
    map: leftMfdTex, emissiveMap: leftMfdTex, emissive: 0xff9d3b, emissiveIntensity: 0.65, roughness: 0.35
  }), dashRoot, -0.58, 0.02, 0.02);
  leftMfd.userData = { isCockpitButton: true, action: 'brake', label: 'Frear nave', execute: () => executeCockpitAction('brake') };
  cockpit3DButtons.push(leftMfd);

  // 2. Center MFD: Circular Radar / Navigation Scanner
  const centerMfdTex = makeMfdTelemetryTexture('map');
  const centerMfd = mesh(new THREE.BoxGeometry(0.44, 0.32, 0.02), new THREE.MeshStandardMaterial({
    map: centerMfdTex, emissiveMap: centerMfdTex, emissive: 0x5df5b8, emissiveIntensity: 0.65, roughness: 0.35
  }), dashRoot, 0, 0.02, 0.02);
  centerMfd.userData = { isCockpitButton: true, action: 'map', label: 'Abrir mapa estelar', execute: () => executeCockpitAction('map') };
  cockpit3DButtons.push(centerMfd);

  // 3. Right MFD: Flight Systems & Landing Status
  const rightMfdTex = makeMfdTelemetryTexture('land');
  const rightMfd = mesh(new THREE.BoxGeometry(0.50, 0.32, 0.02), new THREE.MeshStandardMaterial({
    map: rightMfdTex, emissiveMap: rightMfdTex, emissive: 0x62dbd6, emissiveIntensity: 0.65, roughness: 0.35
  }), dashRoot, 0.58, 0.02, 0.02);
  rightMfd.userData = { isCockpitButton: true, action: 'land', label: 'Iniciar pouso', execute: () => executeCockpitAction('land') };
  cockpit3DButtons.push(rightMfd);

  // Center-Top Pushbutton Module (mounted cleanly above center MFD)
  const topModule = new THREE.Group();
  topModule.position.set(0, 0.28, 0.04);
  dashRoot.add(topModule);
  box(topModule, 0, 0, 0, 0.42, 0.08, 0.12, 0x1f2b34);

  // Button 4: RAMPA (backlit aviation toggle)
  const rampTex = makeMfdTelemetryTexture('ramp');
  const rampBtn = mesh(new THREE.BoxGeometry(0.16, 0.07, 0.03), new THREE.MeshStandardMaterial({
    map: rampTex, emissiveMap: rampTex, emissive: 0x7ee2c8, emissiveIntensity: 0.75, roughness: 0.3
  }), topModule, -0.09, 0, 0.06);
  rampBtn.userData = { isCockpitButton: true, action: 'ramp', label: 'Acionar rampa', execute: () => executeCockpitAction('ramp') };
  cockpit3DButtons.push(rampBtn);

  // Button 5: FARÓIS EXTERNOS (Modos: Auto / Ligado / Desligado - padrão Auto)
  const lightsTex = makeMfdTelemetryTexture('lights');
  const lightsBtn = mesh(new THREE.BoxGeometry(0.16, 0.07, 0.03), new THREE.MeshStandardMaterial({
    map: lightsTex, emissiveMap: lightsTex, emissive: 0xffdf7a, emissiveIntensity: 0.75, roughness: 0.3
  }), topModule, 0.09, 0, 0.06);
  lightsBtn.userData = {
    isCockpitButton: true,
    action: 'lights',
    label: 'Ajustar faróis',
    execute: () => executeCockpitAction('lights')
  };
  cockpit3DButtons.push(lightsBtn);

  // The stand-up button was removed as requested (players press 'E' on PC or 2-finger swipe on mobile).
}

function executeCockpitAction(action) {
  if (audioContext && !audioMuted) {
    tone(780, audioContext.currentTime, 0.05, 0.12, fxBus, 'sine');
  }
  if (action === 'land') {
    if (landed) toast('A nave já está pousada.');
    else land();
  } else if (action === 'brake') {
    brakeShip();
  } else if (action === 'ramp') {
    toggleRamp();
  } else if (action === 'stand') {
    if (mode === 'pilot') {
      mode = 'foot';
      inside = true;
      resetFootMotion();
      foot.copy(layout().atlas?atlasPoint('Cockpit_Exit_Spawn').add(V(0,1.84,0)):layout().seat.clone().add(V(0,.08,1.8)));
      yaw = 0; pitch = 0;
      toast('Você levantou do assento. B perto da entrada para desembarcar.');
    }
  } else if (action === 'map') {
    menu('map');
  } else if (action === 'lights' || action === 'camera') {
    cycleHeadlightMode();
  }
}

function findCockpitButtonAt(clientX, clientY) {
  if (mode !== 'pilot' || !inside || cockpit3DButtons.length === 0) return null;
  camera.updateMatrixWorld(true);
  ship.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const useCenter = (typeof touchEnabled !== 'undefined' && touchEnabled) || (typeof mobileDevice !== 'undefined' && mobileDevice) || document.pointerLockElement === renderer.domElement || clientX === undefined || clientY === undefined;
  if (useCenter) {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    ray.set(camera.position, dir);
  } else {
    const ndc = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
    ray.setFromCamera(ndc, camera);
  }
  const hits = ray.intersectObjects(cockpit3DButtons, true);
  if (hits.length > 0 && hits[0].distance < 3.8) {
    let obj = hits[0].object;
    while (obj && !obj.userData?.isCockpitButton && obj.parent) obj = obj.parent;
    if (obj?.userData?.isCockpitButton) return obj;
  }
  return null;
}

function updateCockpitRaycast() {
  if (mode !== 'pilot' || !inside || cockpit3DButtons.length === 0) {
    if (targetedCockpitButton) {
      targetedCockpitButton.material.emissiveIntensity = 0.65;
      targetedCockpitButton = null;
    }
    const infoEl = $('cockpitTargetInfo');
    if (infoEl) infoEl.classList.add('hidden');
    return;
  }

  const hitObj = findCockpitButtonAt();
  const infoEl = $('cockpitTargetInfo');
  if (hitObj) {
    if (targetedCockpitButton && targetedCockpitButton !== hitObj) {
      targetedCockpitButton.material.emissiveIntensity = 0.65;
    }
    targetedCockpitButton = hitObj;
    hitObj.material.emissiveIntensity = 1.45;
    if (infoEl) {
      infoEl.textContent = hitObj.userData.label || 'INTERAGIR';
      infoEl.classList.remove('hidden');
    }
  } else {
    if (targetedCockpitButton) {
      targetedCockpitButton.material.emissiveIntensity = 0.65;
      targetedCockpitButton = null;
    }
    if (infoEl) infoEl.classList.add('hidden');
  }
}
window.updateCockpitRaycast = updateCockpitRaycast;
window.findCockpitButtonAt = findCockpitButtonAt;

