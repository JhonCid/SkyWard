function animate(){requestAnimationFrame(animate);let dt=Math.min(.04,clock.getDelta());update(dt);renderer.render(scene,camera)}

// window.changeShip defined in 10_ui_and_menus_base.js

let gameLoadingStarted = false;
window.sandboxMode = false;
function startLoadingGame(isSandbox = false) {
  initAudio();
  window.sandboxMode = !!isSandbox;
  if (gameLoadingStarted) return;
  gameLoadingStarted = true;

  const startMenu = $('startMenu');
  const loadScreen = $('loadingScreen');
  if (startMenu) startMenu.classList.add('hidden');
  if (loadScreen) loadScreen.classList.remove('hidden');

  let cur = 0;
  const ring = $('loadingOrbitRing');
  const percentEl = $('loadPercent');
  const stepEl = $('loadStep');
  const ringCircumference = 590;

  function setRing(p, text) {
    if (ring) ring.style.strokeDashoffset = ringCircumference * (1 - p / 100);
    if (percentEl) percentEl.textContent = p + '%';
    if (stepEl && text) stepEl.textContent = text;
  }

  // Load star system and setup world on-demand
  bootV04();
  bootV06();
  loadControls();
  loadPerformance();
  loadSystem(currentSystem);
  const startPort = destinations.find(d => d.kind === 'planet' && d.p === planets[0]) || destinations.find(d => !d.gate && d.kind !== 'water') || destinations[0];
  if (startPort) {
    const pose = landingPose(startPort.pos, planets[0]);
    ship.position.copy(pose.pos);
    ship.quaternion.copy(pose.q);
  }
  groundPlanet = planets[0];
  landed = true;
  mode = 'foot';
  inside = true;
  openRamp(true, true);
  foot.copy(layout().spawn);
  player.copy(shipPoint(foot));
  yaw = Math.PI / 2;
  pitch = 0;
  camera.position.copy(player);
  initPlayerV05();

  const animInterval = setInterval(() => {
    cur += 5;
    if (cur <= 30) {
      setRing(cur, 'INICIALIZANDO MOTOR PROCEDURAL...');
    } else if (cur <= 70) {
      setRing(cur, 'GERANDO SISTEMA ESTELAR ÉOS...');
    } else if (cur < 100) {
      setRing(cur, 'CALIBRANDO CABINE DA NAVE NO PORTO...');
    } else {
      cur = 100;
      setRing(100, 'SISTEMA OPERACIONAL');
      clearInterval(animInterval);
      started = true;
      document.body.classList.remove('welcome');
      if (window.sandboxMode) {
        health = 99999;
        suitShield = 99999;
        hull = 99999;
        shipShield = 99999;
        vehicleHealth = 99999;
        credits = 99999999;
        jetLevel = 2;
        jetFuel = 99999;
        equipment.ammo = 99999;
        equipment.grenades = 99999;
        equipment.medkits = 99999;
        equipment.weapons = ['pistol', 'rifle', 'shotgun', 'blade', 'sabre', 'tool'];
        equipment.ships = [0, 1, 2];
        equipment.vehicles = ['rover', 'scout', 'hauler', 'skiff', 'cutter'];
        ownedOutfits = ['explorer', 'ranger', 'engineer', 'arctic', 'night'];
        toast('MODO SANDBOX ATIVADO · Recursos, equipamentos e naves ilimitados!');
      }
      initAudio();
      if (loadScreen) loadScreen.classList.add('hidden');
      $('hud').classList.remove('hidden');
      toast(touchEnabled ? 'Toque na direita: interagir · Toque duplo: atacar' : 'Caminhe até o cockpit para assumir os controles.');
    }
  }, 20);
}
window.startLoadingGame = startLoadingGame;
window.start = () => { startLoadingGame(); };

// Start 3D render loop immediately (renders background)
animate();
