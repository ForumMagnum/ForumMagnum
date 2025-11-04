import { SolsticeGlobePoint } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findMeshWithTexture = (obj: any): any => {
  if (obj?.type === 'Mesh' && obj.material?.map) return obj;
  for (const child of obj?.children || []) {
    const found = findMeshWithTexture(child);
    if (found) return found;
  }
  return null;
};

export const mapPointsToMarkers = (pointsData: Array<SolsticeGlobePoint>) => pointsData.map((point, index) => ({
  lat: point.lat,
  lng: point.lng,
  size: point.size,
  color: point.color,
  eventId: point.eventId,
  event: point.event,
  _index: index,
}));

