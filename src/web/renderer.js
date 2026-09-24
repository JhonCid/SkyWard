const bodyCache=new WeakMap(),cityBatches=[];let cityBatchTime=-1;let humanSerial=0;const environment=[];let rainLines=null,disasterFX=null;
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.12,3000000);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc4e9ff,0x404051,2));const sunlight=new THREE.DirectionalLight(0xffe9cb,2.5);sunlight.position.set(6000,9000,3000);scene.add(sunlight);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);Object.assign(sunlight.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:400});sunlight.shadow.bias=-.0008;scene.add(sunlight.target);
const mat=(c=0xffffff,e=0)=>new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.85,emissive:c,emissiveIntensity:e});
function mesh(g,c,parent=scene,x=0,y=0,z=0){const m=new THREE.Mesh(g,typeof c==='number'?mat(c):c);m.position.set(x,y,z);parent.add(m);return m;}
function box(parent,x,y,z,w,h,d,c){return mesh(new THREE.BoxGeometry(w,h,d),c,parent,x,y,z);}
