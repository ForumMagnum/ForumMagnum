import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
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
import { isLWorAF, taggingNamePluralSetting } from '../../lib/instanceSettings';
import stringify from 'json-stringify-deterministic';
import { isFriendlyUI } from '../../themes/forumTheme';
import { FRIENDLY_HOVER_OVER_WIDTH } from '../common/FriendlyHoverOver';
import { AnnualReviewMarketInfo, highlightMarket } from '../../lib/annualReviewMarkets';

const styles = (theme: ThemeType) => ({
  root: isFriendlyUI ? {
    marginTop: 8,
    marginBottom: 8,
  } : {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  allowTruncate: {
    display: isFriendlyUI ? "block" : "inline-flex",
    // Truncate to 3 rows (webkit-line-clamp would be ideal here but it adds an ellipsis
    // which can't be removed)
    maxHeight: 104,
    overflow: "hidden",
  },
  overrideMargins: {
    marginTop: 0,
    marginBottom: 0,
  },
  postTypeLink: {
    "&:hover": isFriendlyUI ? {opacity: 1} : {},
  },
  frontpageOrPersonal: {
    ...tagStyle(theme),
    backgroundColor: theme.palette.tag.hollowTagBackground,
    ...(isFriendlyUI
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
        paddingTop: 4.5,
        paddingBottom: 4.5,
      }),
    border: theme.palette.tag.hollowTagBorder,
    color: theme.palette.text.dim3,
  },
  card: {
    padding: 16,
    ...(isFriendlyUI
      ? {
        paddingTop: 12,
        width: FRIENDLY_HOVER_OVER_WIDTH,
      }
      : {
        width: 450,
        paddingTop: 8,
      }),
  },
  smallText: {
    ...smallTagTextStyle(theme),
  },
  showAll: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.grey[500],
    cursor: "pointer",
    width: 'fit-content',
  },
  altAddTagButton: {
    backgroundColor: theme.palette.panelBackground.default,
    display: "inline-block",
    paddingLeft: 8,
    paddingTop: 4.5,
    paddingBottom: 4.5,
    paddingRight: 8,
    borderRadius: 3,
    fontWeight: 700,
    gap: 4,
    cursor: "pointer",
    border: theme.palette.tag.border
  },
});

export function sortTags<T>(list: Array<T>, toTag: (item: T) => TagBasicInfo|null|undefined): Array<T> {
  return sortBy(
    list,
    isFriendlyUI ? (item) => !toTag(item)?.core : (item) => toTag(item)?.core,
  );
}

