let currentPlanetMapP = null;
let planetGlobeRotX = 0.22;
let planetGlobeRotY = 0.0;
let renderedGlobePins = [];
let hoveredGlobePin = null;
let lastPinClickTime = 0;
let lastPinClickIndex = -1;

function openPlanetMapView(p) {
  if (!p) return;
  currentPlanetMapP = p;
  planetGlobeRotY = 0;
  closeWeaponPicker();
  $('actionStrip').classList.add('hidden');
  clearInput();
  document.body.classList.add('in-menu');
  document.exitPointerLock?.();
  $('panel').classList.remove('hidden');

  let html = `
    <div class="eyebrow">CARTOGRAFIA PLANETÁRIA · SISTEMA ${(currentSystem.name || 'ÉOS').toUpperCase()}</div>
    <h2>${p.def[0]} <span style="font-size:16px;color:#88bec7;font-weight:normal;">(${p.def[1]} · ${p.r}m raio)</span></h2>
    <p style="margin-bottom:12px;color:#a0c5cb;">Arraste horizontalmente para girar o planeta. Clique em um local para marcar no HUD ou dê duplo clique para acionar o piloto automático.</p>

    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin:8px 0;">
      <div style="position:relative;width:500px;height:500px;max-width:88vw;max-height:60vh;border-radius:50%;background:radial-gradient(circle at 35% 35%, #192d3b, #04080c);box-shadow:0 0 50px rgba(66,245,215,0.22), inset 0 0 35px rgba(0,0,0,0.85);overflow:hidden;cursor:grab;touch-action:none;" id="planetGlobeContainer">
        <canvas id="planetGlobeCanvas" width="500" height="500" style="display:block;width:100%;height:100%;"></canvas>
        <div id="globeHoverTip" style="position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:12px;color:#7ee2c8;pointer-events:none;letter-spacing:1px;text-shadow:0 1px 4px #000;">
          Arraste horizontalmente para girar
        </div>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-top:14px;justify-content:center;">
      <button class="primary" onclick="menu('map')">← VOLTAR AO MAPA DO SISTEMA</button>
      <button onclick="closeMenu()">VOLTAR AO JOGO</button>
    </div>
  `;

  $('content').innerHTML = html;
  setTimeout(() => initPlanetGlobe(p), 25);
}
window.openPlanetMapView = openPlanetMapView;

window.selectPlanetSettlementAuto = function(idx) {
  if (mode !== 'pilot') return;
  const d = destinations[idx];
  if (!d) return;
  target = idx;
  auto = d;
  landed = false;
  openRamp(false, false);
  flightSpeed = 0;
  closeMenu();
};

window.selectPlanetSettlementTarget = function(idx) {
  const d = destinations[idx];
  if (!d) return;
  if (target === idx) {
    target = -1;
  } else {
    target = idx;
  }
  if (currentPlanetMapP) openPlanetMapView(currentPlanetMapP);
};

