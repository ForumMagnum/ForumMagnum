import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from "../common/withUser";
import { useItemsRead } from "../hooks/useRecordPostView";
import moment from "moment";
import { useSingle } from "../../lib/crud/withSingle";
import { useCurrentTime } from "../../lib/utils/timeUtil";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import PostsItem from "@/components/posts/PostsItem";

const WelcomePostItem = () => {
  const currentUser = useCurrentUser();
  const now = useCurrentTime();
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

  const userAgeInDays = currentUser ? (moment(now).diff(moment(currentUser.createdAt), 'hours')/24) : 0;

  // Don't display user has read post or has been a user for more than 90 days
  if (isRead || userAgeInDays > 90) {
    return null;
  }

  return <PostsItem post={post} />
}

const WelcomePostItemComponent = registerComponent("WelcomePostItem", WelcomePostItem, {});

declare global {
  interface ComponentTypes {
    WelcomePostItem: typeof WelcomePostItemComponent
  }
}

export default WelcomePostItemComponent;
