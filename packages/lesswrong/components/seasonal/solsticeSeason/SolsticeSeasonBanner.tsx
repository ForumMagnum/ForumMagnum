import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import type { PostsList } from '@/lib/generated/gql-codegen/graphql';
import { Link } from '@/lib/reactRouterWrapper';
import classNames from 'classnames';
import SolsticeGlobe3D from './SolsticeGlobe3D';
import { SolsticeGlobePoint } from './types';
import { GlobePopup } from './GlobePopup';
import { HIDE_SOLSTICE_GLOBE_COOKIE } from '@/lib/cookies/cookies';
import { useCookiesWithConsent } from '@/components/hooks/useCookiesWithConsent';
import { isClient } from '@/lib/executionEnvironment';

const smallBreakpoint = 1525
const minBannerWidth = 1425

const styles = defineStyles("SolsticeSeasonBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100%',
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
  textContainer: {
    position: 'absolute',
    bottom: 150,
    width: 320,
    paddingBottom: 20,
    textShadow: `0 0 5px ${theme.palette.text.alwaysBlack}, 0 0 15px ${theme.palette.text.alwaysBlack}, 0 0 50px ${theme.palette.text.alwaysBlack}`,
    left: '55%',
    [theme.breakpoints.up(smallBreakpoint)]: {
      left: '50%',
      width: 330,
      marginRight: 0,
    },
    [theme.breakpoints.up(1620)]: {
      left: '40%',
    },
    // Center horizontally within the space to the right of the layout
    // Position is set dynamically via inline style based on measured layout end position
    transform: 'translateX(-50%)',
    zIndex: 4,
    lineHeight: 1.5,
    transition: 'opacity 0.5s ease-in-out',
    opacity: 1,
    '& a': {
      color: theme.palette.link.color,
    },
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
  globeGradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 'calc(100vw - 460px)',
    height: '100%',
    background: `linear-gradient(to left, transparent 60%, ${theme.palette.background.default} 90%)`,
    [theme.breakpoints.up(1620)]: {
      width: 'calc(100vw - 560px)',
      background: `linear-gradient(to left, transparent 60%, ${theme.palette.background.default} 90%)`,
    },
    [theme.breakpoints.up(2000)]: {

      width: 'calc(75vw - 200px)',
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
    clipPath: 'inset(0 0 0 -100vw)',
  },
  buttonContainer: {
    display: 'flex',
    width: 310,
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  eventButton: {
    display: 'flex',
    ...theme.typography.commentStyle,
    borderRadius: 3,
    background: `light-dark(${theme.palette.grey[800]}, ${theme.palette.grey[300]})`,
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
      paddingLeft: 12,
      paddingRight: 12,
      fontSize: 15,  
    },
  },
  date: {
    fontSize: 12,
    fontWeight: 400,
    opacity: 0.8,
    whiteSpace: 'nowrap',
  },
  createEventButtonAnnounce: {
    ...theme.typography.commentStyle,
    fontSize: 16,
    color: theme.palette.primary.light,
    marginTop: 0,
    cursor: 'pointer',
  },
  hideButton: {
    textAlign: 'center',
    ...theme.typography.commentStyle,
    fontSize: 12,
    fontWeight: 400,
    opacity: 0.8,
    color: theme.palette.text.alwaysWhite,
    marginTop: 10,
  },
  postsListBlockingRect: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 800,
    right: "calc(100% - 375px)",
    [theme.breakpoints.up(1400)]: {
      right: "calc(100% - 350px)",
    },
    [theme.breakpoints.up(1500)]: {
      right: "calc(100% - 324px)",
    },
    [theme.breakpoints.up(1700)]: {
      right: "calc(100% - 250px)"
    },
    [theme.breakpoints.up(1800)]: {
      right: "calc(100% - 200px)"
    },

    zIndex: 5,
    pointerEvents: 'auto',
  },
  background: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60vw',
    height: '100%',
    pointerEvents: 'auto',
    background: `linear-gradient(to left, ${theme.palette.text.alwaysBlack} 60%, transparent 100%)`,
  }
}));

const HomepageCommunityEventPostsQuery = gql(`
  query HomepageCommunityEventPostsQuery($eventType: String!) {
    HomepageCommunityEventPosts(eventType: $eventType) {
      posts {
        ...PostsList
      }
    }
  }
`);

