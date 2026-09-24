function getMuzzleOffset(id) {
  if (id === 'pistol') return V(0, 0.038, -0.42);
  if (id === 'rifle') return V(0, 0.035, -0.82);
  if (id === 'shotgun') return V(0, 0.032, -0.76);
  if (id === 'blade') return V(0, 0.05, -0.48);
  if (id === 'sabre') return V(0, 0.05, -0.78);
  if (id === 'tool') return V(0, 0.02, -0.44);
  return V(0, 0.03, -0.5);
}
window.getMuzzleOffset = getMuzzleOffset;
window.equipWeapon = equipWeapon;
window.firePlayer = firePlayer;
window.reloadWeapon = reloadWeapon;
window.makeAvatar = makeAvatar;
window.weaponDefs = weaponDefs;
window.getWeaponView = () => weaponView;
window.getAvatarWeapon = () => avatarWeapon;
window.getAvatar = () => avatar;
window.getRecoil = () => recoil;
window.isAiming = () => aiming;
window.getEquipped = () => equipped;
window.getEquipment = () => equipment;
window.updateAvatarWeapon = updateAvatarWeapon;
window.setTouch = setTouch;
window.isReloadActive = () => reloadActive;
window.getReloadDuration = () => reloadDuration;
window.isMeleeActive = () => meleeActive;
window.getMeleeCombo = () => meleeCombo;
window.getTransientFX = () => transientFX;

