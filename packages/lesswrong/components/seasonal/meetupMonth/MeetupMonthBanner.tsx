import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { WrappedReactMapGL } from '../../community/WrappedReactMapGL';
import { LocalEventMapMarkerWrappersInner } from '../HomepageMap/HomepageCommunityMap';
import { useQuery } from "@/lib/crud/useQuery";
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { JssStyles } from '@/lib/jssStyles';
import MagnifyingGlassPlusIcon from '@heroicons/react/24/solid/MagnifyingGlassPlusIcon';
import MagnifyingGlassMinusIcon from '@heroicons/react/24/solid/MagnifyingGlassMinusIcon';
import { Link } from '@/lib/reactRouterWrapper';

const smallBreakpoint = 1525

function getCarouselSections(classes: JssStyles) {
  return [
    {
      title: "Meetup Month",
      buttonText: "All",
      subtitle: <div><div>Find events near you, or annouce your own.</div><ul><li>Attend an <Link 
      to="/posts/6umEbXvotXicRPvGs/meetups-everywhere-2025-times-and-places">ACX Everywhere</Link> meetup.</li><li>Host a reading group for <Link to="https://www.amazon.com/Anyone-Builds-Everyone-Dies-Superhuman/dp/0316595640">If Anyone Builds It</Link>.</li><li>Hold a ceremony celebrating <Link to="http://petrovday.com/">Petrov Day.</Link></li></ul></div>,
    },
    {
      minorTitle: "ACX Everywhere",
      subtitle: <div>Many cities have regular Astral Codex Ten meetup groups. Twice a year, we  advertise their upcoming meetup so that irregular attendees can attend and new readers can learn about them. <Link 
      to="/posts/6umEbXvotXicRPvGs/meetups-everywhere-2025-times-and-places">Learn more here.</Link></div>,
      buttonText: "ACX"
    },
    {
      minorTitle: "If Anyone Builds It",
      subtitle: <div>
        <div><Link to="https://www.ifanyonebuildsit.com/
      book-clubs">If Anyone Builds It, Everyone Dies</Link> is launching September 16th. You can <Link to="https://airtable.com/appgM36VHCg9MDEU3/shr4mK6ihTss27kzI">sign up here</Link> to get help facilitating a reading group.</div>
      <Link to="/newPost?eventForm=true&IFANYONE=true" target="_blank" rel="noopener noreferrer" className={classes.createEventButton}>
        <span className={classes.createEventButtonIcon}>+</span> CREATE READING GROUP</Link>
      </div>,
      buttonText: "If Anyone Builds It"
    },
    {
      title: "Petrov Day",
      subtitle: <div>
        <div>September 26th is the day Stanislav Petrov didn't destroy the world. Host a <a href="http://petrovday.com/">ceremony</a> observing the day's significance.</div>
        <Link to="/newPost?eventForm=true&PETROV=true" target="_blank" rel="noopener noreferrer" className={classes.createEventButton}>
          <span className={classes.createEventButtonIcon}>+</span> CREATE PETROV EVENT</Link>
      </div>,
      linkText: "Petrov Day",
      buttonText: "Petrov Day"
    }
  ]
}

