import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import {useCurrentUser} from "../common/withUser";
import { NotifPopoverLink } from './useNotificationsPopoverContext';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import UsersName from "../users/UsersName";
import Loading from "../vulcan-core/Loading";


const PostsMinimumInfoQuery = gql(`
  query CommentOnYourDraftNotificationHover($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsMinimumInfo
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    maxWidth: 600,
  },
});

const CommentOnYourDraftNotificationHover = ({notification, classes}: {
  notification: NotificationsList,
  classes: ClassesType<typeof styles>
}) => {
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
      {(currentUser?._id !== post?.userId) ? " replied to your comment on " : ` commented on your draft ${postOrDraft}`}
      <NotifPopoverLink to={postEditUrl}>
        {post ? post.title : <Loading/>}
      </NotifPopoverLink>
    </div>
    
    {notification.extraData && <blockquote dangerouslySetInnerHTML={{__html: notification.extraData.commentHtml}}/>}
  </div>
}

export default registerComponent('CommentOnYourDraftNotificationHover', CommentOnYourDraftNotificationHover, {styles});


