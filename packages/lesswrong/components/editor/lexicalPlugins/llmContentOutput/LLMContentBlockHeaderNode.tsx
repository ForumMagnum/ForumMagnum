"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DecoratorNode,
  DOMExportOutput,
  LexicalNode,
  SerializedLexicalNode,
  $getNodeByKey,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  $isLLMContentBlockNode,
} from './LLMContentBlockNode';
import { isEditorInSuggestionMode } from './LLMContentBlockPlugin';

const headerStyles = defineStyles('LLMContentBlockHeader', () => ({
  measureSpan: {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
  },
}));

export type SerializedLLMContentBlockHeaderNode = SerializedLexicalNode;

interface LLMContentBlockHeaderComponentProps {
  modelName: string;
  containerNodeKey: string;
}

const LLM_MODEL_OPTIONS = [
  'Claude Opus 4.6',
  'Claude Opus 4.5',
  'Claude Opus 3',
  'Claude Sonnet 4.5',
  'Claude Sonnet 4',
  'Claude Haiku 4.5',
  'Claude Haiku 3.5',
  'GPT-5.2',
  'GPT-5.1',
  'GPT-4.5',
  'Gemini 3.0 Pro Preview',
  'Gemini 3.0 Flash Preview',
  'Gemini 2.5 Pro',
  'Grok 4.1',
  'DeepSeek v3.2',
  'Kimi K2.5'
] as const;

/**
 * Lexical attaches native keydown/beforeinput listeners on the editor root
 * that intercept keyboard events and handle them as editor commands (e.g.
 * Cmd+Z → undo editor state, Opt+Backspace → delete word in editor). When
 * a user types in our <input>, those events bubble up to the root and get
 * consumed by Lexical before the input can process them, breaking undo,
 * word-delete shortcuts, and normal typing.
 *
 * We stop propagation at the input element using native DOM listeners
 * (not React synthetic events, which fire after native bubbling has already
 * delivered the event to Lexical's handlers).
 */
function useStopEventPropagation(ref: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('keydown', stop);
    el.addEventListener('keyup', stop);
    el.addEventListener('keypress', stop);
    el.addEventListener('beforeinput', stop);

    return () => {
      el.removeEventListener('keydown', stop);
      el.removeEventListener('keyup', stop);
      el.removeEventListener('keypress', stop);
      el.removeEventListener('beforeinput', stop);
    };
  }, [ref]);
}

const PLACEHOLDER = 'Unknown Model';

function LLMContentBlockHeaderComponent({
  modelName,
  containerNodeKey,
}: LLMContentBlockHeaderComponentProps) {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(headerStyles);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const isSuggestionMode = isEditorInSuggestionMode(editor);

  // Writing to the Lexical node (via editor.update → setModelName) triggers
  // an async decorate() cycle that re-renders this component with the new
  // modelName prop. If we used modelName directly as the input value, there
  // would be a visible flash where the input reverts to the old value before
  // the re-render arrives. Local state gives the input an immediate update.
  const [localValue, setLocalValue] = useState(modelName);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);

  // Re-sync when the Lexical node is updated by something other than this
  // input (e.g. undo/redo, collaboration).
  useEffect(() => {
    setLocalValue(modelName);
  }, [modelName]);

  // Measure the hidden span to size the input to its content, plus extra
  // space for the dropdown arrow (10px icon + 4px right offset + 2px buffer).
  useEffect(() => {
    if (measureRef.current) {
      setInputWidth(measureRef.current.offsetWidth + 16);
    }
  }, [localValue]);

  useStopEventPropagation(inputRef);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      editor.update(() => {
        const node = $getNodeByKey(containerNodeKey);
        if ($isLLMContentBlockNode(node)) {
          node.setModelName(newValue);
        }
      });
    },
    [editor, containerNodeKey],
  );

  return (
    <>
      <span
        ref={measureRef}
        className={classNames('llm-content-block-model-input', classes.measureSpan)}
      >
        {localValue || PLACEHOLDER}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="llm-content-block-model-input"
        value={localValue}
        onChange={handleChange}
        placeholder={PLACEHOLDER}
        readOnly={isSuggestionMode}
        list={isSuggestionMode ? undefined : `llm-model-list-${containerNodeKey}`}
        style={{ width: inputWidth }}
      />
      <datalist id={`llm-model-list-${containerNodeKey}`}>
        {LLM_MODEL_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

/**
 * The model-name combobox must live inside the LLMContentBlockNode's
 * contenteditable="false" container, but a raw DOM <input> there would be
 * invisible to Lexical's React reconciliation and would lose its state on
 * any editor update. Using a DecoratorNode lets us render a full React
 * component (via decorate()) whose lifecycle is managed by Lexical,
 * giving us a persistent, interactive input inside a non-editable zone.
 */
export class LLMContentBlockHeaderNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return 'llm-content-block-header';
  }

  static clone(node: LLMContentBlockHeaderNode): LLMContentBlockHeaderNode {
    return new LLMContentBlockHeaderNode(node.__key);
  }

  static importJSON(
    _serializedNode: SerializedLLMContentBlockHeaderNode,
  ): LLMContentBlockHeaderNode {
    return $createLLMContentBlockHeaderNode();
  }

  exportJSON(): SerializedLLMContentBlockHeaderNode {
    return {
      ...super.exportJSON(),
      type: LLMContentBlockHeaderNode.getType(),
      version: 1,
    };
  }

  static importDOM(): null {
    // Header is stripped during container import and re-added by the
    // ensure-structure transform, so no importDOM is needed.
    return null;
  }

  exportDOM(): DOMExportOutput {
    // The model name is stored as data-model-name on the container.
    // ContentItemBody hydrates the header at render time, so we don't
    // emit a header element in the exported HTML.
    return { element: null };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'llm-content-block-header';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): false {
    return false;
  }

  decorate(): React.ReactElement {
    const parent = this.getParent();
    if (!$isLLMContentBlockNode(parent)) {
      return <></>;
    }

    return (
      <LLMContentBlockHeaderComponent
        modelName={parent.getModelName()}
        containerNodeKey={parent.getKey()}
      />
    );
  }
}

export function $createLLMContentBlockHeaderNode(): LLMContentBlockHeaderNode {
  return new LLMContentBlockHeaderNode();
}

export function $isLLMContentBlockHeaderNode(
  node: LexicalNode | null | undefined,
): node is LLMContentBlockHeaderNode {
  return node instanceof LLMContentBlockHeaderNode;
}
