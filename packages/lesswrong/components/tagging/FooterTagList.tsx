import React, { useCallback, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useCurrentUser } from '../common/withUser';

const styles = theme => ({
  root: {
    marginTop: 16,
    marginBottom: 16,
  },
});

const FooterTagList = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const [isAwaiting, setIsAwaiting] = useState(false);
  const currentUser = useCurrentUser();
  
  const { results, loading, refetch } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collection: TagRels,
    fragmentName: "TagRelMinimumFragment", // Must match the fragment in the mutation
    limit: 100,
    ssr: true,
  });
  
  const [mutate] = useMutation(gql`
    mutation addOrUpvoteTag($tagId: String, $postId: String) {
      addOrUpvoteTag(tagId: $tagId, postId: $postId) {
        ...TagRelMinimumFragment
      }
    }
    ${getFragment("TagRelMinimumFragment")}
  `);

  const onTagSelected = useCallback(async ({tagId, tagName}: {tagId: string, tagName: string}) => {
    setIsAwaiting(true)
    await mutate({
      variables: {
        tagId: tagId,
        postId: post._id,
      },
    });
    setIsAwaiting(false)
    refetch()
  }, [setIsAwaiting, mutate, refetch, post._id]);
  
  const { Loading, FooterTag } = Components
  if (loading || !results)
    return <Loading/>;
  
  return <div className={classes.root}>
    {results.map((result, i) =>
      <FooterTag key={result._id} tagRel={result} tag={result.tag}/>
    )}
    {currentUser && <Components.AddTagButton onTagSelected={onTagSelected} />}
    { isAwaiting && <Loading/>}
  </div>
};

const FooterTagListComponent = registerComponent("FooterTagList", FooterTagList, {styles});

declare global {
  interface ComponentTypes {
    FooterTagList: typeof FooterTagListComponent
  }
}
