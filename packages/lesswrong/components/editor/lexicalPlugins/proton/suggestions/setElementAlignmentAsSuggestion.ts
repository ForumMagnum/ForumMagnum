import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import { $getSelection, $isElementNode, $isRangeSelection, type ElementFormatType, type ElementNode } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { randomId } from '@/lib/random'
import { $removeSuggestionNodeAndResolveIfNeeded } from './removeSuggestionNodeAndResolveIfNeeded'
import type { Logger } from '@/lib/utils/logging'
import { $isListNode } from '@lexical/list'
import type { AlignChangeSuggestionProperties } from './Types'

export function $setElementAlignmentAsSuggestion(
  formatType: ElementFormatType,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger('Setting element alignment', formatType)

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    logger('Selection is not range selection')
    return true
  }

  const nodes = selection.getNodes()
  const alreadyHandled = new Set()

  const suggestionID = randomId()
  let didCreateSuggestion = false

  for (const node of nodes) {
    const key = node.getKey()
    if (alreadyHandled.has(key)) {
      logger('Already handled node', key)
      continue
    }

    const isShadowRoot = $isElementNode(node) && node.isShadowRoot()
    if ($isListNode(node) || isShadowRoot) {
      continue
    }

    const element = $findMatchingParent(
      node,
      (parentNode): parentNode is ElementNode => $isElementNode(parentNode) && !parentNode.isInline(),
    )
    if (!element) {
      logger('Could not find non-inline element parent')
      continue
    }

    const elementKey = element.getKey()
    if (alreadyHandled.has(elementKey)) {
      logger('Already handled node', key)
      continue
    }

    alreadyHandled.add(elementKey)

    const initialFormatType = element.getFormatType()

    const existingSuggestion = element
      .getChildren()
      .find((node): node is ProtonNode => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'align-change')

    if (existingSuggestion) {
      const originalFormatType = existingSuggestion.__properties.nodePropertiesChanged?.initialFormatType
      if (originalFormatType === undefined) {
        throw new Error("Existing align-change suggestion doesn't have initialFormat")
      }
      logger('Comparing existing suggestion format', { format: formatType, originalFormat: originalFormatType })
      if (originalFormatType === formatType) {
        logger('Removing existing suggestion as format was reset')
        $removeSuggestionNodeAndResolveIfNeeded(existingSuggestion)
      }
    } else {
      logger('Creating new suggestion node', suggestionID)
      $insertFirst(
        element,
        $createSuggestionNode(suggestionID, 'align-change', {
          initialFormatType,
        } satisfies AlignChangeSuggestionProperties),
      )
      didCreateSuggestion = true
    }

    element.setFormat(formatType)
  }

  if (didCreateSuggestion) {
    onSuggestionCreation(suggestionID)
  }

  return true
}
