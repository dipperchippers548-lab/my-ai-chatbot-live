# Phone-video mocap → realistic 3D character pipeline

Free, local pipeline: Blender 5.2 + MPFB 2 (MakeHuman) + MediaPipe.

## Setup
- Blender 5.2 LTS from download.blender.org, symlinked to `blender`
- MPFB: `blender -b --online-mode --command extension install --enable mpfb`
- MakeHuman system assets (`makehuman_system_assets_cc0.zip`) and `faceunits01.zip`, installed with `bpy.ops.mpfb.load_pack(filepath=...)`
- `pip install mediapipe opencv-python-headless` (+ `apt-get install libegl1 libgles2`)
- MediaPipe models: `pose_landmarker_heavy.task`, `face_landmarker.task`

## Steps
1. `python3 track_pose.py <video> pose_landmarker_heavy.task pose.json` → body landmarks + overlay.mp4
2. `python3 track_face.py <video>` (run in the folder with `face_landmarker.task`) → face.json (52 ARKit blendshapes)
3. `blender -b --python build_from_video.py` → builds the MPFB character (cmu_mb rig, ARKit face units), retargets arms/spine/head + face, saves .blend
4. `blender -b <file>.blend --python render_shot.py -- final <out_prefix>` → Cycles PNG frames, then ffmpeg to MP4

`build_walk_bvh.py` retargets CMU BVH mocap (github.com/una-dinosauria/cmu-mocap) onto the same rig.
Paths inside the scripts are currently hardcoded to /root/work; adjust per project.
