// Post chain: scene (HDR, MSAA) -> lens blur by depth -> ACES tone map + gentle grade -> screen.
import * as THREE from 'three';
const quadGeo = new THREE.PlaneGeometry(2, 2);
const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
export function makePost(renderer, W, H) {
  const rtScene = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  rtScene.depthTexture = new THREE.DepthTexture(W, H); rtScene.depthTexture.type = THREE.UnsignedIntType;
  const rtDof = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
  const dofMat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rtScene.texture }, tDepth: { value: rtScene.depthTexture }, near: { value: .05 }, far: { value: 600 }, focus: { value: 3 }, cInf: { value: 0 }, res: { value: new THREE.Vector2(W, H) } },
    vertexShader: vs,
    fragmentShader: `#include <packing>
      uniform sampler2D tColor, tDepth; uniform float near, far, focus, cInf; uniform vec2 res; varying vec2 vUv;
      float vz(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
      float coc(float z){ return min(cInf * abs(1. - focus / z), 22.); }
      void main(){
        vec4 c0 = texture2D(tColor, vUv); float z0 = vz(vUv); float r0 = coc(z0);
        if (r0 < .6) { gl_FragColor = c0; return; }
        vec3 acc = c0.rgb; float wsum = 1.;
        const int N = 36; float ga = 2.39996;
        for (int i = 1; i < N; i++) {
          float fi = float(i); float d = sqrt(fi / float(N)) * r0; vec2 o = vec2(cos(fi * ga), sin(fi * ga)) * d;
          vec2 uv = vUv + o / res; vec3 s = texture2D(tColor, uv).rgb; float zs = vz(uv); float rs = coc(zs);
          float w = zs < z0 - .05 ? smoothstep(d - 1., d + .5, rs) : 1.;
          acc += s * w; wsum += w; }
        gl_FragColor = vec4(acc / wsum, 1.); }`,
    depthTest: false, depthWrite: false
  });
  const finalMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: rtDof.texture }, exposure: { value: 1.0 }, sat: { value: 1.1 }, vig: { value: .16 }, flash: { value: 0 } },
    vertexShader: vs,
    fragmentShader: `uniform sampler2D t; uniform float exposure, sat, vig, flash; varying vec2 vUv;
      vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + .0245786) - .000090537; vec3 b = v * (.983729 * v + .4329510) + .238081; return a / b; }
      vec3 aces(vec3 c){ const mat3 I = mat3(vec3(.59719,.07600,.02840), vec3(.35458,.90834,.13383), vec3(.04823,.01566,.83777));
        const mat3 O = mat3(vec3(1.60475,-.10208,-.00327), vec3(-.53108,1.10813,-.07276), vec3(-.07367,-.00605,1.07602));
        c *= exposure / .6; c = I * c; c = RRTAndODTFit(c); c = O * c; return clamp(c, 0., 1.); }
      vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
      void main(){ vec3 c = texture2D(t, vUv).rgb; c = aces(c); float l = dot(c, vec3(.2126,.7152,.0722)); c = mix(vec3(l), c, sat);
        vec2 q = vUv - .5; c *= 1. - vig * dot(q * vec2(1.2, .9), q * vec2(1.2, .9)) * 2.2; c = srgb(clamp(c, 0., 1.)); c = mix(c, vec3(1.), flash);
        gl_FragColor = vec4(c, 1.); }`,
    depthTest: false, depthWrite: false
  });
  const qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); const quad = new THREE.Mesh(quadGeo, dofMat); qs.add(quad);
  return {
    dofMat, finalMat,
    render(scene, cam, { focus = 3, cInf = 0, exposure = 1, flash = 0 } = {}) {
      dofMat.uniforms.near.value = cam.near; dofMat.uniforms.far.value = cam.far; dofMat.uniforms.focus.value = focus; dofMat.uniforms.cInf.value = cInf;
      finalMat.uniforms.exposure.value = exposure; finalMat.uniforms.flash.value = flash;
      renderer.setRenderTarget(rtScene); renderer.render(scene, cam);
      quad.material = dofMat; renderer.setRenderTarget(rtDof); renderer.render(qs, qc);
      quad.material = finalMat; renderer.setRenderTarget(null); renderer.render(qs, qc);
    }
  };
}
