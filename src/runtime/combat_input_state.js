const combatRng=(()=>{let n=174729;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}})();
function controlledPosition(){return mode==='pilot'?ship.position.clone():mode==='rover'?rover.getWorldPosition(V()):inside?shipPoint(foot):player.clone();}
let roverTouchSteer = 0, roverLookOnly = false, roverLinearSpeed = 0, roverSteerInput = 0, punchHand = 1, lastUnarmedAttackTime = -999, unarmedRaiseBlend = 0.0;
window.getLastUnarmedAttackTime = () => lastUnarmedAttackTime;
window.setLastUnarmedAttackTime = v => { lastUnarmedAttackTime = v; };
window.getUnarmedRaiseBlend = () => unarmedRaiseBlend;
window.setUnarmedRaiseBlend = v => { unarmedRaiseBlend = v; };
window.getPunchHand = () => punchHand;
window.setPunchHand = v => { punchHand = v; };
window.getRoverSteerInput = () => roverSteerInput;
window.setRoverSteerInput = v => roverSteerInput = v;
window.getRoverLinearSpeed = () => roverLinearSpeed;
window.setRoverLinearSpeed = v => roverLinearSpeed = v;
function axisForward(){return Math.max(-1,Math.min(1,(keys.KeyW?1:0)-(keys.KeyS?1:0)+(autoForward?1:0)-touchY));}
function axisStrafe(){
  const rightSteer = (typeof mode !== 'undefined' && mode === 'rover' && typeof roverTouchSteer !== 'undefined') ? roverTouchSteer : 0;
  return Math.max(-1, Math.min(1, (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + touchX + rightSteer));
}
function hasAncestorFlag(o,flag){while(o){if(o.userData?.[flag])return true;o=o.parent;}return false;}

function discardChildren(g){if(!g||!g.children)return;g.traverse(o=>{if(o.userData.character&&!o.userData.character.disposed){SkywardCharacters.dispose(o);o.userData.character.disposed=true;}});while(g.children.length){const o=g.children[0];g.remove(o);o.traverse(x=>{if(x.isMesh){x.geometry.dispose();x.material.map?.dispose();x.material.dispose();}});}}

function seaRadius(p){return p.r-4;}
