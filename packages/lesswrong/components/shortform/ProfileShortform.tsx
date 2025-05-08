import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ProfileShortformInner = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: UsersProfile
}) => {

  const { PostsItem } = Components

  const { document } = useSingle({
    documentId: user.shortformFeedId!,
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    skip: !user.shortformFeedId,
  });

  return <div className={classes.root}>
      {document && <PostsItem post={document} hideAuthor forceSticky />}
  </div>;
}

export const ProfileShortform = registerComponent('ProfileShortform', ProfileShortformInner, {styles});

declare global {
  interface ComponentTypes {
    ProfileShortform: typeof ProfileShortform
  }
}

