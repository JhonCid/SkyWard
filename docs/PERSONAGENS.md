# Personagens: implementação e manutenção

## Fontes

- `tools/prepare_characters.py`: lê os originais, adapta/simplifica a malha, cria traje/capacete/cabelo/acessórios e LOD, transfere o corpo feminino para a pose comum e exporta.
- `src/player/character_rig.js`: caches, SkinnedMesh, AnimationMixer, mistura/camadas, correção dos pés e mão de apoio.
- `src/player/character_game.js`: estado físico, câmera, armas, NPCs e fallback.
- `src/generated/characters.js`: dados gerados; não editar à mão.
- `tools/blender_characters.py`: importa os modelos e salva o Blender editável.
- `tools/render_characters_blender.py`: monta/renderiza a cena de revisão.

O processo Python requer NumPy/SciPy/Pillow (veja `tools/requirements-characters.txt`); o build HTML usa apenas a biblioteca padrão. Os originais CC0 estão preservados. O corpo deriva dos manequins com simplificação ponderada, ajuste do traje e novas peças próprias; não é uma modelagem integral do corpo do zero.

## Rig e clipes

43 clipes em cada pacote, com `A_TPose` repetida: 85 nomes únicos, 84 movimentos. Os 67 nós originais incluem dois nós não ósseos: a skin tem 65 ossos.

Mantemos nomes, hierarquia e matrizes de referência. O corpo feminino tem diferenças nos braços, transferidas à pose comum antes do uso. Não há duplicação de clipes por sexo. Os GLBs de NPC usam o rig do GLB masculino que contém a biblioteca.

Origem: Y para cima, +Z para frente. O adaptador visual gira 180° em Y para o -Z do jogo e aplica escala `1.8/1.849`. Os NPCs variam moderadamente de altura/largura. A animação nunca desloca o collider ou a posição física controlada pelo jogo.

O runtime usa os clipes sem root motion. Os `_RM` ficam preservados como fontes para futuras ações contextuais, sem incorporação ao HTML ou deslocamento físico nesta versão.

Chaves redundantes são reduzidas, limitando o erro nos tempos amostrados a 0,0003 m de translação e 0,0015 na distância entre quaternions normalizados. Isso não prova um limite de erro em todo instante contínuo. Os originais permanecem disponíveis.

## Variação e LOD

Jogador masculino sempre com capacete. NPCs masculinos/femininos, aproximadamente 18% com capacete, três cortes simples de cabelo, cinco tons de pele/cabelo, altura/largura moderadamente variáveis e paletas do jogo. Funções visuais (civil, técnico, piloto, comerciante) selecionam bolsa, ferramenta, mochila ou nenhum acessório; não alteram profissões mecânicas ou missões.

Geometria e materiais são compartilhados por variante; ossos/mixers são individuais para permitir poses independentes. Não é uma única InstancedMesh. O LOD respeita distância e preferência de detalhe. Capacetes permanecem nos LODs inferiores; pequenos acessórios desaparecem na maior distância. `report.json` conta malhas-base; acessórios acrescentam poucos triângulos sem exceder o orçamento.

## Alcance e adaptações

- Mistura de idle/caminhada/jog/corrida conforme velocidade, mantendo a direção controlada pela câmera existente.
- Mira/recarga em camada superior. Rifle/escopeta adaptam poses de pistola e usam correção da mão de suporte; não há clipes dedicados dessas armas nos pacotes.
- Jetpack usa `Jetpack_Loop`, derivado da mistura de Idle e Jump_Loop com amplitude reduzida, e inclinação adicional; não há mocap específico de voo, oito direções ou todas as transições de zero gravidade.
- Agachar, escalar, rolar e vários gestos estão na biblioteca/demonstração e no controlador. Não foram acrescentados novos comandos físicos dessas mecânicas.
- Apoio dos pés corrige pernas/quadril do jogador visível em contato com o chão. Não executa IK caro para todos os NPCs distantes.
- Armas/mãos da primeira pessoa mantêm a implementação anterior. O novo corpo aparece em terceira pessoa, preservando a câmera em primeira pessoa.
- Bancos/cockpit/rover reutilizam clipes genéricos nas posições anteriores. Não são animações sob medida para cada móvel/veículo.

## Recursos e fallback

O botão de Configurações grava `skyward-character-system` e reinicia. O sistema anterior permanece em `legacyPerson`, `legacyMakeAvatar` e `legacyAnimateHuman`.

Geometria/material do cache pertencem à sessão; remover uma instância não os descarta. Mixer/Skeleton da instância são liberados na limpeza. Peças idênticas são armazenadas uma vez no asset gerado. O HTML não incorpora FBX, Blender nem variantes RM.


## Controlador v0.3.1

`cleanPose` guarda a pose amostrada pelo mixer antes de IK e inclinação. Restaurá-la antes do próximo update é necessário: tracks constantes podem não ser reescritas pelo mixer. Sem isso as correções se acumulavam, sobretudo em disparo contínuo.

A mira combina Pistol_Aim_Neutral/Up/Down; não repete Pistol_Shoot como loop de tronco. Recoil pequeno é aplicado depois da amostragem, sem acumular. O voo mantém a camada inferior independente da mira. O encaixe da lâmina usa o centro do cabo na palma; disparo em terceira pessoa aguarda mistura de mira e alinhamento do cano.

`updateCharacterCombat` encerra estados por relógio de jogo, sem depender do renderizador antigo. Ataques aceitos disparam clipes diretamente, em vez de depender da borda de um booleano. Socos/cortes não reiniciam enquanto o anterior está ativo. Marcadores normalizados de impacto: Jab 0,24; Cross 0,30; Sword_Regular_A 0,54; B 0,46, obtidos das amostras de extensão dos clipes. Som/dano compartilham esse evento; os punhos em primeira pessoa usam o mesmo ponto de extensão.

`Air_Controlled` e `Jetpack_Loop` são clipes derivados em memória; os 85 originais permanecem intactos. O salto reduz a amplitude da pose cartoon. Jetpack não é mocap novo. Recuo reproduz os clipes de passada em sentido reverso; não há novo clipe dedicado de backpedal.

A altura da pelve é alinhada no espaço visual ao assento. A câmera usa a posição real da cadeira Atlas, sem a antiga altura fixa de 0,8 m. Rover mantém sua base e usa pelve a 0,60 m do veículo. Saída imediata não dispara Sitting_Exit.

A pose do motorista recebe IK analítico de dois segmentos para colocar os tornozelos sobre o piso da cabine, com orientação dos joelhos para frente. O alvo visual não desloca o rover nem seu collider.

## Jogador Tripo v0.3.2

O jogador usa uma fonte diferente dos NPCs: `source/Tripo-Explorer-original.glb`. A etapa específica `tools/prepare_tripo_player.py` substitui somente `player_lod0` antes da exportação. O controlador continua usando o rig UAL e os mesmos 85 clipes. Consulte `TRIPO-v0.3.2.md` para conversão, origem e auditoria. Os GLBs NPC são idênticos aos da base cabecas. O snapshot Blender anterior não é a fonte do jogador atual.

### Correção de fidelidade da v0.3.2

A redução QEM foi retirada a pedido do usuário. O jogador preserva os 46.448 triângulos originais, normais suaves transformadas junto à pose e cores originais por vértice (COLOR_0 no GLB). A paleta do traje do jogador é a do modelo; os seletores de cor antigos continuam aplicáveis aos NPCs, mas não recolorem essa malha. O visor segue preto. O orçamento antigo de 10 mil triângulos foi substituído pela prioridade de fidelidade; os NPCs mantêm seus LODs.
