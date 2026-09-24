# SkyWard v0.3.2 corrigido — pacote enxuto

Abra `SkyWard/SkyWard.html` depois de extrair o ZIP de trabalho. O HTML mantém exatamente os 10.232.543 bytes originais; código, aparência, modelos, 65 ossos e 85 clipes não foram modificados. Nenhuma animação foi substituída por animação procedural. Compressão ZIP DEFLATE nível 9, sem perda; nenhuma compressão nova no runtime, nenhuma dependência online nova.

## Reconstrução

Dentro da pasta SkyWard, `node build.js` ou `python3 build.py` reconstrói o jogo usando os fontes inclusos, sem instalar pacotes. Os construtores originais geram SkyWard.html e a cópia SkyWard-v0.3.2.html; esta pode ser apagada novamente para manter o pacote enxuto.

Para regenerar personagens, extraia também SkyWard-v0.3.2-fontes-personagens.zip na MESMA pasta-pai do pacote de trabalho, mesclando as pastas SkyWard. Assim os GLBs ficam diretamente em SkyWard/assets/characters/source/ (não dentro de outra pasta source). Depois, dentro de SkyWard:

```sh
python3 -m pip install -r tools/requirements-characters.txt
python3 tools/prepare_characters.py
node build.js
node tests/run_all_tests.js
```

A instalação inicial das dependências Python pode exigir internet; jogar e reconstruir o HTML não exigem. Com Python, NumPy, SciPy e Pillow já instalados, a conversão também é local. Blender é opcional para `blender --background --python tools/blender_characters.py`.

## Validação realizada

- `node tests/run_all_tests.js`: aprovado antes e depois da limpeza. Inclui 510 combinações corpo/clipe, 60 verificações de luvas/mãos, regressões de personagens e 18 verificações Atlas/gameplay.
- Todos os 165 arquivos originais mantidos no trabalho foram comparados por SHA-256, sem diferenças; inclusive HTML, engine, fontes, dados gerados, modelos e testes.
- Regeneração real com os fontes separados: characters.js, três GLBs exportados, catalog.json, report.json, skin-repair.json e tripo-conversion.json idênticos byte a byte aos originais.
- Não foi feita nova inspeção interativa WebGL; a preservação visual/offline é sustentada pela identidade dos bytes do HTML e das dependências, além dos testes fornecidos.
- Logs em tests/VALIDACAO-pacote-enxuto.txt e tests/REGENERACAO-pacote-enxuto.txt. O inventário em docs/INVENTARIO-otimizacao.json registra todos os arquivos de entrada, tamanhos, destinos e SHA-256.

## Recuperação dos itens retirados

O ZIP enviado originalmente, SkyWard-v0.3.2-corrigido-1.zip, permanece intacto. Qualquer item pode ser recuperado extraindo o caminho exato listado abaixo desse ZIP para a pasta-pai do projeto. Para recuperar TODOS os arquivos originais, extraia o ZIP original em uma pasta vazia. Isso recupera o conteúdo dos arquivos, sem prometer reproduzir metadados do sistema de arquivos.

- HTML duplicado: copiar SkyWard.html para SkyWard-v0.3.2.html ou executar o build.
- Preview HTML: `node tools/build_character_preview.js` regenera Personagens-v0.3.2.html; o template e o gerador foram preservados.
- Imagens históricas e temporário: para obter os bytes exatos, recupere do ZIP original. Os scripts de poses/renderização continuam disponíveis para novas imagens, que podem não reproduzir exatamente os previews históricos.
- .blend histórico e bibliotecas _RM: recuperar do ZIP original. O Blender pode gerar um .blend atual, mas esse não é uma reconstrução do snapshot histórico.
- Fontes movidos: restaurar do ZIP de fontes ou do original. Incluem bibliotecas SEM _RM, os DOIS GLBs Tripo, mannequin feminino e licença.

O arquivo archive/pre-v0.2.0-reference.zip e os registros de testes/documentação históricos foram mantidos. Não foram confundidos com temporários. Documentos antigos podem mencionar previews e o .blend histórico removidos; este relatório descreve a organização atual.

## Lista exata de arquivos fora do ZIP de trabalho

Caminhos relativos à raiz dos ZIPs; tamanhos descompactados em bytes.

| Caminho | Bytes | Destino / motivo |
| --- | ---: | --- |
| `SkyWard/Personagens-v0.3.2.html` | 9015202 | preview gerado; recuperável do ZIP original |
| `SkyWard/SkyWard-v0.3.2.html` | 10232543 | HTML duplicado; recuperável do ZIP original |
| `SkyWard/assets/characters/SkyWard-Characters-anterior.blend` | 38324320 | Blender histórico; recuperável do ZIP original |
| `SkyWard/assets/characters/source/LICENSE-Quaternius.txt` | 332 | ZIP de fontes separado |
| `SkyWard/assets/characters/source/Mannequin_F.glb` | 1442824 | ZIP de fontes separado |
| `SkyWard/assets/characters/source/Tripo-Explorer-original.glb` | 2732932 | ZIP de fontes separado |
| `SkyWard/assets/characters/source/Tripo-Lowpoly-original.glb` | 365836 | ZIP de fontes separado |
| `SkyWard/assets/characters/source/UAL1_Standard.glb` | 7618436 | ZIP de fontes separado |
| `SkyWard/assets/characters/source/UAL1_Standard_RM.glb` | 7620504 | biblioteca RM não usada; recuperável do ZIP original |
| `SkyWard/assets/characters/source/UAL2_Standard.glb` | 8091444 | ZIP de fontes separado |
| `SkyWard/assets/characters/source/UAL2_Standard_RM.glb` | 8095936 | biblioteca RM não usada; recuperável do ZIP original |
| `SkyWard/docs/character-poses/.male-jump.json.vItQ2K` | 9699328 | temporário; recuperável do ZIP original |
| `SkyWard/docs/character-poses/male-back.png` | 70774 | preview gerado; recuperável do ZIP original |
| `SkyWard/docs/character-poses/male-idle.png` | 74236 | preview gerado; recuperável do ZIP original |
| `SkyWard/docs/character-review-fiel.png` | 146898 | preview gerado; recuperável do ZIP original |
| `SkyWard/docs/character-review.png` | 52887 | preview gerado; recuperável do ZIP original |
