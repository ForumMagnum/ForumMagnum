"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { $getNodeByKey, type LexicalEditor } from 'lexical';
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

const headerStyles = defineStyles('LLMContentBlockHeader', (theme: ThemeType) => ({
  measureSpan: {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
  },
  inputWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 2,
    minWidth: 180,
    padding: '4px 0',
    fontVariant: 'normal',
    fontWeight: 400,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.15),
    boxShadow: `0 2px 6px ${theme.palette.boxShadowColor(0.15)}`,
  },
  suggestion: {
    padding: '2px 8px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.greyAlpha(0.05),
    },
  },
  loadMore: {
    color: theme.palette.grey[600],
  },
}));

const PLACEHOLDER = 'Unknown Model';

const OPTIONS_PAGE_SIZE = 10;

function filterModelOptions(options: readonly string[], query: string): string[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) {
    return [...options];
  }
  return options.filter((option) => option.toLowerCase().includes(trimmedQuery));
}

function setNodeModelName(editor: LexicalEditor, containerNodeKey: string, modelName: string) {
  editor.update(() => {
    const node = $getNodeByKey(containerNodeKey);
    if ($isLLMContentBlockNode(node)) {
      node.setModelName(modelName);
    }
  });
}

export function LLMContentBlockHeaderComponent({ modelName, containerNodeKey }: {
  modelName: string;
  containerNodeKey: string;
}) {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(headerStyles);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const isSuggestionMode = isEditorInSuggestionMode(editor);
  const { data } = useQuery(LlmModelOptionsQuery, { ssr: false });
  const modelOptions = data?.LlmModelOptions ?? [];

  // Writing to the Lexical node (via editor.update → setModelName) triggers
  // an async decorate() cycle that re-renders this component with the new
  // modelName prop. If we used modelName directly as the input value, there
  // would be a visible flash where the input reverts to the old value before
  // the re-render arrives. Local state gives the input an immediate update.
  const [localValue, setLocalValue] = useState(modelName);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);
  const [isShowingSuggestions, setIsShowingSuggestions] = useState(false);
  const [visibleSuggestionCount, setVisibleSuggestionCount] = useState(OPTIONS_PAGE_SIZE);

  const matchingOptions = useMemo(
    () => filterModelOptions(modelOptions, localValue),
    [modelOptions, localValue],
  );
  const visibleOptions = matchingOptions.slice(0, visibleSuggestionCount);

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

  // Attached to the wrapper so that it covers the suggestion list too, which
  // isn't mounted until the input is focused.
  useStopLexicalEventPropagation(wrapperRef);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      setVisibleSuggestionCount(OPTIONS_PAGE_SIZE);
      setIsShowingSuggestions(true);
      setNodeModelName(editor, containerNodeKey, e.target.value);
    },
    [editor, containerNodeKey],
  );

  const handleFocus = useCallback(() => {
    setVisibleSuggestionCount(OPTIONS_PAGE_SIZE);
    setIsShowingSuggestions(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsShowingSuggestions(false);
    }
  }, []);

  const handleSuggestionClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const option = e.currentTarget.dataset.option;
      if (option === undefined) return;
      setLocalValue(option);
      setIsShowingSuggestions(false);
      setNodeModelName(editor, containerNodeKey, option);
    },
    [editor, containerNodeKey],
  );

  const handleLoadMoreClick = useCallback(() => {
    setVisibleSuggestionCount((count) => count + OPTIONS_PAGE_SIZE);
  }, []);

  // Without this the input loses focus before a suggestion's click handler
  // runs, and the blur closes the list out from under the click.
  const handleSuggestionsMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <>
      <span
        ref={measureRef}
        className={classNames('llm-content-block-model-input', classes.measureSpan)}
      >
        {localValue || PLACEHOLDER}
      </span>
      <span className={classes.inputWrapper} ref={wrapperRef}>
        <input
          type="text"
          className="llm-content-block-model-input"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={() => setIsShowingSuggestions(false)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER}
          readOnly={isSuggestionMode}
          style={{ width: inputWidth }}
        />
        {isShowingSuggestions && !isSuggestionMode && visibleOptions.length > 0 && (
          <div className={classes.suggestions} onMouseDown={handleSuggestionsMouseDown}>
            {visibleOptions.map((option) => (
              <div
                key={option}
                className={classes.suggestion}
                data-option={option}
                onClick={handleSuggestionClick}
              >
                {option}
              </div>
            ))}
            {matchingOptions.length > visibleOptions.length && (
              <div
                className={classNames(classes.suggestion, classes.loadMore)}
                onClick={handleLoadMoreClick}
              >
                Load more
              </div>
            )}
          </div>
        )}
      </span>
    </>
  );
}
