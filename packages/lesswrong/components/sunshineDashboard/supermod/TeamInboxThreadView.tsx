import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import ConversationContents from '@/components/messaging/ConversationContents';
import RejectionNotice from '@/components/posts/PostsPage/RejectionNotice';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { commentGetPageUrl } from '@/lib/collections/comments/helpers';
import LLMScoreBadge from './LLMScoreBadge';
import type { InboxAction } from './inboxReducer';
import { isTeamInboxThreadOpen, type TeamInboxThread } from './teamInboxThreads';

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
  title: {
    margin: '0 0 12px',
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.4,
    overflowWrap: 'anywhere',
  },
  appealedContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  explanation: {
    whiteSpace: 'pre-wrap',
    margin: '12px 0',
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
  error: {
    color: theme.palette.error.main,
    marginTop: 8,
  },
  statusNote: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  keepOpenLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 16px 0',
    fontSize: 13,
    color: theme.palette.grey[700],
    cursor: 'pointer',
  },
  keepOpenCheckbox: {
    padding: 0,
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
    {appeal.status !== 'approved' && <RejectionNotice rejectedReason={content.rejectedReason} />}
    <div className={classes.explanation}><strong>Appeal:</strong> {appeal.explanation}</div>
  </>;
};

const TeamInboxThreadView = ({ thread, currentUser, dispatch }: {
  thread: TeamInboxThread | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const [error, setError] = useState<string | null>(null);
  const [keepOpenAfterReply, setKeepOpenAfterReply] = useState(false);
  const [updateAppeal, { loading: resolving }] = useMutation(UpdateRejectionAppealMutation);
  const [updateConversation, { loading: updatingConversation }] = useMutation(UpdateTeamInboxConversationMutation);
  const pending = resolving || updatingConversation;

  if (!thread) {
    return <div className={classes.root}>
      <div className={classes.empty}>Select a conversation</div>
    </div>;
  }

  const { conversation, appeal } = thread;

  const isOpen = isTeamInboxThreadOpen(thread);

  const resolveAppeal = async (status: 'approved' | 'denied') => {
    if (!appeal) return;
    setError(null);
    try {
      const { data } = await updateAppeal({ variables: { selector: { _id: appeal._id }, data: { status } } });
      const updatedAppeal = data?.updateRejectionAppeal?.data;
      if (!updatedAppeal?.conversation) throw new Error('The review update returned no conversation. Please reload and try again.');
      // Resolving a review also marks its conversation done
      dispatch({
        type: 'UPDATE_THREAD',
        thread: {
          conversation: updatedAppeal.conversation,
          appeal: updatedAppeal,
        },
        advanceFocus: true,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to resolve this review. Please try again.');
    }
  };

  const setAwaitingModeratorReply = async (awaitingModeratorReply: boolean, advanceFocus: boolean) => {
    setError(null);
    try {
      const { data } = await updateConversation({ variables: { selector: { _id: conversation._id }, data: { awaitingModeratorReply } } });
      const updatedConversation = data?.updateConversation?.data;
      if (!updatedConversation) throw new Error('The conversation update returned no data. Please reload and try again.');
      dispatch({
        type: 'UPDATE_THREAD',
        thread: { conversation: updatedConversation, appeal },
        advanceFocus,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update this conversation. Please try again.');
    }
  };

  // A moderator's reply marks the conversation done on the server, unless they chose to keep it open.
  // Keeping it open applies to one reply at a time.
  const handleMessageSent = (message: messageListFragment) => {
    if (keepOpenAfterReply) {
      setKeepOpenAfterReply(false);
      void setAwaitingModeratorReply(true, false);
      return;
    }
    dispatch({
      type: 'UPDATE_THREAD',
      thread: { conversation: { ...conversation, awaitingModeratorReply: false, moderatorReplyWaitingSince: null, latestActivity: message.createdAt }, appeal },
      advanceFocus: false,
    });
  };

  return (
    <div className={classes.root}>
      <div className={classes.actionsSection}>
        {conversation.title && <h2 className={classes.title}>{conversation.title}</h2>}
        {appeal && <AppealedContent appeal={appeal} />}
        <div className={classes.buttonRow}>
          {appeal && appeal.status === 'open'
            ? <>
              <Button
                className={classes.button}
                disabled={pending}
                onClick={() => void resolveAppeal('approved')}
              >
                Approve and publish
              </Button>
              <Button
                className={classes.button}
                disabled={pending}
                onClick={() => void resolveAppeal('denied')}
              >
                Deny
              </Button>
              <span className={classes.resolveNote}>The user gets an automated message with the outcome.</span>
            </>
            : isOpen
              ? <Button className={classes.button} disabled={pending} onClick={() => void setAwaitingModeratorReply(false, true)}>Mark done</Button>
              : <>
                <Button className={classes.button} disabled={pending} onClick={() => void setAwaitingModeratorReply(true, false)}>Reopen</Button>
                <span className={classes.statusNote}>Done</span>
              </>}
        </div>
        {error && <div className={classes.error} role="alert">{error}</div>}
      </div>
      <div className={classes.conversation} key={conversation._id}>
        <ConversationContents
          conversation={conversation}
          currentUserId={currentUser._id}
          onMessageSent={handleMessageSent}
          editorAccessory={<label className={classes.keepOpenLabel}>
            <Checkbox
              className={classes.keepOpenCheckbox}
              checked={keepOpenAfterReply}
              onChange={() => setKeepOpenAfterReply(!keepOpenAfterReply)}
              disableRipple
            />
            Keep open after replying
          </label>}
        />
      </div>
    </div>
  );
};

export default TeamInboxThreadView;
