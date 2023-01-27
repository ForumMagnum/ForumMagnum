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
import { createStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { sharedStyles } from './EventNotificationsDialog'
import { useGoogleMaps } from '../form-components/LocationFormComponent'
import { forumTypeSetting } from '../../lib/instanceSettings';

const suggestionToGoogleMapsLocation = (suggestion: Suggest) => {
  return suggestion ? suggestion.gmaps : null
}

const styles = createStyles((theme: ThemeType): JssStyles => ({
  ...sharedStyles(theme),
}))

const SetPersonalMapLocationDialog = ({ onClose, classes }: {
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { mapLocation, googleLocation, } = currentUser || {}
  const { Loading, Typography, LWDialog } = Components
  
  const [ mapsLoaded ] = useGoogleMaps()
  const [ location, setLocation ] = useState(mapLocation || googleLocation)
  const [ label, setLabel ] = useState(mapLocation?.formatted_address || googleLocation?.formatted_address)
  
  const defaultMapMarkerText = currentUser?.mapMarkerText || currentUser?.biography?.markdown || "";
  const [ mapText, setMapText ] = useState(defaultMapMarkerText)
  
  const updateCurrentUser = useUpdateCurrentUser()
  
  if (!currentUser)
    return null;
    
  const isEAForum = forumTypeSetting.get() === 'EAForum';

  return (
    <LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        Add your location to the map
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
            This information will be publicly visible
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
        {!isEAForum && <TextField
            label={`Description (Make sure to mention whether you want to organize events)}`}
            className={classes.modalTextField}
            value={mapText}
            onChange={e => setMapText(e.target.value)}
            fullWidth
            multiline
            rows={4}
            rowsMax={100}
          />}
        <DialogActions className={classes.actions}>
          {currentUser.mapLocation && <a className={classes.removeButton} onClick={()=>{
            void updateCurrentUser({mapLocation: null})
            onClose()
          }}>
            Remove me from the map
          </a>}
          <a className={classes.submitButton} onClick={()=>{
            void updateCurrentUser({mapLocation: location, mapMarkerText: mapText})
            onClose()
          }}>
            Submit
          </a>
        </DialogActions>
      </DialogContent>
    </LWDialog>
  )
}

const SetPersonalMapLocationDialogComponent = registerComponent('SetPersonalMapLocationDialog', SetPersonalMapLocationDialog, {styles});

declare global {
  interface ComponentTypes {
    SetPersonalMapLocationDialog: typeof SetPersonalMapLocationDialogComponent
  }
}

