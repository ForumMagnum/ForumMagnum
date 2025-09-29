import { cache } from 'react';
import type { RouteMetadata } from './ClientRouteMetadataContext';

export const DEFAULT_LAYOUT_CONFIG: RouteMetadata = {};

export const getRouteMetadata = cache((): {
  get: () => RouteMetadata;
  set: (newConfig: Partial<RouteMetadata>) => void;
} => {
  let config: RouteMetadata = { ...DEFAULT_LAYOUT_CONFIG };

  return {
    get: () => config,
    set: (newConfig: Partial<RouteMetadata>) => {
      config = { ...config, ...newConfig };
    },
  };
});

export function RouteMetadataSetter({ metadata }: { metadata: RouteMetadata }) {
  // During server render, this call will populate the request-scoped cache
  getRouteMetadata().set(metadata);
  return null;
}
