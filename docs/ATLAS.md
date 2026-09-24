# Atlas v3

O original fica em `assets/Atlas_v3.glb`. A geometria incorporada fica em `src/generated/atlas_asset.js`. A lógica está em `src/ship/atlas.js` e a interação em `src/ship/interactions.js`. A Atlas continua como nave padrão.

O importador aplica escala uniforme 2, rotação de 180° em Y e deslocamento vertical de 0,33. Nomes das partes são usados para portas, rampas, trem de pouso e cockpit; preserve-os ao editar o modelo. Os pistões funcionais são construídos pela integração, com comprimento atualizado entre suas ancoragens conforme a rampa se move.

Para reconverter **este modelo compatível**:

```sh
python import_atlas.py
node build.js
node tests/run_all_tests.js
```

O importador requer NumPy e SciPy. Essas dependências não são necessárias para jogar ou gerar o HTML a partir dos fontes fornecidos. O caminho de saída já foi atualizado para a nova estrutura.

O conversor atual incorpora posições, normais e materiais do modelo esperado. Ele não é um importador universal de qualquer recurso do Blender/glTF. Alterar nomes, dimensões, pivôs ou acrescentar texturas/animações exige rever os contratos da integração e os testes correspondentes.

Nesta entrega, o GLB, a geometria incorporada e toda a lógica de rampa/pistões permaneceram inalterados. Os testes incluem apoio do jogador, folga do rover, seis portas, três trens de pouso e interseções amostradas em 61 posições da rampa.
