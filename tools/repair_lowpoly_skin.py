"""Repair this supplied GLB's invalid skin using the previous valid Tripo suit.
No geometry reduction: warp the reference surface by matching anatomical joints,
then barycentrically transfer weights from the closest reference triangle.
Called inside prepare_tripo_player.py after loading the new source joints.
"""
# The supplied inverse binds use X-forward/Z-lateral although its mesh is Z-forward.
rotate=np.array([[0.,0.,-1.],[0.,1.,0.],[1.,0.,0.]])
sp={n:rotate@p for n,p in sp.items()}
reference=GLB(SRC/'Tripo-Explorer-original.glb');rp=reference.j['meshes'][0]['primitives'][0];ra=rp['attributes']
rv=reference.acc(ra['POSITION']).astype(float);rf=reference.acc(rp['indices']).reshape(-1,3)
rj=reference.acc(ra['JOINTS_0']);rw=reference.acc(ra['WEIGHTS_0'])
rnames=[reference.j['nodes'][i]['name'].removeprefix('mixamorig:') for i in reference.j['skins'][0]['joints']]
rbind=np.linalg.inv(reference.acc(reference.j['skins'][0]['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1))
newIndex={n:i for i,n in enumerate(names)}
def equivalent(n):
    if n=='HeadTop_End':return 'Head'
    if n.endswith('4') and n not in newIndex:return n[:-1]+'3'
    return n
mapped=np.array([newIndex[equivalent(n)] for n in rnames]);warped=rv.copy()
for k in range(4):
    shifts=np.array([sp[equivalent(n)]-rbind[rnames.index(equivalent(n)),:3,3] for n in rnames])
    warped+=shifts[rj[:,k]]*rw[:,k,None]
# Candidate triangles chosen from the registered surface, not closest bones.
_,candidate=cKDTree(warped[rf].mean(1)).query(v,k=32)
tri=warped[rf[candidate]];a0,b0,c0=tri[:,:,0],tri[:,:,1],tri[:,:,2];point=v[:,None,:]
e0=b0-a0;e1=c0-a0;q=point-a0
d00=(e0*e0).sum(2);d01=(e0*e1).sum(2);d11=(e1*e1).sum(2);d20=(q*e0).sum(2);d21=(q*e1).sum(2)
den=d00*d11-d01*d01;safe=np.where(abs(den)>1e-20,den,1)
beta=(d11*d20-d01*d21)/safe;gamma=(d00*d21-d01*d20)/safe
bary=np.stack([1-beta-gamma,beta,gamma],axis=2);closest=(tri*bary[:,:,:,None]).sum(2)
distance=((closest-point)**2).sum(2);distance[(bary.min(2)<0)|(abs(den)<1e-20)]=np.inf
for i,j in [(0,1),(1,2),(2,0)]:
    edge=tri[:,:,j]-tri[:,:,i];t=np.clip(((point-tri[:,:,i])*edge).sum(2)/np.maximum((edge*edge).sum(2),1e-20),0,1)
    cp=tri[:,:,i]+t[:,:,None]*edge;d=((cp-point)**2).sum(2);better=d<distance
    edgeBary=np.zeros_like(bary);edgeBary[:,:,i]=1-t;edgeBary[:,:,j]=t
    bary[better]=edgeBary[better];distance[better]=d[better]
choice=np.argmin(distance,axis=1);rows=np.arange(len(v));sourceVertices=rf[candidate[rows,choice]];blend=bary[rows,choice]
weights=np.zeros((len(v),len(names)))
for corner in range(3):
    for k in range(4):np.add.at(weights,(rows,mapped[rj[sourceVertices[:,corner],k]]),blend[:,corner]*rw[sourceVertices[:,corner],k])
sk=np.argsort(weights,axis=1)[:,-4:][:,::-1];w=np.take_along_axis(weights,sk,axis=1);w/=w.sum(1)[:,None]
(OUT/'skin-repair.json').write_text(json.dumps(dict(reason='4970 of 4971 vertices were assigned entirely to pelvis; hands had zero skin weights',reference='Tripo-Explorer-original.glb',method='anatomically registered reference surface; closest-triangle barycentric skin transfer',maxSurfaceDistance=float(np.sqrt(distance[rows,choice]).max()),medianSurfaceDistance=float(np.median(np.sqrt(distance[rows,choice])))),indent=2))
