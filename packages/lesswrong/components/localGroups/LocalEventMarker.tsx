import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Marker as BadlyTypedMarker } from 'react-map-gl';
import { ArrowSVG } from './Icons';
import RoomIcon from '@/lib/vendor/@material-ui/icons/src/Room';
import { isEAForum } from '../../lib/instanceSettings';
import { componentWithChildren } from '../../lib/utils/componentsWithChildren';
import GroupLinks from "./GroupLinks";
import StyledMapPopup from "./StyledMapPopup";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const Marker = componentWithChildren(BadlyTypedMarker);

const styles = defineStyles("LocalEventMarker", (theme: ThemeType) => ({
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
}));

const LocalEventMarker = ({ event, handleMarkerClick, handleInfoWindowClose, infoOpen, location }: {
  event: PostsList,
  handleMarkerClick: (eventId: string) => void,
  handleInfoWindowClose: (eventId: string) => void,
  infoOpen: boolean,
  location: any,
}) => {
  const classes = useStyles(styles);
  if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
  const { geometry: {location: {lat, lng}}} = location
  const { htmlHighlight = "" } = event.contents || {}
  const htmlBody = {__html: htmlHighlight};

  const eventIcon = isEAForum()
    ? <RoomIcon className={classes.eaIcon}/>
    : <ArrowSVG className={classes.icon}/>;

  return <React.Fragment>
    <Marker
      latitude={lat}
      longitude={lng}
      offsetLeft={-7}
      offsetTop={-25}
    >
      <span onClick={() => handleMarkerClick(event._id)}>
        {eventIcon}
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

export default LocalEventMarker;



