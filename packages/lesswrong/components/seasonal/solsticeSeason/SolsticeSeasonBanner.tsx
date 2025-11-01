import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { JssStyles } from '@/lib/jssStyles';
import { Link } from '@/lib/reactRouterWrapper';
import classNames from 'classnames';
import SolsticeGlobe3D, { SolsticeGlobePoint } from './SolsticeGlobe3D';
import { FixedPositionEventPopup } from '../HomepageMap/HomepageCommunityMap';
import Row from '@/components/common/Row';

const smallBreakpoint = 1525

const styles = defineStyles("SolsticeSeasonBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    background: "black",
    top: 0,
    right: 0,
    width: '50vw',
    height: '100vh',
    [theme.breakpoints.down(1425)]: {
      display: 'none',
    },
  },
  title: {
    fontSize: 55,
    fontWeight: 500,
    [theme.breakpoints.down(smallBreakpoint)]: {
      fontSize: 34,
    },
    fontFamily: theme.typography.headerStyle.fontFamily,
    color: theme.palette.text.alwaysWhite,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
    paddingBottom: 1,
    lineHeight: 1.2,
    marginTop: 0,
    marginBottom: 12,
  },
  textContainer: {
    width: 320,
    paddingTop: 20,
    paddingBottom: 20,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 370,
      marginRight: 0,
    },
    zIndex: 4,
    lineHeight: 1.5,
    transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    transform: 'translateX(0)',
    opacity: 1,
    marginBottom: 14,
    '&.transitioning': {
      transform: 'translateX(-100%)',
      opacity: 0,
    },
    '& a': {
      color: theme.palette.link.color,
    },
  },
  subtitle: {
    fontSize: 15,
    [theme.breakpoints.up(smallBreakpoint)]: {
      fontSize: 18,
    },
    '& a': {
      color: theme.palette.text.alwaysWhite,
    },
    fontWeight: 500,
    marginTop: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    // textShadow: `0 0 5px light-dark(${theme.palette.background.default}, transparent), 0 0 10px light-dark(${theme.palette.background.default}, transparent), 0 0 15px light-dark(${theme.palette.background.default}, transparent)`,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.text.alwaysWhite,
    transition: 'opacity 0.3s ease-out',
    '& li': {
      marginLeft: -10
    },
    '& ul': {
      margin: 0,
    },
  },
  activeMeetupType: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  activeAcxMeetupType: {
    background: theme.palette.meetupMonth.acx,
    color: theme.palette.text.alwaysWhite,
  },
  activeIfanyoneMeetupType: {
    background: theme.palette.meetupMonth.ifanyone,
    color: theme.palette.text.alwaysWhite,
  },
  activePetrovMeetupType: {
    background: theme.palette.meetupMonth.petrov,
    color: theme.palette.grey[100],
  },
  date: {
    fontSize: 16,
    fontWeight: 400,
    color: theme.palette.text.primary,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 10,
    opacity: 0.8,
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
    top: -80,
    right: 0,
    width: '60%',
    height: '100vh',
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
  contentContainer: {
    width: '100%',
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: '100%',
    },
    position: 'absolute',
    zIndex: 1,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  carouselSection: {
    position: 'absolute',
    bottom: 0,
    textAlign: 'center',  
    
    display: 'block',
    opacity: 1,
    transition: 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out',
    transform: 'translateX(0)',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  createEventButton: {
    display: 'block',
    ...theme.typography.commentStyle,
    borderRadius: 3,
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    fontSize: 14,  
    cursor: 'pointer',
    border: 'none',
    textAlign: 'center',
    width: 'calc(100% - 10px)',
    justifyContent: 'center',
    alignItems: 'center',
    wordWrap: 'balance',
    padding: 10,
  },
  createEventButtonIcon: {
    fontSize: 16,
    fontWeight: 900,
    marginRight: 8,
    marginLeft: 8,
  },
  buttonText: {
    display: 'inline-block',
    [theme.breakpoints.down(smallBreakpoint)]: {
      display: 'none',
    },
  },
  shortButtonText: {
    display: 'none',
    [theme.breakpoints.down(smallBreakpoint)]: {
      display: 'inline-block',
    },
  },
}));


