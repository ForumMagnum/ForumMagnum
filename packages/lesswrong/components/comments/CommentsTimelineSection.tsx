import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from 'underscore';
import { NEW_COMMENT_MARGIN_BOTTOM } from './CommentsListSection';
import type { Option } from '../common/InlineSelect';
import { isEmpty } from 'underscore';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs';
import { subforumDefaultSorting } from '../../lib/collections/comments/views';
import { useTracking } from '../../lib/analyticsEvents';

const sortOptions: Option[] = [
  {value: "new", label: "new"},
  {value: "recentDiscussion", label: "recent discussion"},
]

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontWeight: 400,
    margin: "0px auto 0px auto",
    ...theme.typography.commentStyle,
    position: "relative",
    display: 'flex',
    flexDirection: 'column',
    flexBasis: 0,
    flexGrow: 1,
    width: "100%",
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

const CommentsTimelineSection = ({
  tag,
  commentCount,
  loadMoreCount = 10,
  totalComments,
  loadMoreComments,
  loadingMoreComments,
  comments,
  parentAnswerId,
  startThreadTruncated,
  refetch = () => {},
  classes,
}: {
  tag: TagBasicInfo,
  commentCount: number,
  loadMoreCount: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  comments: CommentWithRepliesFragment[],
  parentAnswerId?: string,
  startThreadTruncated?: boolean,
  refetch?: any,
  classes: ClassesType,
}) => {
  const { history } = useNavigation();
  const { location, query } = useLocation();
  const { captureEvent } = useTracking()
  const currentUser = useCurrentUser();

  const bodyRef = useRef<HTMLDivElement>(null)
  // topAbsolutePosition is set to make it exactly fill the page, 200 is about right so setting that as a default reduces the visual jitter
  const [topAbsolutePosition, setTopAbsolutePosition] = useState(200)

  const sorting = query.sortBy || subforumDefaultSorting
  const selectedSorting = useMemo(() => sortOptions.find((opt) => opt.value === sorting) || sortOptions[0], [sorting])

  const handleSortingSelect = (option: Option) => {
    const currentQuery = isEmpty(query) ? {sortBy: subforumDefaultSorting} : query
    const newQuery = {...currentQuery, sortBy: option.value}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
    captureEvent("subforumSortingChanged", {oldSorting: currentQuery.sortBy, newSorting: option.value})
  };
  const isSubscribed = currentUser && currentUser.profileTagIds?.includes(tag._id)

  // useEffect(() => {
  //   recalculateTopAbsolutePosition()
  //   window.addEventListener('resize', recalculateTopAbsolutePosition)
  //   return () => window.removeEventListener('resize', recalculateTopAbsolutePosition)
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  const recalculateTopAbsolutePosition = () => {
    if (!bodyRef.current) return

    // We want the position relative to the top of the page, not the top of the viewport, so add window.scrollY
    const newPos = bodyRef.current.getBoundingClientRect().top + window.scrollY
    if (newPos !== topAbsolutePosition)
      setTopAbsolutePosition(newPos)
  }

  const {CommentsTimeline, InlineSelect, CommentsNewForm, Typography, SubforumSubscribeSection} = Components

  return (
    <div
      ref={bodyRef}
      className={classNames(classes.root, { [classes.maxWidthRoot]: !tag })}
      // style={{ height: `calc(100vh - ${topAbsolutePosition}px)` }}
    >
      <CommentsTimeline
        treeOptions={{
          refetch,
          postPage: true,
          tag: tag,
        }}
        comments={comments}
        startThreadTruncated={startThreadTruncated}
        parentAnswerId={parentAnswerId}
        commentCount={commentCount}
        loadMoreCount={loadMoreCount}
        totalComments={totalComments}
        loadMoreComments={loadMoreComments}
        loadingMoreComments={loadingMoreComments}
      />
      {/* TODO add permissions check here */}
      {isSubscribed ? (
        <>
          <Typography
          variant="body2"
          component='span'
          className={classes.sortBy}>
            <span>Sorted by <InlineSelect options={sortOptions} selected={selectedSorting} handleSelect={handleSortingSelect} /></span>
          </Typography>
          <div id="posts-thread-new-comment" className={classes.newComment}>
            <CommentsNewForm
              tag={tag}
              tagCommentType={"SUBFORUM"}
              prefilledProps={{
                parentAnswerId: parentAnswerId,
              }}
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

const CommentsTimelineSectionComponent = registerComponent("CommentsTimelineSection", CommentsTimelineSection, {styles});

declare global {
  interface ComponentTypes {
    CommentsTimelineSection: typeof CommentsTimelineSectionComponent,
  }
}
