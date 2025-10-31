import React, { useEffect, useState, useRef, useMemo } from 'react';
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

// Contrast enhancement properties
const CONTRAST_AMOUNT = 1.25; // Higher values = more contrast (bright parts brighter, dark parts darker)
const BRIGHTNESS_BOOST = 1; // Multiplier for overall brightness
const BRIGHTNESS_ADD = 0.1; // Additive brightness component (0-1 range)
// Countries GeoJSON (Natural Earth 110m) used for drawing borders
const COUNTRIES_GEOJSON_URL = '//unpkg.com/three-globe/example/datasets/ne_110m_admin_0_countries.geojson';

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

// Build the contrast-enhancing shader material
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createContrastShaderMaterial = (THREERef: any, contrast: number, brightness: number, brightnessAdd: number) => {
  return new THREERef.ShaderMaterial({
    uniforms: {
      map: { value: null },
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
      uniform sampler2D map;
      uniform float contrast;
      uniform float brightness;
      uniform float brightnessAdd;
      varying vec2 vUv;
      
      void main() {
        vec4 texColor = texture2D(map, vUv);
        
        // Apply brightness boost: both multiplicative and additive
        vec3 brightened = texColor.rgb * brightness + brightnessAdd;
        
        // Apply contrast enhancement: center around 0.5, scale, then add back
        // This makes bright parts brighter and dark parts darker
        vec3 contrastAdjusted = (brightened - 0.5) * contrast + 0.5;
        
        // Clamp to valid range
        vec3 finalColor = clamp(contrastAdjusted, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, texColor.a);
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

// Factory to build a glowing marker renderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeGlowPointThreeObject = (usePointColor: boolean, pointSizeMultiplier: number) => (p: any) => {
  const colorString = usePointColor && typeof p.color === 'string' ? p.color : '#ffffff';
  const baseSize = typeof p.size === 'number' ? p.size * pointSizeMultiplier : 1;
  const coreMaterial = new THREE.MeshBasicMaterial({ color: colorString, transparent: true });
  coreMaterial.toneMapped = false;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(baseSize * 0.05, 0.02), 16, 16),
    coreMaterial
  );
  core.renderOrder = 999;
  const glowMaterial = new THREE.SpriteMaterial({
    color: colorString,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  glowMaterial.toneMapped = false;
  const glow = new THREE.Sprite(glowMaterial);
  const glowScale = Math.max(baseSize * 0.6, 0.3);
  glow.scale.set(glowScale, glowScale, 1);
  core.add(glow);
  return core;
};

// (inlined below where used)

// Centered screen coords helper
const getCenteredScreenCoords = (containerEl: HTMLDivElement | null): { x: number; y: number } | null => {
  if (!containerEl) return null;
  const rect = containerEl.getBoundingClientRect();
  return { x: rect.left + (rect.width / 2), y: rect.top + (rect.height / 2) };
};

// --- Hooks ---
// Create and manage the globe material lifecycle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useGlobeContrastMaterial = (): React.MutableRefObject<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeMaterialRef = useRef<any>(null);
  useEffect(() => {
    globeMaterialRef.current = createContrastShaderMaterial(THREE, CONTRAST_AMOUNT, BRIGHTNESS_BOOST, BRIGHTNESS_ADD);
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

// Combine: assign texture, set POV, and call onReady once globe is ready
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useGlobeReadyEffects = (
  isGlobeReady: boolean,
  globeRef: React.MutableRefObject<any>,
  globeMaterialRef: React.MutableRefObject<any>,
  globeImageUrl: string | undefined,
  pov: PointOfView,
  onReady?: () => void
) => {
  useEffect(() => {
    if (!isGlobeReady || !globeRef.current) return;

    const globeObj = globeRef.current;
    let textureFound = false;

    if (globeObj && globeObj.scene && globeObj.scene.children) {
      const globeMesh = findMeshWithTexture(globeObj.scene);
      if (globeMesh && globeMesh.material && globeMesh.material.map) {
        if (globeMaterialRef.current) {
          globeMaterialRef.current.uniforms.map.value = globeMesh.material.map;
          globeMesh.material = globeMaterialRef.current;
        }
        textureFound = true;
      }
    }

    if (!textureFound && globeImageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        globeImageUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (texture: any) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          if (globeMaterialRef.current) {
            globeMaterialRef.current.uniforms.map.value = texture;
          }
        }
      );
    }

    globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: pov.altitude }, 0);
    onReady?.();
  }, [isGlobeReady, globeRef, globeMaterialRef, globeImageUrl, pov.lat, pov.lng, pov.altitude, onReady]);
};

const SolsticeGlobe3D = ({
  pointsData,
  defaultPointOfView,
  onPointClick,
  onReady,
  className,
  style,
  onClick,
  globeImageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761942539/earth-day-night-dark_p4ltda.jpg",
  // Marker rendering controls
  markerRenderer = 'glow',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customPointThreeObject,
  usePointColor = false,
  altitudeScale = 0.099,
  pointSizeMultiplier = 100,
  initialAltitudeMultiplier = 1.6,
}: {
  pointsData: Array<SolsticeGlobePoint>;
  defaultPointOfView: PointOfView;
  onPointClick?: PointClickCallback;
  onReady?: () => void;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  // URL for the globe texture. Accepts JPG, PNG, or SVG formats. Note: SVGs will be rasterized at load time.
  // For best performance with 3D globe textures, equirectangular bitmap images (JPG/PNG) are recommended.
  // The image should use an equirectangular projection (360° horizontal, 180° vertical).
  globeImageUrl?: string;
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
  // Create material with contrast enhancement shader for high contrast
  const globeMaterialRef = useGlobeContrastMaterial();
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
  useGlobeReadyEffects(isGlobeReady, globeRef, globeMaterialRef, globeImageUrl, initialPov, onReady);

  // Convert points data to format expected by react-globe.gl
  const markerData = mapPointsToMarkers(pointsData);

  const glowPointThreeObject = makeGlowPointThreeObject(usePointColor, pointSizeMultiplier);
  // Choose which renderer to use: built-in spheres, our glow geometry, or a custom factory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pointThreeObject: any = (
    markerRenderer === 'sphere'
      ? undefined
      : (markerRenderer === 'custom' ? (customPointThreeObject ?? glowPointThreeObject) : glowPointThreeObject)
  );

  const handlePointClick = (point: SolsticeGlobePoint) => {
    const screenCoords = getCenteredScreenCoords(containerRef.current);
    if (screenCoords && onPointClick) {
      onPointClick(point, screenCoords);
    }
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
            globeImageUrl={globeImageUrl}
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
            pointsData={markerData}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointRadius="size"
            // Reduce vertical height of meetup nodes to ~1/3 of typical altitude
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pointAltitude={(p: any) => {
              const base = typeof p.size === 'number' ? p.size : 1;
              return base * altitudeScale;
            }}
            pointResolution={8}
            // Use selected renderer; when undefined, falls back to library's colored spheres
            pointThreeObject={pointThreeObject}
            onPointClick={(point: any) => {
              if (point) {
                // Find the original point by index or eventId
                const originalPoint = point._index !== undefined 
                  ? pointsData[point._index]
                  : pointsData.find(p => p.eventId === point.eventId);
                if (originalPoint) {
                  handlePointClick(originalPoint);
                }
              }
            }}
            pointsMerge={false}
            showAtmosphere={true}
            atmosphereColor="rgb(206, 233, 255)"
            atmosphereAltitude={0.15}
            enablePointerInteraction={true}
          />
        </div>
      )}
    </div>
  );
};

export default SolsticeGlobe3D;

