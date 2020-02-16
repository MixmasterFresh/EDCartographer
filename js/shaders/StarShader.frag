uniform vec3 color;

varying vec3 vColor;

void main() {

    float dist = distance(vec2(0.5), gl_PointCoord.xy);

    gl_FragColor = vec4( color * vColor, 1.0 );

    if ( dist > 0.45 ) {
        gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
    }

    if ( dist > 0.5 ) {
        discard;
    }
}
