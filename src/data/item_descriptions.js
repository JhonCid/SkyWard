const itemDescriptions = {
  pistol: {
    name: 'Pistola Tática Apex-9',
    type: 'Armamento Balístico Semiautomático',
    mfg: 'AeroDynamics Defence Corp. · Setor Nyx',
    lore: 'Padronizada pelas forças de segurança da estação orbital após a repressão aos piratas do Cinturão de Éos no Tratado de 2019. Reconhecida por sua robustez e confiabilidade mecânica em qualquer atmosfera.',
    usage: 'Saque rápido para combate pessoal a curta e média distância. Carregador de 15 tiros.'
  },
  rifle: {
    name: 'Fuzil de Batalha Tempest-X',
    type: 'Fuzil de Assalto Militar Bullpup',
    mfg: 'Armadas Terrestres Unidas (ATU)',
    lore: 'Projetado para tropas coloniais que enfrentavam tempestades de areia silicosa e atmosferas de alta pressão em Caelum. Seu cano de liga titânio-cromo impede superaquecimento em combates prolongados.',
    usage: 'Disparo automático contínuo de alta cadência e precisão em longo alcance. Carregador de 30 tiros.'
  },
  shotgun: {
    name: 'Escopeta Pesada Havoc-12',
    type: 'Arma de Dispersão de Alto Calibre',
    mfg: 'Vulkan Heavy Industries',
    lore: 'Originalmente desenvolvida para equipes de desbravamento que precisavam repelir espécimes gigantes da fauna agressiva de Vérdea. Seu estampido é lendário entre mercenários da fronteira.',
    usage: 'Dispersão de múltiplos balotes com poder de impacto devastador em confrontos corpo a corpo. Carregador de 8 cartuchos.'
  },
  blade: {
    name: 'Tanto Tático Vibro-Edge',
    type: 'Arma Branca Vibratória de Alta Frequência',
    mfg: 'Divisão de Operações Especiais de Mycelia',
    lore: 'Lâmina chanfrada forjada em compósito de titânio-carbono com ressonador piezoelétrico integrado no cabo, cortando blindagens sintéticas com facilidade cirúrgica.',
    usage: 'Ataque corpo a corpo silencioso e veloz. Golpeia em arcos rápidos na mão direita.'
  },
  sabre: {
    name: 'Sabre de Plasma Nyx',
    type: 'Lâmina de Confinamento Térmico Quântico',
    mfg: 'Ordem dos Navegadores de Éos',
    lore: 'Arma cerimonial e de combate tradicional dos primeiros pilotos de escolta que defendiam os arcos hiperespaciais. O campo magnético contido alcança 4.000 °C.',
    usage: 'Lâmina contínua de plasma de longo alcance com grande poder de corte e dano térmico concentrado.'
  },
  grenade: {
    name: 'Granada de Plasma Mk-IV',
    type: 'Ordinança de Fragmentação Térmica',
    mfg: 'Consórcio de Mineração Interplanetária (CMI)',
    lore: 'Adaptada a partir de cargas de demolição subterrânea utilizadas para abrir túneis nos asteroides de Ferrum. A explosão consome oxigênio e estilhaça estruturas leves.',
    usage: 'Arremesso balístico com raio letal de 8 metros. Segure a mira para pré-visualizar o arco da trajetória.'
  },
  unarmed: {
    name: 'Combate Desarmado (Punhos)',
    type: 'Defesa Pessoal & Combate Desarmado',
    mfg: 'Treinamento Básico de Sobrevivência',
    lore: 'Técnicas universais de autodefesa e combate corpo a corpo instintivo utilizadas por exploradores e tripulantes quando desprovidos de armamento convencional.',
    usage: 'Ataques rápidos com os punhos. A cada golpe, desfere socos alternados e aleatórios com a mão esquerda ou direita.'
  },
  tool: {
    name: 'Ruptor-7 Multi-Ferramenta de Campo',
    type: 'Scanner Científico & Extrator Térmico',
    mfg: 'Consórcio de Mineração Interplanetária (CMI)',
    lore: 'Item obrigatório em todas as naves da frota civil. Criada após o incidente das minas de Ferrum, seu feixe frio de indução térmica permite fraturar rochas ricas em minérios sem risco de ignição de gases subterrâneos.',
    usage: '• Mineração: Aponte e dispare contra cristais de minério para fraturá-los (+55 CR e reputação CMI).\n• Ciência: Aponte em terreno aberto ou animais para catalogar a fauna planetária e cumprir contratos.\n• Não emite projéteis balísticos.'
  },
  ammo: {
    name: 'Cartuchos Balísticos & Baterias Universais',
    type: 'Munição Padrão de Expedição',
    mfg: 'Federação Comercial de Éos',
    lore: 'Padrão unificado de suprimentos adotado em todos os postos de reabastecimento para garantir interoperabilidade total.',
    usage: 'Munição reserva que abastece fuzis, pistolas e escopetas. Pressione R a pé para recarregar a arma ativa.'
  },
  medkits: {
    name: 'Nanokit Médico Reanimador',
    type: 'Injetor Nanotecnológico de Emergência',
    mfg: 'BioSynthetics Corporation',
    lore: 'Cápsula estéril pressurizada contendo nanorrobôs hemostáticos que reparam tecidos e reinicializam os biossensores do traje.',
    usage: 'Restaura imediatamente 40 pontos de vida e reativa escudos do traje. Pressione C a pé para usar.'
  }
};

