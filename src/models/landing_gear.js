function panelMesh(parent,points,color){const vertices=[],normals=[];for(let i=1;i<points.length-1;i++)for(const k of [0,i,i+1])vertices.push(...points[k]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const m=mat(color);m.side=THREE.DoubleSide;m.metalness=.45;m.roughness=.45;const o=mesh(g,m,parent);o.userData.thinPanel=true;return o;}
function sweptWing(parent,side,z,span,chord,color){const pts=[[side*3,.25,z-chord*.5],[side*span,.2,z+chord*.2],[side*(span-1),.2,z+chord*.6],[side*3,.25,z+chord*.5]];panelMesh(parent,pts,color);panelMesh(parent,pts.map(p=>[p[0],p[1]-.65,p[2]]).reverse(),0x3b515c);for(let i=0;i<4;i++){const a=pts[i],b=pts[(i+1)%4];panelMesh(parent,[a,b,[b[0],b[1]-.65,b[2]],[a[0],a[1]-.65,a[2]]],color);}}



function createLandingGear(parent, x, z, side) {
  const g = new THREE.Group();
  g.position.set(x, -0.22, z);
  parent.add(g);

  // 1. Recessed underbelly bay housing
  const bay = mesh(new THREE.BoxGeometry(1.6, 0.35, 2.2), 0x14181e, g, 0, 0.08, 0);
  bay.userData.noCollision = true;

  // 2. Main Strut Group (lowers and raises)
  const strutGroup = new THREE.Group();
  g.add(strutGroup);

  // Upper outer hydraulic cylinder (titanium gunmetal)
  const upperCyl = mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.90, 12), 0x1a222c, strutGroup, 0, -0.45, 0);
  upperCyl.userData.noCollision = true;

  // Collar reinforcement ring
  mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.16, 12), 0x2d3a48, strutGroup, 0, -0.15, 0);

  // 3. Lower Telescoping Piston (Polished Chrome Steel)
  const pistonGroup = new THREE.Group();
  pistonGroup.position.set(0, -0.85, 0);
  strutGroup.add(pistonGroup);

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdde7ee, metalness: 0.92, roughness: 0.12 });
  const piston = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.90, 12), chromeMat, pistonGroup, 0, -0.45, 0);
  piston.userData.noCollision = true;

  // 4. Articulated Scissor Torque Links
  const scissor1 = mesh(new THREE.BoxGeometry(0.07, 0.50, 0.07), 0x242e3a, strutGroup, side * 0.22, -0.50, 0.14);
  scissor1.userData.noCollision = true;
  const scissor2 = mesh(new THREE.BoxGeometry(0.07, 0.50, 0.07), 0x242e3a, pistonGroup, side * 0.22, -0.22, 0.14);
  scissor2.userData.noCollision = true;

  // 5. Heavy Articulated Magnetic Landing Footpad
  const footPad = new THREE.Group();
  footPad.position.set(0, -0.65, 0);
  pistonGroup.add(footPad);

  // Swivel ball-joint
  mesh(new THREE.SphereGeometry(0.16, 8, 8), 0x303d4a, footPad, 0, 0.08, 0);
  // Wide beveled magnetic pad
  const padMesh = mesh(new THREE.CylinderGeometry(0.62, 0.76, 0.22, 8), 0x14181e, footPad, 0, -0.06, 0);
  padMesh.userData.noCollision = true;
  // Non-skid polymer sole
  const soleMesh = mesh(new THREE.BoxGeometry(1.35, 0.08, 1.85), 0x0c0f13, footPad, 0, -0.18, 0);
  soleMesh.userData.noCollision = true;

  // Status indicator LED (cyan when locked, amber in transit)
  const led = mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), mat(0x42f5d7, 2.0), footPad, side * 0.45, 0.02, 0);
  led.userData.noCollision = true;

  const gearObj = { g, strutGroup, pistonGroup, footPad, scissor1, scissor2, led, side };
  landingGears.push(gearObj);
  return gearObj;
}

function updateLandingGears(dt) {
  if (!landingGears.length) return;
  const targetProgress = (landed || (landingSequence && landingSequence.active)) ? 1.0 : 0.0;
  const transitSpeed = 1.6; // ~1.6s for full extension or retraction

  if (shipGearProgress < targetProgress) {
    shipGearProgress = Math.min(targetProgress, shipGearProgress + dt * transitSpeed);
  } else if (shipGearProgress > targetProgress) {
    shipGearProgress = Math.max(targetProgress, shipGearProgress - dt * transitSpeed);
  }

  const gp = THREE.MathUtils.smoothstep(shipGearProgress, 0, 1);

  if (shipGearSuspension > 0.001) {
    shipGearSuspension = THREE.MathUtils.lerp(shipGearSuspension, 0, 1 - Math.exp(-dt * 12));
  }

  for (const gear of landingGears) {
    if(gear.atlas){gear.g.scale.y=Math.max(.015,gp);gear.g.visible=gp>.02;continue;}
    // Retracts up into bay and folds scissor arms
    gear.strutGroup.position.y = THREE.MathUtils.lerp(0.65, 0.0, gp);
    gear.pistonGroup.position.y = THREE.MathUtils.lerp(-0.10, -0.85 + shipGearSuspension * 0.16, gp);
    gear.scissor1.rotation.x = THREE.MathUtils.lerp(1.2, 0.50, gp);
    gear.scissor2.rotation.x = THREE.MathUtils.lerp(-1.2, -0.50, gp);
    gear.footPad.visible = gp > 0.05;
    gear.strutGroup.scale.set(gp > 0.05 ? 1 : 0.01, Math.max(0.01, gp), gp > 0.05 ? 1 : 0.01);

    if (gear.led && gear.led.material) {
      if (gp >= 0.98) {
        gear.led.material.color.setHex(0x42f5d7); // Ready / locked
      } else if (gp <= 0.02) {
        gear.led.material.color.setHex(0x0a1015); // Off
      } else {
        gear.led.material.color.setHex(0xffa533); // Transit amber
      }
    }
  }
}


window.getAvatar = () => avatar;
