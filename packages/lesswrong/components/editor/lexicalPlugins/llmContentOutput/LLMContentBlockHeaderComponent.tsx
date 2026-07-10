"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { $getNodeByKey } from 'lexical';
import { $isLLMContentBlockNode, } from './LLMContentBlockNode';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useStopLexicalEventPropagation } from '../useStopLexicalEventPropagation';
import { isEditorInSuggestionMode } from './LLMContentBlockPlugin';

const headerStyles = defineStyles('LLMContentBlockHeader', () => ({
  measureSpan: {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
  },
}));

const LLM_MODEL_OPTIONS = [
  'Claude Opus 4.7',
  'Claude Opus 4.6',
  'Claude Opus 4.5',
  'Claude Opus 3',
  'Claude Sonnet 4.6',
  'Claude Sonnet 4.5',
  'Claude Sonnet 4',
  'Claude Haiku 4.5',
  'Claude Haiku 3.5',
  'GPT-5.4',
  'GPT-5.2',
  'GPT-5.1',
  'GPT-4.5',
  'Gemini 3.1 Pro Preview',
  'Gemini 3.0 Flash Preview',
  'Gemini 2.5 Pro',
  'Grok 4.1',
  'DeepSeek v3.2',
  'Kimi K2.5'
] as const;

const PLACEHOLDER = 'Unknown Model';

export function LLMContentBlockHeaderComponent({ modelName, containerNodeKey }: {
  modelName: string;
  containerNodeKey: string;
}) {
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

  // Measure the hidden span to size the input to its content, with a small
  // buffer so editing doesn't clip the final character.
  useEffect(() => {
    if (measureRef.current) {
      setInputWidth(measureRef.current.offsetWidth + 4);
    }
  }, [localValue]);

  useStopLexicalEventPropagation(inputRef);

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
