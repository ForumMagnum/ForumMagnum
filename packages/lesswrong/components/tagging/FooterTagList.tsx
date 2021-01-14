import React, { useCallback, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useCurrentUser } from '../common/withUser';
import { useTracking, useOnMountTracking } from "../../lib/analyticsEvents";
import { contentTypes } from '../posts/PostsPage/ContentType';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { tagStyle } from './FooterTag';
import classNames from 'classnames';
import { commentBodyStyles } from '../../themes/stylePiping'
import { curatedUrl } from '../recommendations/RecommendationsAndCurated'
import Card from '@material-ui/core/Card';
import { Link } from '../../lib/reactRouterWrapper';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
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
  },
  frontpageOrPersonal: {
    ...tagStyle(theme),
    backgroundColor: "white",
    paddingTop: 4,
    paddingBottom: 4,
    border: "solid 1px rgba(0,0,0,.12)",
    color: theme.palette.grey[600]
  },
  card: {
    ...commentBodyStyles(theme),
    width: 450,
    padding: 16,
    paddingBottom: 8
  }
});

export function sortTags<T>(list: Array<T>, toTag: (item: T)=>TagBasicInfo|null|undefined): Array<T> {
  return _.sortBy(list, item=>toTag(item)?.core);
}

const FooterTagList = ({post, classes, hideScore, hideAddTag, hidePersonalOrFrontpage, smallText=false}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList | SunshinePostsList,
  classes: ClassesType,
  hideScore?: boolean,
  hideAddTag?: boolean,
  hidePersonalOrFrontpage?: boolean,
  smallText?: boolean

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
    collectionName: "TagRels",
    fragmentName: "TagRelMinimumFragment", // Must match the fragment in the mutation
    limit: 100,
  });

  const tagIds = (results||[]).map((tag) => tag._id)
  useOnMountTracking({eventType: "tagList", eventProps: {tagIds}, captureOnMount: eventProps => eventProps.tagIds.length, skip: !tagIds.length||loading})

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

  let postType = <></>
  if (!hidePersonalOrFrontpage) {
    postType = post.curatedDate
      ? <Link to={curatedUrl}>
          <LWTooltip title={<Card className={classes.card}>{contentTypes[forumTypeSetting.get()].curated.tooltipBody}</Card>} tooltip={false}>
            <div className={classes.frontpageOrPersonal}>Curated</div>
          </LWTooltip>
        </Link>
      : post.frontpageDate
        ? <LWTooltip title={<Card className={classes.card}>{contentTypes[forumTypeSetting.get()].frontpage.tooltipBody}</Card>} tooltip={false}>
            <div className={classes.frontpageOrPersonal}>Frontpage</div>
          </LWTooltip>
        : <LWTooltip title={<Card className={classes.card}>{contentTypes[forumTypeSetting.get()].personal.tooltipBody}</Card>} tooltip={false}>
            <div className={classNames(classes.tag, classes.frontpageOrPersonal)}>Personal Blog</div>
          </LWTooltip>
  }

  if (loading || !results) {
    return <div className={classes.root}>
     {sortTags(post.tags, t=>t).map(tag => <FooterTag key={tag._id} tag={tag} hideScore />)}
     {postType}
    </div>;
  }



  return <span className={classes.root}>
    {sortTags(results, t=>t.tag).filter(tagRel => !!tagRel?.tag).map(tagRel =>
      tagRel.tag && <FooterTag 
        key={tagRel._id} 
        tagRel={tagRel} 
        tag={tagRel.tag} 
        hideScore={hideScore}
        smallText={smallText}
      />
    )}
    { postType }
    {currentUser && !hideAddTag && <AddTagButton onTagSelected={onTagSelected} />}
    { isAwaiting && <Loading/>}
  </span>
};

const FooterTagListComponent = registerComponent("FooterTagList", FooterTagList, {styles});

declare global {
  interface ComponentTypes {
    FooterTagList: typeof FooterTagListComponent
  }
}
