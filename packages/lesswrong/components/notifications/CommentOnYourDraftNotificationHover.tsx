'use client';

import React from 'react';
import {useCurrentUser} from "../common/withUser";
import { NotifPopoverLink } from './useNotificationsPopoverContext';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import UsersName from "../users/UsersName";
import Loading from "../vulcan-core/Loading";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const PostsMinimumInfoQuery = gql(`
  query CommentOnYourDraftNotificationHover($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsMinimumInfo
      }
    }
  }
`);

const styles = defineStyles('CommentOnYourDraftNotificationHover', (theme: ThemeType) => ({
  root: {
    padding: 16,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    maxWidth: 600,
  },
}));

const CommentOnYourDraftNotificationHover = ({notification}: {
  notification: NotificationsList,
}) => {
  const classes = useStyles(styles);
  const postId = notification.documentId ?? undefined;
  const postEditUrl = `/editPost?postId=${postId}`
  const currentUser = useCurrentUser()
  const { data } = useQuery(PostsMinimumInfoQuery, {
    variables: { documentId: postId },
    skip: !postId,
  });
  const post = data?.post?.result;
  
  const senderUserId = notification.extraData?.senderUserID;
  
  const postOrDraft = post?.draft ? "draft" : "post";
  
  return <div className={classes.root}>
    <div>
      {senderUserId ? <UsersName documentId={notification.extraData.senderUserID}/> : "Someone"}
      {(currentUser?._id !== post?.userId) ? " replied to your comment on " : ` commented on your ${postOrDraft}`}
      <NotifPopoverLink to={postEditUrl}>
        {post ? post.title : <Loading/>}
      </NotifPopoverLink>
    </div>
    
    {notification.extraData && <blockquote dangerouslySetInnerHTML={{__html: notification.extraData.commentHtml}}/>}
  </div>
}

export default CommentOnYourDraftNotificationHover;


