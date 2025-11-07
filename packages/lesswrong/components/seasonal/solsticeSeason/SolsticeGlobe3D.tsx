import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { SolsticeGlobe3DProps, SolsticeGlobePoint } from './types';
import { useGlobeDayNightMaterial, useGlobeReadyEffects, useGlobeAnimation, useFramerate } from './hooks';
import { mapPointsToMarkers } from './utils';
import { useEventListener } from '@/components/hooks/useEventListener';
import { useThemeColor } from '@/components/themes/useTheme';
import { DEFAULT_DAY_IMAGE_URL, DEFAULT_NIGHT_IMAGE_URL, DEFAULT_LUMINOSITY_IMAGE_URL, DEFAULT_ALTITUDE_SCALE, DEFAULT_INITIAL_ALTITUDE_MULTIPLIER } from './solsiceSeasonConstants';
import { type GlobeMethods } from 'react-globe.gl';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl').then(mod => mod.default), { ssr: false });

type GlobeMarkerData = {
  lat: number;
  lng: number;
  size: number;
  color?: string;
  eventId?: string;
  event?: unknown;
  _index: number;
};

export const SolsticeGlobe3D = ({
  pointsData,
  defaultPointOfView,
  onPointClick,
  onReady,
  onFullyLoaded,
  onFpsChange,
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
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const globeMaterialRef = useGlobeDayNightMaterial();
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const shouldIgnoreClickRef = useRef(false);
  const clickIgnoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  
  useEffect(() => {
    if (fps && onFpsChange) {
      onFpsChange(fps);
    }
  }, [fps, onFpsChange]);
  
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
        // Clear any existing timeout to prevent accumulation
        if (clickIgnoreTimeoutRef.current) {
          clearTimeout(clickIgnoreTimeoutRef.current);
        }
        clickIgnoreTimeoutRef.current = setTimeout(() => {
          shouldIgnoreClickRef.current = false;
          clickIgnoreTimeoutRef.current = null;
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

  const markerData: GlobeMarkerData[] = mapPointsToMarkers(pointsData);
  
  const findPoint = useCallback((d: GlobeMarkerData): GlobeMarkerData => {
    return pointsData.find(p => 
      (d._index !== undefined && p === pointsData[d._index]) || 
      (d.eventId && p.eventId === d.eventId)
    ) ? d : d;
  }, [pointsData]);

  const renderHtmlElement = useCallback((d: GlobeMarkerData): HTMLElement => {
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
        const solsticePoint: SolsticeGlobePoint = {
          lat: originalPoint.lat,
          lng: originalPoint.lng,
          size: originalPoint.size,
          eventId: originalPoint.eventId,
          event: originalPoint.event,
        };
        onPointClick(solsticePoint, { x: e.clientX, y: e.clientY });
      }
    });
    return el;
  }, [findPoint, onPointClick]);
  
  const htmlLng = useCallback((d: GlobeMarkerData): number => {
    const rotationDegrees = (textureRotationRef.current * 180) / Math.PI;
    return d.lng - rotationDegrees;
  }, [textureRotationRef]);
  
  const htmlAltitude = useCallback((d: GlobeMarkerData): number => {
    return (typeof d.size === 'number' ? d.size : 1) * altitudeScale * 0.01;
  }, [altitudeScale]);

  return (
    <div
      style={{ ...style, cursor: 'grab', width: '100%', height: '100vh', position: 'relative', opacity: isFullyLoaded ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}
      className={className}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div style={{ transform: 'translateX(-35vw) scale(1)', transformOrigin: 'center center' }}>
        <Globe
          ref={globeRef}
          globeImageUrl={undefined}
          backgroundImageUrl={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1761941646/starfield_fdoup4.jpg"}
          globeMaterial={globeMaterialRef.current}
          onGlobeReady={() => setIsGlobeReady(true)}
          animateIn={true}
          polygonsTransitionDuration={0}
          polygonAltitude={0.03}
          htmlElementsData={markerData}
          htmlLat={(d: GlobeMarkerData) => d.lat}
          htmlLng={htmlLng}
          htmlAltitude={htmlAltitude}
          htmlElement={renderHtmlElement}
          showAtmosphere={true}
          atmosphereColor="light-dark(rgb(206, 233, 255), rgb(206, 233, 255))"
          atmosphereAltitude={0.15}
          enablePointerInteraction={true}
          onZoom={handleZoom}
        />
      </div>
    </div>
  );
};

export default SolsticeGlobe3D;


