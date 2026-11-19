import bpy, json, math
from mathutils import Vector, Matrix
from bl_ext.blender_org.mpfb.services.humanservice import HumanService

D = "/root/.config/blender/5.2/extensions/.user/blender_org/mpfb/data"
POSE = "/root/work/t3/pose.json"
OUT = "/root/work/wave_face.blend"
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

macro = {"gender": 1.0, "age": 0.42, "muscle": 0.55, "weight": 0.45, "proportions": 0.6,
         "height": 0.55, "cupsize": 0.5, "firmness": 0.5,
         "race": {"african": 0.8, "asian": 0.05, "caucasian": 0.15}}
body = HumanService.create_human(macro_detail_dict=macro)
rig = HumanService.add_builtin_rig(body, "cmu_mb")
HumanService.set_character_skin(f"{D}/skins/young_african_male/young_african_male.mhmat", body)
for p, t in [("eyes/high-poly/high-poly.mhclo", "Eyes"), ("eyebrows/eyebrow001/eyebrow001.mhclo", "Eyebrows"),
             ("eyelashes/eyelashes01/eyelashes01.mhclo", "Eyelashes"), ("hair/short02/short02.mhclo", "Hair"),
             ("clothes/male_casualsuit04/male_casualsuit04.mhclo", "Clothes"), ("clothes/shoes02/shoes02.mhclo", "Clothes")]:
    try: HumanService.add_mhclo_asset(f"{D}/{p}", body, asset_type=t, subdiv_levels=0)
    except Exception as e: print("ASSET FAIL", p, e)
from bl_ext.blender_org.mpfb.services.faceservice import FaceService
FaceService.load_targets(body, load_microsoft_visemes=False, load_arkit_faceunits=True)
FaceService.interpolate_targets(body)
m = body.modifiers.new("Subsurf", "SUBSURF"); m.levels = 1; m.render_levels = 1

# ---- load + smooth landmarks ----
data = json.load(open(POSE)); src_fps = data["fps"]
frames = [f["world"] for f in data["frames"]]
N = len(frames)
def lm(i, j):
    x, y, z, v = frames[i][j]
    return Vector((x, z, -y))  # MediaPipe world -> Blender (char faces -Y)
raw = [[lm(i, j) for j in range(33)] for i in range(N)]
def smooth(seq, s=1.2):
    out = []
    k = [math.exp(-(d * d) / (2 * s * s)) for d in range(-3, 4)]
    for i in range(N):
        acc = [Vector() for _ in range(33)]; wsum = 0
        for di, w in zip(range(-3, 4), k):
            ii = min(max(i + di, 0), N - 1)
            for j in range(33): acc[j] += seq[ii][j] * w
            wsum += w
        out.append([a / wsum for a in acc])
    return out
P = smooth(raw)
def mid(a, b): return (a + b) / 2

def targets(p):
    hip = mid(p[23], p[24]); sh = mid(p[11], p[12]); ear = mid(p[7], p[8])
    t = {}
    sp = sh - hip; sp = Vector((sp.x * 0.5, sp.y * 2.2, sp.z))
    for b in ("LowerBack", "Spine", "Spine1"): t[b] = sp
    t["Neck"] = ear - sh; t["Neck1"] = ear - sh; t["Head"] = ear - sh
    t["LeftArm"] = p[13] - p[11]; t["LeftForeArm"] = p[15] - p[13]; t["LeftHand"] = mid(p[17], p[19]) - p[15]
    t["RightArm"] = p[14] - p[12]; t["RightForeArm"] = p[16] - p[14]; t["RightHand"] = mid(p[18], p[20]) - p[16]
    # head nod: tilt head toward nose
    fwd = (p[0] - ear).normalized()
    t["Head"] = (ear - sh).normalized() + (fwd - BASE_FWD) * 0.8
    return t

BASE_FWD = sum(((P[i][0] - mid(P[i][7], P[i][8])).normalized() for i in range(5)), Vector()) / 5
BASE_FWD.normalize()
dw = rig.matrix_world
order = []
def walk(b):
    order.append(b)
    for c in b.children: walk(c)