export default function SolsticeSeasonBannerInner() {
  const classes = useStyles(styles);
  // SSR-safe: start with false, check after mount to avoid hydration mismatch
  const [shouldRender, setShouldRender] = useState(false);
  const [bannerOpacity, setBannerOpacity] = useState(1);
  const [pointerEventsDisabled, setPointerEventsDisabled] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null)
  const markerClickInProgressRef = useRef(false);
  
  useEffect(() => {
    if (!isClient) return;
    
    const checkWidth = () => {
      setShouldRender(window.innerWidth >= minBannerWidth);
    };
    
    // Check on mount
    checkWidth();
    
    // Check on resize
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const { data } = useQuery(HomepageCommunityEventPostsQuery, {
    variables: { eventType: "SOLSTICE" },
  });
  const eventPosts = useMemo(() => data?.HomepageCommunityEventPosts?.posts ?? [], [data?.HomepageCommunityEventPosts?.posts]);
  const events = useMemo(() => eventPosts.map((post: PostsList) => ({
    _id: post._id,
    lat: post.googleLocation?.geometry?.location?.lat,
      lng: post.googleLocation?.geometry?.location?.lng,
      types: post.types,
    })), [eventPosts]);

  
  useEffect(() => {
    if (!isClient) return;
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

  const [_, setCookie] = useCookiesWithConsent([HIDE_SOLSTICE_GLOBE_COOKIE]);

  const handleHideSolsticeSeason = useCallback(() => {
     setCookie(HIDE_SOLSTICE_GLOBE_COOKIE, "true");
  }, [setCookie]);

  const selectedEventPost = useMemo(() => {
    return eventPosts.find((post: PostsList) => post._id === selectedEventId);
  }, [eventPosts, selectedEventId]);

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

  const handleMeetupClick = useCallback((event?: React.MouseEvent<HTMLDivElement>, eventId?: string, screenCoords?: { x: number; y: number }) => {
    event?.stopPropagation();
    event?.preventDefault();
    if (eventId) {
      markerClickInProgressRef.current = true;
      setSelectedEventId(eventId);
      setPopupCoords(screenCoords || { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setTimeout(() => {
        markerClickInProgressRef.current = false;
      }, 0);
    } else {
      if (!markerClickInProgressRef.current) {
        setSelectedEventId(null);
        setPopupCoords(null);
      }
    }
  }, []);

  // Conditional render after all hooks - prevents rendering entirely if below breakpoint
  if (!shouldRender) {
    return null;
  }

  return <div className={classNames(classes.root)} style={{ opacity: bannerOpacity, pointerEvents: pointerEventsDisabled ? 'none' : 'auto' }}>
    <div className={classes.globeGradientRight} />
    <div className={classes.postsListBlockingRect}/>
    <div className={classes.background} />
    <div className={classes.globeContainer}>
        <SolsticeGlobe3D 
          pointsData={pointsData}
          defaultPointOfView={defaultPointOfView}
          onPointClick={(point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => handleMeetupClick(undefined, point.eventId, screenCoords)}
          onClick={(event) => handleMeetupClick(event, undefined)}
          style={{ width: '100%', height: '100%' }}
        />
      {selectedEventId && popupCoords && selectedEventPost && (
        <GlobePopup
          document={selectedEventPost}
          screenCoords={popupCoords}
          onClose={() => {
            setSelectedEventId(null);
            setPopupCoords(null);
          }}
        />
      )}
      <div className={classNames(classes.textContainer)}>
        <h1 className={classNames(classes.title)}>Solstice Season</h1>
          <p className={classNames(classes.subtitle)}>
            Celebrate the longest night of the year!
          </p>
          <p className={classNames(classes.subtitle)}>
            Visit a megameetup at a major city, or host a small gathering for your friends the night of the 21st.
          </p>
          <Link to={`/newPost?eventForm=true&SOLSTICE=true`} target="_blank" rel="noopener noreferrer">
            <div className={classes.createEventButtonAnnounce}>Create a Solstice Event</div>
          </Link>
          <div className={classes.buttonContainer}>
            <Link to="https://waypoint.lighthaven.space/solstice-season" target="_blank" rel="noopener noreferrer"  className={classNames(classes.eventButton)}>
              Berkeley Megameetup<span className={classes.date}>Dec 6</span>
            </Link>
            <Link to="https://rationalistmegameetup.com/" target="_blank" rel="noopener noreferrer" className={classNames(classes.eventButton)}>
              New York Megameetup<span className={classes.date}>Dec 13</span>
            </Link>
          </div>  
          <div className={classes.hideButton} onClick={() => handleHideSolsticeSeason()}>
              Hide Solstice Map
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
