import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import PostsItem from "@/components/posts/PostsItem";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ProfileShortform = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: UsersProfile
}) => {
  const { document } = useSingle({
    documentId: user.shortformFeedId,
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
  });

  return <div className={classes.root}>
      {document && <PostsItem post={document} hideAuthor forceSticky />}
  </div>;
}

const ProfileShortformComponent = registerComponent('ProfileShortform', ProfileShortform, {styles});

declare global {
  interface ComponentTypes {
    ProfileShortform: typeof ProfileShortformComponent
  }
}

export default ProfileShortformComponent;

