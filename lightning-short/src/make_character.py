"""Build the ranger with MPFB 2 (MakeHuman for Blender) and export a rigged GLB with expression shape keys.
Run: blender -b --python src/make_character.py -- <out.glb> <json settings>"""
import bpy, sys, json, os, importlib, glob, gzip
argv = sys.argv[sys.argv.index('--') + 1:]; OUT = argv[0]; CFG = json.loads(argv[1]) if len(argv) > 1 else {}
M = 'bl_ext.blender_org.mpfb'
HS = importlib.import_module(M + '.services.humanservice').HumanService
TS = importlib.import_module(M + '.services.targetservice').TargetService
AS = importlib.import_module(M + '.services.assetservice').AssetService
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
macro = TS.get_default_macro_info_dict(); macro.update(CFG.get('macro', {}))
h = HS.create_human(mask_helpers=False, detailed_helpers=True, extra_vertex_groups=True, macro_detail_dict=macro)
# face shape: a slightly caricatured look (stronger brows, cheekbones, jaw)
for tgt, w in CFG.get('shape', {}).items():
    p = TS.target_full_path(tgt)
    if p: TS.load_target(h, p, weight=w, name=tgt.replace('/', '_'))
TS.bake_targets(h); print('BAKED')   # macro + face shape keys become the real mesh (exporters ignore shape key weights)
LS = importlib.import_module(M + '.services.locationservice').LocationService
D = LS.get_user_data()
skin = os.path.join(D, 'skins', CFG.get('skin', 'middleage_caucasian_male'), CFG.get('skin', 'middleage_caucasian_male') + '.mhmat')
for st in (CFG.get('skin_type', 'GAMEENGINE'), 'MAKESKIN'):
    try: HS.set_character_skin(skin, h, skin_type=st); print('SKIN', st); break
    except Exception as e: print('SKIN FAIL', st, e)
def add(kind, name, atype):
    p = os.path.join(D, kind, name, name + '.mhclo')
    if not os.path.exists(p): print('MISSING', p); return
    try: HS.add_mhclo_asset(p, h, asset_type=atype, subdiv_levels=0, material_type='MAKESKIN'); print('ADDED', name)
    except Exception as e: print('ASSET FAIL', name, e)
add('eyes', 'low-poly', 'Eyes'); add('teeth', 'teeth_base', 'Teeth'); add('tongue', 'tongue01', 'Tongue'); add('eyebrows', CFG.get('eyebrows', 'eyebrow001'), 'Eyebrows'); add('eyelashes', 'eyelashes01', 'Eyelashes')
if CFG.get('hair', 'short02'): add('hair', CFG.get('hair', 'short02'), 'Hair')
for c in CFG.get('clothes', ['male_worksuit01', 'shoes01']): add('clothes', c, 'Clothes')
print('MODS', [(m.name, m.type, getattr(m, 'vertex_group', None), getattr(m, 'invert_vertex_group', None)) for m in h.modifiers])
# expression units as shape keys (exported as morph targets)
race = CFG.get('race', 'caucasian')
for u in ['eyebrows-left-inner-up', 'eyebrows-right-inner-up', 'eyebrows-left-down', 'eyebrows-right-down', 'eyebrows-left-up', 'eyebrows-right-up', 'eye-left-opened-up', 'eye-right-opened-up', 'eye-left-closure', 'eye-right-closure', 'mouth-open', 'mouth-corner-puller', 'mouth-depression', 'mouth-retraction']:
    p = os.path.join(os.path.dirname(TS.target_full_path('mouth-open')).replace('african', race), u + '.target.gz')
    if os.path.exists(p): TS.load_target(h, p, weight=0.0, name='x_' + u)
