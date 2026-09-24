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

# Estado da entrega v0.3.2

Concluída sobre SkyWard-v0.3.1-cabecas.zip. Não retomar a versão N7.
Leia GEMINI.md, LEIA-ME.md, ARCHITECTURE.md, docs/MAPA.md e docs/VALIDACAO.md.

Jogador: source/Tripo-Explorer-original.glb → tools/prepare_tripo_player.py → player_lod0.
Rig e biblioteca UAL compartilhados; 46.448 triângulos, 65 ossos, 85 clipes. NPCs idênticos à base.
Correção de fidelidade: sem QEM/redução, normais suaves originais e cores por vértice sem quantização. Preservar mapeamento anatômico e pesos originais.

Comandos e explicações: docs/TRIPO-v0.3.2.md. Todos os testes automatizados passaram.
Próxima validação humana útil: abrir SkyWard-v0.3.2.html e experimentar mira, espada, jetpack,
rover e controle em gravidade local. Não houve WebGL interativo nem Blender nesta revisão.
O GLB convertido é atual; o .blend denominado anterior é histórico e não inclui o Tripo.
Não considerar que o script específico do Tripo seja um importador universal.
