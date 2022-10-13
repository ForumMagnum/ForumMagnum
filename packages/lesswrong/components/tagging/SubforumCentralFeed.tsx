import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useOrderPreservingArray } from '../hooks/useOrderPreservingArray';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useTracking } from '../../lib/analyticsEvents';
import { subforumDefaultSorting } from '../../lib/collections/comments/views';
import classNames from 'classnames';
import { useOnWindowResize } from '../hooks/useOnWindowResize';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import type { Option } from '../common/InlineSelect';

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
})
const SubforumCentralFeed = ({ tag, sortBy, classes }: {
  tag: TagBasicInfo,
  sortBy: string,
  classes: ClassesType,
}) => {
  const { loading, results, loadMore, loadingMore, refetch } = useMulti({
    terms: { 
      tagId: tag._id,
      view: "tagSubforumComments",
      limit: 50,
      sortBy
    },
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
  const recordSubforumView = useCallback(
    async () => recordSubforumViewMutation({
      variables: {userId: currentUser?._id, tagId: tag._id}
    }),
    [currentUser?._id, tag, recordSubforumViewMutation],
  );

  useEffect(() => {
    if (results && results.length)
      void recordSubforumView();
  }, [results, recordSubforumView]);
  
  const sortByRef = useRef(sortBy);
  const orderedResults = useOrderPreservingArray(
    results || [],
    (comment) => comment._id,
    // If the selected sort order changes, clear the existing ordering
    sortByRef.current === sortBy ? "interleave-new" : "no-reorder"
  );
  sortByRef.current = sortBy;
  
  const handleSortingSelect = (option: Option) => {
    const currentQuery = isEmpty(query) ? {sortBy: subforumDefaultSorting} : query
    const newQuery = {...currentQuery, sortBy: option.value}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
    captureEvent("subforumSortingChanged", {oldSorting: currentQuery.sortBy, newSorting: option.value})
  };

  const sorting = query.sortBy || subforumDefaultSorting

  const selectedSorting = useMemo(() => sortOptions.find((opt) => opt.value === sorting) || sortOptions[0], [sorting])

  const bodyRef = useRef<HTMLDivElement>(null)
  // topAbsolutePosition is set to make it exactly fill the page, 200 is about right so setting that as a default reduces the visual jitter
  const [topAbsolutePosition, setTopAbsolutePosition] = useState(200)

  const recalculateTopAbsolutePosition = useCallback(() => {
    if (!bodyRef.current) return

    // We want the position relative to the top of the page, not the top of the viewport, so add window.scrollY
    const newPos = bodyRef.current.getBoundingClientRect().top + window.scrollY
    if (newPos !== topAbsolutePosition)
      setTopAbsolutePosition(newPos)
  }, [topAbsolutePosition])
  
  useOnWindowResize(recalculateTopAbsolutePosition, true)

  const {CommentsTimeline, SubforumSubscribeOrCommentSection} = Components

  if (loading && !results) {
    return <Components.Loading />;
  } else if (!results) {
    return null;
  }

  const treeOptions = {
    refetch,
    postPage: true,
    tag: tag,
  }

  return (
    <div
      ref={bodyRef}
      className={classNames(classes.root, { [classes.maxWidthRoot]: !tag })}
      style={{ height: `calc(100vh - ${topAbsolutePosition}px)` }}
    >
      <CommentsTimeline
        treeOptions={treeOptions}
        comments={orderedResults}
        loadMoreComments={loadMore}
        loadingMoreComments={loadingMore}
      />
      {/* TODO add permissions check here */}
      <SubforumSubscribeOrCommentSection
        tag={tag}
        sortOptions={sortOptions}
        selectedSorting={selectedSorting}
        handleSortingSelect={handleSortingSelect}
        refetch={refetch}
      />
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
