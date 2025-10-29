import React, { useEffect, useState, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

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

const SolsticeGlobe = ({
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPointClick?: (point: any) => void;
  onReady?: () => void;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: any;
}) => {
  const [geoUrl, setGeoUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const wasDragging = useRef(false);

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
    // Initialize rotation from defaultPointOfView
    setRotation([-defaultPointOfView.lng, -defaultPointOfView.lat, 0]);
  }, [defaultPointOfView.lng, defaultPointOfView.lat]);

  useEffect(() => {
    // Load world map topology data
    const loadGeoData = async () => {
      try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
        if (response.ok) {
          setGeoUrl('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
        } else {
          // Fallback to a different source
          setGeoUrl('https://unpkg.com/world-atlas@2.0.2/world/110m.json');
        }
        onReady?.();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading geography data:', error);
        // Fallback
        setGeoUrl('https://unpkg.com/world-atlas@2.0.2/world/110m.json');
        onReady?.();
      }
    };
    loadGeoData();
  }, [onReady]);

  // Convert altitude to zoom scale (lower altitude = more zoomed in)
  // Adjusted scale calculation for better globe appearance
  const zoomScale = Math.max(150, Math.min(500, 300 / defaultPointOfView.altitude));

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on a marker
    const target = e.target as HTMLElement;
    if (target.closest('circle')) {
      return;
    }
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMousePos.current) return;
    
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    // Rotate based on mouse movement
    // Horizontal movement rotates around Y axis (longitude)
    // Vertical movement rotates around X axis (latitude)
    setRotation(prev => [
      prev[0] + deltaX * 0.5,
      Math.max(-90, Math.min(90, prev[1] - deltaY * 0.5)),
      prev[2]
    ]);
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastMousePos.current = null;
    // Reset wasDragging after a short delay to allow onClick to check it
    setTimeout(() => {
      wasDragging.current = false;
    }, 0);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!lastMousePos.current) return;
        
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        
        setRotation(prev => [
          prev[0] + deltaX * 0.5,
          Math.max(-90, Math.min(90, prev[1] - deltaY * 0.5)),
          prev[2]
        ]);
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        lastMousePos.current = null;
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  if (!geoUrl) {
    return <div ref={containerRef} style={style} className={className} onClick={onClick} />;
  }

  return (
    <div 
      ref={containerRef} 
      style={{ ...style, cursor: isDragging ? 'grabbing' : 'grab' }} 
      className={className} 
      onClick={(e) => {
        // Don't trigger onClick if we were dragging
        if (!wasDragging.current && onClick) {
          onClick(e);
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <ComposableMap
        projection="geoOrthographic"
        projectionConfig={{
          rotate: rotation,
          scale: zoomScale,
        }}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          r={zoomScale}
          fill="#1a1a3e"
          style={{
            pointerEvents: 'none',
          }}
        />
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#000000"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {pointsData.map((point, index) => (
          <Marker
            key={point.eventId || index}
            coordinates={[point.lng, point.lat]}
            onClick={() => onPointClick?.(point)}
            style={{
              default: { cursor: 'pointer' },
              hover: { cursor: 'pointer' },
            }}
          >
            <circle
              r={Math.max(2, point.size * 4)}
              fill={point.color}
              stroke="#fff"
              strokeWidth={1.5}
              opacity={0.9}
            />
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
};

export default SolsticeGlobe;
