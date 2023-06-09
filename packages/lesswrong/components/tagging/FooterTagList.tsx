import React, { useCallback, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import { useTracking, useOnMountTracking } from "../../lib/analyticsEvents";
import { contentTypes } from '../posts/PostsPage/ContentType';
import { tagStyle, smallTagTextStyle } from './FooterTag';
import classNames from 'classnames';
import Card from '@material-ui/core/Card';
import { Link } from '../../lib/reactRouterWrapper';
import { sortBy } from 'underscore';
import { forumSelect } from '../../lib/forumTypeUtils';
import { useMessages } from '../common/withMessages';
import { isEAForum } from '../../lib/instanceSettings';
import { isServer } from '../../lib/executionEnvironment';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 8,
    marginBottom: 8,
  },
  postTypeLink: {
    "&:hover": isEAForum ? {opacity: 1} : {},
  },
  frontpageOrPersonal: {
    ...tagStyle(theme),
    backgroundColor: theme.palette.tag.hollowTagBackground,
    ...(isEAForum
      ? {
        marginBottom: 0,
        "&:hover": {
          opacity: 1,
          backgroundColor: theme.palette.tag.hollowTagBackgroundHover,
        },
        "& a:hover": {
          opacity: 1,
        },
      }
      : {
        paddingTop: 4,
        paddingBottom: 4,
      }),
    border: theme.palette.tag.hollowTagBorder,
    color: theme.palette.text.dim3,
  },
  card: {
    width: 450,
    padding: 16,
    paddingTop: 8
  },
  smallText: {
    ...smallTagTextStyle(theme),
  }
});

export function sortTags<T>(list: Array<T>, toTag: (item: T)=>TagBasicInfo|null|undefined): Array<T> {
  return sortBy(
    list,
    isEAForum ? (item) => !toTag(item)?.core : (item) => toTag(item)?.core,
  );
}

const FooterTagList = ({post, classes, hideScore, hideAddTag, smallText=false, showCoreTags, hidePostTypeTag, link=true, highlightAutoApplied=false}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList | SunshinePostsList,
  classes: ClassesType,
  hideScore?: boolean,
  hideAddTag?: boolean,
  showCoreTags?: boolean
  hidePostTypeTag?: boolean,
  smallText?: boolean,
  link?: boolean
  highlightAutoApplied?: boolean,
}) => {
  const [isAwaiting, setIsAwaiting] = useState(false);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { flash } = useMessages();
  const { LWTooltip, AddTagButton, CoreTagsChecklist } = Components

  // [Epistemic status - two years later guessing] This loads the tagrels via a
  // database query instead of using the denormalized field on posts. This
  // causes a shift of the tag in non-SSR contexts. I believe without
  // empirically testing this, that it's to allow the mutation to seamlessly
  // reorder the tags, by updating the result of this query. But you could
  // imagine that this could start with the ordering of the tags on the post
  // object, and then use the result from the database once we have it.
  const { results, loading, loadingInitial, refetch } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collectionName: "TagRels",
    fragmentName: "TagRelMinimumFragment", // Must match the fragment in the mutation
    limit: 100,
    fetchPolicy: 'cache-and-network',
    ssr: true,
  });

  const tagIds = (results||[]).map((tag) => tag._id)
  useOnMountTracking({eventType: "tagList", eventProps: {tagIds}, captureOnMount: eventProps => eventProps.tagIds.length > 0, skip: !tagIds.length||loading})

  const [mutate] = useMutation(gql`
    mutation addOrUpvoteTag($tagId: String, $postId: String) {
      addOrUpvoteTag(tagId: $tagId, postId: $postId) {
        ...TagRelMinimumFragment
      }
    }
    ${getFragment("TagRelMinimumFragment")}
  `);

  const onTagSelected = useCallback(async ({tagId, tagName}: {tagId: string, tagName: string}) => {
    try {
      setIsAwaiting(true);
      await mutate({
        variables: {
          tagId: tagId,
          postId: post._id,
        },
      });
      setIsAwaiting(false);
      refetch();
      captureEvent("tagAddedToItem", {tagId, tagName});
    } catch (e) {
      setIsAwaiting(false);
      flash(e.message);
    }
  }, [setIsAwaiting, mutate, refetch, post._id, captureEvent, flash]);

  const { Loading, FooterTag, ContentStyles } = Components
  
  const MaybeLink = ({to, children, className}: {
    to: string|null,
    children: React.ReactNode,
    className?: string,
  }) => {
    if (to) {
      return <Link to={to} className={className}>{children}</Link>
    } else {
      return <>{children}</>;
    }
  }
  
  const contentTypeInfo = forumSelect(contentTypes);
  
  const PostTypeTag = ({tooltipBody, label}: {
    tooltipBody: React.ReactNode;
    label: string;
  }) =>
    <LWTooltip
      title={<Card className={classes.card}>
        <ContentStyles contentType="comment">
          {tooltipBody}
        </ContentStyles>
      </Card>}
      tooltip={false}
    >
      <div className={classNames(classes.frontpageOrPersonal, {[classes.smallText]: smallText})}>{label}</div>
    </LWTooltip>

  // Post type is either Curated, Frontpage, Personal, or uncategorized (in which case
  // we don't show any indicator). It's uncategorized if it's not frontpaged and doesn't
  // have reviewedByUserId set to anything.
  let postType = post.curatedDate
    ? <Link to={contentTypeInfo.curated.linkTarget} className={classes.postTypeLink}>
        <PostTypeTag label="Curated" tooltipBody={contentTypeInfo.curated.tooltipBody}/>
      </Link>
    : (post.frontpageDate
      ? <MaybeLink to={contentTypeInfo.frontpage.linkTarget} className={classes.postTypeLink}>
          <PostTypeTag label="Frontpage" tooltipBody={contentTypeInfo.frontpage.tooltipBody}/>
        </MaybeLink>
      : (post.reviewedByUserId
        ? <MaybeLink to={contentTypeInfo.personal.linkTarget} className={classes.postTypeLink}>
          <PostTypeTag label="Personal Blog" tooltipBody={contentTypeInfo.personal.tooltipBody}/>
          </MaybeLink>
        : null
      )
    ) 

  if (loadingInitial || !results) {
    return <span className={classes.root}>
     {sortTags(post.tags, t=>t).map(tag => <FooterTag key={tag._id} tag={tag} hideScore smallText={smallText}/>)}
     {!hidePostTypeTag && postType}
    </span>;
  }

  const sortedTagRels = sortTags(results, t=>t.tag).filter(tagRel => !!tagRel?.tag)
 
  return <span className={classes.root}>
    {showCoreTags && <div>
      <CoreTagsChecklist existingTagIds={tagIds} onTagSelected={onTagSelected}/>
    </div>}
    {sortedTagRels.map(tagRel =>
      tagRel.tag && <FooterTag 
        key={tagRel._id} 
        tagRel={tagRel} 
        tag={tagRel.tag} 
        hideScore={hideScore}
        smallText={smallText}
        highlightAsAutoApplied={highlightAutoApplied && tagRel.autoApplied}
        link={link}
      />
    )}
    { !hidePostTypeTag && postType }
    {currentUser && !hideAddTag && <AddTagButton onTagSelected={onTagSelected} isVotingContext />}
    { isAwaiting && <Loading/>}
  </span>
};

const FooterTagListComponent = registerComponent("FooterTagList", FooterTagList, {styles});

declare global {
  interface ComponentTypes {
    FooterTagList: typeof FooterTagListComponent
  }
}
