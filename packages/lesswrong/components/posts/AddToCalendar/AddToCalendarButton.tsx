import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React, { useEffect, useState, useRef } from 'react';
import moment from '../../../lib/moment-timezone';
import { useTracking } from "../../../lib/analyticsEvents";
import makeUrls from './makeUrls';
import classNames from 'classnames';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsPlaintextDescriptionQuery = gql(`
  query AddToCalendarButton($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsPlaintextDescription
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    position: 'relative',
    textAlign: 'left'
  },
  button: {
    display: 'inline-flex',
    background: 'transparent',
    color: theme.palette.grey[600],
    font: 'inherit',
    fontSize: isFriendlyUI ? undefined : 14,
    verticalAlign: 'text-bottom',
    '&:hover': {
      opacity: 0.5
    }
  },
  icon: {
    height: isFriendlyUI ? 18 : 16,
    fill: theme.palette.grey[600]
  },
  label: {
    marginLeft: isFriendlyUI ? 7 : 8,
  },
  dropdown: {
    background: theme.palette.panelBackground.default,
    color: theme.palette.grey[700],
    fontFamily: theme.typography.fontFamily,
    padding: '4px 0',
    borderRadius: 4,
    boxShadow: `0 1px 3px ${theme.palette.boxShadowColor(0.2)}`,
  },
  option: {
    display: 'block',
    whiteSpace: 'nowrap',
    padding: '6px 12px',
  }
})

const AddToCalendarIcon = ({className=''}) => {
  return <svg viewBox="207.59 11.407 18.981 20.638" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M 225.59 21.407 L 225.59 15.407 C 225.59 14.307 224.69 13.407 223.59 13.407 L 222.59 13.407 L 222.59 11.407 L 220.59 11.407 L 220.59 13.407 L 212.59 13.407 L 212.59 11.407 L 210.59 11.407 L 210.59 13.407 L 209.59 13.407 C 208.49 13.407 207.59 14.307 207.59 15.407 L 207.59 29.407 C 207.59 30.507 208.49 31.407 209.59 31.407 L 216.59 31.407 L 216.59 29.407 L 209.59 29.407 L 209.59 19.407 L 223.59 19.407 L 223.59 21.407 L 225.59 21.407 Z"/>
    <path d="M 226.571 27.045 L 226.571 29.045 L 223.571 29.045 L 223.571 32.045 L 221.571 32.045 L 221.571 29.045 L 218.571 29.045 L 218.571 27.045 L 221.571 27.045 L 221.571 24.045 L 223.571 24.045 L 223.571 27.045 L 226.571 27.045 Z"/>
  </svg>
}

const AddToCalendarButton = ({post, label, hideTooltip, hideIcon, iconClassName, classes}: {
  post: PostsList|PostsWithNavigation|PostsWithNavigationAndRevision,
  label?: string,
  hideTooltip?: boolean,
  hideIcon?: boolean,
  iconClassName?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  
  // close the dropdown when clicking on the page
  useEffect(() => {
    if (open) {
      const onClose = () => setOpen(false)
      document.addEventListener("click", onClose)
      return () => document.removeEventListener("click", onClose)
    }
  }, [open, setOpen])
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!open) {
      captureEvent('addToCalendarClicked')
    }
    setOpen(!open)
  }
  
  const { LWPopper } = Components
  
  // we use the Facebook link as the default event details text
  let eventDetails = post.facebookLink;
  // we try to use plaintextDescription instead if possible
  // (only PostsList should be missing the plaintextDescription, so we pull that in)
  const { data: rawData } = useQuery(PostsPlaintextDescriptionQuery, {
    variables: { documentId: post._id },
    skip: !post.startTime || !post.contents || ('plaintextDescription' in post.contents),
  });
  const data = rawData?.post?.result;
  
  if (!post.startTime) {
    return null;
  }
  
  if (data) {
    eventDetails = data.contents?.plaintextDescription || eventDetails;
  } else if (post.contents && 'plaintextDescription' in post.contents) {
    eventDetails = post.contents.plaintextDescription || eventDetails;
  }
  
  const endTime = post.endTime ? moment(post.endTime) : moment(post.startTime).add(1, 'hour')
  
  // build the links for different calendars
  const urls = makeUrls({
    name: post.title,
    details: eventDetails,
    location: post.onlineEvent ? post.joinEventLink : post.location,
    startsAt: moment(post.startTime).format(),
    endsAt: endTime.format()
  })
  
  const calendarIconNode = (
    <div className={classes.root}>
      <button ref={buttonRef} className={classes.button} onClick={handleClick}>
        {!hideIcon && <AddToCalendarIcon className={classNames(classes.icon, iconClassName)} />}
        {label && (
          <span className={classes.label}>
            {label}
          </span>
        )}
      </button>
      <LWPopper open={open} anchorEl={buttonRef.current} placement="bottom-start">
        <div className={classes.dropdown}>
          <a href={urls.google} target="_blank" rel="noopener noreferrer" className={classes.option}>
            Google
          </a>
          <a download="download" href={urls.ics} className={classes.option}>
            Apple Calendar
          </a>
          <a download="download" href={urls.ics} className={classes.option}>
            Outlook
          </a>
          <a href={urls.outlook} target="_blank" rel="noopener noreferrer" className={classes.option}>
            Outlook Web App
          </a>
        </div>
      </LWPopper>
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

const AddToCalendarButtonComponent = registerComponent('AddToCalendarButton', AddToCalendarButton, {styles});

declare global {
  interface ComponentTypes {
    AddToCalendarButton: typeof AddToCalendarButtonComponent,
  }
}
