import React, {useState} from 'react';
import { useMessages } from '../common/withMessages';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import { useGoogleMaps } from '../form-components/LocationFormComponent'
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import Geosuggest from 'react-geosuggest';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    backgroundColor: "rgba(253,253,253)",
    
    padding: 16,
    ...theme.typography.body2,
    
    border: "1px solid #aaa",
    borderRadius: 10,
    boxShadow: "5px 5px 5px rgba(0,0,0,20%)",
    
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 500,
  },
  
  locationInput: {
    display: "inline-block",
    borderBottom: "1px solid rgba(0,0,0,.87)",
    width: 250,
    marginTop: 40,
    marginBottom: 40,
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

const RecentDiscussionMeetupsPoke = ({classes}: {
  classes: ClassesType,
}) => {
  const [mapsLoaded] = useGoogleMaps("SetPersonalMapLocationDialog")
  const [ label, setLabel ] = useState<any>(null)
  const { flash } = useMessages();
  const { Loading } = Components;
  const [hidden, setHidden] = useState(false);
  const [notificationRadius, setNotificationRadius] = useState(30)
  
  const dontAskAgain = () => {
    // TODO: Save this to user dconfig
    setHidden(true);
  }
  const setLocation = (location) => {
    // TODO
  }
  const requestGeolocation = () => {
    // TODO
  }
  const changeNotificationRadius = (radius: number) => {
    // TODO: Save this to user config
    setNotificationRadius(radius);
  }
  
  if (hidden)
    return null;
  
  return <div className={classes.root}>
    <div>Did you know that there are LessWrong meetups? To get email notification
    of meetups near you, enter your location:</div>
    
    <div>
      {mapsLoaded ? <Geosuggest
        placeholder="My Location"
        className={classes.locationInput}
        onSuggestSelect={(suggestion) => {
          setLocation(suggestion?.gmaps) //TODO
          setLabel(suggestion?.label)
        }}
        initialValue={label}
      /> : <Loading/>}
      
      <Button className={classes.geolocateButton} onClick={requestGeolocation}>Geolocate</Button>
    </div>
    
    <div>
      <Checkbox className={classes.checkbox} checked={true} />
      Notify me of events within{" "}
      <Input type="number" className={classes.radiusInput} value={notificationRadius} onChange={(ev) => changeNotificationRadius(ev.target.value)}/>
      {" "}miles
    </div>
    <div><Checkbox className={classes.checkbox} checked={false} /> Show this location on my public profile</div>
    
    <div className={classes.buttons}>
      <Button onClick={() => setHidden(true)}>Maybe Later</Button>
      <Button onClick={() => dontAskAgain()}>Don't Ask Again</Button>
    </div>
  </div>
}

const RecentDiscussionMeetupsPokeComponent = registerComponent(
  'RecentDiscussionMeetupsPoke', RecentDiscussionMeetupsPoke, {
    styles,
    hocs: [withErrorBoundary],
  }
);

declare global {
  interface ComponentTypes {
    RecentDiscussionMeetupsPoke: typeof RecentDiscussionMeetupsPokeComponent,
  }
}
