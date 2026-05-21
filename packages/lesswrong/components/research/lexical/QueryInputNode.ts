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
export const QUERY_INPUT_WORKSPACE_REPO_ATTR = 'data-workspace-repo-id';

export type SerializedQueryInputNode = Spread<
  { workspaceRepoId: string | null },
  SerializedElementNode
>;

export class QueryInputNode extends ElementNode {
  __workspaceRepoId: string | null;

  static getType(): string {
    return QUERY_INPUT_NODE_TYPE;
  }

  static clone(node: QueryInputNode): QueryInputNode {
    return new QueryInputNode(node.__workspaceRepoId, node.__key);
  }

  constructor(workspaceRepoId: string | null = null, key?: NodeKey) {
    super(key);
    this.__workspaceRepoId = workspaceRepoId;
  }

  getWorkspaceRepoId(): string | null {
    return this.__workspaceRepoId;
  }

  setWorkspaceRepoId(workspaceRepoId: string | null): void {
    const writable = this.getWritable();
    writable.__workspaceRepoId = workspaceRepoId;
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
    if (this.__workspaceRepoId) {
      wrapper.setAttribute(QUERY_INPUT_WORKSPACE_REPO_ATTR, this.__workspaceRepoId);
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
      workspaceRepoId: this.__workspaceRepoId,
    };
  }

  static importJSON(serialized: SerializedQueryInputNode): QueryInputNode {
    return $createQueryInputNode(serialized.workspaceRepoId ?? null).updateFromJSON(serialized);
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

function convertQueryInputElement(domNode: HTMLElement): DOMConversionOutput {
  const workspaceRepoId = domNode.getAttribute(QUERY_INPUT_WORKSPACE_REPO_ATTR);
  return { node: $createQueryInputNode(workspaceRepoId) };
}

export function $createQueryInputNode(workspaceRepoId: string | null = null): QueryInputNode {
  return new QueryInputNode(workspaceRepoId);
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
  workspaceRepoId: string | null,
  contentChildren?: LexicalNode[],
): { node: QueryInputNode; content: QueryInputContentNode } {
  const node = $createQueryInputNode(workspaceRepoId);
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
