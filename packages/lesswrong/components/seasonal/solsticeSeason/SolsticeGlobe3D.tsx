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

// Example map/texture URLs from three-globe/react-globe.gl library:
// Day textures:
// - //unpkg.com/three-globe/example/img/earth-blue-marble.jpg
// - //unpkg.com/three-globe/example/img/earth-dark.jpg
//
// Night textures:
// - //unpkg.com/three-globe/example/img/earth-blue-marble-night.jpg
// - //unpkg.com/three-globe/example/img/earth-blue-marble-night-half.jpg
//
// Background textures:
// - //unpkg.com/three-globe/example/img/night-sky.png
// - //unpkg.com/three-globe/example/img/space.jpg
//
// Alternative sources:
// - https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200401.3x5400x2700.jpg (NASA Blue Marble)
// - https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73963/world.topo.bathy.200412.3x5400x2700.jpg (NASA Blue Marble - different month)

//https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761941357/Equirectangular_projection_world_map_without_borders_emqf42.jpg


//https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761941646/starfield_fdoup4.jpg

// Countries GeoJSON (Natural Earth 110m) used for drawing borders
const COUNTRIES_GEOJSON_URL = '//unpkg.com/three-globe/example/datasets/ne_110m_admin_0_countries.geojson';
// Day-night cycle settings - velocity in minutes per frame (like the example)
const VELOCITY = .1; // minutes per frame

// --- Utility functions ---
// Generate a starfield background as a data URL SVG with deterministic seed
const generateStarBackgroundDataUrl = (width: number, height: number, seed: number): string => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
  <defs>
    <filter id="starfield" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="${seed}" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>
      <feComponentTransfer in="gray" result="small">
        <feFuncR type="gamma" amplitude="1" exponent="0.45" offset="0"/>
        <feFuncG type="gamma" amplitude="1" exponent="0.45" offset="0"/>
        <feFuncB type="gamma" amplitude="1" exponent="0.45" offset="0"/>
      </feComponentTransfer>
      <feComponentTransfer in="gray" result="big">
        <feFuncR type="gamma" amplitude="1" exponent="6.5" offset="0"/>
        <feFuncG type="gamma" amplitude="1" exponent="6.5" offset="0"/>
        <feFuncB type="gamma" amplitude="1" exponent="6.5" offset="0"/>
      </feComponentTransfer>
      <feMorphology in="big" operator="dilate" radius="0.8" result="bigDilated"/>
      <feMerge result="stars">
        <feMergeNode in="small"/>
        <feMergeNode in="bigDilated"/>
      </feMerge>
      <feColorMatrix in="stars" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.6 0" result="final"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#000"/>
  <rect width="100%" height="100%" filter="url(#starfield)"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Build the day-night cycle shader material - exact copy from react-globe.gl example
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createDayNightShaderMaterial = (THREERef: any) => {
  return new THREERef.ShaderMaterial({
    uniforms: {
      dayTexture: { value: null },
      nightTexture: { value: null },
      sunPosition: { value: new THREERef.Vector2() },
      globeRotation: { value: new THREERef.Vector2() },
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
      uniform vec2 sunPosition;
      uniform vec2 globeRotation;
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
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        float blendFactor = smoothstep(-0.1, 0.1, intensity);
        gl_FragColor = mix(nightColor, dayColor, blendFactor);
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

// Centered screen coords helper
const getCenteredScreenCoords = (containerEl: HTMLDivElement | null): { x: number; y: number } | null => {
  if (!containerEl) return null;
  const rect = containerEl.getBoundingClientRect();
  return { x: rect.left + (rect.width / 2), y: rect.top + (rect.height / 2) };
};

// --- Hooks ---
// Create and manage the globe material lifecycle with day-night support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useGlobeDayNightMaterial = (): React.MutableRefObject<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeMaterialRef = useRef<any>(null);
  useEffect(() => {
    globeMaterialRef.current = createDayNightShaderMaterial(THREE);
    return () => {
      if (globeMaterialRef.current && typeof globeMaterialRef.current.dispose === 'function') {
        globeMaterialRef.current.dispose();
      }
    };
  }, []);
  return globeMaterialRef;
};

// Fetch country borders polygons
const useCountryPolygons = (url: string): Array<any> => {
  const [countryPolygons, setCountryPolygons] = useState<Array<any>>([]);
  useEffect(() => {
    let aborted = false;
    fetch(url)
      .then(res => res.json())
      .then((geo: any) => {
        if (!aborted) setCountryPolygons(Array.isArray(geo?.features) ? geo.features : []);
      })
      .catch(() => {
        // Silently ignore fetch errors; borders are optional visual detail
      });
    return () => { aborted = true; };
  }, [url]);
  return countryPolygons;
};

// Dimensions from container (single measurement on mount)
const useContainerDimensions = (containerRef: React.RefObject<HTMLDivElement | null>, initial: { width: number; height: number }) => {
  const [dimensions, setDimensions] = useState(initial);
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width || initial.width, height: rect.height || initial.height });
    }
  }, [containerRef, initial.height, initial.width]);
  return dimensions;
};

