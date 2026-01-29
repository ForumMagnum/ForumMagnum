import type { ProtonNode } from './ProtonNode'
import { $unwrapSuggestionNode } from './Utils'

export function $removeSuggestionNodeAndResolveIfNeeded(node: ProtonNode) {
  node.remove()
}

export function $unwrapSuggestionNodeAndResolveIfNeeded(node: ProtonNode) {
  $unwrapSuggestionNode(node)
}
