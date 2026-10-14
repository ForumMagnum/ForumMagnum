import React, { useState, useEffect, useMemo, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { useTracking } from '../../lib/analyticsEvents';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import MessagesNewForm from "../messaging/MessagesNewForm";
import { getDraftMessageHtml } from '../../lib/collections/messages/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useInitiateConversation } from '../hooks/useInitiateConversation';
import { useAppendToEditor, AppendToEditorProvider } from '../editor/AppendToEditorContext';
import { getHighlightedTemplateNames } from './supermod/templateHighlightRules';
import GroupedModerationTemplateList from './GroupedModerationTemplateList';
import ComposerKeydownWrapper from './supermod/ComposerKeydownWrapper';
import { focusLexicalEditorAtEnd, focusLexicalEditorWhenReady } from '../editor/focusLexicalEditor';

const styles = defineStyles('ModeratorMessageComposer', (theme: ThemeType) => ({
  conversationForm: {
    marginBottom: 16,
    paddingBottom: 8,
  },
  messagePrompt: {
    padding: 8,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
  },
}));

interface ModeratorMessageComposerProps {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  // False while the composer is hidden (but kept mounted to preserve the draft)
  active: boolean;
  onEscape: () => void;
  onSent: () => void;
}

const ModeratorMessageComposerInner = ({ user, currentUser, posts, comments, active, onEscape, onSent }: ModeratorMessageComposerProps) => {
  const classes = useStyles(styles);

  const highlightedTemplateNames = useMemo(
    () => getHighlightedTemplateNames({ user, moderatorActions: user.moderatorActions ?? [] }, posts, comments),
    [user, posts, comments],
  );

  const [conversationId, setConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  const [templateSearchToken, setTemplateSearchToken] = useState(0);
  const [pendingComposerFocus, setPendingComposerFocus] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const { captureEvent } = useTracking();
  const { conversation, initiateConversation } = useInitiateConversation({ includeModerators: true });
  const { appendToEditor } = useAppendToEditor();

  useEffect(() => {
    if (conversation && !conversationId) {
      setConversationId(conversation._id);
    }
  }, [conversation, conversationId]);

  // The template search is the initial keyboard target whenever the composer is opened
  useEffect(() => {
    if (active) {
      setTemplateSearchToken(token => token + 1);
    }
  }, [active]);

  // Composer focus has to wait until the conversation (and thus the editor) exists
  useEffect(() => {
    if (pendingComposerFocus && conversationId) {
      setPendingComposerFocus(false);
      return focusLexicalEditorWhenReady(editorContainerRef.current);
    }
  }, [pendingComposerFocus, conversationId]);

  // Starting a conversation creates it in the database, so wait until the moderator commits to writing
  const startConversation = () => {
    setPendingComposerFocus(true);
    initiateConversation([user._id]);
  };

  const handleTemplateClick = (template: ModerationTemplateFragment) => {
    if (!conversationId) {
      startConversation();
      const newTemplateQueries = { templateId: template._id, displayName: user.displayName };
      // A downstream useEffect keys on this object's identity; a fresh but
      // equal object loops forever
      if (!isEqual(newTemplateQueries, templateQueries)) {
        setTemplateQueries(newTemplateQueries);
      }
    } else if (template.contents?.html) {
      appendToEditor(getDraftMessageHtml({ html: template.contents.html, displayName: user.displayName }));
    }
  };

  const handleFocusComposer = () => {
    if (conversationId) {
      focusLexicalEditorAtEnd(editorContainerRef.current);
    } else {
      startConversation();
    }
  };

  return <>
    {conversationId ? (
      <ComposerKeydownWrapper
        className={classes.conversationForm}
        containerRef={editorContainerRef}
        onArrowDownPastEnd={() => setTemplateSearchToken(token => token + 1)}
        onEscape={onEscape}
      >
        <MessagesNewForm
          conversationId={conversationId}
          templateQueries={templateQueries}
          keystrokeSubmitButton
          // One line tall until the moderator types or inserts a template
          fitToContent
          successEvent={(newMessage) => {
            captureEvent('messageSent', {
              conversationId: newMessage.conversationId,
              sender: currentUser._id,
              moderatorConveration: true
            });
            onSent();
          }}
        />
      </ComposerKeydownWrapper>
    ) : (
      <div className={classes.messagePrompt} onClick={startConversation}>Click to start a new message…</div>
    )}
    <GroupedModerationTemplateList
      collectionName="Messages"
      onTemplateClick={handleTemplateClick}
      highlightedTemplateNames={highlightedTemplateNames}
      onFocusComposer={handleFocusComposer}
      focusSearchToken={templateSearchToken}
      active={active}
      onEscape={onEscape}
    />
  </>;
};

const ModeratorMessageComposer = (props: ModeratorMessageComposerProps) => {
  return (
    <AppendToEditorProvider>
      <ModeratorMessageComposerInner {...props} />
    </AppendToEditorProvider>
  );
};

export default ModeratorMessageComposer;
