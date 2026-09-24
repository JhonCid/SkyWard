# Correção de fidelidade — v0.3.2

- Retirada da redução: todos os 46.448 triângulos e pesos originais do Tripo.
- Normais suaves originais; cores por vértice sem quantização, visor preto e nenhuma imagem no runtime.
- NPCs/controladores preservados; suíte aprovada e revisão CPU de frente/costas.

# v0.3.2 — jogador Tripo original

- Base restaurada da v0.3.1-cabecas, anterior ao jogador N7.
- Modelo original fornecido pelo usuário: 46.448 → 9.400 triângulos, rig UAL, pesos herdados do
  Tripo por nomes/colapsos de arestas e pose adaptada com referenciais anatômicos das palmas.
- Materiais sólidos cinza/vermelho, visor preto, escala visual sem alargamento extra.
- NPCs, biblioteca de animações e sistemas do jogo preservados da base escolhida.
- Testes de luvas, auditoria da base, repetibilidade, suíte e fallback aprovados; limitações
  de WebGL/Blender documentadas em docs/VALIDACAO.md.

# v0.3.1

Correções visuais e de combate solicitadas após teste no jogo. Veja `LEIA-ME.md`, `docs/PERSONAGENS.md` e `docs/VALIDACAO.md`. Corrigidos winding, espessura de armadura, casco/visor, volume corporal, acúmulo de transformações, camadas de mira/voo, preparação do disparo, combos, som de impacto, granadas repetidas, assentos e falsa queda. Projeto mantém fallback.

# v0.3.0

- Jogador masculino rigado e NPCs dos dois corpos; biblioteca compartilhada de animação.
- Traje, capacete, cabelos simples, cores, acessórios e LOD sem texturas de imagem.
- Mistura de locomoção, camadas superiores, contato dos pés e apoio de armas longas.
- Demonstração offline, GLBs, arquivo Blender e scripts reproduzíveis.
- Fallback em Configurações; controles físicos e save preservados.
- Testes novos de skinning, integração e fallback. Limitações em `docs/PERSONAGENS.md`.

# v0.2.0 (histórico)

- Fontes ativos divididos por responsabilidade, preservando o conteúdo e a ordem de execução da v0.1.41.
- Catálogos separados das regras procedurais; regras da galáxia verificáveis sem navegador/motor.
- Fontes antigos inativos e documentos desatualizados preservados em arquivo histórico, fora do build.
- Builds Node/Python usam o mesmo manifesto e geram ambos os nomes de HTML. Corrigida a ausência do arquivo versionado no build Node e a contagem de tamanho em caracteres no build Python.
- Importador Atlas aponta para a nova pasta de geometria gerada.
- Instruções para o Gemini, mapa de edição, busca de referências e documentação de portabilidade.
- Auditoria de equivalência do HTML e conservação do modelo/motor; testes atuais de gameplay preservados.

Nenhuma alteração intencional em controles, visuais, balanceamento, geometria, saves ou mecânicas.
