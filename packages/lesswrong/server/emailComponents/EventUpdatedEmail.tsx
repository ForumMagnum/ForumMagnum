import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useTimezone } from '../../components/common/withTimezone';
import { getSiteUrl } from "../../lib/vulcan-lib/utils";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import PrettyEventDateTime from '@/components/events/modules/PrettyEventDateTime';

const PostsBaseQuery = gql(`
  query EventUpdatedEmail($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsBase
      }
    }
  }
`);

const styles = defineStyles("EventUpdatedEmail", (theme: ThemeType) => ({
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
  },
  onlineEventLocation: {},
}));

export const EventUpdatedEmail = ({postId}: {
  postId: string,
}) => {
  const classes = useStyles(styles);
  const { loading, data } = useQuery(PostsBaseQuery, {
    variables: { documentId: postId },
  });
  const post = data?.post?.result;
  const { timezone, timezoneIsKnown } = useTimezone()
  
  if (loading || !post) return null;
  
  const link = postGetPageUrl(post, true);
  
  // event location - for online events, attempt to show the meeting link
  let eventLocation: string|React.JSX.Element = post.location ?? ""
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
