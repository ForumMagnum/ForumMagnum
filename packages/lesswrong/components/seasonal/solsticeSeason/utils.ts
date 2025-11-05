import { SolsticeGlobePoint } from './types';
import * as THREE from 'three';

export const findMeshWithTexture = (obj: THREE.Object3D | null | undefined): THREE.Mesh | null => {
  if (!obj) return null;
  
  if (obj instanceof THREE.Mesh) {
    // Check if mesh has a material with a texture map
    const material = obj.material;
    if (material) {
      // Handle both single material and array of materials
      const materials = Array.isArray(material) ? material : [material];
      for (const mat of materials) {
        // Check if material has a map property (texture)
        if ('map' in mat && mat.map) {
          return obj;
        }
      }
    }
  }
  
  for (const child of obj.children) {
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

