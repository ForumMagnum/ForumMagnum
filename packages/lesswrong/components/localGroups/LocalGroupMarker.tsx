import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { GroupIconSVG } from './Icons'
import { Marker as BadlyTypedMarker } from 'react-map-gl';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { componentWithChildren } from '../../lib/utils/componentsWithChildren';

const Marker = componentWithChildren(BadlyTypedMarker);

const styles = (theme: ThemeType) => ({
  icon: {
    height: 15, 
    width: 15,
    fill: theme.palette.group,
    opacity: 0.8
  },
  eaIcon: {
    width: 20,
    height: 20,
    fill: theme.palette.group,
    opacity: 0.8,
  },
});

const LocalGroupMarker = ({ group, handleMarkerClick, handleInfoWindowClose, infoOpen, location, classes }: {
  group: any,
  handleMarkerClick: any,
  handleInfoWindowClose: any,
  infoOpen: boolean,
  location: any,
  classes: ClassesType<typeof styles>,
}) => {
  if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
  const { geometry: {location: {lat, lng}}} = location

  const { html = "" } = group.contents || {}
  const { StyledMapPopup, GroupLinks } = Components
  const htmlBody = {__html: html};

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const GroupIcon = () => forumTypeSetting.get() === 'EAForum'
    ? <Components.ForumIcon icon="Star" className={classes.eaIcon}/>
    : <GroupIconSVG className={classes.icon}/>;

  return <React.Fragment>
    <Marker
      latitude={lat}
      longitude={lng}
      offsetLeft={-8}
      offsetTop={-15}
    >
      <span onClick={() => handleMarkerClick(group._id)}>
        <GroupIcon/>
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

const LocalGroupMarkerComponent = registerComponent("LocalGroupMarker", LocalGroupMarker, {styles});

declare global {
  interface ComponentTypes {
    LocalGroupMarker: typeof LocalGroupMarkerComponent
  }
}

