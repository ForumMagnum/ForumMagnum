import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import PostsItem from "../posts/PostsItem";


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
  const { data } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: user.shortformFeedId },
  });
  
  const document = data?.post?.result;

  return <div className={classes.root}>
      {document && <PostsItem post={document} hideAuthor forceSticky />}
  </div>;
}

export default registerComponent('ProfileShortform', ProfileShortform, {styles});



