# SkyWard — ponto de partida no GitHub

Este repositório parte de SkyWard v0.3.2 corrigido. `src/` contém o código do jogo e os dados gerados de Atlas/personagens; `assets/` contém os modelos exportados e os fontes necessários para regenerá-los, inclusive os dois GLBs Tripo e bibliotecas sem `_RM`. O HTML jogável é compilado por `build.js`, que usa apenas Node.js. Os clipes dos personagens permanecem os 85 clipes originais, sem animação procedural substituta.

## Desenvolver e testar

```sh
node tests/run_all_tests.js
```

O comando executa a compilação e os testes. Para jogar localmente, abra `SkyWard.html` gerado. É autocontido e funciona sem rede. Para alterar personagens ou os GLBs, consulte `OTIMIZACAO-LEIA-ME.md` e rode o pipeline Python com as dependências de `tools/requirements-characters.txt`.

## Publicação

O fluxo `.github/workflows/pages.yml` testa cada push em `main`, gera o jogo e publica somente `index.html` no GitHub Pages. Pull requests executam os testes sem publicar. Na primeira vez, um administrador do repositório deve selecionar **Settings → Pages → Build and deployment → Source: GitHub Actions**. O link aparece na execução de publicação e nas configurações Pages. O site é publicamente acessível pela internet; o HTML publicado incorpora motor, Atlas e personagens, mas os GLBs fonte, documentação e testes não são copiados para Pages.

Para voltar a uma versão, use uma tag ou commit específico. Mantenha `main` como versão atual e identifique bases e updates por tags (`base-0.4.0`, `v0.4.1` etc.) quando a nova sequência for definida. Esta v0.3.2 é anterior ao esquema base/update e não recebe retroativamente uma base inventada.

O repositório não faz o navegador armazenar o jogo automaticamente para uso sem rede depois de visitar o link. O arquivo `SkyWard.html` gerado continua sendo a opção offline comprovada.
