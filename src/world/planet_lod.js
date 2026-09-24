function makePlanetGeometry(p,w,h){const geo=new THREE.SphereGeometry(p.r,w,h),a=geo.attributes.position,colors=new Float32Array(a.count*3);for(let j=0;j<a.count;j++){const n=V(a.getX(j),a.getY(j),a.getZ(j)).normalize(),r=radius(p,n),c=new THREE.Color(p.def[3+biome(n,p.i)]).multiplyScalar(.91+.08*Math.sin(n.x*31+n.z*23));a.setXYZ(j,n.x*r,n.y*r,n.z*r);colors.set([c.r,c.g,c.b],j*3);}geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeVertexNormals();geo.computeBoundingSphere();return geo;}
function createPlanetLOD(p){
  const geo=makePlanetGeometry(p,24,16);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:0.85,metalness:0.0});material.fog=false;
  const globe=mesh(geo,material);
  globe.position.copy(p.center);
  globe.userData.celestial=true;
  globe.receiveShadow=false;
  p.globe=globe;
  p.lodGeometries=[geo, null, null, null];
  p.lodIndex=0;
  planetLODs.push(p);
}
function updateLOD(dt,force=false){
  lodTimer-=dt;
  if(!force&&lodTimer>0)return;
  lodTimer=.15;
  statV05.planetTriangles=0;
  const fov=camera.fov*Math.PI/180,scale=innerHeight/(2*Math.tan(fov/2));
  for(const p of planets){
    if(!p||!p.globe)continue;
    const distance=Math.max(1,camera.position.distanceTo(p.center)),pixels=p.r/distance*scale;
    let level=distance-p.r<220||pixels>300?3:pixels>95?2:pixels>20?1:0;
    if(distance>p.r+250)level=Math.min(level,performancePrefs.planetDetail);
    p.lodIndex=level;
    if(!p.lodGeometries[level]){
      const res=[[24,16],[36,20],[56,32],[120,72]][level];
      p.lodGeometries[level]=makePlanetGeometry(p,res[0],res[1]);
    }
    p.globe.geometry=p.lodGeometries[level];
    p.globe.visible=pixels>.2;
    p.globe.receiveShadow=level===3&&quality==='high';
    if(p.globe.visible&&p.globe.geometry.index)statV05.planetTriangles+=p.globe.geometry.index.count/3;
    if(p.atmosphere)p.atmosphere.visible=false;
  }
  statV05.visibleSettlements=0;
  const observer=camera.position;
  for(const s of settlements){
    if(!s||!s.root)continue;
    const distance=observer.distanceTo(s.center),normal=planetUp(s.center,s.p),occluded=observer.clone().sub(s.center).dot(normal)<-80;
    s.root.visible=!occluded&&distance<(quality==='low'?2700:5000)*performancePrefs.distance;
    if(s.root.visible)statV05.visibleSettlements++;
    for(const g of s.lots){
      const d=g.getWorldPosition(V()).distanceTo(observer);
      g.visible=s.root.visible&&d<(g.userData.small?900:2400)*performancePrefs.distance;
      if(g.userData.details)g.userData.details.visible=d<(quality==='low'?180:380)*performancePrefs.distance;
    }
  }
  for(const n of npcs)if(n.g)n.g.visible=n.g.getWorldPosition(V()).distanceTo(observer)<(quality==='low'?160:350)*performancePrefs.characterDistance;
  for(const g of scenery){
    if(!g)continue;
    const p=nearest(g.position),normal=planetUp(g.position,p);
    g.visible=!g.userData.removed&&g.position.distanceTo(observer)<(quality==='low'?850:1600)*performancePrefs.distance&&observer.clone().sub(g.position).dot(normal)>-50;
  }
}
