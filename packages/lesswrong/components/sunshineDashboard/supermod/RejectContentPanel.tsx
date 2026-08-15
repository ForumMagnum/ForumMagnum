import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import { focusLexicalEditorAtEnd } from '@/components/editor/focusLexicalEditor';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { standardRejectionIntroHtml, standardRejectionIntroPlaintext } from '@/lib/collections/moderationTemplates/rejectionIntro';
import { getDraftMessageHtml } from '@/lib/collections/messages/helpers';
import GroupedModerationTemplateList from '../GroupedModerationTemplateList';
import ComposerKeydownWrapper from './ComposerKeydownWrapper';
import ComposerSubmitButton from './ComposerSubmitButton';
import { isPost, type ContentItem } from './helpers';
import { getHighlightedRejectionTemplateNames } from './templateHighlightRules';
import { useHighlightRuleOverrides } from './useHighlightRuleOverrides';

const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'));

const styles = defineStyles('RejectContentPanel', (theme: ThemeType) => ({
  root: {
    marginTop: 16,
  },
  // Read-only preview of the message being composed; clicking it swaps in
  // the full editor for the rare case where the message needs hand-editing
  messagePreview: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
  },
  // Boilerplate the moderator has read a thousand times; one line only
  collapsedIntro: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  reasonLead: {
    fontWeight: 600,
    marginTop: 6,
  },
  editorContainer: {
    marginBottom: 10,
    // One line tall until the moderator types or inserts a template
    '--lexical-comment-min-height': '1em',
  },
  // The full panel stays mounted while collapsed (so drafts survive), just hidden
  hiddenPanel: {
    display: 'none',
  },
  collapsedSendButton: {
    marginTop: 4,
  },
}));

const TEMPLATE_SEPARATOR = '<p><br></p>';

interface AddedRejectionTemplate {
  templateId: string;
  lead: string;
  html: string;
}

function appendHtml(existingHtml: string, newHtml: string) {
  const separator = existingHtml.trim() ? TEMPLATE_SEPARATOR : '';
  return `${existingHtml}${separator}${newHtml}`;
}

