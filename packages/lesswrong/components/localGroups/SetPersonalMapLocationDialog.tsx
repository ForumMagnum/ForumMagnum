import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from '../common/withUser';
import Geosuggest from 'react-geosuggest';
// These imports need to be separate to satisfy eslint, for some reason
import type { Suggest } from 'react-geosuggest';
import { DialogContent } from "@/components/widgets/DialogContent";
import { DialogActions } from '../widgets/DialogActions';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import { sharedStyles } from './EventNotificationsDialog'
import { useGoogleMaps } from '../form-components/LocationFormComponent'
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useSingle } from '../../lib/crud/withSingle';
import { Loading } from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import { LWDialog } from "../common/LWDialog";

const suggestionToGoogleMapsLocation = (suggestion: Suggest) => {
  return suggestion ? suggestion.gmaps : null
}

const styles = (theme: ThemeType) => ({
  ...sharedStyles(theme),
});

const SetPersonalMapLocationDialogInner = ({ onClose, classes }: {
  onClose: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { document: currentUserWithMarkdownBio, loading } = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersEdit",
    skip: !currentUser,
  });
  const { mapLocation, googleLocation, } = currentUser || {}
  const [ mapsLoaded ] = useGoogleMaps()
  const [ location, setLocation ] = useState(mapLocation || googleLocation)
  const [ label, setLabel ] = useState(mapLocation?.formatted_address || googleLocation?.formatted_address)
  
  const [ mapText, setMapText ] = useState<string|null>(null)
  
  useEffect(() => {
    const defaultMapMarkerText = currentUserWithMarkdownBio?.mapMarkerText || currentUserWithMarkdownBio?.biography?.markdown || "";
    if (!mapText && defaultMapMarkerText) {
      setMapText(defaultMapMarkerText);
    }
  }, [loading, currentUserWithMarkdownBio, mapText]);
  
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
            value={mapText || ""}
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

export const SetPersonalMapLocationDialog = registerComponent('SetPersonalMapLocationDialog', SetPersonalMapLocationDialogInner, {styles});



