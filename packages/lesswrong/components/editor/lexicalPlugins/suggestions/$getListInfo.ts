import type { ListItemNode, ListNode, ListType } from '@lexical/list';
import { $isListNode } from '@lexical/list';
import { $findMatchingParent } from '@lexical/utils';

export type ListInfo = {
  listType: ListType;
};

export function $getListInfo(node: ListNode | ListItemNode): ListInfo {
  const list = $isListNode(node) ? node : $findMatchingParent(node, $isListNode);
  if (!list) {
    throw new Error('Could not find list');
  }
  return { listType: list.getListType() };
}
