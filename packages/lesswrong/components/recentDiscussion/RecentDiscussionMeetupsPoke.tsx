import React, {useState, useRef} from 'react';
import { useMessages } from '../common/withMessages';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary'
import { useGoogleMaps, geoSuggestStyles } from '../form-components/LocationFormComponent'
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import Geosuggest from 'react-geosuggest';
import { pickBestReverseGeocodingResult } from '../../lib/geocoding';
import { Loading } from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
    
    padding: 16,
    ...theme.typography.body2,
    
    border: `1px solid ${theme.palette.grey["A200"]}`,
    borderRadius: 10,
    boxShadow: theme.palette.boxShadow.recentDiscussionMeetupsPoke,
    
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 500,
  },
  
  locationInputWrapper: {
    display: "flex",
  },
  locationInput: {
    display: "inline-block",
    borderBottom: `1px solid ${theme.palette.text.normal}`,
    flexGrow: 1,
    marginTop: 40,
    marginBottom: 40,
    position: "relative",
    
    ...geoSuggestStyles(theme),
  },
  
  geolocateButton: {
  },
  
  checkbox: {
    padding: 4,
  },
  
  radiusInput: {
    maxWidth: 35,
  },
  
  buttons: {
    marginTop: 16,
    textAlign: "right",
  },
});

const RecentDiscussionMeetupsPokeInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [mapsLoaded, googleMaps] = useGoogleMaps()
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [label, setLabel] = useState<any>(null)
  const [location, setLocation] = useState<any>(null);
  const { flash } = useMessages();
  const [hidden, setHidden] = useState(false);
  const [notificationRadius, setNotificationRadius] = useState(30)
  const updateCurrentUser = useUpdateCurrentUser();
  const geosuggestElement = useRef<any>(null);
  const [enableNotificationsChecked, setEnableNotificationsChecked] = useState(true);
  const [locationOnPublicProfileChecked, setLocationOnPublicProfileChecked] = useState(false);
  
  const dontAskAgain = () => {
    setHidden(true);
    void updateCurrentUser({hideMeetupsPoke: true});
  }
  const onSetLocation = (location?: google.maps.GeocoderResult) => {
    setLocation(location);
    
    // Re-apply the two checkboxes
    onSetEnableNotificationsChecked(enableNotificationsChecked);
    onSetLocationOnPublicProfileChecked(locationOnPublicProfileChecked);
  }
  const setPublicProfileLocation = (location?: google.maps.GeocoderResult) => {
    void updateCurrentUser({
      location: location?.formatted_address,
    });
  }
  const clearPublicProfileLocation = () => {
    void updateCurrentUser({
      location: ""
    });
  }
  
  const onSetEnableNotificationsChecked = (checked: boolean) => {
    setEnableNotificationsChecked(checked);
    if (checked) {
      void updateCurrentUser({
        nearbyEventsNotifications: true,
        nearbyEventsNotificationsLocation: location,
        nearbyEventsNotificationsRadius: notificationRadius,
      });
    } else {
      void updateCurrentUser({
        nearbyEventsNotifications: false,
        nearbyEventsNotificationsLocation: null,
        nearbyEventsNotificationsRadius: null,
      });
    }
  }
  const onSetLocationOnPublicProfileChecked = (checked: boolean) => {
    setLocationOnPublicProfileChecked(checked);
    if (checked) {
      setPublicProfileLocation(location);
    } else {
      clearPublicProfileLocation();
    }
  }
  const requestGeolocation = () => {
    setGeolocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          if(position?.coords) {
            const geocoder = new googleMaps.Geocoder();
            const geocodingResponse = await geocoder.geocode({
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
            });
            const geocoderResults = geocodingResponse?.results;
            if (geocoderResults?.length > 0) {
              const bestResult = pickBestReverseGeocodingResult(geocoderResults);
              if (geosuggestElement.current) {
                geosuggestElement.current!.update(bestResult.formatted_address);
              }
              onSetLocation(bestResult)
            }
          }
        } finally {
          setGeolocationLoading(false);
        }
      },
      (err) => {
        setGeolocationLoading(false);
      }
    );
  }
  const changeNotificationRadius = (radius: string) => {
    const radiusNumber = parseFloat(radius);
    if (!isNaN(radiusNumber)) {
      setNotificationRadius(radiusNumber);
      void updateCurrentUser({ nearbyEventsNotificationsRadius: radiusNumber });
    }
  }
  
  if (hidden)
    return null;
  
  return <div className={classes.root}>
    <div>Did you know that there are LessWrong meetups? To get email notification
    of meetups near you, enter your location:</div>
    
    <div className={classes.locationInputWrapper}>
      {mapsLoaded ? <Geosuggest
        ref={geosuggestElement}
        placeholder="My Location"
        className={classes.locationInput}
        onSuggestSelect={(suggestion) => {
          onSetLocation(suggestion?.gmaps)
          setLabel(suggestion?.label)
        }}
        initialValue={label}
      /> : <Loading/>}
      
      {geolocationLoading
        ? <Loading/>
        : <Button className={classes.geolocateButton} onClick={requestGeolocation}>Geolocate</Button>
      }
    </div>
    
    <div>
      <Checkbox className={classes.checkbox}
        checked={enableNotificationsChecked}
        onChange={(ev) => onSetEnableNotificationsChecked(ev.target.checked)}
      />
      Notify me of events within{" "}
      <Input type="number" className={classes.radiusInput} value={notificationRadius} onChange={(ev) => changeNotificationRadius(ev.target.value)}/>
      {" "}miles
    </div>
    <div>
      <Checkbox className={classes.checkbox}
        checked={locationOnPublicProfileChecked}
        onChange={(e) => onSetLocationOnPublicProfileChecked(e.target.checked)}
      />
      Show this location on my public profile
    </div>
    
    <div className={classes.buttons}>
      <Button onClick={() => setHidden(true)}>Maybe Later</Button>
      <Button onClick={() => dontAskAgain()}>Don't Ask Again</Button>
    </div>
  </div>
}

export const RecentDiscussionMeetupsPoke = registerComponent(
  'RecentDiscussionMeetupsPoke', RecentDiscussionMeetupsPokeInner, {
    styles,
    hocs: [withErrorBoundary],
  }
);

declare global {
  interface ComponentTypes {
    RecentDiscussionMeetupsPoke: typeof RecentDiscussionMeetupsPoke,
  }
}
