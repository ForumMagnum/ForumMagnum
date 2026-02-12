import React from 'react';
import { GroupIconSVG } from './Icons'
import { Marker as BadlyTypedMarker } from 'react-map-gl';
import { isEAForum } from '../../lib/instanceSettings';
import { componentWithChildren } from '../../lib/utils/componentsWithChildren';
import ForumIcon from "../common/ForumIcon";
import StyledMapPopup from "./StyledMapPopup";
import GroupLinks from "./GroupLinks";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const Marker = componentWithChildren(BadlyTypedMarker);

const styles = defineStyles("LocalGroupMarker", (theme: ThemeType) => ({
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
}));

const LocalGroupMarker = ({ group, handleMarkerClick, handleInfoWindowClose, infoOpen, location }: {
  group: any,
  handleMarkerClick: any,
  handleInfoWindowClose: any,
  infoOpen: boolean,
  location: any,
}) => {
  const classes = useStyles(styles);
  if (!location?.geometry?.location?.lat || !location?.geometry?.location?.lng) return null
  const { geometry: {location: {lat, lng}}} = location

  const { html = "" } = group.contents || {}
  const htmlBody = {__html: html};

  const groupIcon = isEAForum()
    ? <ForumIcon icon="Star" className={classes.eaIcon}/>
    : <GroupIconSVG className={classes.icon}/>;

  return <React.Fragment>
    <Marker
      latitude={lat}
      longitude={lng}
      offsetLeft={-8}
      offsetTop={-15}
    >
      <span onClick={() => handleMarkerClick(group._id)}>
        {groupIcon}
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

export default LocalGroupMarker;
