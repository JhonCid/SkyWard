function buildStore(parent,p,j,variation){const side=j%2?1:-1,x=side*53,z=-43+Math.floor(j/2)*42,type=storeSets[variation][j],def=storeDefs[type],g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=side<0?Math.PI/2:-Math.PI/2;parent.add(g);const s={id:shops.length,type,def,g,p,portKey:p?p.i:parent.position.x>SEP/2?7:6,entry:V(0,0,15)};shops.push(s);box(g,0,.04,0,27,.12,29,0x687e81);box(g,-13.5,2.75,0,.4,5.5,29,0x536a78);box(g,13.5,2.75,0,.4,5.5,29,0x536a78);box(g,0,2.75,-14.5,27,5.5,.4,0x526b77);for(const side of [-1,1]){box(g,side*8.15,2.65,14.5,10.7,5.3,.35,0x607784);box(g,side*7.4,2.5,14.72,6,2.7,.08,new THREE.MeshStandardMaterial({color:0x759fba,transparent:true,opacity:.35}));}box(g,0,5.6,0,28,.25,30,0x708994);const upper=box(g,0,8.5+(j%2)*1.5,0,26,5+(j%2)*3,28,0x566c79);for(let i=-9;i<=9;i+=4.5)box(g,i,8,14.1,2,1.6,.08,mat(def.color,.3));box(g,0,5.1,14.7,7,.8,.5,def.color);label3D(g,def.name,0,6.25,15.2,20);for(const side of [-1,1])box(g,side*2.6,2.6,14.3,.15,5.2,.2,mat(def.color,.8));
box(g,0,.65,-5.5,8,1.3,1.4,0x435d6c);box(g,0,1.36,-5.5,8.2,.12,1.6,0x9ab0ac);box(g,2.5,1.64,-5.5,1,.5,.1,mat(0x7cd5c5,.6));for(let side of [-1,1]){box(g,side*10,1.8,-5,2.5,3.6,12,0x425b69);for(let z=-9;z<=0;z+=3)for(let y of [1,2.3])box(g,side*9.5,y,z,1.6,.6,1.3,def.color);box(g,side*6,5.25,3,.4,.15,9,mat(0xd1eedc,1.2));}
const display=new THREE.Group();display.position.set(7,1.3,6);g.add(display);box(g,7,.6,6,5,1.2,5,0x546c75);if(type==='ships'){fighterModel(display,false);display.scale.setScalar(.35);}else if(type==='vehicles'){ellipsoid(display,0,.5,0,1.5,.5,2,def.color);for(let a of [-1,1])for(let b of [-1,1])mesh(new THREE.CylinderGeometry(.45,.45,.3,12),0x27383f,display,a*1.4,.2,b*1.3).rotation.z=Math.PI/2;}else if(type==='ranged'||type==='melee'||type==='explosives'){makeWeapon(display,type==='ranged'?'rifle':type==='melee'?'sabre':'grenade');display.scale.setScalar(2);display.rotation.z=.2;}else{mesh(new THREE.OctahedronGeometry(1,1),mat(def.color,.5),display,0,.7,0);}label3D(g,type==='jobs'?'E · CONTRATOS':'E · FALAR COM ATENDENTE',0,3.7,-13.8,13);
const clerk=person(g,0,-7.8,def.color),names=['Clara','Raul','Elisa','Davi','Mila','Theo'];s.clerk=clerk;npcs.push({g:clerk,base:clerk.position.clone(),name:names[j]+' · '+def.short,role:0,phase:j,city:g,shop:s,path:[clerk.position.clone()],way:0,wait:Infinity});g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}
function openShop(id){const s=shops[id];if(!s)return;if(controlledPosition().distanceTo(s.clerk.getWorldPosition(V()))>5){toast('Aproxime-se do atendente para negociar.');return;}activeShop=id;menu(s.type==='jobs'?'jobs':'shop');}
function buyProduct(id){if(id.startsWith('outfit_')||id==='jet1'||id==='jet2')return buyV05(id);const s=shops[activeShop],product=products[id];if(!s||!product||!s.def.items.includes(id)||controlledPosition().distanceTo(s.clerk.getWorldPosition(V()))>5){toast('Fale com o atendente da loja correspondente.');return;}if(['rifle','shotgun','sabre'].includes(id)&&equipment.weapons.includes(id)||id.startsWith('ship')&&equipment.ships.includes(Number(id.slice(4)))||['scout','hauler','skiff','cutter'].includes(id)&&equipment.vehicles.includes(id)){toast('Você já possui este item.');return;}if(credits<product[1]){toast('Créditos insuficientes.');return;}credits-=product[1];if(['rifle','shotgun','sabre'].includes(id))equipment.weapons.push(id);if(id==='ammo')equipment.ammo+=72;if(id==='grenades')equipment.grenades+=3;if(id==='medkits')equipment.medkits+=2;if(id==='heal'){health=100;suitShield=50;}if(id==='repair'){hull=shipMaxHull();shipShield=140;vehicleHealth=vehicleKind==='hauler'?240:vehicleKind==='scout'?100:150;}if(id.startsWith('ship'))equipment.ships.push(Number(id.slice(4)));if(['scout','hauler','skiff','cutter'].includes(id))equipment.vehicles.push(id);save();toast(product[0]+' adquirido.');renderPanel('shop');}
function equipWeaponBase(id){
  if(id==='grenade'&&equipment.grenades<1){
    toast('Granadas esgotadas.');
    return;
  }
  if(id!=='grenade'&&id!=='tool'&&id!=='unarmed'&&!equipment.weapons.includes(id)){
    toast('Esse equipamento ainda não foi adquirido.');
    return;
  }
  if(!weaponDefs[id])return;
  equipped=id;
  reloadUntil=0;
  rebuildWeapon();
  if(!$('panel').classList.contains('hidden'))renderPanel('inventory');
}

