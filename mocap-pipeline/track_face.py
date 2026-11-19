import cv2, json, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
import sys; V=sys.argv[1]
o=vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path='face.task'),running_mode=vision.RunningMode.VIDEO,output_face_blendshapes=True,output_facial_transformation_matrixes=True)
fl=vision.FaceLandmarker.create_from_options(o)
cap=cv2.VideoCapture(V); fps=cap.get(cv2.CAP_PROP_FPS) or 10; out=[]; i=0
while True:
    ok,img=cap.read()
    if not ok: break
    r=fl.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)),int(i*1000/fps))
    out.append({c.category_name:c.score for c in r.face_blendshapes[0]} if r.face_blendshapes else None); i+=1
json.dump({'fps':fps,'frames':out},open('face.json','w'))
ok=[f for f in out if f]; print(len(out),'frames',len(ok),'with face')
for k in ['mouthSmileLeft','jawOpen','eyeBlinkLeft','eyeWideLeft','browInnerUp']:
    print(k,[round(f[k],2) if f else None for f in out][::6])
