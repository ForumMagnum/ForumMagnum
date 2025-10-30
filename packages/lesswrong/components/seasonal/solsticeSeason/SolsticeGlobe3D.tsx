import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-globe.gl to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

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
  const globeRef = useRef<{ pointOfView: (pos: { lat: number; lng: number; altitude: number }, transitionDuration?: number) => void } | null>(null);
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
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
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
      style={{ ...style, cursor: 'grab', width: '100%', height: '100%' }}
      className={className}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
    >
      {typeof window !== 'undefined' && (
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          onGlobeReady={() => setIsGlobeReady(true)}
          animateIn={true}
          pointOfView={{
            lat: defaultPointOfView.lat,
            lng: defaultPointOfView.lng,
            altitude: defaultPointOfView.altitude,
          }}
          pointsData={markerData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius="size"
          pointResolution={8}
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
      )}
    </div>
  );
};

export default SolsticeGlobe3D;

