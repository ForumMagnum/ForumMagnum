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
import { useCompleteUserModeration } from './supermod/useCompleteUserModeration';
import ModerationSendOptions from './supermod/ModerationSendOptions';
import { DEFAULT_REJECTION_RATE_LIMIT_SETTINGS, getRateLimitsToCreate, type RejectionRateLimitSettings } from './supermod/RejectionRateLimitForm';
import { areAllContentPermissionsDisabled } from './supermod/helpers';
import type { InboxAction } from './supermod/inboxReducer';

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
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}

const ModeratorMessageComposerInner = ({ user, currentUser, posts, comments, active, onEscape, onSent, dispatch }: ModeratorMessageComposerProps) => {
  const classes = useStyles(styles);
  const completeModeration = useCompleteUserModeration(dispatch);
  const permissionsAlreadyDisabled = areAllContentPermissionsDisabled(user);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [rateLimitSettings, setRateLimitSettings] = useState<RejectionRateLimitSettings>(DEFAULT_REJECTION_RATE_LIMIT_SETTINGS);
  const [disablePermissions, setDisablePermissions] = useState(false);
  const [rejectAll, setRejectAll] = useState(false);

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

  const submitModeratorMessage = async (message: CreateMessageDataInput) => {
    const rateLimits = rateLimitEnabled ? getRateLimitsToCreate(rateLimitSettings, user._id) : [];
    if (!message.contents) throw new Error('Message contents are required');
    const moderatorMessage = { conversationId: message.conversationId, contents: message.contents, noEmail: message.noEmail };
    const result = await completeModeration({ userId: user._id, message: moderatorMessage, rateLimits, disablePermissions, rejectAll, removeFromQueue: rejectAll });
    if (!result.message) throw new Error('Moderation completed without the requested message');
    setDisablePermissions(false);
    setRateLimitEnabled(false);
    setRateLimitSettings(DEFAULT_REJECTION_RATE_LIMIT_SETTINGS);
    setRejectAll(false);
    return result.message;
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
          submitMessage={submitModeratorMessage}
          templateQueries={templateQueries}
          keystrokeSubmitButton
          // One line tall until the moderator types or inserts a template
          fitToContent
          beforeSubmit={<ModerationSendOptions
            rateLimitEnabled={rateLimitEnabled}
            rateLimitSettings={rateLimitSettings}
            onRateLimitChange={(enabled, settings) => {
              setRateLimitEnabled(enabled);
              setRateLimitSettings(settings);
            }}
            showDisablePermissions={!permissionsAlreadyDisabled}
            disablePermissions={disablePermissions}
            onDisablePermissionsChange={setDisablePermissions}
            rejectAll={rejectAll}
            rejectAllLabel="Reject all pending content, remove from queue"
            rejectAllTooltip="User receives a rejection notice for each pending submission, pointing them to this message."
            onRejectAllChange={setRejectAll}
          />}
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
