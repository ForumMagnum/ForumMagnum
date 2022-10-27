import React, { useMemo, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from 'underscore';
import { NEW_COMMENT_MARGIN_BOTTOM } from './CommentsListSection';
import type { Option } from '../common/InlineSelect';
import { isEmpty, omit } from 'underscore';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs';
import { subforumDiscussionDefaultSorting } from '../../lib/collections/comments/views';
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
  sortingParam="sortDiscussionBy",
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
  sortingParam?: string,
  refetch?: any,
  classes: ClassesType,
}) => {
  const { history } = useNavigation();
  const { location, query } = useLocation();
  const { captureEvent } = useTracking()
  const currentUser = useCurrentUser();

  // FIXME "sortBy" is here for backwards compatibility with old links, remove it eventually
  const sorting = query[sortingParam] || query["sortBy"] || subforumDiscussionDefaultSorting
  const selectedSorting = useMemo(() => sortOptions.find((opt) => opt.value === sorting) || sortOptions[0], [sorting])

  const handleSortingSelect = (option: Option) => {
    const currentQuery = isEmpty(query) ? {[sortingParam]: subforumDiscussionDefaultSorting} : omit(query, "sortBy")
    const newQuery = {...currentQuery, [sortingParam]: option.value}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
    captureEvent("subforumSortingChanged", {oldSorting: currentQuery['sortingParameter'], newSorting: option.value})
  };
  const isSubscribed = currentUser && currentUser.profileTagIds?.includes(tag._id)

  const {CommentsTimeline, InlineSelect, CommentsNewForm, Typography, SubforumSubscribeSection} = Components

  return (
    <div className={classNames(classes.root, { [classes.maxWidthRoot]: !tag })}>
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
