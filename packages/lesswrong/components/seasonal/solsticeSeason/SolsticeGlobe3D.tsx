import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { SolsticeGlobe3DProps, SolsticeGlobePoint } from './types';
import { useGlobeDayNightMaterial, useGlobeReadyEffects } from './hooks';
import { mapPointsToMarkers } from './utils';
import { useEventListener } from '@/components/hooks/useEventListener';
import { DEFAULT_DAY_IMAGE_URL, DEFAULT_NIGHT_IMAGE_URL, DEFAULT_LUMINOSITY_IMAGE_URL, DEFAULT_ALTITUDE_SCALE, DEFAULT_INITIAL_ALTITUDE_MULTIPLIER } from './solsticeSeasonConstants';
import { type GlobeMethods } from 'react-globe.gl';
import dynamic from 'next/dynamic';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

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

const styles = defineStyles("SolsticeGlobe3D", (theme: ThemeType) => ({
  root: {
    width: '100%',
    position: 'relative',
    transition: 'opacity 0.8s ease-in-out',
  },
  rootCursorPointer: {
    cursor: 'pointer',
  },
  rootCursorGrab: {
    cursor: 'grab',
  },
  rootLoaded: {
    opacity: 1,
  },
  rootNotLoaded: {
    opacity: 0,
  },
  globeWrapper: {
    transform: 'translateX(-35vw) scale(1)',
    transformOrigin: 'center center',
  },
}));

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
  const classes = useStyles(styles);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 1000);
  const [isHoveringMarker, setIsHoveringMarker] = useState(false);
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
    
    // Handle clicks on markers immediately for snappier feel
    const target = e.target as HTMLElement;
    const markerElement = findMarkerElement(target, e.clientX, e.clientY);
    
    if (markerElement) {
      // This is a marker click - handle it
      const markerIndexStr = markerElement.getAttribute('data-marker-index');
      if (markerIndexStr !== null) {
        const markerIndex = parseInt(markerIndexStr, 10);
        if (!isNaN(markerIndex) && markerIndex >= 0 && markerIndex < pointsData.length) {
          const originalPoint = pointsData[markerIndex];
          
          // Always trigger popup on marker click
          if (onPointClick && originalPoint.eventId) {
            const solsticePoint: SolsticeGlobePoint = {
              lat: originalPoint.lat,
              lng: originalPoint.lng,
              size: originalPoint.size,
              eventId: originalPoint.eventId,
              event: originalPoint.event,
            };
            // Use marker element's center position instead of click coordinates for deterministic positioning
            const markerRect = markerElement.getBoundingClientRect();
            const markerCenter = {
              x: markerRect.left + (markerRect.width / 2),
              y: markerRect.top + (markerRect.height / 2),
            };
            onPointClick(solsticePoint, markerCenter);
            // Prevent this click from triggering the onClick handler that would close the popup
            e.stopPropagation();
          }
        }
      }
      return;
    }
    
    // Non-marker click
    if (!shouldIgnoreClickRef.current) {
      onClick?.(e);
    }
  }, [findMarkerElement, pointsData, onPointClick, onClick]);

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const markerElement = findMarkerElement(target, e.clientX, e.clientY);
    const isOverMarker = markerElement !== null;
    setIsHoveringMarker(isOverMarker);
  }, [findMarkerElement]);

  useEventListener('mousemove', handleGlobalMouseMove);
  useEventListener('mousemove', handleMouseMove);
  useEventListener('mouseup', handleGlobalMouseUp);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Check if this was a marker click and prevent propagation so parent's onClick doesn't close the popup
    const target = e.target as HTMLElement;
    const markerElement = findMarkerElement(target, e.clientX, e.clientY);
    
    if (markerElement) {
      e.stopPropagation();
      return;
    }
    
    // For non-marker clicks, let it bubble up to parent's onClick
  }, [findMarkerElement]);

  const handleZoom = useCallback(({ lng, lat }: { lng: number; lat: number }) => {
    if (globeMaterialRef.current?.uniforms?.globeRotation) {
      globeMaterialRef.current.uniforms.globeRotation.value.set(lng, lat);
    }
  }, [globeMaterialRef]);

  const markerData: GlobeMarkerData[] = mapPointsToMarkers(pointsData);

  const renderHtmlElement = useCallback((d: GlobeMarkerData): HTMLElement => {
    const eventId = d.event && typeof d.event === 'object' && '_id' in d.event && typeof d.event._id === 'string' ? d.event._id : null;
    const isSpecialMarker = eventId === "FjHG3XcrhXkGWTDwf" ||
                           eventId === "YcKFwMLjCrr9hnerm";
    const markerSize = isSpecialMarker ? 45 : 30;
    const markerColor = isSpecialMarker ? "light-dark(rgb(254, 237, 138), rgb(244, 230, 154))" : "light-dark(rgb(206, 233, 255), rgb(206, 233, 255))";
    const el = document.createElement('div');
    el.setAttribute('data-globe-marker', 'true');
    el.setAttribute('data-marker-index', String(d._index));
    el.style.color = markerColor;
    el.innerHTML = `
      <div style="text-align: center;">
        <svg viewBox="0 0 24 24" style="width:${markerSize}px;margin:0 auto;">
          <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 3.25 2.5 6.75 7 11.54 4.5-4.79 7-8.29 7-11.54 0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
      </div>
    `;
    
    return el;
  }, []);
  
  const htmlAltitude = useCallback((d: GlobeMarkerData): number => {
    return (typeof d.size === 'number' ? d.size : 1) * altitudeScale * 0.01;
  }, [altitudeScale]);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{ ...style, height: screenHeight }}
      className={classNames(className, classes.root, {
        [classes.rootCursorPointer]: isHoveringMarker,
        [classes.rootCursorGrab]: !isHoveringMarker,
        [classes.rootLoaded]: isFullyLoaded,
        [classes.rootNotLoaded]: !isFullyLoaded,
      })}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className={classes.globeWrapper}>
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


