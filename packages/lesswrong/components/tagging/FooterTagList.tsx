import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { TagRels } from '../../lib/collections/tagRels/collection';

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
  const { results, loading } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collection: TagRels,
    fragmentName: "TagRelMinimumFragment",
    limit: 100,
    ssr: true,
  });
  
  const [mutate] = useMutation(gql`
    mutation addOrUpvoteTag($tagId: String, $postId: String) {
      addOrUpvoteTag(tagId: $tagId, postId: $postId) {
        ...TagRelFragment
      }
    }
    ${getFragment("TagRelFragment")}
  `, {
    update: (store, mutationResult) => {
      updateEachQueryResultOfType({
        func: handleUpdateMutation,
        document: mutationResult.data.addOrUpvoteTag,
        store, typeName: "TagRel",
      });
    }
  });
  
  if (loading || !results)
    return <Components.Loading/>;
  
  return <div className={classes.root}>
    {results.map((result, i) => <span key={result._id}>
      <Components.FooterTag tagRel={result} tag={result.tag}/>
    </span>)}
    
    <Components.AddTagButton
      onTagSelected={({tagId, tagName}: {tagId: string, tagName: string}) => {
        mutate({
          variables: {
            tagId: tagId,
            postId: post._id,
          },
        });
      }}
    />
  </div>
};

const FooterTagListComponent = registerComponent("FooterTagList", FooterTagList, {styles});

declare global {
  interface ComponentTypes {
    FooterTagList: typeof FooterTagListComponent
  }
}