for b in rig.data.bones:
    if b.parent is None: walk(b)

scn = bpy.context.scene
scn.render.fps = 30
step = 30 / src_fps
REL = ("LowerBack", "Spine", "Spine1", "Neck", "Neck1", "Head")
T0 = targets(P[0])
for n in REL:
    T0[n] = sum((targets(P[i])[n].normalized() for i in range(4)), Vector()).normalized()
RESTDIR = {n: ((dw @ rig.data.bones[n].matrix_local).to_3x3() @ Vector((0, 1, 0))).normalized() for n in REL}
for i in range(N):
    t = targets(P[i])
    for n in REL:
        t[n] = T0[n].rotation_difference(t[n].normalized()) @ RESTDIR[n]
    posed = {}
    fr = 1 + round(i * step)
    for b in order:
        pb = rig.pose.bones[b.name]
        rest = dw @ b.matrix_local
        if b.parent:
            rel = (dw @ b.parent.matrix_local).inverted() @ rest
            chained = posed[b.parent.name] @ rel
        else:
            rel = None; chained = rest
        if b.name in t and t[b.name].length > 1e-6:
            cur = (chained.to_3x3() @ Vector((0, 1, 0))).normalized()
            q = cur.rotation_difference(t[b.name].normalized())
            R = q.to_matrix() @ chained.to_3x3()
            Pm = Matrix.Translation(chained.to_translation()) @ R.to_4x4()
        else:
            Pm = chained
        posed[b.name] = Pm
        base = (rel.inverted() @ posed[b.parent.name].inverted() @ Pm) if b.parent else (rest.inverted() @ Pm)
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = base.to_quaternion()
        pb.keyframe_insert("rotation_quaternion", frame=fr)
# ---- face expressions ----
fd = json.load(open("/root/work/t3/face.json"))["frames"]
keys = sorted({k for f in fd if f for k in f})
idx = [i for i, f in enumerate(fd) if f]
def val(i, k):
    if fd[i]: return fd[i][k]
    a = max([j for j in idx if j < i], default=None); b = min([j for j in idx if j > i], default=None)
    if a is None: return fd[b][k]
    if b is None: return fd[a][k]
    u = (i - a) / (b - a); return fd[a][k] * (1 - u) + fd[b][k] * u
series = {k: [val(i, k) for i in range(len(fd))] for k in keys}
for k in keys:  # light smoothing
    v = series[k]; series[k] = [(v[max(i-1,0)] + 2*v[i] + v[min(i+1,len(v)-1)]) / 4 for i in range(len(v))]
meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.data.shape_keys]
hit = 0
for o in meshes:
    kb = o.data.shape_keys.key_blocks
    for k in keys:
        if k not in kb or k.startswith("eyeLook"): continue
        hit += 1
        gain = 1.9 if "Smile" in k else 1.4 if ("Wide" in k or "Wide" in k or "brow" in k or "jaw" in k) else 1.0
        for i, v in enumerate(series[k]):
            kb[k].value = min(1.0, v * gain); kb[k].keyframe_insert("value", frame=1 + round(i * step))
# darken hair
for o in bpy.data.objects:
    if "short02" in o.name or "eyebrow" in o.name:
        for ms in o.material_slots:
            nt = ms.material.node_tree
            for n in list(nt.nodes):
                if n.type == 'TEX_IMAGE':
                    for l in list(n.outputs["Color"].links):
                        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
                        mix.inputs["Factor"].default_value = 1.0
                        mix.inputs[7].default_value = (0.06, 0.045, 0.035, 1)
                        nt.links.new(n.outputs["Color"], mix.inputs[6]); nt.links.new(mix.outputs[2], l.to_socket)
print("FACE KEYS", hit, [o.name for o in meshes])
scn.frame_start, scn.frame_end = 1, 1 + round((N - 1) * step)
print("FRAMES", scn.frame_end)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print("SAVED")
