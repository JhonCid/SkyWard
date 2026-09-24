// Optional real-browser smoke test. Requires Playwright and a Chromium executable.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const root=path.join(__dirname,'..'),out=path.join(root,'docs/browser');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto('file://'+path.join(root,'Personagens-v0.3.2.html'));await page.waitForFunction(()=>document.querySelector('#stats').textContent.includes('triângulos'));
 assert.equal(await page.locator('#error').textContent(),'');
 await page.screenshot({path:path.join(out,'player.png')});
 await page.selectOption('#model','female');await page.selectOption('#clip','Jog_Fwd_Loop');await page.selectOption('#hair','1');
 await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'npc.png')});
 await page.selectOption('#model','player');await page.selectOption('#clip','auto');await page.check('#ramp');await page.locator('#gravity').fill('35');
 await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'ramp-gravity.png')});
 assert.deepEqual(errors,[],'preview browser errors');assert.deepEqual(network,[],'unexpected online dependency');
 console.log('PASS actual Chromium/WebGL: preview, NPC animation, ramp and rotated gravity; no page/shader errors or HTTP dependencies.');
 await page.goto('file://'+path.join(root,'SkyWard.html'));await page.waitForFunction(()=>typeof window.startLoadingGame==='function');
 await page.evaluate(()=>window.startLoadingGame());await page.waitForFunction(()=>!!window.characterAnimation?.player,{},{timeout:60000});
 await page.evaluate(()=>{window.closeMenu();const t=window.__test;t.setMode('foot');t.setInside(true);t.setThirdPerson(true);t.getFoot().copy(window.layout().spawn);});
 await page.waitForTimeout(1000);await page.screenshot({path:path.join(out,'game.png')});
 const info=await page.evaluate(()=>({version:window.VERSION,skinned:window.characterAnimation.player.meshes.every(m=>m.isSkinnedMesh),npc:window.__test.npcs.filter(n=>n.g.userData.character).length}));
 assert(info.skinned);assert(info.npc>0);assert.equal(info.version,'0.3.2');assert.deepEqual(errors,[],'game browser errors');assert.deepEqual(network,[]);
 console.log('PASS actual Chromium/WebGL: game loaded, rigged male player and NPCs, '+JSON.stringify(info));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
