import orderBy from "lodash/orderBy";
import groupBy from "lodash/groupBy";

type MapMarkerWithData<T> = {
  lat: number,
  lng: number,
  data: T
};

/**
 * Given a set of map markers, some of which may have identical coordinates,
 * spread them out such that each map marker has a distinct location.
 *
 * This is used for things like the community map, so that if multiple people
 * enter the same address (especially partial/inexact addresses, like just a
 * city name), they don't cover each other completely so it's possible to see
 * and interact with all of them if you zoom in far enough.
 *
 * Note that this only moves markers if they are at the _exact_ same location
 * (including the last floating-point digits).
 */
export function spreadMapMarkers<T>(
  markers: MapMarkerWithData<T>[],
  getSortKey: (data: T) => string
): MapMarkerWithData<T>[] {
  // Group by exact location
  const markersByLocation: Record<string,MapMarkerWithData<T>[]> =
    groupBy(markers, ({lat, lng, data:_}) => `${lat},${lng}`);
  
  const result: MapMarkerWithData<T>[] = [];
  for (const locationStr of Object.keys(markersByLocation)) {
    const markerGroup = markersByLocation[locationStr];
    if (markerGroup.length > 1) {
      // Found overlapping map markers. Sort them (with getSortKey) to put them
      // into deterministic order, then spread them.
      const sortedMarkerGroup = orderBy(markerGroup, m=>getSortKey(m.data));
      const spreadOutMarkers = spreadMapMarkerGroup(sortedMarkerGroup);
      for (const marker of spreadOutMarkers)
        result.push(marker);
    } else if (markerGroup.length === 1) {
      result.push(markerGroup[0]);
    }
  }
  return result;
}

/**
 * Spread out a group of map markers which are all at the same location.
 * Arranges them equally around a circle, starting north and going clockwise,
 * with a radius (in degrees-latitude) of `spreadDistance`*`markers.length`.
 */
function spreadMapMarkerGroup<T>(markers: MapMarkerWithData<T>[]): MapMarkerWithData<T>[] {
  const radius = .0001*markers.length;
  return markers.map(({lat, lng, data}, i) => {
    const angle = (-(Math.PI*2) * (i / markers.length)) - (Math.PI/4);
    return {
      lat: lat + (Math.cos(angle)*radius),
      lng: lng + (Math.sin(angle)*radius),
      data,
    }
  });
}
