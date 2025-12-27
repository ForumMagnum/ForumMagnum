"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TablesPlugin, OPEN_TABLE_SELECTOR_COMMAND } from './lexicalPlugins/tables/TablesPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, EditorState } from 'lexical';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { FootnotesPlugin, INSERT_FOOTNOTE_COMMAND } from './lexicalPlugins/footnotes/FootnotesPlugin';
import { FootnoteReferenceNode } from './lexicalPlugins/footnotes/FootnoteReferenceNode';
import { FootnoteSectionNode } from './lexicalPlugins/footnotes/FootnoteSectionNode';
import { FootnoteItemNode } from './lexicalPlugins/footnotes/FootnoteItemNode';
import { FootnoteContentNode } from './lexicalPlugins/footnotes/FootnoteContentNode';
import { FootnoteBackLinkNode } from './lexicalPlugins/footnotes/FootnoteBackLinkNode';
import { MathPlugin, INSERT_INLINE_MATH_COMMAND, INSERT_DISPLAY_MATH_COMMAND, MathNode } from './lexicalPlugins/math/MathPlugin';
import { LinkEditorPlugin, OPEN_LINK_EDITOR_COMMAND } from './lexicalPlugins/links/LinkEditorPlugin';
import { preprocessHtmlForImport, restoreInternalIds, type InternalIdMap } from './lexicalPlugins/links/InternalBlockLinksPlugin';
import { MentionPlugin } from './lexicalPlugins/mentions/MentionPlugin';
import { getLexicalMentionFeeds } from './lexicalPlugins/mentions/lexicalMentionsConfig';
import { SpoilersPlugin, SpoilerNode, TOGGLE_SPOILER_COMMAND } from './lexicalPlugins/spoilers/SpoilersPlugin';
import { ClaimsPlugin, useInsertClaim } from './lexicalPlugins/claims/ClaimsPlugin';
import { ClaimNode } from './lexicalPlugins/claims/ClaimNode';
import { RemoveRedirectPlugin } from './lexicalPlugins/clipboard/RemoveRedirectPlugin';
import { LLMAutocompletePlugin } from './lexicalPlugins/autocomplete/LLMAutocompletePlugin';
import {
  CollapsibleSectionsPlugin,
  INSERT_COLLAPSIBLE_SECTION_COMMAND,
} from './lexicalPlugins/collapsibleSections/CollapsibleSectionsPlugin';
import { CollapsibleSectionContainerNode } from './lexicalPlugins/collapsibleSections/CollapsibleSectionContainerNode';
import { CollapsibleSectionTitleNode } from './lexicalPlugins/collapsibleSections/CollapsibleSectionTitleNode';
import { CollapsibleSectionContentNode } from './lexicalPlugins/collapsibleSections/CollapsibleSectionContentNode';
import ImagesPlugin from './lexicalPlugins/images/ImagesPlugin';
import { ImageNode } from './lexicalPlugins/images/ImageNode';
import { DragDropPaste } from './lexicalPlugins/dragDropPaste/DragDropPaste';

// URL regex for auto-linking
const URL_REGEX = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

// Email regex for auto-linking
const EMAIL_REGEX = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

// Matchers for AutoLinkPlugin
const URL_MATCHERS = [
  (text: string) => {
    const match = URL_REGEX.exec(text);
    if (match === null) return null;
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
    };
  },
  (text: string) => {
    const match = EMAIL_REGEX.exec(text);
    if (match === null) return null;
    return {
      index: match.index,
      length: match[0].length,
      text: match[0],
      url: `mailto:${match[0]}`,
    };
  },
];

