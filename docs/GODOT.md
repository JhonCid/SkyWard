# Preparação para uma futura versão Godot

Esta entrega organiza o projeto para facilitar manutenção e localizar o que será portado. Não é uma conversão automática e não elimina a adaptação futura do motor.

1. Mantenha os modelos originais em `assets/`. O GLB é a origem artística; não use o JavaScript de geometria incorporada como arquivo de modelagem.
2. Mantenha novos catálogos em `src/data/` e regras numéricas em `src/core/`, recebendo e retornando dados simples quando possível.
3. Preserve identificadores, unidades, escalas e convenções de coordenadas. Na Atlas atual, registre também a transformação aplicada pelo importador.
4. Ao portar, reproduza regras e dados primeiro; adapte cenas, materiais, física, UI, entrada e áudio ao motor de destino.
5. Use os cenários de testes como critérios de aceitação: embarque, apoio, portas, pistões, condução, transporte, voo e persistência. Renderização e física precisam de comparação visual e funcional nos dois motores.

As regras de galáxia já podem executar sem navegador ou Three.js, como demonstrado em `tests/core_rules.js`. A maioria dos sistemas de jogo ainda usa Three.js e estado compartilhado. Novas mudanças devem reduzir esse acoplamento gradualmente quando houver benefício concreto, sem interromper a criação do jogo para construir uma camada genérica de motores.
