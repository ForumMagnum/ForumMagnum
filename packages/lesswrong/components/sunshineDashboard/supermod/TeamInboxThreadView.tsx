import React from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import ConversationContents from '@/components/messaging/ConversationContents';
import RejectionNotice from '@/components/posts/PostsPage/RejectionNotice';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { commentGetPageUrl } from '@/lib/collections/comments/helpers';
import LLMScoreBadge from './LLMScoreBadge';
import type { InboxAction } from './inboxReducer';
import type { TeamInboxThread } from './teamInboxThreads';

const UpdateRejectionAppealMutation = gql(`
  mutation updateRejectionAppealTeamInboxThreadView($selector: SelectorInput!, $data: UpdateRejectionAppealDataInput!) {
    updateRejectionAppeal(selector: $selector, data: $data) {
      data {
        ...RejectionAppealsModerationInfo
      }
    }
  }
`);

const UpdateTeamInboxConversationMutation = gql(`
  mutation updateConversationTeamInboxThreadView($selector: SelectorInput!, $data: UpdateConversationDataInput!) {
    updateConversation(selector: $selector, data: $data) {
      data {
        ...TeamInboxConversation
      }
    }
  }
`);

const styles = defineStyles('TeamInboxThreadView', (theme: ThemeType) => ({
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
    overflow: 'auto',
    maxHeight: '50%',
  },
  appealedContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  resolveNote: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  button: {
    fontSize: 13,
    padding: '6px 12px',
    minWidth: 'auto',
  },
  conversation: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

interface AppealedContentInfo {
  _id: string;
  label: string;
  url: string;
  html: string | null | undefined;
  evaluations: AutomatedContentEvaluationsFragment | null;
  rejectedReason: string | null;
  contentType: 'Post' | 'Comment';
}

function getAppealedContentInfo({ post, comment }: RejectionAppealsModerationInfo): AppealedContentInfo | null {
  if (post) {
    return {
      _id: post._id,
      label: `Post: ${post.title}`,
      url: postGetPageUrl(post),
      html: post.contents?.html,
      evaluations: post.automatedContentEvaluations,
      rejectedReason: post.rejectedReason,
      contentType: 'Post',
    };
  }
  if (comment) {
    return {
      _id: comment._id,
      label: `Comment on ${comment.post?.title ?? 'unknown post'}`,
      url: commentGetPageUrl(comment),
      html: comment.contents?.html,
      evaluations: comment.automatedContentEvaluations,
      rejectedReason: comment.rejectedReason,
      contentType: 'Comment',
    };
  }
  return null;
}

const AppealedContent = ({ appeal }: { appeal: RejectionAppealsModerationInfo }) => {
  const classes = useStyles(styles);
  const content = getAppealedContentInfo(appeal);
  if (!content) return null;

  return <>
    <div className={classes.appealedContent}>
      <Link to={content.url}>{content.label}</Link>
      <LLMScoreBadge
        documentId={content._id}
        automatedContentEvaluations={content.evaluations}
        contentHtml={content.html ?? ''}
        contentType={content.contentType}
        showWhenEmpty
      />
    </div>
    <RejectionNotice rejectedReason={content.rejectedReason} />
  </>;
};

const TeamInboxThreadView = ({ thread, currentUser, dispatch }: {
  thread: TeamInboxThread | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const [updateAppeal] = useMutation(UpdateRejectionAppealMutation);
  const [updateConversation] = useMutation(UpdateTeamInboxConversationMutation);

  if (!thread) {
    return <div className={classes.root}>
      <div className={classes.empty}>Select a conversation</div>
    </div>;
  }

  const { conversation, appeal } = thread;

  const resolveAppeal = async (status: 'approved' | 'denied') => {
    if (!appeal) return;
    const { data } = await updateAppeal({ variables: { selector: { _id: appeal._id }, data: { status } } });
    const updatedAppeal = data?.updateRejectionAppeal?.data;
    if (updatedAppeal) {
      dispatch({ type: 'UPDATE_THREAD', thread: { conversation, appeal: updatedAppeal } });
    }
  };

  const markHandled = async () => {
    await updateConversation({ variables: { selector: { _id: conversation._id }, data: { awaitingModeratorReply: false } } });
    dispatch({ type: 'REMOVE_THREAD', conversationId: conversation._id });
  };

  return (
    <div className={classes.root}>
      <div className={classes.actionsSection}>
        {appeal && <AppealedContent appeal={appeal} />}
        <div className={classes.buttonRow}>
          {appeal?.status === 'open'
            ? <>
              <Button className={classes.button} onClick={() => void resolveAppeal('approved')}>Approve (unreject)</Button>
              <Button className={classes.button} onClick={() => void resolveAppeal('denied')}>Deny</Button>
              <span className={classes.resolveNote}>The user gets an automated message with the outcome.</span>
            </>
            : <Button className={classes.button} onClick={() => void markHandled()}>Mark handled</Button>}
        </div>
      </div>
      <div className={classes.conversation} key={conversation._id}>
        <ConversationContents conversation={conversation} currentUserId={currentUser._id} />
      </div>
    </div>
  );
};

export default TeamInboxThreadView;
