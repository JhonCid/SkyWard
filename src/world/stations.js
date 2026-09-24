function stationCity(parent,p){const tint=p?p.def[5]:0x96c8d5,variation=p?p.i:parent.position.x>SEP/2?7:6;parent.userData.city=true;parent.userData.half=V(80,0,70);box(parent,0,-1.5,0,160,3,140,0x304451);box(parent,0,.05,0,42,.1,125,0x465b64);box(parent,0,.15,0,24,.2,32,0x78938c);
  // Physical Hangar & Shipyard Terminal beside the landing pad
  const termGroup = new THREE.Group();
  termGroup.position.set(32.0, 0.15, 0);
  termGroup.userData.hangarTerminal = true;
  termGroup.name = 'hangarTerminal';
  parent.add(termGroup);
  box(termGroup, 0, 0.65, 0, 0.75, 1.30, 0.75, 0x1a2632);
  box(termGroup, 0, 1.38, 0, 0.85, 0.22, 0.85, 0x243746);
  const termScreen = mesh(new THREE.PlaneGeometry(0.65, 0.42), mat(0x42f5d7, 2.0), termGroup, 0, 1.70, 0.05);
  termScreen.rotation.x = -0.35;
  termScreen.userData.noCollision = true;
  for(const side of [-1,1]){box(parent,side*27,.13,0,9,.26,125,0x819394);for(let z=-59;z<=60;z+=7)box(parent,side*12,.12,z,.18,.08,2.3,mat(0xd2c990,.6));}
for(let j=0;j<6;j++)buildStore(parent,p,j,variation);
// Open plaza and canopied market stalls; enough clearance for a rover.
for(let z of [-52,52]){box(parent,0,.15,z,17,.3,13,0x6e8587);for(let x of [-6,6]){mesh(new THREE.CylinderGeometry(.16,.2,4.5,10),0x526c79,parent,x,2.3,z);box(parent,x,1,z,3,1.7,2,0xb79a71);}box(parent,0,4.6,z,17,.25,6,tint);label3D(parent,z<0?'CONTRATOS':'SERVIÇOS',0,3.7,z+3.1,10);}
for(let side of [-1,1])for(let z=-56;z<=56;z+=28){mesh(new THREE.CylinderGeometry(.17,.28,7,10),0x375361,parent,side*21,3.5,z);box(parent,side*21,7,z,3,.2,1,mat(tint,1.8));box(parent,side*31, .55,z+5,4,1,2,0x596d65);mesh(new THREE.IcosahedronGeometry(1.2,1),0x497f6f,parent,side*31,1.7,z+5);}
// Sloped exits connect the flat city deck to the curved terrain.
for(const side of [-1,1]){const ramp=box(parent,0,-2,side*77,22,.4,18,0x5d777c);ramp.rotation.x=side*.21;}
const roles=['Lia · logística','Orion · geólogo','Nara · pesquisadora','Ivo · recuperação','Maia · resgate','Bento · manutenção'];for(let j=0;j<12;j++){const role=j%6,x=j<6?-17:17,z=-45+role*18,g=person(parent,x,z,[0xd3ab73,0xb8bd85,0x78b8af,0x739bbb,0xc18478,0xb2a5c6][role]);const n={g,base:g.position.clone(),name:roles[role],role,phase:j,path:[V(x,.15,z),V(x,.15,z+7),V(x+(j<6?4:-4),.15,z+7),V(x+(j<6?4:-4),.15,z)],way:1,wait:0,city:parent};g.userData.actor=true;npcs.push(n);}
parent.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}

function talk(n){if(n.shop){openShop(n.shop.id);return;}document.body.classList.add('in-menu');clearInput();document.exitPointerLock?.();$('panel').classList.remove('hidden');const lines=['Suprimentos precisam chegar aos portos. O porão tem espaço?','Nossos laboratórios estudam a atmosfera e biosfera local.','Precisamos catalogar a fauna dos mundos vizinhos.','Há equipamentos à deriva perto da estação. Você pode recuperá-los?','Um explorador ficou isolado fora da cidade. Traga-o em segurança.','Três torres precisam de reparo. Leve sua ferramenta de campo.'];$('content').innerHTML=`<div class="eyebrow">${n.city===planets[0].city?'VÉRDEA':'REDE CIVIL'} · HABITANTE</div><h2>${n.name}</h2><p>${lines[n.role]}</p><button class="primary" onclick="accept('${['cargo','scan','scan','salvage','rescue','repair'][n.role]}')">ACEITAR TRABALHO</button> <button onclick="menu('jobs')">VER TODOS OS CONTRATOS</button>`;}

