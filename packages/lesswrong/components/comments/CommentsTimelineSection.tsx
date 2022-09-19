import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import * as _ from 'underscore';
import { NEW_COMMENT_MARGIN_BOTTOM } from './CommentsListSection';
import { TagCommentType } from '../../lib/collections/comments/schema';
import { Option } from '../common/SelectSorting';
import { isEmpty } from 'underscore';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs';

const sortOptions: Option[] = [
  {value: "new", label: "New"},
  {value: "recentDiscussion", label: "Recent Discussion"},
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
  sortBy: {
    marginLeft: 8,
    marginTop: 14,
    marginBottom: 4,
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
  newForm=true,
  refetch = () => {},
  classes,
}: {
  tag?: TagBasicInfo,
  commentCount: number,
  loadMoreCount: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  comments: CommentWithRepliesFragment[],
  parentAnswerId?: string,
  startThreadTruncated?: boolean,
  newForm: boolean,
  refetch?: any,
  classes: ClassesType,
}) => {
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;

  const bodyRef = useRef<HTMLDivElement>(null)
  // topAbsolutePosition is set to make it exactly fill the page, 200 is about right so setting that as a default reduces the visual jitter
  const [topAbsolutePosition, setTopAbsolutePosition] = useState(200)
  const selectedSorting = useMemo(() => sortOptions.find((opt) => opt.value === query.sortBy) || sortOptions[0], [query.sortBy])

  const handleSortingSelect = (option: Option) => {
    const currentQuery = isEmpty(query) ? {sortBy: 'new'} : query
    const newQuery = {...currentQuery, sortBy: option.value}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  useEffect(() => {
    recalculateTopAbsolutePosition()
    window.addEventListener('resize', recalculateTopAbsolutePosition)
    return () => window.removeEventListener('resize', recalculateTopAbsolutePosition)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const recalculateTopAbsolutePosition = () => {
    if (bodyRef.current && bodyRef.current.getBoundingClientRect().top !== topAbsolutePosition)
      setTopAbsolutePosition(bodyRef.current.getBoundingClientRect().top)
  }
  
  const {CommentsTimeline, SelectSorting, CommentsNewForm, Typography} = Components

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
      {newForm && (
        <>
          <Typography
          variant="body2"
          component='span'
          className={classes.sortBy}>
            <span>Sorted by <SelectSorting options={sortOptions} selected={selectedSorting} handleSelect={handleSortingSelect} /></span>
          </Typography>
          <div id="posts-thread-new-comment" className={classes.newComment}>
          <CommentsNewForm
            tag={tag}
            tagCommentType={TagCommentType.Subforum}
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
        </div></>
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

