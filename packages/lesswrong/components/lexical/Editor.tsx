/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {useContext, type JSX} from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {CharacterLimitPlugin} from '@lexical/react/LexicalCharacterLimitPlugin';
import {CheckListPlugin} from '@lexical/react/LexicalCheckListPlugin';
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import {ClickableLinkPlugin} from '@lexical/react/LexicalClickableLinkPlugin';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {
  CollaborationPlugin,
  CollaborationPluginV2__EXPERIMENTAL,
} from '@lexical/react/LexicalCollaborationPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {SelectionAlwaysOnDisplay} from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import {TabIndentationPlugin} from '@lexical/react/LexicalTabIndentationPlugin';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import {useLexicalEditable} from '@lexical/react/useLexicalEditable';
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Doc} from 'yjs';
import * as Y from 'yjs';
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {$getRoot, $insertNodes} from 'lexical';
import { CodeBlockPlugin } from '../editor/lexicalPlugins/codeBlock/CodeBlockPlugin';
import TablesPlugin from '../editor/lexicalPlugins/tables/TablesPlugin';

import {
  createWebsocketProvider,
  createWebsocketProviderWithDoc,
  setCollaborationConfig,
  CollaboratorIdentityProvider,
  type CollaborationConfig,
  type CollaboratorIdentity,
} from './collaboration';
import {useSettings} from './context/SettingsContext';
import {useSharedHistoryContext} from './context/SharedHistoryContext';
// import ActionsPlugin from './plugins/ActionsPlugin';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import CodeKeyboardPlugin from './plugins/CodeKeyboardPlugin';
import CodeHighlightCSSPlugin from './plugins/CodeHighlightCSSPlugin';
import CollapsibleSectionsPlugin from '../editor/lexicalPlugins/collapsibleSections/CollapsibleSectionsPlugin';
import ContainerQuotePlugin from '../editor/lexicalPlugins/quote/ContainerQuotePlugin';
import CommentPlugin from './plugins/CommentPlugin';
import { CommentStoreProvider } from './commenting/CommentStoreContext';
import { MarkNodesProvider } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DateTimePlugin from './plugins/DateTimePlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
// import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import { MathPlugin } from '../editor/lexicalPlugins/math/MathPlugin';
// import ExcalidrawPlugin from './plugins/ExcalidrawPlugin';
import FigmaPlugin from './plugins/FigmaPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
// import KeywordsPlugin from './plugins/KeywordsPlugin';
import {LayoutPlugin} from './plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import MarkdownShortcutPlugin from './plugins/MarkdownShortcutPlugin';
import {MaxLengthPlugin} from './plugins/MaxLengthPlugin';
import MentionsPlugin from './plugins/MentionsPlugin';
import PageBreakPlugin from './plugins/PageBreakPlugin';
import PollPlugin from './plugins/PollPlugin';
import DisableUnderlinePlugin from './plugins/DisableUnderlinePlugin';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
import SubmitOnCmdEnterPlugin from './plugins/SubmitOnCmdEnterPlugin';
// import SpecialTextPlugin from './plugins/SpecialTextPlugin';
// import SpeechToTextPlugin from './plugins/SpeechToTextPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
// import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TableHoverActionsV2Plugin from './plugins/TableHoverActionsV2Plugin';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import TableScrollShadowPlugin from './plugins/TableScrollShadowPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
// import TreeViewPlugin from './plugins/TreeViewPlugin';
// import TwitterPlugin from './embeds/TwitterEmbed/TwitterPlugin';
import {VersionsPlugin} from './plugins/VersionsPlugin';
import YjsUndoCursorPlugin from './plugins/YjsUndoCursorPlugin';
import YouTubePlugin from './embeds/YouTubeEmbed/YouTubePlugin';
import MetaculusPlugin from './embeds/MetaculusEmbed/MetaculusPlugin';
import ThoughtsaverPlugin from './embeds/ThoughtsaverEmbed/ThoughtsaverPlugin';
import ManifoldPlugin from './embeds/ManifoldEmbed/ManifoldPlugin';
import NeuronpediaPlugin from './embeds/NeuronpediaEmbed/NeuronpediaPlugin';
import StrawpollPlugin from './embeds/StrawpollEmbed/StrawpollPlugin';
import MetaforecastPlugin from './embeds/MetaforecastEmbed/MetaforecastPlugin';
import OWIDPlugin from './embeds/OWIDEmbed/OWIDPlugin';
import EstimakerPlugin from './embeds/EstimakerEmbed/EstimakerPlugin';
import ViewpointsPlugin from './embeds/ViewpointsEmbed/ViewpointsPlugin';
import CalendlyPlugin from './embeds/CalendlyEmbed/CalendlyPlugin';
import LWArtifactsPlugin from './embeds/LWArtifactsEmbed/LWArtifactsPlugin';
import ContentEditable from './ui/ContentEditable';
import { FootnotesPlugin } from '../editor/lexicalPlugins/footnotes/FootnotesPlugin';
import { FootnoteSidenotesPlugin } from '../editor/lexicalPlugins/footnotes/FootnoteSidenotesPlugin';
import SpoilersPlugin from '../editor/lexicalPlugins/spoilers/SpoilersPlugin';
import LLMContentBlockPlugin from '../editor/lexicalPlugins/llmContentOutput/LLMContentBlockPlugin';
import ClaimsPlugin from './embeds/ElicitEmbed/ClaimsPlugin';
import ReviewResultsPlugin from './embeds/ReviewResultsEmbed/ReviewResultsPlugin';
import IframeWidgetPlugin from './embeds/IframeWidgetEmbed/IframeWidgetPlugin';
import RemoveRedirectPlugin from '../editor/lexicalPlugins/clipboard/RemoveRedirectPlugin';
import LLMAutocompletePlugin from '../editor/lexicalPlugins/autocomplete/LLMAutocompletePlugin';
import SuggestedEditsPlugin from '../editor/lexicalPlugins/suggestedEdits/SuggestedEditsPlugin';
import { EditorUserMode, getDefaultEditorUserMode, type EditorUserModeType } from '../editor/lexicalPlugins/suggestions/EditorUserMode';
import { SET_USER_MODE_COMMAND } from '../editor/lexicalPlugins/suggestedEdits/Commands';
import BlockCursorNavigationPlugin from '../editor/lexicalPlugins/blockCursorNavigation/BlockCursorNavigationPlugin';
import { SideCommentsPlugin } from '../editor/lexicalPlugins/sideComments/SideCommentsPlugin';
import HorizontalRuleEnterPlugin from '../editor/lexicalPlugins/horizontalRuleEnter';
import {
  preprocessHtmlForImport,
  restoreInternalIds,
  InternalIdMap,
} from '../editor/lexicalPlugins/links/InternalBlockLinksPlugin';
import { getDataWithDiscardedSuggestions } from '../editor/lexicalPlugins/suggestedEdits/getDataWithDiscardedSuggestions';
import { type CollaborativeEditingAccessLevel, accessLevelCan } from '@/lib/collections/posts/collabEditingPermissions';
import { useIsAboveBreakpoint } from '../hooks/useScreenWidth';
import { HorizontalRulePlugin } from './plugins/LexicalHorizontalRulePlugin';
import { EditorUserModeContext } from '@/components/common/sharedContexts';

