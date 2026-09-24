const SEP=1200000,ATMOSPHERE=1200,gates=[],suns=[];let boost=null,gateCooldown=0,autoGate=null,heat=0;
function systemOf(pos){return currentSystem.name;}
function nearest(pos){if(!planets||planets.length===0)return {r:1000,center:V(0,-999999,0),def:['ESPAÇO PROFUNDO','Vácuo','Vácuo',0,0,0x62d6cc,'',1000],i:0};return planets.reduce((a,p)=>pos.distanceTo(p.center)-p.r<pos.distanceTo(a.center)-a.r?p:a,planets[0]);}
function atmosphereAt(pos){
  if(!planets||planets.length===0)return {p:nearest(pos),alt:999999,density:0};
  const p=nearest(pos);
  const norm=pos.clone().sub(p.center).normalize();
  const alt=pos.distanceTo(p.center)-radius(p,norm);
  const cloudAlt = 105.0;
  const atmoCeiling = 450.0;
  let density = 0.0;
  if (alt <= cloudAlt) {
    density = 1.0;
  } else if (alt < atmoCeiling) {
    const normH = (alt - cloudAlt) / (atmoCeiling - cloudAlt);
    density = THREE.MathUtils.smoothstep(1.0 - normH, 0.0, 1.0);
  }
  return {p, alt, density};
}

function createSystemSpace(sx, sy) {
  const pal = starPalettes[Math.floor(hash2D(sx, sy, 201) * starPalettes.length)];
  const pos = V(0, 1200, 0);
  const sun = mesh(new THREE.SphereGeometry(pal.size, 32, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.core[0], pal.core[1], pal.core[2]), fog: false, toneMapped: false }), scene, ...pos.toArray());
  sun.userData.noCollision = true;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const cx = c.getContext('2d'), gr = cx.createRadialGradient(128, 128, 2, 128, 128, 128);
  gr.addColorStop(0, pal.halo1);
  gr.addColorStop(.16, pal.halo2);
  gr.addColorStop(.42, pal.halo3);
  gr.addColorStop(1, pal.halo4);
  cx.fillStyle = gr;
  cx.fillRect(0, 0, 256, 256);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  halo.position.copy(pos);
  halo.scale.set(6500, 6500, 1);
  scene.add(halo);
  suns.push({ pos, sun, halo });
  sunlight.color.set(pal.color);

  // 2 to 4 Gates per system, each with 10 aligned rings corridor (High Performance InstancedMesh)
  const nbrs = getSystemNeighbors(sx, sy);
  const ringCount = 10;
  const ringSpacing = 48;
  const halfLength = ((ringCount - 1) * ringSpacing) / 2;

  const ringGeo = new THREE.TorusGeometry(150, 7.5, 8, 48);
  const lightGeo = new THREE.TorusGeometry(139, 2.2, 8, 48);
  const pylonGeo = new THREE.BoxGeometry(16, 12, 12);
  const railGeo = new THREE.BoxGeometry(6, 6, halfLength * 2 + 50);

  const ringMat = new THREE.MeshStandardMaterial({ color: 0x678b9d, roughness: 0.8, metalness: 0.2 });
  const lightMat = mat(0x83f5ee, 2.2);
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x88a9ae, roughness: 0.8 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x516b77, roughness: 0.8 });

  for (let k = 0; k < nbrs.length; k++) {
    const nbr = nbrs[k];
    const targetName = getSystemName(nbr.x, nbr.y);
    const targetGateIndex = getTargetGateIndex({ x: sx, y: sy }, nbr);
    const angle = (k / nbrs.length) * Math.PI * 2 + 0.35;
    const R = 24000;
    const gPos = V(Math.cos(angle) * R, 3100 + Math.sin(k * 2.2) * 300, Math.sin(angle) * R);
    const normal = gPos.clone().setY(0).normalize();
    const g = new THREE.Group();
    g.position.copy(gPos);
    g.quaternion.setFromUnitVectors(V(0, 0, 1), normal);
    scene.add(g);

    const ringMesh = new THREE.InstancedMesh(ringGeo, ringMat, ringCount);
    ringMesh.userData.noCollision = true;
    const lightMesh = new THREE.InstancedMesh(lightGeo, lightMat, ringCount);
    lightMesh.userData.noCollision = true;
    const pylonMesh = new THREE.InstancedMesh(pylonGeo, pylonMat, ringCount * 8);
    pylonMesh.userData.noCollision = true;

    const m4 = new THREE.Matrix4();
    let pylonIdx = 0;
    for (let r = 0; r < ringCount; r++) {
      const zOff = (r * ringSpacing) - halfLength;
      m4.makeTranslation(0, 0, zOff);
      ringMesh.setMatrixAt(r, m4);
      lightMesh.setMatrixAt(r, m4);

      for (let j = 0; j < 8; j++) {
        const a = j * Math.PI / 4;
        m4.makeTranslation(Math.cos(a) * 155, Math.sin(a) * 155, zOff);
        pylonMesh.setMatrixAt(pylonIdx++, m4);
      }
    }
    ringMesh.instanceMatrix.needsUpdate = true;
    lightMesh.instanceMatrix.needsUpdate = true;
    pylonMesh.instanceMatrix.needsUpdate = true;
    g.add(ringMesh);
    g.add(lightMesh);
    g.add(pylonMesh);

    const railMesh = new THREE.InstancedMesh(railGeo, railMat, 4);
    railMesh.userData.noCollision = true;
    for (let b = 0; b < 4; b++) {
      const ba = b * Math.PI / 2 + Math.PI / 4;
      m4.makeTranslation(Math.cos(ba) * 156, Math.sin(ba) * 156, 0);
      railMesh.setMatrixAt(b, m4);
    }
    railMesh.instanceMatrix.needsUpdate = true;
    g.add(railMesh);

    label3D(g, 'ARCO · ' + targetName, 0, 178, 0, 36);

    gates.push({
      g, pos: gPos, normal, index: k,
      targetCoord: { x: nbr.x, y: nbr.y },
      targetName, targetGateIndex,
      halfLength: halfLength + 60
    });
    const frontPos = gPos.clone().addScaledVector(normal, -(halfLength + 400));
    destinations.push({
      name: 'ARCO ' + targetName + ' · Impulsionador',
      pos: frontPos,
      gateCenter: gPos.clone(),
      gate: k + 1,
      targetSystemName: targetName,
      gateIndex: k,
      numGates: getSystemNeighbors(nbr.x, nbr.y).length,
      kind: 'gate'
    });
  }
}

