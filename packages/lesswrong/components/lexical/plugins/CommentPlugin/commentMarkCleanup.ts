import { $getNodeByKey, type NodeKey } from 'lexical';
import { $isMarkNode, $unwrapMarkNode } from '@lexical/mark';
import type { Comments, Thread } from '@/components/lexical/commenting';

function getThreadMarkId(thread: Thread): string {
  return thread.threadType === 'suggestion'
    ? (thread.markID ?? thread.id)
    : thread.id;
}

export function getActiveCommentThreadIds(
  activeIds: string[],
  comments: Comments,
): string[] {
  const threadMarkIds = new Set(
    comments
      .filter((comment): comment is Thread => comment.type === 'thread')
      .map(getThreadMarkId),
  );
  return activeIds.filter((id) => threadMarkIds.has(id));
}

export function $filterMarkNodeIds(
  markNodeMap: Map<string, Set<NodeKey>>,
  ids: string[],
): string[] {
  return ids.filter((id) => {
    const nodeKeys = markNodeMap.get(id);
    if (!nodeKeys) return false;
    return Array.from(nodeKeys).some((key) => $isMarkNode($getNodeByKey(key)));
  });
}

export function $removeCommentMarkIds(
  markNodeMap: Map<string, Set<NodeKey>>,
  ids: string[],
): void {
  for (const id of ids) {
    const markNodeKeys = markNodeMap.get(id);
    if (!markNodeKeys) continue;

    for (const key of markNodeKeys) {
      const node = $getNodeByKey(key);
      if (!$isMarkNode(node)) continue;

      node.deleteID(id);
      if (node.getIDs().length === 0) {
        $unwrapMarkNode(node);
      }
    }
  }
}
