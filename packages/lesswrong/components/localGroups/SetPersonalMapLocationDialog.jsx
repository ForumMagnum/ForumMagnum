import React, { useState } from 'react';
import { registerComponent, useUpdate } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import Users from "meteor/vulcan:users";
import Dialog from '@material-ui/core/Dialog';
import Geosuggest from 'react-geosuggest';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { geoSuggestStyles } from '../form-components/LocationFormComponent'

const suggestionToGoogleMapsLocation = (suggestion) => {
  return suggestion ? suggestion.gmaps : null
}

const styles = theme => ({
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
    marginTop: 24
  },
  geoSuggest: {
    marginTop: 16, 
    marginBottom: 16,
    width: 400,
    ...geoSuggestStyles(theme),
    "& .geosuggest__suggests": {
      top: "100%",
      left: 0,
      right: 0,
      maxHeight: "25em",
      padding: 0,
      marginTop: -1,
      background: "#fff",
      borderTopWidth: 0,
      overflowX: "hidden",
      overflowY: "auto",
      listStyle: "none",
      zIndex: 5,
      transition: "max-height 0.2s, border 0.2s",
    },
    "& .geosuggest__input": {
      border: "2px solid transparent",
      borderBottom: "1px solid rgba(0,0,0,.87)",
      padding: ".5em 1em 0.5em 0em !important",
      width: '100%',
      fontSize: 13,
      [theme.breakpoints.down('sm')]: {
        width: "100%"
      },
    },
  },
})

const SetPersonalMapLocationDialog = ({ onClose, currentUser, classes }) => {
  const [ location, setLocation ] = useState(currentUser?.mapLocation || currentUser?.googleLocation)
  const [ label, setLabel ] = useState(currentUser?.mapLocation?.formatted_address || currentUser?.googleLocation?.formatted_address)
  const [ mapText, setMapText ] = useState(currentUser?.mapMarkerText || currentUser?.bio)
  const { mutate } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  })

  return (
    <Dialog
      modal={false}
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        Add your location to the map
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
            Is this the location you want to display for yourself on the map?
        </Typography>
        <div className={classes.geoSuggest}>
          <Geosuggest
            placeholder="Location"
            onSuggestSelect={(suggestion) => { 
              setLocation(suggestionToGoogleMapsLocation(suggestion))
              setLabel(suggestion?.label)
            }}
            initialValue={label}
          />
        </div>
        <TextField
            label="Description (Make sure to mention whether you want to organize events)"
            className={classes.modalTextField}
            value={mapText}
            onChange={e => setMapText(e.target.value)}
            fullWidth
            multiline
            rows={4}
            rowsMax={100}
          />
        <DialogActions className={classes.actions}>
          {currentUser?.mapLocation && <a className={classes.removeButton} onClick={()=>{
            mutate({selector: {_id: currentUser._id}, data: {mapLocation: null}})
            onClose()
          }}>
            Remove me from the map
          </a>}
          <a className={classes.submitButton} onClick={()=>{
            mutate({selector: {_id: currentUser._id}, data: {mapLocation: location, mapMarkerText: mapText}})
            onClose()
          }}>
            Submit
          </a>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

registerComponent('SetPersonalMapLocationDialog', SetPersonalMapLocationDialog, withUser, withStyles(styles, {name: "SetPersonalMapLocationDialog"}) );
