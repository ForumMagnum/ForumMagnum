import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Marker } from 'react-map-gl';
import { createStyles } from '@material-ui/core/styles';
import { ArrowSVG } from './Icons';
import RoomIcon from '@material-ui/icons/Room';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  icon: {
    width: 15, 
    height: 15,
    fill: theme.palette.event,
    opacity: 0.8
  },
  eaIcon: {
    width: 20,
    height: 20,
    fill: theme.palette.event,
    opacity: 0.8,
  },
}))

const LocalEventMarker = ({ event, handleMarkerClick, handleInfoWindowClose, infoOpen, location, classes }: {
  event: PostsList,
  handleMarkerClick: (eventId: string)=>void,
  handleInfoWindowClose: (eventId: string)=>void,
  infoOpen: boolean,
  location: any,
  classes: ClassesType,
}) => {
  if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
  const { geometry: {location: {lat, lng}}} = location
  const { htmlHighlight = "" } = event.contents || {}
  const { GroupLinks, StyledMapPopup } = Components
  
  const htmlBody = {__html: htmlHighlight};

  const EventIcon = () => forumTypeSetting.get() === 'EAForum' ? 
    <RoomIcon className={classes.eaIcon}/> : 
    <ArrowSVG className={classes.icon}/>;

  return <React.Fragment>
    <Marker
      latitude={lat}
      longitude={lng}
      offsetLeft={-7}
      offsetTop={-25}
    >
      <span onClick={() => handleMarkerClick(event._id)}>
        <EventIcon/>
      </span>
    </Marker>
    {infoOpen && 
      <StyledMapPopup
        lat={lat}
        lng={lng}
        link={postGetPageUrl(event)}
        title={` [Event] ${event.title} `}
        metaInfo={event.contactInfo}
        cornerLinks={<GroupLinks document={event}/>}
        onClose={() => handleInfoWindowClose(event._id)}
        offsetTop={-25}
      >
        <div dangerouslySetInnerHTML={htmlBody} />
      </StyledMapPopup>}
  </React.Fragment>
}

const LocalEventMarkerComponent = registerComponent("LocalEventMarker", LocalEventMarker, {styles});

declare global {
  interface ComponentTypes {
    LocalEventMarker: typeof LocalEventMarkerComponent
  }
}

