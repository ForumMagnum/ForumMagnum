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
import { CommentsNodeProps } from '../comments/CommentsNode';
import { CommentFormDisplayMode } from '../comments/CommentsNewForm';

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
  button: {
    color: theme.palette.lwTertiary.main
  },
  nestedScroll: {
    overflowY: 'scroll',
    marginTop: 'auto',
    padding: '0px 10px',
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
  const orderedComments = useOrderPreservingArray(
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

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // topAbsolutePosition is set to make it exactly fill the page, 200 is about right so setting that as a default reduces the visual jitter
  const [topAbsolutePosition, setTopAbsolutePosition] = useState(200)

  const recalculateTopAbsolutePosition = useCallback(() => {
    if (!scrollContainerRef.current) return

    // We want the position relative to the top of the page, not the top of the viewport, so add window.scrollY
    const newPos = scrollContainerRef.current.getBoundingClientRect().top + window.scrollY
    if (newPos !== topAbsolutePosition)
      setTopAbsolutePosition(newPos)
  }, [topAbsolutePosition])
  
  useOnWindowResize(recalculateTopAbsolutePosition, true)

  const scrollContentsRef = useRef<HTMLDivElement|null>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Scroll to the bottom when the page loads
  const currentHeight = scrollContentsRef.current?.clientHeight;
  useEffect(() => {
    if (!userHasScrolled && scrollContentsRef.current) {
      scrollContentsRef.current?.scrollTo(0, scrollContentsRef.current.scrollHeight);

      // For mobile: scroll the entire page to the bottom to stop the address bar from
      // forcing the bottom off the end of the page. On desktop this just does nothing
      // because the page fills the screen exactly
      window.scrollTo({
        top: 500,
        // 'smooth' is to try and encourage it to scroll the address bar off the scree rather than overlaying it
        behavior: 'smooth'
      });
    }
  }, [currentHeight, userHasScrolled])

  const { CommentWithReplies, Typography, SubforumSubscribeOrCommentSection, Loading } = Components;

  const handleScroll = (e) => {
    const isAtBottom = Math.abs((e.target.scrollHeight - e.target.scrollTop) - e.target.clientHeight) < 10;

    // If we are not at the bottom that means the user has scrolled up,
    // in which case never autoscroll to the bottom again
    if (!isAtBottom)
      setUserHasScrolled(true);

    // Start loading more when we are less than 1 page from the top
    // if (!loadingMoreComments && commentCount < totalComments && e.target.scrollTop < e.target.clientHeight)
    //   loadMoreComments(commentCount + loadMoreCount);
  }

  const commentsToRender = useMemo(() => orderedComments.slice().reverse(), [orderedComments]);

  if (!orderedComments) {
    return (
      <Typography variant="body1">
        <p>No comments to display.</p>
      </Typography>
    );
  }
  
  const commentNodeProps: Partial<CommentsNodeProps> = {
    treeOptions: {
      refetch,
      postPage: true,
      tag: tag,
    },
    startThreadTruncated: true,
    isChild: false,
    enableGuidelines: false,
    displayMode: "minimalist" as CommentFormDisplayMode,
  }

  if (loading && !results) {
    return <Loading />;
  } else if (!results) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      className={classNames(classes.root, { [classes.maxWidthRoot]: !tag })}
      style={{ height: `calc(100vh - ${topAbsolutePosition}px)` }}
    >
      <div className={classes.nestedScroll} ref={scrollContentsRef} onScroll={handleScroll}>
        {loadingMore ? <Loading /> : <></>}
        {commentsToRender.map((comment) => (
          <CommentWithReplies
            comment={comment}
            key={comment._id}
            commentNodeProps={commentNodeProps}
            initialMaxChildren={5}
          />
        ))}
      </div>
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
