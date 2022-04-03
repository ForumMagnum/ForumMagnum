import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import moment from '../../../lib/moment-timezone';
import { useTracking } from "../../../lib/analyticsEvents";
import Add from '@material-ui/icons/Add';
import AddToCalendar from '@culturehq/add-to-calendar';
import { useSingle } from '../../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  plusIcon: {
    position: 'absolute',
    top: 11,
    left: 11,
    height: 10,
    width: 10,
    backgroundColor: theme.palette.icon.onTooltip,
  },
  label: {
    marginLeft: 3
  },
  
  // Styles for https://github.com/CultureHQ/add-to-calendar
  // Adapted from their styles.css
  wrapper: {
    "& .chq-atc": {
      display: "inline-block",
      position: "relative",
    },
    
    "& .chq-atc--button": {
      background: "transparent",
      boxSizing: "border-box",
      color: "inherit",
      cursor: "pointer",
      display: "inline",
      fontFamily: "inherit",
      fontSize: "inherit",
      lineHeight: "inherit",
      margin: 0,
      padding: 0,
    },
    
    "& .chq-atc--button:hover": {
      opacity: 0.5
    },
    
    "& .chq-atc--button svg": {
      verticalAlign: "text-bottom",
      fill: "currentColor",
    },
    
    "& .chq-atc--dropdown": {
      backgroundColor: "white",
      borderRadius: 4,
      border: "1px solid #eaeaea",
      boxShadow: "rgb(0 0 0 / 20%) 0px 2px 1px -1px, rgb(0 0 0 / 14%) 0px 1px 1px 0px, rgb(0 0 0 / 12%) 0px 1px 3px 0px",
      boxSizing: "border-box",
      position: "absolute",
      textAlign: "left",
      whiteSpace: "nowrap",
      zIndex: 3,
    },
    
    "& .chq-atc--dropdown a": {
      color: "#212121",
      display: "block",
      padding: "8px 15px",
      textDecoration: "none",
    },
    
    "& .chq-atc--dropdown a:hover": {
      opacity: 0.5,
    },
  },
})

const AddToCalendarIcon = ({post, label, hideTooltip, hidePlusIcon, classes}: {
  post: PostsList|PostsWithNavigation|PostsWithNavigationAndRevision,
  label?: string,
  hideTooltip?: boolean,
  hidePlusIcon?: boolean,
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking();
  
  // we use the Facebook link as the default event details text
  let eventDetails = post.facebookLink;
  // we try to use plaintextDescription instead if possible
  // (only PostsList should be missing the plaintextDescription, so we pull that in)
  const { document: data } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsPlaintextDescription',
    documentId: post._id,
    skip: !post.startTime || !post.contents || ('plaintextDescription' in post.contents)
  });
  
  if (!post.startTime) {
    return null;
  }
  
  if (data) {
    eventDetails = data.contents?.plaintextDescription || eventDetails;
  } else if (post.contents && 'plaintextDescription' in post.contents) {
    eventDetails = post.contents.plaintextDescription || eventDetails;
  }
  
  const endTime = post.endTime ? moment(post.endTime) : moment(post.startTime).add(1, 'hour')
  
  const calendarIconNode = (
    <div onClick={() => captureEvent('addToCalendarClicked')} className={classes.wrapper}>
      <AddToCalendar
        event={{
          name: post.title,
          details: eventDetails,
          location: post.onlineEvent ? post.joinEventLink : post.location,
          startsAt: moment(post.startTime).format(),
          endsAt: endTime.format()
        }}>
          {!hidePlusIcon && <Add className={classes.plusIcon} />}
          {label && (
            <span className={classes.label}>
              {label}
            </span>
          )}
      </AddToCalendar>
    </div>
  );
  
  if (hideTooltip) {
    return calendarIconNode;
  }
  
  return (
    <Components.LWTooltip title="Add to calendar" placement="left">
      {calendarIconNode}
    </Components.LWTooltip>
  )
};

const AddToCalendarIconComponent = registerComponent('AddToCalendarIcon', AddToCalendarIcon, {styles});

declare global {
  interface ComponentTypes {
    AddToCalendarIcon: typeof AddToCalendarIconComponent,
  }
}
