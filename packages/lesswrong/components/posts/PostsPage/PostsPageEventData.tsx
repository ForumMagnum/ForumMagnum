import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import Tooltip from '@material-ui/core/Tooltip';
import LinkIcon from '@material-ui/icons/Link';
import { FacebookIcon, MeetupIcon } from '../../localGroups/GroupLinks';

const styles = (theme: ThemeType): JssStyles => ({
  metadata: {
    marginTop: theme.spacing.unit*2,
    ...theme.typography.postStyle,
    color: 'rgba(0,0,0,0.5)',
  },
  externalLinks: {
    display: 'flex',
    alignItems: 'baseline',
    marginTop: theme.spacing.unit,
  },
  externalLink: {
    marginRight: 20
  },
  facebookIcon: {
    width: "15px",
    height: "15px",
    color: "rgba(0, 0, 0, 0.7)",
  },
  meetupIcon: {
    width: "18px",
    height: "18px",
    color: "rgba(0, 0, 0, 0.7)",
    transform: "translateY(2px)",
  },
  linkIcon: {
    height: "20px",
    width: "20px",
    color: "rgba(0, 0, 0, 0.7)",
    transform: "translateY(3px) rotate(-45deg)",
  },
})

const PostsPageEventData = ({classes, post}: {
  classes: ClassesType,
  post: PostsBase,
}) => {
  const { location, contactInfo, onlineEvent } = post
  
  const locationNode = onlineEvent ? (
    <div className={classes.eventLocation}>Online Event</div>
  ) : (location && <div className={classes.eventLocation}> {location} </div>);
  
  let externalLinks;
  if (post.facebookLink || post.meetupLink || post.website) {
    externalLinks = (
      <div className={classes.externalLinks}>
        {post.facebookLink && (
          <Tooltip
            title="See this event on Facebook"
          >
            <a href={post.facebookLink} className={classes.externalLink}>
              <FacebookIcon className={classes.facebookIcon}/>
            </a>
          </Tooltip>
        )}
        {post.meetupLink && (
          <Tooltip
            title="See this event on Meetup"
          >
            <a href={post.meetupLink} className={classes.externalLink}>
              <MeetupIcon className={classes.meetupIcon}/>
            </a>
          </Tooltip>
        )}
        {post.website && (
          <Tooltip
            title="See this event website"
          >
            <a href={post.website} className={classes.externalLink}>
              <LinkIcon className={classes.linkIcon}/>
            </a>
          </Tooltip>
        )}
      </div>
    )
  }
  
  return <Components.Typography variant="body2" className={classes.metadata}>
      <div className={classes.eventTimes}> <Components.EventTime post={post} dense={false} /> </div>
      { locationNode }
      { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
      { externalLinks }
  </Components.Typography>
}

const PostsPageEventDataComponent = registerComponent('PostsPageEventData', PostsPageEventData, {styles});

declare global {
  interface ComponentTypes {
    PostsPageEventData: typeof PostsPageEventDataComponent
  }
}
