import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const THREE = require('three');

// Dynamically import react-globe.gl to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });
// TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
const GlobeAny = Globe as unknown as any;

export type SolsticeGlobePoint = {
  lat: number;
  lng: number;
  size: number;
  color: string;
  eventId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event?: any;
};

export type PointOfView = {
  lat: number;
  lng: number;
  altitude: number;
};

type PointClickCallback = (point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => void;

// Day-night cycle settings - velocity in minutes per frame (like the example)
const VELOCITY = 1; // minutes per frame
// Contrast enhancement properties
const CONTRAST_AMOUNT = 1; // Higher values = more contrast (bright parts brighter, dark parts darker)
const BRIGHTNESS_BOOST = 1; // Multiplier for overall brightness
const BRIGHTNESS_ADD = 0.05; // Additive brightness component (0-1 range)

// Build the day-night cycle shader material - exact copy from react-globe.gl example
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createDayNightShaderMaterial = (THREERef: any, contrast: number, brightness: number, brightnessAdd: number) => {
  return new THREERef.ShaderMaterial({
    uniforms: {
      dayTexture: { value: null },
      nightTexture: { value: null },
      luminosityTexture: { value: null },
      sunPosition: { value: new THREERef.Vector2() },
      globeRotation: { value: new THREERef.Vector2() },
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
        // Apply texture rotation to UV coordinates (horizontal rotation for equirectangular)
        vec2 rotatedUv = vUv;
        if (textureRotation != 0.0) {
          // For equirectangular textures, rotate horizontally (U coordinate)
          // textureRotation is in radians, U coordinate is 0-1, so convert and wrap
          rotatedUv.x = mod(vUv.x + textureRotation / (2.0 * PI), 1.0);
          rotatedUv.y = vUv.y; // Keep V coordinate unchanged
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
        
        // Add luminosity (city lights) to night side - more visible when it's darker
        // The luminosity texture shows city lights that are visible even without sunlight
        float nightFactor = 1.0 - smoothstep(-0.1, 0.1, intensity); // 1.0 when dark, 0.0 when light
        vec4 luminosityColor = texture2D(luminosityTexture, rotatedUv);
        // Increase contrast of luminosity map by applying a power function
        vec3 luminosityEnhanced = pow(luminosityColor.rgb, vec3(0.9)); // Lower exponent = higher contrast
        nightColor.rgb += luminosityEnhanced * luminosityColor.a * nightFactor * 1.2;
        
        float blendFactor = smoothstep(-0.1, 0.1, intensity);
        vec4 blendedColor = mix(nightColor, dayColor, blendFactor);
        
        // Apply brightness boost: both multiplicative and additive
        vec3 brightened = blendedColor.rgb * brightness + brightnessAdd;
        
        // Apply contrast enhancement: center around 0.5, scale, then add back
        // This makes bright parts brighter and dark parts darker
        vec3 contrastAdjusted = (brightened - 0.5) * contrast + 0.5;
        
        // Clamp to valid range
        vec3 finalColor = clamp(contrastAdjusted, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, blendedColor.a);
      }
    `,
  });
};

// Recursively find a mesh with a texture map applied
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findMeshWithTexture = (obj: any): any => {
  if (obj && obj.type === 'Mesh' && obj.material && obj.material.map) return obj;
  for (const child of obj?.children || []) {
    const found = findMeshWithTexture(child);
    if (found) return found;
  }
  return null;
};

// Map input points to react-globe.gl points
const mapPointsToMarkers = (pointsData: Array<SolsticeGlobePoint>) => pointsData.map((point, index) => ({
  lat: point.lat,
  lng: point.lng,
  size: point.size,
  color: point.color,
  eventId: point.eventId,
  event: point.event,
  _index: index,
}));

// --- Hooks ---
// Create and manage the globe material lifecycle with day-night support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useGlobeDayNightMaterial = (): React.MutableRefObject<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeMaterialRef = useRef<any>(null);
  useEffect(() => {
    globeMaterialRef.current = createDayNightShaderMaterial(THREE, CONTRAST_AMOUNT, BRIGHTNESS_BOOST, BRIGHTNESS_ADD);
    return () => {
      if (globeMaterialRef.current && typeof globeMaterialRef.current.dispose === 'function') {
        globeMaterialRef.current.dispose();
      }
    };
  }, []);
  return globeMaterialRef;
};

// Combine: assign textures, set POV, and call onReady once globe is ready
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useGlobeReadyEffects = (
  isGlobeReady: boolean,
  globeRef: React.MutableRefObject<any>,
  globeMaterialRef: React.MutableRefObject<any>,
  dayImageUrl: string | undefined,
  nightImageUrl: string | undefined,
  luminosityImageUrl: string | undefined,
  pov: PointOfView,
  onReady?: () => void
) => {
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!isGlobeReady || !globeRef.current) return;

    const globeObj = globeRef.current;

    if (globeObj && globeObj.scene && globeObj.scene.children) {
      const globeMesh = findMeshWithTexture(globeObj.scene);
      if (globeMesh && globeMesh.material) {
        if (globeMaterialRef.current) {
          globeMesh.material = globeMaterialRef.current;
        }
      }
    }

    const loader = new THREE.TextureLoader();
    if (dayImageUrl) {
      loader.load(
        dayImageUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (texture: any) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          // Set wrapping for equirectangular textures: repeat horizontally, clamp vertically
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          if (globeMaterialRef.current) {
            globeMaterialRef.current.uniforms.dayTexture.value = texture;
          }
        }
      );
    }
    if (nightImageUrl) {
      loader.load(
        nightImageUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (texture: any) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          // Set wrapping for equirectangular textures: repeat horizontally, clamp vertically
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          if (globeMaterialRef.current) {
            globeMaterialRef.current.uniforms.nightTexture.value = texture;
          }
        }
      );
    }
    if (luminosityImageUrl) {
      loader.load(
        luminosityImageUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (texture: any) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          // Set wrapping for equirectangular textures: repeat horizontally, clamp vertically
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          if (globeMaterialRef.current) {
            globeMaterialRef.current.uniforms.luminosityTexture.value = texture;
          }
        }
      );
    }

    globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: pov.altitude }, 0);
    onReadyRef.current?.();
  }, [isGlobeReady, globeRef, globeMaterialRef, dayImageUrl, nightImageUrl, luminosityImageUrl, pov.lat, pov.lng, pov.altitude]);
};

// Calculate sun position based on date/time - includes Earth's tilt (declination)
// Based on react-globe.gl example
const sunPosAt = (dt: number): [number, number] => {
  const daysSinceJ2000 = (dt - 946728000000) / 86400000; // J2000 = Jan 1, 2000
  
  // Solar declination (Earth's axial tilt effect) - simplified
  const declinationRad = ((23.44 * Math.PI) / 180) * Math.sin((2 * Math.PI * ((daysSinceJ2000 + 284) / 365.25)));
  const declination = (declinationRad * 180) / Math.PI;
  
  // Sun position is fixed at longitude 0 (noon position)
  return [0, declination];
};

// Combined animation hook: manages both globe rotation and day-night cycle in a single animation loop
// Returns a ref to the current rotation value in radians so markers can be rotated accordingly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useGlobeAnimation = (globeMaterialRef: React.MutableRefObject<any>, isGlobeReady: boolean, pov: PointOfView): React.MutableRefObject<number> => {
  const rotationSpeed = 0.005; // radians per frame (adjust for desired rotation speed)
  const rotationRef = useRef(0); // Track cumulative rotation
  const dtRef = useRef(+new Date()); // Track current time for day-night cycle
  const [, setFrameCounter] = useState(0); // Trigger re-renders for marker updates
  
  useEffect(() => {
    if (!isGlobeReady || !globeMaterialRef.current) return;

    let animationFrameId: number;
    let frameCount = 0;
    
    const animate = () => {
      // Update rotation
      rotationRef.current += rotationSpeed;
      
      // Update time for day-night cycle
      dtRef.current += VELOCITY * 60 * 1000;
      
      // Update shader uniforms
      if (globeMaterialRef.current?.uniforms) {
        // Update texture rotation uniform
        if (globeMaterialRef.current.uniforms.textureRotation) {
          globeMaterialRef.current.uniforms.textureRotation.value = rotationRef.current;
        }
        
        // Update sun position based on current time
        if (globeMaterialRef.current.uniforms.sunPosition) {
          const sunPos = sunPosAt(dtRef.current);
          globeMaterialRef.current.uniforms.sunPosition.value.set(sunPos[0], sunPos[1]);
        }
      }
      
      // Trigger re-render every frame so markers update their positions
      frameCount++;
      setFrameCounter(frameCount);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isGlobeReady, globeMaterialRef]);
  
  // Update globe rotation when POV changes (separate from animation loop)
  useEffect(() => {
    if (!globeMaterialRef.current?.uniforms?.globeRotation) return;
    globeMaterialRef.current.uniforms.globeRotation.value.set(pov.lng, pov.lat);
  }, [globeMaterialRef, pov.lat, pov.lng]);
  
  return rotationRef;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useFramerate = (isGlobeReady: boolean, globeRef: React.MutableRefObject<any>): number => {
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    if (!isGlobeReady || !globeRef.current) return;
    
    const globeInstance = globeRef.current;
    const renderer = globeInstance.renderer?.();
    if (!renderer) return;
    
    let lastTime = performance.now();
    let frameCount = 0;
    
    // Hook into the renderer's render cycle to track actual frames rendered
    const originalRender = renderer.render.bind(renderer);
    renderer.render = function(...args: any[]) {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      return originalRender(...args);
    };
    
    return () => {
      // Restore original render method
      renderer.render = originalRender;
    };
  }, [isGlobeReady, globeRef]);
  
  return fps;
};


const SolsticeGlobe3D = ({
  pointsData,
  defaultPointOfView,
  onPointClick,
  onReady,
  className,
  style,
  onClick,
  dayImageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761983935/flat_earth_Largest_still3_yltj4n.jpg",
  nightImageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761984035/earth-night-light_kwpk53.jpg",
  luminosityImageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761947544/earth-night_fratqn.jpg",
  altitudeScale = 0.099,
  initialAltitudeMultiplier = 1.6,
}: {
  pointsData: Array<SolsticeGlobePoint>;
  defaultPointOfView: PointOfView;
  onPointClick?: PointClickCallback;
  onReady?: () => void;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  // URLs for the globe day and night textures. Accepts JPG, PNG, or SVG formats. Note: SVGs will be rasterized at load time.
  // For best performance with 3D globe textures, equirectangular bitmap images (JPG/PNG) are recommended.
  // The images should use an equirectangular projection (360° horizontal, 180° vertical).
  dayImageUrl?: string;
  nightImageUrl?: string;
  // Luminosity map showing city lights. This will be added to the night side to show city lights even without sunlight.
  // Typically this is a black image with white/yellow dots representing city lights.
  luminosityImageUrl?: string;
  altitudeScale?: number;
  initialAltitudeMultiplier?: number;
}) => {
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  // TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  const globeRef = useRef<any>(null);
  // Create material with day-night cycle shader
  const globeMaterialRef = useGlobeDayNightMaterial();

  // Initialize: assign textures, set POV, and invoke onReady when ready
  const initialPov = useMemo(() => ({
    lat: defaultPointOfView.lat,
    lng: defaultPointOfView.lng,
    altitude: defaultPointOfView.altitude * initialAltitudeMultiplier,
  }), [defaultPointOfView.lat, defaultPointOfView.lng, defaultPointOfView.altitude, initialAltitudeMultiplier]);
  useGlobeReadyEffects(isGlobeReady, globeRef, globeMaterialRef, dayImageUrl, nightImageUrl, luminosityImageUrl, initialPov, onReady);
  
  // Start combined globe rotation and day-night cycle animation
  const textureRotationRef = useGlobeAnimation(globeMaterialRef, isGlobeReady, initialPov);
  
  // Track framerate using react-globe.gl's renderer
  const fps = useFramerate(isGlobeReady, globeRef);

  // Update globe rotation when user zooms/interacts (matches example)
  const handleZoom = useCallback(({ lng, lat }: { lng: number; lat: number }) => {
    if (globeMaterialRef.current?.uniforms?.globeRotation) {
      globeMaterialRef.current.uniforms.globeRotation.value.set(lng, lat);
    }
  }, [globeMaterialRef]);

  // Convert points data to format expected by react-globe.gl
  const markerData = mapPointsToMarkers(pointsData);

  const handlePointClick = (point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => {
    if (onPointClick) {
      onPointClick(point, screenCoords);
    }
  };

  // HTML marker renderer function based on react-globe.gl example
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderHtmlElement = useCallback((d: any) => {
    const point = pointsData.find(p => 
      (d._index !== undefined && p === pointsData[d._index]) || 
      (d.eventId && p.eventId === d.eventId)
    ) || d;
    const color = typeof point.color === 'string' ? point.color : '#ffffff';
    const el = document.createElement('div');
    el.style.color = color;
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <div style="text-align: center;">
        <svg viewBox="0 0 24 24" style="width:24px;margin:0 auto;">
          <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 3.25 2.5 6.75 7 11.54 4.5-4.79 7-8.29 7-11.54 0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
      </div>
    `;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const originalPoint = pointsData.find(p => 
        (d._index !== undefined && p === pointsData[d._index]) || 
        (d.eventId && p.eventId === d.eventId)
      );
      if (originalPoint) {
        handlePointClick(originalPoint, { x: e.clientX, y: e.clientY });
      }
    });
    return el;
  }, [pointsData, handlePointClick]);
  
  // Wrapped marker calculation functions with performance tracking
  const htmlLng = useCallback((d: any) => {
    // Apply texture rotation to marker longitude to keep markers aligned with rotating texture
    // Texture rotation is in radians, convert to degrees and subtract to counter-rotate markers
    const rotationDegrees = (textureRotationRef.current * 180) / Math.PI;
    return d.lng - rotationDegrees;
  }, [textureRotationRef]);
  
  const htmlAltitude = useCallback((d: any) => {
    const base = typeof d.size === 'number' ? d.size : 1;
    return base * altitudeScale * 0.01;
  }, [altitudeScale]);

  return (
    <div
      style={{ ...style, cursor: 'grab', width: '100%', height: '100vh', position: 'relative' }}
      className={className}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
    >
      {typeof window !== 'undefined' && isGlobeReady && (
        <>
          <div style={{ position: 'absolute', top: '300px', right: '10px', color: 'white', fontFamily: 'monospace', fontSize: '14px', zIndex: 1000, pointerEvents: 'none' }}>
            {fps} FPS
          </div>
        </>
      )}
      {typeof window !== 'undefined' && (
        <div style={{ transform: 'translateX(-35vw) scale(1)', transformOrigin: 'center center' }}>
          <GlobeAny
            ref={globeRef}
            globeImageUrl={undefined}
            backgroundImageUrl={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761941646/starfield_fdoup4.jpg"}
            globeMaterial={globeMaterialRef.current}
            onGlobeReady={() => setIsGlobeReady(true)}
            animateIn={true}
            // Country borders overlay (stroke only)
            polygonCapColor={() => 'rgba(0,0,0,0)'}
            polygonSideColor={() => 'rgba(0,0,0,0)'}
            polygonStrokeColor={() => 'rgba(255,255,255,0.35)'}
            polygonsTransitionDuration={0}
            polygonAltitude={0.03}
            htmlElementsData={markerData}
            htmlLat={(d: any) => d.lat}
            htmlLng={htmlLng}
            htmlAltitude={htmlAltitude}
            htmlElement={renderHtmlElement}
            showAtmosphere={true}
            atmosphereColor="rgb(206, 233, 255)"
            atmosphereAltitude={0.15}
            enablePointerInteraction={true}
            onZoom={handleZoom}
          />
        </div>
      )}
    </div>
  );
};

export default SolsticeGlobe3D;

