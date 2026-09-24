function createSinglePlanet(sx, sy, i) {
  const pDefs = getPlanetDefs(sx, sy);
  if (i >= pDefs.length) return;
  const d = pDefs[i];
  let center;
  if (sx === 0 && sy === 0) {
    const orbitRadii = [6200, 11200, 16200];
    const angles = [-2.5, 0.6, 2.3];
    const rOrb = orbitRadii[i % orbitRadii.length];
    const a = angles[i % angles.length];
    center = V(Math.cos(a) * rOrb, (i % 2 === 0 ? 0 : 250), Math.sin(a) * rOrb);
  } else if (sx === 1 && sy === 0) {
    const orbitRadii = [6500, 12000, 17500];
    const angles = [-2.1, 0.8, 2.7];
    const rOrb = orbitRadii[i % orbitRadii.length];
    const a = angles[i % angles.length];
    center = V(Math.cos(a) * rOrb, (i % 2 === 0 ? 0 : 250), Math.sin(a) * rOrb);
  } else {
    const rOrb = 6200 + i * 5000;
    const angle = (i * 2.15 + hash2D(sx, sy, 300 + i) * 0.4) % (Math.PI * 2);
    center = V(Math.cos(angle) * rOrb, -100 + hash2D(sx, sy, 500 + i) * 300, Math.sin(angle) * rOrb);
  }
  const p = {
    def: d, i, r: d[7], center,
    theme: d[8] !== undefined ? d[8] : i % 6,
    wet: d[9] !== undefined ? d[9] : wetPlanet({ i }),
    surfaceLoaded: false,
    city: null, scenery: [], animals: [], ores: [],
    water: null, cloud: null
  };
  planets.push(p);

  // Fast base LOD in space (takes only 4ms)
  createPlanetLOD(p);

  p.globe.material.fog = false;
  p.haze = { value: 0 };
  p.hazeColor = { value: new THREE.Color() };
  p.globe.material.onBeforeCompile = shader => {
    shader.uniforms.planetHaze = p.haze;
    shader.uniforms.planetHazeColor = p.hazeColor;
    shader.fragmentShader = `uniform float planetHaze; uniform vec3 planetHazeColor;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `gl_FragColor.rgb=mix(gl_FragColor.rgb,planetHazeColor,planetHaze);\n#include <dithering_fragment>`);
  };
  const glow = new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(p.def[5]) } },
    vertexShader: 'varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 tint;varying vec3 n;varying vec3 v;void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(v))),3.0);gl_FragColor=vec4(tint,rim*.20);}',
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const shell = mesh(new THREE.SphereGeometry(p.r + ATMOSPHERE, 24, 16), glow, scene, ...p.center.toArray());
  shell.userData.noCollision = true;
  shell.visible = false; // User request: No visible atmosphere bubble shell
  p.atmosphere = shell;

  // Destination port marker in space navigation
  const cityPos = center.clone().add(V(0, 1, 0).multiplyScalar(radius(p, UP) + 0.15));
  destinations.push({ name: d[0] + ' · Porto', pos: cityPos.clone(), p, kind: 'planet' });
}

