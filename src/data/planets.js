const starPalettes = [
  { core: [8, 6, 3], color: 0xffefdc, halo1: 'rgba(255,255,225,1)', halo2: 'rgba(255,229,144,.8)', halo3: 'rgba(255,174,77,.25)', halo4: 'rgba(255,154,67,0)', size: 1000 },
  { core: [3, 6, 8], color: 0xaadeff, halo1: 'rgba(225,245,255,1)', halo2: 'rgba(144,210,255,.8)', halo3: 'rgba(77,150,255,.25)', halo4: 'rgba(67,110,255,0)', size: 1200 },
  { core: [8, 2, 1], color: 0xff8a65, halo1: 'rgba(255,230,225,1)', halo2: 'rgba(255,144,110,.8)', halo3: 'rgba(255,90,77,.25)', halo4: 'rgba(255,60,67,0)', size: 900 },
  { core: [8, 8, 8], color: 0xf5f8ff, halo1: 'rgba(255,255,255,1)', halo2: 'rgba(230,240,255,.8)', halo3: 'rgba(180,210,255,.25)', halo4: 'rgba(150,180,255,0)', size: 1100 },
  { core: [8, 4, 1], color: 0xffb74d, halo1: 'rgba(255,245,225,1)', halo2: 'rgba(255,190,110,.8)', halo3: 'rgba(255,130,50,.25)', halo4: 'rgba(255,90,30,0)', size: 1050 },
  { core: [2, 7, 8], color: 0x80deea, halo1: 'rgba(225,255,255,1)', halo2: 'rgba(110,240,255,.8)', halo3: 'rgba(50,200,220,.25)', halo4: 'rgba(30,150,180,0)', size: 1000 }
];

const planetNameList = [
  'KRYOS', 'OBSIDIA', 'PYROS', 'ZEPHYR', 'AQUARIA', 'TARTARUS', 'VERDANTIA',
  'AETHEL', 'KORALIS', 'SYLVIA', 'GLACIES', 'TERRENO', 'VOLCANIS', 'NEBULIS',
  'XANTHOS', 'CYANEA', 'RHODOS', 'CHRONOS', 'BOREALIS', 'AUSTRALIS', 'CALIDUS',
  'LUMINA', 'UMBRALIS', 'ARGENTIA', 'SOLARIA', 'THALASSIS', 'ORPHEUS', 'HESTIA',
  'AURA', 'VANGUARDA', 'OÁSIS', 'MINERVA', 'CRISTALIS', 'NÊMESIS', 'ATENA'
];

const biomePool = [
  { b1: 'Floresta turquesa', b2: 'Pradaria âmbar', c1: 0x287d75, c2: 0xb1a65d, acc: 0x62d6cc, fauna: 'Cervídeo de vela', theme: 0, wet: true },
  { b1: 'Dunas vermelhas', b2: 'Mesetas de obsidiana', c1: 0xb45c40, c2: 0x353849, acc: 0xe49b6e, fauna: 'Escaravelho de pedra', theme: 1, wet: false },
  { b1: 'Geleiras azuis', b2: 'Bosque de cristais', c1: 0xadcddd, c2: 0x64789e, acc: 0x9fd9ff, fauna: 'Raposa de gelo', theme: 2, wet: true },
  { b1: 'Floresta de fungos', b2: 'Pântano violeta', c1: 0x715488, c2: 0x303e64, acc: 0xc69be7, fauna: 'Saltador esporado', theme: 3, wet: true },
  { b1: 'Deserto dourado', b2: 'Cânions coral', c1: 0xcbad61, c2: 0xb35d68, acc: 0xf8d392, fauna: 'Lagarto solar', theme: 4, wet: true },
  { b1: 'Campos de basalto', b2: 'Jardins bioluminescentes', c1: 0x373b49, c2: 0x287377, acc: 0x73ddd9, fauna: 'Aracnídeo de luz', theme: 5, wet: true },
  { b1: 'Savana rubra', b2: 'Lagos de safira', c1: 0x99483b, c2: 0x3e6587, acc: 0x5fa8d3, fauna: 'Antílope da névoa', theme: 0, wet: true },
  { b1: 'Estepes cinzentas', b2: 'Planaltos de enxofre', c1: 0x7a8274, c2: 0xa3984d, acc: 0xd4ca72, fauna: 'Couraçado de quartzo', theme: 1, wet: false },
  { b1: 'Cordilheiras de ferro', b2: 'Vales cristalinos', c1: 0x554d5e, c2: 0x7a6b8a, acc: 0xb6a4cc, fauna: 'Dríade de ametista', theme: 2, wet: false },
  { b1: 'Planícies fósforas', b2: 'Fendas abissais', c1: 0x3b6661, c2: 0x244247, acc: 0x53d6ba, fauna: 'Serpente da areia', theme: 3, wet: true },
  { b1: 'Cânions esmeralda', b2: 'Tundra boreal', c1: 0x3c7e62, c2: 0x588899, acc: 0x7cd1b0, fauna: 'Mastodonte plumado', theme: 4, wet: true },
  { b1: 'Selva prismática', b2: 'Picos nevados', c1: 0x2e7560, c2: 0x8a9faa, acc: 0x65e09f, fauna: 'Gavião auroral', theme: 5, wet: true }
];

// === V0.1.2 SCALED PLANETARY SYSTEM WITH GAS GIANTS & MOONS ===
// Radii are dramatically larger (5000m - 10500m for rocky planets, 22000m for gas giants, 1400m for moons)
const defs=[['VÉRDEA','Floresta turquesa','Pradaria âmbar',0x287d75,0xb1a65d,0x62d6cc,'Cervídeo de vela',730,0,true],['FERRUM','Dunas vermelhas','Mesetas de obsidiana',0xb45c40,0x353849,0xe49b6e,'Escaravelho de pedra',640,1,false],['NÍVEA','Geleiras azuis','Bosque de cristais',0xadcddd,0x64789e,0x9fd9ff,'Raposa de gelo',680,2,true],['MYCELIA','Floresta de fungos','Pântano violeta',0x715488,0x303e64,0xc69be7,'Saltador esporado',800,3,true],['AUREA','Deserto dourado','Cânions coral',0xcbad61,0xb35d68,0xf8d392,'Lagarto solar',620,4,true],['UMBRA','Campos de basalto','Jardins bioluminescentes',0x373b49,0x287377,0x73ddd9,'Aracnídeo de luz',750,5,true]];

