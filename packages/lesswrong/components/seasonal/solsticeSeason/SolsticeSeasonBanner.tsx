import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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

const mediumBreakpoint = 1525
const smallBreakpoint = 1200
const minBannerWidth = 1100

const smallTextWidth = 205
const mediumTextWidth = 270
const largeTextWidth = 330

const styles = defineStyles("SolsticeSeasonBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100%',
    display: 'none',
    [theme.breakpoints.up(minBannerWidth)]: {
      display: 'block',
    },
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100vw',
    height: '100%',
    backgroundColor: theme.palette.background.default,
    opacity: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  '@keyframes solsticeGlobeFade': {
    '0%': {
      // opacity: 1,
      pointerEvents: 'auto',
    },
    '100%': {
      // opacity: 0,
      pointerEvents: 'none',
    },
  },
  '@keyframes solsticeGlobeFadeVisual': {
    '0%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    },
  },
  '@keyframes solsticeOverlayFade': {
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 1,
    },
  },
  '@supports (animation-timeline: scroll())': {
    overlay: {
      animationName: '$solsticeOverlayFade',
      animationTimeline: 'scroll()',
      animationDuration: '1s',
      animationTimingFunction: 'linear',
      animationFillMode: 'both',
      animationRange: '0% 10%',
    },
    globeContainer: {
      animationName: '$solsticeGlobeFade',
      animationTimeline: 'scroll()',
      animationDuration: '1s',
      animationTimingFunction: 'linear',
      animationFillMode: 'both',
      animationRange: '0% 10%',
    },
  },
  title: {
    fontSize: 53,
    fontWeight: 500,
    [theme.breakpoints.down(mediumBreakpoint)]: {
      fontSize: 43,
    },
    [theme.breakpoints.down(smallBreakpoint)]: {
      fontSize: 33,
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
    width: smallTextWidth,
    paddingBottom: 20,
    textShadow: `0 0 5px ${theme.palette.text.alwaysBlack}, 0 0 15px ${theme.palette.text.alwaysBlack}, 0 0 50px ${theme.palette.text.alwaysBlack}`,
    left: '63.5%',
    [theme.breakpoints.up(smallBreakpoint)]: {
      left: '55%',
      width: mediumTextWidth,
    },
    [theme.breakpoints.up(mediumBreakpoint)]: {
      left: '50%',
      width: largeTextWidth,
      marginRight: 0,
    },
    [theme.breakpoints.up(1620)]: {
      left: '40%',
    },
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
    [theme.breakpoints.up(mediumBreakpoint)]: {
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
  hideOnSmallishScreens: {
    [theme.breakpoints.down(smallBreakpoint)]: {
      display: 'none',
    },
  },
  hideOnMediumScreens: {
    [theme.breakpoints.down(mediumBreakpoint)]: {
      display: 'none',
    },
  },
  globeGradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 'calc(100vw - 360px)',
    background: `linear-gradient(to left, transparent 20%, ${theme.palette.background.default} 90%)`,
    [theme.breakpoints.up(1400)]: {
      width: 'calc(100vw - 460px)',
      background: `linear-gradient(to left, transparent 40%, ${theme.palette.background.default} 90%)`,
    },
    height: '100%',
    
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
    width: smallTextWidth - 10,
    flexWrap: 'wrap',
    flexDirection: 'column',
    gap: 8,
    marginTop: 16,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: mediumTextWidth,
      flexDirection: 'row',
    },
    [theme.breakpoints.up(mediumBreakpoint)]: {
      width: largeTextWidth,
      flexDirection: 'row',
    },
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
    width: '100%',
    alignItems: 'center',
    wordWrap: 'balance',
    transition: 'background 0.8s ease-in-out',
    fontSize: 12,
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 'calc(50% - 5px)',
    },
    [theme.breakpoints.up(mediumBreakpoint)]: {
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
    width: 310,
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
    right: "calc(100% - 315px)",
    [theme.breakpoints.up(1200)]: {
      right: "calc(100% - 300px)",
    },
    [theme.breakpoints.up(1300)]: {
      right: "calc(100% - 240px)",
    },
    [theme.breakpoints.up(1424)]: {
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null)
  const markerClickInProgressRef = useRef(false);
  const hideSolsticeBanner = isClient && window.navigator.userAgent.includes('CloudWatch-canary-coVij6peechaekou');

  useEffect(() => {
    if (!isClient) {
      return;
    }
    
    // Don't try to render the globe inside the CloudWatch canary (it's too slow and fails)
    if (window.navigator.userAgent.includes('CloudWatch-canary-coVij6peechaekou')) {
      return;
    }
    
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

  if (hideSolsticeBanner || !shouldRender) {
    return null;
  }

  return <div className={classes.root}>
    <div className={classes.overlay} />
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
          <p className={classNames(classes.subtitle, classes.hideOnSmallishScreens)}>
            Celebrate the longest night of the year!
          </p>
          <p className={classNames(classes.subtitle)}>
            Visit a megameetup at a major city, or host a small gathering for your friends the night of the 21st.
          </p>
          <div className={classes.buttonContainer}>
            <Link to="https://waypoint.lighthaven.space/solstice-season" target="_blank" rel="noopener noreferrer"  className={classNames(classes.eventButton)}>
              <span>Berkeley <span className={classes.hideOnMediumScreens}>
                Megameetup</span></span><span className={classes.date}>Dec 6</span>
            </Link>
            <Link to="https://rationalistmegameetup.com/" target="_blank" rel="noopener noreferrer" className={classNames(classes.eventButton)}>
              <span>New York <span className={classes.hideOnMediumScreens}>Megameetup</span></span><span className={classes.date}>Dec 20</span>
            </Link>
          </div>  
          <div className={classes.hideButton} onClick={() => handleHideSolsticeSeason()}>
              Hide Map
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
