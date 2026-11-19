import sys, cv2, json, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
vid, model, out = sys.argv[1:4]
opts = vision.PoseLandmarkerOptions(base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO)
lm = vision.PoseLandmarker.create_from_options(opts)
cap = cv2.VideoCapture(vid); fps = cap.get(cv2.CAP_PROP_FPS) or 10
frames=[]; i=0
EDGES=[(11,12),(11,13),(13,15),(12,14),(14,16),(11,23),(12,24),(23,24),(23,25),(25,27),(24,26),(26,28),(27,31),(28,32)]
w=None
while True:
    ok, img = cap.read()
    if not ok: break
    if w is None:
        h,wd=img.shape[:2]; w=cv2.VideoWriter('overlay.mp4',cv2.VideoWriter_fourcc(*'mp4v'),fps,(wd,h))
    r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)), int(i*1000/fps))
    f={'i':i,'ok':bool(r.pose_landmarks)}
    if r.pose_landmarks:
        p=r.pose_landmarks[0]; f['vis']=round(sum(x.visibility for x in p)/len(p),2)
        f['world']=[[q.x,q.y,q.z,q.visibility] for q in r.pose_world_landmarks[0]]
        H,W=img.shape[:2]
        for a,b in EDGES:
            if p[a].visibility>.3 and p[b].visibility>.3:
                cv2.line(img,(int(p[a].x*W),int(p[a].y*H)),(int(p[b].x*W),int(p[b].y*H)),(0,255,0),4)
    w.write(img); frames.append(f); i+=1
w.release(); json.dump({'fps':fps,'frames':frames},open(out,'w'))
print(len(frames),'frames', sum(f['ok'] for f in frames),'detected'); print([(f['i'],f.get('vis')) for f in frames])
