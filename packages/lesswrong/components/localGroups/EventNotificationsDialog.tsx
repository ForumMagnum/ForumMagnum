import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from '../common/withUser';
import Geosuggest from 'react-geosuggest';
// These imports need to be separate to satisfy eslint, for some reason
import type { Suggest } from 'react-geosuggest';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slider from '@material-ui/lab/Slider';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormLabel from '@material-ui/core/FormLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { geoSuggestStyles, useGoogleMaps } from '../form-components/LocationFormComponent'
import { MAX_NOTIFICATION_RADIUS } from '../../lib/collections/users/schema'
import { forumTypeSetting } from '../../lib/instanceSettings';
import deepmerge from 'deepmerge';
import InputLabel from '@material-ui/core/InputLabel';


const suggestionToGoogleMapsLocation = (suggestion: Suggest) => {
  return suggestion ? suggestion.gmaps : null
}

export const sharedStyles = (theme: ThemeType): JssStyles => ({
  removeButton: {
    color: theme.palette.error.main,
    marginRight: 'auto',
    marginLeft: -4
  },
  submitButton: {
    color: theme.palette.secondary.main,
    textTransform: 'uppercase'
  },
  actions: {
    ...theme.typography.commentStyle,
    marginTop: 24
  },
  geoSuggest: {
    marginTop: 16, 
    marginBottom: 16,
    width: 400,
    maxWidth: '100%',
    ...deepmerge(geoSuggestStyles(theme), {
      "& .geosuggest__suggests": {
        ...theme.typography.commentStyle,
      },
      "& .geosuggest__input": {
        padding: ".5em 1em 0.5em 0em !important",
        width: '100%',
        fontSize: 13,
      },
    }),
  },
})

const styles = (theme: ThemeType): JssStyles => ({
  ...sharedStyles(theme),
  distanceSection: {
    marginTop: 30,
    display: 'flex'
  },
  input: {
    marginLeft: '5%',
    position: 'relative',
    top: -12
  },
  slider: {
    width: '80%',
  },
  inputAdornment: {
    marginLeft: 0,
  },
  distanceHeader: {
    marginTop: 20
  },
  peopleThreshold: {
    display: 'flex'
  },
  peopleThresholdText: {
    alignSelf: 'center',
    position: 'relative',
    top: 2,
    color: theme.palette.text.normal,
    cursor: 'pointer',
  },
  peopleInput: {
    width: 20
  },
  peopleThresholdCheckbox: {
    marginLeft: -12
  }
})

const MAX_NOTIFICATION_RADIUS_STEPSIZE = 5
const EventNotificationsDialog = ({ onClose, classes }: {
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { Loading, Typography, LWDialog } = Components
  const { nearbyEventsNotificationsLocation, mapLocation, googleLocation, nearbyEventsNotificationsRadius, nearbyPeopleNotificationThreshold } = currentUser || {}

  const [ mapsLoaded ] = useGoogleMaps()
  const [ location, setLocation ] = useState(nearbyEventsNotificationsLocation || mapLocation || googleLocation)
  const [ label, setLabel ] = useState(nearbyEventsNotificationsLocation?.formatted_address || mapLocation?.formatted_address || googleLocation?.formatted_address)
  const [ distance, setDistance ] = useState(nearbyEventsNotificationsRadius || 50)
  const [ notifyPeopleThreshold, setNotifyPeopleThreshold ] = useState(nearbyPeopleNotificationThreshold || 10)
  const [ notifyPeopleCheckboxState, setNotifyPeopleCheckboxState ] = useState(!!nearbyPeopleNotificationThreshold)
  
  const updateCurrentUser = useUpdateCurrentUser()

  const peopleThresholdInput = <Input
    className={classes.peopleInput}
    value={notifyPeopleThreshold}
    margin="dense"
    onChange={(e) => setNotifyPeopleThreshold(parseFloat(e.target.value))}
  />

  const isEAForum = forumTypeSetting.get() === 'EAForum';
  
  return (
    <LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        {currentUser?.nearbyEventsNotifications ? 'Edit Notifications' : 'Sign up for Notifications'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          <p>
            Notify me of events and new groups in this location
          </p>
        </Typography>
        <div className={classes.geoSuggest}>
          {mapsLoaded ? <Geosuggest
            placeholder="Location"
            onSuggestSelect={(suggestion) => { 
              setLocation(suggestionToGoogleMapsLocation(suggestion))
              setLabel(suggestion?.label)
            }}
            initialValue={label}
          /> : <Loading/>}
          
        </div>
        <FormLabel className={classes.distanceHeader} component={"legend" as any}>Notification Radius</FormLabel>
        <div className={classes.distanceSection}>
          <Slider
            className={classes.slider}
            value={distance}
            step={MAX_NOTIFICATION_RADIUS_STEPSIZE}
            min={0}
            max={MAX_NOTIFICATION_RADIUS}
            onChange={(e, value) => setDistance(value)}
            aria-labelledby="input-slider"
          />
          <Input
            className={classes.input}
            value={distance}
            margin="dense"
            onChange={(e) => setDistance(parseFloat(e.target.value))}
            endAdornment={<InputAdornment disableTypography className={classes.inputAdornment} position="end">km</InputAdornment>}
            onBlur={() => setDistance(distance > MAX_NOTIFICATION_RADIUS ? MAX_NOTIFICATION_RADIUS : (distance < 0 ? 0 : distance))}
            inputProps={{
              step: MAX_NOTIFICATION_RADIUS_STEPSIZE,
              min: 0,
              max: MAX_NOTIFICATION_RADIUS,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </div>
        {!isEAForum && <div className={classes.peopleThreshold}>
          <InputLabel className={classes.peopleThresholdText}>
            <Checkbox
              className={classes.peopleThresholdCheckbox}
              checked={notifyPeopleCheckboxState}
              onChange={(e) => setNotifyPeopleCheckboxState(!!e.target.checked)}
            />
            Notify me when there are {peopleThresholdInput} or more people in my area
          </InputLabel>
        </div>}
        <DialogActions className={classes.actions}>
          {currentUser?.nearbyEventsNotifications && <a className={classes.removeButton} onClick={()=>{
            void updateCurrentUser({
              nearbyEventsNotifications: false,
              nearbyEventsNotificationsLocation: null, 
              nearbyEventsNotificationsRadius: null, 
              nearbyPeopleNotificationThreshold: null,
            })
            onClose()
          }}>
            Stop notifying me
          </a>}
          <a className={classes.submitButton} onClick={()=>{
            void updateCurrentUser({
              nearbyEventsNotifications: true,
              nearbyEventsNotificationsLocation: location, 
              nearbyEventsNotificationsRadius: distance, 
              nearbyPeopleNotificationThreshold: notifyPeopleCheckboxState ? notifyPeopleThreshold : null,
            })
            onClose()
          }}>
            Submit
          </a>
        </DialogActions>
      </DialogContent>
    </LWDialog>
  )
}

const EventNotificationsDialogComponent = registerComponent('EventNotificationsDialog', EventNotificationsDialog, {styles});

declare global {
  interface ComponentTypes {
    EventNotificationsDialog: typeof EventNotificationsDialogComponent
  }
}

