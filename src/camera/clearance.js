function terrainCameraClearance(point){const p=nearest(point),n=planetUp(point,p),r=point.distanceTo(p.center),surface=Math.max(radius(p,n),wetPlanet(p)?seaRadius(p):-Infinity)+1.2;if(r<surface)point.copy(p.center).addScaledVector(n,surface);return point;}
function shipCameraOutside(point){const local=localPoint(point),bounds=new THREE.Box3(V(-26,-4,-29),V(26,13,23));if(bounds.containsPoint(local)){const direction=local.sub(V(0,2,0));if(direction.lengthSq()<.01)direction.set(0,1,1);direction.normalize();const origin=V(0,2,0);let exit=Infinity;for(const k of ['x','y','z'])if(Math.abs(direction[k])>1e-6)exit=Math.min(exit,((direction[k]>0?bounds.max[k]:bounds.min[k])-origin[k])/direction[k]);point.copy(shipPoint(origin.addScaledVector(direction,exit+1)));}return point;}
function safeChaseCamera(focus,offset,ignore,aboard){const wanted=focus.clone().add(offset);const dist=obstacleDistance(focus,wanted,ignore);let point=Number.isFinite(dist)?focus.clone().addScaledVector(offset.clone().normalize(),Math.max(.4,dist-.6)):wanted;
if(aboard){shipCameraOutside(point);terrainCameraClearance(point);shipCameraOutside(point);
// If a wall blocks the short follow position, lift above the ship instead of
// shortening the ray through its hull. Keep the planet-facing side clear.
if(Number.isFinite(dist)&&focus.distanceTo(point)>dist){point=shipPoint(V(0,Math.max(25,offset.length()*.55),8));terrainCameraClearance(point);shipCameraOutside(point);}}
else if(!inside&&!station)terrainCameraClearance(point);return point;}
