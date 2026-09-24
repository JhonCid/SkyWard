"""Reproducible CC0 mannequin adaptation + custom modular explorer armor.
Run with Python 3, numpy and scipy. Never edits the original UAL files.
Coordinates and bind matrices stay in the original glTF rig space (Y up, +Z front).
"""
from pathlib import Path
import json, struct, base64, copy, hashlib
import numpy as np
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters'
SRC=OUT/'source'

class GLB:
    def __init__(self,path):
        raw=Path(path).read_bytes(); n=struct.unpack_from('<I',raw,12)[0]
        self.j=json.loads(raw[20:20+n]); self.bin=raw[28+n:]
    def acc(self,i):
        a=self.j['accessors'][i];v=self.j['bufferViews'][a['bufferView']]
        dtype={5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]
        width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
        size=np.dtype(dtype).itemsize
        return np.ndarray((a['count'],width),dtype=dtype,buffer=self.bin,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',size*width),size)).copy()

male=GLB(SRC/'UAL1_Standard.glb'); female=GLB(SRC/'Mannequin_F.glb')
nodes=male.j['nodes']; joints=male.j['skins'][0]['joints']
boneNames=[nodes[i]['name'] for i in joints]; boneIndex={n:i for i,n in enumerate(boneNames)}
parents={c:i for i,n in enumerate(nodes) for c in n.get('children',[])}
ibm=male.acc(male.j['skins'][0]['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
bind=np.linalg.inv(ibm)
def enc(a,dtype='<f4'):
    return base64.b64encode(np.asarray(a,dtype=dtype).tobytes()).decode()
def source_mesh(src):
    positions=[]; skin=[]; weights=[]; faces=[];offset=0
    ownNames=[src.j['nodes'][i]['name'] for i in src.j['skins'][0]['joints']]
    remap=np.array([boneIndex[n] for n in ownNames])
    ownIBM=src.acc(src.j['skins'][0]['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
    for p in src.j['meshes'][0]['primitives']:
        a=p['attributes'];v=src.acc(a['POSITION']);sk=src.acc(a['JOINTS_0']);w=src.acc(a['WEIGHTS_0'])
        if src is female:
            # Transfer female surface into the common male bind pose; retain her proportions.
            vh=np.c_[v,np.ones(len(v))]; result=np.zeros_like(vh)
            for k in range(4):
                mats=bind[remap[sk[:,k]]]@ownIBM[sk[:,k]]
                result+=np.einsum('nij,nj->ni',mats,vh)*w[:,k,None]
            v=result[:,:3]
        positions.append(v);skin.append(remap[sk]);weights.append(w)
        faces.append(src.acc(p['indices']).reshape(-1,3)+offset);offset+=len(v)
    return np.concatenate(positions),np.concatenate(skin),np.concatenate(weights),np.concatenate(faces)

def simplify(v,sk,w,f,cell):
    # Deterministic spatial clustering; keep weighted skin influences, remove degenerate faces.
    keys=np.floor(v/cell+.5).astype(int)
    _,inv=np.unique(keys,axis=0,return_inverse=True);count=np.bincount(inv);nv=np.zeros((len(count),3))
    np.add.at(nv,inv,v);nv/=count[:,None]
    influences=np.zeros((len(count),len(joints)))
    for k in range(4): np.add.at(influences,(inv,sk[:,k]),w[:,k])
    ns=np.argsort(influences,axis=1)[:,-4:][:,::-1];nw=np.take_along_axis(influences,ns,axis=1);nw/=nw.sum(1)[:,None]
    nf=inv[f];nf=nf[(nf[:,0]!=nf[:,1])&(nf[:,1]!=nf[:,2])&(nf[:,0]!=nf[:,2])]
    _,unique=np.unique(np.sort(nf,axis=1),axis=0,return_index=True);nf=nf[np.sort(unique)]
    return nv,ns,nw,nf

def ellipsoid(center,radii,segments=12,rings=6,start=0,end=np.pi):
    v=[];f=[]
    for i in range(rings+1):
        t=start+(end-start)*i/rings
        for k in range(segments):
            a=2*np.pi*k/segments;v.append(np.array(center)+np.array(radii)*[np.sin(t)*np.cos(a),np.cos(t),np.sin(t)*np.sin(a)])
    for i in range(rings):
        for k in range(segments):
            a=i*segments+k;b=i*segments+(k+1)%segments;c=b+segments;d=a+segments
            f.extend([[a,b,d],[b,c,d]])
    # Counter-clockwise exterior winding (Y-up sphere).
    return np.array(v),np.array(f)

def plate(center,size,bevel=.18):
    x,y,z=np.asarray(size)/2
    outline=[(-x*(1-bevel),-y),(x*(1-bevel),-y),(x,-y*(1-bevel)),(x,y*(1-bevel)),(x*(1-bevel),y),(-x*(1-bevel),y),(-x,y*(1-bevel)),(-x,-y*(1-bevel))]
    v=np.array([[a,b,c] for c in [-z,z] for a,b in outline])+center;f=[]
    for i in range(1,7):f.extend([[0,i+1,i],[8,8+i,8+i+1]])
    for i in range(8):j=(i+1)%8;f.extend([[i,j,8+i],[j,8+j,8+i]])
    return v,np.array(f)

def shield(points,depth=.025):
    front=np.array(points);back=front.copy();back[:,2]-=depth;v=np.r_[front,back];n=len(points);f=[]
    for i in range(1,n-1):f.extend([[0,i,i+1],[n,n+i+1,n+i]])
    for i in range(n):j=(i+1)%n;f.extend([[i,n+i,j],[j,n+i,n+j]])
    return v,np.array(f)

palette=[('Fabric',[.075,.105,.13,1]),('Armor',[.25,.33,.38,1]),('Metal',[.43,.49,.52,1]),('Accent',[.67,.19,.12,1]),('Visor',[.006,.008,.012,1]),('Light',[.22,.8,.9,1]),('Skin',[.58,.35,.23,1]),('Hair',[.075,.035,.02,1])]
models={};report={}
def make_model(sex,lod,cell,helmet=False,player=False):
    v,sk,w,f=source_mesh(male if sex=='male' else female)
    if player:
        # Modest muscle volume around each limb's bind axis, preserving the rig.
        main=sk[np.arange(len(sk)),np.argmax(w,axis=1)]
        for bone in ['upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','thigh_l','thigh_r','calf_l','calf_r']:
            idx=main==boneIndex[bone];axis=0 if 'arm' in bone else 1
            for dim in range(3):
                if dim!=axis:v[idx,dim]=bind[boneIndex[bone],dim,3]+(v[idx,dim]-bind[boneIndex[bone],dim,3])*1.12
    # Fit the undersuit to the chest plate; preserve limbs and original weights.
    chest=(v[:,1]>1.24)&(v[:,1]<1.44)&(np.abs(v[:,0])<.175)&(v[:,2]>.121)
    v[chest,2]=.121
    tree=cKDTree(v);sv,ss,sw,sf=simplify(v,sk,w,f,cell)
    # Remove source head: new low-poly head/helmet has no eyes or mouth.
    center=sv[sf].mean(1);sf=sf[center[:,1]<1.56]
    pieces=[]
    def add(name,verts,faces,material,bone=None):
        if bone:
            js=np.zeros((len(verts),4),int);js[:,0]=boneIndex[bone];ws=np.zeros((len(verts),4));ws[:,0]=1
        else:
            _,near=tree.query(verts);js=sk[near];ws=w[near]
        # Remove zero-area triangles (ellipsoid poles).
        area=np.linalg.norm(np.cross(verts[faces[:,1]]-verts[faces[:,0]],verts[faces[:,2]]-verts[faces[:,0]]),axis=1)
        faces=faces[area>1e-9]
        pieces.append(dict(name=name,p=verts,s=js,w=ws,f=faces,material=material))
    pieces.append(dict(name='Suit',p=sv,s=ss,w=sw,f=sf,material=0))
    detail=lod==0;mid=lod<=1
    # Retain the anatomical silhouette of the supplied mannequin instead of spheres.
    source_head=f[v[f].mean(1)[:,1]>=1.56]
    hv,hs,hw,hf=simplify(v,sk,w,source_head,.016 if detail else .04 if mid else .055)
    head_center=np.array([0,1.69,.005])
    if helmet:
        shell=head_center+(hv-head_center)*[1.065,1.035,1.075]
        centers=shell[hf].mean(1)
        visor=(centers[:,1]>1.67)&(centers[:,1]<1.755)&(centers[:,2]>.045)
        add('Helmet',shell,hf[~visor],1,'Head')
        add('Visor',shell,hf[visor],4,'Head')
    else:
        add('Head',hv,hf,6,'Head')
        centers=hv[hf].mean(1)
        for style,(hairline,volume) in enumerate([(1.75,1.025),(1.735,1.045),(1.77,1.012)]):
            cap=head_center+(hv-head_center)*[volume,volume,volume]
            mask=(centers[:,1]>hairline)|((centers[:,2]<-.025)&(centers[:,1]>hairline-.085))
            add('Hair_'+str(style),cap,hf[mask],7,'Head')
    if mid:
        width=.32 if sex=='male' else .295
        for side in [-1,1]:
            points=[[side*.013,1.426,.151],[side*width*.47,1.426,.15],[side*width*.55,1.335,.177],[side*width*.36,1.238,.156],[side*.013,1.267,.172]]
            if side==1:points.reverse()
            add('Chest',*shield(points,.014),1,'spine_03')
        add('ChestStripe',*shield([[.08,1.43,.159],[.105,1.43,.159],[.125,1.337,.186],[.09,1.254,.164],[.073,1.263,.166],[.102,1.34,.187]],.008),3,'spine_03')
        add('Abdomen',*plate([0,1.142,.103],[.22,.09,.018]),1,'spine_01')
        add('Belt',*plate([0,.988,.102],[.245,.045,.028]),2,'pelvis')
        for side,label in [(1,'l'),(-1,'r')]:
            add('Shoulder_'+label,*ellipsoid([side*.244,1.458,-.067],[.084,.076,.096],10 if detail else 8,5 if detail else 3),1,'upperarm_'+label)
            add('Forearm_'+label,*ellipsoid([side*.579,1.455,-.045],[.09,.052,.058],10 if detail else 8,4 if detail else 3),1,'lowerarm_'+label)
            add('Thigh_'+label,*plate([side*.105,.742,.081],[.125,.205,.022]),1,'thigh_'+label)
            add('Knee_'+label,*plate([side*.089,.533,.067],[.106,.075,.025]),2,'calf_'+label)
            add('Shin_'+label,*plate([side*.089,.337,.062],[.093,.208,.022]),1,'calf_'+label)
            add('Boot_'+label,*ellipsoid([side*.089,.087,.075],[.062,.059,.116],10 if detail else 8,4 if detail else 3),1,'foot_'+label)
            if player:
                add('WristLight_'+label,*plate([side*.676,1.453,.001],[.025,.047,.015]),5,'lowerarm_'+label)
        if player:
            add('Jetpack',*plate([0,1.286,-.161],[.25,.32,.105]),1,'spine_03')
            add('PackCenter',*plate([0,1.29,-.221],[.055,.258,.022]),2,'spine_03')
            for side in [-1,1]:
                add('Thruster',*plate([side*.1,1.118,-.163],[.065,.089,.078]),2,'spine_03')
                add('JetLight',*plate([side*.1,1.072,-.163],[.045,.012,.053]),5,'spine_03')
        else:
            add('Accessory_bag',*plate([.175,.944,-.013],[.12,.18,.14]),2,'pelvis')
            add('Accessory_tool',*plate([-.164,.943,.085],[.045,.17,.045]),3,'pelvis')
            add('Accessory_pack',*plate([0,1.275,-.155],[.23,.28,.115]),1,'spine_03')
    # Portable vertex streams with flat normals calculated per face; shared by every instance.
    output=[]
    for p in pieces:
        idx=p['f'].reshape(-1);pos=p['p'][idx];norm=np.cross(pos[1::3]-pos[::3],pos[2::3]-pos[::3]);norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-12);norm=np.repeat(norm,3,axis=0)
        output.append(dict(name=p['name'],material=p['material'],position=enc(pos),normal=enc(norm),joints=enc(p['s'][idx],'<u2'),weights=enc(p['w'][idx]),vertices=len(idx)))
    name=('player' if player else sex)+('_helmet' if helmet and not player else '')+'_lod'+str(lod)
    models[name]=output;report[name]=sum(p['vertices']//3 for p in output if (not p['name'].startswith('Hair_') or p['name']=='Hair_0') and not p['name'].startswith('Accessory_'))

make_model('male',0,.019,True,True)
for sex in ['male','female']:
    for lod,cell in [(0,.029),(1,.09),(2,.105)]:
        make_model(sex,lod,cell)
    for lod,cell in [(0,.029),(1,.09),(2,.105)]:make_model(sex,lod,cell,True)

exec(compile((ROOT/'tools/prepare_tripo_player.py').read_text(),str(ROOT/'tools/prepare_tripo_player.py'),'exec'))

animations=[];seen=set();catalog=[]
for filename in ['UAL1_Standard.glb','UAL2_Standard.glb']:
    src=GLB(SRC/filename)
    for a in src.j.get('animations',[]):
        if a['name'] in seen:continue
        seen.add(a['name']);tracks=[];duration=0
        for c in a['channels']:
            sampler=a['samplers'][c['sampler']];target=c['target'];name=src.j['nodes'][target['node']]['name'];prop=target['path']
            if name not in boneIndex:continue
            values=src.acc(sampler['output']);times=src.acc(sampler['input']).flatten();duration=max(duration,float(times[-1]))
            # Keep original samples; collapse repeated constant channels only (lossless tolerance).
            if np.max(np.abs(values-values[0]))<1e-6: values=values[:1];times=times[:1]
            elif len(times)>2:
                # Error-bounded key reduction at all original sample times.
                tolerance=.0015 if prop=='rotation' else .0003 if prop=='translation' else .00001
                if prop=='rotation':
                    for k in range(1,len(values)):
                        if np.dot(values[k-1],values[k])<0:values[k]*=-1
                keep={0,len(times)-1};stack=[(0,len(times)-1)]
                while stack:
                    lo,hi=stack.pop()
                    if hi-lo<2:continue
                    t=((times[lo+1:hi]-times[lo])/(times[hi]-times[lo]))[:,None]
                    predicted=values[lo]+t*(values[hi]-values[lo])
                    if prop=='rotation':predicted/=np.linalg.norm(predicted,axis=1)[:,None]
                    error=np.linalg.norm(values[lo+1:hi]-predicted,axis=1);k=int(np.argmax(error))
                    if error[k]>tolerance:
                        split=lo+1+k;keep.add(split);stack.extend([(lo,split),(split,hi)])
                keep=sorted(keep);values=values[keep];times=times[keep]
            tracks.append(dict(bone=name,path=prop,times=enc(times),values=enc(values),interpolation=sampler.get('interpolation','LINEAR')))
        animations.append(dict(name=a['name'],duration=duration,tracks=tracks));catalog.append(dict(name=a['name'],duration=round(duration,3),source=filename,rootMotion=False))

boneData=[]
for i in joints:
    n=nodes[i];p=parents.get(i)
    boneData.append(dict(name=n['name'],parent=boneIndex.get(nodes[p]['name'],-1) if p is not None else -1,translation=n.get('translation',[0,0,0]),rotation=n.get('rotation',[0,0,0,1]),scale=n.get('scale',[1,1,1])))
parts={};packedModels={}
for model,entries in models.items():
    packedModels[model]=[]
    for p in entries:
        digest=hashlib.sha256(json.dumps(p,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:20]
        parts[digest]=p;packedModels[model].append(digest)
asset=dict(bones=boneData,inverseBind=enc(ibm.transpose(0,2,1)),palette=palette,models=packedModels,parts=parts,animations=animations,scale=1.8/1.849)
(ROOT/'src/generated/characters.js').write_text('const CHARACTER_ASSET='+json.dumps(asset,separators=(',',':'))+';\n')
(OUT/'catalog.json').write_text(json.dumps(catalog,indent=2))
(OUT/'report.json').write_text(json.dumps(dict(triangles=report,bones=len(joints),uniqueClips=len(animations),motionClips=len(animations)-1,scale=asset['scale']),indent=2))

def write_glb(modelName,destination,include_anims=False):
    doc=dict(asset={'version':'2.0','generator':'SkyWard reproducible character pipeline'},scene=0,scenes=[{'nodes':[0]}],nodes=[{'name':'SkyWard','children':[]}],meshes=[],skins=[],materials=[],buffers=[{'byteLength':0}],bufferViews=[],accessors=[])
    buffer=bytearray()
    def accessor(raw,ctype,typ,count):
        while len(buffer)%4:buffer.append(0)
        index=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':len(buffer),'byteLength':len(raw)});buffer.extend(raw)
        a={'bufferView':index,'componentType':ctype,'count':count,'type':typ}
        if typ=='VEC3' and ctype==5126:
            v=np.frombuffer(raw,dtype='<f4').reshape(-1,3);a.update(min=v.min(0).tolist(),max=v.max(0).tolist())
        doc['accessors'].append(a);return len(doc['accessors'])-1
    for i,b in enumerate(boneData):
        node={k:copy.deepcopy(b[k]) for k in ['name','translation','rotation','scale']};doc['nodes'].append(node)
    for i,b in enumerate(boneData):doc['nodes'][b['parent']+1 if b['parent']>=0 else 0].setdefault('children',[]).append(i+1)
    doc['skins'].append({'name':'UAL_shared_rig','joints':list(range(1,len(joints)+1)),'inverseBindMatrices':accessor(base64.b64decode(asset['inverseBind']),5126,'MAT4',len(joints))})
    for name,col in (palette if modelName=='player_lod0' else palette[:8]):
        if modelName=='player_lod0':
            col=dict(Fabric=[34/255,38/255,43/255,1],Armor=[83/255,86/255,96/255,1],Accent=[156/255,35/255,64/255,1]).get(name,col)
        linear=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in col[:3]]+[1]
        doc['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':linear,'metallicFactor':.45 if name in ['Metal','Visor'] else .05,'roughnessFactor':.23 if name=='Visor' else .8},'doubleSided':False})
    for p in models[modelName]:
        if p['name'].startswith('Hair_') and p['name']!='Hair_0':continue
        if p['name'].startswith('Accessory_'):continue
        attrs={}
        for field,semantic,ctype,typ in [('position','POSITION',5126,'VEC3'),('normal','NORMAL',5126,'VEC3'),('joints','JOINTS_0',5123,'VEC4'),('weights','WEIGHTS_0',5126,'VEC4')]:attrs[semantic]=accessor(base64.b64decode(p[field]),ctype,typ,p['vertices'])
        if 'color' in p:attrs['COLOR_0']=accessor(base64.b64decode(p['color']),5126,'VEC3',p['vertices'])
        doc['meshes'].append({'name':p['name'],'primitives':[{'attributes':attrs,'material':p['material']}]})
        doc['nodes'][0]['children'].append(len(doc['nodes']));doc['nodes'].append({'name':p['name'],'mesh':len(doc['meshes'])-1,'skin':0})
    if include_anims:
        doc['animations']=[]
        for a in animations:
            entry={'name':a['name'],'samplers':[],'channels':[]}
            for t in a['tracks']:
                raw=base64.b64decode(t['times']);out=base64.b64decode(t['values']);typ='VEC4' if t['path']=='rotation' else 'VEC3';s={'input':accessor(raw,5126,'SCALAR',len(raw)//4),'output':accessor(out,5126,typ,len(out)//(16 if typ=='VEC4' else 12)),'interpolation':t['interpolation']};entry['channels'].append({'sampler':len(entry['samplers']),'target':{'node':boneIndex[t['bone']]+1,'path':t['path']}});entry['samplers'].append(s)
            doc['animations'].append(entry)
    doc['buffers'][0]['byteLength']=len(buffer);raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);buffer+=b'\0'*((-len(buffer))%4)
    destination.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(raw)+8+len(buffer))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(buffer),0x004e4942)+buffer)

write_glb('player_lod0',OUT/'Explorer-Male.glb',True)
write_glb('female_lod0',OUT/'NPC-Female.glb')
write_glb('male_lod0',OUT/'NPC-Male.glb')
print(json.dumps(report,indent=2));print('Shared rig:',len(joints),'bones;',len(animations),'unique clips')
