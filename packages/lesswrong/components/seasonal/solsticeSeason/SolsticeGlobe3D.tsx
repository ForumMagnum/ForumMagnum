import React, { useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SolsticeGlobe3DProps, SolsticeGlobePoint, PointClickCallback } from './types';
import { useGlobeDayNightMaterial, useGlobeReadyEffects, useGlobeAnimation, useFramerate } from './hooks';
import { mapPointsToMarkers } from './utils';
import { useEventListener } from '@/components/hooks/useEventListener';
import { DEFAULT_DAY_IMAGE_URL, DEFAULT_NIGHT_IMAGE_URL, DEFAULT_LUMINOSITY_IMAGE_URL, DEFAULT_ALTITUDE_SCALE, DEFAULT_INITIAL_ALTITUDE_MULTIPLIER } from './solsiceSeasonConstants';

// Dynamically import react-globe.gl to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });
// TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
const GlobeAny = Globe as unknown as any;

export const SolsticeGlobe3D = ({
  pointsData,
  defaultPointOfView,
  onPointClick,
  onReady,
  onFullyLoaded,
  className,
  style,
  onClick,
  dayImageUrl = DEFAULT_DAY_IMAGE_URL,
  nightImageUrl = DEFAULT_NIGHT_IMAGE_URL,
  luminosityImageUrl = DEFAULT_LUMINOSITY_IMAGE_URL,
  altitudeScale = DEFAULT_ALTITUDE_SCALE,
  initialAltitudeMultiplier = DEFAULT_INITIAL_ALTITUDE_MULTIPLIER,
}: SolsticeGlobe3DProps) => {
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  // TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  const globeRef = useRef<any>(null);
  const globeMaterialRef = useGlobeDayNightMaterial();
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const shouldIgnoreClickRef = useRef(false);

  const initialPov = useMemo(() => ({
    lat: defaultPointOfView.lat,
    lng: defaultPointOfView.lng,
    altitude: defaultPointOfView.altitude * initialAltitudeMultiplier,
  }), [defaultPointOfView.lat, defaultPointOfView.lng, defaultPointOfView.altitude, initialAltitudeMultiplier]);
  useGlobeReadyEffects(isGlobeReady, globeRef, globeMaterialRef, dayImageUrl, nightImageUrl, luminosityImageUrl, initialPov, onReady, () => {
    setIsFullyLoaded(true);
    onFullyLoaded?.();
  });
  
  const textureRotationRef = useGlobeAnimation(globeMaterialRef, isGlobeReady, initialPov, isRotating);
  const fps = useFramerate(isGlobeReady, globeRef);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  }, []);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (dragStartRef.current) {
      const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      if (deltaX > 5 || deltaY > 5) {
        isDraggingRef.current = true;
      }
    }
  }, []);

  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (dragStartRef.current && isDraggingRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      if (deltaX < -10) {
        setIsRotating(true);
        shouldIgnoreClickRef.current = true;
        setTimeout(() => {
          shouldIgnoreClickRef.current = false;
        }, 0);
      }
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }, []);

  useEventListener('mousemove', handleGlobalMouseMove);
  useEventListener('mouseup', handleGlobalMouseUp);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldIgnoreClickRef.current) {
      return;
    }
    setIsRotating(false);
    onClick?.(e);
  }, [onClick]);
  const handleZoom = useCallback(({ lng, lat }: { lng: number; lat: number }) => {
    if (globeMaterialRef.current?.uniforms?.globeRotation) {
      globeMaterialRef.current.uniforms.globeRotation.value.set(lng, lat);
    }
  }, [globeMaterialRef]);

  const markerData = mapPointsToMarkers(pointsData);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findPoint = useCallback((d: any) => {
    return pointsData.find(p => 
      (d._index !== undefined && p === pointsData[d._index]) || 
      (d.eventId && p.eventId === d.eventId)
    ) || d;
  }, [pointsData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderHtmlElement = useCallback((d: any) => {
    const point = findPoint(d);
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
      const originalPoint = findPoint(d);
      if (originalPoint && onPointClick) {
        onPointClick(originalPoint, { x: e.clientX, y: e.clientY });
      }
    });
    return el;
  }, [findPoint, onPointClick]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const htmlLng = useCallback((d: any) => {
    const rotationDegrees = (textureRotationRef.current * 180) / Math.PI;
    return d.lng - rotationDegrees;
  }, [textureRotationRef]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const htmlAltitude = useCallback((d: any) => {
    return (typeof d.size === 'number' ? d.size : 1) * altitudeScale * 0.01;
  }, [altitudeScale]);

  return (
    <div
      style={{ ...style, cursor: 'grab', width: '100%', height: '100vh', position: 'relative', opacity: isFullyLoaded ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}
      className={className}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {typeof window !== 'undefined' && isGlobeReady && (
        <div style={{ position: 'absolute', top: '300px', right: '10px', color: 'white', fontFamily: 'monospace', fontSize: '14px', zIndex: 1000, pointerEvents: 'none' }}>
          {fps} FPS
        </div>
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

// Re-export types for convenience
export type { SolsticeGlobePoint, PointOfView, PointClickCallback, SolsticeGlobe3DProps } from './types';

