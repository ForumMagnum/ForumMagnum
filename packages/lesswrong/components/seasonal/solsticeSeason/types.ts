export type SolsticeGlobePoint = {
  lat: number;
  lng: number;
  size: number;
  color?: string;
  eventId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event?: any;
};

export type PointOfView = {
  lat: number;
  lng: number;
  altitude: number;
};

export type PointClickCallback = (point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => void;

export type SolsticeGlobe3DProps = {
  pointsData: Array<SolsticeGlobePoint>;
  defaultPointOfView: PointOfView;
  onPointClick?: PointClickCallback;
  onReady?: () => void;
  onFullyLoaded?: () => void;
  onFpsChange?: (fps: number) => void;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  // URLs for the globe day and night textures. Accepts JPG, PNG, or SVG formats. Note: SVGs will be rasterized at load time.
  // For best performance with 3D globe textures, equirectangular bitmap images (JPG/PNG) are recommended.
  // The images should use an equirectangular projection (360° horizontal, 180° vertical).
  dayImageUrl?: string;
  nightImageUrl?: string;
  // Luminosity map showing city lights. This will be added to the night side to show city lights even without sunlight.
  // Typically this is a black image with white/yellow dots representing city lights.
  luminosityImageUrl?: string;
  altitudeScale?: number;
  initialAltitudeMultiplier?: number;
}

