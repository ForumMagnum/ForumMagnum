import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsListWithVotesQuery = gql(`
  query ProfileShortform($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsListWithVotes
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ProfileShortform = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: UsersProfile
}) => {

  const { PostsItem } = Components

  const { data } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: user.shortformFeedId },
  });
  const document = data?.post?.result;

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

