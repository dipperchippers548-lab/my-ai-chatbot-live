import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
mode, out = argv[0], argv[1]
frames = [int(x) for x in argv[2].split(",")] if len(argv) > 2 else None
scn = bpy.context.scene

bpy.ops.mesh.primitive_plane_add(size=40)
g = bpy.context.object; gm = bpy.data.materials.new("g"); gm.use_nodes = True
gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.3, 0.28, 0.26, 1)
gm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
g.data.materials.append(gm)
# back wall
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 4, 10), rotation=(math.radians(90), 0, 0))
wl = bpy.context.object; wm = bpy.data.materials.new("w"); wm.use_nodes = True
wm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.6, 0.66, 1)
wl.data.materials.append(wm)

bpy.ops.object.empty_add(location=(0, 0, 1.12)); tgt = bpy.context.object
cd = bpy.data.cameras.new("c"); cd.lens = 45
cam = bpy.data.objects.new("c", cd); scn.collection.objects.link(cam); scn.camera = cam
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
cam.location = (0.6, -2.6, 1.5); cam.keyframe_insert("location", frame=scn.frame_start)
cam.location = (0.35, -2.1, 1.45); cam.keyframe_insert("location", frame=scn.frame_end)  # slow push-in
cd.dof.use_dof = mode == "final"; cd.dof.focus_object = tgt; cd.dof.aperture_fstop = 2.8

sd = bpy.data.lights.new("key", 'AREA'); sd.energy = 600; sd.size = 2.5
key = bpy.data.objects.new("key", sd); scn.collection.objects.link(key)
key.location = (-2.2, -2.5, 3.0); key.rotation_euler = (math.radians(55), 0, math.radians(-40))
rd = bpy.data.lights.new("rim", 'AREA'); rd.energy = 300; rd.size = 1.5
rim = bpy.data.objects.new("rim", rd); scn.collection.objects.link(rim)
rim.location = (2.0, 1.8, 2.6); rim.rotation_euler = (math.radians(-55), 0, math.radians(-140))
w = bpy.data.worlds.new("w"); scn.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.6, 0.65, 0.72, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.6

r = scn.render
r.resolution_x, r.resolution_y = 540, 960
if mode == "preview":
    r.engine = 'BLENDER_WORKBENCH'; scn.display.shading.color_type = 'MATERIAL'
else:
    r.engine = 'CYCLES'; scn.cycles.device = 'CPU'; scn.cycles.samples = 16
    scn.cycles.use_denoising = True; scn.cycles.max_bounces = 6
    scn.view_settings.view_transform = 'AgX'
    try: scn.view_settings.look = 'AgX - Medium High Contrast'
    except Exception: pass
r.image_settings.file_format = 'PNG'
if frames:
    for f in frames:
        scn.frame_set(f); r.filepath = f"{out}{f:04d}"; bpy.ops.render.render(write_still=True)
else:
    r.filepath = out; bpy.ops.render.render(animation=True)
print("DONE")
