function renderPanel(tab){

  if(tab==='hangarTerminal'){
    $('content').innerHTML = `
      <div class="eyebrow">OPERAÇÕES DE HANGAR</div>
      <h2>Terminal de Operações da Plataforma</h2>
      <p>Atlas é sua nave operacional de exploração estelar e o Rover é seu veículo terrestre de superfície.</p>
      
      <div style="margin: 16px 0;">
        <h3 style="color:#7ee2c8;margin-bottom:8px;">1. Nave Oficial</h3>
        <div class="cards">
          <button class="card selected" onclick="terminalSelectShip(0)">
            <small>POUSADA NA PLATAFORMA</small>
            <strong>${shipTypes[0].name}</strong>
            <span>${layouts[0].desc} · Capacidade: ${shipTypes[0].cap}</span>
          </button>
        </div>
      </div>

      <div style="margin: 16px 0;">
        <h3 style="color:#7ee2c8;margin-bottom:8px;">2. Veículo de Superfície</h3>
        <div class="cards">
          <button class="card selected" onclick="terminalSelectVehicle('rover')">
            <small>EMBARCADO NA GARAGEM</small>
            <strong>Rover de Exploração</strong>
            <span>75 m/s · Veículo de exploração planetária pesado</span>
          </button>
        </div>
      </div>
      <button class="primary" onclick="closeMenu()" style="margin-top: 14px;">CONCLUIR OPERAÇÃO</button>
    `;
    return;
  }

  if(tab==='locker'){const valid=activeLocker&&inside;if(!valid){renderPanelV04('inventory');return;}$('content').innerHTML='<div class="eyebrow">COMPARTIMENTO DA NAVE</div><h2>Transferir suprimentos</h2><p>O armário acompanha sua frota. Munição é transferida em lotes de até 12; os outros itens, uma unidade por vez.</p><div class="cards">'+['ammo','grenades','medkits'].map((key,i)=>`<div class="card"><strong>${['Munição','Granadas','Kits médicos'][i]}</strong><p>Inventário: ${equipment[key]} · Armário: ${locker[key]}</p><button onclick="transferItem('${key}','store')">Guardar →</button> <button onclick="transferItem('${key}','take')">← Retirar</button></div>`).join('')+'</div>';return;}renderPanelV04(tab);if(tab==='inventory')$('content').innerHTML+=`<h3>Roupas e jetpack</h3><p>Jetpack estágio ${jetLevel} · ${jetCapacity()} unidades · aprimoramentos nas oficinas.</p><div class="cards">${ownedOutfits.map(id=>`<button class="card ${outfit===id?'selected':''}" onclick="equipOutfit('${id}')"><strong>${{explorer:'Explorador',ranger:'Patrulheiro',engineer:'Engenheiro',arctic:'Polar',night:'Noturno'}[id]}</strong><span>${outfit===id?'EM USO':'VESTIR'}</span></button>`).join('')}</div>`;if(tab==='settings')$('content').innerHTML+=`<details open><summary>Novos controles · SkyWard ${VERSION}</summary><p>Espaço: pular. Segure no ar para usar o jetpack; solte para economizar combustível. Recarrega ao tocar o chão.<br>V: primeira/terceira pessoa, a pé, na nave e no veículo. E: portas internas, cama, bancos e compartimentos. E ou pulo: levantar.<br>No celular, use duplo toque segurado para pular; mantenha até começar a cair para ativar o jetpack. A câmera em 1ª/3ª pessoa está na tira superior esquerda. As oficinas melhoram o jetpack; as lojas de roupas personalizam seu traje.<br>LOD automático dos planetas e redução dos detalhes de cidades e habitantes à distância.</p></details>`;if(tab==='map')return;}
