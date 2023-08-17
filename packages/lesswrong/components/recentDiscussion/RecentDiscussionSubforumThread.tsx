import React, {useState, useCallback} from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import { tagGetSubforumUrl, tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
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
    marginBottom: 4
  },
  content: {
    padding: '0 4px 4px 16px',
    [theme.breakpoints.down('sm')]: {
      padding: '0 4px 1px 4px',
    }
  },
});

const RecentDiscussionSubforumThread = ({ comment, tag, refetch = () => {}, expandAllThreads: initialExpandAllThreads, classes }: {
  comment: CommentWithRepliesFragment,
  tag: TagBasicInfo|null,
  refetch?: any,
  expandAllThreads?: boolean
  classes: ClassesType
}) => {
  // const currentUser = useCurrentUser()
  // const recordSubforumView = useRecordSubforumView({userId: currentUser?._id, tagId: tag?._id})

  const [expandAllThreads, setExpandAllThreads] = useState(false)
  // const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null)

  // TODO: do we need to default this to be the last time this user viewed the subforum?
  //       also, do we want to use the "highlightDate" option?
  // const lastVisitedAt = markedAsVisitedAt

  // TODO: do we want to count this as a subforum view?
  // const markAsRead = useCallback(
  //   () => {
  //     setMarkedAsVisitedAt(new Date())
  //     setExpandAllThreads(true)
  //     recordSubforumView()
  //   },
  //   [recordSubforumView]
  // )
  
  if (!tag) return null
  
  const { CommentWithReplies, CoreTagIcon } = Components
  
  const commentNodeProps = {
    treeOptions: {
      postPage: true,
      refetch,
      // markAsRead: markAsRead,
      // highlightDate: lastVisitedAt,
      tag,
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
          <CoreTagIcon tag={tag} />
        </div>
        <div className={classes.subforumTitleText}>
          <Link to={tag.isSubforum ? tagGetSubforumUrl(tag) : tagGetUrl(tag)} className={classes.subforumTitle}>{tag.name}</Link>
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
