let shipHeadlightsActive = false;
let shipHeadlightL = null, shipHeadlightR = null, roverHeadlight = null;
const shipExteriorLights = [];
const shipCommodities = { ore_raw: 0, metals_refined: 0, bioproducts: 0, water_fresh: 0, fuel_cells: 0, hyper_crystals: 0, machinery: 0, medical_supplies: 0 };
const reputation = { cmi: 0, gcu: 0, snyx: 0 };
let miningLaserActive = false;
let miningLaserTarget = null;

let shipCargoGroup = null;

let headlightMode = 'auto'; // 'auto' | 'on' | 'off'

function updateHeadlightsState() {
  let shouldBeOn = false;
  if (headlightMode === 'on') {
    shouldBeOn = true;
  } else if (headlightMode === 'off') {
    shouldBeOn = false;
  } else {
    // 'auto' mode: turns on when dark (night or deep shadows), turns off in daylight
    if (typeof daylight === 'function' && typeof atmosphereAt === 'function') {
      const { p, density } = atmosphereAt(camera.position);
      const d = daylight(p, camera.position);
      const isDark = (d && d.day < 0.28) || (density < 0.05 && (!d || d.elevation < 0));
      shouldBeOn = isDark;
    }
  }

  shipHeadlightsActive = shouldBeOn;
  const spotIntensity = shouldBeOn ? 16.0 : 0;
  if (shipHeadlightL) shipHeadlightL.intensity = spotIntensity;
  if (shipHeadlightR) shipHeadlightR.intensity = spotIntensity;
  if (roverHeadlight) roverHeadlight.intensity = shouldBeOn ? 8.0 : 0;

  for (const item of shipExteriorLights) {
    if (item.light) item.light.intensity = shouldBeOn ? item.onIntensity : 0;
    if (item.material) item.material.emissiveIntensity = shouldBeOn ? (item.onEmissive || 1.8) : 0.05;
  }
}

function cycleHeadlightMode() {
  if (headlightMode === 'auto') headlightMode = 'on';
  else if (headlightMode === 'on') headlightMode = 'off';
  else headlightMode = 'auto';

  updateHeadlightsState();

  if (typeof cockpit3DButtons !== 'undefined') {
    const btn = cockpit3DButtons.find(b => b.userData?.action === 'lights');
    if (btn) {
      btn.userData.label = 'FARÓIS EXTERNOS: ' + headlightMode.toUpperCase() + ' [CLIQUE]';
      if (typeof makeMfdTelemetryTexture === 'function') {
        btn.material.map = makeMfdTelemetryTexture('lights');
        btn.material.emissiveMap = btn.material.map;
        btn.material.needsUpdate = true;
      }
    }
  }
  const modeText = headlightMode === 'auto' ? 'AUTOMÁTICO (liga no escuro / desliga no claro)' : headlightMode === 'on' ? 'LIGADO' : 'DESLIGADO';
  toast('Faróis da nave: ' + modeText);
}
window.cycleHeadlightMode = cycleHeadlightMode;
window.getHeadlightMode = () => headlightMode;
window.setHeadlightMode = (m) => { headlightMode = m; updateHeadlightsState(); };
