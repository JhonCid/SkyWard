"""Render a review sheet from the editable Blender scene, with real imported skinning."""
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/characters/SkyWard-Characters.blend'))
for obj in bpy.data.objects:
    if obj.type=='ARMATURE':
        obj.animation_data_create()
        for track in obj.animation_data.nla_tracks:track.mute=True
        obj.animation_data.action=bpy.data.actions.get('Idle_Loop_SkyWard')
        width=1
        obj.scale=(width*1.8/1.849,width*1.8/1.849,1.8/1.849)
scene=bpy.context.scene;scene.frame_set(15)
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
if scene.world is None:scene.world=bpy.data.worlds.new('Preview World')
scene.world.color=(.12,.15,.19)
bpy.ops.mesh.primitive_plane_add(size=200,location=(2.5,0,-.015));floor=bpy.context.object
mat=bpy.data.materials.new('Preview floor');mat.diffuse_color=(.022,.033,.048,1);floor.data.materials.append(mat)
for name,position,power,size in [('Key',(-1,-4,6),1600,5),('Fill',(6,-2,4),1000,4),('Rim',(2,3,5),1800,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    light=bpy.data.objects.new(name,data);scene.collection.objects.link(light);light.location=position;light.rotation_euler=(Vector((2.5,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5,-10,3.4));camera=bpy.context.object;camera.rotation_euler=(Vector((2.5,0,.95))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=7;scene.camera=camera
scene.render.resolution_x=1600;scene.render.resolution_y=780;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'docs/character-review.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/characters/SkyWard-Characters.blend'))
