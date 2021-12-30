import React from 'react';
import { getSiteUrl, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { postGetPageUrl, prettyEventDateTimes } from '../../lib/collections/posts/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: "Arial, sans-serif",
    marginBottom: 40
  },
  headingSection: {
    color: "rgba(0, 0, 0, 0.87)",
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
    fontStyle: 'italic',
    marginTop: 12
  },
  label: {
    color: "rgba(0,0,0,0.5)",
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
  if (loading || !post) return null;
  
  const link = postGetPageUrl(post, true);
    
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
      <div className={classes.data}>{prettyEventDateTimes(post)}</div>
    </p>
    <p>
      <div className={classes.label}>Location</div>
      <div className={classes.data}>{post.onlineEvent ? 'Online event' : post.location}</div>
    </p>
  </div>
}

const EventUpdatedEmailComponent = registerComponent("EventUpdatedEmail", EventUpdatedEmail, {styles});

declare global {
  interface ComponentTypes {
    EventUpdatedEmail: typeof EventUpdatedEmailComponent
  }
}
