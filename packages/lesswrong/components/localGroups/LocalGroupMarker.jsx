import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { groupGoogleIcon } from './Icons'


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
      icon={groupGoogleIcon}
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
