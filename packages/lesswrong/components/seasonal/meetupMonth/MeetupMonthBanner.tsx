import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { WrappedReactMapGL } from '../../community/WrappedReactMapGL';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { grey } from '@/themes/defaultPalette';
import { LocalEventMapMarkerWrappers } from '../HomepageMap/HomepageCommunityMap';
import { useUserLocation } from '@/lib/collections/users/helpers';
import { useCurrentUser } from '@/components/common/withUser';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import HomepageMapFilter from '../HomepageMap/HomepageMapFilter';
import { useQuery } from "@/lib/crud/useQuery";
import { LocalEventsMapMarkers, PostsListMultiQuery } from '@/components/localGroups/CommunityMap';
import without from 'lodash/without';

const localEvents = [
  {
  "_id": "9mpqcnEJWykwd28iZ",
  "lat": 9.0690546,
  "lng": 7.4784446
},
{
  "_id": "PzHRajcvf8LgYeYGu",
  "lat": -33.92817,
  "lng": 18.42267
},
{
  "_id": "oEY9ASbrEYJuwEMwr",
  "lat": 0.279938,
  "lng": 32.820062
},

{
  "_id": "5oHsfehy8QWDoJHzd",
  "lat": -35.2729725,
  "lng": 149.1324762
},


];

const styles = defineStyles("MeetupMonthBanner", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100vh',
  },
  title: {
    fontSize: 57,
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
    fontSize: 40,
    fontWeight: 500,
    fontFamily: theme.typography.headerStyle.fontFamily,
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 0,
    lineHeight: 1.2,
  },
  textContainer: {
    position: 'absolute',
    width: 425,
    bottom: 50,
    right: 100,
    zIndex: 2,
    paddingLeft: 14,
    lineHeight: 1.5,
    transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    transform: 'translateX(0)',
    opacity: 1,
    '&.transitioning': {
      transform: 'translateX(-100%)',
      opacity: 0,
    },
    '& a': {
      color: theme.palette.link.color,
    },
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 500,
    marginTop: 0,
    textShadow: `0 0 5px ${theme.palette.background.default}, 0 0 10px ${theme.palette.background.default}, 0 0 15px ${theme.palette.background.default}`,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.text.primary,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 0,
  },
  meetupTypes: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 10,
    '& li': {
      marginLeft: -10
    },
  },
  meetupType: {
    background: 'transparent',
    // border: `1px solid ${theme.palette.grey[600]}`,
    borderRadius: 4,
    paddingLeft: 10,
    paddingRight: 14,
    paddingTop: 6,
    paddingBottom: 6,
    fontSize: 18,
    fontWeight: 400,
    '&:hover': {
      opacity: 0.5
    },
    fontFamily: theme.typography.headerStyle.fontFamily,
    // color: theme.palette.text.alwaysWhite,
    transition: 'opacity 0.3s ease-out',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginLeft: 4,
    '& a': {
      textDecoration: 'underline',
      // color: theme.palette.primary.main,
    },
    '& a:hover': {
      textDecoration: 'none',
    },
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
    background: `radial-gradient(ellipse at right, transparent 50%, ${theme.palette.background.default} 100%)`,
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
  mapClickContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 3,
    width: '35vw',
    height: '100vh',
    pointerEvents: 'auto',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  carouselContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  carouselContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    opacity: 0,
    transform: 'translateX(100%)',
    transition: 'none',
    pointerEvents: 'none',
    marginBottom: 50,
    '&.active': {
      opacity: 1,
      transform: 'translateX(0)',
      pointerEvents: 'auto',
      transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    },
    '&.sliding-out-left': {
      opacity: 0,
      transform: 'translateX(-100%)',
      transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    },
    '&.sliding-out-right': {
      opacity: 0,
      transform: 'translateX(100%)',
      transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    },
    '&.sliding-in-left': {
      opacity: 1,
      transform: 'translateX(0)',
      transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    },
    '&.sliding-in-right': {
      opacity: 1,
      transform: 'translateX(0)',
      transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
    },
    '&.prepare-left': {
      transform: 'translateX(-100%)',
      opacity: 0,
    },
    '&.prepare-right': {
      transform: 'translateX(100%)',
      opacity: 0,
    },
  },
  carouselNavigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 300,
    margin: "auto",
    paddingRight: 30,
    gap: 8,
    zIndex: 4,
  },
  carouselNavItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[900],
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    '&.active': {
      width: 10,
      height: 10,
      backgroundColor: theme.palette.primary.main,
    },
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  carouselArrow: {
    width: 30,
    height: 30,
    color: theme.palette.text.primary,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    zIndex: 4,
    transition: 'background-color 0.3s ease',
    '&:hover': {
      opacity: 0.6
    },
  },
  carouselArrowLeft: {
    left: 20,
  },
  carouselArrowRight: {
    right: 20,
  },
  zoomScrollbarContainer: {
    position: 'absolute',
    top: 120,
    right: 100,
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
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      width: 16,
      height: 16,
      background: theme.palette.primary.main,
      borderRadius: '50%',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    '&::-moz-range-thumb': {
      width: 16,
      height: 16,
      background: theme.palette.primary.main,
      borderRadius: '50%',
      cursor: 'pointer',
      border: 'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
  },
}));

