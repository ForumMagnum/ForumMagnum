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
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Doc} from 'yjs';
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {$getRoot, $insertNodes} from 'lexical';
import { CodeBlockPlugin } from '../editor/lexicalPlugins/codeBlock/CodeBlockPlugin';

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
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import CommentPlugin from './plugins/CommentPlugin';
import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DateTimePlugin from './plugins/DateTimePlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import EmojisPlugin from './plugins/EmojisPlugin';
import EquationsPlugin from './plugins/EquationsPlugin';
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
// import SpecialTextPlugin from './plugins/SpecialTextPlugin';
// import SpeechToTextPlugin from './plugins/SpeechToTextPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TableHoverActionsV2Plugin from './plugins/TableHoverActionsV2Plugin';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import TableScrollShadowPlugin from './plugins/TableScrollShadowPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
// import TreeViewPlugin from './plugins/TreeViewPlugin';
import TwitterPlugin from './plugins/TwitterPlugin';
import {VersionsPlugin} from './plugins/VersionsPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import ContentEditable from './ui/ContentEditable';
import { FootnotesPlugin } from '../editor/lexicalPlugins/footnotes/FootnotesPlugin';
import { MentionPlugin } from '../editor/lexicalPlugins/mentions/MentionPlugin';
import { getLexicalMentionFeeds } from '../editor/lexicalPlugins/mentions/lexicalMentionsConfig';
import SpoilersPlugin from '../editor/lexicalPlugins/spoilers/SpoilersPlugin';
import ClaimsPlugin from '../editor/lexicalPlugins/claims/ClaimsPlugin';
import RemoveRedirectPlugin from '../editor/lexicalPlugins/clipboard/RemoveRedirectPlugin';
import LLMAutocompletePlugin from '../editor/lexicalPlugins/autocomplete/LLMAutocompletePlugin';

const styles = defineStyles('LexicalEditor', (theme: ThemeType) => ({
  editorContainer: {
    background: theme.palette.grey[0],
    position: 'relative',
    display: 'block',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  treeView: {
    borderRadius: 0,
  },
  plainText: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  editorScroller: {
    minHeight: 150,
    maxWidth: '100%',
    border: 0,
    display: 'flex',
    position: 'relative',
    outline: 0,
    zIndex: 0,
    resize: 'vertical',
  },
  editor: {
    flex: 'auto',
    maxWidth: '100%',
    position: 'relative',
    resize: 'vertical',
    zIndex: -1,
  },
}), { allowNonThemeColors: true });

const COLLAB_DOC_ID = 'main';

// const skipCollaborationInit =
//   // @ts-expect-error
//   window.parent != null && window.parent.frames.right === window;

export interface EditorProps {
  /** Collaboration config - if provided, enables real-time collaboration */
  collaborationConfig?: CollaborationConfig;
  /** Initial HTML content to load into the editor (only used when NOT in collaborative mode) */
  initialHtml?: string;
  /** Called on any editor change with the current HTML representation */
  onChangeHtml?: (html: string) => void;
  /** Placeholder override (otherwise uses built-in placeholder based on settings/collab mode) */
  placeholder?: string;
}

export default function Editor({
  collaborationConfig,
  initialHtml,
  onChangeHtml,
  placeholder: placeholderOverride,
}: EditorProps): JSX.Element {
  const classes = useStyles(styles);
  const {historyState} = useSharedHistoryContext();
  const hasLoadedInitialHtmlRef = useRef(false);
  
  // Track when collaboration config is ready (set synchronously, not in useEffect)
  const [isCollabConfigReady, setIsCollabConfigReady] = useState(false);
  
  // Set up collaboration config before rendering collaboration plugins
  useLayoutEffect(() => {
    setCollaborationConfig(collaborationConfig ?? null);
    setIsCollabConfigReady(!!collaborationConfig);
    return () => {
      setCollaborationConfig(null);
      setIsCollabConfigReady(false);
    };
  }, [collaborationConfig]);
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
  const isEditable = useLexicalEditable();
  const placeholder = placeholderOverride ?? (isCollab
    ? 'Enter some collaborative rich text...'
    : isRichText
      ? 'Enter some rich text...'
      : 'Enter some plain text...');
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  // Load initial HTML exactly once, and only when not using collaboration.
  useEffect(() => {
    if (!initialHtml) return;
    if (isCollab) return;
    if (hasLoadedInitialHtmlRef.current) return;
    hasLoadedInitialHtmlRef.current = true;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
  }, [editor, initialHtml, isCollab]);

  return (
    <>
      {isRichText && (
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      {isRichText && (
        <ShortcutsPlugin
          editor={activeEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      <div
        className={classNames(
          classes.editorContainer,
          showTreeView && classes.treeView,
          !isRichText && classes.plainText
        )}>
        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <DragDropPaste />
        <AutoFocusPlugin />
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
        {!(isCollab && useCollabV2) && (
          <CommentPlugin
            providerFactory={isCollabConfigReady ? createWebsocketProvider : undefined}
          />
        )}
        {isRichText ? (
          <>
            {isCollabConfigReady && collaborationConfig ? (
              useCollabV2 ? (
                <>
                  <CollabV2
                    id={COLLAB_DOC_ID}
                    // shouldBootstrap={!skipCollaborationInit}
                    shouldBootstrap={false}
                    username={collaborationConfig.user.name}
                  />
                  <VersionsPlugin id={COLLAB_DOC_ID} />
                </>
              ) : (
                <CollaborationPlugin
                  key={collaborationConfig.token}
                  id={COLLAB_DOC_ID}
                  providerFactory={createWebsocketProvider}
                  // shouldBootstrap={!skipCollaborationInit}
                  shouldBootstrap={false}
                  username={collaborationConfig.user.name}
                />
              )
            ) : (
              <HistoryPlugin externalHistoryState={historyState} />
            )}
            <RichTextPlugin
              contentEditable={
                <div className={classes.editorScroller}>
                  <div className={classes.editor} ref={onRef}>
                    <ContentEditable placeholder={placeholder} />
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
                    onChangeHtml(html);
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
            <TableCellResizer />
            <TableScrollShadowPlugin />
            <ImagesPlugin />
            <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
            <PollPlugin />
            <TwitterPlugin />
            <YouTubePlugin />
            <FigmaPlugin />
            <ClickableLinkPlugin disabled={isEditable} />
            <HorizontalRulePlugin />
            <EquationsPlugin />
            {/* <ExcalidrawPlugin /> */}
            <TabFocusPlugin />
            <TabIndentationPlugin maxIndent={7} />
            <CollapsiblePlugin />
            <PageBreakPlugin />
            <LayoutPlugin />
            <FootnotesPlugin />
            <MentionsPlugin />
            <MentionPlugin feeds={getLexicalMentionFeeds()} />
            <SpoilersPlugin />
            <ClaimsPlugin />
            <RemoveRedirectPlugin />
            <LLMAutocompletePlugin />
            {floatingAnchorElem && (
              <>
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                />
              </>
            )}
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <TableHoverActionsV2Plugin anchorElem={floatingAnchorElem} />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
              </>
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable placeholder={placeholder} />}
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
        {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
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
}: {
  id: string;
  shouldBootstrap: boolean;
  username?: string;
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
    />
  );
}
