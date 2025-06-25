import React from "react";
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from "../common/withUser";
import { useItemsRead } from "../hooks/useRecordPostView";
import moment from "moment";
import { useCurrentTime } from "../../lib/utils/timeUtil";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import PostsItem from "../posts/PostsItem";
import { HideIfRepeated } from "../posts/HideRepeatedPostsContext";

const PostsListWithVotesQuery = gql(`
  query WelcomePostItem($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsListWithVotes
      }
    }
  }
`);

const WelcomePostItem = ({repeatedPostsPrecedence}: {
  repeatedPostsPrecedence?: number
}) => {
  const currentUser = useCurrentUser();
  const now = useCurrentTime();
  const welcomePostId = aboutPostIdSetting.get();

  const { data } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: welcomePostId },
  });
  const post = data?.post?.result;

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

  return <HideIfRepeated precedence={repeatedPostsPrecedence} postId={post._id}>
    <PostsItem post={post} />
  </HideIfRepeated>
}

export default registerComponent("WelcomePostItem", WelcomePostItem, {});


