# Validação da v0.2.0

## Resultado

- 12 verificações da integração Atlas: aprovação.
- 6 verificações com mundo carregado, condução e transporte do rover: aprovação.
- Regras puras executadas sem DOM ou Three.js: aprovação; 1.681 sistemas com conexões recíprocas, planetas determinísticos e gerador aleatório repetível.
- HTML comparado à v0.1.41: conteúdo idêntico byte a byte, normalizando somente a declaração de `VERSION`.
- HTML anterior: 1.884.895 bytes; HTML v0.2.0: 1.884.894 bytes. A diferença de 1 byte é o número de versão mais curto.
- Builds Node e Python: dois HTMLs com conteúdo idêntico.
- Reconversão do GLB usando o importador atualizado: mesmo conteúdo de geometria incorporada, agora no novo caminho.
- GLB original e Three.js: hashes preservados.

## Como reproduzir

```sh
node tests/run_all_tests.js
node tests/refactor_equivalence.js
```

O primeiro comando gera o jogo antes dos testes para evitar testar um HTML desatualizado. O segundo valida especificamente a reorganização desta entrega contra os hashes da v0.1.41 em `tests/baseline.json`.

Os resultados brutos estão em `tests/RESULTADO-v0.2.0.txt`. O histórico da reorganização está em `relocation.json`. Os limites de arquivos foram conferidos contra a árvore sintática JavaScript, sem cortar funções/blocos nem reordenar comandos.

## Alcance e limites

Os testes de integração usam o Three.js real para geometria e transformações, com DOM/renderizador simulados. Não houve uma sessão gráfica WebGL em navegador neste ambiente. Aparência, desempenho em GPU, áudio real e gestos num dispositivo físico não foram validados interativamente nesta entrega.

A identidade do HTML após normalizar a versão dá evidência adicional de preservação do código, shaders, interface e assets existentes. Isso não demonstra ausência de defeitos anteriores nem substitui testes visuais em futuras mudanças.

A suíte histórica da nave anterior (`legacy_v0.1.40_tests.js`) foi preservada em `archive/pre-v0.2.0-reference.zip`; ela contém expectativas incompatíveis com a Atlas e não foi tratada como critério de aprovação desta reorganização. Nenhum teste atual foi removido para obter aprovação.
