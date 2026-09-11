"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { $getNodeByKey } from 'lexical';
import { $isLLMContentBlockNode, } from './LLMContentBlockNode';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useStopLexicalEventPropagation } from '../useStopLexicalEventPropagation';
import { isEditorInSuggestionMode } from './LLMContentBlockPlugin';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';

const LlmModelOptionsQuery = gql(`
  query LlmModelOptions {
    LlmModelOptions
  }
`);

const headerStyles = defineStyles('LLMContentBlockHeader', () => ({
  measureSpan: {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
  },
}));

const PLACEHOLDER = 'Unknown Model';

const MAX_VISIBLE_SUGGESTIONS = 10;

const NO_OPTIONS: string[] = [];

function bestModelOptions(options: readonly string[], query: string): readonly string[] {
  const trimmedQuery = query.trim().toLowerCase();
  const matches = trimmedQuery
    ? options.filter((option) => option.toLowerCase().includes(trimmedQuery))
    : options;
  return matches.slice(0, MAX_VISIBLE_SUGGESTIONS);
}

export function LLMContentBlockHeaderComponent({ modelName, containerNodeKey }: {
  modelName: string;
  containerNodeKey: string;
}) {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(headerStyles);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const isSuggestionMode = isEditorInSuggestionMode(editor);
  const { data } = useQuery(LlmModelOptionsQuery, { ssr: false, skip: isSuggestionMode });

  // Writes to the Lexical node come back as a new modelName prop only after an
  // async decorate() cycle, so the input needs its own immediate value.
  const [localValue, setLocalValue] = useState(modelName);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);

  const visibleOptions = useMemo(
    () => bestModelOptions(data?.LlmModelOptions ?? NO_OPTIONS, localValue),
    [data, localValue],
  );

  // Re-sync on changes from elsewhere, eg undo/redo or collaboration.
  useEffect(() => {
    setLocalValue(modelName);
  }, [modelName]);

  // Size the input to its content, with a buffer so the last character isn't clipped.
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
        {visibleOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}
