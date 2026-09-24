# Arquitetura — v0.3.1

## Personagens rigados

A v0.3.1 acrescenta `generated/characters.js`, `player/character_rig.js` e `player/character_game.js`, inicializados antes das entidades. O controlador também funciona na demonstração isolada com Three.js, sem o restante do jogo. Consulte `docs/PERSONAGENS.md` para contratos, caches, LOD e limitações. A organização-base abaixo vem da v0.2.0; a equivalência byte a byte daquela entrega não se aplica ao novo conteúdo.

## Fontes e execução

`src/manifest.json` é a lista ordenada dos arquivos ativos. Os builds concatenam esses arquivos, incorporam o Three.js local e usam `src/shell/head.html` e `tail.html` como estrutura da página. A distribuição continua sendo um HTML único.

A separação é por arquivos e responsabilidades. Os sistemas existentes ainda compartilham o escopo do script: esta versão não afirma isolamento completo nem usa um novo framework. Isso preserva declarações antecipadas, sobrescritas de funções existentes e efeitos de inicialização. Não reordene o manifesto alfabeticamente.

`src/core/` reúne geração aleatória, conectividade da galáxia e regras de nomes/planetas; essas regras executam sem DOM ou Three.js. `src/data/` reúne catálogos, missões, nomes e definições. Permanecem literais JavaScript para preservar exatamente o runtime; não há uma segunda cópia de dados para sincronizar.

`src/ship/`, `player/`, `combat/`, `missions/`, `economy/` e `world/` contêm os sistemas do jogo. Muitos ainda usam vetores e objetos Three.js. `src/web/`, `ui/`, `input/`, `camera/` e `models/` tratam apresentação, interação e geometria. `src/runtime/` conserva inicialização, estado compartilhado, persistência e o loop.

## Inicialização

O código é avaliado na ordem do manifesto. Funções declaradas são antecipadas pelo JavaScript; valores de `const` e `let` não são. O modelo incorporado e a integração Atlas precisam estar inicializados antes de `buildShip()`. A construção inicial das entidades precede a ligação final da API pública e o carregamento acionado pelo menu.

`runtime/update.js` coordena o frame. `runtime/startup.js` liga o carregamento inicial e a animação; `runtime/system_loading.js` cuida das transições de sistema. O DOM e os nomes públicos em `window` são parte do contrato atual, inclusive para botões HTML e testes.

Há redefinições históricas de `nearest` e `seaRadius`; a última declaração no script prevalece. Elas foram preservadas deliberadamente. Não apague uma implementação apenas pelo nome duplicado sem avaliar todos os chamadores e a ordem final.

## Mudanças futuras

Prefira funções de regras que recebam números, strings e objetos simples e retornem resultados sem acessar o DOM. Faça o código de apresentação aplicar esses resultados ao Three.js. Extraia dependências gradualmente, durante alterações reais, com testes de comportamento.

Não há eventos, abstrações de motor, dependências ou processamento adicionais no jogo gerado por esta refatoração. A contagem de arquivos afeta apenas a organização do projeto. `docs/relocation.json` registra a origem dos trechos; `docs/symbols.json` é o índice de declarações da entrega v0.2.0. Para referências atuais após futuras edições, use a busca nos fontes.

## Builds

Node e Python usam o mesmo manifesto e geram ambos os HTMLs, com contagem em bytes. Node também verifica a sintaxe JavaScript antes de gravar. O build anterior em Node gerava somente o HTML sem versão; isso foi corrigido. Nenhum build reconverte o GLB automaticamente.

## Jogador Tripo v0.3.2

`tools/prepare_characters.py` prepara NPCs e biblioteca e chama `prepare_tripo_player.py` para substituir apenas a malha do jogador. O adaptador preserva o contrato UAL do runtime. A fonte Tripo e o relatório de conversão ficam em `assets/characters/`; nenhuma imagem é incorporada aos materiais exportados. Ver `docs/TRIPO-v0.3.2.md`.
