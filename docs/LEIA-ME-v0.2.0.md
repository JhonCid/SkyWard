# SkyWard v0.2.0

Abra `SkyWard-v0.2.0.html` ou `SkyWard.html` no navegador com WebGL. O jogo continua incorporado em um único HTML, sem instalação, servidor ou download de modelos.

## Para continuar com o Gemini

Envie o ZIP completo e peça: **“Leia GEMINI.md e docs/MAPA.md antes de editar. Trabalhe nos fontes e gere novamente o HTML.”**

O código ativo agora está separado por responsabilidade. A Atlas, o rover, os pistões, a interface, os controles e as regras foram preservados. O HTML gerado é idêntico ao da v0.1.41, exceto pelo número de versão. As fontes antigas que não entravam no build foram arquivadas, sem descarte.

## Gerar e testar

Na pasta do projeto, escolha um comando de geração:

```sh
node build.js
```

ou:

```sh
python build.py
```

Não precisa de npm install. A geração usa apenas a biblioteca padrão de Node.js ou Python 3. Os testes precisam de Node.js:

```sh
node tests/run_all_tests.js
node tests/refactor_equivalence.js
```

O segundo comando é a auditoria histórica desta refatoração. Consulte `docs/VALIDACAO.md` para o alcance dos testes.

## Controles preservados

- WASD: caminhar/dirigir. Mouse: olhar.
- E perto do painel: porta/rampa; perto da cadeira: pilotar; perto do rover: entrar.
- O: rampa; também funciona pelos botões amarelos e pelo cockpit.
- R ou B: levantar/sair do assento. T: retornar ao cockpit.
- F, pilotando: pousar. L: faróis. V: câmera.

O rover começa sobre a rampa e acompanha sua inclinação. Afaste o jogador antes de fechar. Abra completamente para desembarcar; alinhe o rover com a rampa para embarcar.

## Onde começar

- `GEMINI.md`: instruções curtas para a IA.
- `docs/MAPA.md`: onde editar cada sistema.
- `ARCHITECTURE.md`: organização e limites atuais.
- `docs/ATLAS.md`: modelo e importação.
- `docs/GODOT.md`: preparação gradual da migração.
- `archive/pre-v0.2.0-reference.zip`: fontes inativas e documentos históricos, fora do build.
