import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { AppendToEditorProvider, useAppendToEditor } from '@/components/editor/AppendToEditorContext';
import { focusLexicalEditor, focusLexicalEditorAtEnd } from '@/components/editor/focusLexicalEditor';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { standardRejectionIntroHtml, standardRejectionIntroPlaintext } from '@/lib/collections/moderationTemplates/rejectionIntro';
import { getDraftMessageHtml } from '@/lib/collections/messages/helpers';
import GroupedModerationTemplateList from '../GroupedModerationTemplateList';
import ComposerKeydownWrapper from './ComposerKeydownWrapper';
import ComposerSubmitButton from './ComposerSubmitButton';
import { isPost, type ContentItem } from './helpers';

const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'));

const styles = defineStyles('RejectContentPanel', (theme: ThemeType) => ({
  root: {
    marginTop: 16,
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
  // Boilerplate the moderator has read a thousand times; one line until clicked
  collapsedIntro: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  editorContainer: {
    // One line tall until the moderator types or inserts a template
    '--lexical-comment-min-height': '1em',
  },
}));

function appendHtml(existingHtml: string, newHtml: string) {
  const separator = existingHtml.trim() ? '<p><br></p>' : '';
  return `${existingHtml}${separator}${newHtml}`;
}

const RejectContentEditor = ({ user, focusedContent, active, editorContainerRef, onArrowDownPastEnd }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
  // False while the panel is hidden (but kept mounted to preserve the draft)
  active: boolean,
  editorContainerRef: React.RefObject<HTMLDivElement | null>,
  onArrowDownPastEnd: () => void,
}) => {
  const classes = useStyles(styles);
  const { rejectContent } = useRejectContent();
  const { registerAppendToEditor } = useAppendToEditor();

  // Contents live in a ref so typing doesn't re-render the template list;
  // editorHtml only seeds (re)mounts
  const rejectedReasonRef = useRef('');
  const [editorHtml, setEditorHtml] = useState('');
  const [hasRejectedReason, setHasRejectedReason] = useState(false);
  const [lexicalEditorVersion, setLexicalEditorVersion] = useState(0);
  const [introExpanded, setIntroExpanded] = useState(false);

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
  }, [registerAppendToEditor, setEditorContents, editorContainerRef]);

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
    if (!active) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && hasRejectedReason) {
      e.preventDefault();
      handleReject();
    }
  }, [active, hasRejectedReason, handleReject]));

  return <div className={classes.root}>
    <div className={classes.introMessage} onClick={() => setIntroExpanded(!introExpanded)}>
      {introExpanded
        ? <ContentStyles contentType='comment'>
            <ContentItemBody dangerouslySetInnerHTML={{__html: standardRejectionIntroHtml}} />
          </ContentStyles>
        : <div className={classes.collapsedIntro}>{standardRejectionIntroPlaintext}</div>}
    </div>
    <ComposerKeydownWrapper className={classes.editorContainer} containerRef={editorContainerRef} onArrowDownPastEnd={onArrowDownPastEnd}>
      <ContentStyles contentType='comment'>
        <LexicalEditor
          key={lexicalEditorVersion}
          data={editorHtml}
          placeholder={`Why is ${user.displayName}'s content being rejected?`}
          onChange={handleEditorChange}
          commentEditor
        />
      </ContentStyles>
    </ComposerKeydownWrapper>
    <ComposerSubmitButton label="Reject" disabled={!hasRejectedReason} onClick={handleReject} />
  </div>;
};

const RejectionTemplateList = ({ displayName, focusSearchToken, active, onFocusComposer }: {
  displayName: string,
  focusSearchToken: number,
  active: boolean,
  onFocusComposer: () => void,
}) => {
  const { appendToEditor } = useAppendToEditor();

  const handleTemplateClick = (template: ModerationTemplateFragment) => {
    if (!template.contents?.html) return;
    appendToEditor(getDraftMessageHtml({ html: template.contents.html, displayName }));
  };

  return <GroupedModerationTemplateList
    collectionName="Rejections"
    onTemplateClick={handleTemplateClick}
    focusSearchToken={focusSearchToken}
    active={active}
    onFocusComposer={onFocusComposer}
  />;
};

/**
 * Inline replacement for RejectContentDialog in the moderation sidebar:
 * clicking a template below the editor appends its text as a reason.
 * Stays mounted while `active` is false so the draft survives the tab
 * being toggled closed and reopened.
 */
const RejectContentPanel = ({ user, focusedContent, active }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
  active: boolean,
}) => {
  const [templateSearchToken, setTemplateSearchToken] = useState(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // The template search is the initial keyboard target whenever the tab is picked
  useEffect(() => {
    if (active) {
      setTemplateSearchToken(token => token + 1);
    }
  }, [active]);

  return <AppendToEditorProvider>
    <RejectContentEditor
      user={user}
      focusedContent={focusedContent}
      active={active}
      editorContainerRef={editorContainerRef}
      onArrowDownPastEnd={() => setTemplateSearchToken(token => token + 1)}
    />
    <RejectionTemplateList
      displayName={user.displayName}
      focusSearchToken={templateSearchToken}
      active={active}
      onFocusComposer={() => focusLexicalEditorAtEnd(editorContainerRef.current)}
    />
  </AppendToEditorProvider>;
};

export default RejectContentPanel;
