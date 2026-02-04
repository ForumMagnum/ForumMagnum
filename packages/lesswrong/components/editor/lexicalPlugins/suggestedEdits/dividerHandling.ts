import { generateUUID } from '@/lib/vendor/proton/generateUUID'
import { $getSelection, $isNodeSelection } from 'lexical'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { $findMatchingParent, $wrapNodeInElement } from '@lexical/utils'
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import type { Logger } from '@/lib/vendor/proton/logger'

function $getHorizontalRuleNodeInSelection() {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isHorizontalRuleNode(node) ? node : null
}

export function $handleDividerDeleteAsSuggestion(
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  const dividerNode = $getHorizontalRuleNodeInSelection()
  if (!dividerNode) {
    return false
  }
  const existingSuggestionParent = $findMatchingParent(dividerNode, $isSuggestionNode)
  const suggestionType = existingSuggestionParent?.getSuggestionTypeOrThrow()
  if (existingSuggestionParent && suggestionType === 'insert-divider') {
    // If the divider was just inserted as a suggestion, remove the whole suggestion
    existingSuggestionParent.remove()
    return true
  }
  const suggestionID = generateUUID()
  $wrapNodeInElement(dividerNode, () => $createSuggestionNode(suggestionID, 'delete-divider'))
  onSuggestionCreation(suggestionID)
  return true
}