const styles = defineStyles("MeetupMonthBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100vh',
    '&:hover': {
      '& $mapButtons': {
        opacity: 1,
      },
    },
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
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontVariant: 'small-caps',
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 0,
    lineHeight: 1.2,
  },
  textContainer: {
    width: 350,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 370,
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
    fontSize: 16,
    height: 90,
    [theme.breakpoints.up(smallBreakpoint)]: {
      fontSize: 18,
      height: 120,
    },
    fontWeight: 500,
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textShadow: `0 0 5px ${theme.palette.background.default}, 0 0 10px ${theme.palette.background.default}, 0 0 15px ${theme.palette.background.default}`,
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
    width: 350,
    [theme.breakpoints.up(smallBreakpoint)]: {
      width: 370,
    },
    gap: 8,
    paddingTop: 10,
  },
  meetupType: {
    // border: `1px solid ${theme.palette.grey[600]}`,
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
    // color: theme.palette.text.alwaysWhite,
    transition: 'opacity 0.1s ease-out',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    '& a': {
      textDecoration: 'underline',
      // color: theme.palette.primary.main,
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
    color: theme.palette.text.alwaysWhite,
  },
  date: {
    fontSize: 16,
    fontWeight: 400,
    color: theme.palette.text.primary,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 10,
    opacity: 0.8,
  },
  mapGradient: {
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
  mapGradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(to left, transparent 35%, ${theme.palette.background.default} 70%)`,
    [theme.breakpoints.up(1620)]: {
      background: `radial-gradient(ellipse at right, transparent 40%, ${theme.palette.background.default} 100%)`,
    },
    zIndex: 1,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-out',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    transition: 'opacity 0.3s ease-out',
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
    [theme.breakpoints.up(smallBreakpoint)]: {
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
    border: `1px solid ${theme.palette.grey[200]}`,
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
    opacity: .2,
    '& svg': {
      fill: theme.palette.grey[400],
    },
    '&:hover': {
      opacity: 1,
    },
    cursor: 'pointer',
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
  createEventButton: {
    ...theme.typography.commentStyle,
    color: theme.palette.primary.dark,
    paddingTop: 10,
    fontSize: 15,
    display: 'inline-block',
    cursor: 'pointer',
    border: 'none',
  },
  createEventButtonIcon: {
    // display: 'none',
    fontSize: 16,
    fontWeight: 900,
    marginRight: 8,
    marginLeft: 8,
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


export const MeetupMonthQuery = gql(`
  query meetupMonthQuery {
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


export default function MeetupMonthBannerInner() {
  const classes = useStyles(styles);
  const [isLoading, setIsLoading] = useState(true);
  const [everClickedMap, setEverClickedMap] = useState(false);
  const carouselSections = useMemo(() => getCarouselSections(classes), [classes]);
  
  const defaultViewport = useMemo(() => ({
    latitude: 20, 
    longitude: -70,
    zoom: 1.1
  }), [])

  const [viewport, setViewport] = useState(defaultViewport)

  useEffect(() => {
    const initializeMap = async () => {
      setViewport({
        latitude: defaultViewport.latitude,
        longitude: defaultViewport.longitude,
        zoom: defaultViewport.zoom
      });
      setIsLoading(false);
    };

    void initializeMap();
  }, [defaultViewport]);

  const { data } = useQuery(MeetupMonthQuery)

  const events = useMemo(() => data?.HomepageCommunityEvents.events ?? [], [data?.HomepageCommunityEvents.events]);

  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [nextCarouselIndex, setNextCarouselIndex] = useState<number | null>(null)

  
  const acxCarouselIndex = 1 
  const acxActive = (nextCarouselIndex ?? currentCarouselIndex) === acxCarouselIndex
  const ifanyoneCarouselIndex = 2 
  const ifanyoneActive = (nextCarouselIndex ?? currentCarouselIndex) === ifanyoneCarouselIndex
  const petrovCarouselIndex = 3 
  const petrovActive = (nextCarouselIndex ?? currentCarouselIndex) === petrovCarouselIndex

  const renderedMarkers = useMemo(() => {
    if (acxActive) {
      return <LocalEventMapMarkerWrappersInner  localEvents={events.filter(event => (event.types ?? []).includes('SSC'))} />
    }
    if (ifanyoneActive) {
      return <LocalEventMapMarkerWrappersInner  onMarkerClick={() => setEverClickedMap(true)} localEvents={events.filter(event => (event.types ?? []).includes('IFANYONE'))} />
    }
    if (petrovActive) {
      return <LocalEventMapMarkerWrappersInner  onMarkerClick={() => setEverClickedMap(true)} localEvents={events.filter(event => (event.types ?? []).includes('PETROV'))} />
    }
    return <LocalEventMapMarkerWrappersInner  onMarkerClick={() => setEverClickedMap(true)} localEvents={events} />
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acxActive, ifanyoneActive, petrovActive, events])
  
  const handleZoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.5, 20),
    }))
  }, [])
  
  const handleZoomOut = useCallback(() => {
    // Prevent zooming out beyond a safe threshold – when zooming too far out Mapbox starts repeating the
    // world map horizontally which causes the markers to render offset from their real positions.
    // We empirically found zoom < 1 to be problematic, so clamp the minimum zoom to 1.
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.5, 1),
    }))
  }, [])

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

  // Automatically rotate carousel unless the user has clicked on the map
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (everClickedMap) return
      const nextIndex = (currentCarouselIndex + 1) % carouselSections.length
      handleMeetupTypeClick(nextIndex)
    }, 30 * 1000)
    return () => clearInterval(intervalId)
  }, [currentCarouselIndex, handleMeetupTypeClick, carouselSections.length, everClickedMap])

  if (isLoading) {
    return <div className={classes.root}>
      <div className={classes.mapGradient} />
      <div className={classes.mapGradientRight} />
    </div>;
  }

  return <div className={`${classes.root} ${acxActive ? classes.acxMode : ''} ${ifanyoneActive ? classes.ifanyoneMode : ''} ${petrovActive ? classes.petrovMode : ''}`}>
    <div className={classes.mapGradient}/>
    <div className={classes.mapGradientRight} />
    <div 
      className={classes.mapContainer} 
      onClick={() => setEverClickedMap(true)}
    >
      <div className={classes.mapButtonsContainer}>
        <div className={classes.mapButtons} onClick={() => setEverClickedMap(true)}>
          <MagnifyingGlassMinusIcon className={classes.zoomButton} onClick={handleZoomOut} />
          <MagnifyingGlassPlusIcon className={classes.zoomButton} onClick={handleZoomIn} />
        </div>
      </div>
      <div className={classes.contentContainer}>
        <div className={classes.textContainer} onClick={() => setEverClickedMap(true)}>
          {carouselSections.map((section, index) => {
            
            const aboutToTransition = isSettingUp && index === nextCarouselIndex
            const isTransitioningOut = (!isSettingUp && isTransitioning && index === currentCarouselIndex)
            const isTransitioningIn = (!isSettingUp && isTransitioning && index === nextCarouselIndex)
            
            let translateX = '0'
            if (isTransitioningOut) {
              translateX = '-100%'
            } else if (aboutToTransition) {
              // New section is staged off-screen to the right
              translateX = '100%'
            } else if (isTransitioningIn) {
              // During the active transition the new section animates to center
              translateX = '0'
            }

            const shouldRender = index === currentCarouselIndex || index === nextCarouselIndex
            
            let opacity = 1
            if (aboutToTransition) {
              opacity = 0
            } else if (isTransitioningOut) {
              opacity = 0
            }

            return <div key={index} style={{
              position: 'absolute',
              bottom: 0,
              display: shouldRender ? 'block' : 'none',
              opacity,
              transition: !isSettingUp ? 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out' : 'none',
              transform: `translateX(${translateX})`,
            }}>
              {section.title && <h1 className={classes.title}>{section.title}</h1>}
              {section.minorTitle && <h3 className={classes.minorTitle}>{section.minorTitle}</h3>}
              {section.subtitle && <div className={classes.subtitle}>{section.subtitle}</div>}
            </div>
          })}
        </div>
        <div className={classes.meetupTypes}> 
          {carouselSections.map((section, index) => {
            const activeIndex = nextCarouselIndex ?? currentCarouselIndex;
            return (
              <div
                className={`${classes.meetupType} ${index === activeIndex ?
                  (index === 1 ? classes.activeAcxMeetupType : index === 2 ? classes.activeIfanyoneMeetupType : index === 3 ? classes.activePetrovMeetupType : classes.activeMeetupType)
                  : ''}`}
                key={index}
                onClick={() => {
                  handleMeetupTypeClick(index);
                }}
              >
                {section.buttonText}
              </div>
            );
          })}
        </div>
      </div>

      <WrappedReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        onViewportChange={setViewport}
        scrollZoom={false}
      >
        {renderedMarkers}
      </WrappedReactMapGL>
    </div>
  </div>;
}

export const MeetupMonthBanner = () => {
  return <SuspenseWrapper name="MeetupMonthBanner">
    <MeetupMonthBannerInner />
  </SuspenseWrapper>
}
