function makeCockpitButtonTexture(label, sub, colorHex) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 80;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#06131c';
  ctx.fillRect(0, 0, 128, 80);
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 122, 74);
  ctx.fillStyle = '#edf7fa';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 64, 30);
  ctx.fillStyle = colorHex;
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(sub, 64, 56);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeMfdTelemetryTexture(type) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 180;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#061017';
  ctx.fillRect(0, 0, 256, 180);

  if (type === 'brake') {
    // Left MFD: Power / Propulsion telemetry (Amber Drake Cutter style)
    ctx.strokeStyle = '#e0882e'; ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 172);
    ctx.fillStyle = '#e0882e';
    ctx.font = 'bold 13px Courier, monospace';
    ctx.fillText('PWR MGMT // DRAKE CUTTER', 14, 24);
    ctx.fillRect(14, 32, 228, 2);
    // Vertical power bars
    for (let i = 0; i < 4; i++) {
      const bx = 26 + i * 54;
      ctx.strokeRect(bx, 44, 38, 90);
      const h = [65, 80, 50, 75][i];
      ctx.fillRect(bx + 4, 44 + (90 - h), 30, h);
      ctx.font = '10px Courier, monospace';
      ctx.fillText(['THR', 'SHD', 'ENG', 'BRK'][i], bx + 6, 150);
    }
    ctx.fillStyle = '#ffbe6b';
    ctx.font = '11px Courier, monospace';
    ctx.fillText('OUTPUT: 100% · REVERSE READY', 14, 168);
  } else if (type === 'map') {
    // Center MFD: Radar Scanner (Star Citizen circular radar grid)
    ctx.strokeStyle = '#429e84'; ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 172);
    const cx = 128, cy = 94;
    // Concentric range rings
    for (const r of [25, 48, 70]) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    // Crosshair axes
    ctx.beginPath();
    ctx.moveTo(cx - 72, cy); ctx.lineTo(cx + 72, cy);
    ctx.moveTo(cx, cy - 72); ctx.lineTo(cx, cy + 72);
    ctx.stroke();
    // Heading ticks
    ctx.fillStyle = '#61d9b8';
    ctx.font = '10px Courier, monospace';
    ctx.fillText('000°', cx - 12, cy - 74);
    ctx.fillText('090°', cx + 76, cy + 4);
    ctx.fillText('180°', cx - 12, cy + 82);
    ctx.fillText('270°', cx - 100, cy + 4);
    // Target pings
    ctx.fillStyle = '#ffcf52';
    ctx.beginPath(); ctx.arc(cx + 28, cy - 32, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 38, cy + 18, 3, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'land') {
    // Right MFD: Flight Systems & Landing gear status (Cyan/Green avionics)
    ctx.strokeStyle = '#4db8c7'; ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 172);
    ctx.fillStyle = '#4db8c7';
    ctx.font = 'bold 13px Courier, monospace';
    ctx.fillText('FLIGHT CONFIG // SENSORS', 14, 24);
    ctx.fillRect(14, 32, 228, 2);
    // Systems checklist
    const items = ['GEAR DEPLOYMENT', 'APPROACH RADAR', 'DECK COUPLER', 'TERRAIN SCAN'];
    for (let i = 0; i < items.length; i++) {
      const y = 52 + i * 26;
      ctx.strokeRect(20, y, 14, 14);
      ctx.fillRect(23, y + 3, 8, 8);
      ctx.font = '11px Courier, monospace';
      ctx.fillText(items[i], 44, y + 12);
      ctx.fillText('OK', 210, y + 12);
    }
    ctx.font = '11px Courier, monospace';
    ctx.fillText('RADAR ALT: 90M · PAD AUTO-LOCK', 14, 168);
  } else if (type === 'lights') {
    ctx.strokeStyle = '#8a7848'; ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 250, 174);
    ctx.fillStyle = '#262014';
    ctx.fillRect(6, 6, 244, 168);
    ctx.fillStyle = '#ffdf7a';
    ctx.font = 'bold 24px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LIGHTS', 128, 75);
    ctx.font = 'bold 15px Courier, monospace';
    const curMode = (typeof headlightMode !== 'undefined' ? headlightMode : 'auto').toUpperCase();
    ctx.fillText('[' + curMode + ']', 128, 115);
  } else if (type === 'ramp' || type === 'camera') {
    // Physical console pushbuttons
    ctx.strokeStyle = '#5a7888'; ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 250, 174);
    ctx.fillStyle = type === 'ramp' ? '#18423d' : '#1b324d';
    ctx.fillRect(6, 6, 244, 168);
    ctx.fillStyle = type === 'ramp' ? '#7ee2c8' : '#8ac8ff';
    ctx.font = 'bold 26px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(type === 'ramp' ? 'RAMP' : 'CAM', 128, 80);
    ctx.font = '14px Courier, monospace';
    ctx.fillText(type === 'ramp' ? '[HATCH CTRL]' : '[EXT VIEW]', 128, 120);
  } else if (type === 'stand') {
    // Seat release control
    ctx.strokeStyle = '#7a6642'; ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 250, 174);
    ctx.fillStyle = '#2d2416';
    ctx.fillRect(6, 6, 244, 168);
    ctx.fillStyle = '#f0b85d';
    ctx.font = 'bold 24px Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SEAT', 128, 75);
    ctx.font = '14px Courier, monospace';
    ctx.fillText('[STAND UP]', 128, 115);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}


// === PHYSICAL CARGO HOLD PALLETS & SHIP HEADLIGHTS ===


