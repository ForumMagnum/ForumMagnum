import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { GroupIconSVG } from './Icons'
import { Marker } from 'react-map-gl';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  icon: {
    height: 15, 
    width: 15,
    fill: "#588f27",
    opacity: 0.8
  }
})


const LocalGroupMarker = ({ group, handleMarkerClick, handleInfoWindowClose, infoOpen, location, classes }) => {
  if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
  const { geometry: {location: {lat, lng}}} = location

  const { html = "" } = group.contents || {}
  const { StyledMapPopup, GroupLinks } = Components
  const htmlBody = {__html: html};

  return <React.Fragment>
    <Marker
      latitude={lat}
      longitude={lng}
      offsetLeft={-8}
      offsetTop={-15}
    >
      <span onClick={() => handleMarkerClick(group._id)}>
        <GroupIconSVG className={classes.icon}/>
      </span>
    </Marker>
    {infoOpen && 
      <StyledMapPopup
        lat={lat}
        lng={lng}
        link={`/groups/${group._id}`}
        title={` [Group] ${group.name}`}
        metaInfo={group.contactInfo}
        cornerLinks={<GroupLinks document={group}/>}
        onClose={() => handleInfoWindowClose(group._id)}
      >
        <div dangerouslySetInnerHTML={htmlBody} />
      </StyledMapPopup>}
  </React.Fragment>
}

LocalGroupMarker.propTypes = {
  group: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
}

registerComponent("LocalGroupMarker", LocalGroupMarker, withStyles(styles, {name: "LocalGroupMarker"}));
