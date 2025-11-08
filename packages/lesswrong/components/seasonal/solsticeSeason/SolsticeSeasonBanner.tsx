import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '@/lib/reactRouterWrapper';
import classNames from 'classnames';
import SolsticeGlobe3D from './SolsticeGlobe3D';
import { SolsticeGlobePoint } from './types';
import { FixedPositionEventPopup } from '../HomepageMap/HomepageCommunityMap';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';

const smallBreakpoint = 1525

const styles = defineStyles("SolsticeSeasonBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100%',
    [theme.breakpoints.down(1425)]: {
      display: 'none',
    },
  },
  title: {
    fontSize: 53,
    fontWeight: 500,
    [theme.breakpoints.down(smallBreakpoint)]: {
      fontSize: 34,
    },
    fontFamily: theme.typography.headerStyle.fontFamily,
    color: theme.palette.text.alwaysWhite,
    zIndex: 2,
    transition: 'color 0.8s ease-in-out, opacity 0.3s ease-out',
    paddingBottom: 1,
    lineHeight: 1.2,
    marginTop: 0,
    marginBottom: 12,
  },
  titleNotLoaded: {
    color: theme.palette.text.alwaysBlack,
  },
  textContainer: {
    position: 'absolute',
    bottom: 150,
    width: 320,
    paddingBottom: 20,
    textShadow: `0 0 5px ${theme.palette.text.alwaysBlack}, 0 0 15px ${theme.palette.text.alwaysBlack}, 0 0 50px ${theme.palette.text.alwaysBlack}`,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 330,
      marginRight: 0,
    },
    // Center horizontally within the space to the right of the layout
    // Position is set dynamically via inline style based on measured layout end position
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 4,
    lineHeight: 1.5,
    transition: 'opacity 0.5s ease-in-out',
    opacity: 1,
    '&.transitioning': {
      transform: 'translateX(-50%) translateX(-100%)',
      opacity: 0,
    },
    '& a': {
      color: theme.palette.link.color,
    },
  },
  textContainerNotLoaded: {
    textShadow: `none`,
  },
  subtitle: {
    fontSize: 16,
    [theme.breakpoints.up(smallBreakpoint)]: {
      fontSize: 20,
    },
    '& a': {
      color: theme.palette.text.alwaysWhite,
    },
    fontWeight: 500,
    marginTop: ".5rem",
    marginBottom: ".5rem",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    // textShadow: `0 0 5px light-dark(${theme.palette.background.default}, transparent), 0 0 10px light-dark(${theme.palette.background.default}, transparent), 0 0 15px light-dark(${theme.palette.background.default}, transparent)`,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.text.alwaysWhite,
    transition: 'color 0.8s ease-in-out, opacity 0.3s ease-out',
    '& li': {
      marginLeft: -10
    },
    '& ul': {
      margin: 0,
    },
  },
  subtitleNotLoaded: {
    color: theme.palette.text.alwaysBlack,
    '& a': {
      color: theme.palette.text.alwaysBlack,
    },
  },
  globeGradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 'calc(100% + 260px)',
    height: '100%',
    background: `linear-gradient(to left, transparent 60%, ${theme.palette.background.default} 100%)`,
    [theme.breakpoints.up(1620)]: {
      background: `linear-gradient(to left, transparent 60%, ${theme.palette.background.default} 100%)`,
    },
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-out',
  },
  globeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: 'calc(100vh + 120px)',
    transition: 'opacity 0.3s ease-out',
    zIndex: 0,
  },
  scrollBackground: {
    position: 'absolute',
    top: -80,
    right: 0,
    width: '80%',
    height: '80%',
    background: theme.dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  buttonContainer: {
    display: 'flex',
    width: 310,
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  createEventButton: {
    display: 'flex',
    ...theme.typography.commentStyle,
    borderRadius: 3,
    background: theme.palette.grey[800],
    '&&': {
      color: theme.palette.text.alwaysWhite,
    },
    cursor: 'pointer',
    border: 'none',
    justifyContent: 'space-between',
    width: 'calc(50% - 5px)',
    alignItems: 'center',
    wordWrap: 'balance',
    transition: 'background 0.8s ease-in-out',
    fontSize: 12,
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    [theme.breakpoints.up(smallBreakpoint)]: {
      padding: 8,
      paddingLeft: 10,
      paddingRight: 10,
      fontSize: 14,  
    },
  },
  createEventButtonNotLoaded: {
    background: theme.palette.grey[300],
  },
  date: {
    fontSize: 12,
    fontWeight: 400,
    opacity: 0.8,
  },
  createEventButtonAnnounce: {
    width: "calc(100% - 2px)",
    justifyContent: 'center',
  },
  fpsWarning: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.typography.commentStyle,
    fontSize: 12,
    fontWeight: 400,
    opacity: 0.8,
    color: theme.palette.text.alwaysWhite,
    textAlign: 'center',
    marginTop: 10,
  },
  hideButton: {
    ...theme.typography.commentStyle,
    background: "none",
    border: "none",
    fontSize: 12,
    fontWeight: 400,
    opacity: 0.8,
    color: theme.palette.text.alwaysWhite,
    textDecoration: 'underline',
    cursor: 'pointer',
    marginLeft: 8,
    '&:hover': {
      opacity: 1,
    },
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    transition: 'opacity 0.3s ease-out',
    zIndex: 0,
  },
  mapGradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 'calc(100% + 260px)',
    height: '100%',
    background: `linear-gradient(to left, transparent 60%, ${theme.palette.background.default} 100%)`,
    [theme.breakpoints.up(1620)]: {
      background: `linear-gradient(to left, transparent 60%, ${theme.palette.background.default} 100%)`,
    },
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-out',
  },
  postsListBlockingRect: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 800,
    right: "calc(100% - 375px)",
    zIndex: 5,
    pointerEvents: 'auto',
  },
}));


