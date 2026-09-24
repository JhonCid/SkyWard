const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');
const scripts=['src/shell/three.min.js','src/generated/characters.js','src/player/character_rig.js'].map(f=>'<script>'+fs.readFileSync(path.join(root,f),'utf8')+'</script>').join('\n');
const html=fs.readFileSync(path.join(__dirname,'character_preview.html'),'utf8').replace('<!-- SCRIPTS -->',scripts);
fs.writeFileSync(path.join(root,'Personagens-v0.3.2.html'),html);console.log('Offline character preview generated.');
