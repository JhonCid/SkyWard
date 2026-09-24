const WARP_PARTICLE_COUNT = 240;
const warpPositions = new Float32Array(WARP_PARTICLE_COUNT * 6);
const warpGeo = new THREE.BufferGeometry();
warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));
const warpMat = new THREE.LineBasicMaterial({
  color: 0x6be8ff,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const warpStream = new THREE.LineSegments(warpGeo, warpMat);
warpStream.frustumCulled = false;
warpStream.visible = false;
scene.add(warpStream);
window.warpStream = warpStream;

const warpParticles = [];
for (let i = 0; i < WARP_PARTICLE_COUNT; i++) {
  warpParticles.push({
    theta: Math.random() * Math.PI * 2,
    radius: 6 + Math.pow(Math.random(), 1.6) * 55,
    z: (Math.random() - 0.5) * 260,
    length: 24 + Math.random() * 52,
    speedMult: 0.85 + Math.random() * 0.35
  });
}

function updateWarpStream(dt) {
  if (!boost) {
    warpStream.visible = false;
    return;
  }
  warpStream.visible = true;
  const travelDir = (boost.arrivalDir || boost.warpDir || V(0, 0, -1).applyQuaternion(ship.quaternion)).clone().normalize();
  warpStream.position.copy(ship.position);
  warpStream.quaternion.setFromUnitVectors(V(0, 0, -1), travelDir);

  const streamSpeed = Math.max(380, flightSpeed * 0.28);
  const posArr = warpGeo.attributes.position.array;

  for (let i = 0; i < WARP_PARTICLE_COUNT; i++) {
    const p = warpParticles[i];
    p.z += streamSpeed * p.speedMult * dt;
    if (p.z > 140) {
      p.z = -140;
      p.theta = Math.random() * Math.PI * 2;
      p.radius = 6 + Math.pow(Math.random(), 1.6) * 55;
    }
    const x = Math.cos(p.theta) * p.radius;
    const y = Math.sin(p.theta) * p.radius;
    const idx = i * 6;
    posArr[idx] = x;
    posArr[idx + 1] = y;
    posArr[idx + 2] = p.z - p.length;
    posArr[idx + 3] = x;
    posArr[idx + 4] = y;
    posArr[idx + 5] = p.z;
  }
  warpGeo.attributes.position.needsUpdate = true;
  warpMat.opacity = Math.min(0.9, (flightSpeed / 3000) * 0.85 + 0.15);
}