const styles = defineStyles('LexicalEditor', (theme: ThemeType) => ({
  '@keyframes sentinelCursorBlink': {
    to: {
      visibility: 'hidden',
    },
  },
  editorContainer: {
    background: theme.palette.grey[0],
    position: 'relative',
    display: 'block',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    // --gutter-chars is set by CodeKeyboardPlugin to the digit count
    // of the largest line number; padding-left and gutter width adapt accordingly.
    '& .code-block': {
      backgroundColor: theme.palette.grey[100],
      fontFamily: theme.typography.code.fontFamily,
      display: 'block',
      padding: '8px 8px 8px calc(var(--gutter-chars, 1) * 1ch + 25px)',
      lineHeight: 1.53,
      fontSize: 13,
      margin: '8px 0',
      overflowX: 'auto',
      whiteSpace: 'pre',
      position: 'relative',
      tabSize: 2,
    },
    '& .code-block::before': {
      content: 'attr(data-gutter)',
      position: 'absolute',
      backgroundColor: theme.palette.grey[200],
      left: 0,
      top: 0,
      borderRight: `1px solid ${theme.palette.grey[300]}`,
      padding: 8,
      color: theme.palette.grey[600],
      whiteSpace: 'pre-wrap',
      textAlign: 'right',
      minWidth: 'calc(var(--gutter-chars, 1) * 1ch)',
    },
    '& .code-token-comment': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenComment,
    },
    '& .code-token-deleted': {
      borderImage: theme.palette.lexicalEditor.codeHighlight.tokenDeleted,
    },
    '& .code-token-inserted': {
      borderImage: theme.palette.lexicalEditor.codeHighlight.tokenInserted,
    },
    '& .code-token-unchanged': {
      borderImage: theme.palette.lexicalEditor.codeHighlight.tokenUnchanged,
    },
    '& .code-token-punctuation': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenPunctuation,
    },
    '& .code-token-property': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenProperty,
    },
    '& .code-token-selector': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenSelector,
    },
    '& .code-token-operator': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenOperator,
    },
    '& .code-token-attr': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenAttr,
    },
    '& .code-token-variable': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenVariable,
    },
    '& .code-token-function': {
      color: theme.palette.lexicalEditor.codeHighlight.tokenFunction,
    },
    // Iframe widget code blocks use the standard .code-block styles (gutter,
    // font, padding, etc.) inherited from CodeNode. This class adds a visual
    // border to distinguish them from regular code blocks.
    '& .iframe-widget-code': {
      border: theme.palette.greyBorder('1px', 0.2),
      borderRadius: 4,
    },
    // In preview mode the plugin collapses the code element to act as a
    // height-only spacer while a portaled preview overlay covers it.
    '& .iframe-widget-code.iframe-widget-preview-mode': {
      fontSize: '0 !important',
      lineHeight: '0 !important',
      overflow: 'hidden !important',
      padding: '0 !important',
      minHeight: '0 !important',
      border: 'none !important',
      '&::before': {
        display: 'none !important',
      },
    },
    '& .image-caption-container': {
      display: 'block',
      position: 'relative',
      minWidth: 100,
      minHeight: 20,
      color: theme.palette.grey[1000],
      boxSizing: 'border-box',
      outlineColor: 'transparent',

      '&[data-empty="true"]::before': {
        content: 'attr(data-placeholder)',
        fontSize: 12,
        color: theme.palette.grey[500],
        overflow: 'hidden',
        position: 'absolute',
        textOverflow: 'ellipsis',
        left: 10,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        pointerEvents: 'none',
        textAlign: 'center',
        width: 'calc(100% - 20px)',
      },
    },
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
      backgroundColor: theme.palette.grey[100],
      fontWeight: 600,
      cursor: 'default',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5em',
      position: 'relative',
      '&::before': {
        content: '"▼"',
        fontSize: '0.75em',
        transition: 'transform 0.2s ease',
        cursor: 'pointer',
      },
      '& p': {
        margin: 0,
        flex: 1,
        cursor: 'text',
      },
    },
    '& .detailsBlockClosed .detailsBlockContent': {
      display: 'none',
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
    '& .detailsBlock.detailsBlockSelected': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
    '& .detailsBlockTitle.detailsBlockTitleEmpty::after': {
      content: '"Collapsible Section Title"',
      color: theme.palette.grey[500],
      position: 'absolute',
      top: 8,
      left: 24,
    },
    '& .footnote-content': {
      flex: 1,
    },
    '& .llm-content-block': {
      margin: 0,
    },
    '& .llm-content-block-header': {
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: '0.85em',
      color: theme.palette.grey[600],
      lineHeight: 1.3,
      paddingRight: 6,
      borderRight: `1px solid ${theme.palette.grey[400]}`,
    },
    '& .llm-content-block:has(> .llm-content-block-content > p:first-child) .llm-content-block-header': {
      float: 'left',
      marginRight: 8,
      marginBottom: 0,
    },
    '& .llm-content-block:not(:has(> .llm-content-block-content > p:first-child)) .llm-content-block-header': {
      float: 'none',
      marginRight: 0,
      display: 'block',
      width: 'fit-content',
      marginTop: '1em',
      marginBottom: '1em',
    },
    '& .llm-content-block-model-input': {
      backgroundColor: 'transparent',
      color: 'inherit',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      fontWeight: 600,
      fontVariant: 'small-caps',
      lineHeight: 'inherit',
      padding: 0,
      border: 'none',
      borderRadius: 0,
      appearance: 'none',
      WebkitAppearance: 'none',
      minWidth: 40,
      '&::-webkit-calendar-picker-indicator': {
        display: 'none !important',
      },
      '&::placeholder': {
        color: theme.palette.grey[600],
        opacity: 1,
      },
      '&:hover': {
        color: theme.palette.grey[800],
      },
      '&:focus': {
        color: theme.palette.grey[800],
        outline: 'none',
      },
    },
    '& .llm-content-block-content': {
      outline: 'none',
    },
    '& ins': {
      background: theme.palette.background.diffInserted,
      textDecoration: 'none',
      '&.insert-image img': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '-2px',
      },
      '&.insert-divider hr': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '-2px',
      },
    },
    '& p:has(> ins.block-type-change.target-paragraph)': {
      background: theme.palette.background.diffInserted,
      height: '26px',
    },
    // Split suggestion: show two horizontal lines stretching from the end
    // of the text to the right edge of the paragraph, indicating where the
    // paragraph break will be inserted. The padding/margin overflow trick
    // extends the inline element visually while the parent clips it.
    '& p:has(> ins.split), & p:has(> ins.join)': {
      overflow: 'hidden',
    },
    '& ins.split, & ins.join': {
      display: 'inline-block',
      position: 'relative',
      height: '1lh',
      verticalAlign: 'top',
      paddingRight: '9999px',
      marginRight: '-9999px',
      borderTop: `2px solid ${theme.palette.background.diffInserted}`,
      borderBottom: `2px solid ${theme.palette.background.diffInserted}`,
      background: 'transparent',
    },
    '& ins.join::before': {
      // pilcrow ("paragraph" character)
      content: '"\u00B6"',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-59%)',
      textDecoration: 'line-through',
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.background.diffInserted,
    },
    '& li:has(> ins.block-type-change.target-bullet), & li:has(> ins.block-type-change.target-number), & li:has(> ins.block-type-change.target-check)': {
      background: theme.palette.background.diffInserted,
      '&::marker': {
        color: theme.palette.primary.main,
      },
    },
    // Quote wrap suggestion: the blockquote exists with the suggestion marker
    // inside a child paragraph. Show a green left box-shadow (mimicking the
    // blockquote's left border) to indicate the quote is being added.
    '& blockquote:has(ins.quote-wrap)': {
      borderLeftColor: theme.palette.primary.main,
    },
    // Quote unwrap suggestion: the blockquote was removed, so the block is
    // now at root level. Show a red left box-shadow where the quote border
    // used to be.
    '& :has(> ins.quote-unwrap)': {
      boxShadow: `-3px 0 0 0 ${theme.palette.error.main}`,
    },
    '& del': {
      background: theme.palette.background.diffDeleted,
      textDecoration: 'none',
      '&.delete-image img': {
        outline: `2px solid ${theme.palette.error.main}`,
        outlineOffset: '-2px',
      },
      '&.delete-divider hr': {
        outline: `2px solid ${theme.palette.error.main}`,
        outlineOffset: '-2px',
      },
    },
    '& hr.selected': {
      outline: `2px solid ${theme.palette.lexicalEditor.focusRing}`,
      outlineOffset: '-2px',
    },
    // Sentinel paragraphs are structural gap nodes used for block cursor
    // navigation. Keep their styles theme-aware so the cursor indicator is
    // visible in dark mode.
    '& .sentinel-paragraph': {
      margin: 0,
      padding: 0,
      lineHeight: 0,
      fontSize: 0,
      position: 'relative',
      minHeight: 0,
      caretColor: 'transparent',
      outline: 'none',
    },
    '& .sentinel-paragraph.sentinel-focused::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: -1,
      left: 0,
      right: 0,
      borderTop: `1px solid ${theme.palette.text.normal}`,
      animation: '$sentinelCursorBlink 1.1s steps(2, start) infinite',
    },
    // Hide the marker on wrapper list items that only contain a nested list
    // (no text content of their own). Without this, the wrapper's marker
    // (e.g. "2.") appears on the same line as the nested list's first item
    // (e.g. "a."), making them look squished together.
    '& .nested-list-item': {
      listStyleType: 'none',
    },
    '& figure': {
      margin: '0em auto',
    },
  },
  editorContainerComment: {
    background: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  treeView: {
    borderRadius: 0,
  },
  plainText: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  editorScroller: {
    minHeight: 'var(--lexical-editor-min-height, 150px)',
    maxWidth: '100%',
    border: 0,
    display: 'flex',
    position: 'relative',
    outline: 0,
    zIndex: 0,
    resize: 'vertical',
  },
  editorScrollerComment: {
    minHeight: 'var(--lexical-comment-min-height, 60px)',
    resize: 'none',
  },
  editor: {
    flex: 'auto',
    // Account for the -50px left margin so content fills the full container width
    maxWidth: 'calc(100% + 50px)',
    position: 'relative',
    resize: 'vertical',
    minHeight: '100%',
    zIndex: 0,
  },
  cursorsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
}));

