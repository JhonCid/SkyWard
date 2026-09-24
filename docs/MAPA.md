# Mapa de edição

| Alteração | Arquivos principais em `src/` |
|---|---|
| Rig, clipes, camadas e IK | `player/character_rig.js` |
| Integração avatar/NPC, armas e fallback | `player/character_game.js` |
| Jogador Tripo / transferência de rig | `../tools/prepare_tripo_player.py`; leia `TRIPO-v0.3.2.md` |
| Modelos/exportação | `../tools/prepare_characters.py`, `../tools/blender_characters.py`; leia `PERSONAGENS.md` |
| Rampa, pistões, portas e colisões Atlas | `ship/atlas.js`, `ship/interactions.js` |
| Montagem da nave / layout / embarque | `ship/build_and_furniture.js`, `ship/fleet_and_boarding.js` |
| Modelo do rover | `models/rover.js` |
| Direção e embarque do rover | `runtime/update.js`, `ship/atlas.js`, `ship/fleet_and_boarding.js` |
| Voo / piloto automático / pouso | `ship/flight.js`, `ship/manual_flight.js`, `ship/autopilot.js`, `ship/landing_pose.js`, `ship/landing_sequence.js` |
| Trens de pouso | `models/landing_gear.js`, `ship/atlas.js` |
| Jogador e câmera | `player/movement.js`, `camera/player_camera.js`, `input/look.js` |
| Teclado, mouse e touch | `ui/menu_and_keyboard.js`, `input/bindings.js`, `input/gestures.js` |
| HUD, telas e menus | `ui/`, `shell/head.html` |
| Botões e telas do cockpit | `ui/cockpit.js`, `web/cockpit_textures.js`, `ship/atlas.js` |
| Armas e preços | `data/equipment_catalog.js`, `data/catalog_extensions.js`, `economy/shops.js` |
| Disparo, dano e inimigos | `combat/weapons.js`, `combat/projectiles.js`, `combat/actors_and_damage.js`, `combat/enemies_and_missions.js` |
| Missões | `data/jobs.js`, `missions/jobs.js`, `missions/guide.js` |
| Galáxia e planetas | `core/galaxy_graph.js`, `core/planet_definitions.js`, `data/planets.js`, `world/streaming.js` |
| Terreno, cidades, água e clima | `world/terrain_and_citizens.js`, `world/settlements.js`, `world/water.js`, `world/environment.js` |
| Colisão e chão | `physics/`, `web/batching_and_collision_cache.js`, `ship/atlas.js` |
| Desempenho e renderização | `web/preferences.js`, `web/renderer.js`, `web/batching_and_collision_cache.js`, `world/planet_lod.js` |
| Som | `web/audio.js`, `web/weapon_audio.js` |
| Save e estado inicial | `runtime/entities_and_save.js`, `runtime/initial_state.js`, `runtime/player_world_state.js` |
| Inicialização / loop / API | `runtime/startup.js`, `runtime/update.js`, `web/public_api.js` |
| Versão | `runtime/player_world_state.js` (`VERSION`) |

Para localizar referências: `node tools/find.js updateAtlasGate`. O índice `symbols.json` registra 663 declarações desta entrega; `relocation.json` liga cada arquivo à posição original. Eles são documentação histórica, não entradas de build.

Os arquivos `generated/atlas_asset.js` e `shell/three.min.js` são grandes por conterem geometria e o motor. Não precisam ser lidos nem enviados novamente à IA para alterações comuns de lógica.
