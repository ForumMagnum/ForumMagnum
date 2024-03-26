import {canMention, userMentionQuery, userMentionValue} from '../../lib/pingback'

type ValidationResult = { valid: boolean, message?: string, }
export const checkEditorValid = (document: AnyBecauseTodo, currentUser: UsersCurrent | null, isCommentEditor?: boolean): ValidationResult => {
  if (!currentUser) return {
    valid: false,
    message: isCommentEditor ? 'You must be logged in to comment.' : 'You must be logged in to post.'
  }

  const verifyCanMention = canMention(currentUser, countMentions(document))

  return {
    valid: verifyCanMention.result,
    message: verifyCanMention.reason,
  }
}

function countMentions(document: AnyBecauseTodo): number {
  const rootElement = document.getRoot()

  return countMentionsRecursively(rootElement)

  function countMentionsRecursively(node: AnyBecauseTodo) {
    let mentions = 0

    for (const child of node.getChildren()) {
      if (child.is('text')) {
        const href = child.getAttribute('linkHref')
        if (!href) continue

        mentions += isMention(href) ? 1 : 0
      } else if (child.is('element')) {
        mentions += countMentionsRecursively(child)
      }
    }

    return mentions
  }
}

function isMention(href: string) {
  try {
    // URLs that fail to parse (including relative URLs) throw an exception from
    // `new URL`. Don't count them as mentions.
    const url = new URL(href);
    return url.searchParams.get(userMentionQuery) === userMentionValue
  } catch {
    return false;
  }
}
