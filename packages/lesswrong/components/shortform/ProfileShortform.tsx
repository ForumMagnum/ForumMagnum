import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const ProfileShortform = ({classes, user}: {
  classes: ClassesType,
  user: UsersProfile
}) => {

  const { PostsItem2 } = Components

  const { document } = useSingle({
    documentId: user.shortformFeedId,
    collectionName: "Posts",
    fragmentName: "PostsList"
  });

  return <div className={classes.root}>
      {document && <PostsItem2 post={document} hideAuthor forceSticky />}
  </div>;
}

const ProfileShortformComponent = registerComponent('ProfileShortform', ProfileShortform, {styles});

declare global {
  interface ComponentTypes {
    ProfileShortform: typeof ProfileShortformComponent
  }
}