const lexicalStyles = defineStyles('LexicalPostEditor', (theme: ThemeType) => ({
  editorContainer: {
    position: 'relative',
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.1rem',
    lineHeight: 1.7,
  },
  editorInner: {
    position: 'relative',
    background: theme.palette.panelBackground.default,
    borderRadius: 4,
  },
  editorInput: {
    minHeight: 400,
    resize: 'none',
    fontSize: '1.1rem',
    position: 'relative',
    outline: 'none',
    padding: '12px 16px',
    caretColor: theme.palette.text.normal,
    '&:focus': {
      outline: 'none',
    },
    // Content styles
    '& p': {
      margin: '0 0 1em 0',
    },
    '& h1': {
      fontSize: '1.8rem',
      fontWeight: 600,
      marginBottom: '0.5em',
      marginTop: '1em',
    },
    '& h2': {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginBottom: '0.5em',
      marginTop: '1em',
    },
    '& h3': {
      fontSize: '1.3rem',
      fontWeight: 600,
      marginBottom: '0.5em',
      marginTop: '1em',
    },
    '& blockquote': {
      margin: '1em 0',
      padding: '0.5em 1em',
      borderLeft: `4px solid ${theme.palette.grey[300]}`,
      color: theme.palette.grey[700],
      backgroundColor: theme.palette.grey[100],
    },
    '& ul, & ol': {
      margin: '0 0 1em 0',
      padding: '0 0 0 1.5em',
    },
    '& li': {
      margin: '0.25em 0',
    },
    '& code': {
      fontFamily: 'monospace',
      backgroundColor: theme.palette.grey[100],
      padding: '0.2em 0.4em',
      borderRadius: 4,
      fontSize: '0.9em',
    },
    '& pre': {
      margin: '1em 0',
      padding: '1em',
      backgroundColor: theme.palette.grey[100],
      borderRadius: 4,
      overflow: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
    '& strong': {
      fontWeight: 600,
    },
    '& em': {
      fontStyle: 'italic',
    },
    // Footnote styles
    '& .footnote-section': {
      marginTop: '2em',
      paddingTop: '1em',
      borderTop: `1px solid ${theme.palette.grey[300]}`,
      fontSize: '0.9em',
      listStyle: 'none',
      padding: 0,
    },
    '& .footnote-item': {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5em',
      marginBottom: '0.5em',
      padding: '0.5em',
      backgroundColor: theme.palette.grey[50],
      borderRadius: 4,
    },
    '& .footnote-content': {
      flex: 1,
      '& p': {
        margin: 0,
      },
    },
    '& .footnote-reference': {
      cursor: 'pointer',
      '& a': {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    },
    '& .footnote-back-link': {
      marginRight: '0.25em',
      '& a': {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    },
    // Math styles
    '& .math-tex': {
      cursor: 'pointer',
    },
    '& .math-preview': {
      fontFamily: 'inherit',
    },
    '& .math-inline': {
      display: 'inline-block',
      verticalAlign: 'middle',
    },
    '& .math-display': {
      display: 'block',
      textAlign: 'center',
      margin: '1em 0',
      padding: '0.5em',
    },
    // Spoiler styles
    '& .spoilers': {
      backgroundColor: theme.palette.grey[100],
      border: `1px solid ${theme.palette.grey[300]}`,
      borderRadius: 4,
      padding: '1em',
      margin: '1em 0',
      position: 'relative',
      '&::before': {
        content: '"Spoiler"',
        position: 'absolute',
        top: -10,
        left: 10,
        backgroundColor: theme.palette.panelBackground.default,
        padding: '0 4px',
        fontSize: '0.75em',
        color: theme.palette.grey[600],
        fontWeight: 500,
      },
    },
    // Claim/prediction styles
    '& .elicit-binary-prediction-wrapper': {
      margin: '1em 0',
    },
    // Table styles
    '& table': {
      borderCollapse: 'collapse',
      width: 'auto',
      margin: '1em 0',
      border: `1px solid ${theme.palette.grey[300]}`,
    },
    '& th, & td': {
      border: `1px solid ${theme.palette.grey[300]}`,
      padding: '8px 12px',
      minWidth: 50,
      verticalAlign: 'top',
      position: 'relative',
    },
    '& th': {
      backgroundColor: theme.palette.grey[100],
      fontWeight: 600,
      textAlign: 'left',
    },
    '& td': {
      backgroundColor: theme.palette.panelBackground.default,
    },
    // Selected cell highlighting (class applied by Lexical via theme.tableCellSelected)
    '& td.editor-table-cell-selected, & th.editor-table-cell-selected': {
      backgroundColor: theme.palette.primary.light,
    },
    // Table resize handles (if using column resize)
    '& .table-cell-resizer': {
      position: 'absolute',
      right: -2,
      top: 0,
      bottom: 0,
      width: 4,
      cursor: 'col-resize',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: theme.palette.primary.main,
      },
    },
    // Collapsible section styles
    '& .detailsBlock': {
      margin: '1em 0',
      border: `1px solid ${theme.palette.grey[300]}`,
      borderRadius: 4,
      overflow: 'hidden',
    },
    '& .detailsBlockEdit': {
      // In editing mode, we use a div instead of details for better cursor control
    },
    '& .detailsBlockTitle': {
      padding: '0.75em 1em',
      backgroundColor: theme.palette.grey[100],
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5em',
      '&::before': {
        content: '"▼"',
        fontSize: '0.75em',
        transition: 'transform 0.2s ease',
      },
      '& p': {
        margin: 0,
        flex: 1,
      },
    },
    '& .detailsBlockClosed .detailsBlockTitle::before': {
      transform: 'rotate(-90deg)',
    },
    '& .detailsBlockContent': {
      padding: '0.75em 1em',
      '& > p:first-child': {
        marginTop: 0,
      },
      '& > p:last-child': {
        marginBottom: 0,
      },
    },
    '& .detailsBlockClosed .detailsBlockContent': {
      display: 'none',
    },
    '& .detailsBlock.detailsBlockSelected': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
  editorInputComment: {
    minHeight: 100,
  },
  editorPlaceholder: {
    color: theme.palette.grey[500],
    overflow: 'hidden',
    position: 'absolute',
    textOverflow: 'ellipsis',
    top: 12,
    left: 16,
    fontSize: '1.1rem',
    userSelect: 'none',
    display: 'inline-block',
    pointerEvents: 'none',
  },
}), { allowNonThemeColors: true });

const lexicalTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
  // Table theme classes - required for table selection to work
  table: 'editor-table',
  tableCell: 'editor-table-cell',
  tableCellHeader: 'editor-table-cell-header',
  tableCellSelected: 'editor-table-cell-selected',
  tableRow: 'editor-table-row',
  tableSelection: 'editor-table-selection',
};

function onError(error: Error) {
  // eslint-disable-next-line no-console
  console.error('Lexical editor error:', error);
}

interface InitialContentPluginProps {
  initialHtml: string;
  onInternalIdsExtracted: (ids: InternalIdMap) => void;
}

/**
 * Plugin to load initial HTML content into the editor.
 * Also extracts data-internal-id attributes for preservation.
 */
function InitialContentPlugin({ initialHtml, onInternalIdsExtracted }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || !initialHtml) return;
    hasInitialized.current = true;

    // Extract internal IDs before processing
    const { html: cleanHtml, internalIds } = preprocessHtmlForImport(initialHtml);
    onInternalIdsExtracted(internalIds);

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(cleanHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
  }, [editor, initialHtml, onInternalIdsExtracted]);

  return null;
}

