import type {
  BaseSelection,
  EditorConfig,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical'
import { $isRangeSelection, $isRootOrShadowRoot, ElementNode } from 'lexical'
import type { SuggestionProperties, SuggestionType } from './Types'
import { $isPlainDeletionSuggestion, ProtonNodeTypes } from './Types'
import { addClassNamesToElement } from '@lexical/utils'

type ProtonNodeProperties = SuggestionProperties

type SerializedProtonNode = Spread<
  {
    properties: ProtonNodeProperties
  },
  SerializedElementNode
>

/**
 * Generic node which can contain a bag of properties.
 * Currently used for suggestion nodes.
 *
 * _This node should not be removed from the codebase
 * as it will lead to breakage of documents_
 */
export class ProtonNode extends ElementNode {
  __properties: ProtonNodeProperties

  static getType(): string {
    return 'proton-node'
  }

  constructor(props: ProtonNodeProperties, key?: NodeKey) {
    super(key)
    this.__properties = props
  }

  static clone(node: ProtonNode): ProtonNode {
    return new ProtonNode(node.__properties, node.__key)
  }

  static importJSON(serializedNode: SerializedProtonNode): ProtonNode {
    return $createProtonNode(serializedNode.properties).updateFromJSON(serializedNode)
  }

  exportJSON(): SerializedProtonNode {
    return {
      ...super.exportJSON(),
      properties: this.__properties,
    }
  }

  createDOM(): HTMLElement {
    const properties = this.__properties
    const element = $isPlainDeletionSuggestion(properties.suggestionType)
      ? document.createElement('del')
      : document.createElement('ins');

    if (properties.nodeType === 'suggestion') {
      addClassNamesToElement(element, 'Lexical__Suggestion')
      addClassNamesToElement(element, properties.suggestionType)
      element.setAttribute('data-suggestion-id', properties.suggestionID)
      if ($isPlainDeletionSuggestion(properties.suggestionType)) {
        element.setAttribute('spellcheck', 'false')
      }
      // Add target block type as CSS class for block-type-change suggestions
      const changedProps = properties.nodePropertiesChanged
      if (changedProps && 'targetBlockType' in changedProps && changedProps.targetBlockType) {
        addClassNamesToElement(element, `target-${changedProps.targetBlockType}`)
      }
    }
    return element
  }

  updateDOM(prevNode: ProtonNode, element: HTMLElement, config: EditorConfig): boolean {
    return false
  }

  insertNewAfter(_selection: RangeSelection, restoreSelection = true): null | ElementNode {
    const node = $createProtonNode(this.__properties)
    this.insertAfter(node, restoreSelection)
    return node
  }

  /**
   * When this method returns `false`, and the user types text before this node,
   * Lexical will not try to insert that text inside this node.
   * This is important so that Lexical doesn't insert text into suggestion nodes which
   * are supposed to be empty, for e.g. split or join suggestions.
   */
  canInsertTextBefore(): false {
    return false
  }

  /**
   * When this method returns `false`, and the user types text after this node,
   * Lexical will not try to insert that text inside this node.
   * This is important so that Lexical doesn't insert text into suggestion nodes which
   * are supposed to be empty, for e.g. split or join suggestions.
   */
  canInsertTextAfter(): false {
    return false
  }

  canBeEmpty(): true {
    return true
  }

  isInline(): true {
    return true
  }

  isShadowRoot(): boolean {
    return $isRootOrShadowRoot(this.getParent())
  }

  extractWithChild(child: LexicalNode, selection: BaseSelection, destination: 'clone' | 'html'): boolean {
    if (!$isRangeSelection(selection) || destination === 'html') {
      return false
    }
    const anchor = selection.anchor
    const focus = selection.focus
    const anchorNode = anchor.getNode()
    const focusNode = focus.getNode()
    const isBackward = selection.isBackward()
    const selectionLength = isBackward ? anchor.offset - focus.offset : focus.offset - anchor.offset
    return this.isParentOf(anchorNode) && this.isParentOf(focusNode) && this.getTextContent().length === selectionLength
  }

  /**
   * We include ProtonNodes (suggestion wrappers) in HTML exports so that
   * the server-side `removePrivateLexicalMarkup` can process them:
   * - `<ins>` elements are removed entirely (rejecting unaccepted insertions)
   * - `<del>` elements are unwrapped, keeping the original text
   *
   * The original Proton implementation excluded these from HTML exports
   * (`return destination !== 'clone'`), but our pipeline relies on the
   * `<ins>`/`<del>` tags being present in the serialized HTML.
   */
  excludeFromCopy(_destination: 'clone' | 'html'): boolean {
    return false
  }

  getProtonNodeType(): typeof ProtonNodeTypes[keyof typeof ProtonNodeTypes] {
    return this.__properties.nodeType
  }

  getSuggestionIdOrThrow(): string {
    const props = this.__properties
    if (props.nodeType !== 'suggestion') {
      throw new Error('Node is not suggestion node')
    }
    return props.suggestionID
  }

  setSuggestionId(id: string) {
    const writable = this.getWritable()
    if (writable.__properties.nodeType !== 'suggestion') {
      throw new Error('Node is not suggestion node')
    }
    writable.__properties.suggestionID = id
  }

  getSuggestionTypeOrThrow(): SuggestionType {
    const props = this.__properties
    if (props.nodeType !== 'suggestion') {
      throw new Error('Node is not suggestion node')
    }
    return props.suggestionType
  }

  getSuggestionChangedProperties<T = Record<string, any>>(): T | undefined {
    const props = this.__properties
    if (props.nodeType !== 'suggestion') {
      throw new Error('Node is not suggestion node')
    }
    return props.nodePropertiesChanged as T | undefined
  }
}

export function $createProtonNode(props: ProtonNodeProperties) {
  return new ProtonNode(props)
}

export function $createSuggestionNode(
  id: string,
  type: SuggestionType,
  changedProperties?: SuggestionProperties['nodePropertiesChanged'],
): ProtonNode {
  return $createProtonNode({
    nodeType: ProtonNodeTypes.Suggestion,
    suggestionID: id,
    suggestionType: type,
    nodePropertiesChanged: changedProperties,
  })
}

export function $isSuggestionNode(node: LexicalNode | null | undefined): node is ProtonNode {
  return node instanceof ProtonNode && node.getProtonNodeType() === ProtonNodeTypes.Suggestion
}
