import React, { useState, useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWDialog from "@/components/common/LWDialog";
import { DialogTitle } from '@/components/widgets/DialogTitle';
import { DialogContent } from '@/components/widgets/DialogContent';
import { DialogActions } from '@/components/widgets/DialogActions';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import Loading from '@/components/vulcan-core/Loading';
import ContentStyles from "@/components/common/ContentStyles";
import CKEditor from '@/lib/vendor/ckeditor5-react/ckeditor';
import { getCkCommentEditor } from '@/lib/wrapCkEditor';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { getDraftMessageHtml } from '@/lib/collections/messages/helpers';
import LWTooltip from '@/components/common/LWTooltip';
import { Card } from '@/components/widgets/Paper';

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

const RejectContentAndRemoveFromQueueMutation = gql(`
  mutation rejectContentAndRemoveFromQueueRestrictAndNotify($userId: String!, $documentId: String!, $collectionName: ContentCollectionName!, $rejectedReason: String!, $messageContent: String) {
    rejectContentAndRemoveUserFromQueue(userId: $userId, documentId: $documentId, collectionName: $collectionName, rejectedReason: $rejectedReason, messageContent: $messageContent)
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
    display: 'flex',
    flexDirection: 'column',
  },
  templateRow: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
  },
  radio: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  templateName: {
    fontSize: 14,
    flexGrow: 1,
  },
  templateTooltip: {
    width: '100%',
  },
  card: {
    padding: 12,
    width: 500,
  },
  actions: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: theme.palette.grey[700],
    marginBottom: 12,
  },
  editorContainer: {
    marginTop: 16,
    minHeight: 150,
    '& .ck-editor__editable': {
      minHeight: 150,
    },
  },
}));

const RestrictAndNotifyModal = ({
  user,
  onComplete,
  onClose,
  rejectedReason,
  documentId,
  collectionName,
}: {
  user: SunshineUsersList;
  onComplete: (executeAction: () => Promise<void>) => void;
  onClose: () => void;
  rejectedReason: string;
  documentId: string;
  collectionName: 'Posts' | 'Comments';
}) => {
  const classes = useStyles(styles);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);

  const [rejectContentAndRemoveFromQueue] = useMutation(RejectContentAndRemoveFromQueueMutation);

  const { data: templatesData } = useQuery(ModerationTemplateFragmentMultiQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: 'Messages' } },
      limit: 50,
      enableTotal: false,
    },
  });

  const templates = useMemo(() => templatesData?.moderationTemplates?.results ?? [], [templatesData]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const selectedTemplate = templates.find(t => t._id === templateId);
    if (selectedTemplate?.contents?.html) {
      const filledContent = getDraftMessageHtml({
        html: selectedTemplate.contents.html,
        displayName: user.displayName,
      });
      setMessageContent(filledContent);
      if (editor) {
        editor.setData(filledContent);
      }
    }
  }, [templates, user.displayName, editor]);

  const handleConfirm = () => {
    if (!selectedTemplateId || !messageContent) return;

    const executeAction = async () => {
      await rejectContentAndRemoveFromQueue({
        variables: {
          userId: user._id,
          documentId,
          collectionName,
          rejectedReason,
          messageContent,
        },
      });
    };

    onComplete(executeAction);
  };

  const CommentEditor = getCkCommentEditor();

  const editorConfig = {
    toolbar: [
      'bold',
      'italic',
      '|',
      'link',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
    ],
    placeholder: 'Edit message to user...',
  };

  return (
    <LWDialog open onClose={onClose} maxWidth="md">
      <DialogTitle>Restrict User & Send Message</DialogTitle>
      <DialogContent className={classes.content}>
        <div className={classes.description}>
          This will:
          <ul>
            <li>Disable posting, commenting, creating new conversations, and voting</li>
            <li>Reject the user's most recent unreviewed post or comment</li>
            <li>Send the message below to the user</li>
            <li>Remove user from review queue</li>
          </ul>
        </div>

        {templates.length === 0 ? (
          <div>
            <Loading />
          </div>
        ) : (
          <div className={classes.templateList}>
            {templates.map((template) => (
              <LWTooltip
                key={template._id}
                className={classes.templateTooltip}
                placement="right-end"
                tooltip={false}
                title={
                  <Card className={classes.card}>
                    <ContentStyles contentType='comment'>
                      <ContentItemBody dangerouslySetInnerHTML={{__html: template.contents?.html ?? ""}} />
                    </ContentStyles>
                  </Card>
                }
              >
                <div
                  className={classes.templateRow}
                  onClick={() => handleTemplateSelect(template._id)}
                >
                  <Radio
                    checked={selectedTemplateId === template._id}
                    onChange={() => handleTemplateSelect(template._id)}
                    className={classes.radio}
                  />
                  <span className={classes.templateName}>{template.name}</span>
                </div>
              </LWTooltip>
            ))}
          </div>
        )}

        <div className={classes.editorContainer}>
          <CKEditor
            editor={CommentEditor}
            data={messageContent}
            config={editorConfig}
            isCollaborative={false}
            onReady={(editorInstance: Editor) => {
              setEditor(editorInstance);
            }}
            onChange={(event: any, editorInstance: Editor) => {
              const data = editorInstance.getData();
              setMessageContent(data);
            }}
          />
        </div>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={!selectedTemplateId || !messageContent}
        >
          Restrict & Notify
        </Button>
      </DialogActions>
    </LWDialog>
  );
};

export default RestrictAndNotifyModal;
