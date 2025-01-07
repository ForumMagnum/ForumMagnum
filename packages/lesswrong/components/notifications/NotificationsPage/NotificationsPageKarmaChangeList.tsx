import React, { useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import type { KarmaChangesSimple } from "../../../lib/collections/users/karmaChangesGraphQL";

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
  karmaChanges?: KarmaChangesSimple,
  truncateAt?: number,
  classes: ClassesType<typeof styles>,
}) => {
  // If there are more items total than we want to show, truncate the list.
  const [isTruncated, setIsTruncated] = useState(
    truncateAt !== undefined && truncateAt > 0 && (
      (karmaChanges?.posts.length ?? 0) + (karmaChanges?.comments.length ?? 0) + (karmaChanges?.tagRevisions.length ?? 0) > truncateAt
    )
  )
  
  const {NotificationsPageKarmaChange} = Components;
  
  let posts = karmaChanges?.posts
  let comments = karmaChanges?.comments
  let tagRevisions = karmaChanges?.tagRevisions
  
  // If we're truncating the list, attempt to only show the first n items.
  // This doesn't quite work because some items can have more than one
  // notification attached to them (like an upvote and an agree react).
  if (isTruncated && truncateAt !== undefined) {
    let itemCount = truncateAt
    posts = posts?.slice(0, itemCount)
    itemCount -= posts?.length ?? 0
    comments = comments?.slice(0, itemCount)
    itemCount -= comments?.length ?? 0
    tagRevisions = tagRevisions?.slice(0, itemCount)
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

const NotificationsPageKarmaChangeListComponent = registerComponent(
  "NotificationsPageKarmaChangeList",
  NotificationsPageKarmaChangeList,
  {styles}
);

declare global {
  interface ComponentTypes {
    NotificationsPageKarmaChangeList: typeof NotificationsPageKarmaChangeListComponent
  }
}
