import React, { useEffect, useState, useRef } from 'react';
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

// Contrast enhancement properties
const CONTRAST_AMOUNT = 1.25; // Higher values = more contrast (bright parts brighter, dark parts darker)
const BRIGHTNESS_BOOST = 1.5; // Multiplier for overall brightness
const BRIGHTNESS_ADD = 0.12; // Additive brightness component (0-1 range)
// Countries GeoJSON (Natural Earth 110m) used for drawing borders
const COUNTRIES_GEOJSON_URL = '//unpkg.com/three-globe/example/datasets/ne_110m_admin_0_countries.geojson';

const SolsticeGlobe3D = ({
  pointsData,
  defaultPointOfView,
  onPointClick,
  onReady,
  className,
  style,
  onClick,
  globeImageUrl = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761897106/earth-day-night-light_v34otw.jpg",
}: {
  pointsData: Array<SolsticeGlobePoint>;
  defaultPointOfView: PointOfView;
  onPointClick?: PointClickCallback;
  onReady?: () => void;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: any;
  // URL for the globe texture. Accepts JPG, PNG, or SVG formats. Note: SVGs will be rasterized at load time.
  // For best performance with 3D globe textures, equirectangular bitmap images (JPG/PNG) are recommended.
  // The image should use an equirectangular projection (360° horizontal, 180° vertical).
  globeImageUrl?: string;
}) => {
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  // TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Create material with contrast enhancement shader for high contrast
  const globeMaterialRef = useRef<any>(null);
  const [countryPolygons, setCountryPolygons] = useState<Array<any>>([]);
  
  useEffect(() => {
    // Custom shader material that enhances contrast (bright parts brighter, dark parts darker)
    // react-globe.gl will apply the texture from globeImageUrl to this material
    globeMaterialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: null },
        contrast: { value: CONTRAST_AMOUNT },
        brightness: { value: BRIGHTNESS_BOOST },
        brightnessAdd: { value: BRIGHTNESS_ADD },
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
    
    return () => {
      if (globeMaterialRef.current && typeof globeMaterialRef.current.dispose === 'function') {
        globeMaterialRef.current.dispose();
      }
    };
  }, []);

  // Load country borders GeoJSON for stroke-only borders overlay
  useEffect(() => {
    let aborted = false;
    fetch(COUNTRIES_GEOJSON_URL)
      .then(res => res.json())
      .then((geo: any) => {
        if (!aborted) setCountryPolygons(Array.isArray(geo?.features) ? geo.features : []);
      })
      .catch(() => {
        // Silently ignore fetch errors; borders are optional visual detail
      });
    return () => {
      aborted = true;
    };
  }, []);
  
  // Hook into globe ready to assign texture to shader
  useEffect(() => {
    if (isGlobeReady && globeRef.current && globeMaterialRef.current) {
      // Try to access the globe's mesh and get the texture
      // react-globe.gl applies textures internally, so we need to hook in
      const globeObj = globeRef.current;
      let textureFound = false;
      
      if (globeObj && globeObj.scene && globeObj.scene.children) {
        const findGlobeMesh = (obj: any): any => {
          if (obj.type === 'Mesh' && obj.material && obj.material.map) {
            return obj;
          }
          for (const child of obj.children || []) {
            const found = findGlobeMesh(child);
            if (found) return found;
          }
          return null;
        };
        
        const globeMesh = findGlobeMesh(globeObj.scene);
        if (globeMesh && globeMesh.material && globeMesh.material.map) {
          // Assign the loaded texture to our shader material
          globeMaterialRef.current.uniforms.map.value = globeMesh.material.map;
          // Update the material on the mesh
          globeMesh.material = globeMaterialRef.current;
          textureFound = true;
        }
      }
      
      // Fallback: load texture ourselves if react-globe.gl didn't provide it
      if (!textureFound && globeImageUrl) {
        const loader = new THREE.TextureLoader();
        loader.load(
          globeImageUrl,
          (texture: any) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            if (globeMaterialRef.current) {
              globeMaterialRef.current.uniforms.map.value = texture;
            }
          }
        );
      }
    }
  }, [isGlobeReady, globeImageUrl]);

  useEffect(() => {
    // Set dimensions based on container size
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: rect.width || 800,
        height: rect.height || 600,
      });
    }
  }, []);

  useEffect(() => {
    // Set initial point of view when globe is ready
    if (isGlobeReady && globeRef.current) {
      globeRef.current.pointOfView(
        {
          lat: defaultPointOfView.lat,
          lng: defaultPointOfView.lng,
          altitude: defaultPointOfView.altitude,
        },
        0
      );
    }
  }, [defaultPointOfView.lat, defaultPointOfView.lng, defaultPointOfView.altitude, isGlobeReady]);

  useEffect(() => {
    if (isGlobeReady) {
      onReady?.();
    }
  }, [isGlobeReady, onReady]);

  // Convert points data to format expected by react-globe.gl
  const markerData = pointsData.map((point, index) => ({
    lat: point.lat,
    lng: point.lng,
    size: point.size,
    color: point.color,
    eventId: point.eventId,
    event: point.event,
    _index: index, // Store original index for matching
  }));

  // Get screen coordinates for a lat/lng point
  const getScreenCoordinates = (lat: number, lng: number): { x: number; y: number } | null => {
    if (!containerRef.current || !globeRef.current) return null;
    
    // For react-globe.gl, we can't directly get screen coordinates from lat/lng
    // This is a simplified approximation - in a real implementation, you might need
    // to use the Three.js camera and raycasting
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2),
      y: rect.top + (rect.height / 2),
    };
  };

  const handlePointClick = (point: SolsticeGlobePoint) => {
    const screenCoords = getScreenCoordinates(point.lat, point.lng);
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
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
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
            pointAltitude={(p: any) => {
              const base = typeof p.size === 'number' ? p.size : 1;
              return base * 0.099;
            }}
            pointResolution={8}
            // Make points maximally bright by rendering as unlit spheres with additive glow
            pointThreeObject={(p: any) => {
              const color = new THREE.Color(p.color ?? '#ffffff');
              const baseSize = typeof p.size === 'number' ? p.size * 100 : 1;
              // Core bright sphere (unlit, always bright)
              const core = new THREE.Mesh(
                new THREE.SphereGeometry(Math.max(baseSize * 0.05, 0.02), 16, 16),
                new THREE.MeshBasicMaterial({ color, transparent: true })
              );
              core.renderOrder = 999;
              // Additive glow sprite for extra emissive look
              const glowMaterial = new THREE.SpriteMaterial({
                color,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              });
              const glow = new THREE.Sprite(glowMaterial);
              const glowScale = Math.max(baseSize * 0.6, 0.3);
              glow.scale.set(glowScale, glowScale, 1);
              core.add(glow);
              return core;
            }}
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
            atmosphereColor="#aaaaff"
            atmosphereAltitude={0.1}
            enablePointerInteraction={true}
          />
        </div>
      )}
    </div>
  );
};

export default SolsticeGlobe3D;

