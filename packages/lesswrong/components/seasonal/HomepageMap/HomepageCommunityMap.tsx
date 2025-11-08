import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useUserLocation } from '@/components/hooks/useUserLocation';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { Marker as BadlyTypedMarker, Popup as BadlyTypedPopup } from 'react-map-gl';
import { defaultCenter } from '../../localGroups/CommunityMap';
import { ArrowSVG } from '../../localGroups/Icons';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { localEvents } from './acxEvents';
import classNames from 'classnames';
import { componentWithChildren } from '../../../lib/utils/componentsWithChildren';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import StyledMapPopup, { StyledMapPopupContent } from "../../localGroups/StyledMapPopup";
import GroupLinks from "../../localGroups/GroupLinks";
import HomepageMapFilter from "./HomepageMapFilter";
import { WrappedReactMapGL } from '@/components/community/WrappedReactMapGL';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react-dom';

const Popup = componentWithChildren(BadlyTypedPopup);

const PostsListQuery = gql(`
  query HomepageCommunityMap($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

const Marker = componentWithChildren(BadlyTypedMarker);

const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    height: 440,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
      marginLeft: -8
    },
    position: "relative",
    boxShadow: theme.palette.boxShadow.default,
    
    "& .mapboxgl-popup-content": {
      background: theme.palette.panelBackground.default,
    },
    "& .StyledMapPopup-markerPageLink": {
      color: theme.palette.text.normal,
    },
  },
  mapButtons: {
    alignItems: "flex-end",
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down('md')]: {
      top: 24
    },
    ...theme.typography.body2
  },
})


const localEventWrapperPopUpStyles = defineStyles("localEventWrapperPopUpStyles", (theme: ThemeType) => ({
  loading: {
    padding: 10,
    margin: -16,
    width: 250,
    height: 250,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: '$pulseBackground 1s ease-in-out infinite',
  },
  '@keyframes pulseBackground': {
    '0%': {
      background: theme.palette.grey[200],
    },
    '50%': {
      background: theme.palette.panelBackground.default,
    },
    '100%': {
      background: theme.palette.grey[200],
    },
  }
}))

export const LocalEventWrapperPopUp = ({localEvent, handleClose}: {
  localEvent: HomepageCommunityEventMarker,
  handleClose: (eventId: string) => void
}) => {
  const classes = useStyles(localEventWrapperPopUpStyles)
  const { loading, data } = useQuery(PostsListQuery, {
    variables: { documentId: localEvent._id },
  });
  const document = data?.post?.result;

  if (loading) return <Popup
    latitude={localEvent.lat}
    longitude={localEvent.lng}
    closeButton={true}
    closeOnClick={false}
    offsetTop={-15}
    offsetLeft={10}
    onClose={() => handleClose(localEvent._id)}
    captureClick
    captureScroll
    anchor="bottom" >
    <div className={classes.loading}></div>
  </Popup>

  if (!document) return null
  const { htmlHighlight = "" } = document.contents || {}
  const htmlBody = {__html: htmlHighlight};

  return <StyledMapPopup
    lat={localEvent.lat}
    lng={localEvent.lng}
    link={postGetPageUrl(document)}
    title={` [Event] ${document.title} `}
    metaInfo={document.contactInfo}
    cornerLinks={<GroupLinks document={document}/>}
    onClose={() => handleClose(document._id)}
    offsetTop={-15}
    offsetLeft={10}
  >
    <div dangerouslySetInnerHTML={htmlBody} />
  </StyledMapPopup>
}

const fixedPositionEventPopupStyles = defineStyles("fixedPositionEventPopupStyles", (theme: ThemeType) => ({
  popupContainer: {
    position: 'fixed',
    zIndex: 1000,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    maxHeight: 400,
    overflowY: 'auto',
    boxShadow: theme.palette.boxShadowColor(0.3),
    padding: 16,
  },
  popupLoading: {
    padding: 10,
    margin: -16,
    width: 250,
    height: 250,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: '$pulseBackground 1s ease-in-out infinite',
  },
  '@keyframes pulseBackground': {
    '0%': {
      background: theme.palette.grey[200],
    },
    '50%': {
      background: theme.palette.panelBackground.default,
    },
    '100%': {
      background: theme.palette.grey[200],
    },
  },
  popupCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: theme.palette.text.dim60,
    lineHeight: 1,
    padding: 4,
    '&:hover': {
      color: theme.palette.text.primary,
    }
  },
}))

export const FixedPositionEventPopup = ({eventId, screenCoords, onClose}: {
  eventId: string;
  screenCoords: { x: number; y: number };
  onClose: () => void;
}) => {
  const fixedPopupClasses = useStyles(fixedPositionEventPopupStyles);
  const { loading, data } = useQuery(PostsListQuery, {
    variables: { documentId: eventId },
  });
  const document = data?.post?.result;

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [
      offset(10), // 10px offset from the marker
      flip(), // Flip to bottom if not enough space on top
      shift({ padding: 8 }), // Shift to keep within viewport with 8px padding
    ],
    whileElementsMounted: (reference, floating, update) => {
      return autoUpdate(reference, floating, update);
    },
  });

  // Set virtual reference element from screen coordinates
  useEffect(() => {
    const virtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: screenCoords.x,
        y: screenCoords.y,
        top: screenCoords.y,
        left: screenCoords.x,
        right: screenCoords.x,
        bottom: screenCoords.y,
      }),
    };
    refs.setReference(virtualElement as any);
  }, [refs, screenCoords.x, screenCoords.y]);

  if (loading) {
    return (
      <div
        ref={refs.setFloating}
        className={fixedPopupClasses.popupContainer}
        style={floatingStyles}
      >
        <div className={fixedPopupClasses.popupLoading}></div>
      </div>
    );
  }

  if (!document) return null;

  const { htmlHighlight = "" } = document.contents || {};
  const htmlBody = {__html: htmlHighlight};

  return (
    <div
      ref={refs.setFloating}
      className={fixedPopupClasses.popupContainer}
      style={floatingStyles}
    >
      <button className={fixedPopupClasses.popupCloseButton} onClick={onClose}>
        ×
      </button>
      <StyledMapPopupContent
        link={postGetPageUrl(document)}
        title={` [Event] ${document.title} `}
        metaInfo={document.contactInfo}
        cornerLinks={<GroupLinks document={document}/>}
      >
        <div dangerouslySetInnerHTML={htmlBody} />
      </StyledMapPopupContent>
    </div>
  );
};

const localEventMapMarkerWrappersStyles = defineStyles("localEventMapMarkerWrappersStyles", (theme: ThemeType) => ({
  icon: {
    height: 20,
    width: 20,
    fill: theme.palette.event,
    opacity: 0.8,
    cursor: "pointer",
    '&:hover': {
      fill: theme.palette.primary.dark,
      opacity: 1
    }
  },
  iconSelected: {
    fill: theme.palette.primary.dark,
    opacity: 1
  }
}))

export const LocalEventMapMarkerWrappersInner = ({localEvents, onMarkerClick}: {
  localEvents: Array<HomepageCommunityEventMarker>,
  onMarkerClick?: () => void,
}) => {
  const classes = useStyles(localEventMapMarkerWrappersStyles)
  const [ openWindows, setOpenWindows ] = useState<string[]>([])
  const handleClickArrow = useCallback(
    (id: string) => { 
      setOpenWindows([id]); 
      if (onMarkerClick) onMarkerClick() 
    }
    , [onMarkerClick]
  )
  const handleClose = useCallback((id: string) => { 
      setOpenWindows(openWindows.filter(windowId => windowId !== id))
    }, [openWindows]
  )

  return <React.Fragment>
    {localEvents.map((localEvent, i) => {
      const infoOpen = openWindows.includes(localEvent._id)
      if (!localEvent.lat || !localEvent.lng) return null
      return <React.Fragment key={`mapEvent${localEvent._id}`}>
      <Marker
        latitude={localEvent.lat}
        longitude={localEvent.lng}
        offsetLeft={-7}
        offsetTop={-25}
      >
        <span onClick={() => handleClickArrow(localEvent._id)}>
          <ArrowSVG className={classNames(classes.icon, {[classes.iconSelected]: infoOpen})}/>
        </span>
      </Marker>
      {infoOpen && <LocalEventWrapperPopUp localEvent={localEvent} handleClose={handleClose}/>}
    </React.Fragment>
    })}
  </React.Fragment>
}

export const LocalEventMapMarkerWrappers = registerComponent("LocalEventMapMarkerWrappers", LocalEventMapMarkerWrappersInner) 


export const HomepageCommunityMap = ({dontAskUserLocation = false, classes}: {
  dontAskUserLocation?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
 
  // this is unused in this component, but for Meetup Month it seems good to force the prompt to enter location.
  useUserLocation(currentUser, dontAskUserLocation)

  const [ viewport, setViewport ] = useState({
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    zoom: 1.1
  })

  const renderedMarkers = useMemo(() => {
    return <>
      <LocalEventMapMarkerWrappers localEvents={localEvents} />
      <div className={classes.mapButtons}>
        <HomepageMapFilter />
      </div>
    </>
  }, [classes.mapButtons])

  return <div className={classes.root}>
    <WrappedReactMapGL
      {...viewport}
      width="100%"
      height="100%"
      onViewportChange={viewport => setViewport(viewport)}
    >
      {renderedMarkers}
    </WrappedReactMapGL>
  </div>;
}

export default registerComponent('HomepageCommunityMap', HomepageCommunityMap, {styles});