export const SolsticeSeasonQuery = gql(`
  query solsticeSeasonQuery {
    HomepageCommunityEvents(limit: 500) {
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
  
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const fadeDistance = 600; // px until fully faded
      const nextOpacity = Math.max(0, 1 - y / fadeDistance);
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

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [nextCarouselIndex, setNextCarouselIndex] = useState<number | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null)

  
  const acxCarouselIndex = 1 
  const solsticeCarouselIndex = 2 
  // const ifanyoneCarouselIndex = 2 
  // const petrovCarouselIndex = 3 
  const lwCarouselIndex = 3
  const activeIndex = nextCarouselIndex ?? currentCarouselIndex
  const filterKey = activeIndex === acxCarouselIndex ? 'SSC' : activeIndex === solsticeCarouselIndex ? 'SOLSTICE' : activeIndex === lwCarouselIndex ? 'LW' : undefined

  type EventType = typeof events[0];
  
  const filteredEvents = useMemo(() => {
    if (filterKey) {
      return events.filter((event: EventType) => (event.types ?? []).includes(filterKey));
    }
    return events;
  }, [filterKey, events]);

  const pointsData = useMemo(() => {
    return filteredEvents
      .filter((event: EventType) => event.lat != null && event.lng != null)
      .map((event: EventType) => ({
        lat: event.lat!,
        lng: event.lng!,
        size: 0.5,
        color: filterKey === 'SSC' ? '#ff6b6b' : filterKey === 'SOLSTICE' ? '#c7ceea' : filterKey === 'LW' ? '#95e1d3' : '#c7ceea',
        eventId: event._id,
        event: event,
      }));
  }, [filteredEvents, filterKey]);

  const handleMeetupTypeClick = useCallback((index: number) => {
    if (index === currentCarouselIndex) return

    setIsSettingUp(true)
    setNextCarouselIndex(index)

    setTimeout(() => {
      setIsSettingUp(false)
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentCarouselIndex(index)
        setNextCarouselIndex(null)
      }, 300)
    }, 10)
  }, [currentCarouselIndex])

  if (isLoading) {
    return <div className={classes.root} style={{ opacity: bannerOpacity, pointerEvents: pointerEventsDisabled ? 'none' : 'auto' }}>
      {/* <div className={classes.globeGradient} /> */}
      <div className={classes.globeGradientRight} />
      <div className={classes.scrollBackground} />
      <div 
        className={classes.globeContainer} 
        onClick={() => setEverClickedGlobe(true)}
        style={{ opacity: 0 }}
      >
        <SolsticeGlobe3D 
          pointsData={pointsData}
          defaultPointOfView={defaultPointOfView}
          onPointClick={(point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => {
            if (point.eventId) {
              setSelectedEventId(point.eventId);
              setPopupCoords(screenCoords);
            }
          }}
          onReady={() => setIsLoading(false)}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>;
  }

  return <div className={classNames(classes.root)} style={{ opacity: bannerOpacity, pointerEvents: pointerEventsDisabled ? 'none' : 'auto' }}>
    {/* <div className={classes.globeGradient}/> */}
    <div className={classes.globeGradientRight} />
    <div className={classes.scrollBackground} />
    <div 
      className={classes.globeContainer} 
      onClick={() => setEverClickedGlobe(true)}
    >
        <SolsticeGlobe3D 
          pointsData={pointsData}
          defaultPointOfView={defaultPointOfView}
          onPointClick={(point: SolsticeGlobePoint, screenCoords: { x: number; y: number }) => {
            if (point.eventId) {
              setSelectedEventId(point.eventId);
              setPopupCoords(screenCoords);
            }
          }}
          onReady={() => setIsLoading(false)}
          style={{ width: '100%', height: '100%' }}
        />
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
      <div className={classes.contentContainer}>
        <div className={classes.textContainer} onClick={() => setEverClickedGlobe(true)}>
          <h1 className={classes.title}>Solstice Season</h1>
            <p className={classes.subtitle}>Celebrate humanity's Schelling holiday around the world. Find a local solstice event or create your own.</p>
            <div className={classes.buttonContainer}>
              <Link to="https://waypoint.lighthaven.space/solstice-season" target="_blank" rel="noopener noreferrer">
                <div className={classes.createEventButton} style={{backgroundColor: "rgb(38, 90, 118)"}} >
                  Berkeley Megameetup
                </div>
              </Link>
              <Link to={`/newPost?eventForm=true&SOLSTICE=true`} target="_blank" rel="noopener noreferrer">
                <div className={classes.createEventButton} style={{backgroundColor:  "rgb(46, 105, 70)"}} >
                  Announce a Solstice Event
                </div>
              </Link>
              <Link to="" target="_blank" rel="noopener noreferrer">
                <div className={classes.createEventButton} style={{backgroundColor:"rgb(39, 167, 186)"}} >
                  New York Megameetup
                </div> 
              </Link>
            </div>  
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
