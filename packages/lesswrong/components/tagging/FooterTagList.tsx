import React, { useCallback, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useCurrentUser } from '../common/withUser';
import { useTracking } from "../../lib/analyticsEvents";

const styles = theme => ({
  root: {
    marginTop: 16,
    marginBottom: 66,
  },
});

const FooterTagList = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const [isAwaiting, setIsAwaiting] = useState(false);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()

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

  const tagIds = (results||[]).map((tag) => tag._id)
  useTracking({eventType: "tagList", eventProps: {tagIds}, captureOnMount: eventProps => eventProps.tagIds.length, skip: !tagIds.length||loading})

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
    captureEvent("tagAddedToItem", {tagId, tagName})
  }, [setIsAwaiting, mutate, refetch, post._id, captureEvent]);

  const { Loading, FooterTag } = Components
  if (loading || !results)
    return <Loading/>;

  return <div className={classes.root}>
    {results.filter(tagRel => !!tagRel?.tag).map(tagRel =>
      <FooterTag key={tagRel._id} tagRel={tagRel} tag={tagRel.tag}/>
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
