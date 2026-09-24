function remodelRover(kind='rover'){
  vehicleKind = 'rover';
  discardChildren(rover);
  rover.userData.noCollision = true;
  rover.userData.wheels = [];
  rover.userData.wheelRollers = [];
  rover.userData.steerKnuckles = [];
  rover.userData.steeringWheel = null;

  // Authentic Sci-Fi Planetary Exploration Vehicle (Roomy, enclosed aerospace cabin & integrated cockpit)
  const c = 0xbfa074;
  const darkMetal = 0x18222a;
  const chassisMetal = 0x24323e;
  const chromeMetal = 0x8a9faa;
  const frameColor = 0x2d3e4e;

  // 1. Reinforced Planetary Lower Chassis & Skid Plates (width 1.55m, length 3.35m)
  box(rover, 0, 0.32, 0.05, 1.55, 0.22, 3.35, darkMetal);
  box(rover, 0, 0.20, 0.05, 1.25, 0.14, 3.10, 0x111920); // Ventral titanium deflector

  // 2. Aerodynamic Armored Front Nose with Twin LED Lightbars
  box(rover, 0, 0.52, -1.15, 1.35, 0.34, 1.05, c);
  box(rover, 0, 0.46, -1.68, 1.05, 0.24, 0.38, darkMetal);
  // High-intensity front projector LED headlights
  mesh(new THREE.BoxGeometry(0.34, 0.07, 0.04), mat(0xdef5ff, 2.8), rover, -0.38, 0.50, -1.86);
  mesh(new THREE.BoxGeometry(0.34, 0.07, 0.04), mat(0xdef5ff, 2.8), rover, 0.38, 0.50, -1.86);

  // 3. Spacious Interior Cockpit Tub & Built-in Ergonomic Bucket Seat (No giant chair!)
  box(rover, 0, 0.38, 0.05, 1.25, 0.12, 1.75, 0x121a22); // Cockpit floor well
  // Low-profile integrated driver seat cushion
  box(rover, 0, 0.44, 0.10, 0.65, 0.12, 0.62, 0x22303c);
  // Ergonomic reclined backrest (proper human height 0.65m, not 1.8m monolithic block!)
  const seatBack = box(rover, 0, 0.78, 0.38, 0.58, 0.64, 0.10, 0x22303c);
  seatBack.rotation.x = 0.14;
  // Seat side lateral bolsters & shoulder wings
  box(rover, -0.32, 0.54, 0.10, 0.09, 0.24, 0.55, 0x19242d);
  box(rover, 0.32, 0.54, 0.10, 0.09, 0.24, 0.55, 0x19242d);

  // 4. Cockpit Armrests & Center Console
  for (const side of [-1, 1]) {
    box(rover, side * 0.72, 0.68, 0.05, 0.18, 0.52, 1.85, c); // Outer armored cabin doors
    box(rover, side * 0.46, 0.62, 0.10, 0.12, 0.08, 0.68, darkMetal); // Inner armrest pads
  }

  // 5. Slanted Telemetry Dashboard & Avionics Consoles (in front of driver!)
  const dash = box(rover, 0, 0.74, -0.52, 1.30, 0.24, 0.42, 0x18232c);
  dash.rotation.x = -0.25;
  // Multi-Function Displays (MFDs)
  const centerMfd = mesh(new THREE.BoxGeometry(0.36, 0.14, 0.02), mat(0x22f5d2, 1.8), rover, 0, 0.82, -0.48);
  centerMfd.rotation.x = -0.25;
  const leftMfd = mesh(new THREE.BoxGeometry(0.24, 0.11, 0.02), mat(0xffa726, 1.6), rover, -0.42, 0.80, -0.48);
  leftMfd.rotation.x = -0.25;
  const rightMfd = mesh(new THREE.BoxGeometry(0.24, 0.11, 0.02), mat(0x4fc3f7, 1.6), rover, 0.42, 0.80, -0.48);
  rightMfd.rotation.x = -0.25;

  // 6. Articulated Aerospace Steering Yoke / Wheel (dynamic rotation in 1st & 3rd person!)
  const steerColumn = new THREE.Group();
  steerColumn.position.set(0, 0.84, -0.42);
  rover.add(steerColumn);
  const shaft = mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.28, 12), darkMetal, steerColumn, 0, 0, 0);
  shaft.rotation.x = -Math.PI / 4.2;

  const steerYoke = new THREE.Group();
  steerYoke.name = 'steeringWheel';
  steerYoke.position.set(0, 0.10, -0.08);
  steerColumn.add(steerYoke);
  rover.userData.steeringWheel = steerYoke;

  // Ergonomic twin-grip aerospace yoke
  box(steerYoke, 0, 0, 0, 0.22, 0.035, 0.026, darkMetal);
  // Center glowing badge
  mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.012, 16), mat(0x7ee2c8, 2.2), steerYoke, 0, 0, -0.018).rotation.x = Math.PI / 2;
  // Left and Right grips with thumb buttons
  for (const side of [-1, 1]) {
    box(steerYoke, side * 0.17, 0.02, 0, 0.038, 0.15, 0.036, 0x111820);
    mesh(new THREE.SphereGeometry(0.018, 6, 6), chromeMetal, steerYoke, side * 0.17, 0.09, 0);
    mesh(new THREE.BoxGeometry(0.016, 0.04, 0.02), mat(0x22f5d2, 1.8), steerYoke, side * 0.17, -0.05, 0);
  }
  // Upper and lower curved yoke rims
  box(steerYoke, 0, 0.08, 0, 0.36, 0.028, 0.024, 0x1f2b35);
  box(steerYoke, 0, -0.06, 0, 0.32, 0.028, 0.024, 0x1f2b35);

  // 7. Panoramic Glass Canopy & Aerospace Windshield (Seamlessly fitted to roll-cage pillars!)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9be8df,
    transparent: true,
    opacity: 0.22,
    roughness: 0.06,
    metalness: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  function glassQuad(parent, p1, p2, p3, p4) {
    const geo = new THREE.BufferGeometry();
    const vertices = [
      ...p1, ...p2, ...p3,
      ...p1, ...p3, ...p4
    ];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, glassMat);
    m.userData.noCollision = true;
    parent.add(m);
    return m;
  }

  // Elevated cabin roof height (1.64m) to ensure generous clearance so avatar head NEVER clips through the ceiling!
  const roofH = 1.64;

  // Front aerodynamic windshield: extended forward over cowl to fully enclose steering yoke and dashboard!
  glassQuad(rover, [-0.66, 0.70, -0.92], [0.66, 0.70, -0.92], [0.60, roofH, -0.45], [-0.60, roofH, -0.45]);

  // Left panoramic side window: stretched forward and elevated to match roof height
  glassQuad(rover, [-0.66, 0.70, -0.92], [-0.60, roofH, -0.45], [-0.62, roofH, 0.70], [-0.68, 0.70, 1.12]);

  // Right panoramic side window: stretched forward and elevated to match roof height
  glassQuad(rover, [0.66, 0.70, -0.92], [0.68, 0.70, 1.12], [0.62, roofH, 0.70], [0.60, roofH, -0.45]);

  // Rear sloped window: connects rear roof crossbar down to rear engine deck
  glassQuad(rover, [-0.62, roofH, 0.71], [0.62, roofH, 0.71], [0.67, 0.70, 1.13], [-0.67, 0.70, 1.13]);

  // Overhead canopy roof panel: extended forward to meet windshield header bar
  box(rover, 0, roofH + 0.02, 0.125, 1.28, 0.05, 1.18, 0x19252f);
  // Solar charging roof array
  box(rover, 0, roofH + 0.05, 0.125, 1.08, 0.02, 1.02, 0x142028);

  // 8. Tubular Space-Frame Roll-Cage A-pillars, Roof Rails & C-pillars
  bone(rover, V(-0.66, 0.70, -0.92), V(-0.60, roofH, -0.45), 0.045, frameColor); // Left A-pillar
  bone(rover, V(0.66, 0.70, -0.92), V(0.60, roofH, -0.45), 0.045, frameColor);  // Right A-pillar
  bone(rover, V(-0.60, roofH, -0.45), V(-0.62, roofH, 0.70), 0.045, frameColor); // Left roof rail
  bone(rover, V(0.60, roofH, -0.45), V(0.62, roofH, 0.70), 0.045, frameColor);  // Right roof rail
  bone(rover, V(-0.62, roofH, 0.70), V(-0.68, 0.70, 1.12), 0.045, frameColor); // Left C-pillar
  bone(rover, V(0.62, roofH, 0.70), V(0.68, 0.70, 1.12), 0.045, frameColor);  // Right C-pillar
  bone(rover, V(-0.60, roofH, -0.45), V(0.60, roofH, -0.45), 0.04, frameColor);  // Windshield header bar
  bone(rover, V(-0.66, 0.70, -0.92), V(0.66, 0.70, -0.92), 0.04, frameColor);  // Windshield cowl bar
  bone(rover, V(-0.62, roofH, 0.70), V(0.62, roofH, 0.70), 0.04, frameColor);  // Rear roof bar

  // 9. Rear Power Plant & Comms Antenna
  box(rover, 0, 0.62, 1.22, 1.30, 0.44, 0.85, darkMetal);
  // Dual ion cell reactor canisters with turquoise glow
  for (const side of [-1, 1]) {
    const canister = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 14), c, rover, side * 0.44, 0.68, 1.22);
    canister.rotation.x = Math.PI / 2;
    mesh(new THREE.RingGeometry(0.06, 0.11, 14), mat(0x22f5d2, 2.5), rover, side * 0.44, 0.68, 1.50);
  }
  // Parabolic high-gain communication dish
  const commsMast = new THREE.Group();
  commsMast.position.set(0.48, roofH + 0.02, 0.85);
  rover.add(commsMast);
  bone(commsMast, V(0, 0, 0), V(0, 0.36, 0), 0.026, chromeMetal);
  const dish = mesh(new THREE.ConeGeometry(0.20, 0.08, 14, 1, true), 0x76aeb4, commsMast, 0, 0.38, 0);
  dish.rotation.x = Math.PI / 3.2;

  // 10. 4 Heavy All-Terrain Planetary Wheels with Deep Chevron Treads
  const wheelRadius = 0.42;
  const wheelWidth = 0.28;
  const wheelPositions = [
    { side: -1, z: -1.18, front: true },
    { side: 1, z: -1.18, front: true },
    { side: -1, z: 1.18, front: false },
    { side: 1, z: 1.18, front: false }
  ];

  for (const wp of wheelPositions) {
    // Knuckle / Hub assembly (front knuckles steer!)
    const knuckle = new THREE.Group();
    knuckle.position.set(wp.side * 0.88, wheelRadius, wp.z);
    rover.add(knuckle);
    rover.userData.wheels.push(knuckle);

    if (wp.front) {
      rover.userData.steerKnuckles.push({ obj: knuckle, side: wp.side });
    }

    // Suspension wishbone arms
    bone(rover, V(wp.side * 0.55, 0.34, wp.z), V(wp.side * 0.85, wheelRadius, wp.z), 0.065, frameColor);

    // Wheel Roller (rotates on horizontal axle when driving!)
    const roller = new THREE.Group();
    knuckle.add(roller);
    rover.userData.wheelRollers.push(roller);

    // High-durability planetary tire
    const tire = mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20), 0x192128, roller);
    tire.rotation.z = Math.PI / 2;

    // Alloy rim and central hub
    const rim = mesh(new THREE.CylinderGeometry(wheelRadius * 0.60, wheelRadius * 0.60, wheelWidth + 0.02, 14), chromeMetal, roller);
    rim.rotation.z = Math.PI / 2;

    // Center planetary cap
    mesh(new THREE.CylinderGeometry(0.10, 0.10, wheelWidth + 0.04, 10), mat(0x22f5d2, 1.8), roller).rotation.z = Math.PI / 2;
  }

  vehicleHealth = 150;
  rover.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.userData.noCollision = true; // Prevents raycast self-collision!
    }
  });

  if (collisionReady) refreshMovingBodies();
}
