function handleMapShipClick() {
  if (target === 'ship') {
    target = -1;
    toast('Marcação da nave no HUD desativada.');
  } else {
    target = 'ship';
    toast('Marcação no HUD ativada: Nave Atlas');
  }
  renderPanel('map');
}
window.handleMapShipClick = handleMapShipClick;

function showMapShipTooltip() {
  const tip = $('mapTooltip');
  if (!tip) return;
  const dist = ship.position.distanceTo(controlledPosition());
  tip.innerHTML = `<strong>Sua Nave · Cargueiro Atlas</strong><p>${(dist >= 1000 ? (dist/1000).toFixed(1)+' km' : Math.round(dist)+' m')} de distância · Clique para marcar no HUD</p>`;
  tip.style.opacity = '1';
}
window.showMapShipTooltip = showMapShipTooltip;

window.loadEquipment = loadEquipment;

// === INTERACTIVE 3D PLANET MAP VIEW & SETTLEMENT SELECTOR ===
