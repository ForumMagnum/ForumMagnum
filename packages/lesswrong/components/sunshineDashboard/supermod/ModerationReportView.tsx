import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import DeleteIcon from '@/lib/vendor/@material-ui/icons/src/Delete';
import { Link } from '@/lib/reactRouterWrapper';
import FormatDate from '@/components/common/FormatDate';
import UsersName from '@/components/users/UsersName';
import CommentsNode from '@/components/comments/CommentsNode';
import PostsPageWrapper from '@/components/posts/PostsPage/PostsPageWrapper';
import KeystrokeDisplay from './KeystrokeDisplay';
import ModerationCommentPostContext from './ModerationCommentPostContext';
import ModerationUserBioColumn from './ModerationUserBioColumn';
import type { InboxAction } from './inboxReducer';
import { getReportSubject } from './reports';
import { useReportActions } from './useReportActions';

const styles = defineStyles('ModerationReportView', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  actionsSection: {
    padding: 16,
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    flexShrink: 0,
  },
  subject: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 8,
  },
  kind: {
    fontSize: 11,
    fontWeight: 400,
    padding: '1px 6px',
    backgroundColor: theme.palette.greyAlpha(0.08),
    color: theme.palette.greyAlpha(0.6),
  },
  description: {
    fontSize: 15,
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap',
    margin: '12px 0 8px',
  },
  meta: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginBottom: 4,
  },
  spam: {
    color: theme.palette.error.main,
    fontWeight: 500,
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  button: {
    fontSize: 13,
    padding: '6px 12px',
    minWidth: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  buttonIcon: {
    width: 14,
    marginRight: 4,
  },
  contentSection: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: theme.palette.background.paper,
  },
  postWrapper: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    paddingTop: 48,
  },
  commentsNode: {
    '& .comments-node': {
      borderTop: 'unset',
      borderLeft: 'unset',
      borderRight: 'unset',
    },
  },
  userSection: {
    padding: 16,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

const ReportedContent = ({ report }: { report: UnclaimedReportsList }) => {
  const classes = useStyles(styles);
  const { comment, post, reportedUser } = report;

  if (comment) {
    return <div className={classes.commentsNode}>
      {comment.postId && <ModerationCommentPostContext postId={comment.postId} showOpeningText={!comment.parentCommentId} />}
      <CommentsNode
        treeOptions={{
          post: comment.post ?? undefined,
          tag: comment.tag ?? undefined,
          showPostTitle: !comment.postId,
        }}
        comment={comment}
        forceUnTruncated
        forceUnCollapsed
        showParentDefault
      />
    </div>;
  }
  if (post) {
    return <div className={classes.postWrapper}>
      <PostsPageWrapper documentId={post._id} sequenceId={null} embedded />
    </div>;
  }
  if (reportedUser) {
    return <div className={classes.userSection}>
      <ModerationUserBioColumn user={reportedUser} />
    </div>;
  }
  return null;
};

const ModerationReportView = ({
  report,
  currentUser,
  dispatch,
}: {
  report: UnclaimedReportsList | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const { markAsReviewed, deleteContent } = useReportActions(report, currentUser, dispatch);

  if (!report) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          Select a report to review
        </div>
      </div>
    );
  }

  const subject = getReportSubject(report);

  return (
    <div className={classes.root}>
      <div className={classes.actionsSection}>
        <div className={classes.subject}>
          <span className={classes.kind}>{subject.kind}</span>
          <Link to={subject.url}>{subject.title}</Link>
        </div>
        {subject.author && <div className={classes.meta}>
          {subject.kind === 'User' ? 'User' : 'Author'}: <UsersName user={subject.author} />
          {' · '}
          {/* Opens in a new tab, since the inbox only reads the user param when it first loads */}
          <Link to={`/admin/supermod?user=${subject.author._id}`} target="_blank">Review user in Supermod</Link>
        </div>}
        {report.description && <div className={classes.description}>"{report.description}"</div>}
        <div className={classes.meta}>
          Reported by <UsersName user={report.user} />, <FormatDate date={report.createdAt} /> ago
          {report.reportedAsSpam && <span className={classes.spam}> · Reported as spam</span>}
        </div>
        <div className={classes.buttonRow}>
          <Button onClick={markAsReviewed} className={classes.button}>
            <DoneIcon className={classes.buttonIcon} />
            Mark Reviewed
            <KeystrokeDisplay keystroke="R" withMargin />
          </Button>
          {(report.comment || report.post) && <Button onClick={deleteContent} className={classes.button}>
            <DeleteIcon className={classes.buttonIcon} />
            Delete {report.comment ? 'Comment' : 'Post'} (Spam)
            <KeystrokeDisplay keystroke="D" withMargin />
          </Button>}
        </div>
      </div>
      <div className={classes.contentSection} key={report._id}>
        <ReportedContent report={report} />
      </div>
    </div>
  );
};

export default ModerationReportView;
