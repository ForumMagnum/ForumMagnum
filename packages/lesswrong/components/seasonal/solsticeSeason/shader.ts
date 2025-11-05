import * as THREE from 'three';

export const createDayNightShaderMaterial = (contrast: number, brightness: number, brightnessAdd: number) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: null },
      nightTexture: { value: null },
      luminosityTexture: { value: null },
      sunPosition: { value: new THREE.Vector2() },
      globeRotation: { value: new THREE.Vector2() },
      textureRotation: { value: 0 }, // Rotation offset for texture coordinates (radians)
      contrast: { value: contrast },
      brightness: { value: brightness },
      brightnessAdd: { value: brightnessAdd },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      #define PI 3.141592653589793
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D luminosityTexture;
      uniform vec2 sunPosition;
      uniform vec2 globeRotation;
      uniform float textureRotation;
      uniform float contrast;
      uniform float brightness;
      uniform float brightnessAdd;
      varying vec3 vNormal;
      varying vec2 vUv;

      float toRad(in float a) {
        return a * PI / 180.0;
      }

      vec3 Polar2Cartesian(in vec2 c) {
        float theta = toRad(90.0 - c.x);
        float phi = toRad(90.0 - c.y);
        return vec3(
          sin(phi) * cos(theta),
          cos(phi),
          sin(phi) * sin(theta)
        );
      }

      void main() {
        vec2 rotatedUv = vUv;
        if (textureRotation != 0.0) {
          rotatedUv.x = mod(vUv.x + textureRotation / (2.0 * PI), 1.0);
        }
        
        float invLon = toRad(globeRotation.x);
        float invLat = -toRad(globeRotation.y);
        mat3 rotX = mat3(
          1, 0, 0,
          0, cos(invLat), -sin(invLat),
          0, sin(invLat), cos(invLat)
        );
        mat3 rotY = mat3(
          cos(invLon), 0, sin(invLon),
          0, 1, 0,
          -sin(invLon), 0, cos(invLon)
        );
        vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
        float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
        vec4 dayColor = texture2D(dayTexture, rotatedUv);
        vec4 nightColor = texture2D(nightTexture, rotatedUv);
        
        float nightFactor = 1.0 - smoothstep(-0.1, 0.1, intensity);
        vec4 luminosityColor = texture2D(luminosityTexture, rotatedUv);
        vec3 luminosityEnhanced = pow(luminosityColor.rgb, vec3(0.9));
        nightColor.rgb += luminosityEnhanced * luminosityColor.a * nightFactor * 1.2;
        
        float blendFactor = smoothstep(-0.1, 0.1, intensity);
        vec4 blendedColor = mix(nightColor, dayColor, blendFactor);
        vec3 brightened = blendedColor.rgb * brightness + brightnessAdd;
        vec3 contrastAdjusted = (brightened - 0.5) * contrast + 0.5;
        vec3 finalColor = clamp(contrastAdjusted, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, blendedColor.a);
      }
    `,
  });
};

