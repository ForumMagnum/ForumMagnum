import React, { useState, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { WrappedReactMapGL } from '../../community/WrappedReactMapGL';

const styles = defineStyles("PetrovDayStory", (theme: ThemeType) => ({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '50vw',
    height: '100vh',
  },
  title: {
    position: 'absolute',
    bottom: 100,
    right: 50,
    fontSize: 70,
    fontWeight: 500,
    fontFamily: theme.typography.headerStyle.fontFamily,
    textTransform: 'uppercase',
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
  },
  subtitle: {
    position: 'absolute',
    bottom: 100,
    right: 50,
    fontSize: 20,
    fontWeight: 500,
    fontFamily: theme.typography.headerStyle.fontFamily,
    color: theme.palette.text.primary,
    zIndex: 2,
    transition: 'opacity 0.3s ease-out',
  },
  mapGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    background: `radial-gradient(ellipse at top, transparent 50%, ${theme.palette.background.default} 100%)`,
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
    console.error('Error getting IP coordinates:', error);
    return null;
  }
};

export default function PetrovDayStory() {
  const classes = useStyles(styles);
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scrollOpacity, setScrollOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress relative to 100vh (0 to 1)
      const scrollProgress = Math.min(scrollTop / windowHeight, 1);
      
      // Map, title, subtitle fade out completely by 100vh (1 to 0)
      const fadeOutOpacity = 1 - scrollProgress;
      
      setScrollOpacity(fadeOutOpacity);
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

    initializeMap();
  }, []);

  if (isLoading) {
    return <div className={classes.root}>
      <div className={classes.mapGradient} style={{ opacity: scrollOpacity }}/>
      <div className={classes.mapGradientRight} style={{ opacity: scrollOpacity }}/>
    </div>;
  }

  return <div className={classes.root}>
    <div className={classes.mapGradient}/>
    <div className={classes.mapGradientRight} />
    <div className={classes.mapContainer} style={{ opacity: scrollOpacity }}>
      <h1 className={classes.title} style={{ opacity: scrollOpacity }}>Petrov Day</h1>
      <h3 className={classes.subtitle} style={{ opacity: scrollOpacity }}>
        Host a Petrov Day ceremony for your community.
      </h3>
      <WrappedReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        onViewportChange={setViewport}
        scrollZoom={false}
      />
    </div>
    <img 
      src="https://cdn.midjourney.com/86fb466b-6069-4355-a96d-2b5e527efb0f/0_0.png" 
      alt="Petrov Day" 
      className={classes.petrovDayImage}
      style={{ opacity: 1 - scrollOpacity }}
    />
  </div>;
}

registerComponent('PetrovDayStory', PetrovDayStory)
