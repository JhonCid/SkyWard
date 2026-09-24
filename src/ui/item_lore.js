let itemLoreHoldTimer = null;
function showItemLore(id) {
  const item = itemDescriptions[id];
  const box = $('itemLoreBox');
  if (!item || !box) return;
  box.innerHTML = `
    <div class="loreHeader">
      <div class="loreType">${item.type}</div>
      <div class="loreTitle">${item.name}</div>
      <div class="loreMfg">${item.mfg}</div>
    </div>
    <div class="loreUsage"><strong>UTILIDADE & OPERAÇÃO:</strong> ${item.usage.replace(/\n/g, '<br>')}</div>
    <div class="loreStory"><strong>ARQUIVO HISTÓRICO / LORE:</strong> ${item.lore}</div>
  `;
  box.classList.remove('hidden');
}

function hideItemLore() {
  const box = $('itemLoreBox');
  if (box) box.classList.add('hidden');
  if (itemLoreHoldTimer) { clearTimeout(itemLoreHoldTimer); itemLoreHoldTimer = null; }
}

function startItemLoreHold(id) {
  if (itemLoreHoldTimer) clearTimeout(itemLoreHoldTimer);
  itemLoreHoldTimer = setTimeout(() => {
    showItemLore(id);
  }, 280);
}

function endItemLoreHold() {
  if (itemLoreHoldTimer) { clearTimeout(itemLoreHoldTimer); itemLoreHoldTimer = null; }
}

window.showItemLore = showItemLore;
window.hideItemLore = hideItemLore;
window.startItemLoreHold = startItemLoreHold;
window.endItemLoreHold = endItemLoreHold;
window.itemDescriptions = itemDescriptions;

window.getGrenadeOriginAndVelocity = getGrenadeOriginAndVelocity;