const COLLAB_DOC_ID = 'main';

// const skipCollaborationInit =
//   // @ts-expect-error
//   window.parent != null && window.parent.frames.right === window;

export interface EditorProps {
  /** Collaboration config - if provided, enables real-time collaboration */
  collaborationConfig?: CollaborationConfig;
  /** Collaborative editor access level for suggested edits permissions */
  accessLevel?: CollaborativeEditingAccessLevel;
  /** Initial HTML content to load into the editor (only used when NOT in collaborative mode) */
  initialHtml?: string;
  /** Called on any editor change with the current HTML representation */
  onChangeHtml?: (html: string) => void;
  /**
   * Called once with a function that generates HTML with all suggestions
   * rejected. Called with null on unmount. The form wrapper stores this and
   * invokes it at submit time to populate `dataWithDiscardedSuggestions`.
   */
  onGetDataWithDiscardedSuggestions?: (fn: (() => string | undefined) | null) => void;
  /** Placeholder override (otherwise uses built-in placeholder based on settings/collab mode) */
  placeholder?: string;
  /** Render editor in compact comment mode */
  commentEditor?: boolean;
}

/**
 * Check if a Y.Doc's Lexical content is empty.
 */
function isYjsDocEmpty(doc: Doc): boolean {
  // We use doc.share to check if 'root' exists without creating it,
  // because creating it prematurely can conflict with Lexical's CollaborationPlugin.
  const root = doc.share.get('root');
  if (!root || !(root instanceof Y.XmlFragment) || root.length === 0) return true;
  if (root.length > 1) return false;
  
  const firstChild = root.get(0);
  if (firstChild instanceof Y.XmlElement && firstChild.nodeName === 'paragraph') {
    return firstChild.length === 0;
  }
  return false;
}

