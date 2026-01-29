import type { ListType } from '@lexical/list';
import { $createListNode } from '@lexical/list';

export const $createCustomListNode = (listType: ListType) => $createListNode(listType);
