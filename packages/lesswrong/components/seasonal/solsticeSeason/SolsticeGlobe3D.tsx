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

const SolsticeGlobe3D = ({
  pointsData,
  defaultPointOfView,
  onPointClick,
  onReady,
  className,
  style,
  onClick,
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
}) => {
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  // TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  // Boost night texture visibility by increasing emissive on the globe material
  useEffect(() => {
    if (!isGlobeReady || !globeRef.current?.globeMaterial) return;
    try {
      const material = globeRef.current.globeMaterial();
      if (material && material.emissive) {
        material.emissive.set('#999999');
        material.emissiveIntensity = 1.35;
        material.needsUpdate = true;
      }
    } catch (_e) {
      // best-effort enhancement; ignore if underlying lib changes
    }
  }, [isGlobeReady]);

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
            globeImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761803051/earth-blue-marble-night-half_ubxdq2.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            onGlobeReady={() => setIsGlobeReady(true)}
            animateIn={true}
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
            atmosphereColor="#ffffff"
            atmosphereAltitude={0.15}
            enablePointerInteraction={true}
          />
        </div>
      )}
    </div>
  );
};

export default SolsticeGlobe3D;

