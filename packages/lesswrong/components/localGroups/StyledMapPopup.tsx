import React from 'react';
import { createStyles } from '@material-ui/core/styles';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib';
import { Popup } from 'react-map-gl';

// Shared with LocalEventMarker
export const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    width: 250,
    userSelect: 'text',
    cursor: 'auto'
  },
  groupMarkerName: {
    fontSize: "15px",
    marginTop: "3.5px",
    marginBottom: "0px",
    marginRight: 10
  },
  markerBody: {
    marginTop: 10,
    marginBottom: 10,
    maxHeight: 150,
    overflowY: 'auto'
  },
  contactInfo: {
    marginBottom: "10px",
    marginTop: "10px",
    fontWeight: 400,
    color: "rgba(0,0,0,0.6)",
  },
  markerPageLink: {
    fontWeight: 400,
    color: "rgba(0,0,0,0.4)",
    flex: 'none'
  },
  linksWrapper: {
    display: 'flex',
    justifyContent: 'space-between'
  },
}));

const StyledMapPopup = ({
  children, classes, link, title,
  metaInfo, cornerLinks, lat, lng,
  onClose, offsetTop=-20
}: {
  children?: React.ReactNode,
  classes: ClassesType,
  link: string,
  title: string,
  metaInfo?: any,
  cornerLinks?: any,
  lat: number,
  lng: number,
  onClose: any,
  offsetTop?: number,
}) => {
  return <Popup
    latitude={lat}
    longitude={lng}
    closeButton={true}
    closeOnClick={false}
    offsetTop={offsetTop}
    onClose={onClose}
    captureClick
    captureScroll
    anchor="bottom" >
      <div className={classes.root}>
        <Link to={link}><h5 className={classes.groupMarkerName}> {title} </h5></Link>
        <div className={classes.markerBody}>{children}</div>
        {metaInfo && <div className={classes.contactInfo}>{metaInfo}</div>}
        <div className={classes.linksWrapper}>
          <Link className={classes.markerPageLink} to={link}> Full link </Link>
          <div>{cornerLinks}</div>
        </div>
      </div>
  </Popup>
}

const StyledMapPopupComponent = registerComponent("StyledMapPopup", StyledMapPopup, {styles});

declare global {
  interface ComponentTypes {
    StyledMapPopup: typeof StyledMapPopupComponent
  }
}

