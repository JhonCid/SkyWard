let lastMapClickTime = 0;
let lastMapClickIndex = -1;
let lastPlanetClickTime = 0;
let lastPlanetClickIndex = -1;

function handleMapPlanetClick(planetIndex) {
  const p = planets[planetIndex];
  if (!p) return;
  const now = performance.now();
  const isDouble = (lastPlanetClickIndex === planetIndex && (now - lastPlanetClickTime) < 380);
  lastPlanetClickTime = now;
  lastPlanetClickIndex = planetIndex;

  if (isDouble) {
    // Double click: open 3D Planet Map View directly!
    openPlanetMapView(p);
    return;
  }

  // Single click: mark planet core on HUD until player enters atmosphere
  if (target && typeof target === 'object' && target.type === 'planetCore' && target.p === p) {
    target = -1;
  } else {
    target = { type: 'planetCore', p: p, pos: p.center.clone(), name: p.def[0] + ' (Núcleo)' };
  }
  renderPanel('map');
}
window.handleMapPlanetClick = handleMapPlanetClick;

function showMapPlanetTooltip(planetIndex) {
  const p = planets[planetIndex];
  const tip = document.getElementById('mapTooltip');
  if (!p || !tip) return;
  const dist = (ship.position.distanceTo(p.center) / 1000).toFixed(1);
  const isMarked = (target && typeof target === 'object' && target.type === 'planetCore' && target.p === p);
  const kindLabel = p.isGas || p.def[1] === 'Gigante Gasoso' ? 'Gigante Gasoso' : p.isMoon ? 'Lua Natural' : 'Planeta Rochoso';

  tip.innerHTML = `<div><h4>${p.def[0]}</h4><p>${kindLabel} · ${p.def[1]} · ${p.r}m raio · <b>${dist} km</b></p></div><div class="tipAction">${isMarked ? '✓ NÚCLEO MARCADO NO HUD' : 'CLIQUE: MARCAR NÚCLEO'}<br><button onclick="event.stopPropagation(); openPlanetMapView(planets[${planetIndex}])" style="margin-top:6px;padding:4px 10px;background:#1b4a53;color:#7ee2c8;border:1px solid #7ee2c8;border-radius:4px;cursor:pointer;font-weight:bold;font-size:11px;">VER CIDADES E MAPA 3D →</button></div>`;
  tip.style.opacity = '1';
}
window.showMapPlanetTooltip = showMapPlanetTooltip;

function handleMapNodeClick(idx) {
  const now = performance.now();
  const isDouble = (lastMapClickIndex === idx && (now - lastMapClickTime) < 380);
  lastMapClickTime = now;
  lastMapClickIndex = idx;

  const d = destinations[idx];
  if (!d) return;

  if (isDouble) {
    if (d.p && d.kind === 'planet') {
      openPlanetMapView(d.p);
      return;
    }
    if (mode !== 'pilot') return;
    target = idx;
    auto = destinations[idx];
    landed = false;
    openRamp(false, false);
    flightSpeed = 0;
    closeMenu();
  } else {
    if (target === idx) {
      target = -1;
    } else {
      target = idx;
    }
    renderPanel('map');
  }
}
window.handleMapNodeClick = handleMapNodeClick;
window.getTarget = () => target;
window.setTarget = i => target = i;

function showMapTooltip(idx) {
  const d = destinations[idx];
  const tip = document.getElementById('mapTooltip');
  if (!d || !tip) return;
  const dist = (ship.position.distanceTo(d.pos) / 1000).toFixed(1);
  const p = d.p;
  const kindLabel = d.gate ? 'Portal Interestelar' : d.kind === 'gas_giant' ? 'Gigante Gasoso' : d.kind === 'moon' ? 'Lua Natural' : d.station ? 'Estação Orbital' : 'Planeta Rochoso';
  const targetSys = d.targetName || d.targetSystemName || 'Vizinho';
  const desc = d.gate ? `Corredor de 10 arcos para o Sistema ${targetSys}` : p ? `${p.def[1]} · ${p.r}m raio` : 'Terminal comercial e de serviços';
  const isMarked = (target === idx);
  const actionText = (d.p && d.kind === 'planet') ? 'DUPLO CLIQUE: MAPA PLANETÁRIO 3D' : 'DUPLO CLIQUE: PILOTO AUTOMÁTICO';

  tip.innerHTML = `<div><h4>${d.name}</h4><p>${kindLabel} · ${desc} · <b>${dist} km</b></p></div><div class="tipAction">${isMarked ? '✓ MARCADO NO HUD' : 'CLIQUE: MARCAR'}<br><small style="color:#a8c4c9;">${actionText}</small></div>`;
  tip.style.opacity = '1';
}
window.showMapTooltip = showMapTooltip;