function joinTemplateHtml(templates: AddedRejectionTemplate[]) {
  return templates.map(t => t.html).join(TEMPLATE_SEPARATOR);
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Removal of an inserted template's html from a hand-editable document.
 * First tries excising the chunk verbatim (exact while the document hasn't
 * been re-serialized by the editor). Once the moderator has typed, the editor
 * rewrites the whole document's markup, so it falls back to finding the
 * contiguous run of block elements whose text matches the template's text and
 * removing those (plus one adjacent separator paragraph). Returns null when
 * the template can't be found — i.e. its own text has been edited — in which
 * case the caller leaves the document alone.
 */
function removeTemplateChunk(fullHtml: string, chunkHtml: string): string | null {
  const candidates = [TEMPLATE_SEPARATOR + chunkHtml, chunkHtml + TEMPLATE_SEPARATOR, chunkHtml];
  const foundCandidate = candidates.find(candidate => fullHtml.includes(candidate));
  if (foundCandidate) {
    return fullHtml.replace(foundCandidate, '');
  }
  return removeTemplateChunkByText(fullHtml, chunkHtml);
}

function removeTemplateChunkByText(fullHtml: string, chunkHtml: string): string | null {
  const parser = new DOMParser();
  const targetText = normalizeText(parser.parseFromString(chunkHtml, 'text/html').body.textContent ?? '');
  if (!targetText) return null;

  const doc = parser.parseFromString(fullHtml, 'text/html');
  const blocks = Array.from(doc.body.children);
  for (let start = 0; start < blocks.length; start++) {
    // Runs start on a block with text, so separator paragraphs stay adjacent
    // to their own template and the cleanup below removes exactly one
    if (!normalizeText(blocks[start].textContent ?? '')) continue;
    let combined = '';
    for (let end = start; end < blocks.length; end++) {
      const blockText = normalizeText(blocks[end].textContent ?? '');
      if (blockText) {
        combined = combined ? `${combined} ${blockText}` : blockText;
      }
      if (combined === targetText) {
        const blocksToRemove = blocks.slice(start, end + 1);
        // The separator paragraph between templates would otherwise linger
        // as a stray blank line
        const previousBlock = blocks[start - 1];
        const nextBlock = blocks[end + 1];
        if (previousBlock && !normalizeText(previousBlock.textContent ?? '')) {
          blocksToRemove.push(previousBlock);
        } else if (nextBlock && !normalizeText(nextBlock.textContent ?? '')) {
          blocksToRemove.push(nextBlock);
        }
        blocksToRemove.forEach(block => block.remove());
        return doc.body.innerHTML;
      }
      if (combined && !targetText.startsWith(combined)) break;
    }
  }
  return null;
}

/**
 * The bolded lead-in a rejection template opens with (e.g. "Missing some
 * rationality basics."), shown in the collapsed preview as each rejection
 * reason is added. Falls back to the start of the template's text.
 */
function extractBoldLead(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lead = doc.querySelector('strong, b')?.textContent?.trim();
  if (lead) return lead;
  const text = doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

/**
 * Composer for the rejection message. By default the message is never edited
 * directly: a grey preview shows the intro boilerplate plus the bold lead-in
 * of each rejection template added from the list below, so the moderator sees
 * the message being composed without an editor in the way. Clicking or
 * hitting Enter on a template toggles it: already-inserted templates are
 * removed from the message, leaving the others. Clicking the preview (or
 * Tab/ArrowUp from the template search) opens a full editor over the entire
 * message — intro included — for hand-editing.
 *
 * While previewing, the submitted reason is just the added templates and the
 * server prepends its canonical intro (with a link to the rejected content).
 * Once the editor is opened, the whole document is submitted and the server
 * uses it verbatim, substituting the content link for the "[content]"
 * placeholder.
 */
const RejectContentEditor = ({ user, focusedContent, active, editorContainerRef, composerFocusToken, registerToggleTemplate, registerReject, addedTemplates, setAddedTemplates, onRejected, onArrowDownPastEnd, onEscape }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
  // False while the panel is hidden (but kept mounted to preserve the draft)
  active: boolean,
  editorContainerRef: React.RefObject<HTMLDivElement | null>,
  // Bumped when the template list hands focus to the composer; opens the editor
  composerFocusToken: number,
  registerToggleTemplate: (fn: (template: ModerationTemplateFragment) => void) => void,
  // Like registerToggleTemplate: lets the panel submit the rejection from outside
  // the composer (the collapsed Send Rejection button and its Cmd+R shortcut)
  registerReject: (fn: () => void) => void,
  // Source of truth while the preview is showing; the reasons html is derived.
  // Owned by the panel so the template list can show which templates are inserted.
  addedTemplates: AddedRejectionTemplate[],
  setAddedTemplates: React.Dispatch<React.SetStateAction<AddedRejectionTemplate[]>>,
  // Called once the rejection mutation has completed (the server will have sent
  // the rejection PM by then)
  onRejected?: () => void,
  onArrowDownPastEnd: () => void,
  // Escape in the composer closes the panel's tab, as if it were clicked again
  onEscape: () => void,
}) => {
  const classes = useStyles(styles);
  const { rejectContent } = useRejectContent();
  // Full message (intro + reasons), canonical once the editor is open
  const fullMessageRef = useRef('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');
  const [lexicalEditorVersion, setLexicalEditorVersion] = useState(0);
  const handledFocusTokenRef = useRef(0);

  const openEditor = useCallback(() => {
    if (editorOpen) return;
    fullMessageRef.current = standardRejectionIntroHtml + joinTemplateHtml(addedTemplates);
    setEditorHtml(fullMessageRef.current);
    setLexicalEditorVersion(prev => prev + 1);
    setEditorOpen(true);
  }, [editorOpen, addedTemplates]);

  // Focus once the editor has mounted after opening
  useEffect(() => {
    if (editorOpen) {
      focusLexicalEditorAtEnd(editorContainerRef.current);
    }
  }, [editorOpen, editorContainerRef]);

  useEffect(() => {
    if (composerFocusToken && composerFocusToken !== handledFocusTokenRef.current) {
      handledFocusTokenRef.current = composerFocusToken;
      openEditor();
      // No-op while the editor is still mounting (the effect above covers it)
      focusLexicalEditorAtEnd(editorContainerRef.current);
    }
  }, [composerFocusToken, openEditor, editorContainerRef]);

  const handleEditorChange = useCallback((html: string) => {
    // Contents live in a ref so typing doesn't re-render the template list
    fullMessageRef.current = html;
  }, []);

  const toggleTemplate = useCallback((template: ModerationTemplateFragment) => {
    if (!template.contents?.html) return;
    const html = getDraftMessageHtml({ html: template.contents.html, displayName: user.displayName });
    const existing = addedTemplates.find(t => t.templateId === template._id);

    if (!existing) {
      setAddedTemplates(prev => [...prev, { templateId: template._id, lead: extractBoldLead(html), html }]);
      if (editorOpen) {
        fullMessageRef.current = appendHtml(fullMessageRef.current, html);
        setEditorHtml(fullMessageRef.current);
        setLexicalEditorVersion(prev => prev + 1);
        focusLexicalEditorAtEnd(editorContainerRef.current);
      }
      return;
    }

    if (editorOpen) {
      // Only drop the entry if the template was actually excised; if the
      // moderator has edited the template's own text it can't be identified
      // anymore, and the toggle leaves everything (custom edits included) alone
      const withChunkRemoved = removeTemplateChunk(fullMessageRef.current, existing.html);
      if (withChunkRemoved === null) return;
      fullMessageRef.current = withChunkRemoved;
      setEditorHtml(withChunkRemoved);
      setLexicalEditorVersion(prev => prev + 1);
    }
    setAddedTemplates(prev => prev.filter(t => t.templateId !== template._id));
  }, [addedTemplates, setAddedTemplates, editorOpen, user.displayName, editorContainerRef]);

  useEffect(() => {
    registerToggleTemplate(toggleTemplate);
    return () => registerToggleTemplate(() => {});
  }, [registerToggleTemplate, toggleTemplate]);

  const hasRejectedReason = editorOpen || addedTemplates.length > 0;

  const handleReject = useCallback(() => {
    const reason = editorOpen ? fullMessageRef.current : joinTemplateHtml(addedTemplates);
    if (!reason) return;

    const rejectPromise = isPost(focusedContent)
      ? rejectContent({ collectionName: 'Posts', document: focusedContent, reason })
      : rejectContent({ collectionName: 'Comments', document: focusedContent, reason });
    void rejectPromise.then(() => onRejected?.());
    fullMessageRef.current = '';
    setAddedTemplates([]);
    setEditorOpen(false);
    setEditorHtml('');
    setLexicalEditorVersion(prev => prev + 1);
  }, [editorOpen, addedTemplates, setAddedTemplates, focusedContent, rejectContent, onRejected]);

  useEffect(() => {
    registerReject(handleReject);
    return () => registerReject(() => {});
  }, [registerReject, handleReject]);

  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if (!active) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && hasRejectedReason) {
      e.preventDefault();
      handleReject();
    }
  }, [active, hasRejectedReason, handleReject]));

  return <div className={classes.root}>
    {!editorOpen && <div className={classes.messagePreview} onClick={openEditor}>
      <div className={classes.collapsedIntro}>{standardRejectionIntroPlaintext}</div>
      {addedTemplates.map(template => <div key={template.templateId} className={classes.reasonLead}>{template.lead}</div>)}
    </div>}
    {editorOpen && <ComposerKeydownWrapper className={classes.editorContainer} containerRef={editorContainerRef} onArrowDownPastEnd={onArrowDownPastEnd} onEscape={onEscape}>
      <ContentStyles contentType='comment'>
        <LexicalEditor
          key={lexicalEditorVersion}
          data={editorHtml}
          placeholder={`Why is ${user.displayName}'s content being rejected?`}
          onChange={handleEditorChange}
          commentEditor
        />
      </ContentStyles>
    </ComposerKeydownWrapper>}
    <ComposerSubmitButton label="Reject" disabled={!hasRejectedReason} onClick={handleReject} />
  </div>;
};

