import React, { ReactNode } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Popup as BadlyTypedPopup } from 'react-map-gl';
import { componentWithChildren } from '../../lib/utils/componentsWithChildren';

const Popup = componentWithChildren(BadlyTypedPopup);

// Shared with LocalEventMarker
export const styles = (theme: ThemeType) => ({
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
    overflowY: 'auto',
    wordBreak: 'break-word',
    // Nicer scrollbar
    '&::-webkit-scrollbar': {
      width: '2px'
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.grey[400],
      borderRadius: '2px',
      '&:hover': {
        background: theme.palette.grey[600]
      }
    },
    scrollbarWidth: 'thin', // Firefox
    scrollbarColor: `${theme.palette.grey[400]} transparent` // Firefox
    
  },
  contactInfo: {
    marginBottom: "10px",
    marginTop: "10px",
    fontWeight: theme.isEAForum ? 450 : 400,
    color: theme.palette.text.dim60,
  },
  markerPageLink: {
    fontWeight: theme.isEAForum ? 450 : 400,
    color: theme.palette.link.dim3,
    flex: 'none'
  },
  linksWrapper: {
    display: 'flex',
    justifyContent: 'space-between'
  },
});

const StyledMapPopup = ({
  children, classes, link, title,
  metaInfo, cornerLinks, lat, lng,
  onClose, offsetTop=-20, offsetLeft, hideBottomLinks
}: {
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
  link: string,
  title: string|ReactNode,
  metaInfo?: any,
  cornerLinks?: any,
  lat: number,
  lng: number,
  onClose: any,
  offsetTop?: number,
  offsetLeft?: number,
  hideBottomLinks?: boolean
}) => {
  return <Popup
    latitude={lat}
    longitude={lng}
    closeButton={true}
    closeOnClick={false}
    offsetTop={offsetTop}
    offsetLeft={offsetLeft}
    onClose={onClose}
    captureClick
    captureScroll
    anchor="bottom" >
      <div className={classes.root}>
        <Link to={link}><h5 className={classes.groupMarkerName}> {title} </h5></Link>
        <div className={classes.markerBody}>{children}</div>
        {metaInfo && <div className={classes.contactInfo}>{metaInfo}</div>}
        {!hideBottomLinks && <div className={classes.linksWrapper}>
          <Link className={classes.markerPageLink} to={link}> Full link </Link>
          <div>{cornerLinks}</div>
        </div>}
      </div>
  </Popup>
}

export default registerComponent("StyledMapPopup", StyledMapPopup, {styles});



