import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { getCkCommentEditor } from '@/lib/wrapCkEditor';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { getDraftMessageHtml } from '@/lib/collections/messages/helpers';
import LWTooltip from '@/components/common/LWTooltip';
import { Card } from '@/components/widgets/Paper';
import classNames from 'classnames';
import KeystrokeDisplay from './KeystrokeDisplay';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { makeEditorConfig } from '@/components/editor/editorConfigs';
import { useCurrentUser } from '@/components/common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { focusLexicalEditor } from '@/components/editor/focusLexicalEditor';
import dynamic from 'next/dynamic';

const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'));
const CKEditor  = dynamic(() => import('@/lib/vendor/ckeditor5-react/ckeditor'));

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
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    marginBottom: 12,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    backgroundColor: theme.palette.background.paper,
    outline: 'none',
    '&:focus': {
      border: `1px solid ${theme.palette.grey[300]}`,
    },
  },
  templateList: {
    marginTop: 4,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  templateRow: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: 3,
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    '&.selected': {
      backgroundColor: theme.palette.grey[200],
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
  const currentUser = useCurrentUser();
  const isAdmin = userIsAdmin(currentUser);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [lexicalEditorVersion, setLexicalEditorVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const templateListRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [rejectContentAndRemoveFromQueue] = useMutation(RejectContentAndRemoveFromQueueMutation);

  const { data: templatesData } = useQuery(ModerationTemplateFragmentMultiQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: 'Messages' } },
      limit: 50,
      enableTotal: false,
    },
  });

  const templates = useMemo(() => templatesData?.moderationTemplates?.results ?? [], [templatesData]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const selectedElement = templateListRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const selectedTemplate = templates.find(t => t._id === templateId);
    if (selectedTemplate?.contents?.html) {
      const filledContent = getDraftMessageHtml({
        html: selectedTemplate.contents.html,
        displayName: user.displayName,
      });
      setMessageContent(filledContent);
      if (isAdmin) {
        setLexicalEditorVersion((prev) => prev + 1);
        focusLexicalEditor(editorContainerRef.current);
      } else if (editor) {
        editor.setData(filledContent);
      }
    }
  }, [editor, isAdmin, templates, user.displayName]);

  const handleConfirm = useCallback(() => {
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
  }, [selectedTemplateId, messageContent, rejectContentAndRemoveFromQueue, user._id, documentId, collectionName, rejectedReason, onComplete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev === filteredTemplates.length - 1 ? 0 : prev + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? filteredTemplates.length - 1 : prev - 1);
        break;
      case 'Enter':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (selectedTemplateId && messageContent) {
            handleConfirm();
          }
        } else {
          e.preventDefault();
          if (filteredTemplates[selectedIndex]) {
            handleTemplateSelect(filteredTemplates[selectedIndex]._id);
          }
        }
        break;
      case 'Tab':
        e.preventDefault();
        // We need the outer setTimeout to allow a rerender after `setHideTextField` causes a state update to show the editor
        // and the inner timeout to allow the scroll to finish (since apparently focusing an element will interrupt the scroll)
        setTimeout(() => {
          editorContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            if (isAdmin) {
              focusLexicalEditor(editorContainerRef.current);
            } else {
              editor?.focus();
            }
          }, 300);
        }, 0);
        break;
    }
  }, [filteredTemplates, selectedIndex, handleTemplateSelect, selectedTemplateId, messageContent, editor, handleConfirm, isAdmin]);

  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (selectedTemplateId && messageContent) {
        e.preventDefault();
        handleConfirm();
      }
    }
  }, [selectedTemplateId, messageContent, handleConfirm]));

  const CommentEditor = getCkCommentEditor();

  const editorConfig = makeEditorConfig({
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
  });

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
          <>
            <input
              ref={searchInputRef}
              className={classes.searchInput}
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className={classes.templateList} ref={templateListRef}>
              {filteredTemplates.map((template, index) => (
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
                    className={classNames(classes.templateRow, { selected: index === selectedIndex })}
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
          </>
        )}

        <div className={classes.editorContainer} ref={editorContainerRef}>
          <ContentStyles contentType='comment'>
            {isAdmin ? (
              <LexicalEditor
                key={lexicalEditorVersion}
                data={messageContent}
                placeholder="Edit message to user..."
                onChange={setMessageContent}
                onReady={() => {}}
                commentEditor
              />
            ) : (
              <CKEditor
                editor={CommentEditor}
                data={messageContent}
                config={editorConfig}
                onReady={(editorInstance: Editor) => {
                  setEditor(editorInstance);
                }}
                onChange={(event: any, editorInstance: Editor) => {
                  const data = editorInstance.getData();
                  setMessageContent(data);
                }}
              />
            )}
          </ContentStyles>
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
          <KeystrokeDisplay keystroke="Ctrl+Enter" withMargin splitBeforeTranslation />
        </Button>
      </DialogActions>
    </LWDialog>
  );
};

export default RestrictAndNotifyModal;