function makeWeapon(g, id, isAvatar = false) {
  const metal = 0x222d36, polymer = 0x131920, steel = 0x3d4b58, chrome = 0x7a8e9e, accent = 0xca8c3e;
  const s = isAvatar ? 0.88 : 1.0;

  if (id === 'pistol') {
    // Apex-9 Tactical Combat Handgun
    const frame = new THREE.Group(); frame.name = 'frame'; g.add(frame);
    box(frame, 0, -0.12 * s, 0.06 * s, 0.055 * s, 0.22 * s, 0.09 * s, polymer);
    box(frame, 0, -0.23 * s, 0.07 * s, 0.058 * s, 0.035 * s, 0.10 * s, metal);
    box(frame, 0, -0.06 * s, -0.04 * s, 0.035 * s, 0.09 * s, 0.11 * s, polymer);
    box(frame, 0, -0.05 * s, -0.03 * s, 0.015 * s, 0.05 * s, 0.02 * s, accent);
    box(frame, 0, 0, -0.14 * s, 0.058 * s, 0.065 * s, 0.26 * s, polymer);
    box(frame, 0, -0.05 * s, -0.18 * s, 0.042 * s, 0.04 * s, 0.12 * s, metal);
    mesh(new THREE.CylinderGeometry(0.008 * s, 0.008 * s, 0.02 * s, 8), mat(0x42f5d7, 1.8), frame, 0, -0.05 * s, -0.24 * s).rotation.x = Math.PI / 2;

    const slide = new THREE.Group(); slide.name = 'weaponSlide'; g.add(slide);
    box(slide, 0, 0.04 * s, -0.12 * s, 0.062 * s, 0.065 * s, 0.38 * s, steel);
    for (const z of [-0.02, -0.22]) {
      box(slide, 0, 0.04 * s, z * s, 0.066 * s, 0.055 * s, 0.045 * s, metal);
    }
    box(slide, 0.02 * s, 0.045 * s, -0.08 * s, 0.028 * s, 0.038 * s, 0.09 * s, accent);
    const barrel = mesh(new THREE.CylinderGeometry(0.018 * s, 0.018 * s, 0.12 * s, 10), chrome, slide, 0, 0.038 * s, -0.34 * s);
    barrel.rotation.x = Math.PI / 2;
    box(slide, 0, 0.038 * s, -0.38 * s, 0.056 * s, 0.056 * s, 0.08 * s, metal);
    box(slide, 0, 0.09 * s, -0.04 * s, 0.046 * s, 0.04 * s, 0.08 * s, metal);
    mesh(new THREE.PlaneGeometry(0.03 * s, 0.025 * s), mat(0x42f5d7, 2.2), slide, 0, 0.095 * s, -0.04 * s);

  } else if (id === 'rifle') {
    // Tempest-X Bullpup Military Battle Rifle
    const body = new THREE.Group(); body.name = 'rifleBody'; g.add(body);
    box(body, 0, 0, -0.15 * s, 0.095 * s, 0.16 * s, 0.65 * s, metal);
    box(body, 0, 0.02 * s, -0.52 * s, 0.085 * s, 0.12 * s, 0.38 * s, steel);
    for (const z of [-0.42, -0.52, -0.62]) {
      box(body, 0, 0.02 * s, z * s, 0.092 * s, 0.04 * s, 0.045 * s, 0x0e141a);
    }
    const rBarrel = mesh(new THREE.CylinderGeometry(0.022 * s, 0.022 * s, 0.28 * s, 10), chrome, body, 0, 0.035 * s, -0.72 * s);
    rBarrel.rotation.x = Math.PI / 2;
    box(body, 0, 0.035 * s, -0.80 * s, 0.048 * s, 0.048 * s, 0.07 * s, metal);
    box(body, 0, -0.02 * s, 0.24 * s, 0.075 * s, 0.14 * s, 0.22 * s, polymer);
    box(body, 0, -0.02 * s, 0.35 * s, 0.08 * s, 0.18 * s, 0.04 * s, 0x111114);
    box(body, 0, -0.16 * s, -0.08 * s, 0.055 * s, 0.20 * s, 0.085 * s, polymer);
    box(body, 0, -0.10 * s, -0.18 * s, 0.035 * s, 0.08 * s, 0.12 * s, metal);
    box(body, 0, -0.11 * s, -0.50 * s, 0.045 * s, 0.14 * s, 0.08 * s, polymer);

    const mag = new THREE.Group(); mag.name = 'weaponMag'; g.add(mag);
    box(mag, 0, -0.18 * s, 0.08 * s, 0.058 * s, 0.24 * s, 0.11 * s, polymer);
    mesh(new THREE.PlaneGeometry(0.015 * s, 0.18 * s), mat(0x38efba, 1.8), mag, 0.031 * s, -0.18 * s, 0.08 * s);
    box(body, 0, 0.12 * s, -0.22 * s, 0.065 * s, 0.075 * s, 0.24 * s, metal);
    mesh(new THREE.PlaneGeometry(0.04 * s, 0.04 * s), mat(0x38efba, 2.4), body, 0, 0.125 * s, -0.22 * s);

  } else if (id === 'shotgun') {
    // Havoc-12 Heavy Tactical Plasma Breacher
    const sBody = new THREE.Group(); sBody.name = 'shotgunBody'; g.add(sBody);
    box(sBody, 0, 0, -0.12 * s, 0.11 * s, 0.18 * s, 0.52 * s, metal);
    for (const x of [-0.024 * s, 0.024 * s]) {
      const b = mesh(new THREE.CylinderGeometry(0.024 * s, 0.024 * s, 0.58 * s, 10), steel, sBody, x, 0.032 * s, -0.48 * s);
      b.rotation.x = Math.PI / 2;
    }
    box(sBody, 0, 0.032 * s, -0.74 * s, 0.115 * s, 0.065 * s, 0.06 * s, 0x161c22);
    const pump = new THREE.Group(); pump.name = 'weaponPump'; g.add(pump);
    box(pump, 0, -0.055 * s, -0.42 * s, 0.095 * s, 0.09 * s, 0.26 * s, polymer);
    box(sBody, 0, -0.18 * s, 0.05 * s, 0.06 * s, 0.22 * s, 0.085 * s, polymer);
    box(sBody, 0, -0.03 * s, 0.24 * s, 0.085 * s, 0.16 * s, 0.26 * s, metal);
    for (let i = 0; i < 4; i++) {
      mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.075 * s, 8), mat(0xff5a36, 1.6), sBody, -0.065 * s, -0.02 * s + (i * 0.022 * s), -0.08 * s - (i * 0.035 * s)).rotation.z = Math.PI / 2;
    }

  } else if (id === 'blade') {
    // Vibro-Edge Tactical Combat Tanto (Coaxial ergonomic straight alignment)
    const hilt = new THREE.Group(); hilt.name = 'bladeHilt'; g.add(hilt);
    // Straight grip along Z axis behind the guard
    box(hilt, 0, 0, 0.10 * s, 0.038 * s, 0.052 * s, 0.20 * s, polymer);
    box(hilt, 0, 0, 0.21 * s, 0.042 * s, 0.056 * s, 0.03 * s, metal); // Pommel
    box(hilt, 0, 0, 0, 0.055 * s, 0.08 * s, 0.02 * s, metal); // Guard at z=0

    const bGroup = new THREE.Group(); bGroup.name = 'bladeGeometry'; g.add(bGroup);
    // Straight blade extending forward along -Z axis
    box(bGroup, 0, 0.01 * s, -0.21 * s, 0.016 * s, 0.052 * s, 0.42 * s, steel);
    for (let z = -0.06; z > -0.38; z -= 0.06) {
      box(bGroup, 0, 0.032 * s, z * s, 0.022 * s, 0.015 * s, 0.03 * s, metal);
    }
    // High-frequency vibro-edge
    mesh(new THREE.BoxGeometry(0.01 * s, 0.02 * s, 0.42 * s), mat(0x64e8ff, 2.0), bGroup, 0, -0.02 * s, -0.21 * s);
    // Tanto angled piercing tip
    const tip = mesh(new THREE.ConeGeometry(0.03 * s, 0.08 * s, 4), mat(0x64e8ff, 2.2), bGroup, 0, 0, -0.46 * s);
    tip.rotation.x = -Math.PI / 2;

  } else if (id === 'sabre') {
    // Nyx High-Energy Plasma Sabre (Coaxial cylindrical straight alignment)
    const sHilt = new THREE.Group(); sHilt.name = 'sabreHilt'; g.add(sHilt);
    // Cylindrical hilt along Z axis
    const hMesh = mesh(new THREE.CylinderGeometry(0.026 * s, 0.026 * s, 0.24 * s, 12), metal, sHilt, 0, 0, 0.12 * s);
    hMesh.rotation.x = Math.PI / 2;
    for (const z of [0.04, 0.09, 0.14, 0.19]) {
      mesh(new THREE.TorusGeometry(0.028 * s, 0.005 * s, 6, 12), chrome, sHilt, 0, 0, z * s);
    }
    const emitter = mesh(new THREE.CylinderGeometry(0.034 * s, 0.028 * s, 0.04 * s, 12), chrome, sHilt, 0, 0, 0);
    emitter.rotation.x = Math.PI / 2;
    box(sHilt, 0.028 * s, 0, 0.06 * s, 0.01 * s, 0.02 * s, 0.03 * s, accent);

    const bladeGroup = new THREE.Group(); bladeGroup.name = 'plasmaBlade'; g.add(bladeGroup);
    // Straight energetic plasma beam extending forward along -Z
    const core = mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.85 * s, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), bladeGroup, 0, 0, -0.425 * s);
    core.rotation.x = Math.PI / 2;
    const aura = mesh(new THREE.CylinderGeometry(0.028 * s, 0.024 * s, 0.88 * s, 12), new THREE.MeshStandardMaterial({
      color: 0x22f5d2, emissive: 0x22f5d2, emissiveIntensity: 2.5, transparent: true, opacity: 0.85, depthWrite: false
    }), bladeGroup, 0, 0, -0.44 * s);
    aura.rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.028 * s, 8, 8), mat(0x22f5d2, 2.5), bladeGroup, 0, 0, -0.88 * s);

  } else if (id === 'tool') {
    // Ruptor Industrial Mining Rig
    box(g, 0, 0, 0, 0.16 * s, 0.20 * s, 0.38 * s, 0x2a444a);
    box(g, 0, 0.12 * s, -0.06 * s, 0.13 * s, 0.06 * s, 0.22 * s, mat(0x5df5b8, 1.4));
    for (const x of [-0.08 * s, 0.08 * s]) {
      bone(g, V(x, 0.02 * s, -0.18 * s), V(x, 0.02 * s, -0.42 * s), 0.018 * s, 0x8ab8b0);
      mesh(new THREE.SphereGeometry(0.022 * s, 8, 6), mat(0x5df5b8, 2.0), g, x, 0.02 * s, -0.42 * s);
    }
    mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.16 * s, 10), metal, g, 0, -0.12 * s, 0.08 * s).rotation.z = Math.PI / 2;

  } else if (id === 'grenade') {
    // Mk-IV Plasma Ordnance (Spherical Aerodynamic Body)
    mesh(new THREE.SphereGeometry(0.095 * s, 14, 12), mat(0x283830, 0.8), g, 0, 0, 0);
    mesh(new THREE.TorusGeometry(0.096 * s, 0.012 * s, 6, 14), mat(0xffa338, 1.5), g, 0, 0, 0).rotation.x = Math.PI / 2;
    box(g, 0, 0.11 * s, 0, 0.045 * s, 0.045 * s, 0.045 * s, metal);
    box(g, 0.022 * s, 0.08 * s, -0.035 * s, 0.014 * s, 0.10 * s, 0.025 * s, chrome);
    mesh(new THREE.TorusGeometry(0.030 * s, 0.007 * s, 6, 12), chrome, g, -0.040 * s, 0.11 * s, 0);
  } else if (id === 'unarmed') {
    if (!isAvatar) {
      // 1st Person Combat Fists: Left and Right fists in ready boxing guard
      const leftFist = new THREE.Group(); leftFist.name = 'leftFist'; g.add(leftFist);
      leftFist.position.set(-0.24, -0.05, 0.15);
      box(leftFist, 0, -0.08, 0.18, 0.085, 0.085, 0.24, 0x22303c);
      box(leftFist, 0, -0.02, 0.05, 0.088, 0.088, 0.08, 0x18222a);
      box(leftFist, 0, 0, -0.06, 0.092, 0.088, 0.13, 0x2c3b48);
      box(leftFist, 0, 0.015, -0.13, 0.095, 0.055, 0.05, 0x1d2732);
      box(leftFist, 0, 0.038, -0.09, 0.085, 0.018, 0.09, mat(0x8ad1d0, 0.8));
      box(leftFist, 0.045, -0.02, -0.05, 0.035, 0.045, 0.08, 0x1d2732);

      const rightFist = new THREE.Group(); rightFist.name = 'rightFist'; g.add(rightFist);
      rightFist.position.set(0.24, -0.05, 0.15);
      box(rightFist, 0, -0.08, 0.18, 0.085, 0.085, 0.24, 0x22303c);
      box(rightFist, 0, -0.02, 0.05, 0.088, 0.088, 0.08, 0x18222a);
      box(rightFist, 0, 0, -0.06, 0.092, 0.088, 0.13, 0x2c3b48);
      box(rightFist, 0, 0.015, -0.13, 0.095, 0.055, 0.05, 0x1d2732);
      box(rightFist, 0, 0.038, -0.09, 0.085, 0.018, 0.09, mat(0x8ad1d0, 0.8));
      box(rightFist, -0.045, -0.02, -0.05, 0.035, 0.045, 0.08, 0x1d2732);
    }
  }
}
let avatarWeapon = null;

