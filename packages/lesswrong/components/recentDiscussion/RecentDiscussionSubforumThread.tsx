import React, {useState, useCallback} from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'
import { tagGetDiscussionUrl, tagGetSubforumUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { truncate } from '../../lib/editor/ellipsize';
import { useRecordTagView } from '../hooks/useRecordPostView';
import type { CommentTreeOptions } from '../comments/commentTree';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { TagCommentType } from '../../lib/collections/comments/types';
import { useOrderPreservingArray } from '../hooks/useOrderPreservingArray';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.commentStyle,
    fontVariant: "small-caps",
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "1.75rem",
  },
  subforumTitleRow: {
    display: 'flex',
    columnGap: 7,
    marginBottom: 12,
    '& svg': {
      height: 20,
      width: 20,
      fill: theme.palette.grey[700]
    }
  },
  subforumIcon: {
    marginTop: 2
  },
  subforumTitleText: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 12
  },
  subforumTitle: {
    color: theme.palette.grey[900],
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 20,
    lineHeight: '25px',
  },
  subforumSubtitle: {
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '18px',
    marginTop: 4,
    marginLeft: 1
  },
  tag: {
    paddingTop: 18,
    paddingLeft: 16,
    paddingRight: 16,
    background: theme.palette.panelBackground.default,
    borderRadius: 3,
    marginBottom:4
  },
  content: {
    padding: '0 4px 4px 16px',
    [theme.breakpoints.down('sm')]: {
      padding: '0 4px 1px 4px',
    }
  },
  metadata: {
    fontSize: "1.1rem",
    color: theme.palette.text.dim3,
    ...theme.typography.commentStyle,
  },
});

const RecentDiscussionSubforumThread = ({ comment, tag, refetch = () => {}, expandAllThreads: initialExpandAllThreads, classes }: {
  comment: CommentWithRepliesFragment,
  tag: TagBasicInfo|null,
  refetch?: any,
  expandAllThreads?: boolean
  classes: ClassesType
}) => {
  const { CommentWithReplies, TopTagIcon } = Components;

  const [expandAllThreads, setExpandAllThreads] = useState(false)
  const [readStatus, setReadStatus] = useState(false)
  // const {recordTagView} = useRecordTagView(tag);
  const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null)
  
  // const lastVisitedAt = markedAsVisitedAt || tag.lastVisitedAt
  // const lastCommentId = comments && comments[0]?._id
  // const nestedComments = useOrderPreservingArray(unflattenComments(comments), (comment) => comment._id);
  
  // const markAsRead = useCallback(
  //   () => {
  //     setReadStatus(true);
  //     setMarkedAsVisitedAt(new Date());
  //     setExpandAllThreads(true);
  //     recordTagView({tag, extraEventProperties: {type: 'recentDiscussionSubforumClick'}})
  //   },
  //   [recordTagView, tag]
  // )
  
  // const commentTreeOptions: CommentTreeOptions = {
  //   refetch,
  //   scrollOnExpand: true,
  //   lastCommentId: lastCommentId,
  //   markAsRead: markAsRead,
  //   highlightDate: lastVisitedAt,
  //   tag: tag,
  //   condensed: true,
  //   replyFormStyle: "minimalist",
  // }
  
  if (!tag) return null
  
  const commentNodeProps = {
    treeOptions: {
      postPage: true,
      refetch,
      // markAsRead: markAsRead,
      // highlightDate: lastVisitedAt,
      // tag,
      showPostTitle: false,
      condensed: true,
      replyFormStyle: "minimalist" as const,
    },
    startThreadTruncated: true,
    isChild: false,
    enableGuidelines: false,
    displayMode: "minimalist" as const,
    shortform: false
  }
    
  return <div className={classes.root}>
    <div className={classes.tag}>
      <div className={classes.subforumTitleRow}>
        <div className={classes.subforumIcon}>
          <TopTagIcon tag={tag} />
        </div>
        <div className={classes.subforumTitleText}>
          <Link to={tagGetSubforumUrl(tag)} className={classes.subforumTitle}>{tag.name}</Link>
          <div className={classes.subforumSubtitle}>Subforum discussion</div>
        </div>
      </div>
    </div>
    
    <div className={classes.content}>
      <CommentWithReplies
        comment={comment}
        commentNodeProps={commentNodeProps}
        initialMaxChildren={5}
        startExpanded={initialExpandAllThreads || expandAllThreads}
      />
    </div>
  </div>
}

const RecentDiscussionSubforumThreadComponent = registerComponent(
  'RecentDiscussionSubforumThread', RecentDiscussionSubforumThread, {
    styles,
    hocs: [withErrorBoundary],
  }
);

declare global {
  interface ComponentTypes {
    RecentDiscussionSubforumThread: typeof RecentDiscussionSubforumThreadComponent,
  }
}
