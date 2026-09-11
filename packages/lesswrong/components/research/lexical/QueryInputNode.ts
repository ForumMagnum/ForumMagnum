import {
  ElementNode,
  $createParagraphNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from 'lexical';
import { $createQueryInputHeaderNode } from './QueryInputHeaderNode';
import { $createQueryInputContentNode, QueryInputContentNode } from './QueryInputContentNode';

export const QUERY_INPUT_NODE_TYPE = 'research-query-input';
export const QUERY_INPUT_DOM_CLASS = 'research-query-input';
export const QUERY_INPUT_BASE_ENVIRONMENT_ATTR = 'data-base-environment-id';
export const QUERY_INPUT_RUNTIME_ATTR = 'data-runtime';

/**
 * The environment selection carried by a query-input block. Exactly one of the
 * two is set at submit time: a saved environment (`baseEnvironmentId`) or a
 * blank baseline's chosen runtime.
 */
export interface QueryInputSelection {
  baseEnvironmentId: string | null;
  runtime: string | null;
}

export const RESEARCH_BLANK_RUNTIMES = ['node24', 'python3.13'] as const;
export const DEFAULT_BLANK_RUNTIME = 'node24';

export function encodeSelection(selection: QueryInputSelection): string {
  if (selection.baseEnvironmentId) return `env:${selection.baseEnvironmentId}`;
  return `runtime:${selection.runtime ?? DEFAULT_BLANK_RUNTIME}`;
}

export function decodeSelection(value: string): QueryInputSelection | null {
  if (value.startsWith('env:')) {
    return { baseEnvironmentId: value.slice('env:'.length), runtime: null };
  }
  if (value.startsWith('runtime:')) {
    return { baseEnvironmentId: null, runtime: value.slice('runtime:'.length) };
  }
  return null;
}

export type SerializedQueryInputNode = Spread<
  { baseEnvironmentId: string | null; runtime: string | null },
  SerializedElementNode
>;

export class QueryInputNode extends ElementNode {
  __baseEnvironmentId: string | null;
  __runtime: string | null;

  static getType(): string {
    return QUERY_INPUT_NODE_TYPE;
  }

  static clone(node: QueryInputNode): QueryInputNode {
    return new QueryInputNode(
      { baseEnvironmentId: node.__baseEnvironmentId, runtime: node.__runtime },
      node.__key,
    );
  }

  constructor(selection: QueryInputSelection = { baseEnvironmentId: null, runtime: null }, key?: NodeKey) {
    super(key);
    this.__baseEnvironmentId = selection.baseEnvironmentId;
    this.__runtime = selection.runtime;
  }

  getBaseEnvironmentId(): string | null {
    return this.__baseEnvironmentId;
  }

  getRuntime(): string | null {
    return this.__runtime;
  }

  getSelection(): QueryInputSelection {
    return { baseEnvironmentId: this.__baseEnvironmentId, runtime: this.__runtime };
  }

  setSelection(selection: QueryInputSelection): void {
    const writable = this.getWritable();
    writable.__baseEnvironmentId = selection.baseEnvironmentId;
    writable.__runtime = selection.runtime;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = QUERY_INPUT_DOM_CLASS;
    // Mark the shell non-editable; the inner QueryInputContentNode opts back
    // in with contenteditable="true". This boundary is what lets arrow-key
    // navigation exit the container naturally.
    div.setAttribute('contenteditable', 'false');
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const wrapper = document.createElement('div');
    wrapper.className = QUERY_INPUT_DOM_CLASS;
    if (this.__baseEnvironmentId) {
      wrapper.setAttribute(QUERY_INPUT_BASE_ENVIRONMENT_ATTR, this.__baseEnvironmentId);
    }
    if (this.__runtime) {
      wrapper.setAttribute(QUERY_INPUT_RUNTIME_ATTR, this.__runtime);
    }
    return { element: wrapper };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains(QUERY_INPUT_DOM_CLASS)) return null;
        return { conversion: convertQueryInputElement, priority: 2 };
      },
    };
  }

  exportJSON(): SerializedQueryInputNode {
    return {
      ...super.exportJSON(),
      type: QUERY_INPUT_NODE_TYPE,
      version: 1,
      baseEnvironmentId: this.__baseEnvironmentId,
      runtime: this.__runtime,
    };
  }

  static importJSON(serialized: SerializedQueryInputNode): QueryInputNode {
    return $createQueryInputNode({
      baseEnvironmentId: serialized.baseEnvironmentId ?? null,
      runtime: serialized.runtime ?? null,
    }).updateFromJSON(serialized);
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

function convertQueryInputElement(domNode: HTMLElement): DOMConversionOutput {
  const baseEnvironmentId = domNode.getAttribute(QUERY_INPUT_BASE_ENVIRONMENT_ATTR);
  const runtime = domNode.getAttribute(QUERY_INPUT_RUNTIME_ATTR);
  return { node: $createQueryInputNode({ baseEnvironmentId, runtime }) };
}

export function $createQueryInputNode(
  selection: QueryInputSelection = { baseEnvironmentId: null, runtime: null },
): QueryInputNode {
  return new QueryInputNode(selection);
}

export function $isQueryInputNode(node: LexicalNode | null | undefined): node is QueryInputNode {
  return node instanceof QueryInputNode;
}

/**
 * Build a fully-populated QueryInput: `[Header, Content[paragraphs]]`. The
 * `[Header, Content]` structure is the node's canonical shape (enforced by
 * the plugin's structure transform on every mutation) — callers should use
 * this helper rather than reassembling it inline. Returns the content node
 * too so callers don't need to walk children to find it.
 */
export function $createPopulatedQueryInputNode(
  selection: QueryInputSelection,
  contentChildren?: LexicalNode[],
): { node: QueryInputNode; content: QueryInputContentNode } {
  const node = $createQueryInputNode(selection);
  const content = $createQueryInputContentNode();
  if (contentChildren && contentChildren.length > 0) {
    for (const child of contentChildren) content.append(child);
  } else {
    content.append($createParagraphNode());
  }
  node.append($createQueryInputHeaderNode());
  node.append(content);
  return { node, content };
}
