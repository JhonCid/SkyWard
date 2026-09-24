# Correção atual: proporções e cores

Pescoço corrigido alinhando o capacete ao pivô Head do rig UAL. Escala visual do jogador:
1,15 em largura/profundidade e 1,05 em altura, compensando o reposicionamento do capacete
para manter aproximadamente 1,80 m. NPCs e física permanecem iguais.
Traje cinza-escuro, juntas/luvas escuras, detalhes discretos e visor preto. 9.849 triângulos intactos.
Testes: RESULTADO-proporcoes.txt, suíte completa aprovada. Revisão visual em CPU;
sem validação interativa WebGL. Os registros abaixo são históricos.

Correção do skin: quase toda a malha original estava vinculada à pelve. Pesos reconstruídos por projeção baricêntrica na superfície do traje anterior alinhado aos novos ossos; geometria preservada. Registro em assets/characters/skin-repair.json. Testes automatizados aprovados.

# Modelo low poly atual

Jogador substituído por `source/Tripo-Lowpoly-original.glb` (futuristic armor 3d model.glb).
9.849 triângulos originais, sem redução; 54 ossos de origem adaptados ao rig UAL de 65 ossos.
Material claro original e visor escuro; sem texturas. NPCs e controles preservados.
Pipeline: tools/prepare_characters.py. Testes: tests/RESULTADO-lowpoly.txt.
Os registros anteriores descrevem modelos substituídos. Não houve teste interativo WebGL.

# Correção de fidelidade — v0.3.2

Validação atual: `tests/RESULTADO-v0.3.2-fiel.txt` — suíte completa aprovada.
Preservados os 46.448 triângulos originais, pesos remapeados diretamente, cores por vértice
sem quantização e normais suaves. Testes confirmam os atributos de cor, material suave,
normalização das normais, 510 amostras de animação e 60 verificações de luva/palma.
As verificações de combate, Atlas e rover passaram. Os limites de geometria dos NPCs permanecem.
A comparação com a base cabecas confirma NPCs, rig e clipes iguais.

Revisão visual atual: `character-review.png`, frente/costas em CPU com interpolação das normais
suaves e das cores dos vértices. Não é captura WebGL. A revisão interativa e desempenho GPU
continuam sem validação neste ambiente. A geometria original aumenta o custo do jogador.
Não foi executado Blender nesta revisão.

Os logs abaixo e as contagens de 9.400 triângulos referem-se à entrega reduzida anterior,
não ao jogador atual. Os JSONs intermediários de poses não são necessários para jogar;
podem ser regenerados com `node tests/character_assets.js --poses`.

---

# Validação — v0.3.2

## Executado nesta revisão

- `node build.js` e `node tools/build_character_preview.js`: jogo e demonstração offline, versão 0.3.2.
- `node tests/run_all_tests.js`: suíte completa aprovada; log `tests/RESULTADO-v0.3.2.txt`.
- Assets: 510 amostras de pose (85 clipes × 2 corpos × 3 instantes), pesos normalizados,
  vértices finitos, compartilhamento de recursos, rigs independentes e orçamentos dos LODs.
- Novo teste `tripo_player.js`: 9.400 triângulos, determinantes positivos dos referenciais,
  modelo Tripo exclusivo, ausência de texturas/materiais de dupla face e 60 verificações
  da luva visível perto da palma em dez animações e três instantes para as duas mãos.
- Regressões: 23.281 triângulos com normais consistentes; 24 segundos de mira sem deriva,
  mira vertical, camadas jetpack/mira, recuo, tolerância ao chão, assentos, saída imediata,
  lançamentos repetidos andando, socos/cortes alternados e som no marcador de impacto.
- Integração: mundo/NPCs, avatar reconstruído, armas na mão, LOD, imobilidade do estado físico
  durante animação; as 18 verificações de Atlas/rover/portas/rampa/pistões passaram.
- `SKYWARD_TEST_LEGACY=1 node tests/character_runtime_tests.js`: fallback carrega e se move;
  log `tests/FALLBACK-v0.3.2.txt`.
- Duas conversões consecutivas geraram `characters.js` idêntico por SHA-256;
  log `tests/REPRODUCIBILIDADE-v0.3.2.txt`.
- Comparação automática com `SkyWard-v0.3.1-cabecas.zip`: 12 variantes de NPCs,
  GLBs dos NPCs, rig e clipes idênticos. Só quatro fontes de runtime diferem:
  dados de personagens, paleta/escala do jogador e constante de versão. Registro em
  `assets/characters/base-audit.json`.
- Revisão visual de poses deformadas pelo Three.js em CPU com culling de faces:
  repouso, corrida, agachamento, direção, rover/Atlas, mira para cima/baixo,
  espada A/B, salto e jetpack. `docs/character-review.png` é uma seleção dessa revisão.

O antigo teste exigia que toda face da cabeça apontasse para fora de uma esfera imaginária.
Isso é inválido nas concavidades do nariz/orelhas/mandíbula da cabeça anatômica da base cabecas.
Agora verificamos normais contra o winding de cada face, ausência de faces degeneradas e
contribuição de volume exterior predominante nas cabeças/cabelos/capacetes. Não alteramos as
malhas dos NPCs para satisfazer um teste esférico, nem usamos DoubleSide para esconder inversões.

## Limitações desta entrega

Os testes de integração usam DOM/renderizador simulados e Three.js real para geometria/animação.
Não foi realizada sessão interativa WebGL nesta revisão; não havia Chromium disponível.
`tests/browser_characters.js` foi atualizado para 0.3.2 e pode ser executado com Playwright/Chromium.
Não afirmamos validação de desempenho GPU, toque, áudio real, todos os saves ou todas as
interseções em todos os frames. Física, câmeras, controles e formato de save foram preservados.

Blender não estava disponível; a tentativa de obter o binário oficial retornou HTTP 403.
Os scripts de Blender foram mantidos/ajustados, mas não executados nesta revisão. O snapshot
`SkyWard-Characters-anterior.blend` e logs antigos são históricos. O novo jogador está no GLB
editável/exportado e pode ser importado/regenerado com os scripts fornecidos.

`tests/refactor_equivalence.js` continua sendo auditoria histórica da v0.2.0. Seu hash não foi
alterado para esconder mudanças reais de conteúdo e ele não integra a suíte atual.
