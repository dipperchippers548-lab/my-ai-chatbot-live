"""Retarget CMU motion-capture BVH clips onto the MPFB game_engine rig (rotation deltas from each rig's matching rest pose).
Imported by make_character.py; each clip becomes its own action (exported as a separate glTF animation)."""
import bpy, math
from mathutils import Vector, Quaternion, Matrix
MAP = {'pelvis': 'Hips', 'spine_01': 'LowerBack', 'spine_02': 'Spine', 'spine_03': 'Spine1', 'neck_01': 'Neck', 'head': 'Head',
       'clavicle_l': 'LeftShoulder', 'upperarm_l': 'LeftArm', 'lowerarm_l': 'LeftForeArm', 'hand_l': 'LeftHand',
       'clavicle_r': 'RightShoulder', 'upperarm_r': 'RightArm', 'lowerarm_r': 'RightForeArm', 'hand_r': 'RightHand',
       'thigh_l': 'LeftUpLeg', 'calf_l': 'LeftLeg', 'foot_l': 'LeftFoot', 'thigh_r': 'RightUpLeg', 'calf_r': 'RightLeg', 'foot_r': 'RightFoot'}
ORDER = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'head', 'clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l', 'clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r', 'thigh_l', 'calf_l', 'foot_l', 'thigh_r', 'calf_r', 'foot_r']
AIM = {'upperarm_l': 'lowerarm_l', 'lowerarm_l': 'hand_l', 'upperarm_r': 'lowerarm_r', 'lowerarm_r': 'hand_r', 'thigh_l': 'calf_l', 'calf_l': 'foot_l', 'thigh_r': 'calf_r', 'calf_r': 'foot_r', 'clavicle_l': 'upperarm_l', 'clavicle_r': 'upperarm_r'}
SAIM = {'LeftArm': 'LeftForeArm', 'LeftForeArm': 'LeftHand', 'RightArm': 'RightForeArm', 'RightForeArm': 'RightHand', 'LeftUpLeg': 'LeftLeg', 'LeftLeg': 'LeftFoot', 'RightUpLeg': 'RightLeg', 'RightLeg': 'RightFoot', 'LeftShoulder': 'LeftArm', 'RightShoulder': 'RightArm'}

def _upd(): bpy.context.view_layer.update()
def _set_world_rot(rig, pb, q_world, head_arm=None):
    m = (rig.matrix_world.to_quaternion().inverted() @ q_world).to_matrix().to_4x4(); m.translation = head_arm if head_arm is not None else pb.matrix.translation; pb.matrix = m; _upd()

def retarget(rig, path, name, max_seconds=6.0, fps=30, start=0.0):
    sc = bpy.context.scene
    bpy.ops.object.mode_set(mode='OBJECT') if bpy.context.object and bpy.context.object.mode != 'OBJECT' else None
    bpy.ops.import_anim.bvh(filepath=path, global_scale=1.0, rotate_mode='NATIVE', axis_forward='-Z', axis_up='Y', update_scene_fps=False, update_scene_duration=False, use_fps_scale=False)
    src = bpy.context.active_object; act = src.animation_data.action; f0, f1 = [int(x) for x in act.frame_range]
    f0 = f0 + int(start * 120); f1 = min(f1, f0 + int(max_seconds * 120))
    # face the subject toward -Y (MPFB front) and put the hips over the origin at the first frame
    sc.frame_set(f0); _upd(); W = src.matrix_world; P = src.pose.bones
    L = (W @ P['LeftUpLeg'].head) - (W @ P['RightUpLeg'].head); L.z = 0; L.normalize(); fwd = L.cross(Vector((0, 0, 1)))
    src.rotation_mode = 'XYZ'; src.rotation_euler.z += -math.pi / 2 - math.atan2(fwd.y, fwd.x); _upd()
    hp = src.matrix_world @ P['Hips'].head; src.location.x -= hp.x; src.location.y -= hp.y; _upd()
    W = src.matrix_world; D = src.data.bones
    # scale between the two skeletons (leg length)
    sl = ((W @ D['LeftUpLeg'].head_local) - (W @ D['LeftFoot'].head_local)).length; R = rig.data.bones
    tl_ = ((rig.matrix_world @ R['thigh_l'].head_local) - (rig.matrix_world @ R['foot_l'].head_local)).length; ratio = tl_ / sl
    hips_rest = W @ D['Hips'].head_local
    src_rest = {s: (W @ D[s].matrix_local).to_quaternion() for s in MAP.values()}
    # target reference pose = target posed like the source rest pose (T-pose limbs), so deltas line up
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='POSE'); pbs = rig.pose.bones
    for pb in pbs: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    _upd()
    for b in ORDER:
        if b in AIM:
            s = MAP[b]; sd = ((W @ D[SAIM[s]].head_local) - (W @ D[s].head_local)).normalized(); pb = pbs[b]
            cur = (rig.matrix_world @ pbs[AIM[b]].head - rig.matrix_world @ pb.head).normalized(); q = cur.rotation_difference(sd)
            _set_world_rot(rig, pb, q @ (rig.matrix_world @ pb.matrix).to_quaternion())
    tgt_ref = {b: (rig.matrix_world @ pbs[b].matrix).to_quaternion() for b in ORDER}
    pelvis_rest = pbs['pelvis'].matrix.translation.copy()
    action = bpy.data.actions.new(name); rig.animation_data_create(); rig.animation_data.action = action
    step = int(120 / fps); i = 0
    for f in range(f0, f1, step):
        sc.frame_set(f); _upd()
        for pb in pbs: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        _upd()
        for b in ORDER:
            s = MAP[b]; ws = (W @ src.pose.bones[s].matrix).to_quaternion(); d = ws @ src_rest[s].inverted(); pb = pbs[b]
            head = None
            if b == 'pelvis':
                hp = W @ src.pose.bones['Hips'].head; off = Vector((hp.x * ratio, hp.y * ratio, (hp.z - hips_rest.z) * ratio))
                head = pelvis_rest + rig.matrix_world.to_3x3().inverted() @ off
            _set_world_rot(rig, pb, d @ tgt_ref[b], head)
        fr = i * 24 / fps
        for b in ORDER: pbs[b].keyframe_insert('rotation_quaternion', frame=fr)
        pbs['pelvis'].keyframe_insert('location', frame=fr); i += 1
    trk = rig.animation_data.nla_tracks.new(); trk.name = name; trk.strips.new(name, 0, action); rig.animation_data.action = None
    for pb in pbs: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    bpy.ops.object.mode_set(mode='OBJECT'); arm_data = src.data; bpy.data.objects.remove(src); bpy.data.armatures.remove(arm_data); bpy.data.actions.remove(act)
    print('CLIP', name, i, 'frames')
