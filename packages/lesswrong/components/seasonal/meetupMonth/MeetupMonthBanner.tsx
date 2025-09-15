import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { WrappedReactMapGL } from '../../community/WrappedReactMapGL';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { grey } from '@/themes/defaultPalette';
import { LocalEventMapMarkerWrappers, LocalEventMapMarkerWrappersInner } from '../HomepageMap/HomepageCommunityMap';
import { useUserLocation } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import HomepageMapFilter from '../HomepageMap/HomepageMapFilter';
import { useQuery } from "@/lib/crud/useQuery";
import { LocalEventsMapMarkers, PostsListMultiQuery } from '@/components/localGroups/CommunityMap';
import without from 'lodash/without';
import { backdatePreviousDigest } from '@/server/callbacks/digestCallbacks';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { gql } from '@/lib/generated/gql-codegen';
import { LocalEvent } from '../HomepageMap/acxEvents';

const hideBreakpoint = 1425
const smallBreakpoint = 1525

const carouselSections = [
  {
    title: "Meetup Month",
    buttonText: "All",
    subtitle: <div><div>Find events near you, or annouce your own.</div><ul><li>Attend an <a 
    href="">ACX Everywhere</a> meetup.</li><li>Host a reading group for <a href="https://www.
    ifanyonebuildsit.com/book-clubs">If Anyone Builds It</a>.</li><li>Hold a ceremony celebrating <a href="https://www.lesswrong.com/meetups/petrov-day">Petrov Day.</a></li></ul></div>,
  },
  // {
  //   title: "Meetup Month",
  //   buttonText: "All",
  //   subtitle: <div><div>Find events near you, or annouce your own. Attend an <a href="">ACX 
  // Everywhere</a> meetup. Host a reading group for <a href="https://www.ifanyonebuildsit.com/
  // book-clubs">If Anyone Builds It</a>. Hold a ceremony celebrating <a href="https://www.lesswrong.
  // com/meetups/petrov-day">Petrov Day.</a></div></div>,
  // },
  {
    minorTitle: "ACX Everywhere",
    subtitle: <div>Many cities have regular Astral Codex Ten meetup groups. Twice a year, we  advertise their upcoming meetup so that irregular attendees can attend and new readers can learn about them.</div>,
    linkText: "ACX Meetup",
    buttonText: "ACX"
  },
  {
    minorTitle: "If Anyone Builds It",
    subtitle: <div><a href="https://www.ifanyonebuildsit.com/
    book-clubs">If Anyone Builds It, Everyone Dies</a> is launching September 16th. You can <a href="https://www.ifanyonebuildsit.com/book-clubs">sign up here</a> to get help facilitating a reading group.</div>,
    link: "https://www.ifanyonebuildsit.com/book-clubs",
    linkText: "If Anyone Builds It",
    buttonText: "If Anyone Builds It"
  },
  {
    title: "Petrov Day",
    subtitle: <div>September 26th is the day Stanislav Petrov didn't destroy the world. Host a ceremony observing the day's significance.</div>,
    link: "https://www.lesswrong.com/meetups/petrov-day",
    linkText: "Petrov Day",
    buttonText: "Petrov Day"
  }
]

const styles = defineStyles("MeetupMonthBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100vh',
    [theme.breakpoints.down(hideBreakpoint)]: {
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
    [theme.breakpoints.up(1500)]: {
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
    background: `radial-gradient(ellipse at right, transparent 40%, ${theme.palette.background.default} 50%)`,
    [theme.breakpoints.up(1620)]: {
      background: `radial-gradient(ellipse at right, transparent 60%, ${theme.palette.background.default} 100%)`,
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
  petrovDayImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: 3,
    transition: 'opacity 0.3s ease-out',
    pointerEvents: 'none',
  },
  check: {
    width: 10,
    height: 10,
    color: theme.palette.text.alwaysWhite,
  },
  checked: {
    '&&': {
      color: theme.palette.text.alwaysWhite,
    },
  },
  mapButtons: {
    alignItems: "flex-end",
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down('md')]: {
      top: 24
    },
    ...theme.typography.body2
  },
  zoomScrollbarContainer: {
    margin: '0 auto',
    zIndex: 4,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: 'none',
    '&.visible': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
  zoomScrollbar: {
    width: 200,
    height: 6,
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      width: 16,
      height: 16,
      borderRadius: '50%',
      cursor: 'pointer',
    },
    '&::-moz-range-thumb': {
      width: 16,
      height: 16,
      borderRadius: '50%',
      cursor: 'pointer',
      border: 'none',
    },
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
    justifyContent: 'space-between',
    alignItems: 'center',
  }
}));


export const MeetupMonthyQuery = gql(`
  query meetupMonthyQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        _id
        location
        googleLocation
        onlineEvent
        globalEvent
        startTime
        endTime
        localStartTime
        localEndTime
      }
      totalCount
    }
  }
`);


