import React, { useState, useMemo, useCallback } from 'react';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { JssStyles } from '@/lib/jssStyles';
import { Link } from '@/lib/reactRouterWrapper';
import classNames from 'classnames';
import { LocalEventWrapperPopUp } from '../HomepageMap/HomepageCommunityMap';
import SolsticeGlobe from './SolsticeGlobe'; 

const smallBreakpoint = 1525

function getCarouselSections(classes: JssStyles) {
  return [
    {
      minorTitle: "Solstice",
      subtitle: <div>
        <div>Celebrate the solstice with events around the world. Join communities marking the longest or shortest day of the year.</div>
        <Link to={`/newPost?eventForm=true&SOLSTICE=true`} target="_blank" rel="noopener noreferrer" className={classes.createEventButton}>
          <span className={classes.createEventButtonIcon}>+</span> CREATE SOLSTICE EVENT</Link>
      </div>,
      buttonText: "Solstice",
      shortButtonText: "Solstice"
    }
  ]
}

const styles = defineStyles("SolsticeSeasonBanner", (theme: ThemeType) => ({
  root: {
    position: 'absolute',
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
    fontSize: 45,
    fontWeight: 500,
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontVariant: 'small-caps',
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 0,
    lineHeight: 1.2,
  },
  minorTitle: {
    fontSize: 38,
    fontWeight: 500,
    [theme.breakpoints.down(smallBreakpoint)]: {
      fontSize: 34,
    },
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontVariant: 'small-caps',
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 0,
    lineHeight: 1.2,
  },
  textContainer: {
    width: 320,
    marginRight: 20,
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
    height: 90,
    [theme.breakpoints.up(smallBreakpoint)]: {
      fontSize: 18,
      height: 120,
    },
    '& a': {
      color: theme.dark ? theme.palette.primary.light : theme.palette.primary.main,
    },
    fontWeight: 500,
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textShadow: `0 0 5px light-dark(${theme.palette.background.default}, transparent), 0 0 10px light-dark(${theme.palette.background.default}, transparent), 0 0 15px light-dark(${theme.palette.background.default}, transparent)`,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.text.primary,
    transition: 'opacity 0.3s ease-out',
    '& li': {
      marginLeft: -10
    },
    '& ul': {
      margin: 0,
    },
  },
  meetupTypes: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 320,
    marginRight: 20,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 370,
      marginRight: 0,
    },
    gap: 8,
    paddingTop: 10,
  },
  meetupType: {
    background: theme.palette.grey[400],
    color: theme.palette.text.alwaysWhite,
    borderRadius: 4,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 7,
    paddingBottom: 7,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 400,
    '&:hover': {
      opacity: 0.5
    },
    fontFamily: theme.typography.body2.fontFamily,
    transition: 'opacity 0.1s ease-out',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    '& a': {
      textDecoration: 'underline',
    },
    '& a:hover': {
      textDecoration: 'none',
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
  globeGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    background: `radial-gradient(ellipse at top, transparent 30%, ${theme.palette.background.default} 100%)`,
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-out',
  },
  globeGradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(to left, transparent 0%, ${theme.palette.background.default} 100%)`,
    [theme.breakpoints.up(1620)]: {
      background: `linear-gradient(to left, transparent 0%, ${theme.palette.background.default} 100%)`,
    },
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-out',
  },
  globeContainer: {
    position: 'absolute',
    top: -80,
    right: 0,
    width: '80%',
    height: '100%',
    transition: 'opacity 0.3s ease-out',
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
    width: 'calc(100% - 400px)',
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 'calc(100% - 300px)',
    },
    paddingTop: 120,
    paddingBottom: 80,
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
    display: 'block',
    opacity: 1,
    transition: 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out',
    transform: 'translateX(0)',
  },
  createEventButton: {
    ...theme.typography.commentStyle,
    color: theme.dark ? theme.palette.primary.light : theme.palette.primary.main,
    paddingTop: 10,
    fontSize: 15,
    display: 'inline-block',
    cursor: 'pointer',
    border: 'none',
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
  const carouselSections = useMemo(() => getCarouselSections(classes), [classes]);
  
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
    return <div className={classes.root}>
      <div className={classes.globeGradient} />
      <div className={classes.globeGradientRight} />
      <div className={classes.scrollBackground} />
      <div 
        className={classes.globeContainer} 
        onClick={() => setEverClickedGlobe(true)}
        style={{ opacity: 0 }}
      >
        <SolsticeGlobe 
          pointsData={pointsData}
          defaultPointOfView={defaultPointOfView}
          onPointClick={(point: any) => { if (point.eventId) setSelectedEventId(point.eventId) }}
          onReady={() => setIsLoading(false)}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>;
  }

  const selectedEvent = selectedEventId ? events.find((e: EventType) => e._id === selectedEventId) : null;

  return <div className={classNames(classes.root)}>
    <div className={classes.globeGradient}/>
    <div className={classes.globeGradientRight} />
    <div className={classes.scrollBackground} />
    <div 
      className={classes.globeContainer} 
      onClick={() => setEverClickedGlobe(true)}
    >
      <SolsticeGlobe 
        pointsData={pointsData}
        defaultPointOfView={defaultPointOfView}
        onPointClick={(point: any) => { if (point.eventId) setSelectedEventId(point.eventId) }}
        style={{ width: '100%', height: '100%' }}
        onClick={() => setEverClickedGlobe(true)}
      />
      {selectedEvent && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '4px',
          maxWidth: '200px'
        }}>
          <LocalEventWrapperPopUp localEvent={selectedEvent} handleClose={() => setSelectedEventId(null)} />
        </div>
      )}
      <div className={classes.contentContainer}>
        <div className={classes.textContainer} onClick={() => setEverClickedGlobe(true)}>
          {carouselSections.map((section, index) => {
            
            const aboutToTransition = isSettingUp && index === nextCarouselIndex
            const isTransitioningOut = (!isSettingUp && isTransitioning && index === currentCarouselIndex)
            const isTransitioningIn = (!isSettingUp && isTransitioning && index === nextCarouselIndex)
            
            let translateX = '0'
            if (isTransitioningOut) {
              translateX = '-100%'
            } else if (aboutToTransition) {
              translateX = '100%'
            } else if (isTransitioningIn) {
              translateX = '0'
            }

            const shouldRender = index === currentCarouselIndex || index === nextCarouselIndex
            
            const opacity = (aboutToTransition || isTransitioningOut) ? 0 : 1;

            return <div key={index} className={classes.carouselSection} style={{
              display: shouldRender ? 'block' : 'none',
              opacity,
              transition: !isSettingUp ? 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out' : 'none',
              transform: `translateX(${translateX})`,
            }}>
              {section.minorTitle && <h3 className={classes.minorTitle}>{section.minorTitle}</h3>}
              {section.subtitle && <div className={classes.subtitle}>{section.subtitle}</div>}
            </div>
          })}
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
