import { ListNode, type ListType, type SerializedListNode } from '@lexical/list';
import {
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  $addUpdateTag,
  $getSelection,
  $isRangeSelection,
  SKIP_SELECTION_FOCUS_TAG,
} from 'lexical';
import { $getNearestNodeOfType } from '@lexical/utils';

export type OrderedListStyleType =
  | 'decimal'
  | 'lower-alpha'
  | 'upper-alpha'
  | 'lower-roman'
  | 'upper-roman';

export const LIST_STYLE_TYPE_OPTIONS: Array<[OrderedListStyleType, string]> = [
  ['decimal', '1, 2, 3…'],
  ['lower-alpha', 'a, b, c…'],
  ['upper-alpha', 'A, B, C…'],
  ['lower-roman', 'i, ii, iii…'],
  ['upper-roman', 'I, II, III…'],
];

const HTML_TYPE_TO_STYLE: Record<string, OrderedListStyleType> = {
  a: 'lower-alpha',
  A: 'upper-alpha',
  i: 'lower-roman',
  I: 'upper-roman',
};

const STYLE_TO_HTML_TYPE: Partial<Record<OrderedListStyleType, string>> = {
  'lower-alpha': 'a',
  'upper-alpha': 'A',
  'lower-roman': 'i',
  'upper-roman': 'I',
};

interface SerializedStyledListNode extends Omit<SerializedListNode, 'type'> {
  type: 'styled-list';
  listStyleType: OrderedListStyleType;
}

export class StyledListNode extends ListNode {
  __listStyleType: OrderedListStyleType;

  static getType(): string {
    return 'styled-list';
  }

  static clone(node: StyledListNode): StyledListNode {
    return new StyledListNode(
      node.getListType(),
      node.getStart(),
      node.getListStyleType(),
      node.__key,
    );
  }

  constructor(
    listType: ListType,
    start: number,
    listStyleType: OrderedListStyleType,
    key?: NodeKey,
  ) {
    super(listType, start, key);
    this.__listStyleType = listStyleType;
  }

  getListStyleType(): OrderedListStyleType {
    return this.__listStyleType;
  }

  setListStyleType(listStyleType: OrderedListStyleType): void {
    const writable = this.getWritable();
    writable.__listStyleType = listStyleType;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    if (this.__listStyleType !== 'decimal') {
      dom.style.listStyleType = this.__listStyleType;
    }
    return dom;
  }

  updateDOM(prevNode: ListNode, dom: HTMLElement, config: EditorConfig): boolean {
    const shouldReplace = super.updateDOM(prevNode, dom, config);
    if (!shouldReplace) {
      const prevStyleType =
        prevNode instanceof StyledListNode ? prevNode.__listStyleType : 'decimal';
      if (this.__listStyleType !== prevStyleType) {
        dom.style.listStyleType =
          this.__listStyleType === 'decimal' ? '' : this.__listStyleType;
      }
    }
    return shouldReplace;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor);
    if (output.element && this.__listStyleType !== 'decimal') {
      const typeAttr = STYLE_TO_HTML_TYPE[this.__listStyleType];
      if (typeAttr) {
        (output.element as HTMLElement).setAttribute('type', typeAttr);
      }
    }
    return output;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      ol: (domNode: Node) => {
        const el = domNode as HTMLOListElement;
        const typeAttr = el.getAttribute?.('type');
        if (!typeAttr || !HTML_TYPE_TO_STYLE[typeAttr]) return null;
        return {
          conversion: (node: Node): DOMConversionOutput | null => {
            const htmlEl = node as HTMLOListElement;
            const typeA = htmlEl.getAttribute?.('type') ?? '';
            const listStyleType = HTML_TYPE_TO_STYLE[typeA];
            if (!listStyleType) return null;
            const start = parseInt(htmlEl.getAttribute?.('start') ?? '1', 10) || 1;
            return {
              node: new StyledListNode('number', start, listStyleType),
            };
          },
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedStyledListNode {
    return {
      ...super.exportJSON(),
      type: 'styled-list',
      listStyleType: this.__listStyleType,
    };
  }

  static importJSON(serializedNode: SerializedStyledListNode): StyledListNode {
    const node = new StyledListNode(
      serializedNode.listType,
      serializedNode.start,
      serializedNode.listStyleType ?? 'decimal',
    );
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    return node;
  }
}

export function $createStyledListNode(
  listStyleType: OrderedListStyleType,
  start: number = 1,
): StyledListNode {
  return new StyledListNode('number', start, listStyleType);
}

export function $isStyledListNode(
  node: LexicalNode | null | undefined,
): node is StyledListNode {
  return node instanceof StyledListNode;
}

export function applyListStyle(
  editor: LexicalEditor,
  styleType: OrderedListStyleType,
): void {
  editor.update(() => {
    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    const anchorNode = selection.anchor.getNode();
    const listNode = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
    if (!listNode || listNode.getListType() !== 'number') return;
    if (listNode instanceof StyledListNode) {
      listNode.getWritable().setListStyleType(styleType);
    } else {
      const styledList = new StyledListNode(
        'number',
        listNode.getStart(),
        styleType,
      );
      const children = [...listNode.getChildren()];
      listNode.insertAfter(styledList);
      for (const child of children) {
        styledList.append(child);
      }
      listNode.remove();
    }
  });
}