// Function to get user coordinates from IP address
const getUserCoordinatesFromIP = async (): Promise<{lat: number, lng: number} | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch IP geolocation');
    }
    const data = await response.json();
    
    // ipapi.co returns latitude and longitude in the response
    if (data.latitude && data.longitude) {
      return {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude)
      };
    }
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting IP coordinates:', error);
    return null;
  }
};

export default function MeetupMonthBanner() {
  const classes = useStyles(styles);
  const [mapViewport, setMapViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [mapActive, setMapActive] = useState(false);
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 40,
    zoom: 1.1
  });

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
      // Try to get coordinates from IP address
      const coordinates = await getUserCoordinatesFromIP();
      
      if (coordinates) {
        setViewport({
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          zoom: 1
        });
      } else {
        // Fallback to default coordinates (center of the world)
        setViewport({
          latitude: 20,
          longitude: 50,
          zoom: 1
        });
      }
      setIsLoading(false);
    };

    void initializeMap();
  }, []);

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
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [nextCarouselIndex, setNextCarouselIndex] = useState<number | null>(null)
  const [prepareNextSlide, setPrepareNextSlide] = useState(false)
  const [isMapHovered, setIsMapHovered] = useState(false)

  console.log("Do not merge until you've made sure all the links work.")
  
  const carouselSections = [
    {
      title: "Meetup Month",
      subtitle: <div>Find events near you, or annouce your own. Attend an <a href="">ACX Everywhere</a> meetup. Host a reading group for <a href="https://www.ifanyonebuildsit.com/book-clubs">If Anyone Builds It, Everyone Dies</a>. Hold a ceremony celebrating <a href="https://www.lesswrong.com/meetups/petrov-day">Petrov Day.</a></div>,
    },
    {
      minorTitle: "ACX Everywhere",
      subtitle: "Find communities near you, or start your own. Consider hosting an ACX Meetup.",
      linkText: "ACX Meetup"
    },
    {
      minorTitle: "If Anyone Builds It",
      subtitle: "Join book clubs and discussions around the latest ideas in effective altruism.",
      link: "https://www.ifanyonebuildsit.com/book-clubs",
      linkText: "If Anyone Builds It"
    },
    {
      minorTitle: "Petrov Day",
      subtitle: "Participate in ceremonies that honor the importance of nuclear safety and rationality.",
      link: "https://www.lesswrong.com/meetups/petrov-day",
      linkText: "Petrov Day"
    }
  ]
  
  useGlobalKeydown(ev => {
    if (ev.key === 'Escape') {
      setMapActive(false)
    } else if (ev.key === 'ArrowLeft') {
      handlePrevSlide()
    } else if (ev.key === 'ArrowRight') {
      handleNextSlide()
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
  
  const handlePrevSlide = useCallback(() => {
    if (!isTransitioning) {
      const prevIndex = (currentCarouselIndex - 1 + carouselSections.length) % carouselSections.length
      setNextCarouselIndex(prevIndex)
      setSlideDirection('left')
      setPrepareNextSlide(true)
      
      // Small delay to position the incoming slide
      setTimeout(() => {
        setPrepareNextSlide(false)
        setIsTransitioning(true)
        
        // After animation completes
        setTimeout(() => {
          setCurrentCarouselIndex(prevIndex)
          setNextCarouselIndex(null)
          setIsTransitioning(false)
        }, 500)
      }, 50)
    }
  }, [isTransitioning, currentCarouselIndex, carouselSections.length])
  
  const handleNextSlide = useCallback(() => {
    if (!isTransitioning) {
      const nextIndex = (currentCarouselIndex + 1) % carouselSections.length
      setNextCarouselIndex(nextIndex)
      setSlideDirection('right')
      setPrepareNextSlide(true)
      
      // Small delay to position the incoming slide
      setTimeout(() => {
        setPrepareNextSlide(false)
        setIsTransitioning(true)
        
        // After animation completes
        setTimeout(() => {
          setCurrentCarouselIndex(nextIndex)
          setNextCarouselIndex(null)
          setIsTransitioning(false)
        }, 500)
      }, 50)
    }
  }, [isTransitioning, currentCarouselIndex, carouselSections.length])


  const renderedMarkers = useMemo(() => {
    return <LocalEventsMapMarkers events={events} handleClick={handleClick} handleClose={handleClose} openWindows={openWindows} />
  }, [events, handleClick, handleClose, openWindows])

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
      {/* Zoom scrollbar */}
      <div className={`${classes.zoomScrollbarContainer} ${isMapHovered ? 'visible' : ''}`}>
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
      </div>
      
      <div className={`${classes.textContainer} ${isTransitioning ? 'transitioning' : ''}`}>
        <div className={classes.carouselContainer}>
          {carouselSections.map((section, index) => {
            const isCurrentSlide = index === currentCarouselIndex
            const isIncomingSlide = index === nextCarouselIndex
            
            let style: React.CSSProperties = {}
            let className = classes.carouselContent
            
            if (prepareNextSlide && isIncomingSlide) {
              // Position the incoming slide without transition
              const startPosition = slideDirection === 'right' ? '100%' : '-100%'
              style = { 
                transform: `translateX(${startPosition})`, 
                opacity: 0,
                transition: 'none',
                pointerEvents: 'none' as const
              }
            } else if (isTransitioning) {
              if (isCurrentSlide && !isIncomingSlide) {
                // Current slide sliding out
                style = { 
                  transform: slideDirection === 'right' ? 'translateX(-100%)' : 'translateX(100%)', 
                  opacity: 0,
                  transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
                  pointerEvents: 'auto' as const
                }
              } else if (isIncomingSlide) {
                // Incoming slide sliding in from the correct direction
                style = { 
                  transform: 'translateX(0)', 
                  opacity: 1,
                  transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
                  pointerEvents: 'auto' as const
                }
              } else {
                // Other slides stay hidden
                style = { 
                  transform: 'translateX(100%)', 
                  opacity: 0,
                  pointerEvents: 'none' as const
                }
              }
            } else {
              if (isCurrentSlide) {
                // Active slide when not transitioning
                style = { 
                  transform: 'translateX(0)', 
                  opacity: 1,
                  transition: 'none',
                  pointerEvents: 'auto' as const
                }
              } else {
                // Inactive slides positioned based on their relation to current
                const isPrevious = index === (currentCarouselIndex - 1 + carouselSections.length) % carouselSections.length
                const isNext = index === (currentCarouselIndex + 1) % carouselSections.length
                
                if (isPrevious) {
                  style = { transform: 'translateX(-100%)', opacity: 0, pointerEvents: 'none' as const }
                } else if (isNext) {
                  style = { transform: 'translateX(100%)', opacity: 0, pointerEvents: 'none' as const }
                } else {
                  style = { transform: 'translateX(100%)', opacity: 0, pointerEvents: 'none' as const }
                }
              }
            }
            
            return (
              <div
                key={index}
                id={`carousel-slide-${index}`}
                className={className}
                style={style}
              >
                {section.title && <h1 className={classes.title} style={{ opacity: scrollOpacity }}>{section.title}</h1>}
                {section.minorTitle && <h1 className={classes.minorTitle} style={{ opacity: scrollOpacity }}>{section.minorTitle}</h1>}
                <p className={classes.subtitle} style={{ opacity: scrollOpacity }}>
                  {section.subtitle}
                </p>
              </div>
            )
          })}
        </div>

        {/* Navigation dots */}
        <div className={classes.carouselNavigation}>
          <button
            className={`${classes.carouselArrow} ${classes.carouselArrowLeft}`}
            aria-label="Previous slide"
            onClick={handlePrevSlide}
          >
            ‹
          </button>
          {carouselSections.map((_, index) => (
            <div
              key={index}
              className={`${classes.carouselDot} ${index === currentCarouselIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => {
                if (!isTransitioning && index !== currentCarouselIndex) {
                  setNextCarouselIndex(index)
                  setSlideDirection(index > currentCarouselIndex ? 'right' : 'left')
                  setPrepareNextSlide(true)
                  
                  setTimeout(() => {
                    setPrepareNextSlide(false)
                    setIsTransitioning(true)
                    
                    setTimeout(() => {
                      setCurrentCarouselIndex(index)
                      setNextCarouselIndex(null)
                      setIsTransitioning(false)
                    }, 500)
                  }, 50)
                }
              }}
            />
          ))}
          <button
            className={`${classes.carouselArrow} ${classes.carouselArrowRight}`}
            aria-label="Next slide"
            onClick={handleNextSlide}
          >
            ›
          </button>
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

registerComponent('MeetupMonthBanner', MeetupMonthBanner)