function updateAvatarWeapon() {
  if (riggedAvatarWeapon()) return;
  if (!avatar) return;
  const rig = avatar.userData?.rig;
  const rightElbow = rig?.userData?.human?.elbows?.[1];
  if (!rightElbow) return;

  let holder = rightElbow.getObjectByName('avatarWeaponHolder');
  if (!holder) {
    holder = new THREE.Group();
    holder.name = 'avatarWeaponHolder';
    // Positioned in character's right hand palm, rotated -90° around X so barrel points forward
    holder.position.set(0, -0.285, 0.015);
    holder.rotation.set(-Math.PI / 2, 0, 0);
    rightElbow.add(holder);
  }
  discardChildren(holder);
  if (mode === 'foot' && equipped && !(equipped === 'grenade' && equipment.grenades <= 0)) {
    makeWeapon(holder, equipped, true);
    holder.traverse(o => {
      o.userData.noCollision = true;
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
  }
  avatarWeapon = holder;
}

function rebuildWeapon() {
  if (!weaponView) {
    weaponView = new THREE.Group();
    camera.add(weaponView);
    scene.add(camera);
  }
  discardChildren(weaponView);
  makeWeapon(weaponView, equipped, false);
  if (equipped === 'unarmed') {
    weaponView.position.set(0, -0.22, -0.50);
    weaponView.rotation.set(0, 0, 0);
  } else {
    weaponView.position.set(0.30, -0.28, -0.62);
    weaponView.rotation.set(0, -0.06, 0);
  }
  weaponView.traverse(o => o.userData.noCollision = true);
  updateAvatarWeapon();
}
