import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { registerComponent } from '../../lib/vulcan-lib/components';
import PostsItem from "../posts/PostsItem";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ProfileShortform = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: UsersProfile
}) => {
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

export default registerComponent('ProfileShortform', ProfileShortform, {styles});