interface HtmlExportPluginProps {
  onChange: (html: string) => void;
  internalIds: InternalIdMap;
}

/**
 * Plugin to export editor content as HTML on changes.
 * Restores data-internal-id attributes from the original content.
 */
function HtmlExportPlugin({ onChange, internalIds }: HtmlExportPluginProps) {
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      let html = $generateHtmlFromNodes(editor, null);
      // Restore internal IDs to the exported HTML
      html = restoreInternalIds(html, internalIds);
      onChange(html);
    });
  }, [editor, onChange, internalIds]);

  return <OnChangePlugin onChange={handleChange} />;
}

/**
 * Basic toolbar plugin with formatting buttons
 */
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(toolbarStyles);
  const insertClaim = useInsertClaim();

  const insertCollapsibleSection = useCallback(() => {
    editor.dispatchCommand(INSERT_COLLAPSIBLE_SECTION_COMMAND, undefined);
  }, [editor]);

  const tableButtonRef = useRef<HTMLButtonElement>(null);
  
  const insertTable = useCallback(() => {
    if (tableButtonRef.current) {
      const rect = tableButtonRef.current.getBoundingClientRect();
      editor.dispatchCommand(OPEN_TABLE_SELECTOR_COMMAND, rect);
    }
  }, [editor]);

  const formatBold = useCallback(() => {
    editor.dispatchCommand(
      // Using FORMAT_TEXT_COMMAND
      { type: 'FORMAT_TEXT_COMMAND' } as any,
      'bold'
    );
  }, [editor]);

  const formatItalic = useCallback(() => {
    editor.dispatchCommand(
      { type: 'FORMAT_TEXT_COMMAND' },
      'italic'
    );
  }, [editor]);

  const insertFootnote = useCallback(() => {
    editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, {});
  }, [editor]);

  const insertInlineMath = useCallback(() => {
    editor.dispatchCommand(INSERT_INLINE_MATH_COMMAND, {});
  }, [editor]);

  const insertDisplayMath = useCallback(() => {
    editor.dispatchCommand(INSERT_DISPLAY_MATH_COMMAND, {});
  }, [editor]);

  const insertLink = useCallback(() => {
    editor.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
  }, [editor]);

  const toggleSpoiler = useCallback(() => {
    editor.dispatchCommand(TOGGLE_SPOILER_COMMAND, undefined);
  }, [editor]);

  return (
    <div className={classes.toolbar}>
      <button
        type="button"
        onClick={formatBold}
        className={classes.toolbarButton}
        aria-label="Format Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={formatItalic}
        className={classes.toolbarButton}
        aria-label="Format Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={insertLink}
        className={classes.toolbarButton}
        aria-label="Insert Link"
        title="Insert Link (Ctrl+K)"
      >
        <span style={{ textDecoration: 'underline' }}>🔗</span>
      </button>
      <button
        type="button"
        onClick={insertFootnote}
        className={classes.toolbarButton}
        aria-label="Insert Footnote"
        title="Insert Footnote"
      >
        <sup style={{ fontSize: '10px' }}>[1]</sup>
      </button>
      <button
        type="button"
        onClick={insertInlineMath}
        className={classes.toolbarButton}
        aria-label="Insert Inline Math"
        title="Insert Inline Math (LaTeX)"
      >
        <span style={{ fontStyle: 'italic' }}>∑</span>
      </button>
      <button
        type="button"
        onClick={insertDisplayMath}
        className={classes.toolbarButton}
        aria-label="Insert Display Math"
        title="Insert Display Math (LaTeX)"
      >
        <span style={{ fontStyle: 'italic', fontSize: '12px' }}>∫</span>
      </button>
      <button
        type="button"
        onClick={toggleSpoiler}
        className={classes.toolbarButton}
        aria-label="Toggle Spoiler"
        title="Toggle Spoiler Block (>!)"
      >
        <span style={{ fontSize: '12px' }}>👁️</span>
      </button>
      <button
        type="button"
        onClick={insertClaim}
        className={classes.toolbarButton}
        aria-label="Insert Claim"
        title="Insert Claim/Prediction"
      >
        <span style={{ fontSize: '12px' }}>📊</span>
      </button>
      <button
        type="button"
        onClick={insertCollapsibleSection}
        className={classes.toolbarButton}
        aria-label="Insert Collapsible Section"
        title="Insert Collapsible Section (+++)"
      >
        <span style={{ fontSize: '12px' }}>▶</span>
      </button>
      <button
        ref={tableButtonRef}
        type="button"
        onClick={insertTable}
        className={classes.toolbarButton}
        aria-label="Insert Table"
        title="Insert Table"
      >
        <span style={{ fontSize: '12px' }}>⊞</span>
      </button>
    </div>
  );
}

