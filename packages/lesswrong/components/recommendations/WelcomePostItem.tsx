import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { aboutPostIdSetting } from "../../lib/routes";
import { useCurrentUser } from "../common/withUser";
import { useItemsRead } from "../hooks/useRecordPostView";
import moment from "moment";
import { useSingle } from "../../lib/crud/withSingle";

const WelcomePostItem = () => {
  const currentUser = useCurrentUser();
  const welcomePostId = aboutPostIdSetting.get();

  const { document: post } = useSingle({
    documentId: welcomePostId,
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
  });

  const { postsRead } = useItemsRead();
  const isRead = post && !!(
    (post._id in postsRead)
      ? postsRead[post._id]
      : post.isRead
  );

  if (!post) {
    return null;
  }

  const userAgeInDays = currentUser ? moment().diff(moment(currentUser.createdAt), 'days') : 0;

  // Don't display user has read post or has been a user for more than 90 days
  if (isRead || userAgeInDays > 90) {
    return null;
  }

  return <Components.PostsItem post={post} />
}

const WelcomePostItemComponent = registerComponent("WelcomePostItem", WelcomePostItem, {});

declare global {
  interface ComponentTypes {
    WelcomePostItem: typeof WelcomePostItemComponent
  }
}
