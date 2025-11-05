"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { LocalEventMapMarkerWrappersInner } from './HomepageMap/HomepageCommunityMap';
import { isClient } from '@/lib/executionEnvironment';
import dynamic from 'next/dynamic';
import MagnifyingGlassPlusIcon from '@heroicons/react/24/solid/MagnifyingGlassPlusIcon';
import MagnifyingGlassMinusIcon from '@heroicons/react/24/solid/MagnifyingGlassMinusIcon';
import classNames from 'classnames';

// Dynamically import map component to avoid SSR issues
const WrappedReactMapGL = dynamic(
  () => import('@/components/community/WrappedReactMapGL').then(mod => ({ default: mod.WrappedReactMapGL })),
  { 
    ssr: false,
    loading: () => null,
  }
);

interface EventMapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface EventMapProps {
  events: Array<{
    _id: string;
    lat: number | null;
    lng: number | null;
    types?: Array<string> | null;
  }>;
  viewport: EventMapViewport;
  onViewportChange: (viewport: EventMapViewport) => void;
  filterKey?: string;
  showZoomControls?: boolean;
  onMarkerClick?: () => void;
  containerClassName?: string;
}

const styles = defineStyles("EventMap", (theme: ThemeType) => ({
  root: {
    position: 'relative',
    width: '100%',
    height: '100%',
    "& .mapboxgl-popup-content": {
      background: theme.palette.panelBackground.default,
    },
    "& .StyledMapPopup-markerPageLink": {
      color: theme.palette.text.normal,
    },
    '& .mapboxgl-canvas': { 
      filter: theme.dark ? 'invert(1) brightness(2.5)' : '',
    },
    '& .mapboxgl-ctrl-bottom-right': {
      display: 'none',
    },
    '& .mapboxgl-ctrl-bottom-left': {
      display: 'none',
    },
    '& .mapboxgl-ctrl-top-right': {
      display: 'none',
    },
    '& .mapboxgl-ctrl-top-left': {
      display: 'none',
    },
  },
  mapButtonsContainer: {
    position: "absolute",
    pointerEvents: "none",
    top: 130,
    right: 9,
    zIndex: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 'calc(100% - 400px)',
    [theme.breakpoints.up(1525)]: {
      width: 'calc(100% - 300px)',
    },
  },
  mapButtons: {
    alignItems: "center",
    pointerEvents: "auto",
    display: "flex",
    width: 110,
    gap: 12,
    justifyContent: "center",
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 10,
    padding: 12,
    opacity: 0,
    '&&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down('md')]: {
      top: 24
    },
    marginBottom: "auto",
  },
  zoomButton: {
    width: 30,
    height: 30,
    opacity: .3,
    '& svg': {
      fill: theme.dark ? theme.palette.grey[0] : theme.palette.grey[400],
    },
    '&:hover': {
      opacity: 1,
    },
    cursor: 'pointer',
  },
  acxMode: {
    '& svg': {
      fill: theme.palette.meetupMonth.acx + ' !important',
    },
  },
  ifanyoneMode: {
    '& svg': {
      fill: theme.palette.meetupMonth.ifanyone + ' !important',
    },
  },
  petrovMode: {
    '& svg': {
      fill: theme.palette.meetupMonth.petrov + ' !important',
    },
  },
}));

export const EventMap = ({
  events,
  viewport,
  onViewportChange,
  filterKey,
  showZoomControls = false,
  onMarkerClick,
  containerClassName,
}: EventMapProps) => {
  const classes = useStyles(styles);
  const [mapReady, setMapReady] = useState(false);

  // Ensure mapbox-gl is loaded before rendering the map
  useEffect(() => {
    if (isClient) {
      const timer = setTimeout(() => {
        setMapReady(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const filteredEvents = useMemo(() => {
    if (filterKey) {
      return events.filter(event => (event.types ?? []).includes(filterKey));
    }
    return events;
  }, [events, filterKey]);

  const handleZoomIn = useCallback(() => {
    onViewportChange({
      ...viewport,
      zoom: Math.min(viewport.zoom + 0.5, 20),
    });
  }, [viewport, onViewportChange]);

  const handleZoomOut = useCallback(() => {
    // Prevent zooming out beyond a safe threshold – when zooming too far out Mapbox starts repeating the
    // world map horizontally which causes the markers to render offset from their real positions.
    // We empirically found zoom < 1 to be problematic, so clamp the minimum zoom to 1.
    onViewportChange({
      ...viewport,
      zoom: Math.max(viewport.zoom - 0.5, 1),
    });
  }, [viewport, onViewportChange]);

  if (!mapReady || !isClient) {
    return null;
  }

  return (
    <div className={classNames(classes.root, containerClassName)}>
      {showZoomControls && (
        <div className={classes.mapButtonsContainer}>
          <div className={classes.mapButtons} onClick={onMarkerClick}>
            <MagnifyingGlassMinusIcon className={classes.zoomButton} onClick={handleZoomOut} />
            <MagnifyingGlassPlusIcon className={classes.zoomButton} onClick={handleZoomIn} />
          </div>
        </div>
      )}
      <span className={classNames({
        [classes.acxMode]: filterKey === 'SSC',
        [classes.ifanyoneMode]: filterKey === 'IFANYONE',
        [classes.petrovMode]: filterKey === 'PETROV'
      })}>
        <WrappedReactMapGL
          {...viewport}
          width="100%"
          height="100%"
          onViewportChange={onViewportChange}
          scrollZoom={false}
        >
          <LocalEventMapMarkerWrappersInner 
            localEvents={filteredEvents} 
            onMarkerClick={onMarkerClick}
          />
        </WrappedReactMapGL>
      </span>
    </div>
  );
};