rig = HS.add_builtin_rig(h, 'game_engine')
# drop MakeHuman's helper geometry (tights/skirt/hair helpers, joint cubes) now that clothes are fitted
import bmesh
gi = [g.index for g in h.vertex_groups if g.name in ('HelperGeometry', 'JointCubes')]
bpy.context.view_layer.objects.active = h; bpy.ops.object.mode_set(mode='EDIT'); bm = bmesh.from_edit_mesh(h.data); dl = bm.verts.layers.deform.active
gi += [h.vertex_groups[m.vertex_group].index for m in h.modifiers if m.type == 'MASK' and m.vertex_group in h.vertex_groups]   # body hidden under clothes
body_i = h.vertex_groups['body'].index; hi = [h.vertex_groups[n].index for n in ('HelperGeometry', 'JointCubes')]; mi = [g for g in gi if g not in hi]
mode = CFG.get('delmode', 'both')
kill = [v for v in bm.verts if (mode in ('both', 'helpers') and any(g in v[dl] for g in hi) and body_i not in v[dl]) or (mode in ('both', 'mask') and any(g in v[dl] and v[dl][g] > .5 for g in mi))]
bmesh.ops.delete(bm, geom=kill, context='VERTS'); bmesh.update_edit_mesh(h.data); bpy.ops.object.mode_set(mode='OBJECT'); print('HELPERS REMOVED', mode, len(kill))
for m in [m for m in h.modifiers if m.type == 'MASK']: h.modifiers.remove(m)
#print('XFORM', [(o.name, tuple(round(x,3) for x in o.scale), tuple(round(x,3) for x in o.location), o.parent.name if o.parent else None, o.type) for o in bpy.data.objects])

# ---- poses: each limb is aimed at a direction in character space (x = his left, y = up, z = forward); keyed 10 frames apart ----
from mathutils import Vector, Matrix
POSES = CFG.get('poses') or json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'poses.json')))
CH = {'upperarm_l': 'lowerarm_l', 'lowerarm_l': 'hand_l', 'upperarm_r': 'lowerarm_r', 'lowerarm_r': 'hand_r', 'thigh_l': 'calf_l', 'calf_l': 'foot_l', 'thigh_r': 'calf_r', 'calf_r': 'foot_r', 'spine_02': 'spine_03', 'spine_03': 'neck_01', 'neck_01': 'head', 'spine_01': 'spine_02', 'pelvis': 'spine_01'}
ORDER = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'upperarm_l', 'lowerarm_l', 'upperarm_r', 'lowerarm_r', 'thigh_l', 'calf_l', 'thigh_r', 'calf_r']
cv = lambda d: Vector((d[0], -d[2], d[1])).normalized()
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='POSE')
pbs = rig.pose.bones
for pb in pbs: pb.rotation_mode = 'QUATERNION'
names = []
for i, (pname, spec) in enumerate(POSES.items()):
    for pb in pbs: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    bpy.context.view_layer.update()
    for b in ORDER:
        if b not in spec or b not in pbs: continue
        pb = pbs[b]; m = pb.matrix.copy(); head = m.to_translation(); cur = (pbs[CH[b]].head - pb.head).normalized() if CH.get(b) in pbs else m.to_3x3().col[1].normalized()
        q = cur.rotation_difference(cv(spec[b])); rot = q.to_matrix() @ m.to_3x3(); nm = rot.to_4x4(); nm.translation = head; pb.matrix = nm; bpy.context.view_layer.update()
    if 'root_drop' in spec: pbs['pelvis'].location = (0, 0, 0)
    for pb in pbs: pb.keyframe_insert('rotation_quaternion', frame=i * 10); pb.keyframe_insert('location', frame=i * 10)
    names.append(pname)
bpy.ops.object.mode_set(mode='OBJECT'); rig.animation_data.action.name = 'poses'
json.dump(names, open(OUT.replace('.glb', '_poses.json'), 'w')); print('POSES', names)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_frame_range=False, export_force_sampling=False, export_anim_single_armature=True, export_morph=True, export_skins=True, export_morph_normal=False, export_apply=False)
print('DONE', OUT, os.path.getsize(OUT))
