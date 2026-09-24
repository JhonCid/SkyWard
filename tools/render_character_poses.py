"""CPU-only visual audit of the actual skinned vertices exported by character_assets.js.
This is not a screenshot from the game and does not validate WebGL/shaders.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
def render(parts,width=560,height=660):
    image=np.zeros((height,width,3),dtype=np.uint8);image[:]=[21,30,39];depth=np.full((height,width),-np.inf)
    forward=np.array([2.,.7,-4.]);forward/=np.linalg.norm(forward);right=np.cross([0,1,0],forward);right/=np.linalg.norm(right);up=np.cross(forward,right)
    center=np.array([0,.92,0]);scale=280
    light=np.array([-2,4,-3]);light=light/np.linalg.norm(light)
    for part in parts:
        v=np.array(part['vertices']);normal=np.cross(v[1::3]-v[::3],v[2::3]-v[::3]);normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-10)
        shade=.32+.68*np.maximum(0,normal@light);color=(np.clip(np.array(part['color'])[None,:]*shade[:,None],0,1)**(1/2.2)*255).astype(np.uint8)
        smooth=np.array(part['normals']).reshape(-1,3,3) if part.get('normals') else None
        vertexColors=np.array(part['colors']).reshape(-1,3,3) if part.get('colors') else None
        rel=v-center;screen=np.c_[width/2+rel@right*scale,height/2-rel@up*scale,rel@forward]
        for k,tri in enumerate(screen.reshape(-1,3,3)):
            if normal[k]@forward<=0:continue # Match Three.js FrontSide culling.
            x0=max(0,int(np.floor(tri[:,0].min())));x1=min(width-1,int(np.ceil(tri[:,0].max())));y0=max(0,int(np.floor(tri[:,1].min())));y1=min(height-1,int(np.ceil(tri[:,1].max())))
            if x0>x1 or y0>y1:continue
            a,b,c=tri;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(den)<1e-8:continue
            x,y=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
            u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den;w=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;t=1-u-w;z=u*a[2]+w*b[2]+t*c[2]
            target=depth[y0:y1+1,x0:x1+1];mask=(u>=0)&(w>=0)&(t>=0)&(z>target);target[mask]=z[mask]
            if smooth is not None:
                n=u[:,:,None]*smooth[k,0]+w[:,:,None]*smooth[k,1]+t[:,:,None]*smooth[k,2]
                n/=np.maximum(np.linalg.norm(n,axis=2)[:,:,None],1e-10)
                lighting=.32+.68*np.maximum(0,n@light)
                rgb=np.array(part['color'])
                if vertexColors is not None:rgb=rgb*(u[:,:,None]*vertexColors[k,0]+w[:,:,None]*vertexColors[k,1]+t[:,:,None]*vertexColors[k,2])
                pixel=(np.clip(rgb*lighting[:,:,None],0,1)**(1/2.2)*255).astype(np.uint8)
                image[y0:y1+1,x0:x1+1][mask]=pixel[mask]
            else:image[y0:y1+1,x0:x1+1][mask]=color[k]
    return Image.fromarray(image)

if __name__=='__main__':
    folder=ROOT/'docs/character-poses';files=sorted(folder.glob('*.json'));sheet=Image.new('RGB',(560*len(files),700),(21,30,39));draw=ImageDraw.Draw(sheet)
    for i,f in enumerate(files):
        img=render(json.loads(f.read_text()));img.save(f.with_suffix('.png'));sheet.paste(img,(560*i,40));draw.text((560*i+20,15),f.stem,fill='white')
    sheet.save(folder/'contact-sheet.png')
