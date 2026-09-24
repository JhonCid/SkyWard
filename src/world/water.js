function wetPlanet(p){return [0,2,3,4,5].includes(p.i);}
function seaRadius(p){return p.r-4;}
function waterCarve(p,n){
  if(!wetPlanet(p)||p.isGasGiant||p.isMoon)return 0;
  for(const site of settlementNormals(p)){
    const dist=Math.acos(THREE.MathUtils.clamp(n.dot(site.n),-1,1))*p.r;
    if(dist<site.half+80)return 0;
  }
  const lon=Math.atan2(n.z,n.x),lat=Math.asin(THREE.MathUtils.clamp(n.y,-1,1)),basin=Math.sin(n.x*3.2+p.i*.7)+Math.cos(n.z*4.1-p.i*.5)+Math.sin(n.y*3.8)*.45;
  const ocean=THREE.MathUtils.smoothstep(basin,.3,1.4)*36;
  const river=Math.min(Math.abs(lat-.20*Math.sin(lon*3+p.i)-.18),Math.abs(lat-.24*Math.sin(lon*2-p.i)+.35));
  const channel=(1-THREE.MathUtils.smoothstep(river,.009,.045))*29;
  return Math.max(ocean,channel);
}
function isWater(p,n){
  if(!wetPlanet(p))return false;
  for(const site of settlementNormals(p)){
    const dist=Math.acos(THREE.MathUtils.clamp(n.dot(site.n),-1,1))*p.r;
    if(dist<site.half+60)return false;
  }
  return radius(p,n)<seaRadius(p)-.5;
}
function waterPoint(p,n,offset=0){return p.center.clone().addScaledVector(n,seaRadius(p)+offset);}
function aquaticDriveSpeed(){
  if(rover.parent===ship) return 8;
  const isBoost = (typeof sprinting === 'function' && sprinting()) || (typeof autoForward !== 'undefined' && autoForward);
  const boostMult = isBoost ? 1.4 : 1.0;
  if(!['skiff','cutter'].includes(vehicleKind)){
    const baseSpeed = 75;
    return baseSpeed * boostMult;
  }
  const pos=rover.getWorldPosition(V()),p=nearest(pos);
  const inWater = rover.parent!==ship&&isWater(p,planetUp(pos,p));
  return (inWater ? (vehicleKind==='skiff'?55:42) : 10) * boostMult;
}
