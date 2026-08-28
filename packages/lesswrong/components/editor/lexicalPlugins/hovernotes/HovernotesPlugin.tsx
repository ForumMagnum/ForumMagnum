"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
} from 'lexical';
import { mergeRegister, $getNearestNodeOfType } from '@lexical/utils';
import { $wrapSelectionInMarkNode } from '@lexical/mark';
import { $generateHtmlFromNodes } from '@lexical/html';
import { useMutation } from '@apollo/client/react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import LWPopper from '@/components/common/LWPopper';
import { Card } from '@/components/widgets/Paper';
import { PencilFillIcon } from '@/components/lexical/icons/PencilFillIcon';
import { generateFootnoteId } from '../footnotes/constants';
import { FootnoteItemNode } from '../footnotes/FootnoteItemNode';
import {
  $appendNewFootnoteItem,
  $getFootnoteItems,
  $removeFootnote,
  $reorderFootnotes,
} from '../footnotes/helpers';
import { useLexicalEditorContext } from '@/components/editor/LexicalEditorContext';
import { HovernoteNode, $createHovernoteNode, $isHovernoteNode, HOVERNOTE_CLASS } from './HovernoteNode';
import { getFootnoteContentHtml, isBlankHtml, writeFootnoteContentHtml } from './hovernoteContentSync';
import HovernoteEditorPanel, { HovernoteEditorAnchor } from './HovernoteEditorPanel';

export const INSERT_HOVERNOTE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_HOVERNOTE_COMMAND'
);

const generateHovernoteSuggestionMutation = gql(`
  mutation generateHovernoteSuggestion($phrase: String!, $surroundingText: String, $documentHtml: String!, $postId: String) {
    generateHovernoteSuggestion(phrase: $phrase, surroundingText: $surroundingText, documentHtml: $documentHtml, postId: $postId)
  }
`);

const styles = defineStyles('HovernoteHoverCard', (theme: ThemeType) => ({
  // Mirrors FootnotePreview's hovercard, so the editor hover matches the
  // reader-facing one.
  hovercard: {
    padding: 16,
    ...theme.typography.body2,
    fontSize: '1.1rem',
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    maxWidth: 500,
    '& a': {
      color: theme.palette.primary.main,
    },
    '& .footnote-back-link': {
      display: 'none',
    },
  },
  editButton: {
    border: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    borderRadius: 6,
    padding: '3px 6px',
    marginTop: 8,
    cursor: 'pointer',
    fontSize: 12,
    color: theme.palette.grey[600],
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.grey[900],
    },
  },
  editIcon: {
    width: 12,
    height: 12,
  },
}));

interface PanelState {
  footnoteId: string;
  anchor: HovernoteEditorAnchor;
  initialHtml: string;
  contentVersion: number;
}

interface HoverState {
  footnoteId: string;
  anchorEl: HTMLElement;
  html: string;
}

interface SuggestionJob {
  footnoteId: string;
  state: 'pending' | 'error';
  error?: string;
}

function $getAncestorHovernote(node: LexicalNode): HovernoteNode | null {
  if ($isHovernoteNode(node)) {
    return node;
  }
  return $getNearestNodeOfType(node, HovernoteNode);
}

/** The hovernote the selection is inside of or intersecting, if any. */
function $getSelectedHovernote(selection: RangeSelection): HovernoteNode | null {
  for (const node of selection.getNodes()) {
    const hovernote = $getAncestorHovernote(node);
    if (hovernote) {
      return hovernote;
    }
  }
  return null;
}

function $selectionIntersectsFootnoteSection(selection: RangeSelection): boolean {
  return selection.getNodes().some((node) => !!$getNearestNodeOfType(node, FootnoteItemNode));
}

function findHovernoteElement(editor: LexicalEditor, footnoteId: string): HTMLElement | null {
  const rootElement = editor.getRootElement();
  if (!rootElement) {
    return null;
  }
  return rootElement.querySelector<HTMLElement>(
    `.${HOVERNOTE_CLASS}[data-footnote-id="${footnoteId}"]`
  );
}

/** The full highlighted phrase for a hovernote (across split spans, if any). */
function getHovernotePhrase(editor: LexicalEditor, footnoteId: string): string {
  const rootElement = editor.getRootElement();
  if (!rootElement) {
    return '';
  }
  const spans = Array.from(rootElement.querySelectorAll<HTMLElement>(
    `.${HOVERNOTE_CLASS}[data-footnote-id="${footnoteId}"]`
  ));
  return spans.map((span) => span.textContent ?? '').join(' ').trim();
}

