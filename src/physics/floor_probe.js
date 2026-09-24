function floorProbe(eye,up,p,height=1.8,reach=2,ignore=null){
  const roverIgnore=(typeof mode!=='undefined'&&mode==='rover'&&typeof rover!=='undefined')?rover:null;
  const origin=eye.clone().addScaledVector(up,.4-height),
        bodies=nearbyBodies(eye,reach+height+3,ignore||roverIgnore).filter(b=>b.obj.isMesh&&!b.obj.userData.noSupport&&!hasAncestorFlag(b.obj,'actor')&&(!hasAncestorFlag(b.obj,'dynamic')||b.obj.userData.rampDeck||b.obj.name==='deck'));
  const ray=new THREE.Raycaster(origin,up.clone().negate(),0,reach+.4);
  ray.layers.enable(31);
  const hits=ray.intersectObjects(bodies.map(b=>b.obj),false);
  let ground=null;
  for(const h of hits){
    if(Math.abs(h.face.normal.clone().transformDirection(h.object.matrixWorld).dot(up))>.45){
      ground=h.point.clone().addScaledVector(up,height+.04);
      break;
    }
  }
  // Synchronize collision surface 100% with visible planet mesh geometry
  if(p && p.globe && p.globe.visible){
    const gOrigin=eye.clone().addScaledVector(up,4.0);
    const gRay=new THREE.Raycaster(gOrigin,up.clone().negate(),0,reach+6.5);
    const gHits=gRay.intersectObject(p.globe,false);
    if(gHits.length>0){
      const gGround=gHits[0].point.clone().addScaledVector(up,height+0.02);
      if(!ground || gGround.clone().sub(ground).dot(up)>0) ground=gGround;
    }
  }
  if(p && !ground){
    const terrain=groundEye(eye,p,height),d=eye.clone().sub(terrain).dot(up);
    if(d<=0||d<reach)ground=terrain;
  }
  return ground;
}
function resetFootMotion(){jumpVelocity=0;jumpHeld=0;jumpWasDown=!!keys.Space;onFootGround=true;jetActive=false;footContext='';resting=null;}

window.floorProbe = floorProbe;
