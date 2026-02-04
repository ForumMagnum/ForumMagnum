/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {type JSX} from 'react';
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
import {HorizontalRulePlugin} from '@lexical/react/LexicalHorizontalRulePlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {SelectionAlwaysOnDisplay} from '@lexical/react/LexicalSelectionAlwaysOnDisplay';
import {TabIndentationPlugin} from '@lexical/react/LexicalTabIndentationPlugin';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import {useLexicalEditable} from '@lexical/react/useLexicalEditable';
import {CAN_USE_DOM} from '@lexical/utils';
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
  type CollaborationConfig,
} from './collaboration';
import {useSettings} from './context/SettingsContext';
import {useSharedHistoryContext} from './context/SharedHistoryContext';
// import ActionsPlugin from './plugins/ActionsPlugin';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import CodeHighlightPrismPlugin from './plugins/CodeHighlightPrismPlugin';
// import CodeHighlightShikiPlugin from './plugins/CodeHighlightShikiPlugin';
import CollapsibleSectionsPlugin from '../editor/lexicalPlugins/collapsibleSections/CollapsibleSectionsPlugin';
import CommentPlugin from './plugins/CommentPlugin';
import { CommentStoreProvider } from './commenting/CommentStoreContext';
import { MarkNodesProvider } from '@/components/editor/lexicalPlugins/suggestions/MarkNodesContext';
import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DateTimePlugin from './plugins/DateTimePlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import EmojisPlugin from './plugins/EmojisPlugin';
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
import SpoilersPlugin from '../editor/lexicalPlugins/spoilers/SpoilersPlugin';
import ClaimsPlugin from './embeds/ElicitEmbed/ClaimsPlugin';
import RemoveRedirectPlugin from '../editor/lexicalPlugins/clipboard/RemoveRedirectPlugin';
import LLMAutocompletePlugin from '../editor/lexicalPlugins/autocomplete/LLMAutocompletePlugin';
import SuggestedEditsPlugin from '../editor/lexicalPlugins/suggestedEdits/SuggestedEditsPlugin';
import { EditorUserMode, type EditorUserModeType } from '../editor/lexicalPlugins/suggestions/EditorUserMode';
import { TOGGLE_SUGGESTION_MODE_COMMAND } from '../editor/lexicalPlugins/suggestedEdits/Commands';
import HorizontalRuleEnterPlugin from '../editor/lexicalPlugins/horizontalRuleEnter';
import {
  preprocessHtmlForImport,
  restoreInternalIds,
  InternalIdMap,
} from '../editor/lexicalPlugins/links/InternalBlockLinksPlugin';
import { type CollaborativeEditingAccessLevel } from '@/lib/collections/posts/collabEditingPermissions';
import { useIsAboveBreakpoint } from '../hooks/useScreenWidth';