/**
 * Inline replacement for RejectContentDialog in the moderation sidebar:
 * clicking a template below the composer toggles it as a rejection reason.
 * Stays mounted while `active` is false so the draft survives the tab
 * being toggled closed and reopened. While collapsed, clicking a highlighted
 * template still toggles it into the draft (without opening the panel), and a
 * Send Rejection button (Cmd+R) appears once the draft has any reasons.
 */
const RejectContentPanel = ({ user, focusedContent, posts, comments, active, onRejected, onEscape }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[],
  active: boolean,
  // Called once the rejection mutation has completed
  onRejected?: () => void,
  // Escape anywhere in the panel closes its tab, as if it were clicked again
  onEscape: () => void,
}) => {
  const classes = useStyles(styles);
  const [templateSearchToken, setTemplateSearchToken] = useState(0);
  const [composerFocusToken, setComposerFocusToken] = useState(0);
  const [addedTemplates, setAddedTemplates] = useState<AddedRejectionTemplate[]>([]);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const toggleTemplateRef = useRef<(template: ModerationTemplateFragment) => void>(() => {});
  const rejectRef = useRef<() => void>(() => {});

  const insertedTemplateIds = useMemo(() => new Set(addedTemplates.map(t => t.templateId)), [addedTemplates]);

  const registerToggleTemplate = useCallback((fn: (template: ModerationTemplateFragment) => void) => {
    toggleTemplateRef.current = fn;
  }, []);

  const registerReject = useCallback((fn: () => void) => {
    rejectRef.current = fn;
  }, []);

  const hasDraftReasons = addedTemplates.length > 0;

  // Cmd/Ctrl+R sends the drafted rejection from anywhere in the inbox; with no
  // draft it stays the browser's reload shortcut
  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if (!hasDraftReasons) return;
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      rejectRef.current();
    }
  }, [hasDraftReasons]));

  const { overrides: ruleOverrides } = useHighlightRuleOverrides();
  const highlightedTemplateNames = useMemo(() => getHighlightedRejectionTemplateNames(focusedContent, {
    user,
    moderatorActions: user.moderatorActions ?? [],
    posts,
    comments,
    ruleOverrides,
  }), [focusedContent, user, posts, comments, ruleOverrides]);

  // The template search is the initial keyboard target whenever the tab is picked
  useEffect(() => {
    if (active) {
      setTemplateSearchToken(token => token + 1);
    }
  }, [active]);

  return <>
    <div className={classNames({ [classes.hiddenPanel]: !active })}>
      <RejectContentEditor
        user={user}
        focusedContent={focusedContent}
        active={active}
        editorContainerRef={editorContainerRef}
        composerFocusToken={composerFocusToken}
        registerToggleTemplate={registerToggleTemplate}
        registerReject={registerReject}
        addedTemplates={addedTemplates}
        setAddedTemplates={setAddedTemplates}
        onRejected={onRejected}
        onArrowDownPastEnd={() => setTemplateSearchToken(token => token + 1)}
        onEscape={onEscape}
      />
      <GroupedModerationTemplateList
        collectionName="Rejections"
        onTemplateClick={(template) => toggleTemplateRef.current(template)}
        highlightedTemplateNames={highlightedTemplateNames}
        insertedTemplateIds={insertedTemplateIds}
        focusSearchToken={templateSearchToken}
        active={active}
        onFocusComposer={() => setComposerFocusToken(token => token + 1)}
        onEscape={onEscape}
      />
    </div>
    {!active && (
      <>
        <GroupedModerationTemplateList
          collectionName="Rejections"
          onTemplateClick={(template) => toggleTemplateRef.current(template)}
          highlightedTemplateNames={highlightedTemplateNames}
          insertedTemplateIds={insertedTemplateIds}
          onlyHighlighted
          active={false}
        />
        {hasDraftReasons && (
          <div className={classes.collapsedSendButton}>
            <ComposerSubmitButton
              label="Send Rejection"
              keystroke="Ctrl+R"
              disabled={false}
              onClick={() => rejectRef.current()}
            />
          </div>
        )}
      </>
    )}
  </>;
};

export default RejectContentPanel;
