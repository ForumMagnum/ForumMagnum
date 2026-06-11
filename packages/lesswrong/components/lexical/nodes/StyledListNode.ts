import { $getSelection, $isRangeSelection, type LexicalEditor, type LexicalNode, type NodeKey } from 'lexical';
import { $applyNodeReplacement } from 'lexical';
import { $getNearestNodeOfType, isHTMLElement } from '@lexical/utils';
import { ListNode, type ListType, type SerializedListNode } from '@lexical/list';

export const orderedListStyleTypes = [
  'decimal',
  'upper-alpha',
  'lower-alpha',
  'upper-roman',
  'lower-roman',
] as const;

export type OrderedListStyleType = typeof orderedListStyleTypes[number];

interface SerializedStyledListNode extends SerializedListNode {
  listStyleType?: OrderedListStyleType;
}

export const DEFAULT_ORDERED_LIST_STYLE_TYPE: OrderedListStyleType = 'decimal';

const orderedListStyleTypeSet = new Set<string>(orderedListStyleTypes);

function normalizeOrderedListStyleType(styleType: unknown): OrderedListStyleType {
  return typeof styleType === 'string' && orderedListStyleTypeSet.has(styleType)
    ? (styleType as OrderedListStyleType)
    : DEFAULT_ORDERED_LIST_STYLE_TYPE;
}

function applyOrderedListStyleType(dom: HTMLElement, listType: ListType, styleType: OrderedListStyleType) {
  if (listType === 'number' && styleType !== DEFAULT_ORDERED_LIST_STYLE_TYPE) {
    dom.style.listStyleType = styleType;
  } else {
    dom.style.listStyleType = '';
  }
}

export class StyledListNode extends ListNode {
  __listStyleType: OrderedListStyleType;

  static getType(): string {
    return 'list';
  }

  static clone(node: StyledListNode): StyledListNode {
    return new StyledListNode(
      node.__listType,
      node.__start,
      node.__listStyleType,
      node.__key,
    );
  }

  constructor(
    listType: ListType = 'number',
    start: number = 1,
    listStyleType: OrderedListStyleType = DEFAULT_ORDERED_LIST_STYLE_TYPE,
    key?: NodeKey,
  ) {
    super(listType, start, key);
    this.__listStyleType = listStyleType;
  }

  afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__listStyleType = prevNode.__listStyleType;
  }

  getListStyleType(): OrderedListStyleType {
    return this.getLatest().__listStyleType;
  }

  setListStyleType(styleType: OrderedListStyleType): this {
    const writable = this.getWritable();
    writable.__listStyleType = styleType;
    return writable;
  }

  createDOM(config: Parameters<ListNode['createDOM']>[0], editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    applyOrderedListStyleType(dom, this.__listType, this.__listStyleType);
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: Parameters<ListNode['updateDOM']>[2]): boolean {
    const shouldReplace = super.updateDOM(prevNode, dom, config);
    if (!shouldReplace) {
      applyOrderedListStyleType(dom, this.__listType, this.__listStyleType);
    }
    return shouldReplace;
  }

  exportDOM(editor: LexicalEditor) {
    const output = super.exportDOM(editor);
    const { element } = output;
    if (isHTMLElement(element)) {
      applyOrderedListStyleType(element, this.__listType, this.__listStyleType);
    }
    return output;
  }

  exportJSON(): SerializedStyledListNode {
    return {
      ...super.exportJSON(),
      listStyleType: this.getListStyleType(),
    };
  }

  static importJSON(serializedNode: SerializedStyledListNode): StyledListNode {
    return $createStyledListNode(
      serializedNode.listType,
      serializedNode.start,
      normalizeOrderedListStyleType(serializedNode.listStyleType),
    ).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: SerializedStyledListNode): this {
    return super
      .updateFromJSON(serializedNode)
      .setListStyleType(normalizeOrderedListStyleType(serializedNode.listStyleType));
  }
}

export function $createStyledListNode(
  listType: ListType = 'number',
  start = 1,
  listStyleType: OrderedListStyleType = DEFAULT_ORDERED_LIST_STYLE_TYPE,
): StyledListNode {
  return $applyNodeReplacement(new StyledListNode(listType, start, listStyleType));
}

export function $isStyledListNode(node: LexicalNode | null | undefined): node is StyledListNode {
  return node instanceof StyledListNode;
}

export function $getListStyleType(node: ListNode | null | undefined): OrderedListStyleType {
  return $isStyledListNode(node)
    ? node.getListStyleType()
    : DEFAULT_ORDERED_LIST_STYLE_TYPE;
}

function $getNearestListNode(node: LexicalNode): ListNode | null {
  if (node instanceof ListNode) {
    return node;
  }
  return $getNearestNodeOfType(node, ListNode);
}

function $getSelectedListNodes(): ListNode[] {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return [];
  }

  const lists = new Set<ListNode>();
  for (const node of selection.getNodes()) {
    const list = $getNearestListNode(node);
    if (list) {
      lists.add(list);
    }
  }

  const anchorList = $getNearestListNode(selection.anchor.getNode());
  if (anchorList) {
    lists.add(anchorList);
  }

  return Array.from(lists);
}

export function $setSelectedOrderedListStyleType(styleType: OrderedListStyleType): void {
  for (const list of $getSelectedListNodes()) {
    if (list.getListType() !== 'number') {
      continue;
    }
    if ($isStyledListNode(list)) {
      list.setListStyleType(styleType);
    }
  }
}

export function setSelectedOrderedListStyleType(
  editor: LexicalEditor,
  styleType: OrderedListStyleType,
): void {
  editor.update(() => {
    $setSelectedOrderedListStyleType(styleType);
  });
}
