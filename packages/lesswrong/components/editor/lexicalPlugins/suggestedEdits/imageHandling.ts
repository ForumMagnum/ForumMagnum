import { generateUUID } from '@/lib/vendor/proton/generateUUID'
import type { LexicalNode } from 'lexical'
import { $createRangeSelection, $getNodeByKey, $getSelection, $setSelection } from 'lexical'
import { $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type {
  SetImageCaptionVisibilityPayload,
  SetImageSizePayload,
} from '@/components/lexical/plugins/ImagesPlugin/commands'
import { $findMatchingParent, $wrapNodeInElement } from '@lexical/utils'
import { $createImageNode, $isImageNode } from '@/components/lexical/nodes/ImageNode'
import {
  $getImageNodeInSelection,
  getDragImageData,
  $canDropImage,
  getDragSelection,
} from '@/components/lexical/plugins/ImagesPlugin/ImageUtils'
import type { Logger } from '@/lib/vendor/proton/logger'

export function $insertImageNodeAsSuggestion(
  node: LexicalNode,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger.info('Insert image node as suggestion')
  const selection = $getSelection()
  if (!selection) {
    logger.info('No selection available')
    return true
  }
  const suggestionID = generateUUID()
  const suggestion = $createSuggestionNode(suggestionID, 'insert-image').append(node)
  selection.insertNodes([suggestion])
  onSuggestionCreation(suggestionID)
  return true
}

export function $handleImageSizeChangeAsSuggestion(
  payload: SetImageSizePayload,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  const { nodeKey, widthPercent } = payload
  logger.info('Handling image size change', payload)
  const node = $getNodeByKey(nodeKey)
  if (!$isImageNode(node)) {
    logger.info('Node is not image node')
    return true
  }
  const initialWidthPercent = node.getWidthPercent()
  logger.info('Setting new width percent')
  node.setWidthPercent(widthPercent)
  const existingSuggestionParent = $findMatchingParent(node, $isSuggestionNode)
  const suggestionType = existingSuggestionParent?.getSuggestionTypeOrThrow()
  if (existingSuggestionParent || suggestionType === 'insert-image' || suggestionType === 'image-change') {
    return true
  }
  logger.info('Wrapping node with new suggestion', initialWidthPercent)
  const suggestionID = generateUUID()
  $wrapNodeInElement(node, () =>
    $createSuggestionNode(suggestionID, 'image-change', {
      widthPercent: initialWidthPercent ?? null,
    }),
  )
  onSuggestionCreation(suggestionID)
  return true
}

export function $handleImageCaptionToggleAsSuggestion(
  payload: SetImageCaptionVisibilityPayload,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  const { nodeKey, showCaption } = payload
  logger.info('Handling image caption toggle', payload)
  const node = $getNodeByKey(nodeKey)
  if (!$isImageNode(node)) {
    logger.info('Node is not image node')
    return true
  }
  const existingSuggestionParent = $findMatchingParent(node, $isSuggestionNode)
  const suggestionType = existingSuggestionParent?.getSuggestionTypeOrThrow()
  const existingSuggestionProperties = existingSuggestionParent?.getSuggestionChangedProperties()
  const initialShowCaption = node.getShowCaption()
  const captionNode = node.getCaptionNode()
  const serializedCaption = captionNode?.exportJSON() ?? null
  const storedCaption = existingSuggestionProperties?.caption ?? null

  node.setShowCaption(showCaption)
  const captionToRestore = serializedCaption ?? storedCaption
  if (showCaption && captionToRestore) {
    const restoredCaption = node.getCaptionNode()
    if (restoredCaption) {
      restoredCaption.clear()
      const children = captionToRestore.children ?? []
      const restoredChildren = $generateNodesFromSerializedNodes(children)
      restoredCaption.append(...restoredChildren)
    }
  }

  if (existingSuggestionParent || suggestionType === 'insert-image' || suggestionType === 'image-change') {
    return true
  }

  const suggestionID = generateUUID()
  $wrapNodeInElement(node, () =>
    $createSuggestionNode(suggestionID, 'image-change', {
      showCaption: initialShowCaption,
      caption: serializedCaption,
    }),
  )
  onSuggestionCreation(suggestionID)
  return true
}

export function $handleImageDeleteAsSuggestion(
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  const draggedImageNode = $getImageNodeInSelection()
  if (!draggedImageNode) {
    return false
  }
  const existingSuggestionParent = $findMatchingParent(draggedImageNode, $isSuggestionNode)
  const suggestionType = existingSuggestionParent?.getSuggestionTypeOrThrow()
  if (existingSuggestionParent && suggestionType === 'insert-image') {
    existingSuggestionParent.remove()
    return true
  }
  const suggestionID = generateUUID()
  $wrapNodeInElement(draggedImageNode, () => $createSuggestionNode(suggestionID, 'delete-image'))
  onSuggestionCreation(suggestionID)
  return true
}

export function $handleImageDragAndDropAsSuggestion(
  event: DragEvent,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
) {
  const draggedImageNode = $getImageNodeInSelection()
  if (!draggedImageNode) {
    logger.info('No dragged image node')
    return false
  }
  const data = getDragImageData(event)
  if (!data) {
    logger.info('Could not get image data from event')
    return true
  }
  event.preventDefault()
  if (!$canDropImage(event)) {
    logger.info('Cannot drop image')
    return true
  }
  const suggestionID = generateUUID()
  const range = getDragSelection(event)
  logger.info('Wrapping existing node with "delete" type')
  $wrapNodeInElement(draggedImageNode, () => $createSuggestionNode(suggestionID, 'delete-image'))
  const rangeSelection = $createRangeSelection()
  if (range !== null && range !== undefined) {
    rangeSelection.applyDOMRange(range)
  }
  $setSelection(rangeSelection)
  const imageNode = $createImageNode({
    altText: data.altText,
    height: data.height,
    maxWidth: data.maxWidth,
    width: data.width,
    src: data.src,
    srcset: data.srcset,
    widthPercent: data.widthPercent,
    isCkFigure: data.isCkFigure,
    showCaption: data.showCaption,
    captionsEnabled: data.captionsEnabled,
  })
  logger.info('Created and inserted "insert" type suggestion')
  const insertSuggestion = $createSuggestionNode(suggestionID, 'insert-image').append(imageNode)
  rangeSelection.insertNodes([insertSuggestion])
  onSuggestionCreation(suggestionID)
  return true
}
