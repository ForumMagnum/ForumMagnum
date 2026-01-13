import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useRecentDiscussionThread } from "./useRecentDiscussionThread";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import EARecentDiscussionItem from "./EARecentDiscussionItem";
import CommentsItem from "../comments/CommentsItem/CommentsItem";
import CommentsNodeInner from "../comments/CommentsNode";

const styles = (_theme: ThemeType) => ({
  body: {
    padding: 0,
    "& .CommentsItemMeta-root": {
      paddingTop: 0,
      "& .CommentsItemMeta-rightSection": {
        top: 0,
      },
    },
  },
});

const EARecentDiscussionQuickTakeCommented = ({
  post,
  comments,
  refetch,
  expandAllThreads: initialExpandAllThreads,
  classes,
}: {
  post: PostQuickTakesRecentDiscussion
  comments: CommentsListWithTopLevelComment[],
  refetch: () => void,
  expandAllThreads?: boolean
  classes: ClassesType<typeof styles>,
}) => {
  const {
    isSkippable,
    expandAllThreads,
    nestedComments,
    treeOptions,
  } = useRecentDiscussionThread({
    post,
    comments,
    refetch,
    initialExpandAllThreads,
  });
  if (isSkippable) {
    return null;
  }
  return (
    <>
      {nestedComments.map(({item, children}) => (
        <EARecentDiscussionItem
          key={item._id}
          icon="CommentFilled"
          iconVariant="primary"
          user={item.user}
          action="commented on"
          postTitleOverride={`${post.user?.displayName}'s quick take`}
          post={post}
          postUrlOverride={commentGetPageUrlFromIds({
            postId: post._id,
            postSlug: post.slug,
            commentId: item._id,
          })}
          timestamp={item.postedAt}
        >
          {item.topLevelComment &&
            <CommentsItem
              treeOptions={treeOptions}
              comment={item.topLevelComment}
              nestingLevel={1}
              truncated={false}
              excerptLines={3}
              className={classes.body}
            />
          }
          <CommentsNodeInner
            key={item._id}
            treeOptions={{
              ...treeOptions,
              hideParentCommentToggleForTopLevel: true,
            }}
            truncated={false}
            expandAllThreads={expandAllThreads}
            expandNewComments={false}
            nestingLevel={1}
            comment={item}
            childComments={children}
          />
        </EARecentDiscussionItem>
      ))}
    </>
  )
}

export default registerComponent(
  "EARecentDiscussionQuickTakeCommented",
  EARecentDiscussionQuickTakeCommented,
  {styles},
);