const toolbarStyles = defineStyles('LexicalToolbar', (theme: ThemeType) => ({
  toolbar: {
    display: 'flex',
    gap: 4,
    padding: '8px 12px',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    backgroundColor: theme.palette.grey[50],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  toolbarButton: {
    padding: '4px 8px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    backgroundColor: theme.palette.panelBackground.default,
    cursor: 'pointer',
    fontSize: '14px',
    minWidth: 28,
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
}), { allowNonThemeColors: true });

interface LexicalPostEditorProps {
  data?: string;
  placeholder?: string;
  onChange: (html: string) => void;
  onReady?: () => void;
  commentEditor?: boolean;
}

/**
 * Lexical-based rich text editor component
 * 
 * This is a prototype implementation for testing Lexical as a potential
 * replacement for CKEditor. It supports:
 * - Rich text editing (bold, italic, etc.)
 * - Headings (h1-h3)
 * - Lists (ordered and unordered)
 * - Blockquotes
 * - Code blocks
 * - Links
 * - Markdown shortcuts
 * - Undo/redo history
 * 
 * Content is stored as HTML for compatibility with existing content.
 */
const LexicalPostEditor = ({
  data = '',
  placeholder = 'Start writing...',
  onChange,
  onReady,
  commentEditor = false,
}: LexicalPostEditorProps) => {
  const classes = useStyles(lexicalStyles);
  // Store internal IDs extracted from the original HTML for preservation during export
  const internalIdsRef = useRef<InternalIdMap>(new Map());

  const handleInternalIdsExtracted = useCallback((ids: InternalIdMap) => {
    internalIdsRef.current = ids;
  }, []);

  const initialConfig = {
    namespace: 'ForumMagnumEditor',
    theme: lexicalTheme,
    onError,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      ImageNode,
      // Footnote nodes
      FootnoteReferenceNode,
      FootnoteSectionNode,
      FootnoteItemNode,
      FootnoteContentNode,
      FootnoteBackLinkNode,
      // Math node
      MathNode,
      // Spoiler node
      SpoilerNode,
      // Claim node
      ClaimNode,
      // Collapsible section nodes
      CollapsibleSectionContainerNode,
      CollapsibleSectionTitleNode,
      CollapsibleSectionContentNode,
    ],
  };

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <div className={classes.editorContainer}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className={classes.editorInner}>
          <ToolbarPlugin />
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`${classes.editorInput} ${commentEditor ? classes.editorInputComment : ''}`}
                aria-placeholder={placeholder}
                placeholder={<div className={classes.editorPlaceholder}>{placeholder}</div>}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <LinkEditorPlugin />
          <AutoLinkPlugin matchers={URL_MATCHERS} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <FootnotesPlugin />
          <MathPlugin />
          <MentionPlugin feeds={getLexicalMentionFeeds()} />
          <SpoilersPlugin />
          <ClaimsPlugin />
          <CollapsibleSectionsPlugin />
          <RemoveRedirectPlugin />
          <LLMAutocompletePlugin />
          <TablePlugin />
          <TablesPlugin />
          <ImagesPlugin captionsEnabled={true} />
          <DragDropPaste />
          <InitialContentPlugin 
            initialHtml={data} 
            onInternalIdsExtracted={handleInternalIdsExtracted}
          />
          <HtmlExportPlugin 
            onChange={onChange} 
            internalIds={internalIdsRef.current}
          />
        </div>
      </LexicalComposer>
    </div>
  );
};

export default LexicalPostEditor;

