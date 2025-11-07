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
      varying vec2 vUv;
      void main() {
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
      varying vec2 vUv;

      void main() {
        vec2 rotatedUv = vUv;
        if (textureRotation != 0.0) {
          rotatedUv.x = mod(vUv.x + textureRotation / (2.0 * PI), 1.0);
        }
        
        // Convert UV coordinates to latitude/longitude (equirectangular projection)
        // UV.x: 0 = -180°, 0.5 = 0°, 1 = +180° (longitude)
        // UV.y: 0 = -90°, 0.5 = 0°, 1 = +90° (latitude)
        float longitude = (rotatedUv.x - 0.5) * 360.0;
        float latitude = (rotatedUv.y - 0.5) * 180.0;
        
        // Account for globe rotation
        float adjustedLongitude = longitude - globeRotation.x;
        
        // Sun position: x = longitude, y = latitude (in degrees)
        // Rotate night texture position by 90 degrees
        float sunLongitude = sunPosition.x + 90.0;
        float sunLatitude = sunPosition.y;
        
        // Calculate longitude difference (accounting for wrap-around)
        float lonDiff = adjustedLongitude - sunLongitude;
        if (lonDiff > 180.0) lonDiff -= 360.0;
        if (lonDiff < -180.0) lonDiff += 360.0;
        
        // Simple day/night calculation: blend based on angular distance from sun
        // This creates a terminator that divides the sphere roughly in half
        // Use cosine of the angle for smooth transition
        // For a sphere, the terminator is a great circle, so we use longitude difference
        // as a simple approximation (this works well for most viewing angles)
        float angleFromSun = abs(lonDiff);
        if (angleFromSun > 180.0) angleFromSun = 360.0 - angleFromSun;
        
        // Convert angle to blend factor: 0° = day (1.0), 180° = night (0.0)
        // Cosine gives us: cos(0°) = 1 (full day), cos(180°) = -1 (full night)
        float rawBlend = cos(angleFromSun * PI / 180.0);
        // Apply transition zone using smoothstep (same as original)
        float blendFactor = smoothstep(-0.1, 0.1, rawBlend);
        
        vec4 dayColor = texture2D(dayTexture, rotatedUv);
        vec4 nightColor = texture2D(nightTexture, rotatedUv);
        
        float nightFactor = 1.0 - blendFactor;
        vec4 luminosityColor = texture2D(luminosityTexture, rotatedUv);
        vec3 luminosityEnhanced = pow(luminosityColor.rgb, vec3(0.9));
        nightColor.rgb += luminosityEnhanced * luminosityColor.a * nightFactor * 1.2;
        
        vec4 blendedColor = mix(nightColor, dayColor, blendFactor);
        vec3 brightened = blendedColor.rgb * brightness + brightnessAdd;
        vec3 contrastAdjusted = (brightened - 0.5) * contrast + 0.5;
        vec3 finalColor = clamp(contrastAdjusted, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, blendedColor.a);
      }
    `,
  });
};

