import { $createListItemNode, $createListNode, $isListItemNode, $isListNode, type ListNode, type ListType } from '@lexical/list'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isLeafNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  type LexicalEditor,
  type ElementNode,
  type LexicalNode,
  type NodeKey,
  type TextNode,
} from 'lexical'
import type { Logger } from '@/lib/vendor/proton/logger'
import { $getListInfo } from '@/components/editor/lexicalPlugins/suggestions/$getListInfo'
import { $insertFirst } from '@lexical/utils'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { generateUUID } from '@/lib/vendor/proton/generateUUID'
import { $getElementBlockType } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils'
import { $isEmptyListItemExceptForSuggestions } from './Utils'

export function $insertListAsSuggestion(
  editor: LexicalEditor,
  listType: ListType,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
  styleType?: string,
  marker?: string,
): boolean {
  logger.info('Inserting list as suggestion', listType, styleType, marker)

  let selection = $getSelection()
  if (!selection) {
    logger.info('No existing selection')
    return true
  }

  const startEndPoints = selection.getStartEndPoints()
  if (!startEndPoints) {
    logger.info('No start/end points for selection')
    return true
  }

  const [anchor] = startEndPoints
  
  // Check if the anchor node still exists (it might have been removed by ComponentPickerPlugin)
  const anchorNode = anchor.getNode()
  if (!anchorNode.isAttached()) {
    logger.info('Anchor node is no longer attached, re-selecting')
    const root = $getRoot()
    const firstChild = root.getFirstChild()
    if (firstChild && $isElementNode(firstChild)) {
      selection = firstChild.selectStart()
    } else {
      logger.info('No valid selection target')
      return true
    }
  }
  
  if (anchor.key === 'root') {
    logger.info('Resetting selection because it is at root')
    const root = $getRoot()
    const firstChild = root.getFirstChild()
    if (firstChild) {
      logger.info('Selecting first existing child of root')
      selection = firstChild.selectStart()
    } else {
      logger.info('Creating new paragraph and selecting it')
      const paragraph = $createParagraphNode()
      root.append(paragraph)
      selection = paragraph.select()
    }
  }

  let nodes = selection.getNodes()

  // If selection returns empty or just a suggestion node, find the nearest block parent
  if ($isRangeSelection(selection) && (nodes.length === 0 || (nodes.length === 1 && $isSuggestionNode(nodes[0])))) {
    logger.info('Selection returned empty or just suggestion node, finding block parent')
    const anchorNode = selection.anchor.getNode()
    let blockParent: ElementNode | null = null
    
    if ($isSuggestionNode(anchorNode)) {
      // The suggestion node's parent should be the block element
      blockParent = anchorNode.getParent()
    } else if ($isElementNode(anchorNode) && !anchorNode.isInline()) {
      blockParent = anchorNode
    } else {
      // Walk up to find block parent
      let parent = anchorNode.getParent()
      while (parent && (parent.isInline() || $isSuggestionNode(parent))) {
        parent = parent.getParent()
      }
      if ($isElementNode(parent)) {
        blockParent = parent
      }
    }
    
    if (blockParent && !$isRootOrShadowRoot(blockParent)) {
      logger.info('Found block parent:', blockParent.__type)
      nodes = [blockParent]
    }
  }

  const suggestionID = generateUUID()

  if ($isRangeSelection(selection)) {
    const anchorNode = selection.anchor.getNode()
    const emptyListItem = $isSelectingEmptyListItem(anchorNode, nodes)
    if ($isListItemNode(emptyListItem)) {
      logger.info('Handling empty list item')

      const parent = emptyListItem.getParent()
      if (!$isListNode(parent)) {
        logger.info('Parent is not list node')
        return true
      }

      $replaceList(parent, listType, suggestionID, logger, onSuggestionCreation, styleType, marker)
      return true
    }
  }

  const handled = new Set<NodeKey>()

  let createdSuggestions = 0
  const incrementSuggestionCounter = () => createdSuggestions++

  for (const node of nodes) {
    const isEmptyElementNode = $isElementNode(node) && node.isEmpty()
    const nodeHasBeenHandled = handled.has(node.getKey())
    const isSuggestionNode = $isSuggestionNode(node)

    logger.info(`Node: ${node.__type} (${node.__key})`, { isEmptyElementNode, nodeHasBeenHandled, isSuggestionNode })

    if (isEmptyElementNode && !$isListItemNode(node) && !nodeHasBeenHandled && !isSuggestionNode) {
      logger.info('Is empty element node that has not been handled')
      $changeBlockTypeToList(node, listType, suggestionID, logger, incrementSuggestionCounter, styleType, marker)
      continue
    }

    // Handle case where the node is directly a ListItemNode (e.g., from slash command in a list)
    if ($isListItemNode(node) && !nodeHasBeenHandled) {
      const parentList = node.getParent()
      if ($isListNode(parentList)) {
        logger.info('Node is list item, converting parent list')
        const parentKey = parentList.getKey()
        if (!handled.has(parentKey)) {
          handled.add(parentKey)
          const list = $replaceList(
            parentList,
            listType,
            suggestionID,
            logger,
            incrementSuggestionCounter,
            styleType,
            marker,
          )
          handled.add(list.getKey())
        }
        continue
      }
    }

    // Handle case where the node is a non-empty element node at the top level (e.g., paragraph from slash command)
    if ($isElementNode(node) && !nodeHasBeenHandled && !isSuggestionNode && !$isListItemNode(node)) {
      const grandParent = node.getParent()
      if ($isRootOrShadowRoot(grandParent)) {
        logger.info('Non-empty top-level element node, converting to list')
        handled.add(node.getKey())
        const list = $changeBlockTypeToList(node, listType, suggestionID, logger, incrementSuggestionCounter, styleType, marker)
        handled.add(list.getKey())
        continue
      }
    }

    if (!$isLeafNode(node)) {
      continue
    }

    let parent = node.getParent()
    while (parent != null) {
      const parentKey = parent.getKey()
      if ($isListNode(parent)) {
        logger.info('Parent is list node')
        if (!handled.has(parentKey)) {
          handled.add(parentKey)
          const list = $replaceList(
            parent,
            listType,
            suggestionID,
            logger,
            incrementSuggestionCounter,
            styleType,
            marker,
          )
          handled.add(list.getKey())
        }
        break
      } else {
        const grandParent = parent.getParent()

        const parentIsTopLevelAndUnhandled = $isRootOrShadowRoot(grandParent) && !handled.has(parentKey)
        if (parentIsTopLevelAndUnhandled) {
          handled.add(parentKey)
          logger.info('Changing leaf node non-list parent to list')
          const list = $changeBlockTypeToList(
            parent,
            listType,
            suggestionID,
            logger,
            incrementSuggestionCounter,
            styleType,
            marker,
          )
          handled.add(list.getKey())
          break
        }

        parent = grandParent
      }
    }
  }

  if (createdSuggestions > 0) {
    onSuggestionCreation(suggestionID)
  }

  return true
}

