import bpy, sys, math
out = sys.argv[sys.argv.index("--")+1]
scn = bpy.context.scene
rig = [o for o in scn.objects if o.type=='ARMATURE'][0]
cd = bpy.data.cameras.new("c"); cd.lens = 85
cam = bpy.data.objects.new("c", cd); scn.collection.objects.link(cam); scn.camera = cam
bpy.ops.object.empty_add(); tgt = bpy.context.object
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis='TRACK_NEGATIVE_Z'; c.up_axis='UP_Y'
ld = bpy.data.lights.new("k",'AREA'); ld.energy=150; ld.size=1.5
L = bpy.data.objects.new("k", ld); scn.collection.objects.link(L)
w = bpy.data.worlds.new("w"); scn.world=w; w.use_nodes=True; w.node_tree.nodes["Background"].inputs[0].default_value=(0.6,0.65,0.7,1)
r = scn.render; r.engine='CYCLES'; scn.cycles.samples=16; scn.cycles.use_denoising=True; r.resolution_x=r.resolution_y=360
scn.view_settings.view_transform='AgX'
for f in (1, 40, 100, 160, 229):
    scn.frame_set(f)
    hp = rig.matrix_world @ rig.pose.bones["Head"].tail
    hh = rig.matrix_world @ rig.pose.bones["Head"].head
    tgt.location = (hh + hp)/2; cam.location = tgt.location + __import__('mathutils').Vector((0.15,-1.1,0.03))
    L.location = tgt.location + __import__('mathutils').Vector((-0.8,-1.0,0.6)); L.rotation_euler=(math.radians(60),0,math.radians(-40))
    r.filepath = f"{out}{f:04d}"; bpy.ops.render.render(write_still=True)