export default function MeetupMonthBannerInner() {
  const classes = useStyles(styles);
  const [mapViewport, setMapViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [mapActive, setMapActive] = useState(false);
  
  const defaultViewport = useMemo(() => ({
    latitude: 20, // Centered roughly over the Atlantic Ocean
    longitude: -60,
    zoom: 1.1
  }), [])

  const [viewport, setViewport] = useState(defaultViewport)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress relative to 100vh (0 to 1)
      const scrollProgress = Math.min(scrollTop / windowHeight, 1);
      
      // Map, title, subtitle fade out completely by 100vh (1 to 0)
      const fadeOutOpacity = 1 - scrollProgress;
      
      // setScrollOpacity(fadeOutOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const currentUser = useCurrentUser()
  // this is unused in this component, but for Meetup Month it seems good to force the prompt to enter location.
  useUserLocation(currentUser, false)

  const { view, ...selectorTerms } = { view: 'events' };
  const { data } = useQuery(PostsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 500,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const events = useMemo(() => data?.posts?.results ?? [], [data?.posts?.results]);

  const [ openWindows, setOpenWindows ] = useState<string[]>([])
  const [isMapHovered, setIsMapHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [nextCarouselIndex, setNextCarouselIndex] = useState<number | null>(null)

  useGlobalKeydown(ev => {
    if (ev.key === 'Escape') {
      setMapActive(false)
    }
  });
  
  const handleClick = useCallback(
    (id: string) => { setOpenWindows([id]) }
    , []
  )
  const handleClose = useCallback(
    (id: string) => { setOpenWindows(without(openWindows, id))}
    , [openWindows]
  )
  
  const renderedMarkers = useMemo(() => {
    // return <LocalEventsMapMarkers events={events} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />
  

    return <LocalEventMapMarkerWrappersInner localEvents={events.map(event => ({
      _id: event._id,
      lat: event.googleLocation?.geometry?.location?.lat,
      lng: event.googleLocation?.geometry?.location?.lng,
    }))} />
    // }, [events, handleClick, handleClose, openWindows])
  }, [events])
  const handleZoomChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(event.target.value)
    setViewport(prev => ({
      ...prev,
      zoom: newZoom
    }))
  }, [])

  const handleMapMouseEnter = useCallback(() => {
    setIsMapHovered(true)
  }, [])

  const handleMapMouseLeave = useCallback(() => {
    setIsMapHovered(false)
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

  if (isLoading) {
    return <div className={classes.root}>
      <div className={classes.mapGradient} style={{ opacity: scrollOpacity }}/>
      <div className={classes.mapGradientRight} style={{ opacity: scrollOpacity }}/>
    </div>;
  }

  return <div className={classes.root}>
    <div className={classes.mapGradient}/>
    <div className={classes.mapGradientRight} />
    <div 
      className={classes.mapContainer} 
      style={{ opacity: scrollOpacity }}
      onMouseEnter={handleMapMouseEnter}
      onMouseLeave={handleMapMouseLeave}
    >
      <div className={classes.contentContainer}>
        {/* <div className={`${classes.zoomScrollbarContainer} ${isMapHovered ? 'visible' : ''}`}>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={viewport.zoom}
            onChange={handleZoomChange}
            className={classes.zoomScrollbar}
            aria-label="Map zoom control"
          />
        </div> */}
        
        <div className={classes.textContainer}>
          {carouselSections.map((section, index) => {
            
            const aboutToTransition = isSettingUp && index === nextCarouselIndex
            const isTransitioningOut = (!isSettingUp && isTransitioning && index === currentCarouselIndex)
            const isTransitioningIn = (!isSettingUp && isTransitioning && index === nextCarouselIndex)
            
            // Decide horizontal position
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

            // A section should render whenever it is either the current or next target
            const shouldRender = index === currentCarouselIndex || index === nextCarouselIndex
            
            // Opacity rules: staged section starts at 0.5, fades to 1 when sliding in, fades to 0 when sliding out
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
              {section.subtitle && <p className={classes.subtitle}>{section.subtitle}</p>}
            </div>
          })}
        </div>
        <div className={classes.meetupTypes}> 
          {carouselSections.map((section, index) => {
            const activeIndex = nextCarouselIndex ?? currentCarouselIndex;
            return (
              <div
                className={`${classes.meetupType} ${index === activeIndex ? classes.activeMeetupType : ''}`}
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
    {/* <img 
      src="https://cdn.midjourney.com/86fb466b-6069-4355-a96d-2b5e527efb0f/0_0.png" 
      alt="Petrov Day" 
      className={classes.petrovDayImage}
      style={{ opacity: 1 - scrollOpacity }}
    /> */}
  </div>;
}

export const MeetupMonthBanner = () => {
  return <SuspenseWrapper name="MeetupMonthBanner">
    <MeetupMonthBannerInner />
  </SuspenseWrapper>
}
