import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Marker as BadlyTypedMarker } from 'react-map-gl';
import { ArrowSVG } from './Icons';
import RoomIcon from '@/lib/vendor/@material-ui/icons/src/Room';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { componentWithChildren } from '../../lib/utils/componentsWithChildren';

const Marker = componentWithChildren(BadlyTypedMarker);

const styles = (theme: ThemeType) => ({
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
});

const LocalEventMarkerInner = ({ event, handleMarkerClick, handleInfoWindowClose, infoOpen, location, classes }: {
  event: PostsList,
  handleMarkerClick: (eventId: string) => void,
  handleInfoWindowClose: (eventId: string) => void,
  infoOpen: boolean,
  location: any,
  classes: ClassesType<typeof styles>,
}) => {
  if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
  const { geometry: {location: {lat, lng}}} = location
  const { htmlHighlight = "" } = event.contents || {}
  const { GroupLinks, StyledMapPopup } = Components
  
  const htmlBody = {__html: htmlHighlight};

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
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

export const LocalEventMarker = registerComponent("LocalEventMarker", LocalEventMarkerInner, {styles});

declare global {
  interface ComponentTypes {
    LocalEventMarker: typeof LocalEventMarker
  }
}