// Combine: assign textures, set POV, and call onReady once globe is ready
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useGlobeReadyEffects = (
  isGlobeReady: boolean,
  globeRef: React.MutableRefObject<any>,
  globeMaterialRef: React.MutableRefObject<any>,
  dayImageUrl: string | undefined,
  nightImageUrl: string | undefined,
  pov: PointOfView,
  onReady?: () => void
) => {
  useEffect(() => {
    if (!isGlobeReady || !globeRef.current) return;

    const globeObj = globeRef.current;
    let textureFound = false;

    if (globeObj && globeObj.scene && globeObj.scene.children) {
      const globeMesh = findMeshWithTexture(globeObj.scene);
      if (globeMesh && globeMesh.material) {
        if (globeMaterialRef.current) {
          globeMesh.material = globeMaterialRef.current;
        }
        textureFound = true;
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

    globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: pov.altitude }, 0);
    onReady?.();
  }, [isGlobeReady, globeRef, globeMaterialRef, dayImageUrl, nightImageUrl, pov.lat, pov.lng, pov.altitude, onReady]);
};

// Calculate sun position based on date/time - includes Earth's tilt (declination)
// Based on react-globe.gl example
const sunPosAt = (dt: number): [number, number] => {
  const day = new Date(dt).setUTCHours(0, 0, 0, 0);
  const daysSinceJ2000 = (dt - 946728000000) / 86400000; // J2000 = Jan 1, 2000
  
  // Calculate mean anomaly (simplified)
  const meanAnomaly = (357.5291 + (0.98560028 * daysSinceJ2000)) % 360;
  const meanAnomalyRad = (meanAnomaly * Math.PI) / 180;
  
  // Equation of time (simplified approximation)
  const equationOfTime = 4 * (meanAnomalyRad + (0.0334 * Math.sin(meanAnomalyRad)) - 1.5347);
  
  // Solar declination (Earth's axial tilt effect) - simplified
  const declinationRad = ((23.44 * Math.PI) / 180) * Math.sin((2 * Math.PI * ((daysSinceJ2000 + 284) / 365.25)));
  const declination = (declinationRad * 180) / Math.PI;
  
  // Calculate longitude based on time of day
  const longitude = (((day - dt) / 86400000) * 360) - 180;
  
  return [longitude - (equationOfTime / 4), declination];
};

// Day-night cycle animation hook - exact copy from react-globe.gl example
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useDayNightCycle = (globeRef: React.MutableRefObject<any>, globeMaterialRef: React.MutableRefObject<any>, isGlobeReady: boolean, pov: PointOfView) => {
  const [dt, setDt] = useState(+new Date());
  
  useEffect(() => {
    if (!isGlobeReady || !globeMaterialRef.current) return;

    let animationFrameId: number;
    
    const iterateTime = () => {
      setDt(dt => dt + (VELOCITY * 60 * 1000));
      animationFrameId = requestAnimationFrame(iterateTime);
    };
    
    iterateTime();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isGlobeReady, globeMaterialRef]);
  
  useEffect(() => {
    if (!globeMaterialRef.current) return;
    
    // Update sun position based on current time
    const sunPos = sunPosAt(dt);
    if (globeMaterialRef.current.uniforms?.sunPosition) {
      globeMaterialRef.current.uniforms.sunPosition.value.set(sunPos[0], sunPos[1]);
    }
  }, [dt, globeMaterialRef]);
  
  useEffect(() => {
    if (!globeRef.current || !globeMaterialRef.current) return;
    
    // Update globe rotation when POV changes
    if (globeMaterialRef.current.uniforms?.globeRotation) {
      globeMaterialRef.current.uniforms.globeRotation.value.set(pov.lng, pov.lat);
    }
  }, [globeRef, globeMaterialRef, pov.lat, pov.lng]);
};

