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

# v0.3.2 — correção de fidelidade do Tripo

A pedido do usuário, a redução para 9.400 triângulos foi retirada.
O jogador agora preserva os 46.448 triângulos e 34.850 vértices da fonte, sem decimação,
sem solda, sem transferência aproximada de pesos e sem achatamento da sola.
A pose de referência é adaptada ao rig UAL com os mesmos referenciais anatômicos de braços/palmas.
Os pesos originais são remapeados por nomes, mantendo quatro influências normalizadas.

As normais suaves originais são transformadas pela inversa transposta de cada transformação
ponderada, em vez de substituídas por normais planas de cada triângulo.
A cor original é amostrada bilinearmente nos UVs originais, convertida de sRGB para linear
e gravada nos vértices, sem a antiga separação artificial em materiais/manchas.
O visor continua preto conforme solicitado anteriormente.
Não há textura de imagem no runtime nem no GLB exportado. Detalhes de textura menores
que os triângulos podem ficar menos nítidos que no Tripo; a geometria está integralmente preservada.

A prioridade atual de fidelidade substitui o antigo orçamento de 10 mil triângulos do jogador.
NPCs continuam com os mesmos modelos, paletas, clipes e LODs da base v0.3.1-cabecas.

## Reproduzir

```sh
python -m pip install -r tools/requirements-characters.txt
python tools/prepare_characters.py
node tools/build_character_preview.js
node build.js
node tests/run_all_tests.js
```

Para Blender: `blender --background --python tools/blender_characters.py`.
O script preserva o sombreamento suave do jogador e flat shading dos NPCs.
O snapshot .blend anterior permanece histórico; não foi regenerado neste ambiente.

Origem: `assets/characters/source/Tripo-Explorer-original.glb` fornecido pelo usuário.
SHA256 `91fd73b3d169a183ec338e36556e5728f7e788aee6b9ce7b009ce04f6a899973`.
Base: `SkyWard-v0.3.1-cabecas.zip`, anterior à armadura N7.
SHA256 `2d73e3cd74f0c570bc00b4b323b67838fe5a3f34362913498d44f889e0da06c7`.
Os termos CC0 da UAL não atribuem licença ao modelo Tripo.

`tripo-conversion.json` registra a conversão atual; `base-audit.json` verifica a preservação dos NPCs/rig/clipes.
