import React from 'react';
import { Components, getSiteUrl, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useTimezone } from '../../components/common/withTimezone';

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 40
  },
  headingSection: {
    fontFamily: "Arial, sans-serif",
    color: theme.palette.text.normal,
    marginBottom: 40
  },
  heading: {
    fontSize: 28,
    fontWeight: "normal",
    marginBottom: 0
  },
  headingLink: {
    color: theme.palette.primary.main,
    textDecoration: "none",
  },
  groupName: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 12,
  },
  label: {
    color: theme.palette.text.dim,
    fontSize: 14,
    marginBottom: 3
  },
  data: {
    fontSize: 18,
  }
});

const EventUpdatedEmail = ({postId, classes}: {
  postId: string,
  classes: any,
}) => {
  const { document: post, loading } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsBase",
  });
  const { timezone, timezoneIsKnown } = useTimezone()
  
  if (loading || !post) return null;

  const { PrettyEventDateTime } = Components;
  
  const link = postGetPageUrl(post, true);
  
  // event location - for online events, attempt to show the meeting link
  let eventLocation: string|JSX.Element = post.location
  if (post.onlineEvent) {
    eventLocation = post.joinEventLink ? <a
      className={classes.onlineEventLocation}
      href={post.joinEventLink}
      target="_blank" rel="noopener noreferrer">
        {post.joinEventLink}
    </a> : "Online event"
  }
    
  return <div className={classes.root}>
    <div className={classes.headingSection}>
      <h1 className={classes.heading}>
        <a href={link} className={classes.headingLink}>{post.title}</a> has been updated
      </h1>
      {post.group && <p className={classes.groupName}>
        Posted in <a href={`${getSiteUrl().slice(0,-1)}/groups/${post.group._id}`} className={classes.headingLink}>{post.group.name}</a>
      </p>}
    </div>
    <p>
      <div className={classes.label}>Date and Time</div>
      <div className={classes.data}><PrettyEventDateTime post={post} timezone={timezoneIsKnown ? timezone : undefined} /></div>
    </p>
    <p>
      <div className={classes.label}>Location</div>
      <div className={classes.data}>{eventLocation}</div>
    </p>
  </div>
}

const EventUpdatedEmailComponent = registerComponent("EventUpdatedEmail", EventUpdatedEmail, {styles});

declare global {
  interface ComponentTypes {
    EventUpdatedEmail: typeof EventUpdatedEmailComponent
  }
}
