"""Bake Atlas glTF transforms into ship-local geometry; retain named moving parts."""
import json,struct,base64,pathlib
import numpy as np
from scipy.spatial.transform import Rotation
root=pathlib.Path(__file__).parent
b=(root/'assets/Atlas_v3.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);binary=b[28+n:]
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];d=np.dtype(dtype);return np.ndarray((a['count'],size),dtype=d,buffer=binary,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',d.itemsize*size),d.itemsize)).copy()
parents={c:i for i,n in enumerate(g['nodes']) for c in n.get('children',[])}
def matrix(i):
 n=g['nodes'][i];m=np.eye(4)
 if 'matrix' in n:m=np.array(n['matrix']).reshape(4,4).T
 else:
  m[:3,:3]=Rotation.from_quat(n.get('rotation',[0,0,0,1])).as_matrix()@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0])
 return matrix(parents[i])@m if i in parents else m
basis=np.diag([-2.,2.,-2.,1.]);basis[1,3]=.33
nodes=[]
for i,n in enumerate(g['nodes']):
 m=basis@matrix(i);item={'name':n['name'],'origin':m[:3,3].tolist(),'parts':[]}
 for p in g['meshes'][n['mesh']]['primitives'] if 'mesh' in n else []:
  pos=acc(p['attributes']['POSITION']);pos=pos@m[:3,:3].T+m[:3,3];norm=acc(p['attributes']['NORMAL'])@np.linalg.inv(m[:3,:3]);norm/=np.linalg.norm(norm,axis=1)[:,None];index=acc(p['indices']).flatten() if 'indices' in p else np.arange(len(pos));
  def enc(x):return base64.b64encode(np.asarray(x,dtype='<f4').tobytes()).decode()
  item['parts'].append({'p':enc(pos[index]),'n':enc(norm[index]),'mat':p.get('material',0)})
 nodes.append(item)
(root/'src/generated/atlas_asset.js').write_text('const ATLAS_ASSET='+json.dumps({'nodes':nodes,'materials':g['materials']},separators=(',',':'))+';\n',encoding='utf-8')
print('Imported',len(nodes),'nodes')