const SolsticeGlobe3D = ({
  pointsData,
  defaultPointOfView,
  onPointClick,
  onReady,
  className,
  style,
  onClick,
  dayImageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761946618/flat_earth_Largest_still_blchxn.jpg",
  nightImageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761947544/earth-night_fratqn.jpg",
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
  // Marker rendering controls
  markerRenderer?: 'glow' | 'sphere' | 'custom';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customPointThreeObject?: (p: any) => any;
  usePointColor?: boolean;
  altitudeScale?: number;
  pointSizeMultiplier?: number;
  initialAltitudeMultiplier?: number;
}) => {
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  // TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useContainerDimensions(containerRef, { width: 800, height: 600 });
  // Create material with day-night cycle shader
  const globeMaterialRef = useGlobeDayNightMaterial();
  const countryPolygons = useCountryPolygons(COUNTRIES_GEOJSON_URL);

  const starBackgroundUrl = useMemo<string>(() => {
    const width = Math.max(1, Math.floor(dimensions.width || 1920));
    const height = Math.max(1, Math.floor(dimensions.height || 1080));
    const seed = Math.floor(Math.random() * 1000000);
    return generateStarBackgroundDataUrl(width, height, seed);
  }, [dimensions.width, dimensions.height]);
  
  // Initialize: assign textures, set POV, and invoke onReady when ready
  const initialPov = useMemo(() => ({
    lat: defaultPointOfView.lat,
    lng: defaultPointOfView.lng,
    altitude: defaultPointOfView.altitude * initialAltitudeMultiplier,
  }), [defaultPointOfView.lat, defaultPointOfView.lng, defaultPointOfView.altitude, initialAltitudeMultiplier]);
  useGlobeReadyEffects(isGlobeReady, globeRef, globeMaterialRef, dayImageUrl, nightImageUrl, initialPov, onReady);
  
  // Start day-night cycle animation
  useDayNightCycle(globeRef, globeMaterialRef, isGlobeReady, initialPov);

  // Update globe rotation when user zooms/interacts (matches example)
  const handleZoom = useCallback(({ lng, lat }: { lng: number; lat: number }) => {
    if (globeMaterialRef.current?.uniforms?.globeRotation) {
      globeMaterialRef.current.uniforms.globeRotation.value.set(lng, lat);
    }
  }, [globeMaterialRef]);

  // Convert points data to format expected by react-globe.gl
  const markerData = mapPointsToMarkers(pointsData);

  const handlePointClick = (point: SolsticeGlobePoint) => {
    const screenCoords = getCenteredScreenCoords(containerRef.current);
    if (screenCoords && onPointClick) {
      onPointClick(point, screenCoords);
    }
  };

  // HTML marker renderer function based on react-globe.gl example
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderHtmlElement = (d: any) => {
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
        handlePointClick(originalPoint);
      }
    });
    return el;
  };

  return (
    <div
      ref={containerRef}
      style={{ ...style, cursor: 'grab', width: '100%', height: '100vh' }}
      className={className}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
    >
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
            polygonsData={countryPolygons}
            polygonCapColor={() => 'rgba(0,0,0,0)'}
            polygonSideColor={() => 'rgba(0,0,0,0)'}
            polygonStrokeColor={() => 'rgba(255,255,255,0.35)'}
            polygonsTransitionDuration={0}
            polygonAltitude={0.03}
            htmlElementsData={markerData}
            htmlLat={(d: any) => d.lat}
            htmlLng={(d: any) => d.lng}
            htmlAltitude={(d: any) => {
              const base = typeof d.size === 'number' ? d.size : 1;
              return base * altitudeScale * 0.01;
            }}
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

