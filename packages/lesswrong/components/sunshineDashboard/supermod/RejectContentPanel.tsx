import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import { focusLexicalEditorAtEnd } from '@/components/editor/focusLexicalEditor';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { useCompleteUserModeration } from './useCompleteUserModeration';
import { useMessages } from '@/components/common/withMessages';
import { useIsMounted } from '@/components/hooks/useIsMounted';
import { disabledPermissionsRejectionHtml, standardRejectionIntroHtml, standardRejectionIntroPlaintext } from '@/lib/collections/moderationTemplates/rejectionIntro';
import { getDraftMessageHtml } from '@/lib/collections/messages/helpers';
import GroupedModerationTemplateList from '../GroupedModerationTemplateList';
import ComposerKeydownWrapper from './ComposerKeydownWrapper';
import ComposerSubmitButton from './ComposerSubmitButton';
import { areAllContentPermissionsDisabled, isPost, isRejectionTemplateRelevant, type ContentItem } from './helpers';
import type { InboxAction } from './inboxReducer';
import ModerationSendOptions from './ModerationSendOptions';
import { DEFAULT_REJECTION_RATE_LIMIT_SETTINGS, getRateLimitParagraphHtml, getRateLimitsToCreate, type RejectionRateLimitSettings } from './RejectionRateLimitForm';


const ModerationTemplateUsageCountsQuery = gql(`
  query moderationTemplateUsageCountsRejectContentPanelQuery {
    moderationTemplateUsageCounts {
      templateId
      count
    }
  }
`);

// `loading` adds a Suspense boundary; without one, loading the editor blanks the page
const LexicalEditor = dynamic(() => import('@/components/editor/LexicalEditor'), { loading: () => null });

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
    padding: '6px 12px',
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 4,
    backgroundColor: theme.palette.greyAlpha(0.02),
    // One line tall until the moderator types or inserts a template
    '--lexical-comment-min-height': '1em',
  },
}));

interface AddedRejectionTemplate {
  templateId: string;
  lead: string;
  html: string;
}

function joinTemplateHtml(templates: AddedRejectionTemplate[]) {
  return templates.map(t => t.html).join('');
}

/**
 * Inserts html ahead of the paragraphs that close the message (the rate limit
 * and disabled-permissions notices), which stay last. A closing paragraph that
 * has been edited beyond recognition stays where it is.
 */
