import type { NodeKey, LexicalEditor } from 'lexical'
import { $getNodeByKey } from 'lexical'
import type { SuggestionSummaryType } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController'
import { $isSuggestionNode } from './ProtonNode'

export type SuggestionSummaryContent = { type: SuggestionSummaryType; content: string; replaceWith?: string }[]

const TextContentLimit = 80

const TypesToPrioritize: SuggestionSummaryType[] = ['insert', 'delete', 'replace']

export function generateSuggestionSummary(
  editor: LexicalEditor,
  markNodeMap: Map<string, Set<NodeKey>>,
  suggestionID: string,
): SuggestionSummaryContent {
  const summary: SuggestionSummaryContent = []

  editor.getEditorState().read(() => {
    const nodes = markNodeMap.get(suggestionID)

    if (!nodes || nodes.size === 0) {
      return
    }

    for (const key of nodes) {
      const node = $getNodeByKey(key)
      if (!$isSuggestionNode(node)) {
        continue
      }

      const currentType = node.getSuggestionTypeOrThrow()

      let type: SuggestionSummaryType = currentType

      let content = node.getTextContent().slice(0, TextContentLimit)

      let replaceWith: string | undefined = undefined

      if (currentType === 'split' || currentType === 'join') {
        content = ''
      }

      const lastItem = summary[summary.length - 1]
      if (!lastItem) {
        summary.push({ type, content, replaceWith })
        continue
      }

      const shouldPrioritizeLastItem = TypesToPrioritize.includes(lastItem.type)
      const shouldPrioritizeCurrentItem = TypesToPrioritize.includes(type)
      if (!shouldPrioritizeLastItem && shouldPrioritizeCurrentItem) {
        lastItem.type = type
        lastItem.content = content
        continue
      }
      if (shouldPrioritizeLastItem && !shouldPrioritizeCurrentItem) {
        continue
      }

      if (lastItem.type === type) {
        if (lastItem.content === content) {
          continue
        }
        lastItem.content = (lastItem.content + content).slice(0, TextContentLimit)
        continue
      }

      const isReplace =
        (lastItem.type === 'insert' && currentType === 'delete') ||
        (lastItem.type === 'delete' && currentType === 'insert')
      if (isReplace) {
        const lastItemType = lastItem.type
        const lastItemContent = lastItem.content
        lastItem.type = 'replace'
        if (currentType === 'delete') {
          lastItem.content = content
          if (lastItemType === 'insert') {
            lastItem.replaceWith = lastItemContent
          }
        } else if (currentType === 'insert') {
          lastItem.replaceWith = content
          if (lastItemType === 'delete') {
            lastItem.content = lastItemContent
          }
        }
        continue
      }

      summary.push({ type, content, replaceWith })
    }
  })

  return summary
}