export default function Editor({
  collaborationConfig,
  accessLevel,
  initialHtml,
  onChangeHtml,
  onGetDataWithDiscardedSuggestions,
  placeholder: placeholderOverride,
  commentEditor = false,
}: EditorProps): JSX.Element {
  const classes = useStyles(styles);
  const {historyState} = useSharedHistoryContext();
  const hasLoadedInitialHtmlRef = useRef(false);
  const internalIdsRef = useRef<InternalIdMap>(new Map());
  const [editor] = useLexicalComposerContext();

  // Expose a function that generates HTML with all suggestions rejected.
  // The form wrapper stores this and calls it at submit time.
  useEffect(() => {
    onGetDataWithDiscardedSuggestions?.(() => getDataWithDiscardedSuggestions(editor));
    return () => {
      onGetDataWithDiscardedSuggestions?.(null);
    };
  }, [editor, onGetDataWithDiscardedSuggestions]);
  
  // Track when collaboration config is ready (set synchronously, not in useEffect)
  const [isCollabConfigReady, setIsCollabConfigReady] = useState(false);

  const externalModeContext = useContext(EditorUserModeContext);
  const setIsWsConnected = externalModeContext?.setIsWsConnected;

  // Store initialHtml in a ref so the onSynced callback can access the latest value
  const initialHtmlRef = useRef(initialHtml);
  initialHtmlRef.current = initialHtml;
  
  // Callback for handling the first sync with the collaboration server.
  // If the Yjs document is empty and we have initial HTML, bootstrap from it.
  const handleCollaborationSync = useCallback((doc: Doc, isFirstSync: boolean, docId: string) => {
    const htmlToBootstrap = initialHtmlRef.current;
    const stateSize = Y.encodeStateAsUpdate(doc).length;

    if (docId !== COLLAB_DOC_ID) return;
    if (!isFirstSync) return;

    // If the synced main doc already has substantive Yjs content, never
    // bootstrap from initialHtml. This prevents stale page-prop HTML from
    // overwriting restored server state.
    if (stateSize > 2) return;
    
    if (!htmlToBootstrap?.trim()) return;
    if (!isYjsDocEmpty(doc)) return;
    
    // Use a Yjs map to prevent duplicate bootstrapping if multiple clients connect simultaneously.
    // The first client to set 'bootstrapped' wins. Only really matters if a user has a non-collaborative
    // document open in multiple tabs, or something.
    const meta = doc.getMap('_lfm_meta');
    if (meta.get('bootstrapped')) return;
    
    meta.set('bootstrapped', Date.now());
    
    editor.update(() => {
      const { html, internalIds } = preprocessHtmlForImport(htmlToBootstrap);
      internalIdsRef.current = internalIds;
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
  }, [editor]);
  
  // Set up collaboration config before rendering collaboration plugins.
  // Merge in our onSynced and onConnectionStatusChange handlers.
  useLayoutEffect(() => {
    if (collaborationConfig) {
      const configWithHandlers: CollaborationConfig = {
        ...collaborationConfig,
        onSynced: (doc, isFirstSync, docId) => {
          handleCollaborationSync(doc, isFirstSync, docId);
          collaborationConfig.onSynced?.(doc, isFirstSync, docId);
        },
        onConnectionStatusChange: (connected) => {
          setIsWsConnected?.(connected);
          collaborationConfig.onConnectionStatusChange?.(connected);
        },
      };
      setCollaborationConfig(configWithHandlers);
    } else {
      setCollaborationConfig(null);
    }
    setIsCollabConfigReady(!!collaborationConfig);
    return () => {
      // Note: We intentionally do not clean up IndexedDB persistence here.
      // The persistence should survive component remounts to properly support
      // offline editing. It will be cleaned up when:
      // 1. A new persistence is created for the same document (in createWebsocketProviderWithDoc)
      // 2. The page unloads
      setCollaborationConfig(null);
      setIsCollabConfigReady(false);
    };
  }, [collaborationConfig, handleCollaborationSync, setIsWsConnected]);

  const {
    settings: {
      isCodeHighlighted,
      isCodeShiki,
      isCollab: isCollabSetting,
      useCollabV2,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      hasLinkAttributes,
      hasNestedTables,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
      selectionAlwaysOnDisplay,
      listStrictIndent,
    },
  } = useSettings();

  // Enable collaboration if config is provided OR if the setting is enabled
  const isCollab = isCollabSetting || !!collaborationConfig;
  const isCommentEditor = commentEditor;
  const hasInitialHtml = Boolean(initialHtml && initialHtml.trim().length > 0);
  const isEditable = useLexicalEditable();
  const placeholder = placeholderOverride ?? (isCollab
    ? 'Enter some collaborative rich text...'
    : isRichText
      ? 'Enter some rich text...'
      : 'Enter some plain text...');
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const isSmallWidthViewport = !useIsAboveBreakpoint('md', true);
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);
  const cursorsContainerRef = useRef<HTMLDivElement>(null);
  const canEdit = !accessLevel || accessLevelCan(accessLevel, "edit");
  const canComment = !accessLevel || accessLevelCan(accessLevel, "comment");

  // Use shared context for user mode if available (provided by PostForm),
  // otherwise fall back to local state (e.g. comment editors).
  const [localUserMode, setLocalUserMode] = useState<EditorUserModeType>(() => getDefaultEditorUserMode(canEdit, canComment));
  const userMode = externalModeContext?.userMode ?? localUserMode;
  const setUserMode = externalModeContext?.setUserMode ?? setLocalUserMode;

  const isSuggestionMode = userMode === EditorUserMode.Suggest;
  const isViewingMode = userMode === EditorUserMode.View;

  // Set editor editability based on user mode.
  // In viewing mode the editor is non-editable, which disables toolbars,
  // image resizers, table hover actions, and other interactive features.
  useEffect(() => {
    editor.setEditable(!isViewingMode);
  }, [editor, isViewingMode]);

  const collaboratorIdentity: CollaboratorIdentity | null = useMemo(() => {
    if (!collaborationConfig || !accessLevel) return null;
    return {
      id: collaborationConfig.user.id,
      name: collaborationConfig.user.name,
      accessLevel,
    };
  }, [collaborationConfig, accessLevel]);

  const handleUserModeChange = useCallback((mode: EditorUserModeType) => {
    setUserMode(mode);
  }, [setUserMode]);

  // When the external context's userMode changes (e.g. from PostForm button),
  // dispatch the command to the lexical editor so SuggestionModePlugin can apply it.
  const prevExternalModeRef = useRef(externalModeContext?.userMode);
  useEffect(() => {
    const currentExternalMode = externalModeContext?.userMode;
    if (currentExternalMode && currentExternalMode !== prevExternalModeRef.current) {
      prevExternalModeRef.current = currentExternalMode;
      editor.dispatchCommand(SET_USER_MODE_COMMAND, currentExternalMode);
    }
  }, [externalModeContext?.userMode, editor]);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  // Load initial HTML for non-collaborative mode only.
  // In collaborative mode, bootstrapping is handled by handleCollaborationSync after onSynced.
  useEffect(() => {
    if (!hasInitialHtml) return;
    if (isCollab) return;
    if (hasLoadedInitialHtmlRef.current) return;
    hasLoadedInitialHtmlRef.current = true;
    const initialHtmlString = initialHtml ?? '';

    editor.update(() => {
      const { html, internalIds } = preprocessHtmlForImport(initialHtmlString);
      internalIdsRef.current = internalIds;
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
  }, [editor, hasInitialHtml, initialHtml, isCollab]);

  return (
    <>
      {isRichText && (
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
          isSuggestionMode={isSuggestionMode}
          isVisible={false}
        />
      )}
      {isRichText && (
        <ShortcutsPlugin
          editor={activeEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      <DisableUnderlinePlugin />
      <SubmitOnCmdEnterPlugin />
      <div
        className={classNames(
          classes.editorContainer,
          isCommentEditor && classes.editorContainerComment,
          // showTreeView && classes.treeView,
          !isRichText && classes.plainText
        )}>
        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <DragDropPaste />
        {!isCommentEditor && <AutoFocusPlugin />}
        <CodeBlockPlugin editor={editor} />
        {selectionAlwaysOnDisplay && <SelectionAlwaysOnDisplay />}
        <ClearEditorPlugin />
        <ComponentPickerPlugin />
        {/* <EmojiPickerPlugin /> */}
        <AutoEmbedPlugin />
        <HashtagPlugin />
        {/* <KeywordsPlugin /> */}
        {/* <SpeechToTextPlugin /> */}
        <AutoLinkPlugin />
        <DateTimePlugin />
        <MarkNodesProvider>
          {collaboratorIdentity && (
            <CollaboratorIdentityProvider value={collaboratorIdentity}>
              <CommentStoreProvider
                providerFactory={isCollabConfigReady ? createWebsocketProvider : undefined}
              >
                {!isCommentEditor && !(isCollab && useCollabV2) && (
                  <>
                    <CommentPlugin />
                    <SideCommentsPlugin />
                  </>
                )}
              <SuggestedEditsPlugin
                isSuggestionMode={isSuggestionMode}
                userMode={userMode}
                onUserModeChange={handleUserModeChange}
              />
              </CommentStoreProvider>
            </CollaboratorIdentityProvider>
          )}
        </MarkNodesProvider>
        {isRichText ? (
          <>
            {isCollabConfigReady && collaborationConfig ? (
              <>
                {useCollabV2 ? (
                  <>
                    <CollabV2
                      id={COLLAB_DOC_ID}
                      shouldBootstrap={false}
                      username={collaborationConfig.user.name}
                      cursorsContainerRef={cursorsContainerRef}
                    />
                    <VersionsPlugin id={COLLAB_DOC_ID} />
                  </>
                ) : (
                  <CollaborationPlugin
                    key={`${collaborationConfig.postId}:${collaborationConfig.fieldName ?? COLLAB_DOC_ID}`}
                    id={COLLAB_DOC_ID}
                    providerFactory={createWebsocketProvider}
                    shouldBootstrap={false}
                    username={collaborationConfig.user.name}
                    cursorsContainerRef={cursorsContainerRef}
                  />
                )}
                <YjsUndoCursorPlugin />
              </>
            ) : (
              <HistoryPlugin externalHistoryState={historyState} />
            )}
            <RichTextPlugin
              contentEditable={
                <div
                  className={classNames(
                    classes.editorScroller,
                    isCommentEditor && classes.editorScrollerComment,
                  )}
                >
                  <div className={classes.editor} ref={onRef}>
                    <div
                      ref={cursorsContainerRef}
                      className={classes.cursorsContainer}
                    />
                    <ContentEditable
                      placeholder={placeholder}
                      variant={isCommentEditor ? 'comment' : undefined}
                      isSuggestionMode={isSuggestionMode}
                    />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            {onChangeHtml && (
              <OnChangePlugin
                onChange={(editorState) => {
                  editorState.read(() => {
                    const html = $generateHtmlFromNodes(editor, null);
                    const restoredHtml = restoreInternalIds(
                      html,
                      internalIdsRef.current
                    );
                    onChangeHtml(restoredHtml);
                  });
                }}
              />
            )}
            <MarkdownShortcutPlugin />
            <CodeKeyboardPlugin />
            <CodeHighlightCSSPlugin />
            <ListPlugin hasStrictIndent={listStrictIndent} />
            <CheckListPlugin />
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
              hasHorizontalScroll={tableHorizontalScroll}
              hasNestedTables={hasNestedTables}
            />
            <TablesPlugin />
            <TableCellResizer />
            <TableScrollShadowPlugin />
            <ImagesPlugin />
            <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
            <PollPlugin />
            {/* <TwitterPlugin /> */}
            <YouTubePlugin />
            <MetaculusPlugin />
            <ThoughtsaverPlugin />
            <ManifoldPlugin />
            <NeuronpediaPlugin />
            <StrawpollPlugin />
            <MetaforecastPlugin />
            <OWIDPlugin />
            <EstimakerPlugin />
            <ViewpointsPlugin />
            <CalendlyPlugin />
            <LWArtifactsPlugin />
            <FigmaPlugin />
            <ClickableLinkPlugin disabled={isEditable} />
            <HorizontalRulePlugin />
            <HorizontalRuleEnterPlugin />
            <BlockCursorNavigationPlugin />
            <MathPlugin />
            {/* <ExcalidrawPlugin /> */}
            <TabFocusPlugin />
            <TabIndentationPlugin maxIndent={7} />
            <CollapsibleSectionsPlugin />
            <ContainerQuotePlugin />
            <PageBreakPlugin />
            <LayoutPlugin />
            <FootnotesPlugin />
            <FootnoteSidenotesPlugin contentStyleType={isCommentEditor ? 'comment' : 'postHighlight'} />
            <MentionsPlugin />
            <SpoilersPlugin isSuggestionMode={isSuggestionMode} />
            <LLMContentBlockPlugin isSuggestionMode={isSuggestionMode} />
            <ClaimsPlugin />
            <ReviewResultsPlugin />
            <IframeWidgetPlugin anchorElem={floatingAnchorElem ?? undefined} isSuggestionMode={isSuggestionMode} />
            <RemoveRedirectPlugin />
            <LLMAutocompletePlugin />
            {floatingAnchorElem && (
              <>
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                  isSuggestionMode={isSuggestionMode}
                />
                {/* <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                /> */}
              </>
            )}
            {floatingAnchorElem && !isSmallWidthViewport && isEditable && (
              <>
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <TableHoverActionsV2Plugin anchorElem={floatingAnchorElem} />
              </>
            )}
            {floatingAnchorElem && <FloatingTextFormatToolbarPlugin
              anchorElem={floatingAnchorElem}
              setIsLinkEditMode={setIsLinkEditMode}
              variant={isCommentEditor ? 'comment' : 'post'}
              showInlineCommentButton={isCollab && !isCommentEditor}
              isSuggestionMode={isSuggestionMode}
            />}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable placeholder={placeholder} isSuggestionMode={isSuggestionMode} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin
            charset={isCharLimit ? 'UTF-16' : 'UTF-8'}
            maxLength={5}
          />
        )}
        {isAutocomplete && <AutocompletePlugin />}
        <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
        {shouldUseLexicalContextMenu && <ContextMenuPlugin isSuggestionMode={isSuggestionMode} />}
        {/* {shouldAllowHighlightingWithBrackets && <SpecialTextPlugin />} */}
        {/* <ActionsPlugin
          shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
          useCollabV2={useCollabV2}
        /> */}
      </div>
      {/* Plugin for debugging */}
      {/* {showTreeView && <TreeViewPlugin />} */}
    </>
  );
}

function CollabV2({
  id,
  shouldBootstrap,
  username,
  cursorsContainerRef,
}: {
  id: string;
  shouldBootstrap: boolean;
  username?: string;
  cursorsContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  // VersionsPlugin needs GC disabled.
  const doc = useMemo(() => new Doc({gc: false}), []);

  const provider = useMemo(() => {
    return createWebsocketProviderWithDoc('main', doc);
  }, [doc]);

  return (
    // eslint-disable-next-line react/jsx-pascal-case
    <CollaborationPluginV2__EXPERIMENTAL
      id={id}
      doc={doc}
      provider={provider}
      __shouldBootstrapUnsafe={shouldBootstrap}
      username={username}
      cursorsContainerRef={cursorsContainerRef}
    />
  );
}
