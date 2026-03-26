import { $createHorizontalRuleNode } from '@lexical/extension'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { randomId } from '@/lib/random'
import { $createParagraphNode, $getSelection, $isElementNode, $isRangeSelection } from 'lexical'
import { $createSuggestionNode } from './ProtonNode'

export function $insertDividerAsSuggestion(onSuggestionCreation: (id: string) => void): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }

  const suggestionID = randomId()
  const dividerNode = $createHorizontalRuleNode()
  const suggestionNode = $createSuggestionNode(suggestionID, 'insert-divider')
  suggestionNode.append(dividerNode)

  const insertedNode = $insertNodeToNearestRoot(suggestionNode)
  // $insertNodeToNearestRoot wraps inline nodes (like ProtonNode) in a
  // paragraph, and leaves the cursor inside that wrapper. We need to
  // ensure the cursor ends up after the wrapper paragraph.
  const topLevelNode = insertedNode.getTopLevelElement() ?? insertedNode
  let nextSibling = topLevelNode.getNextSibling()
  if (!nextSibling) {
    const paragraph = $createParagraphNode()
    topLevelNode.insertAfter(paragraph)
    nextSibling = paragraph
  }
  if ($isElementNode(nextSibling)) {
    nextSibling.selectStart()
  }

  onSuggestionCreation(suggestionID)

  return true
}
