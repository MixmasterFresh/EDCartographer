uniform vec3 color;
uniform vec3 center;
varying vec3 vPos;

void main() {
    float dist = distance(center.xz, vPos.xz);
    float rolloff = clamp(1.0 / (1.0 + (0.0003 * pow(dist, 2.0))), 0.0, 1.0);
    gl_FragColor = vec4(1.0, 1.0, 1.0, rolloff);
    if (gl_FragColor.a < 0.1) {
        discard;
    }
}
