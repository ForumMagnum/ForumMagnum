import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useOrderPreservingArray } from '../hooks/useOrderPreservingArray';
import { useMutation, gql } from '@apollo/client';
import type { Option } from '../common/InlineSelect';
import { useCurrentUser } from '../common/withUser';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTracking } from '../../lib/analyticsEvents';
import { subforumDefaultSorting } from '../../lib/collections/comments/views';
import { NEW_COMMENT_MARGIN_BOTTOM } from '../comments/CommentsListSection';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import { TagCommentType } from '../../lib/collections/comments/types';

const sortOptions: Option[] = [
  {value: "new", label: "new"},
  {value: "recentDiscussion", label: "recent discussion"},
]

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontWeight: 400,
    margin: "0px auto -15px auto", // -15px is to offset the padding in Layout so that this fills exactly the whole page
    ...theme.typography.commentStyle,
    position: "relative",
    display: 'flex',
    flexDirection: 'column'
  },
  maxWidthRoot: {
    maxWidth: 720,
  },
  newComment: {
    border: theme.palette.border.commentBorder,
    borderWidth: 2,
    position: 'relative',
    borderRadius: 3,
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    marginLeft: 5,
    marginRight: 5,
    "@media print": {
      display: "none"
    },
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
  },
  joinButton: {
    marginTop: 37,
  },
  sortBy: {
    marginLeft: 8,
    marginTop: 14,
    marginBottom: 2,
    display: 'inline',
    color: theme.palette.text.secondary,
  },
})
const SubforumCentralFeed = ({ tag, sortBy, classes }: {
  tag: TagBasicInfo,
  sortBy: string,
  classes: ClassesType,
}) => {
  const terms: CommentsViewTerms = { 
    tagId: tag._id,
    view: "tagSubforumComments",
    limit: 50,
    sortBy
  }
  const { loading, results, loadMore, loadingMore, totalCount, refetch } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });

  const currentUser = useCurrentUser();
  const { history } = useNavigation();
  const { location, query } = useLocation();
  const { captureEvent } = useTracking()
  const [recordSubforumViewMutation] = useMutation(gql`
    mutation recordSubforumView($userId: String!, $tagId: String!) {
      recordSubforumView(userId: $userId, tagId: $tagId)
    }
  `);
  const recordSubforumView = useCallback(async () => recordSubforumViewMutation({variables: {userId: currentUser?._id, tagId: tag._id}}), [currentUser?._id, tag, recordSubforumViewMutation]);

  useEffect(() => {
    if (results && results.length)
      void recordSubforumView();
  }, [results, recordSubforumView]);
  
  const sortByRef = useRef(terms.sortBy);
  const bodyRef = useRef<HTMLDivElement>(null)
  // topAbsolutePosition is set to make it exactly fill the page, 200 is about right so setting that as a default reduces the visual jitter
  const [topAbsolutePosition, setTopAbsolutePosition] = useState(200)
  const orderedResults = useOrderPreservingArray(
    results || [],
    (comment) => comment._id,
    // If the selected sort order changes, clear the existing ordering
    sortByRef.current === terms.sortBy ? "interleave-new" : "no-reorder"
  );
  sortByRef.current = terms.sortBy;
  

  const sorting = query.sortBy || subforumDefaultSorting
  const selectedSorting = useMemo(() => sortOptions.find((opt) => opt.value === sorting) || sortOptions[0], [sorting])

  const handleSortingSelect = (option: Option) => {
    const currentQuery = isEmpty(query) ? {sortBy: subforumDefaultSorting} : query
    const newQuery = {...currentQuery, sortBy: option.value}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
    captureEvent("subforumSortingChanged", {oldSorting: currentQuery.sortBy, newSorting: option.value})
  };
  const isSubscribed = currentUser && currentUser.profileTagIds?.includes(tag._id)

  useEffect(() => {
    recalculateTopAbsolutePosition()
    window.addEventListener('resize', recalculateTopAbsolutePosition)
    return () => window.removeEventListener('resize', recalculateTopAbsolutePosition)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recalculateTopAbsolutePosition = () => {
    if (!bodyRef.current) return

    // We want the position relative to the top of the page, not the top of the viewport, so add window.scrollY
    const newPos = bodyRef.current.getBoundingClientRect().top + window.scrollY
    if (newPos !== topAbsolutePosition)
      setTopAbsolutePosition(newPos)
  }

  const {CommentsTimeline, InlineSelect, CommentsNewForm, Typography, SubforumSubscribeSection} = Components

  if (loading && !results) {
    return <Components.Loading />;
  } else if (!results) {
    return null;
  }

  return (
    <div
      ref={bodyRef}
      className={classNames(classes.root, { [classes.maxWidthRoot]: !tag })}
      style={{ height: `calc(100vh - ${topAbsolutePosition}px)` }}
    >
      <CommentsTimeline
        treeOptions={{
          refetch,
          postPage: true,
          tag: tag,
        }}
        comments={orderedResults}
        loadMoreComments={loadMore}
        loadingMoreComments={loadingMore}
      />
      {/* TODO add permissions check here */}
      {isSubscribed ? (
        <>
          <Typography
            variant="body2"
            component='span'
            className={classes.sortBy}
          >
            <span>Sorted by <InlineSelect options={sortOptions} selected={selectedSorting} handleSelect={handleSortingSelect} /></span>
          </Typography>
          <div id="posts-thread-new-comment" className={classes.newComment}>
            <CommentsNewForm
              tag={tag}
              tagCommentType={TagCommentType.Subforum}
              formProps={{
                editorHintText: `Message...`,
              }}
              successCallback={refetch}
              type="comment"
              enableGuidelines={false}
              displayMode="minimalist" />
          </div>
        </>
      ) : (
        <SubforumSubscribeSection
          tag={tag}
          className={classNames(classes.newComment, classes.joinButton)}
        />
      )}
    </div>
  );
}

const SubforumCentralFeedComponent = registerComponent('SubforumCentralFeed', SubforumCentralFeed, {
  areEqual: {
    terms: "deep",
  },
  styles,
});

declare global {
  interface ComponentTypes {
    SubforumCentralFeed: typeof SubforumCentralFeedComponent
  }
}