function hideMapTooltip() {
  const tip = document.getElementById('mapTooltip');
  if (tip) tip.style.opacity = '0';
}
window.hideMapTooltip = hideMapTooltip;

let mapPan = { x: 0, y: 0 };
let mapZoom = 1.0;
let mapDragging = false;
let mapDragStart = { x: 0, y: 0 };
let mapPinchDist = 0;

function initMapInteractions() {
  const c = document.getElementById('systemMapContainer');
  if (!c || c._mapBound) return;
  c._mapBound = true;

  // Map is fixed, non-draggable and non-zoomable per user design
  mapPan = { x: 0, y: 0 };
  mapZoom = 1.0;
  mapDragging = false;
  c.style.cursor = 'default';
  updateMapTransform();
}

function updateMapTransform() {
  const g = document.getElementById('mapPanZoomLayer');
  if (g && typeof g.setAttribute === 'function') {
    g.setAttribute('transform', `translate(${mapPan.x.toFixed(1)}, ${mapPan.y.toFixed(1)}) scale(${mapZoom.toFixed(2)})`);
  }
}

function render2DSystemMap() {
  setTimeout(initMapInteractions, 50);

  // Real-world astronomical projection of the solar system around central Sun (0, 0)
  const nodes = [];
  const celestialDistances = planets.map(p => Math.hypot(p.center.x, p.center.z));
  const gateDistances = gates.map(g => Math.hypot(g.pos.x, g.pos.z));
  const maxWorldDist = Math.max(24500, ...celestialDistances, ...gateDistances);
  const MAP_SCALE = 330 / maxWorldDist;

  // 1. EXACTLY ONE CIRCLE PER PLANET/MOON (Eliminates duplicate circles completely!)
  planets.forEach((p, pi) => {
    const isGas = p.isGas || p.def[1] === 'Gigante Gasoso';
    const isMoon = !!p.isMoon;
    const bodyR = isGas ? 36 : isMoon ? 17 : 26;
    const x = p.center.x * MAP_SCALE;
    const y = p.center.z * MAP_SCALE;
    const isTarget = (target && typeof target === 'object' && target.type === 'planetCore' && target.p === p);

    nodes.push({
      type: 'planet',
      planetIndex: pi,
      p,
      x,
      y,
      bodyR,
      isGas,
      isMoon,
      isTarget,
      name: p.def[0],
      colorHex: '#' + (p.def[3] || 0x7ee2c8).toString(16).padStart(6, '0')
    });
  });

  // 2. STARGATES (One circle per hypergate)
  gates.forEach((gate, gi) => {
    const gateDestIdx = destinations.findIndex(d => d.gate === (gate.index || gi + 1) || (d.pos && d.pos.distanceTo(gate.pos) < 100));
    const destIdx = gateDestIdx >= 0 ? gateDestIdx : gi;
    const x = gate.pos.x * MAP_SCALE;
    const y = gate.pos.z * MAP_SCALE;
    const isTarget = (target === destIdx);

    nodes.push({
      type: 'gate',
      gateIndex: gi,
      destIndex: destIdx,
      x,
      y,
      bodyR: 22,
      isGate: true,
      isTarget,
      name: 'ARCO ' + (gate.targetName || 'SISTEMA').toUpperCase(),
      colorHex: '#80deea'
    });
  });

  // 3. ORBITAL STATIONS (One circle per station)
  destinations.forEach((d, di) => {
    if (d.station) {
      const x = d.pos.x * MAP_SCALE;
      const y = d.pos.z * MAP_SCALE;
      const isTarget = (target === di);

      nodes.push({
        type: 'station',
        destIndex: di,
        d,
        x,
        y,
        bodyR: 24,
        isStation: true,
        isTarget,
        name: d.name.split(' · ')[0],
        colorHex: '#ffd54f'
      });
    }
  });

  // Gentle anti-overlap pass: ensures minimum 72px clearance between any two nodes
  for (let iter = 0; iter < 15; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      const dSun = Math.hypot(nodes[i].x, nodes[i].y);
      if (dSun < 75) {
        const push = 75 - dSun;
        const ang = Math.atan2(nodes[i].y, nodes[i].x) || (i * 1.2);
        nodes[i].x += Math.cos(ang) * push;
        nodes[i].y += Math.sin(ang) * push;
      }
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.hypot(dx, dy);
        const minDist = 72;
        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          nodes[i].x -= nx * overlap;
          nodes[i].y -= ny * overlap;
          nodes[j].x += nx * overlap;
          nodes[j].y += ny * overlap;
        }
      }
    }
  }

  // Header
  let svg = `<div class="eyebrow">SISTEMA ${currentSystem.name} · COORDENADAS [${currentSystem.x}, ${currentSystem.y}]</div><h2>Carta Estelar do Sistema</h2><div id="systemMapContainer" style="cursor:default;"><svg class="systemMapSvg" viewBox="-400 -400 800 800"><defs><radialGradient id="starGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fffde7" stop-opacity="1"/><stop offset="30%" stop-color="#ffe082" stop-opacity="0.9"/><stop offset="70%" stop-color="#ff9800" stop-opacity="0.3"/><stop offset="100%" stop-color="#ff5722" stop-opacity="0"/></radialGradient></defs><g id="mapPanZoomLayer" transform="translate(${mapPan.x.toFixed(1)}, ${mapPan.y.toFixed(1)}) scale(${mapZoom.toFixed(2)})">`;

  // Deep-space radar background rings & range markers
  for (let r of [90, 180, 270, 360]) {
    svg += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="rgba(126,226,200,0.16)" stroke-width="1.2" stroke-dasharray="4,8"/>`;
  }
  svg += `<line x1="-365" y1="0" x2="365" y2="0" stroke="rgba(126,226,200,0.10)" stroke-width="1.2"/><line x1="0" y1="-365" x2="0" y2="365" stroke="rgba(126,226,200,0.10)" stroke-width="1.2"/>`;
  svg += `<text x="6" y="-94" fill="rgba(126,226,200,0.45)" font-size="10">25k km</text><text x="6" y="-184" fill="rgba(126,226,200,0.45)" font-size="10">50k km</text><text x="6" y="-274" fill="rgba(126,226,200,0.45)" font-size="10">75k km</text><text x="6" y="-354" fill="rgba(126,226,200,0.45)" font-size="10">100k km</text>`;

  // Planetary & station orbit lines centered on the Sun
  const drawnOrbits = new Set();
  nodes.forEach(n => {
    if ((n.p || n.d?.p) && !n.isMoon) {
      const rOrb = Math.round(Math.hypot(n.x, n.y));
      if (!drawnOrbits.has(rOrb)) {
        drawnOrbits.add(rOrb);
        svg += `<circle cx="0" cy="0" r="${rOrb}" fill="none" stroke="rgba(126,226,200,0.24)" stroke-width="1.4" stroke-dasharray="3,5"/>`;
      }
    }
  });

  // Central Sun (The true center of the system)
  svg += `<circle cx="0" cy="0" r="46" fill="url(#starGlow)"/><circle cx="0" cy="0" r="26" fill="#fff9c4"/><text x="0" y="54" text-anchor="middle" fill="#ffe082" stroke="#030a11" stroke-width="3.5" paint-order="stroke" font-size="12" font-weight="bold" letter-spacing="2">ESTRELA ${currentSystem.name}</text>`;

  // Render celestial nodes (enlarged icons, single circle per planet, clean interactions)
  nodes.forEach(n => {
    const isTarget = !!n.isTarget;
    const px = n.x.toFixed(1);
    const py = n.y.toFixed(1);

    const clickAttr = (n.type === 'planet') ? `onclick="handleMapPlanetClick(${n.planetIndex})" onpointerenter="showMapPlanetTooltip(${n.planetIndex})" ontouchstart="showMapPlanetTooltip(${n.planetIndex})"` : `onclick="handleMapNodeClick(${n.destIndex})" onpointerenter="showMapTooltip(${n.destIndex})" ontouchstart="showMapTooltip(${n.destIndex})"`;

    svg += `<g class="mapNode" ${clickAttr} onpointerleave="hideMapTooltip()">`;

    if (isTarget) {
      svg += `<circle cx="${px}" cy="${py}" r="${(n.bodyR + 12).toFixed(1)}" fill="none" stroke="#7ee2c8" stroke-width="3" stroke-dasharray="4,4"><animateTransform attributeName="transform" type="rotate" from="0 ${px} ${py}" to="360 ${px} ${py}" dur="8s" repeatCount="indefinite"/></circle>`;
    }

    if (n.isGas) {
      svg += `<ellipse cx="${px}" cy="${py}" rx="54" ry="16" fill="none" stroke="rgba(255,209,128,0.65)" stroke-width="3" transform="rotate(-20 ${px} ${py})"/>`;
    }

    if (n.isGate) {
      svg += `<circle cx="${px}" cy="${py}" r="${n.bodyR}" fill="#041a24" stroke="#80deea" stroke-width="3" stroke-dasharray="6,3"/><circle cx="${px}" cy="${py}" r="${(n.bodyR - 6).toFixed(1)}" fill="none" stroke="#00e5ff" stroke-width="2"/>`;
    } else if (n.isStation) {
      svg += `<circle cx="${px}" cy="${py}" r="${n.bodyR}" fill="#1a242f" stroke="#ffd54f" stroke-width="2.5"/><rect x="${(n.x - 8).toFixed(1)}" y="${(n.y - 8).toFixed(1)}" width="16" height="16" fill="#ffd54f" transform="rotate(45 ${px} ${py})"/>`;
    } else {
      svg += `<circle class="bodyDisc" cx="${px}" cy="${py}" r="${n.bodyR}" fill="${n.colorHex}" stroke="rgba(255,255,255,0.85)" stroke-width="2.5"/>`;
    }

    svg += `<text x="${px}" y="${(n.y + n.bodyR + 17).toFixed(1)}" text-anchor="middle" fill="${isTarget ? '#7ee2c8' : '#ffffff'}" stroke="#030a11" stroke-width="3.5" paint-order="stroke" font-size="13" font-weight="bold">${n.name}</text>`;
    svg += `</g>`;
  });

  // Current Player / Ship Position (exact orthographic projection from real 3D space)
  const sx = ship.position.x * MAP_SCALE;
  const sy = ship.position.z * MAP_SCALE;
  const isShipTarget = (target === 'ship');
  svg += `<g class="mapNode" onclick="handleMapShipClick()" style="cursor:pointer;" onpointerenter="showMapShipTooltip()" onpointerleave="hideMapTooltip()">`;
  svg += `<g transform="translate(${sx.toFixed(1)}, ${sy.toFixed(1)})">`;
  if (isShipTarget) {
    svg += `<circle cx="0" cy="0" r="24" fill="none" stroke="#7ee2c8" stroke-width="2.5" stroke-dasharray="4,4"><animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="6s" repeatCount="indefinite"/></circle>`;
  }
  svg += `<polygon points="0,-14 9,10 0,6 -9,10" fill="#00e5ff" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 0 8px #00e5ff)"/>`;
  svg += `<text x="0" y="-19" text-anchor="middle" fill="${isShipTarget ? '#7ee2c8' : '#00e5ff'}" stroke="#030a11" stroke-width="3" paint-order="stroke" font-size="12" font-weight="bold">${mode === 'pilot' ? 'VOCÊ (ATLAS)' : 'SUA NAVE (ATLAS)'}</text>`;
  svg += `</g></g>`;

  svg += `</g></svg><div id="mapTooltip" style="opacity:0;"></div></div>`;
  return svg;
}
window.render2DSystemMap = render2DSystemMap;