const styles = defineStyles('LexicalEditor', (theme: ThemeType) => ({
  editorContainer: {
    background: theme.palette.grey[0],
    position: 'relative',
    display: 'block',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    '& .code-block': {
      backgroundColor: theme.palette.grey[100],
      fontFamily: theme.typography.code.fontFamily,
      display: 'block',
      padding: '8px 8px 8px 36px',
      lineHeight: 1.53,
      fontSize: 13,
      margin: '8px 0',
      overflowX: 'auto',
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
      minWidth: 25,
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
      '& p': {
        margin: 0,
      },
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
    '& p:has(> ins.block-type-change.target-paragraph), & blockquote:has(> ins.block-type-change.target-quote)': {
      background: theme.palette.background.diffInserted,
      height: '26px',
    },
    '& li:has(> ins.block-type-change.target-bullet), & li:has(> ins.block-type-change.target-number), & li:has(> ins.block-type-change.target-check)': {
      background: theme.palette.background.diffInserted,
      '&::marker': {
        color: theme.palette.primary.main,
      },
    },
    '& blockquote:has(> ins.block-type-change.target-quote)': {
      background: theme.palette.background.diffInserted,
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
  suggestionModeToggle: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  suggestionModeButton: {
    border: 0,
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
    background: theme.palette.grey[200],
    color: theme.palette.grey[900],
    fontSize: 12,
    fontWeight: 600,
    '&:hover': {
      background: theme.palette.grey[300],
    },
  },
  suggestionModeButtonActive: {
    background: theme.palette.primary.main,
    color: theme.palette.grey[0],
    '&:hover': {
      background: theme.palette.primary.dark,
    },
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
    maxWidth: '100%',
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
  placeholder: placeholderOverride,
  commentEditor = false,
}: EditorProps): JSX.Element {
  const classes = useStyles(styles);
  const {historyState} = useSharedHistoryContext();
  const hasLoadedInitialHtmlRef = useRef(false);
  const internalIdsRef = useRef<InternalIdMap>(new Map());
  const [editor] = useLexicalComposerContext();
  
  // Track when collaboration config is ready (set synchronously, not in useEffect)
  const [isCollabConfigReady, setIsCollabConfigReady] = useState(false);
  
  // Store initialHtml in a ref so the onSynced callback can access the latest value
  const initialHtmlRef = useRef(initialHtml);
  initialHtmlRef.current = initialHtml;
  
  // Callback for handling the first sync with the collaboration server.
  // If the Yjs document is empty and we have initial HTML, bootstrap from it.
  const handleCollaborationSync = useCallback((doc: Doc, isFirstSync: boolean) => {
    if (!isFirstSync) return;
    
    const htmlToBootstrap = initialHtmlRef.current;
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
  // Merge in our onSynced handler for bootstrap detection.
  useLayoutEffect(() => {
    if (collaborationConfig) {
      const configWithSyncHandler: CollaborationConfig = {
        ...collaborationConfig,
        onSynced: (doc, isFirstSync) => {
          handleCollaborationSync(doc, isFirstSync);
          collaborationConfig.onSynced?.(doc, isFirstSync);
        },
      };
      setCollaborationConfig(configWithSyncHandler);
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
  }, [collaborationConfig, handleCollaborationSync]);
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
  const [isSuggestionMode, setIsSuggestionMode] = useState(false);
  const handleUserModeChange = useCallback((mode: EditorUserModeType) => {
    setIsSuggestionMode(mode === EditorUserMode.Suggest);
  }, []);
  const handleToggleSuggestionMode = useCallback(() => {
    editor.dispatchCommand(TOGGLE_SUGGESTION_MODE_COMMAND, undefined);
  }, [editor]);

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
        <div className={classes.suggestionModeToggle}>
          <button
            type="button"
            className={classNames(
              classes.suggestionModeButton,
              isSuggestionMode && classes.suggestionModeButtonActive,
            )}
            onClick={handleToggleSuggestionMode}
          >
            {isSuggestionMode ? 'Suggesting' : 'Editing'}
          </button>
        </div>
      )}
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
        <EmojiPickerPlugin />
        <AutoEmbedPlugin />
        <EmojisPlugin />
        <HashtagPlugin />
        {/* <KeywordsPlugin /> */}
        {/* <SpeechToTextPlugin /> */}
        <AutoLinkPlugin />
        <DateTimePlugin />
        <MarkNodesProvider>
          <CommentStoreProvider
            providerFactory={isCollabConfigReady ? createWebsocketProvider : undefined}
          >
            {!isCommentEditor && !(isCollab && useCollabV2) && <CommentPlugin />}
            <SuggestedEditsPlugin
              isSuggestionMode={isSuggestionMode}
              onUserModeChange={handleUserModeChange}
            />
          </CommentStoreProvider>
        </MarkNodesProvider>
        {isRichText ? (
          <>
            {isCollabConfigReady && collaborationConfig ? (
              useCollabV2 ? (
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
                  key={collaborationConfig.token}
                  id={COLLAB_DOC_ID}
                  providerFactory={createWebsocketProvider}
                  shouldBootstrap={false}
                  username={collaborationConfig.user.name}
                  cursorsContainerRef={cursorsContainerRef}
                />
              )
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
            {/* {isCodeHighlighted &&
              (isCodeShiki ? (
                <CodeHighlightShikiPlugin />
              ) : (
                <CodeHighlightPrismPlugin />
              ))} */}
            <CodeHighlightPrismPlugin />
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
            <MathPlugin />
            {/* <ExcalidrawPlugin /> */}
            <TabFocusPlugin />
            <TabIndentationPlugin maxIndent={7} />
            <CollapsibleSectionsPlugin />
            <PageBreakPlugin />
            <LayoutPlugin />
            <FootnotesPlugin />
            <MentionsPlugin />
            <SpoilersPlugin isSuggestionMode={isSuggestionMode} />
            <ClaimsPlugin />
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
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                {!isCommentEditor && <DraggableBlockPlugin anchorElem={floatingAnchorElem} />}
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
