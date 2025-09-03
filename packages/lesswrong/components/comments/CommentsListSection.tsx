import React, { useEffect, useMemo, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import moment from 'moment';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import { Menu } from '@/components/widgets/Menu';
import { useCurrentUser } from '../common/withUser';
import { unflattenComments } from '../../lib/utils/unflatten';
import classNames from 'classnames';
import { filter } from 'underscore';
import { postGetCommentCountStr } from '../../lib/collections/posts/helpers';
import CommentsNewForm, { CommentsNewFormProps } from './CommentsNewForm';
import { Link } from '../../lib/reactRouterWrapper';
import { isEAForum } from '../../lib/instanceSettings';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';

import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import CommentsViews from "./CommentsViews";
import Loading from "../vulcan-core/Loading";
import CalendarDate from "../common/CalendarDate";
import LastVisitList from "./LastVisitList";
import CantCommentExplanation from "./CantCommentExplanation";
import LWTooltip from "../common/LWTooltip";
import CommentsList from "./CommentsList";
import PostsPageCrosspostComments from "../posts/PostsPage/PostsPageCrosspostComments";
import MetaInfo from "../common/MetaInfo";
import Row from "../common/Row";
import QuickTakesEntry from "../quickTakes/QuickTakesEntry";
import SimpleDivider from "../widgets/SimpleDivider";
import CommentsListMeta from "./CommentsListMeta";
import { Typography } from "../common/Typography";
import { MenuItem } from "../common/Menus";
import { NEW_COMMENT_MARGIN_BOTTOM } from './constants';
import CommentsDraftList from './CommentsDraftList';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { CommentTreeOptions } from './commentTree';

const styles = defineStyles("CommentsListSection", (theme: ThemeType) => ({
  root: {
    fontWeight: theme.typography.body1.fontWeight ?? 400,
    margin: "0px auto 15px auto",
    ...theme.typography.commentStyle,
    position: "relative"
  },
  maxWidthRoot: {
    maxWidth: 720,
  },
  commentsHeadline: {
    fontSize: 24,
    lineHeight: '36px',
    fontWeight: 600,
    marginBottom: 16
  },
  commentCount: {
    color: theme.palette.grey[600],
    marginLeft: 10
  },
  commentSorting: {
    display: 'inline',
    color: theme.palette.text.secondary,
    marginRight: 12,
  },
  clickToHighlightNewSince: {
    display: 'inline',
    color: theme.palette.text.secondary,
    "@media print": { display: "none" },
  },
  button: {
    color: theme.palette.lwTertiary.main,
  },
  newComment: {
    border: theme.palette.border.commentBorder,
    position: 'relative',
    borderRadius: theme.borderRadius.small,
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    "@media print": {
      display: "none"
    }
  },
  newQuickTake: {
    border: "none",
  },
  newCommentLabel: {
    paddingLeft: theme.spacing.unit*1.5,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
    marginTop: 12
  },
  newCommentSublabel: {
    paddingLeft: theme.spacing.unit*1.5,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginTop: theme.isFriendlyUI ? 8 : 4,
    fontStyle: "italic",
  }
}))

const CommentsListSection = ({
  post,
  tag,
  commentCount,
  loadMoreCount,
  totalComments,
  loadMoreComments,
  loadingMoreComments,
  loading,
  comments,
  parentAnswerId,
  startThreadTruncated,
  newForm=true,
  newFormProps={},
  highlightDate,
  hideDateHighlighting,
  setHighlightDate,
  treeOptions: treeOptionsOverride,
}: {
  post?: PostsDetails,
  tag?: TagBasicInfo,
  commentCount: number,
  loadMoreCount?: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  loading?: boolean,
  comments: CommentsList[],
  parentAnswerId?: string,
  startThreadTruncated?: boolean,
  newForm: boolean,
  newFormProps?: Partial<CommentsNewFormProps>,
  highlightDate: Date|undefined,
  hideDateHighlighting?: boolean,
  setHighlightDate: (newValue: Date|undefined) => void,
  treeOptions?: Partial<CommentTreeOptions>,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const commentTree = useMemo(() => unflattenComments(comments), [comments]);
  const [restoreScrollPos, setRestoreScrollPos] = useState(-1);

  useEffect(() => {
    if (restoreScrollPos === -1) return;

    window.scrollTo({top: restoreScrollPos})
    setRestoreScrollPos(-1);
  }, [restoreScrollPos])

  // TODO: Update "author has blocked you" message to include link to moderation guidelines (both author and LW)

  const postAuthor = post?.user || null;

  const userIsDebateParticipant =
    currentUser
    && post?.debate
    && (currentUser._id === postAuthor?._id || post?.coauthorStatuses?.some(coauthor => coauthor.userId === currentUser._id));
    
  const commentCountNode = !!totalComments && <span className={classes.commentCount}>{totalComments}</span>
  
  const treeOptions: CommentTreeOptions = useMemo(() => ({
    highlightDate: highlightDate,
    post: post,
    postPage: true,
    showCollapseButtons: true,
    tag: tag,
    ...treeOptionsOverride,
  }), [highlightDate, post, tag, treeOptionsOverride]);

  return (
    <div className={classNames(classes.root, {[classes.maxWidthRoot]: !tag})}>
      <div id="comments"/>
      {isFriendlyUI && (newForm || !!totalComments) && !post?.shortform &&
        <div className={classes.commentsHeadline}>
          Comments{commentCountNode}
        </div>
      }

      {newForm
        && (!currentUser || !post || userIsAllowedToComment(currentUser, post, postAuthor, false))
        && (!post?.draft || userIsDebateParticipant || userIsAdmin(currentUser))
        && (
        <div
          id="posts-thread-new-comment"
          className={classNames(classes.newComment, {
            [classes.newQuickTake]: isEAForum && post?.shortform,
          })}
        >
          {!isEAForum && <div className={classes.newCommentLabel}>{preferredHeadingCase("New Comment")}</div>}
          {post?.isEvent && !!post.rsvps?.length && (
            <div className={classes.newCommentSublabel}>
              Everyone who RSVP'd to this event will be notified.
            </div>
          )}
          {isEAForum && post?.shortform
            ? <QuickTakesEntry currentUser={currentUser} />
            : (
              <CommentsNewForm
                post={post}
                tag={tag}
                prefilledProps={{
                  parentAnswerId: parentAnswerId,
                  ...(userIsDebateParticipant ? { debateResponse: true } : {})
                }}
                interactionType="comment"
                {...newFormProps}
                {...(userIsDebateParticipant ? { formProps: { post } } : {})}
              />
            )
          }
        </div>
      )}
      {currentUser && post && !userIsAllowedToComment(currentUser, post, postAuthor, false) &&
        <CantCommentExplanation post={post}/>
      }
      {currentUser && post && <CommentsDraftList userId={currentUser._id} postId={post._id} initialLimit={1} showTotal silentIfEmpty />}
      {totalComments ? <CommentsListSectionTitle
        post={post}
        commentCount={commentCount}
        loadMoreCount={loadMoreCount}
        totalComments={totalComments}
        loadMoreComments={loadMoreComments}
        loadingMoreComments={loadingMoreComments}
        comments={comments}
        highlightDate={highlightDate}
        hideDateHighlighting={hideDateHighlighting}
        setHighlightDate={setHighlightDate}
        setRestoreScrollPos={setRestoreScrollPos}
      /> : null}
      <CommentsList
        treeOptions={treeOptions}
        totalComments={totalComments}
        comments={commentTree}
        startThreadTruncated={startThreadTruncated}
        parentAnswerId={parentAnswerId}
        loading={loading}
      />
      <PostsPageCrosspostComments />
      {!isEAForum && <Row justifyContent="flex-end">
        <LWTooltip title="View deleted comments and banned users">
          <Link to="/moderation">
            <MetaInfo>Moderation Log</MetaInfo>
          </Link>
        </LWTooltip>
      </Row>}
    </div>
  );
}

function CommentsListSectionTitle({
  post,
  commentCount,
  loadMoreCount,
  totalComments,
  loadMoreComments,
  loadingMoreComments,
  comments,
  highlightDate,
  hideDateHighlighting,
  setHighlightDate,
  setRestoreScrollPos,
}: {
  post?: PostsDetails,
  commentCount: number,
  loadMoreCount?: number,
  totalComments: number,
  loadMoreComments: any,
  loadingMoreComments: boolean,
  comments: CommentsList[],
  highlightDate: Date|undefined,
  hideDateHighlighting?: boolean,
  setHighlightDate: (newValue: Date|undefined) => void,
  setRestoreScrollPos: (newValue: number) => void,
}) {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const newCommentsSinceDate = highlightDate
    ? filter(
      comments,
      (comment) => new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime(),
    ).length
    : 0;
  const now = useCurrentTime();

  const [anchorEl,setAnchorEl] = useState<HTMLElement|null>(null);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  }

  const handleDateChange = (date: Date) => {
    setHighlightDate(date)
    setAnchorEl(null);
  }


  const suggestedHighlightDates = [moment(now).subtract(1, 'day'), moment(now).subtract(1, 'week'), moment(now).subtract(1, 'month'), moment(now).subtract(1, 'year')]
  const newLimit = commentCount + (loadMoreCount || commentCount)
  let commentSortNode = (commentCount < totalComments) ?
    <span>
      Rendering {commentCount}/{totalComments} comments, sorted by <CommentsViews post={post} setRestoreScrollPos={setRestoreScrollPos} />
      {loadingMoreComments ? <Loading /> : <a onClick={() => loadMoreComments(newLimit)}> (show more) </a>}
    </span> :
    <span>
      {postGetCommentCountStr(post, totalComments)}, sorted by <CommentsViews post={post} setRestoreScrollPos={setRestoreScrollPos} />
    </span>
  if (isFriendlyUI) {
    commentSortNode = <>Sorted by <CommentsViews post={post} setRestoreScrollPos={setRestoreScrollPos} /></>
  }

  const contentType = isEAForum && post?.shortform
    ? "quick takes"
    : "comments";

  return <CommentsListMeta>
    <Typography
      variant="body2"
      component='span'
      className={classes.commentSorting}
    >
      {commentSortNode}
    </Typography>
    {post && !hideDateHighlighting && <Typography
      variant="body2"
      component='span'
      className={classes.clickToHighlightNewSince}
    >
      {highlightDate && newCommentsSinceDate>0 && `Highlighting ${newCommentsSinceDate} new ${contentType} since `}
      {highlightDate && !newCommentsSinceDate && `No new ${contentType} since `}
      {!highlightDate && `Click to highlight new ${contentType} since: `}
      <a className={classes.button} onClick={handleClick}>
        <CalendarDate date={highlightDate || now}/>
      </a>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {currentUser && post && <LastVisitList
          postId={post._id}
          currentUser={currentUser}
          clickCallback={handleDateChange}/>}
        <SimpleDivider />
        {suggestedHighlightDates.map(date => {
          return <MenuItem key={date.toString()} onClick={() => handleDateChange(date.toDate())}>
            {date.calendar().toString()}
          </MenuItem>
        })}
      </Menu>
    </Typography>}
  </CommentsListMeta>
}

export default registerComponent("CommentsListSection", CommentsListSection, {
  areEqual: "auto"
});