function getSurroundingText(editor: LexicalEditor, footnoteId: string): string {
  const spanEl = findHovernoteElement(editor, footnoteId);
  const blockEl = spanEl?.closest('p, li, blockquote, h1, h2, h3, h4, h5, h6') ?? spanEl?.parentElement;
  return blockEl?.textContent?.trim() ?? '';
}

function hovernoteElementFromEventTarget(editor: LexicalEditor, target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const el = target.closest<HTMLElement>(`.${HOVERNOTE_CLASS}`);
  const rootElement = editor.getRootElement();
  if (!el || !rootElement || !rootElement.contains(el)) {
    return null;
  }
  return el;
}

export function HovernotesPlugin({ isSuggestionMode }: { isSuggestionMode?: boolean }): React.ReactElement | null {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const { flash } = useMessages();
  const { isPostEditor, documentId } = useLexicalEditorContext();
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [job, setJob] = useState<SuggestionJob | null>(null);
  // The latest HTML typed into the popup editor, applied on close.
  const latestHtmlRef = useRef<string>('');
  const panelRef = useRef<PanelState | null>(null);
  panelRef.current = panel;

  const [generateSuggestion] = useMutation(generateHovernoteSuggestionMutation);

  // Clearing the hover card is delayed slightly so the pointer can cross the
  // gap from the highlighted span into the card without dismissing it.
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelHoverClear = useCallback(() => {
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }
  }, []);
  const scheduleHoverClear = useCallback(() => {
    cancelHoverClear();
    hoverClearTimer.current = setTimeout(() => setHover(null), 150);
  }, [cancelHoverClear]);
  useEffect(() => cancelHoverClear, [cancelHoverClear]);

  const openPanelForId = useCallback((footnoteId: string) => {
    const spanEl = findHovernoteElement(editor, footnoteId);
    if (!spanEl) {
      return;
    }
    const rect = spanEl.getBoundingClientRect();
    const initialHtml = getFootnoteContentHtml(editor, footnoteId);
    latestHtmlRef.current = initialHtml;
    setHover(null);
    setPanel((prev) => ({
      footnoteId,
      anchor: {
        left: rect.left + window.scrollX,
        bottom: rect.bottom + window.scrollY,
      },
      initialHtml,
      contentVersion: (prev?.contentVersion ?? 0) + 1,
    }));
  }, [editor]);

  const removeHovernote = useCallback(() => {
    const currentPanel = panelRef.current;
    if (!currentPanel) {
      return;
    }
    editor.update(() => {
      const item = $getFootnoteItems().find((i) => i.getFootnoteId() === currentPanel.footnoteId);
      if (item) {
        // Removes the footnote item and unwraps the hovernote span(s),
        // keeping the highlighted text.
        $removeFootnote(item);
      }
    });
    setPanel(null);
    editor.focus();
  }, [editor]);

  const closePanel = useCallback(() => {
    const currentPanel = panelRef.current;
    // Cancelling out of a hovernote that has no content yet (e.g. Escape right
    // after creating one) discards it rather than leaving an empty note.
    if (currentPanel && isBlankHtml(getFootnoteContentHtml(editor, currentPanel.footnoteId))) {
      removeHovernote();
      return;
    }
    setPanel(null);
    editor.focus();
  }, [editor, removeHovernote]);

  const applyPanel = useCallback(() => {
    const currentPanel = panelRef.current;
    if (!currentPanel) {
      return;
    }
    // Applying an empty note removes the hovernote instead of keeping a blank one.
    if (isBlankHtml(latestHtmlRef.current)) {
      removeHovernote();
      return;
    }
    writeFootnoteContentHtml(editor, currentPanel.footnoteId, latestHtmlRef.current);
    setPanel(null);
    editor.focus();
  }, [editor, removeHovernote]);

  const startAutogenerate = useCallback(() => {
    const currentPanel = panelRef.current;
    if (!currentPanel || job?.state === 'pending') {
      return;
    }
    const { footnoteId } = currentPanel;
    const phrase = getHovernotePhrase(editor, footnoteId);
    if (!phrase) {
      return;
    }
    const surroundingText = getSurroundingText(editor, footnoteId);
    const documentHtml = editor.read(() => $generateHtmlFromNodes(editor, null));
    setJob({ footnoteId, state: 'pending' });
    generateSuggestion({
      variables: {
        phrase,
        surroundingText,
        documentHtml,
        postId: isPostEditor ? documentId : null,
      },
    }).then((result) => {
      const html = result.data?.generateHovernoteSuggestion;
      if (!html) {
        throw new Error('Empty suggestion');
      }
      setJob(null);
      const openPanel = panelRef.current;
      if (openPanel && openPanel.footnoteId === footnoteId) {
        // Land the suggestion in the still-open popup, so Apply commits it.
        latestHtmlRef.current = html;
        setPanel({
          ...openPanel,
          initialHtml: html,
          contentVersion: openPanel.contentVersion + 1,
        });
      } else {
        // The popup was closed in the meantime; land it on the footnote directly.
        writeFootnoteContentHtml(editor, footnoteId, html);
      }
    }).catch((error: Error) => {
      setJob({ footnoteId, state: 'error', error: error.message });
    });
  }, [editor, generateSuggestion, isPostEditor, documentId, job]);

  // Insert command: wrap the selection in a hovernote and open the popup.
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_HOVERNOTE_COMMAND,
        () => {
          if (isSuggestionMode) {
            flash({ messageString: 'Hovernotes are not supported in suggestion mode', type: 'error' });
            return true;
          }
          let openId: string | null = null;
          let blockedMessage: string | null = null;
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              return;
            }
            const existing = $getSelectedHovernote(selection);
            if (existing) {
              // Already (partly) inside a hovernote: edit it rather than nesting.
              openId = existing.getFootnoteId();
              return;
            }
            if (selection.isCollapsed()) {
              blockedMessage = 'Select the text the hovernote should highlight';
              return;
            }
            if ($selectionIntersectsFootnoteSection(selection)) {
              blockedMessage = 'Hovernotes cannot be created inside footnotes';
              return;
            }
            const id = generateFootnoteId();
            $appendNewFootnoteItem(id);
            $wrapSelectionInMarkNode(
              selection,
              selection.isBackward(),
              id,
              (ids) => $createHovernoteNode(ids[0] ?? id),
            );
            $reorderFootnotes();
            openId = id;
          }, {
            onUpdate: () => {
              if (openId) {
                openPanelForId(openId);
              }
            },
          });
          if (blockedMessage) {
            flash({ messageString: blockedMessage, type: 'error' });
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
    );
  }, [editor, isSuggestionMode, flash, openPanelForId]);

  // Hover card: show the footnote content when hovering a hovernote span.
  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
      const el = hovernoteElementFromEventTarget(editor, event.target);
      if (!el) {
        return;
      }
      if (panelRef.current) {
        return;
      }
      const footnoteId = el.getAttribute('data-footnote-id');
      if (!footnoteId) {
        return;
      }
      const html = getFootnoteContentHtml(editor, footnoteId);
      cancelHoverClear();
      setHover({ footnoteId, anchorEl: el, html });
    };
    const handleMouseOut = (event: MouseEvent) => {
      const el = hovernoteElementFromEventTarget(editor, event.target);
      if (!el) {
        return;
      }
      const to = event.relatedTarget;
      if (to instanceof Node && el.contains(to)) {
        return;
      }
      scheduleHoverClear();
    };

    return editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener('mouseover', handleMouseOver);
      prevRootElement?.removeEventListener('mouseout', handleMouseOut);
      rootElement?.addEventListener('mouseover', handleMouseOver);
      rootElement?.addEventListener('mouseout', handleMouseOut);
    });
  }, [editor, cancelHoverClear, scheduleHoverClear]);

  const panelJob = job && panel && job.footnoteId === panel.footnoteId ? job : null;

  return (
    <>
      {hover && !panel && (
        <LWPopper
          open={true}
          anchorEl={hover.anchorEl}
          placement="bottom-start"
          allowOverflow
          clickable
        >
          <span
            onMouseEnter={cancelHoverClear}
            onMouseLeave={scheduleHoverClear}
          >
            <Card>
              <ContentStyles contentType="postHighlight" className={classes.hovercard}>
                <ContentItemBody dangerouslySetInnerHTML={{ __html: hover.html }} />
                {editor.isEditable() && !isSuggestionMode && (
                  <button
                    type="button"
                    className={classes.editButton}
                    onClick={() => openPanelForId(hover.footnoteId)}
                  >
                    <PencilFillIcon className={classes.editIcon} />
                    Edit hovernote
                  </button>
                )}
              </ContentStyles>
            </Card>
          </span>
        </LWPopper>
      )}
      {panel && (
        <HovernoteEditorPanel
          key={`${panel.footnoteId}`}
          anchor={panel.anchor}
          initialHtml={panel.initialHtml}
          contentVersion={panel.contentVersion}
          generating={panelJob?.state === 'pending'}
          generateError={panelJob?.state === 'error' ? (panelJob.error ?? 'Suggestion failed') : null}
          onHtmlChange={(html) => { latestHtmlRef.current = html; }}
          onApply={applyPanel}
          onCancel={closePanel}
          onRemove={removeHovernote}
          onAutogenerate={startAutogenerate}
        />
      )}
    </>
  );
}
