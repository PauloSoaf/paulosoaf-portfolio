export const orbVertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

/** One inexpensive material: topographic contours, graphite terrain and restrained rim light. */
export const orbFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uLight;
  uniform vec3 uAccent;
  uniform float uLightTheme;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 p = normalize(vPosition);
    float field = sin(p.x * 5.8 + p.z * 3.4) * cos(p.y * 4.8 - p.z * 2.2);
    field += sin(p.x * 14.0 + p.y * 9.0 + p.z * 8.0) * 0.18;
    float terrain = smoothstep(-0.08, 0.55, field);
    float altitude = p.y * 32.0 + field * 2.8;
    float distanceToContour = abs(fract(altitude) - 0.5);
    float width = max(fwidth(altitude), 0.035);
    float contour = 1.0 - smoothstep(0.035, 0.035 + width, distanceToContour);
    vec3 n = normalize(vNormal);
    vec3 light = normalize(vec3(-0.65, 0.75, 1.0));
    float diffuse = max(0.0, dot(n, light));
    float rim = pow(1.0 - max(0.0, dot(n, normalize(vView))), 3.5);
    float glow = pow(max(0.0, dot(n, normalize(vec3(-0.7, 0.45, 0.45)))), 5.0);
    vec3 color = mix(uBase, uLight, diffuse * 0.75);
    color += uLight * terrain * diffuse * 0.25;
    color += uLight * contour * 0.12;
    color += uAccent * (rim * glow * 0.12 + glow * terrain * 0.025);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
