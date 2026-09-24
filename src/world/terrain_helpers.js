const planets=[],destinations=[],npcs=[],animals=[],ores=[],scenery=[];
function biome(n,i){return Math.sin(n.x*4+i)+Math.cos(n.z*3-i)+n.y*.4>0?0:1}
function height(n,i){return 7*Math.sin(n.x*17+i)*Math.cos(n.z*15-i)+6*Math.sin(n.y*23+n.x*11)+3*Math.cos(n.z*39);}

function frameAt(pos,center){return new THREE.Quaternion().setFromUnitVectors(UP,pos.clone().sub(center).normalize())}
function label3D(parent,text,x,y,z,size=8){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#071b27';ctx.fillRect(0,0,512,128);ctx.fillStyle='#d9eee2';ctx.font='bold 38px Arial';ctx.textAlign='center';ctx.fillText(text,256,77);const tx=new THREE.CanvasTexture(c),m=new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide});const sign=mesh(new THREE.PlaneGeometry(size,size/4),m,parent,x,y,z);sign.userData.noCollision=true;return sign;}
function bodyLoft(parent,rings,color,segments=12){const points=[],indices=[];for(const [y,rx,rz,cz=0] of rings)for(let k=0;k<segments;k++){const a=k/segments*Math.PI*2;points.push(Math.cos(a)*rx,y,cz+Math.sin(a)*rz);}for(let j=0;j<rings.length-1;j++)for(let k=0;k<segments;k++){const a=j*segments+k,b=j*segments+(k+1)%segments,c=b+segments,d=a+segments;indices.push(a,b,d,b,c,d);}for(const end of [0,rings.length-1])for(let k=1;k<segments-1;k++)indices.push(end*segments,end*segments+k,end*segments+k+1);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();const m=mesh(geo,color,parent);m.material.side=THREE.DoubleSide;return m;}

window.height = height;
window.biome = biome;
