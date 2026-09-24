"""Blender companion: import generated models, validate vertex groups, save editable .blend.
Run: blender --background --python tools/blender_characters.py
First run tools/prepare_characters.py with Python + numpy + scipy.
This companion is provided for reproducibility; its execution status is in VALIDACAO.md.
"""
from pathlib import Path
import bpy

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/characters'
bpy.ops.wm.read_factory_settings(use_empty=True)
for filename,offset in [('Explorer-Male.glb',0),('NPC-Male.glb',2.5),('NPC-Female.glb',5)]:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS/filename))
    added=set(bpy.data.objects)-before
    collection=bpy.data.collections.new(filename.removesuffix('.glb'))
    bpy.context.scene.collection.children.link(collection)
    for obj in added:
        # glTF importer also creates internal custom-bone display meshes.
        if obj.type=='MESH' and obj.find_armature() is None:continue
        for old in list(obj.users_collection):old.objects.unlink(obj)
        collection.objects.link(obj)
        if obj.parent is None:obj.location.x+=offset
        if obj.type=='MESH':
            for face in obj.data.polygons:face.use_smooth=(filename=='Explorer-Male.glb')
            if len(obj.vertex_groups)==0:raise RuntimeError('Mesh without skin groups: '+obj.name)
bpy.context.scene.unit_settings.system='METRIC'
bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS/'SkyWard-Characters.blend'))
print('Saved editable character source:',ASSETS/'SkyWard-Characters.blend')
