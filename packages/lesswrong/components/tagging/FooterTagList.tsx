import React, { useCallback, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { useCurrentUser } from '../common/withUser';
import { useTracking } from "../../lib/analyticsEvents";
import { contentTypes } from '../posts/PostsPage/ContentType';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { tagStyle } from './FooterTag';

const styles = theme => ({
  root: {
    marginTop: 8,
    marginBottom: 8,
  },
  tag: {
    ...tagStyle(theme)
  },
  tagLoading: {
    ...tagStyle(theme),
    opacity: .8
  }
});

const FooterTagList = ({post, classes, hideScore}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList | SunshinePostsList,
  classes: ClassesType,
  hideScore?: boolean
}) => {
  const [isAwaiting, setIsAwaiting] = useState(false);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { LWTooltip, AddTagButton } = Components

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

  const postType = post.frontpageDate ?
    <LWTooltip title={contentTypes[forumTypeSetting.get()].frontpage.tooltipBody}>
      <div className={classes.tag}>Frontpage</div>
    </LWTooltip>
    :
    <LWTooltip title={contentTypes[forumTypeSetting.get()].personal.tooltipBody}>
      <div className={classes.tag}>Personal Blog</div>
    </LWTooltip>

  if (loading || !results)
    return <div className={classes.root}>
       {postType}
       {post.tags.map(tag => <FooterTag key={tag._id} tag={tag} hideScore />)}
    </div>;
  

  return <div className={classes.root}>
    { postType }
    {results.filter(tagRel => !!tagRel?.tag).map(tagRel =>
      <FooterTag key={tagRel._id} tagRel={tagRel} tag={tagRel.tag} hideScore={hideScore}/>
    )}
    {currentUser && <AddTagButton onTagSelected={onTagSelected} />}
    { isAwaiting && <Loading/>}
  </div>
};

const FooterTagListComponent = registerComponent("FooterTagList", FooterTagList, {styles});

declare global {
  interface ComponentTypes {
    FooterTagList: typeof FooterTagListComponent
  }
}