function $changeBlockTypeToList(
  node: ElementNode,
  listType: ListType,
  suggestionID: string,
  logger: Logger,
  onSuggestionCreation: (id: string) => void,
  styleType?: string,
  marker?: string,
) {
  logger.info('Change node block type to list')

  if ($isListNode(node)) {
    logger.info('Node is already list node')
    return node
  }

  const children = node.getChildren()

  const blockType = $getElementBlockType(node)
  if (!blockType) {
    throw new Error('Could not get block type for current block')
  }

  const formatType = node.getFormatType()
  const indent = node.getIndent()

  const newList = $createListNode(listType)
  const listItem = $createListItemNode()
  listItem.append(...children)
  newList.append(listItem)
  node.replace(newList)

  const existingSuggestion = node
    .getChildren()
    .find((n): n is ProtonNode => $isSuggestionNode(n) && n.getSuggestionTypeOrThrow() === 'block-type-change')

  if (!existingSuggestion) {
    $insertFirst(
      listItem,
      $createSuggestionNode(suggestionID, 'block-type-change', {
        initialBlockType: blockType,
        targetBlockType: listType,
        initialFormatType: formatType,
        initialIndent: indent,
      }),
    )
    onSuggestionCreation(suggestionID)
  }

  listItem.setFormat(formatType)
  listItem.setIndent(indent)

  return newList
}

function $replaceList(
  node: ListNode,
  listType: ListType,
  suggestionID: string,
  logger: Logger,
  onSuggestionCreation: (id: string) => void,
  styleType?: string,
  marker?: string,
): ListNode {
  logger.info(`Replacing exist list (key: ${node.__key}) with list type ${listType}`)
  const list = $createListNode(listType)

  const listInfo = $getListInfo(node)
  const children = node.getChildren()
  for (const child of children) {
    if (!$isElementNode(child)) {
      logger.info('Child is not element')
      continue
    }

    const formatType = child.getFormatType()
    const indent = child.getIndent()

    const existingSuggestion = child
      .getChildren()
      .find((n): n is ProtonNode => $isSuggestionNode(n) && n.getSuggestionTypeOrThrow() === 'block-type-change')

    if (!existingSuggestion) {
      $insertFirst(
        child,
        $createSuggestionNode(suggestionID, 'block-type-change', {
          initialBlockType: listInfo.listType,
          targetBlockType: listType,
          initialFormatType: formatType,
          initialIndent: indent,
          listInfo,
        }),
      )
      logger.info('Inserted block-type-change suggestion to child')
      onSuggestionCreation(suggestionID)
    }
  }

  list.append(...children)
  node.replace(list, true)

  return list
}

function $isSelectingEmptyListItem(anchorNode: ElementNode | TextNode, nodes: LexicalNode[]) {
  if (nodes.length === 0) {
    if ($isListItemNode(anchorNode)) {
      return anchorNode
    }
    return null
  }
  if (nodes.length === 1) {
    return $isEmptyListItemExceptForSuggestions(anchorNode)
  }
  return null
}
