/**
 * Headless companion to ToolbarPlugin. Mirrors the editor's current
 * selection/format state into ToolbarContext so consumers that *don't*
 * render the visible toolbar (FloatingTextFormatToolbarPlugin,
 * ShortcutsPlugin, AutocompletePlugin) still see correct values.
 *
 * Render this whenever the editor is mounted, even when the visible
 * ToolbarPlugin is not in use. If both this and ToolbarPlugin are
 * mounted, ToolbarPlugin acts as a pure UI consumer and does not
 * register its own state-driving listeners.
 */
import { useCallback, useEffect, type Dispatch } from 'react';
import {
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
  getDOMSelection,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
} from '@lexical/utils';
import { $isLinkNode } from '@lexical/link';
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
} from '@lexical/selection';
import { $isTableNode, $isTableSelection } from '@lexical/table';
import {
  $isCodeNode,
  normalizeCodeLanguage as normalizeCodeLanguagePrism,
} from '@lexical/code';
import { useSettings } from '../../context/SettingsContext';
import {
  blockTypeToBlockName,
  useToolbarState,
} from '../../context/ToolbarContext';
import { getSelectedNode } from '../../utils/getSelectedNode';

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}

export default function ToolbarStatePlugin({
  editor,
  activeEditor,
  setActiveEditor,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
}): null {
  const { updateToolbarState } = useToolbarState();
  const {
    settings: { isCodeHighlighted },
  } = useSettings();

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();

      if (type in blockTypeToBlockName) {
        updateToolbarState(
          'blockType',
          type as keyof typeof blockTypeToBlockName,
        );
      }
    },
    [updateToolbarState],
  );

  const $handleCodeNode = useCallback(
    (element: LexicalNode) => {
      if ($isCodeNode(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          'codeLanguage',
          language
            ? (isCodeHighlighted && normalizeCodeLanguagePrism(language)) ||
                language
            : '',
        );
        const theme = element.getTheme();
        updateToolbarState('codeTheme', theme || '');
      }
    },
    [updateToolbarState, isCodeHighlighted],
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains(
            'image-caption-container',
          ),
        );
      } else {
        const nativeSelection = getDOMSelection(activeEditor._window);
        const anchorNode = nativeSelection?.anchorNode;
        const anchorElement =
          anchorNode instanceof Element
            ? anchorNode
            : anchorNode?.parentElement;
        updateToolbarState(
          'isImageCaption',
          !!anchorElement?.closest('.image-caption-container'),
        );
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          updateToolbarState('blockType', type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }

      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );

      let matchingParent;
      if ($isLinkNode(parent)) {
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState(
        'isStrikethrough',
        selection.hasFormat('strikethrough'),
      );
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(
          selectedNode,
          ListNode,
        );
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState('blockType', type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          if ($isElementNode(selectedElement)) {
            updateToolbarState(
              'elementFormat',
              selectedElement.getFormatType(),
            );
          }
        }
      }
    }
  }, [
    activeEditor,
    editor,
    updateToolbarState,
    $handleHeadingNode,
    $handleCodeNode,
  ]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      { editor: activeEditor },
    );
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return activeEditor.registerUpdateListener(({ editorState }) => {
      editorState.read(
        () => {
          $updateToolbar();
        },
        { editor: activeEditor },
      );
    });
  }, [$updateToolbar, activeEditor]);

  return null;
}
