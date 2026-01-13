import { $forEachSelectedTextNode, $patchStyleText, getStyleObjectFromCSS } from '@lexical/selection'
import type { Logger } from '@/lib/utils/logging'
import { $getSelection, $isRangeSelection, $setSelection } from 'lexical'
import { randomId } from '@/lib/random'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { $findMatchingParent, $wrapNodeInElement } from '@lexical/utils'

export function $patchStyleAsSuggestion(
  property: string,
  value: string | null,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger(`Patching style as suggestion ${property} ${value}`)
  const selection = $getSelection()

  const patch = {
    [property]: value,
  }

  if (!$isRangeSelection(selection)) {
    logger('Selection is not range selection')
    return true
  }

  if (selection.isCollapsed()) {
    logger('Patching selection directly as it is collapsed')
    $patchStyleText(selection, patch)
    return true
  }

  const suggestionID = randomId()

  $forEachSelectedTextNode((textNode) => {
    const styleSuggestionParent = $findMatchingParent(
      textNode,
      (n): n is ProtonNode => $isSuggestionNode(n) && n.getSuggestionTypeOrThrow() === 'style-change',
    )

    const styleObj = getStyleObjectFromCSS(textNode.getStyle())
    const existingValue = styleObj[property] || null

    if (!styleSuggestionParent) {
      $wrapNodeInElement(textNode, () =>
        $createSuggestionNode(suggestionID, 'style-change', {
          [property]: existingValue,
        }),
      ) as ProtonNode
    } else {
      const props = styleSuggestionParent.getSuggestionChangedProperties()
      if (props && props[property] === undefined) {
        const writable = styleSuggestionParent.getWritable()
        writable.__properties.nodePropertiesChanged![property] = existingValue
      }
    }

    const selectionToPatch = textNode.select(0, textNode.getTextContentSize())
    $patchStyleText(selectionToPatch, patch)
  })

  $setSelection(selection.clone())

  onSuggestionCreation(suggestionID)

  return true
}
