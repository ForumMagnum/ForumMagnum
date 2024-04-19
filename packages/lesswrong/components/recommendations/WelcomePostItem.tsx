import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { aboutPostIdSetting } from "../../lib/routes";
import { useCurrentUser } from "../common/withUser";
import { useSingle } from "../../lib/crud/withSingle";
import { useItemsRead } from "../hooks/useRecordPostView";
import moment from "moment";
import { useDisplayedPost } from "../posts/usePost";

const WelcomePostItem = () => {
  const currentUser = useCurrentUser();
  const welcomePostId = aboutPostIdSetting.get()

  const { document: post } = useDisplayedPost(welcomePostId, null);

  const { postsRead } = useItemsRead();
  const isRead = post && !!((post._id in postsRead) ? postsRead[post._id] : post.isRead)

  if (!post) {
    return null;
  }

  // use the moment library to calculate the user's age in days, if no user, treat as 0
  const userAgeInDays = currentUser ? moment().diff(moment(currentUser.createdAt), 'days') : 0;

  // Don't display user has read post or has been a user for more than 90 days
  if ( isRead || userAgeInDays > 90) {
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
