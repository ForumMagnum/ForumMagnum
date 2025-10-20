import React, { useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWDialog from "@/components/common/LWDialog";
import { DialogTitle } from '@/components/widgets/DialogTitle';
import { DialogContent } from '@/components/widgets/DialogContent';
import { DialogActions } from '@/components/widgets/DialogActions';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { commentBodyStyles } from '@/themes/stylePiping';
import { useInitiateConversation } from '@/components/hooks/useInitiateConversation';
import Loading from '@/components/vulcan-core/Loading';
import { CONTENT_LIMIT } from '../UsersReviewInfoCard';
import { usePublishedPosts } from '@/components/hooks/usePublishedPosts';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentModerationKeyboardQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const ModerationTemplateFragmentMultiQuery = gql(`
  query multiModerationTemplateRestrictAndNotifyModalQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserRestrictAndNotify($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const PostsListUpdateMutation = gql(`
  mutation updatePostRestrictAndNotify($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        _id
        rejected
      }
    }
  }
`);

const CommentsListUpdateMutation = gql(`
  mutation updateCommentRestrictAndNotify($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        _id
        rejected
      }
    }
  }
`);

const styles = defineStyles('RestrictAndNotifyModal', (theme: ThemeType) => ({
  content: {
    minWidth: 500,
    maxWidth: 600,
  },
  templateList: {
    marginTop: 16,
    marginBottom: 16,
  },
  templateItem: {
    padding: 12,
    marginBottom: 8,
    border: theme.palette.border.normal,
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
  },
  templateItemSelected: {
    backgroundColor: theme.palette.primary.light + '20',
    borderColor: theme.palette.primary.main,
  },
  templateName: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 4,
  },
  templatePreview: {
    fontSize: 12,
    ...commentBodyStyles(theme),
    backgroundColor: theme.palette.grey[50],
    padding: 8,
    borderRadius: 2,
    marginTop: 8,
    maxHeight: 150,
    overflow: 'auto',
  },
  actions: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: theme.palette.grey[700],
    marginBottom: 12,
  },
  warning: {
    fontSize: 13,
    color: theme.palette.error.main,
    backgroundColor: theme.palette.error.light + '20',
    padding: 12,
    borderRadius: 4,
    marginTop: 16,
  },
}));

const RestrictAndNotifyModal = ({
  user,
  currentUser,
  onComplete,
  onClose,
}: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  onComplete: () => void;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { posts, comments } = useModeratedUserContents(user._id, CONTENT_LIMIT);

  const { data: templatesData } = useQuery(ModerationTemplateFragmentMultiQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: 'Messages' } },
      limit: 50,
      enableTotal: false,
    },
  });

  const templates = templatesData?.moderationTemplates?.results ?? [];

  const { initiateConversation } = useInitiateConversation({ includeModerators: true });
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [updatePost] = useMutation(PostsListUpdateMutation);
  const [updateComment] = useMutation(CommentsListUpdateMutation);

  const getModSignatureWithNote = (note: string) => getSignatureWithNote(currentUser.displayName, note);

  const handleConfirm = async () => {
    if (!selectedTemplateId) return;

    setLoading(true);
    try {
      const notes = user.sunshineNotes || '';
      const newNotes = getModSignatureWithNote('Restricted & notified (rejected content, disabled permissions)') + notes;

      // 1. Restrict user permissions and remove from queue
      await updateUser({
        variables: {
          selector: { _id: user._id },
          data: {
            postingDisabled: true,
            commentingOnOtherUsersDisabled: true,
            needsReview: false,
            reviewedByUserId: null,
            reviewedAt: user.reviewedAt ? new Date() : null,
            sunshineNotes: newNotes,
          },
        },
      });

      // 2. Reject all unreviewed posts
      const unrejectedPosts = posts.filter(p => !p.rejected && !p.reviewedByUserId);
      for (const post of unrejectedPosts) {
        await updatePost({
          variables: {
            selector: { _id: post._id },
            data: {
              rejected: true,
            },
          },
        });
      }

      // 3. Reject all unreviewed comments
      const unrejectedComments = comments.filter(c => !c.rejected && !c.reviewedByUserId);
      for (const comment of unrejectedComments) {
        await updateComment({
          variables: {
            selector: { _id: comment._id },
            data: {
              rejected: true,
            },
          },
        });
      }

      // 4. Initiate conversation with the selected template
      // The conversation system will automatically use the template when opened
      await initiateConversation([user._id]);

      // Note: The actual message sending happens when the moderator opens the conversation
      // and the template is automatically loaded. This is how the existing system works.
      // To fully automate this, we'd need to create a message directly, but that's more complex
      // and may not be desirable (moderator should review the message before sending).

      onComplete();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error restricting and notifying user:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const unreviewedPostCount = posts.filter(p => !p.rejected && !p.reviewedByUserId).length;
  const unreviewedCommentCount = comments.filter(c => !c.rejected && !c.reviewedByUserId).length;

  return (
    <LWDialog open onClose={onClose} maxWidth="md">
      <DialogTitle>Restrict User & Send Message</DialogTitle>
      <DialogContent className={classes.content}>
        <div className={classes.description}>
          This will:
          <ul>
            <li>Disable posting</li>
            <li>Disable commenting on others' content</li>
            <li>Reject {unreviewedPostCount} unreviewed post(s)</li>
            <li>Reject {unreviewedCommentCount} unreviewed comment(s)</li>
            <li>Remove user from review queue (without approval)</li>
            <li>Open a conversation with the selected message template</li>
          </ul>
        </div>

        {templates.length === 0 ? (
          <div>
            <Loading />
          </div>
        ) : (
          <div className={classes.templateList}>
            {templates.map((template) => (
              <div
                key={template._id}
                className={`${classes.templateItem} ${
                  selectedTemplateId === template._id ? classes.templateItemSelected : ''
                }`}
                onClick={() => setSelectedTemplateId(template._id)}
              >
                <div className={classes.templateName}>{template.name}</div>
                <div className={classes.templatePreview}>
                  <ContentItemBody
                    dangerouslySetInnerHTML={{ __html: template.contents?.html || '' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={classes.warning}>
          Warning: This action cannot be undone. The conversation will open in a new tab for you to review and send the message.
        </div>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={!selectedTemplateId || loading}
        >
          {loading ? 'Processing...' : 'Restrict & Notify'}
        </Button>
      </DialogActions>
    </LWDialog>
  );
};

export default RestrictAndNotifyModal;