const FooterTagList = ({
  post,
  hideScore,
  hideAddTag,
  //used for PostsPageSplashHeader
  useAltAddTagButton,
  smallText=false,
  showCoreTags,
  hidePostTypeTag,
  link=true,
  highlightAutoApplied=false,
  allowTruncate=false,
  overrideMargins=false,
  appendElement,
  annualReviewMarketInfo,
  classes,
  align = "left"
}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision | PostsList | SunshinePostsList,
  hideScore?: boolean,
  hideAddTag?: boolean,
  useAltAddTagButton?: boolean,
  showCoreTags?: boolean
  hidePostTypeTag?: boolean,
  smallText?: boolean,
  link?: boolean
  highlightAutoApplied?: boolean,
  allowTruncate?: boolean,
  overrideMargins?: boolean,
  appendElement?: ReactNode,
  annualReviewMarketInfo?: AnnualReviewMarketInfo,
  align?: "left" | "right",
  classes: ClassesType<typeof styles>,
}) => {
  const [isAwaiting, setIsAwaiting] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const [showAll, setShowAll] = useState(!allowTruncate);
  const [displayShowAllButton, setDisplayShowAllButton] = useState(false);

  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { flash } = useMessages();

  // We already have the tags as a resolver on the post, this additional query
  // serves two purposes:
  // - It fetches more info that is only required on hover (the tagRel score,
  // the truncated description). Fetching this in a second round trip allows the
  // initial render to be faster.
  // - (somewhat speculative) It allows the mutation to be handled more seamlessly
  // (incrementing the score and reordering the tags) by updating the result of
  // this query
  const { results, loading, loadingInitial, refetch } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collectionName: "TagRels",
    fragmentName: "TagRelMinimumFragment", // Must match the fragment in the mutation
    limit: 100,
    fetchPolicy: 'cache-and-network',
    // Only fetch this as a follow-up query on the client
    ssr: false,
  });

  const checkShouldDisplayShowAll = useCallback(() => {
    if (!showAll && rootRef.current) {
      const el = rootRef.current;
      // Even when expanded scrollHeight and clientHeight can be off by a few pixels,
      // we are interested in the case where a whole row is hidden
      if (el.scrollHeight > (el.clientHeight + 10)) {
        setDisplayShowAllButton(true);
      } else {
        setDisplayShowAllButton(false);
      }
    }
  }, [showAll, rootRef, setDisplayShowAllButton]);

  // Check whether we should display the "Show all topics" button when:
  // - Results or loading state change
  // - The component window is resized
  const resultsSignature = stringify(results);
  useEffect(checkShouldDisplayShowAll, [showAll, loadingInitial, resultsSignature, checkShouldDisplayShowAll]);
  useEffect(() => {
    window.addEventListener("resize", checkShouldDisplayShowAll);
    return () => window.removeEventListener("resize", checkShouldDisplayShowAll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onClickShowAll = useCallback(() => {
    setShowAll(true);
    setDisplayShowAllButton(false);
  }, [setShowAll, setDisplayShowAllButton]);

  const tagIds = (results||[]).map((tag) => tag._id)

  useOnMountTracking({
    eventType: "tagList",
    eventProps: {tagIds},
    captureOnMount: eventProps => eventProps.tagIds.length > 0,
    // LW doesn't get a lot of use out of `tagListMounted` events and there are a lot of them
    skip: isLWorAF || !tagIds.length || loading
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

  const PostTypeTag = useCallback(({tooltipBody, label}: {
    tooltipBody: ReactNode,
    label: string,
  }) => {
    const {HoverOver, ContentStyles} = Components;
    return (
      <HoverOver
        title={
          <Card className={classes.card}>
            <ContentStyles contentType="comment">
              {tooltipBody}
            </ContentStyles>
          </Card>
        }
        tooltip={false}
      >
        <div className={classNames(classes.frontpageOrPersonal, {
          [classes.smallText]: smallText,
        })}>
          {label}
        </div>
      </HoverOver>
    );
  }, [classes, smallText]);

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

  const sortedTagRels = results ? sortTags(results, t=>t.tag).filter(tagRel => !!tagRel?.tag) : []

  const {Loading, FooterTag, AddTagButton, CoreTagsChecklist, PostsAnnualReviewMarketTag} = Components;

  const tooltipPlacement = useAltAddTagButton ? "bottom-end" : undefined;

  const innerContent =
    (loadingInitial || !results) ? (
      <>
        {sortTags(post.tags, (t) => t).map((tag) => (
          <FooterTag key={tag._id} tag={tag} hideScore smallText={smallText} />
        ))}
        {!hidePostTypeTag && postType}
        {annualReviewMarketInfo && highlightMarket(annualReviewMarketInfo) && <PostsAnnualReviewMarketTag post={post} annualReviewMarketInfo={annualReviewMarketInfo} />}
      </>
    ) : (
      <>
        {showCoreTags && (
          <div>
            <CoreTagsChecklist existingTagIds={tagIds} onTagSelected={onTagSelected} />
          </div>
        )}
        {sortedTagRels.map(
          (tagRel) =>
            tagRel.tag && (
              <FooterTag
                key={tagRel._id}
                tagRel={tagRel}
                tag={tagRel.tag}
                hideScore={hideScore}
                smallText={smallText}
                highlightAsAutoApplied={highlightAutoApplied && tagRel.autoApplied}
                link={link}
              />
            )
        )}
        {!hidePostTypeTag && postType}
        {annualReviewMarketInfo && highlightMarket(annualReviewMarketInfo) && <PostsAnnualReviewMarketTag post={post} annualReviewMarketInfo={annualReviewMarketInfo} />}
        {currentUser && !hideAddTag && <AddTagButton onTagSelected={onTagSelected} isVotingContext tooltipPlacement={tooltipPlacement}>
            {useAltAddTagButton && <span className={classes.altAddTagButton}>+</span>}
          </AddTagButton>
        }
        {isAwaiting && <Loading />}
      </>
    );

  return <>
    <span
      ref={rootRef}
      className={classNames(classes.root, {[classes.allowTruncate]: !showAll}, {[classes.overrideMargins] : overrideMargins, [classes.alignRight]: align === "right"})}
    >
      {innerContent}
      {appendElement}
    </span>
    {displayShowAllButton && <div className={classes.showAll} onClick={onClickShowAll}>Show all {taggingNamePluralSetting.get()}</div>}
  </>
};

const FooterTagListComponent = registerComponent("FooterTagList", FooterTagList, {styles});

declare global {
  interface ComponentTypes {
    FooterTagList: typeof FooterTagListComponent
  }
}
