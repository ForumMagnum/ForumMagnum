import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { SolsticeGlobe3DProps, SolsticeGlobePoint } from './types';
import { useGlobeDayNightMaterial, useGlobeReadyEffects, useGlobeAnimation, useFramerate } from './hooks';
import { mapPointsToMarkers } from './utils';
import { useEventListener } from '@/components/hooks/useEventListener';
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
  const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 1000);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const globeMaterialRef = useGlobeDayNightMaterial();
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const shouldIgnoreClickRef = useRef(false);
  const clickIgnoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const initialPov = useMemo(() => ({
    lat: defaultPointOfView.lat,
    lng: defaultPointOfView.lng,
    altitude: defaultPointOfView.altitude * initialAltitudeMultiplier,
  }), [defaultPointOfView.lat, defaultPointOfView.lng, defaultPointOfView.altitude, initialAltitudeMultiplier]);
  useGlobeReadyEffects(isGlobeReady, globeRef, globeMaterialRef, dayImageUrl, nightImageUrl, luminosityImageUrl, initialPov, onReady, () => {
    setIsFullyLoaded(true);
    onFullyLoaded?.();
  });
  
  // Helper function to find marker element by checking all markers' bounding boxes
  // Finds all divs with data-globe-marker, checks their dimensions, and returns the one containing the click
  const findMarkerElement = useCallback((element: HTMLElement | null, clientX?: number, clientY?: number): HTMLElement | null => {
    // Find all divs with data-globe-marker
    const allMarkers = Array.from(document.querySelectorAll('div[data-globe-marker]'));
    
    // If we have click coordinates, check if the click is within any marker's bounds
    if (clientX !== undefined && clientY !== undefined) {
      for (const marker of allMarkers) {
        if (marker instanceof HTMLElement) {
          const rect = marker.getBoundingClientRect();
          if (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
          ) {
            return marker;
          }
        }
      }
    }
    
    // Fallback: try traversing up the parent chain from the element
    let current: HTMLElement | null = element;
    while (current) {
      if (current.hasAttribute && current.hasAttribute('data-globe-marker')) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }, []);

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
    e.stopPropagation();
    // Check if the click was on a marker element (don't ignore marker clicks)
    const target = e.target as HTMLElement;
    const markerElement = findMarkerElement(target, e.clientX, e.clientY);
    const isMarkerClick = markerElement !== null || target.closest('svg') !== null;
    
    if (dragStartRef.current && isDraggingRef.current && !isMarkerClick) {
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
    } else if (isMarkerClick) {
      // Reset ignore flag for marker clicks
      shouldIgnoreClickRef.current = false;
      if (clickIgnoreTimeoutRef.current) {
        clearTimeout(clickIgnoreTimeoutRef.current);
        clickIgnoreTimeoutRef.current = null;
      }
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }, [findMarkerElement]);

  useEventListener('mousemove', handleGlobalMouseMove);
  useEventListener('mouseup', handleGlobalMouseUp);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Handle clicks on markers using event delegation
    const target = e.target as HTMLElement;
    const markerElement = findMarkerElement(target, e.clientX, e.clientY);
    
    if (markerElement) {
      // This is a marker click - handle it
      const markerIndexStr = markerElement.getAttribute('data-marker-index');
      if (markerIndexStr !== null) {
        const markerIndex = parseInt(markerIndexStr, 10);
        if (!isNaN(markerIndex) && markerIndex >= 0 && markerIndex < pointsData.length) {
          const originalPoint = pointsData[markerIndex];
          
          // Check if click was on SVG (meetup type click) or div (point click)
          const isSvgClick = target.closest('svg') !== null;
          
          
          // Always trigger popup on marker click
          if (onPointClick && originalPoint.eventId) {
            const solsticePoint: SolsticeGlobePoint = {
              lat: originalPoint.lat,
              lng: originalPoint.lng,
              size: originalPoint.size,
              eventId: originalPoint.eventId,
              event: originalPoint.event,
            };
            onPointClick(solsticePoint, { x: e.clientX, y: e.clientY });
          }
        }
      }
      return;
    }
    
    if (shouldIgnoreClickRef.current) {
      return;
    }
    setIsRotating(false);
    onClick?.(e);
  }, [onClick, pointsData, onPointClick, findMarkerElement]);
  const handleZoom = useCallback(({ lng, lat }: { lng: number; lat: number }) => {
    if (globeMaterialRef.current?.uniforms?.globeRotation) {
      globeMaterialRef.current.uniforms.globeRotation.value.set(lng, lat);
    }
  }, [globeMaterialRef]);

  const markerData: GlobeMarkerData[] = mapPointsToMarkers(pointsData);
  
  const getOriginalPoint = useCallback((d: GlobeMarkerData): SolsticeGlobePoint | null => {
    // Use _index to directly access the original point from pointsData
    if (d._index !== undefined && d._index >= 0 && d._index < pointsData.length) {
      return pointsData[d._index];
    }
    // Fallback: try to find by eventId
    if (d.eventId) {
      const found = pointsData.find(p => p.eventId === d.eventId);
      if (found) return found;
    }
    return null;
  }, [pointsData]);

  const renderHtmlElement = useCallback((d: GlobeMarkerData): HTMLElement => {
    const originalPoint = getOriginalPoint(d);
    const color = typeof originalPoint?.color === 'string' ? originalPoint.color : '#FFD700';
    const markerSize = screenHeight * 0.024;
    const el = document.createElement('div');
    el.setAttribute('data-globe-marker', 'true');
    // Store the index as a data attribute so we can look it up on click
    el.setAttribute('data-marker-index', String(d._index));
    el.style.color = color;
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <div style="text-align: center;">
        <svg viewBox="0 0 24 24" style="width:${markerSize}px;margin:0 auto;">
          <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 3.25 2.5 6.75 7 11.54 4.5-4.79 7-8.29 7-11.54 0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
      </div>
    `;
    
    // Attach click handler directly to the element when it's created
    // This is the proper way to handle clicks on HTML elements in react-globe.gl
    el.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      const target = e.target as HTMLElement;
      const markerIndex = d._index;
      
      if (markerIndex >= 0 && markerIndex < pointsData.length) {
        const point = pointsData[markerIndex];
        
        // Check if click was on SVG (meetup type click) or div (point click)
        const isSvgClick = target.closest('svg') !== null;
        
        // Always trigger popup on marker click
        if (onPointClick && point.eventId) {
          const solsticePoint: SolsticeGlobePoint = {
            lat: point.lat,
            lng: point.lng,
            size: point.size,
            eventId: point.eventId,
            event: point.event,
          };
          onPointClick(solsticePoint, { x: e.clientX, y: e.clientY });
        }
      }
    });
    
    return el;
  }, [getOriginalPoint, pointsData, onPointClick, screenHeight]);
  
  // const htmlLng = useCallback((d: GlobeMarkerData): number => {
  //   const rotationDegrees = (textureRotationRef.current * 180) / Math.PI;
  //   return d.lng - rotationDegrees;
  // }, [textureRotationRef]);
  
  const htmlAltitude = useCallback((d: GlobeMarkerData): number => {
    return (typeof d.size === 'number' ? d.size : 1) * altitudeScale * 0.01;
  }, [altitudeScale]);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        // Lock vertical rotation by setting min and max polar angle to the same value
        // Math.PI / 3 is 60 degrees (30 degrees higher than equator view)
        controls.minPolarAngle = Math.PI / 3;
        controls.maxPolarAngle = Math.PI / 3;
      }
    }
  }, [isGlobeReady]);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ ...style, cursor: 'grab', width: '100%', height: screenHeight, position: 'relative', opacity: isFullyLoaded ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}
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
          // htmlLng={htmlLng}
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