function initPlanetGlobe(p) {
  const canvas = $('planetGlobeCanvas');
  const container = $('planetGlobeContainer');
  if (!canvas || !container) return;
  const ctx = canvas.getContext('2d');

  const planetDests = destinations.map((d, i) => ({ d, i })).filter(item => item.d.p === p && !item.d.gate && item.d.kind !== 'water');

  let isDown = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let downTime = 0;

  const onPointerDown = e => {
    isDown = true;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    downTime = performance.now();
    container.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onPointerMove = e => {
    if (isDown) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 4) {
        isDragging = true;
      }
      startX = e.clientX;
      startY = e.clientY;
      // Strictly horizontal rotation around polar axis per user request
      planetGlobeRotY += dx * 0.009;
      drawGlobe();
      e.preventDefault();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    let hit = null;
    for (const pin of renderedGlobePins) {
      if (Math.hypot(mx - pin.sx, my - pin.sy) < 28) {
        hit = pin;
        break;
      }
    }
    if (hit !== hoveredGlobePin) {
      hoveredGlobePin = hit;
      container.style.cursor = hit ? 'pointer' : 'grab';
      const tip = $('globeHoverTip');
      if (tip) {
        if (hit) {
          const distKm = (ship.position.distanceTo(hit.d.pos) / 1000).toFixed(1);
          const locName = hit.d.name.includes(' · ') ? hit.d.name.split(' · ')[1] : hit.d.name;
          tip.innerHTML = `<b style="color:#ffffff;">${p.def[0]} · ${locName}</b> · ${distKm} km <span style="color:#a8c4c9;">(Clique: Marcar · Duplo Clique: Piloto Automático)</span>`;
        } else {
          tip.textContent = 'Arraste horizontalmente para girar';
        }
      }
      drawGlobe();
    }
  };

  const onPointerUp = e => {
    if (!isDown) return;
    isDown = false;
    container.style.cursor = hoveredGlobePin ? 'pointer' : 'grab';

    const clickDuration = performance.now() - downTime;
    if (!isDragging && clickDuration < 380) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      let clickedPin = null;
      let closestDist = 32;
      for (const pin of renderedGlobePins) {
        const d = Math.hypot(mx - pin.sx, my - pin.sy);
        if (d < closestDist) {
          closestDist = d;
          clickedPin = pin;
        }
      }

      if (clickedPin) {
        const now = performance.now();
        const isDouble = (lastPinClickIndex === clickedPin.i && (now - lastPinClickTime) < 380);
        lastPinClickTime = now;
        lastPinClickIndex = clickedPin.i;

        if (isDouble) {
          // Double click: engage autopilot directly to this location!
          if (mode !== 'pilot') {
            target = clickedPin.i;
            drawGlobe();
            return;
          }
          target = clickedPin.i;
          auto = destinations[clickedPin.i];
          landed = false;
          openRamp(false, false);
          flightSpeed = 0;
          closeMenu();
        } else {
          // Single click: mark location on HUD!
          if (target === clickedPin.i) {
            target = -1;
          } else {
            target = clickedPin.i;
          }
          drawGlobe();
        }
      }
    }
  };

  container.onpointerdown = onPointerDown;
  window.onpointermove = onPointerMove;
  window.onpointerup = onPointerUp;

  function drawGlobe() {
    if (!ctx || typeof ctx.save !== 'function' || $('panel').classList.contains('hidden') || !$('planetGlobeCanvas')) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = W * 0.42;
    ctx.clearRect(0, 0, W, H);
    renderedGlobePins = [];

    const colorHex = '#' + (p.def[3] || 0x3d7085).toString(16).padStart(6, '0');
    const secColorHex = '#' + (p.def[4] || 0x274959).toString(16).padStart(6, '0');

    const sunLX = cx - R * 0.45;
    const sunLY = cy - R * 0.45;
    const sphereGrad = ctx.createRadialGradient(sunLX, sunLY, R * 0.1, cx, cy, R);
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.25, colorHex);
    sphereGrad.addColorStop(0.7, secColorHex);
    sphereGrad.addColorStop(1, '#020508');

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = sphereGrad;
    ctx.fillRect(0, 0, W, H);

    const TILT_X = 0.28;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.2;
    for (let lat = -60; lat <= 60; lat += 30) {
      const latRad = lat * Math.PI / 180;
      const y3d = Math.sin(latRad);
      const rAtLat = Math.cos(latRad);
      const tiltY = y3d * Math.cos(TILT_X);
      const ellipseY = cy - tiltY * R;
      const rX = rAtLat * R;
      const rY = Math.abs(rAtLat * Math.sin(TILT_X) * R);
      ctx.beginPath();
      ctx.ellipse(cx, ellipseY, rX, Math.max(1, rY), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let lon = 0; lon < 360; lon += 45) {
      const lonRad = (lon * Math.PI / 180) + planetGlobeRotY;
      const tiltX = Math.sin(lonRad);
      const cosLon = Math.cos(lonRad);
      if (cosLon > -0.2) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(tiltX * R), R, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R);
    rimGrad.addColorStop(0, 'rgba(66,245,215,0)');
    rimGrad.addColorStop(1, 'rgba(66,245,215,0.35)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();

    ctx.strokeStyle = 'rgba(66,245,215,0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    planetDests.forEach(({ d, i }) => {
      let norm = d.settlement?.normal || (d.pos ? d.pos.clone().sub(p.center).normalize() : new THREE.Vector3(0, 1, 0));
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), planetGlobeRotY);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), TILT_X);
      const rotNorm = norm.clone().applyQuaternion(qY).applyQuaternion(qX);

      if (rotNorm.z >= -0.05) {
        const sx = cx + rotNorm.x * R;
        const sy = cy - rotNorm.y * R;
        const isTarget = (target === i);
        const isHover = (hoveredGlobePin && hoveredGlobePin.i === i);

        renderedGlobePins.push({ i, d, sx, sy, isTarget });

        const markerColor = isTarget ? '#42f5d7' : isHover ? '#ffd54f' : '#80deea';

        ctx.save();
        ctx.shadowColor = markerColor;
        ctx.shadowBlur = (isTarget || isHover) ? 16 : 8;

        // Outer ring
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = isTarget ? 3 : 2;
        ctx.beginPath();
        ctx.arc(sx, sy, isTarget ? 11 : isHover ? 9 : 7, 0, Math.PI * 2);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.arc(sx, sy, isTarget ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Label pill background & text
        const locName = d.name.includes(' · ') ? d.name.split(' · ')[1] : d.name;
        const labelText = (isTarget ? '✓ ' : '') + locName;
        ctx.font = isTarget ? 'bold 13px Arial' : '12px Arial';
        const textWidth = ctx.measureText(labelText).width;
        const alignRight = sx > cx;
        const boxX = alignRight ? sx + 14 : sx - 14 - textWidth - 12;
        const boxY = sy - 10;

        ctx.fillStyle = 'rgba(6, 18, 26, 0.88)';
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = isTarget ? 1.5 : 1.0;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, textWidth + 12, 20, [4]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isTarget ? '#ffffff' : '#d8f0ed';
        ctx.textAlign = 'left';
        ctx.fillText(labelText, boxX + 6, boxY + 14);

        ctx.restore();
      }
    });
  }

  drawGlobe();
}
window.initPlanetGlobe = initPlanetGlobe;