// Distance-based streaming: Load planet surface details only when player approaches
function loadPlanetSurface(p) {
  if (p.surfaceLoaded) return;
  p.surfaceLoaded = true;

  const n = V(0, 1, 0), cityPos = p.center.clone().add(n.multiplyScalar(radius(p, UP) + 0.15));
  p.city = new THREE.Group();
  p.city.position.copy(cityPos);
  scene.add(p.city);
  city(p.city, p);

  // Scenery (trees/rocks)
  const random = rng(182 + (currentSystem.x * 73 + currentSystem.y * 31 + p.i) * 137);
  for (let j = 0; j < 190; j++) {
    let dir = V(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize();
    if (j < 70) dir = V((random() - .5) * .75, 1, (random() - .5) * .75).normalize();
    if (dir.dot(UP) > .976) continue;
    const g = new THREE.Group();
    g.userData.noCollision = true;
    g.position.copy(p.center).addScaledVector(dir, radius(p, dir));
    g.quaternion.setFromUnitVectors(UP, dir);
    scene.add(g);
    scenery.push(g);
    p.scenery.push(g);
    const b = biome(dir, p.theme);
    if (p.theme === 0) {
      mesh(new THREE.CylinderGeometry(1, 1.3, 9, 9), 0x484637, g, 0, 4, 0);
      mesh(new THREE.ConeGeometry(b ? 4 : 6, b ? 9 : 13, 10), p.def[3 + b], g, 0, 11, 0);
    } else if (p.theme === 3) {
      mesh(new THREE.CylinderGeometry(1, 1.5, 8, 10), 0xaf92ba, g, 0, 4, 0);
      mesh(new THREE.SphereGeometry(7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), b ? 0x6767ae : 0xcc8dab, g, 0, 9, 0);
    } else {
      const m = mesh(new THREE.IcosahedronGeometry(3 + random() * 5, 1), p.def[3 + b], g, 0, 3, 0);
      m.scale.y = p.theme === 2 ? 2.7 : .7;
    }
    // Ore collection disabled as requested
  }

  // Animals
  for (let j = 0; j < 12; j++) {
    let dir = V((j % 4 - 1.5) * .035, 1, .24 + Math.floor(j / 4) * .035).normalize(), g = new THREE.Group();
    g.position.copy(p.center).addScaledVector(dir, radius(p, dir));
    g.quaternion.setFromUnitVectors(UP, dir);
    scene.add(g);
    box(g, 0, 1.1, 0, 1.4, 1.2, 2.3, p.def[5]);
    mesh(new THREE.IcosahedronGeometry(.7, 1), p.def[5], g, 0, 1.6, -1.4);
    for (let k = 0; k < (p.theme === 5 ? 6 : 4); k++) box(g, k % 2 ? 1 : -1, .4, Math.floor(k / 2) - .7, .22, .8, .22, p.def[3]);
    if (p.theme === 0 || p.theme === 3) mesh(new THREE.ConeGeometry(.8, 2.5, 3), p.def[4], g, 0, 2.6, 0);
    const an = { g, p, origin: g.position.clone(), phase: j };
    animals.push(an);
    p.animals.push(an);
  }

  // Environment (water, clouds)
  if (wetPlanet(p)) {
    const water = mesh(new THREE.SphereGeometry(seaRadius(p), 64, 40), new THREE.MeshStandardMaterial({
      color: [0x1b7384, 0, 0x407caa, 0x514d8d, 0x318c8b, 0x226d6c][p.theme],
      roughness: .25, metalness: .3, transparent: true, opacity: .84, flatShading: true
    }), scene, ...p.center.toArray());
    water.userData.noCollision = true;
    water.material.side = THREE.DoubleSide;
    p.water = water;
  }

  const cloudMat = new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: (suns[0]?.pos || V(0, 1200, 0)).clone().sub(p.center).normalize() }, tint: { value: new THREE.Color(0xe0e9ec) }, cover: { value: .42 } },
    vertexShader: 'varying vec3 q;void main(){q=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 q;uniform vec3 sunDir;uniform vec3 tint;uniform float cover;void main(){vec3 n=normalize(q);float a=sin(n.x*23.+sin(n.z*15.)*2.)*cos(n.y*19.-n.z*6.);float b=sin(n.z*47.+n.y*16.)*sin(n.x*39.);float cloud=smoothstep(cover,cover+.28,a*.7+b*.3);float light=.10+.90*smoothstep(-.1,.4,dot(n,sunDir));gl_FragColor=vec4(tint*light,cloud*.76);}',
    transparent: true, depthWrite: false, side: THREE.DoubleSide
  });
  p.cloud = mesh(new THREE.SphereGeometry(p.r + 105, 32, 20), cloudMat, scene, ...p.center.toArray());
  p.cloud.userData.noCollision = true;

  // Register only this planet's city bodies
  registerBodies();
  buildSpatialIndex();
}

function unloadPlanetSurface(p) {
  if (!p.surfaceLoaded) return;
  p.surfaceLoaded = false;

  if (p.city) { scene.remove(p.city); discardChildren(p.city); p.city = null; }
  for (const g of p.scenery) { scene.remove(g); discardChildren(g); }
  p.scenery.length = 0;
  for (const a of p.animals) { scene.remove(a.g); discardChildren(a.g); }
  p.animals.length = 0;
  for (const o of p.ores) { scene.remove(o.g); discardChildren(o.g); }
  p.ores.length = 0;
  if (p.water) { scene.remove(p.water); p.water.geometry.dispose(); p.water.material.dispose(); p.water = null; }
  if (p.cloud) { scene.remove(p.cloud); p.cloud.geometry.dispose(); p.cloud.material.dispose(); p.cloud = null; }

  registerBodies();
  buildSpatialIndex();
}

function updateSurfaceStreaming(pos) {
  if (boost || !planets || planets.length === 0) return;
  for (const p of planets) {
    if (!p.surfaceLoaded) {
      loadPlanetSurface(p);
    }
  }
  const stDest = destinations.find(d => d.station);
  if (stDest && stDest.station) {
    const dist = pos.distanceTo(stDest.pos);
    if (dist < 700 && !stDest.station.userData.cityLoaded) {
      loadStationCity(stDest.station);
    }
  }
}

function createSystemPlanets(sx, sy) {
  const pDefs = getPlanetDefs(sx, sy);
  for (let i = 0; i < pDefs.length; i++) {
    createSinglePlanet(sx, sy, i);
  }
}

function createSystemStation(sx, sy) {
  const st = new THREE.Group();
  st.position.set(Math.cos(-1.0) * 8600, 200, Math.sin(-1.0) * 8600);
  scene.add(st);
  const ring = mesh(new THREE.TorusGeometry(65, 4, 12, 72), 0x738c9a, st, 0, 30, 0);
  ring.rotation.x = Math.PI / 2;
  box(st, 0, -7, 0, 30, 14, 35, 0x314655);
  st.userData.cityLoaded = false;
  destinations.push({ name: 'ESTAÇÃO ' + currentSystem.name + ' · Estação', pos: st.position.clone(), station: st, kind: 'station' });
}

function loadStationCity(st) {
  if (st.userData.cityLoaded) return;
  st.userData.cityLoaded = true;
  city(st);
  registerBodies();
  buildSpatialIndex();
}

