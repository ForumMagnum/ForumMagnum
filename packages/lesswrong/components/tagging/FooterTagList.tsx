import React, { useCallback, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import { useTracking, useOnMountTracking } from "../../lib/analyticsEvents";
import { contentTypes } from '../posts/PostsPage/ContentType';
import { tagStyle, smallTagTextStyle } from './FooterTag';
import classNames from 'classnames';
import { commentBodyStyles } from '../../themes/stylePiping'
import Card from '@material-ui/core/Card';
import { Link } from '../../lib/reactRouterWrapper';
import * as _ from 'underscore';
import { forumSelect } from '../../lib/forumTypeUtils';

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
  },
  smallText: {
    ...smallTagTextStyle(theme),
  }
});

export function sortTags<T>(list: Array<T>, toTag: (item: T)=>TagBasicInfo|null|undefined): Array<T> {
  return _.sortBy(list, item=>toTag(item)?.core);
}

const FooterTagList = ({post, classes, hideScore, hideAddTag, smallText=false}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList | SunshinePostsList,
  classes: ClassesType,
  hideScore?: boolean,
  hideAddTag?: boolean,
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
  
  const MaybeLink = ({to, children}: {
    to: string|null
    children: React.ReactNode
  }) => {
    if (to) {
      return <Link to={to}>{children}</Link>
    } else {
      return <>{children}</>;
    }
  }
  
  const contentTypeInfo = forumSelect(contentTypes);

  // Post type is either Curated, Frontpage, Personal, or uncategorized (in which case
  // we don't show any indicator). It's uncategorized if it's not frontpaged and doesn't
  // have reviewedByUserId set to anything.
  let postType = post.curatedDate
    ? <Link to={contentTypeInfo.curated.linkTarget}>
        <LWTooltip title={<Card className={classes.card}>{contentTypeInfo.curated.tooltipBody}</Card>} tooltip={false}>
          <div className={classNames(classes.frontpageOrPersonal, {[classes.smallText]: smallText})}>Curated</div>
        </LWTooltip>
      </Link>
    : (post.frontpageDate
      ? <MaybeLink to={contentTypeInfo.frontpage.linkTarget}>
          <LWTooltip title={<Card className={classes.card}>{contentTypeInfo.frontpage.tooltipBody}</Card>} tooltip={false}>
            <div className={classNames(classes.frontpageOrPersonal, {[classes.smallText]: smallText})}>Frontpage</div>
          </LWTooltip>
        </MaybeLink>
      : (post.reviewedByUserId
        ? <MaybeLink to={contentTypeInfo.personal.linkTarget}>
            <LWTooltip title={<Card className={classes.card}>{contentTypeInfo.personal.tooltipBody}</Card>} tooltip={false}>
              <div className={classNames(classes.tag, classes.frontpageOrPersonal, {[classes.smallText]: smallText})}>Personal Blog</div>
            </LWTooltip>
          </MaybeLink>
        : null
      )
    )

  if (loading || !results) {
    return <span className={classes.root}>
     {sortTags(post.tags, t=>t).map(tag => <FooterTag key={tag._id} tag={tag} hideScore smallText={smallText}/>)}
     {postType}
    </span>;
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