export const SolsticeSeasonQuery = gql(`
  query solsticeSeasonQuery {
    HomepageCommunityEvents(limit: 500, eventType: "SOLSTICE") {
      events {
        _id
        lat
        lng
        types
      }
    }
  }
`);

export default function SolsticeSeasonBannerInner() {
  const classes = useStyles(styles);
  const [isLoading, setIsLoading] = useState(true);
  const [everClickedGlobe, setEverClickedGlobe] = useState(false);
  const [bannerOpacity, setBannerOpacity] = useState(1);
  const [pointerEventsDisabled, setPointerEventsDisabled] = useState(false);
  const isWidescreen = useIsAboveBreakpoint('lg');
  const [renderSolsticeSeason, setRenderSolsticeSeason] = useState(false);
  const [isGlobeFullyLoaded, setIsGlobeFullyLoaded] = useState(false);
  const [isTextContainerFullyLoaded, setIsTextContainerFullyLoaded] = useState(false);
  const [textContainerLeft, setTextContainerLeft] = useState<string>('50%');
  const [fps, setFps] = useState<number | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  
  useEffect(() => {
    setRenderSolsticeSeason(isWidescreen);
  }, [isWidescreen]);

  useEffect(() => {
    if (!isWidescreen) return;
    retryCountRef.current = 0;

    const measureLayout = () => {
      // Find the main content area - this represents where the layout content ends
      // The Layout-main element is in the 'main' grid area, which is before the imageGap
      const mainContent = document.querySelector('.Layout-main') as HTMLElement;
      const wrapper = document.querySelector('.wrapper') as HTMLElement;
      
      if (!mainContent && !wrapper) {
        // Retry if elements aren't ready yet (max 10 retries)
        if (retryCountRef.current < 10) {
          retryCountRef.current++;
          setTimeout(measureLayout, 100);
        }
        return;
      }
      
      retryCountRef.current = 0;

      // Prefer mainContent as it's more precise (ends where content ends)
      // Fall back to wrapper if mainContent isn't available
      const layoutElement = mainContent || wrapper;
      const layoutRect = layoutElement.getBoundingClientRect();
      const layoutEnd = layoutRect.right;
      const viewportWidth = window.innerWidth;
      
      // Banner root spans from 50vw to 100vw (position: fixed, right: 0, width: 50vw)
      // GlobeContainer spans from 70vw to 100vw (position: absolute, right: 0, width: 60% of 50vw)
      // So globeContainerLeft = 100vw - (50vw * 0.6) = 100vw - 30vw = 70vw
      const globeContainerLeft = viewportWidth * 0.7;
      
      // Available space: from layout end to viewport right edge
      const availableSpaceStart = layoutEnd;
      const availableSpaceEnd = viewportWidth;
      const availableSpaceCenter = (availableSpaceStart + availableSpaceEnd) / 2;
      
      // Position relative to globeContainer's left edge (in pixels)
      const leftPosition = availableSpaceCenter - globeContainerLeft;
      
      // Convert to percentage of globeContainer width (which is 30vw = viewportWidth * 0.3)
      const globeContainerWidth = viewportWidth * 0.3;
      const leftPercent = (leftPosition / globeContainerWidth) * 100;
      
      setTextContainerLeft(`${leftPercent}%`);
    };

    // Wait for layout to be ready, then measure
    const initialTimeout = setTimeout(measureLayout, 100);
    
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize measurements to avoid excessive recalculations
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(measureLayout, 50);
    });
    
    // Observe the main content element for size changes
    const mainContent = document.querySelector('.Layout-main');
    const wrapper = document.querySelector('.wrapper');
    if (mainContent) {
      resizeObserver.observe(mainContent);
    } else if (wrapper) {
      resizeObserver.observe(wrapper);
    }
    
    window.addEventListener('resize', measureLayout);
    
    return () => {
      clearTimeout(initialTimeout);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureLayout);
    };
  }, [isWidescreen]);
  
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const fadeDistance = 600; // px until fully faded
      const nextOpacity = Math.max(0, 1 - (y / fadeDistance));
      setBannerOpacity(nextOpacity);
      setPointerEventsDisabled(y > 0);
    };
    // On initial load, if we're already scrolled, immediately hide and disable interactions
    const y0 = window.scrollY || window.pageYOffset || 0;
    if (y0 > 0) {
      setBannerOpacity(0);
      setPointerEventsDisabled(true);
    } else {
      setBannerOpacity(1);
      setPointerEventsDisabled(false);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const defaultPointOfView = useMemo(() => ({
    lat: 20,
    lng: -70,
    altitude: 2.2
  }), [])

  const { data } = useQuery(SolsticeSeasonQuery)

  const handleGlobeReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleGlobeFullyLoaded = useCallback(() => {
    setIsGlobeFullyLoaded(true);
  }, []);

  useEffect(() => {
    if (isGlobeFullyLoaded) {
      const timeout = setTimeout(() => {
        setIsTextContainerFullyLoaded(true);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isGlobeFullyLoaded]);

  type QueryResult = {
    HomepageCommunityEvents?: {
      events: Array<{
        _id: string;
        lat: number;
        lng: number;
        types: Array<string> | null;
      }>;
    };
  };
  
  const events = useMemo(() => (data as QueryResult | undefined)?.HomepageCommunityEvents?.events ?? [], [data]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null)


  type EventType = typeof events[0];

  const pointsData = useMemo(() => {
    return events
      .filter((event: EventType) => event.lat != null && event.lng != null)
      .map((event: EventType) => ({
        lat: event.lat!,
        lng: event.lng!,
        size: 0.5,
        eventId: event._id,
        event: event,
      }));
  }, [events]);

  const handleMeetupClick = useCallback((event?: React.MouseEvent<HTMLDivElement>, eventId?: string) => {
    event?.stopPropagation();
    event?.preventDefault();
    if (eventId) {
      setSelectedEventId(eventId);
      setPopupCoords({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, [pointsData]);

  return <div className={classNames(classes.root)} style={{ opacity: bannerOpacity, pointerEvents: pointerEventsDisabled ? 'none' : 'auto' }} onClick={(event) => handleMeetupClick(event, undefined)}>
    <div className={classes.globeGradientRight} />
    <div className={classes.postsListBlockingRect}/>
    <div 
      className={classes.globeContainer} 
      onClick={() => setEverClickedGlobe(true)}
    >
        {renderSolsticeSeason && <SolsticeGlobe3D 
          pointsData={pointsData}
          defaultPointOfView={defaultPointOfView}
          onPointClick={(point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => handleMeetupClick(undefined, point.eventId)}
          onReady={handleGlobeReady}
          onFullyLoaded={handleGlobeFullyLoaded}
          onFpsChange={setFps}
          style={{ width: '100%', height: '100%' }}
        />}
      {selectedEventId && popupCoords && (
        <FixedPositionEventPopup
          eventId={selectedEventId}
          screenCoords={popupCoords}
          onClose={() => {
            setSelectedEventId(null);
            setPopupCoords(null);
          }}
        />
      )}
      <div className={classNames(classes.textContainer, { [classes.textContainerNotLoaded]: !isTextContainerFullyLoaded })} style={{ left: textContainerLeft }} onClick={() => setEverClickedGlobe(true)}>
        <h1 className={classNames(classes.title, { [classes.titleNotLoaded]: !isGlobeFullyLoaded })}>Solstice Season</h1>
          <p className={classNames(classes.subtitle, { [classes.subtitleNotLoaded]: !isGlobeFullyLoaded })}>
            Celebrate the longest night of the year!
          </p>
          <p className={classNames(classes.subtitle, { [classes.subtitleNotLoaded]: !isGlobeFullyLoaded })}>
            Visit a megameetup at a major city, or host a small gathering for your friends the night of the 21st.</p>
          <div className={classes.buttonContainer}>
            <Link to="https://waypoint.lighthaven.space/solstice-season" target="_blank" rel="noopener noreferrer"  className={classNames(classes.createEventButton, { [classes.createEventButtonNotLoaded]: !isGlobeFullyLoaded })}>
              Berkeley <span className={classes.date}>Dec 6</span>
            </Link>
            <Link to="https://rationalistmegameetup.com/" target="_blank" rel="noopener noreferrer" className={classNames(classes.createEventButton, { [classes.createEventButtonNotLoaded]: !isGlobeFullyLoaded })}>
              New York <span className={classes.date}>Dec 13</span>
            </Link>
            <Link to={`/newPost?eventForm=true&SOLSTICE=true`} target="_blank" rel="noopener noreferrer" className={classNames(classes.createEventButton, classes.createEventButtonAnnounce, { [classes.createEventButtonNotLoaded]: !isGlobeFullyLoaded })}>
              Announce Your Own Solstice
            </Link>
          </div>  
          <div className={classes.fpsWarning}>
            {fps ? (fps < 90 ? `If your computer is slow, you can switch to the map view. ${fps} FPS` : `${fps} FPS`) : null}
          </div>
      </div>
    </div>
  </div>;
}

export const SolsticeSeasonBanner = () => {
  return <SuspenseWrapper name="SolsticeSeasonBanner">
    <SolsticeSeasonBannerInner />
  </SuspenseWrapper>
}
