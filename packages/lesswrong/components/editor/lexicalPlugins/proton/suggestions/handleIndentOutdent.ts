import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import type { ElementNode } from 'lexical'
import { $getSelection, $isRangeSelection, $isElementNode } from 'lexical'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { randomId } from '@/lib/random'
import type { Logger } from '@/lib/utils/logging'
import type { IndentChangeSuggestionProperties } from './Types'

export function $handleIndentOutdentAsSuggestion(
  type: 'indent' | 'outdent',
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger(`Handling ${type}`)

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    logger('Current selection is not range selection')
    return false
  }

  const alreadyHandled = new Set()
  const nodes = selection.getNodes()
  const suggestionID = randomId()

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const key = node.getKey()

    if (alreadyHandled.has(key)) {
      logger('Already handled node', key)
      continue
    }

    const parentBlock = $findMatchingParent(
      node,
      (parentNode): parentNode is ElementNode => $isElementNode(parentNode) && !parentNode.isInline(),
    )
    if (parentBlock === null) {
      logger('Could not find non-inline parent element')
      continue
    }

    const parentKey = parentBlock.getKey()

    if (!parentBlock.canIndent()) {
      logger('Cannot indent parent')
      continue
    }

    if (alreadyHandled.has(parentKey)) {
      logger('Already handled parent')
      continue
    }

    alreadyHandled.add(parentKey)

    const currentIndent = parentBlock.getIndent()
    logger('Current indent level', currentIndent)

    let newIndent = currentIndent
    if (type === 'indent') {
      newIndent = currentIndent + 1
    } else if (currentIndent > 0) {
      newIndent = currentIndent - 1
    }
    parentBlock.setIndent(newIndent)

    const parentBlockChildren = parentBlock.getChildren()

    const existingIndentChangeSuggestion = parentBlockChildren.find(
      (node) => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'indent-change',
    )

    if (!existingIndentChangeSuggestion && currentIndent !== newIndent) {
      logger('Adding indent-change suggestion')
      const suggestionNode = $createSuggestionNode(suggestionID, 'indent-change', {
        indent: currentIndent,
      } satisfies IndentChangeSuggestionProperties)
      $insertFirst(parentBlock, suggestionNode)
    }
  }

  if (alreadyHandled.size > 0) {
    logger('Created at least one suggestion', suggestionID)
    onSuggestionCreation(suggestionID)
  }

  return alreadyHandled.size > 0
}
