import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { AppendToEditorProvider, useAppendToEditor } from '@/components/editor/AppendToEditorContext';
import { focusLexicalEditor, focusLexicalEditorWhenReady } from '@/components/editor/focusLexicalEditor';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { standardRejectionIntroHtml, standardRejectionIntroPlaintext } from '@/lib/collections/moderationTemplates/rejectionIntro';
import { getDraftMessageHtml } from '@/lib/collections/messages/helpers';
import GroupedModerationTemplateList from '../GroupedModerationTemplateList';
import KeystrokeDisplay from './KeystrokeDisplay';
import { isPost, type ContentItem } from './helpers';

const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'));

const styles = defineStyles('RejectContentPanel', (theme: ThemeType) => ({
  // The editor sits below the template list, so the rule separates it from the
  // "New Rejection Reason" button above it.
  root: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: theme.palette.border.normal,
  },
  introMessage: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    '& p': {
      margin: '0 0 10px 0',
      '&:last-child': {
        margin: 0,
      }
    },
    '& a': {
      color: theme.palette.primary.main,
    }
  },
  // The intro is boilerplate the moderator has read a thousand times, so it
  // starts as a single clickable line and only expands on demand.
  collapsedIntro: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  editorContainer: {
    minHeight: 100,
  },
}));

function appendHtml(existingHtml: string, newHtml: string) {
  const separator = existingHtml.trim() ? '<p><br></p>' : '';
  return `${existingHtml}${separator}${newHtml}`;
}

const RejectContentEditor = ({ user, focusedContent }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
}) => {
  const classes = useStyles(styles);
  const { rejectContent } = useRejectContent();
  const { registerAppendToEditor } = useAppendToEditor();

  // Live editor contents go in a ref so typing doesn't re-render the template
  // list; editorHtml is only the value the editor is (re)mounted with.
  const rejectedReasonRef = useRef('');
  const [editorHtml, setEditorHtml] = useState('');
  const [hasRejectedReason, setHasRejectedReason] = useState(false);
  const [lexicalEditorVersion, setLexicalEditorVersion] = useState(0);
  const [introExpanded, setIntroExpanded] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const setEditorContents = useCallback((html: string) => {
    rejectedReasonRef.current = html;
    setEditorHtml(html);
    setHasRejectedReason(!!html);
    setLexicalEditorVersion(prev => prev + 1);
  }, []);

  const handleEditorChange = useCallback((html: string) => {
    rejectedReasonRef.current = html;
    // Same-value setState bails out, so typing doesn't re-render the list.
    setHasRejectedReason(!!html);
  }, []);

  useEffect(() => {
    registerAppendToEditor((html: string) => {
      setEditorContents(appendHtml(rejectedReasonRef.current, html));
      focusLexicalEditor(editorContainerRef.current);
    });
    return () => registerAppendToEditor(() => {});
  }, [registerAppendToEditor, setEditorContents]);

  // This panel only mounts once the moderator has picked the reject tab, so taking
  // focus here is always deliberate — no tab is selected until they choose one.
  useEffect(() => focusLexicalEditorWhenReady(editorContainerRef.current), []);

  const handleReject = useCallback(() => {
    const reason = rejectedReasonRef.current;
    if (!reason) return;

    if (isPost(focusedContent)) {
      void rejectContent({ collectionName: 'Posts', document: focusedContent, reason });
    } else {
      void rejectContent({ collectionName: 'Comments', document: focusedContent, reason });
    }
    setEditorContents('');
  }, [focusedContent, rejectContent, setEditorContents]);

  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && hasRejectedReason) {
      e.preventDefault();
      handleReject();
    }
  }, [hasRejectedReason, handleReject]));

  return <div className={classes.root}>
    <div className={classes.introMessage} onClick={() => setIntroExpanded(!introExpanded)}>
      {introExpanded
        ? <ContentStyles contentType='comment'>
            <ContentItemBody dangerouslySetInnerHTML={{__html: standardRejectionIntroHtml}} />
          </ContentStyles>
        : <div className={classes.collapsedIntro}>{standardRejectionIntroPlaintext}</div>}
    </div>
    <div className={classes.editorContainer} ref={editorContainerRef}>
      <ContentStyles contentType='comment'>
        <LexicalEditor
          key={lexicalEditorVersion}
          data={editorHtml}
          placeholder={`Why is ${user.displayName}'s content being rejected?`}
          onChange={handleEditorChange}
          commentEditor
        />
      </ContentStyles>
    </div>
    <Button onClick={handleReject} disabled={!hasRejectedReason}>
      Reject
      <KeystrokeDisplay keystroke="Ctrl+Enter" withMargin splitBeforeTranslation />
    </Button>
  </div>;
};

const RejectionTemplateList = ({ displayName }: { displayName: string }) => {
  const { appendToEditor } = useAppendToEditor();

  const handleTemplateClick = (template: ModerationTemplateFragment) => {
    if (!template.contents?.html) return;
    appendToEditor(getDraftMessageHtml({ html: template.contents.html, displayName }));
  };

  return <GroupedModerationTemplateList
    collectionName="Rejections"
    onTemplateClick={handleTemplateClick}
  />;
};

/**
 * Inline replacement for RejectContentDialog inside the moderation sidebar. Rejection
 * reasons are appended into the editor by clicking the templates above it, rather than
 * composed from checkboxes in a modal.
 */
const RejectContentPanel = ({ user, focusedContent }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
}) => {
  return <AppendToEditorProvider>
    <RejectionTemplateList displayName={user.displayName} />
    <RejectContentEditor user={user} focusedContent={focusedContent} />
  </AppendToEditorProvider>;
};

export default RejectContentPanel;
