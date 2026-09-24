# SkyWard — instruções de manutenção

1. Edite os fontes em `src/`; os HTMLs são gerados. Leia `docs/MAPA.md` para localizar o sistema solicitado.
2. Pesquise símbolos com `node tools/find.js nomeDaFuncao`. Leia apenas os arquivos relevantes e suas dependências.
3. Não carregue `src/generated/atlas_asset.js`, `src/generated/characters.js`, `src/shell/three.min.js`, os HTMLs completos ou `archive/` no contexto para editar lógica.
4. O build concatena `src/manifest.json` em ordem num único escopo. Preserve a ordem: há inicialização com efeitos e declarações compartilhadas. Não transforme arquivos isolados em ES modules/IIFEs.
5. `src/core/` contém regras sem Three.js/DOM. Novas regras numéricas devem preferir parâmetros e resultados simples, sem renderização. Dados de conteúdo ficam em `src/data/`.
6. Sistemas atuais ainda compartilham estado. Antes de renomear um símbolo, pesquise todas as referências, inclusive `window.*` e os handlers de `src/shell/head.html`.
7. Preserve controles, interface, escala, saves e mecânicas fora da alteração pedida. Não recrie modelos procedurais para substituir a Atlas.
8. Para alterar a nave, leia `src/ship/atlas.js` e `docs/ATLAS.md`. Não edite a geometria base64 à mão. O importador atual é específico desta Atlas, não universal.
9. Altere a versão somente em `src/runtime/player_world_state.js`. Execute `node build.js` OU `python build.py`: ambos geram `SkyWard.html` e o HTML versionado.
10. Execute `node tests/run_all_tests.js`. Verifique visualmente no navegador as interações afetadas, quando tiver acesso. Declare limitações de testes.
11. `node tests/refactor_equivalence.js` audita exclusivamente esta reorganização v0.2.0. Alterações futuras de gameplay vão divergir do hash histórico; não atualize esse hash para esconder mudanças.
12. Entregue o HTML gerado e o ZIP do projeto atualizado. Descreva brevemente o que mudou e o que foi testado.

Objetivo: continuar criando em HTML, com mudanças localizadas e regras progressivamente mais fáceis de portar. Esta estrutura não converte automaticamente o jogo para Godot.

Personagens v0.3.0: leia `docs/PERSONAGENS.md`. O controlador está em `src/player/character_rig.js` e a integração em `character_game.js`. Regenere assets com `tools/prepare_characters.py` e a demonstração com `node tools/build_character_preview.js`. Preserve o fallback e os GLBs originais.
