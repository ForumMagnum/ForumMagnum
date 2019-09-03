import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';

const groupIcon = {
  path: "M8.67 -0.98C8.67 -0.98 0.8 -8.68 0.8 -8.68 0.36 -9.11 -0.36 -9.11 -0.8 -8.68 -0.8 -8.68 -8.67 -0.98 -8.67 -0.98 -9.11 -0.55 -9.11 0.15 -8.67 0.58 -8.23 1.01 -7.52 1.01 -7.08 0.58 -7.08 0.58 -6.75 0.26 -6.75 0.26 -6.75 3.12 -6.75 5.55 -6.75 8.6 -6.75 8.6 -2.25 8.6 -2.25 8.6 -2.25 8.6 -2.25 2 -2.25 2 -2.25 2 2.25 2 2.25 2 2.25 2 2.25 8.6 2.25 8.6 2.25 8.6 6.75 8.6 6.75 8.6 6.75 5.55 6.75 3.12 6.75 0.26 6.75 0.26 7.08 0.58 7.08 0.58 7.3 0.79 7.59 0.9 7.88 0.9 8.16 0.9 8.45 0.79 8.67 0.58 9.11 0.15 9.11 -0.55 8.67 -0.98zM-2.95 13.58",
  fillColor: "#588f27",
  fillOpacity: 0.9,
  scale: 1,
  strokeWeight: 1,
  strokeColor: "#FFFFFF",
}

const LocalGroupMarker = ({ group, handleMarkerClick, handleInfoWindowClose, infoOpen, location }) => {
  const { html = "" } = group.contents || {}
  const { StyledMapMarker, GroupLinks } = Components
  const htmlBody = {__html: html};

  return (
    <StyledMapMarker
      location={location}
      handleOpen={() => handleMarkerClick(group._id)}
      handleClose={() => handleInfoWindowClose(group._id)}
      infoOpen={infoOpen}
      icon={groupIcon}
      link={`/groups/${group._id}`}
      title={` [Group] ${group.name}`}
      metaInfo={group.contactInfo}
      cornerLinks={<GroupLinks document={group}/>}
      key={group._id}
    >
      <div dangerouslySetInnerHTML={htmlBody} />
    </StyledMapMarker>
  )
}

LocalGroupMarker.propTypes = {
  group: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
}

registerComponent("LocalGroupMarker", LocalGroupMarker);
