import React, { useState } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import NotificationsPageKarmaChange from "./NotificationsPageKarmaChange";

const styles = (theme: ThemeType) => ({
  showMoreBtn: {
    background: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    fontWeight: 600,
    color: theme.palette.grey[600],
    padding: 0,
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
})

export const NotificationsPageKarmaChangeList = ({karmaChanges, truncateAt, classes}: {
  karmaChanges?: Pick<Exclude<UserKarmaChanges['karmaChanges'], null | undefined>, "posts" | "comments" | "tagRevisions"> | null,
  truncateAt?: number,
  classes: ClassesType<typeof styles>,
}) => {
  // If there are more items total than we want to show, truncate the list.
  const [isTruncated, setIsTruncated] = useState(
    truncateAt !== undefined && truncateAt > 0 && (
      (karmaChanges?.posts?.length ?? 0) + (karmaChanges?.comments?.length ?? 0) + (karmaChanges?.tagRevisions?.length ?? 0) > truncateAt
    )
  )
  let posts = karmaChanges?.posts
  let comments = karmaChanges?.comments
  let tagRevisions = karmaChanges?.tagRevisions
  
  // If we're truncating the list, attempt to only show the first n items.
  if (isTruncated && truncateAt !== undefined) {
    let remainingItemCount = truncateAt
    posts = posts?.slice(0, remainingItemCount)
    // Count how many notifications the posts will show
    const postNotificationCount = posts?.reduce((acc, post) => {
      return acc + (post.scoreChange === 0 ? 0 : 1) + (Object.keys(post.eaAddedReacts ?? {}).length ?? 0)
    }, 0) ?? 0
    // If we have n items, hide the rest
    if (posts && postNotificationCount >= remainingItemCount) {
      // If this is more than we want to show, remove the last post
      if (postNotificationCount > remainingItemCount) {
        posts.pop()
      }
      comments = []
      tagRevisions = []
    } else {
      remainingItemCount -= postNotificationCount
      comments = comments?.slice(0, remainingItemCount)
      // Count how many notifications the comments will show
      const commentNotificationCount = comments?.reduce((acc, comment) => {
        return acc + (comment.scoreChange === 0 ? 0 : 1) + (Object.keys(comment.eaAddedReacts ?? {}).length ?? 0)
      }, 0) ?? 0
      // If we have n items, hide the rest
      if (comments && commentNotificationCount >= remainingItemCount) {
        // If this is more than we want to show, remove the last comment
        if (commentNotificationCount > remainingItemCount) {
          comments.pop()
        }
        tagRevisions = []
      } else {
        remainingItemCount -= commentNotificationCount
        tagRevisions = tagRevisions?.slice(0, remainingItemCount)
      }
    }
  }

  return (
    <>
      {posts?.map((karmaChange) =>
        <NotificationsPageKarmaChange
          key={karmaChange._id}
          postKarmaChange={karmaChange}
        />
      )}
      {comments?.map((karmaChange) =>
        <NotificationsPageKarmaChange
          key={karmaChange._id}
          commentKarmaChange={karmaChange}
        />
      )}
      {tagRevisions?.map((karmaChange) =>
        <NotificationsPageKarmaChange
          key={karmaChange._id}
          tagRevisionKarmaChange={karmaChange}
        />
      )}
      {isTruncated && <div>
        <button onClick={() => setIsTruncated(false)} className={classes.showMoreBtn}>
          Show more
        </button>
      </div>}
    </>
  );
}

export default registerComponent(
  "NotificationsPageKarmaChangeList",
  NotificationsPageKarmaChangeList,
  {styles}
);


