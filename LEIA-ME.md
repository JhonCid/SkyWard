# Correção atual: proporções e cores

Pescoço corrigido alinhando o capacete ao pivô Head do rig UAL. Escala visual do jogador:
1,15 em largura/profundidade e 1,05 em altura, compensando o reposicionamento do capacete
para manter aproximadamente 1,80 m. NPCs e física permanecem iguais.
Traje cinza-escuro, juntas/luvas escuras, detalhes discretos e visor preto. 9.849 triângulos intactos.
Testes: RESULTADO-proporcoes.txt, suíte completa aprovada. Revisão visual em CPU;
sem validação interativa WebGL. Os registros abaixo são históricos.

# Modelo low poly atual

Jogador substituído por `source/Tripo-Lowpoly-original.glb` (futuristic armor 3d model.glb).
9.849 triângulos originais, sem redução; 54 ossos de origem adaptados ao rig UAL de 65 ossos.
Material claro original e visor escuro; sem texturas. NPCs e controles preservados.
Pipeline: tools/prepare_characters.py. Testes: tests/RESULTADO-lowpoly.txt.
Os registros anteriores descrevem modelos substituídos. Não houve teste interativo WebGL.

# SkyWard v0.3.2 — personagens rigados

Abra `SkyWard-v0.3.2.html` para jogar. Continua sendo um HTML autônomo e offline. `Personagens-v0.3.2.html` é a demonstração separada para conferir corpos, paletas, cabelos, animações, LOD, apoio em rampa e orientação da gravidade.

O jogador usa seu modelo original do Tripo, adaptado ao rig comum, sem redução: 46.448 triângulos originais, capacete fechado, visor preto e cores originais gravadas nos vértices, sem texturas de imagem, e sombreamento suave. Os NPCs usam corpos masculino/feminino, geralmente sem capacete, com nariz/orelhas simples e sem olhos/boca. Há variações de pele, cabelo, altura, largura, paleta e acessórios. Nenhum novo personagem usa textura de imagem.

O rig tem 65 ossos, com 84 movimentos e uma pose T compartilhados. Geometria e clipes são reutilizados; ossos e mixer são individuais. A integração inclui locomoção combinada por velocidade, transições, salto/queda/aterrissagem, natação, sentar/dirigir, interação e combate, com camada superior para mira/recarga e correções de pés/quadril/mão de apoio.

Em **Configurações → Personagens**, o botão alterna entre as novas animações e o sistema procedural anterior, salva e reinicia a página. A preferência é separada do formato de save existente.

## Nova versão v0.3.2

Base: `SkyWard-v0.3.1-cabecas.zip`, anterior à armadura N7. O jogador foi substituído; NPCs e clipes permanecem iguais aos dessa base. A conversão aproveita os pesos originais do Tripo, alinha braços/palmas por referências anatômicas e preserva integralmente os vértices e triângulos da fonte. Detalhes em `docs/TRIPO-v0.3.2.md`.

## Correções herdadas da v0.3.1

- Faces externas da cabeça/cabelo/casco corrigidas no gerador, com materiais de uma face.
- Placas mais finas, antebraços e botas remodelados; capacete com visor preto integrado, sem testa/queixo salientes. Jogador com volume muscular e largura moderadamente maiores.
- Correções de postura/IK deixam de acumular entre frames. Mira vertical usa os clipes de braços para cima/baixo, inclusive com jetpack.
- Disparo em terceira pessoa espera o personagem levantar e alinhar a arma. Um toque é preservado até completar essa preparação.
- Socos alternam jab/cruzado; espada alterna cortes A/B. Cada golpe termina antes do próximo. Som e dano usam marcadores de extensão do golpe.
- Granada reinicia a cada lançamento e usa apenas o tronco ao caminhar.
- Salto tem amplitude reduzida; jetpack usa uma pose aérea própria derivada dos clipes. Pequenas perdas de chão têm tolerância de 160 ms.
- Recuo usa a passada em reprodução reversa. Pelve alinhada à altura dos assentos; sem levantar após teletransporte de saída.

## Gerar e testar

```sh
node build.js
node tools/build_character_preview.js
node tests/run_all_tests.js
```

O build principal também funciona com `python build.py`. Não precisa de Blender, npm install ou internet para jogar ou reconstruir os HTMLs com os assets fornecidos.

Para regenerar os modelos/clipes: `python tools/prepare_characters.py` (dependências em `tools/requirements-characters.txt`). Para produzir o arquivo Blender editável: `blender --background --python tools/blender_characters.py`. O GLB atual está pronto; o `.blend` da v0.3.2 deve ser gerado com esse comando. `SkyWard-Characters-anterior.blend` é somente um snapshot antigo, não contém o novo jogador.

## Arquivos úteis

- `assets/characters/Explorer-Male.glb`: jogador e biblioteca compartilhada de animações.
- `assets/characters/NPC-Male.glb` e `NPC-Female.glb`: modelos com rig compatível.
- `assets/characters/catalog.json`: nomes e durações dos clipes.
- `assets/characters/report.json`: contagens exatas das malhas-base.
- `assets/characters/source/`: GLBs originais UAL/CC0, variantes `_RM` e o modelo Tripo fornecido pelo usuário (não abrangido pela licença UAL).
- `docs/character-review.png`: revisão atual de poses Three.js em CPU; não é captura WebGL.
- `docs/PERSONAGENS.md`: implementação e limitações.
- `docs/VALIDACAO.md`: testes executados e limites da validação.

Clipes de agachamento, escalada e outros gestos estão disponíveis na biblioteca/demonstração. Esta versão preserva os controles e a física anteriores; não acrescenta novas mecânicas físicas para cada clipe.

Para continuar com uma IA, envie o ZIP e peça para ler `GEMINI.md` e `docs/MAPA.md`. Não é necessário carregar os grandes arquivos gerados no contexto para editar lógica.
