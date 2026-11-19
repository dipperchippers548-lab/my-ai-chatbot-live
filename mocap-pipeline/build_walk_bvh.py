import bpy, sys, os, math
from mathutils import Matrix, Vector, Quaternion
from bl_ext.blender_org.mpfb.services.humanservice import HumanService

D = "/root/.config/blender/5.2/extensions/.user/blender_org/mpfb/data"
BVH = "/root/mocap/02_01.bvh"
OUT = "/root/work/walk.blend"

# clean scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for a in ("io_anim_bvh",):
    try: bpy.ops.preferences.addon_enable(module=a)
    except Exception as e: print("addon", e)

# ---------- character ----------
macro = {"gender": 1.0, "age": 0.42, "muscle": 0.6, "weight": 0.5, "proportions": 0.6,
         "height": 0.55, "cupsize": 0.5, "firmness": 0.5,
         "race": {"african": 0.8, "asian": 0.05, "caucasian": 0.15}}
body = HumanService.create_human(macro_detail_dict=macro)
rig = HumanService.add_builtin_rig(body, "cmu_mb")
HumanService.set_character_skin(f"{D}/skins/young_african_male/young_african_male.mhmat", body)
def add(p, t):
    try: HumanService.add_mhclo_asset(p, body, asset_type=t, subdiv_levels=0)
    except Exception as e: print("ASSET FAIL", p, e)
add(f"{D}/eyes/high-poly/high-poly.mhclo", "Eyes")
add(f"{D}/eyebrows/eyebrow001/eyebrow001.mhclo", "Eyebrows")
add(f"{D}/eyelashes/eyelashes01/eyelashes01.mhclo", "Eyelashes")
add(f"{D}/hair/short02/short02.mhclo", "Hair")
add(f"{D}/clothes/male_casualsuit04/male_casualsuit04.mhclo", "Clothes")
add(f"{D}/clothes/shoes02/shoes02.mhclo", "Clothes")
# smooth the body a little
m = body.modifiers.new("Subsurf", "SUBSURF"); m.levels = 1; m.render_levels = 1

# ---------- mocap retarget ----------
bpy.ops.import_anim.bvh(filepath=BVH, axis_forward='-Z', axis_up='Y', rotate_mode='NATIVE', update_scene_fps=False, update_scene_duration=False)
src = bpy.context.object
sf, ef = int(src.animation_data.action.frame_range[0]), int(src.animation_data.action.frame_range[1])
print("SRC frames", sf, ef)

scn = bpy.context.scene
dw = rig.matrix_world
sw = src.matrix_world

def rest_w(arm, name):
    return arm.matrix_world @ arm.data.bones[name].matrix_local

names = [b.name for b in rig.data.bones if b.name in src.data.bones]
missing = [b.name for b in rig.data.bones if b.name not in src.data.bones]
print("MAPPED", len(names), "MISSING", missing)

# scale: hip height
scn.frame_set(sf)
src_hip_rest = rest_w(src, "Hips").to_translation()
dst_hip_rest = rest_w(rig, "Hips").to_translation()
def leglen(arm):
    a = arm.matrix_world @ arm.data.bones["LeftUpLeg"].head_local
    b = arm.matrix_world @ arm.data.bones["LeftFoot"].head_local
    return (a - b).length
k = leglen(rig) / leglen(src)
print("scale", k, src_hip_rest, dst_hip_rest)

# swing correction per bone: rotation mapping dest rest direction -> src rest direction (world)
corr = {}
for n in names:
    rs = rest_w(src, n).to_3x3().normalized(); rd = rest_w(rig, n).to_3x3().normalized()
    ds = (rs @ Vector((0, 1, 0))).normalized(); dd = (rd @ Vector((0, 1, 0))).normalized()
    C = dd.rotation_difference(ds).to_matrix()
    corr[n] = rs.inverted() @ C @ rd  # applied: P = Rs_pose @ corr

# order bones parent-first
order = []
def walk(b):
    order.append(b)
    for c in b.children: walk(c)
for b in rig.data.bones:
    if b.parent is None: walk(b)

step = 4  # 120 fps -> 30 fps
fcount = 0
start_xy = None
for i, f in enumerate(range(sf, ef + 1, step)):
    scn.frame_set(f)
    posed = {}
    for b in order:
        pb = rig.pose.bones[b.name]
        rest = dw @ b.matrix_local
        if b.parent:
            prest = dw @ b.parent.matrix_local
            rel = prest.inverted() @ rest
            ppose = posed[b.parent.name]
            target_loc = (ppose @ rel).to_translation()
        else:
            rel = None
            target_loc = rest.to_translation()
        if b.name in names:
            sp = sw @ src.pose.bones[b.name].matrix
            R = sp.to_3x3().normalized() @ corr[b.name]
            if b.parent is None or b.name == "Hips":
                hl = sp.to_translation()
                if start_xy is None: start_xy = Vector((hl.x, hl.y))
                target_loc = Vector(((hl.x - start_xy.x) * k, (hl.y - start_xy.y) * k, hl.z * k))
        else:
            R = (posed[b.parent.name] @ rel).to_3x3().normalized() if b.parent else rest.to_3x3().normalized()
        P = Matrix.Translation(target_loc) @ R.to_4x4()
        posed[b.name] = P
        base = (rel.inverted() @ posed[b.parent.name].inverted() @ P) if b.parent else (rest.inverted() @ P)
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = base.to_quaternion()
        pb.keyframe_insert("rotation_quaternion", frame=i + 1)
        if b.parent is None or b.name == "Hips":
            pb.location = base.to_translation()
            pb.keyframe_insert("location", frame=i + 1)
    fcount = i + 1

bpy.data.objects.remove(src, do_unlink=True)
scn.frame_start, scn.frame_end = 1, fcount
scn.render.fps = 30
print("FRAMES", fcount)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print("SAVED")