function insertBeforeParagraphs(message: string, html: string, laterParagraphs: string[]) {
  let rest = message;
  const moved: string[] = [];
  for (const paragraph of laterParagraphs) {
    const withoutParagraph = removeTemplateChunk(rest, paragraph);
    if (withoutParagraph !== null) {
      rest = withoutParagraph;
      moved.push(paragraph);
    }
  }
  return rest + [html, ...moved].join('');
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
 * removing those. Returns null when
 * the template can't be found — i.e. its own text has been edited — in which
 * case the caller leaves the document alone.
 */
function removeTemplateChunk(fullHtml: string, chunkHtml: string): string | null {
  if (fullHtml.includes(chunkHtml)) {
    return fullHtml.replace(chunkHtml, '');
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
    // Runs start on a block with text, so blank lines around the template stay put
    if (!normalizeText(blocks[start].textContent ?? '')) continue;
    let combined = '';
    for (let end = start; end < blocks.length; end++) {
      const blockText = normalizeText(blocks[end].textContent ?? '');
      if (blockText) {
        combined = combined ? `${combined} ${blockText}` : blockText;
      }
      if (combined === targetText) {
        blocks.slice(start, end + 1).forEach(block => block.remove());
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
const RejectContentEditor = ({ user, focusedContent, active, editorContainerRef, composerFocusToken, registerToggleTemplate, onArrowDownPastEnd, onEscape, onRejected, dispatch }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
  active: boolean,
  editorContainerRef: React.RefObject<HTMLDivElement | null>,
  // Bumped when the template list hands focus to the composer; opens the editor
  composerFocusToken: number,
  registerToggleTemplate: (fn: (template: ModerationTemplateFragment) => void) => void,
  onArrowDownPastEnd: () => void,
  onEscape: () => void,
  onRejected?: () => void,
  dispatch: React.ActionDispatch<[action: InboxAction]>,
}) => {
  const classes = useStyles(styles);
  const completeModeration = useCompleteUserModeration(dispatch);
  const { getIsMounted } = useIsMounted();
  const { flash } = useMessages();
  const [disablePermissions, setDisablePermissions] = useState(false);
  const permissionsAlreadyDisabled = areAllContentPermissionsDisabled(user);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [rateLimitSettings, setRateLimitSettings] = useState<RejectionRateLimitSettings>(DEFAULT_REJECTION_RATE_LIMIT_SETTINGS);
  // The rate limit paragraph currently in the message, to replace as the settings change
  const insertedRateLimitHtmlRef = useRef<string | null>(null);
  const [rejectAll, setRejectAll] = useState(false);
  // Templates and the side options rewrite the message without taking focus from where it is
  const [keepFocusOnEditorLoad, setKeepFocusOnEditorLoad] = useState(false);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // Source of truth while the preview is showing; the reasons html is derived
  const [addedTemplates, setAddedTemplates] = useState<AddedRejectionTemplate[]>([]);
  // Full message (intro + reasons), canonical once the editor is open
  const fullMessageRef = useRef('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');
  const [lexicalEditorVersion, setLexicalEditorVersion] = useState(0);
  const handledFocusTokenRef = useRef(0);

  // Remounts the editor (opening it if needed) with a rewritten message
  const loadMessage = useCallback((html: string, { keepFocus }: { keepFocus: boolean }) => {
    fullMessageRef.current = html;
    setEditorHtml(html);
    setLexicalEditorVersion(prev => prev + 1);
    setKeepFocusOnEditorLoad(keepFocus);
    setEditorOpen(true);
  }, []);

  const openEditor = useCallback(() => {
    if (editorOpen) return;
    loadMessage(standardRejectionIntroHtml + joinTemplateHtml(addedTemplates), { keepFocus: false });
  }, [editorOpen, addedTemplates, loadMessage]);

  // Focus once the editor has mounted after opening
  useEffect(() => {
    if (editorOpen && !keepFocusOnEditorLoad) {
      focusLexicalEditorAtEnd(editorContainerRef.current);
    }
  }, [editorOpen, keepFocusOnEditorLoad, editorContainerRef]);

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
      const added = { templateId: template._id, lead: extractBoldLead(html), html };
      setAddedTemplates(prev => [...prev, added]);
      if (editorOpen) {
        const closingParagraphs = [
          insertedRateLimitHtmlRef.current,
          disablePermissions ? disabledPermissionsRejectionHtml : null,
        ].filter((paragraph): paragraph is string => !!paragraph);
        loadMessage(insertBeforeParagraphs(fullMessageRef.current, html, closingParagraphs), { keepFocus: true });
      } else {
        loadMessage(standardRejectionIntroHtml + joinTemplateHtml([...addedTemplates, added]), { keepFocus: true });
      }
      return;
    }

    if (editorOpen) {
      // Only drop the entry if the template was actually excised; if the
      // moderator has edited the template's own text it can't be identified
      // anymore, and the toggle leaves everything (custom edits included) alone
      const withChunkRemoved = removeTemplateChunk(fullMessageRef.current, existing.html);
      if (withChunkRemoved === null) return;
      loadMessage(withChunkRemoved, { keepFocus: true });
    }
    setAddedTemplates(prev => prev.filter(t => t.templateId !== template._id));
  }, [addedTemplates, editorOpen, disablePermissions, user.displayName, loadMessage]);

  // Like a template: the paragraph announcing the disabled permissions goes into the editable message
  const toggleDisablePermissions = useCallback((checked: boolean) => {
    let message = editorOpen ? fullMessageRef.current : standardRejectionIntroHtml + joinTemplateHtml(addedTemplates);
    if (checked) {
      message += disabledPermissionsRejectionHtml;
    } else if (editorOpen) {
      // As with templates, an edited paragraph can't be found, so it stays (and so does the checkbox)
      const withParagraphRemoved = removeTemplateChunk(message, disabledPermissionsRejectionHtml);
      if (withParagraphRemoved === null) return;
      message = withParagraphRemoved;
    }
    setDisablePermissions(checked);
    loadMessage(message, { keepFocus: true });
  }, [editorOpen, addedTemplates, loadMessage]);

  // Rewrites the rate limit paragraph as the settings change; it sits above the permissions paragraph
  const updateRateLimit = useCallback((enabled: boolean, settings: RejectionRateLimitSettings) => {
    setRateLimitEnabled(enabled);
    setRateLimitSettings(settings);
    const newHtml = enabled ? getRateLimitParagraphHtml(settings) : null;
    const oldHtml = insertedRateLimitHtmlRef.current;
    if (newHtml === oldHtml) return;

    let message = editorOpen ? fullMessageRef.current : standardRejectionIntroHtml + joinTemplateHtml(addedTemplates);
    if (oldHtml) {
      const withoutOldParagraph = removeTemplateChunk(message, oldHtml);
      // The moderator has edited it by hand, so their wording stays
      if (withoutOldParagraph === null) return;
      message = withoutOldParagraph;
    }
    if (newHtml) {
      message = insertBeforeParagraphs(message, newHtml, disablePermissions ? [disabledPermissionsRejectionHtml] : []);
    }
    insertedRateLimitHtmlRef.current = newHtml;
    loadMessage(message, { keepFocus: true });
  }, [editorOpen, addedTemplates, disablePermissions, loadMessage]);

  useEffect(() => {
    registerToggleTemplate(toggleTemplate);
    return () => registerToggleTemplate(() => {});
  }, [registerToggleTemplate, toggleTemplate]);

  const hasRejectedReason = editorOpen || addedTemplates.length > 0;

  const handleReject = useCallback(async () => {
    const reason = editorOpen ? fullMessageRef.current : joinTemplateHtml(addedTemplates);
    if (!reason || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const rateLimits = rateLimitEnabled ? getRateLimitsToCreate(rateLimitSettings, user._id) : [];
      await completeModeration({
        userId: user._id,
        rejection: { documentId: focusedContent._id, collectionName: isPost(focusedContent) ? 'Posts' : 'Comments', reason, templateIds: addedTemplates.map(template => template.templateId) },
        rateLimits,
        disablePermissions: disablePermissions && !permissionsAlreadyDisabled,
        rejectAll,
        removeFromQueue: rejectAll,
      });
      // A different content item now owns the composer if this keyed panel unmounted.
      if (!getIsMounted()) return;
      setDisablePermissions(false);
      setRateLimitEnabled(false);
      setRateLimitSettings(DEFAULT_REJECTION_RATE_LIMIT_SETTINGS);
      insertedRateLimitHtmlRef.current = null;
      setRejectAll(false);
      if (editorOpen && fullMessageRef.current !== reason) return;
      fullMessageRef.current = '';
      setAddedTemplates([]);
      setEditorOpen(false);
      setEditorHtml('');
      setLexicalEditorVersion(prev => prev + 1);
      onRejected?.();
    } catch (error) {
      flash({ messageString: `Moderation action did not complete. Retry to finish it: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    } finally {
      submittingRef.current = false;
      if (getIsMounted()) setSubmitting(false);
    }
  }, [editorOpen, addedTemplates, disablePermissions, permissionsAlreadyDisabled, rateLimitEnabled, rateLimitSettings, rejectAll, focusedContent, completeModeration, user._id, flash, onRejected, getIsMounted]);

  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if (!active) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && hasRejectedReason) {
      e.preventDefault();
      void handleReject();
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
          keepFocusOnLoad={keepFocusOnEditorLoad}
        />
      </ContentStyles>
    </ComposerKeydownWrapper>}
    <ModerationSendOptions
      rateLimitEnabled={rateLimitEnabled}
      rateLimitSettings={rateLimitSettings}
      onRateLimitChange={updateRateLimit}
      showDisablePermissions={!permissionsAlreadyDisabled}
      disablePermissions={disablePermissions}
      onDisablePermissionsChange={toggleDisablePermissions}
      rejectAll={rejectAll}
      rejectAllLabel="Reject all pending content, remove from queue"
      rejectAllTooltip="User receives rejection notice for each rejected submission."
      onRejectAllChange={setRejectAll}
    />
    <ComposerSubmitButton label="Reject" disabled={!hasRejectedReason || submitting} onClick={handleReject} />
  </div>;
};

/**
 * Inline replacement for RejectContentDialog in the moderation sidebar:
 * clicking a template below the composer toggles it as a rejection reason.
 * Stays mounted while `active` is false so the draft survives the tab
 * being toggled closed and reopened.
 */
const RejectContentPanel = ({ user, focusedContent, active, rejectComposerFocusToken, onEscape, onRejected, dispatch }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
  active: boolean,
  rejectComposerFocusToken: number,
  onEscape: () => void,
  onRejected?: () => void,
  dispatch: React.ActionDispatch<[action: InboxAction]>,
}) => {
  const { data: usageData } = useQuery(ModerationTemplateUsageCountsQuery, { ssr: false });
  const usageCounts = useMemo(
    () => new Map((usageData?.moderationTemplateUsageCounts ?? []).map(({ templateId, count }) => [templateId, count])),
    [usageData],
  );
  const compareTemplates = useCallback(
    (a: ModerationTemplateFragment, b: ModerationTemplateFragment) => (usageCounts.get(b._id) ?? 0) - (usageCounts.get(a._id) ?? 0),
    [usageCounts],
  );
  const [templateSearchToken, setTemplateSearchToken] = useState(0);
  const [composerFocusToken, setComposerFocusToken] = useState(0);
  const handledComposerFocusTokenRef = useRef(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const toggleTemplateRef = useRef<(template: ModerationTemplateFragment) => void>(() => {});

  const registerToggleTemplate = useCallback((fn: (template: ModerationTemplateFragment) => void) => {
    toggleTemplateRef.current = fn;
  }, []);

  const templateFilter = useCallback(
    (template: ModerationTemplateFragment) => isRejectionTemplateRelevant(template.name, focusedContent),
    [focusedContent],
  );

  // The registered I command selects this tab and explicitly requests editor focus.
  useEffect(() => {
    if (!rejectComposerFocusToken) handledComposerFocusTokenRef.current = 0;
    if (!active) return;
    if (rejectComposerFocusToken && rejectComposerFocusToken !== handledComposerFocusTokenRef.current) {
      handledComposerFocusTokenRef.current = rejectComposerFocusToken;
      setComposerFocusToken(token => token + 1);
    } else {
      handledComposerFocusTokenRef.current = rejectComposerFocusToken;
      setTemplateSearchToken(token => token + 1);
    }
  }, [active, rejectComposerFocusToken]);

  return <>
    <RejectContentEditor
      user={user}
      focusedContent={focusedContent}
      active={active}
      editorContainerRef={editorContainerRef}
      composerFocusToken={composerFocusToken}
      registerToggleTemplate={registerToggleTemplate}
      onArrowDownPastEnd={() => setTemplateSearchToken(token => token + 1)}
      onEscape={onEscape}
      onRejected={onRejected}
      dispatch={dispatch}
    />
    <GroupedModerationTemplateList
      collectionName="Rejections"
      onTemplateClick={(template) => toggleTemplateRef.current(template)}
      focusSearchToken={templateSearchToken}
      active={active}
      onFocusComposer={() => setComposerFocusToken(token => token + 1)}
      onEscape={onEscape}
      layout="flat"
      compareTemplates={compareTemplates}
      templateFilter={templateFilter}
      numberShortcuts
    />
  </>;
};

export default RejectContentPanel;
