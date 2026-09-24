"""Tripo -> UAL bind pose. Called by prepare_characters.py, not a universal importer.
Preserves complete source geometry; repairs supplied invalid skin from a registered reference. Bone roll is
reconstructed from anatomical landmarks; raw inverse bind rotations are NOT copied.
Runtime output contains only solid materials, no source images or UVs.
Dependencies: numpy, scipy, Pillow.
"""
from PIL import Image
from io import BytesIO

src=GLB(SRC/'Tripo-Lowpoly-original.glb')
prim=src.j['meshes'][0]['primitives'][0];a=prim['attributes']
v=src.acc(a['POSITION']).astype(float);f=src.acc(prim['indices']).reshape(-1,3)
sk=src.acc(a['JOINTS_0']);w=src.acc(a['WEIGHTS_0'])
names=[src.j['nodes'][i]['name'].removeprefix('mixamorig:') for i in src.j['skins'][0]['joints']]
sourceBind=np.linalg.inv(src.acc(src.j['skins'][0]['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1))
sp={n:sourceBind[i,:3,3] for i,n in enumerate(names)}
exec(compile((ROOT/'tools/repair_lowpoly_skin.py').read_text(),str(ROOT/'tools/repair_lowpoly_skin.py'),'exec'))
tp={n:bind[i,:3,3] for i,n in enumerate(boneNames)}
lookup={'Hips':'pelvis','Spine':'spine_01','Spine1':'spine_02','Spine2':'spine_03','Neck':'neck_01','Head':'Head','HeadTop_End':'Head'}
child={'Hips':'Spine','Spine':'Spine1','Spine1':'Spine2','Spine2':'Neck','Neck':'Head','Head':'HeadTop_End'}
tchild={'pelvis':'spine_01','spine_01':'spine_02','spine_02':'spine_03','spine_03':'neck_01','neck_01':'Head'}
for side,suffix in [('Left','l'),('Right','r')]:
    chain=[('Shoulder','clavicle'),('Arm','upperarm'),('ForeArm','lowerarm'),('Hand','hand')]
    legs=[('UpLeg','thigh'),('Leg','calf'),('Foot','foot'),('ToeBase','ball'),('Toe_End','ball_leaf')]
    for chain0 in [chain,legs]:
        for k,(s,t) in enumerate(chain0):
            lookup[side+s]=t+'_'+suffix
            if k+1<len(chain0):child[side+s]=side+chain0[k+1][0];tchild[t+'_'+suffix]=chain0[k+1][1]+'_'+suffix
    child[side+'Hand']=side+'HandMiddle1';tchild['hand_'+suffix]='middle_01_'+suffix
    for finger in ['Index','Middle','Ring','Pinky','Thumb']:
        for k in range(1,5):
            s=side+'Hand'+finger+str(k);t=finger.lower()+('_04_leaf_' if k==4 else '_0'+str(k)+'_')+suffix
            lookup[s]=t
            if k<4:child[s]=side+'Hand'+finger+str(k+1);tchild[t]=finger.lower()+('_04_leaf_' if k==3 else '_0'+str(k+1)+'_')+suffix
assert set(names)<=set(lookup)
# This low-poly rig omits terminal finger/head joints; virtual landmarks only,
# never introduce weights or change the source skeleton.
sp.setdefault('HeadTop_End',np.array([sp['Head'][0],v[:,1].max(),sp['Head'][2]]))
for side in ['Left','Right']:
    for finger in ['Index','Middle','Ring','Pinky','Thumb']:
        base=side+'Hand'+finger
        sp.setdefault(base+'4',sp[base+'3']+(sp[base+'3']-sp[base+'2'])*.8)
remap=np.array([boneIndex[lookup[n]] for n in names])

def unit(x):
    n=np.linalg.norm(x)
    if n<1e-8:raise ValueError('Degenerate anatomical frame')
    return x/n

def frame(y,z):
    y=unit(y);z=unit(z-y*np.dot(z,y));return np.column_stack((np.cross(y,z),y,z))

def palm(points,side,target=False):
    hand='hand_'+side if target else side+'Hand'
    mid='middle_01_'+side if target else side+'HandMiddle1'
    index='index_01_'+side if target else side+'HandIndex1'
    pinky='pinky_01_'+side if target else side+'HandPinky1'
    return frame(points[mid]-points[hand],points[index]-points[pinky])

scale=1.849/(v[:,1].max()-v[:,1].min());offset=np.array([sp['Hips'][0],v[:,1].min(),0.])
transforms=[];audit=[]
for n in names:
    t=lookup[n];start=sp[n];end=tp[t];ratio=1.
    if n in ['Head','HeadTop_End']:
        # Fit the helmet pivot to the animated head instead of leaving a long neck. HeadTop maps
        # to Head with the SAME transform, never collapse the crown to its pivot.
        start=sp['Head'];end=tp['Head'];rot=np.eye(3);stretch=np.eye(3)
    elif n.endswith(('Toe_End','4')):
        # End bones almost never carry weight; extend their preceding frame.
        previous=n[:-1]+'3' if n.endswith('4') else n.replace('Toe_End','ToeBase')
        idx=names.index(previous)
        # Derive below independently (skin joint ordering is not assumed).
        sn=previous;tn=lookup[sn]
        ys=sp[child[sn]]-sp[sn];yt=tp[tchild[tn]]-tp[tn]
        if 'Hand' in n:
            side='Left' if n.startswith('Left') else 'Right';suf='l' if side=='Left' else 'r'
            fs=frame(ys,palm(sp,side)[:,0]);ft=frame(yt,palm(tp,suf,True)[:,0])
        else:fs=frame(ys,[0,1,0]);ft=frame(yt,[0,1,0])
        rot=ft@fs.T;stretch=np.eye(3)
    else:
        ys=sp[child[n]]-sp[n];yt=tp[tchild[t]]-tp[t]
        if n.endswith('Hand'):
            side='Left' if n.startswith('Left') else 'Right';suf='l' if side=='Left' else 'r'
            fs=palm(sp,side);ft=palm(tp,suf,True)
        elif 'Hand' in n:
            side='Left' if n.startswith('Left') else 'Right';suf='l' if side=='Left' else 'r'
            fs=frame(ys,palm(sp,side)[:,0]);ft=frame(yt,palm(tp,suf,True)[:,0])
        else:
            z=[0,1,0] if n.endswith(('Foot','ToeBase')) else [0,0,1]
            fs=frame(ys,z);ft=frame(yt,z)
        ratio=np.linalg.norm(yt)/(np.linalg.norm(ys)*scale)
        rot=ft@fs.T;stretch=fs@np.diag([1,ratio,1])@fs.T
    linear=rot@stretch*scale
    transforms.append((linear,end-linear@start))
    audit.append(dict(source=n,target=t,lengthRatio=round(float(ratio),5),rotationDeterminant=round(float(np.linalg.det(rot)),6)))

# Retain every original vertex/triangle. Only adapt the bind pose to the UAL rig.
# Smooth normals come from the source, not per-face replacement normals.
posed=np.zeros_like(v);normal=np.zeros_like(v);sourceNormal=src.acc(a['NORMAL'])
targetWeights=np.zeros((len(v),len(boneNames)))
for k in range(4):
    for i,(linear,translation) in enumerate(transforms):
        mask=sk[:,k]==i
        posed[mask]+=(v[mask]@linear.T+translation)*w[mask,k,None]
        normal[mask]+=(sourceNormal[mask]@np.linalg.inv(linear))*w[mask,k,None]
    np.add.at(targetWeights,(np.arange(len(v)),remap[sk[:,k]]),w[:,k])
normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
js=np.argsort(targetWeights,axis=1)[:,-4:][:,::-1];ws=np.take_along_axis(targetWeights,js,axis=1);ws/=ws.sum(1)[:,None]
# Dark explorer palette, using broad anatomical zones rather than texture noise.
height=v[:,1].max()-v[:,1].min();head=sp['Head'];crown=sp['HeadTop_End'][1]-head[1]
normY=(v[:,1]-v[:,1].min())/height
rgb=np.tile([.24,.28,.32],(len(v),1))
# Dark flexible joints, gloves and inner suit.
for joint,radius in [('LeftLeg',.039),('RightLeg',.039),('LeftForeArm',.030),('RightForeArm',.030),('Neck',.045)]:
    d=np.linalg.norm(v-sp[joint],axis=1);rgb[d<radius*height]=[.075,.09,.11]
for side in ['Left','Right']:
    glove=np.array([side+'Hand' in n for n in names])[sk]
    mask=(glove*w).sum(1)>.55;rgb[mask]=[.075,.09,.11]
# Restrained chest/wrist accents. Helmet and visor remain neutral.
stripe=(v[:,0]>.025*height)&(v[:,0]<.047*height)&(normY>.68)&(normY<.775)&(v[:,2]>.05*height)
rgb[stripe]=[.45,.12,.09]
visor=(v[:,1]>head[1]+crown*.10)&(v[:,1]<head[1]+crown*.65)&(v[:,2]>head[2]+height*.035)
rgb[visor]=[.006,.008,.012]
rgb=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
if len(palette)==8:palette.append(('TripoOriginal',[1,1,1,1]))
idx=f.reshape(-1)
models['player_lod0']=[dict(name='Tripo_Original',material=8,position=enc(posed[idx]),normal=enc(normal[idx]),color=enc(rgb[idx]),joints=enc(js[idx],'<u2'),weights=enc(ws[idx]),vertices=len(idx))]
report['player_lod0']=len(f)
(OUT/'tripo-conversion.json').write_text(json.dumps(dict(source='Tripo-Lowpoly-original.glb',sourceSHA256=hashlib.sha256((SRC/'Tripo-Lowpoly-original.glb').read_bytes()).hexdigest(),sourceTriangles=len(f),outputTriangles=len(f),sourceVertices=len(v),decimation=False,smoothSourceNormals=True,vertexColors=True,sourceBones=len(names),targetBones=len(boneNames),weightTransfer='repaired skin from registered reference triangles -> bone-name mapping; no geometry reduction',sourceTexturesRetainedInRuntime=False,bindBounds=[posed.min(0).tolist(),posed.max(0).tolist()],bones=audit),indent=2))
print('Tripo player:',len(f),'original triangles, repaired skin, source normals, solid material')
