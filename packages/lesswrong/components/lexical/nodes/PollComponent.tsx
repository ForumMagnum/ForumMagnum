/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Option, Options, PollNode} from './PollNode';
import React, { type JSX } from 'react';

import {useCollaborationContext} from '@lexical/react/LexicalCollaborationContext';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';
import {mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  NodeKey,
} from 'lexical';
import {useEffect, useMemo, useRef, useState} from 'react';

import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '../ui/Button';
import {$isPollNode, createPollOption} from './PollNode';

const styles = defineStyles('LexicalPollComponent', (theme: ThemeType) => ({
  container: {
    border: `1px solid ${theme.palette.grey[200]}`,
    backgroundColor: theme.palette.grey[55],
    borderRadius: 10,
    maxWidth: 600,
    minWidth: 400,
    cursor: 'pointer',
    userSelect: 'none',
  },
  focused: {
    outline: `2px solid ${theme.palette.primary.main}`,
  },
  inner: {
    margin: 15,
    cursor: 'default',
  },
  heading: {
    margin: '0 0 15px 0',
    color: theme.palette.grey[680],
    textAlign: 'center',
    fontSize: 18,
  },
  optionContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  optionInputWrapper: {
    display: 'flex',
    flex: '10px',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 5,
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  optionInput: {
    display: 'flex',
    flex: '1px',
    border: 0,
    padding: 7,
    color: theme.palette.primary.main,
    backgroundColor: 'transparent',
    fontWeight: 'bold',
    outline: 0,
    zIndex: 0,
    '&::placeholder': {
      fontWeight: 'normal',
      color: theme.palette.grey[550]
    },
  },
  optionInputVotes: {
    backgroundColor: theme.palette.primary.light,
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    transition: 'width 1s ease',
    zIndex: 0,
  },
  optionInputVotesCount: {
    color: theme.palette.primary.main,
    position: 'absolute',
    right: 15,
    fontSize: 12,
    top: 5,
  },
  optionCheckboxWrapper: {
    position: 'relative',
    display: 'flex',
    width: 22,
    height: 22,
    border: `1px solid ${theme.palette.grey[550]}`,
    marginRight: 10,
    borderRadius: 5,
  },
  optionCheckboxChecked: {
    border: `1px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.primary.main,
    '&:after': {
      content: '""',
      cursor: 'pointer',
      borderColor: theme.palette.grey[0],
      borderStyle: 'solid',
      position: 'absolute',
      display: 'block',
      top: 4,
      width: 5,
      left: 8,
      height: 9,
      margin: 0,
      transform: 'rotate(45deg)',
      borderWidth: '0 2px 2px 0',
      pointerEvents: 'none',
    },
  },
  optionCheckbox: {
    border: 0,
    position: 'absolute',
    display: 'block',
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  optionDelete: {
    position: 'relative',
    display: 'flex',
    width: 28,
    height: 28,
    marginLeft: 6,
    border: 0,
    backgroundColor: 'transparent',
    backgroundPosition: '6px 6px',
    backgroundRepeat: 'no-repeat',
    zIndex: 0,
    cursor: 'pointer',
    borderRadius: 5,
    opacity: 0.3,
    '&:before, &:after': {
      position: 'absolute',
      display: 'block',
      content: '""',
      backgroundColor: theme.palette.grey[550],
      width: 2,
      height: 15,
      top: 6,
      left: 13,
    },
    '&:before': {
      transform: 'rotate(-45deg)',
    },
    '&:after': {
      transform: 'rotate(45deg)',
    },
    '&:hover': {
      opacity: 1,
      backgroundColor: theme.palette.grey[200],
    },
  },
  optionDeleteDisabled: {
    cursor: 'not-allowed',
    '&:hover': {
      opacity: 0.3,
      backgroundColor: 'transparent',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
  },
}));

function getTotalVotes(options: Options): number {
  return options.reduce((totalVotes, next) => {
    return totalVotes + next.votes.length;
  }, 0);
}

function PollOptionComponent({
  option,
  index,
  options,
  totalVotes,
  withPollNode,
  classes,
}: {
  index: number;
  option: Option;
  options: Options;
  totalVotes: number;
  withPollNode: (
    cb: (pollNode: PollNode) => void,
    onSelect?: () => void,
  ) => void;
  classes: ReturnType<typeof useStyles<typeof styles>>;
}): JSX.Element {
  const {name: username} = useCollaborationContext();
  const checkboxRef = useRef(null);
  const votesArray = option.votes;
  const checkedIndex = votesArray.indexOf(username);
  const checked = checkedIndex !== -1;
  const votes = votesArray.length;
  const text = option.text;

  return (
    <div className={classes.optionContainer}>
      <div
        className={classNames(
          classes.optionCheckboxWrapper,
          checked && classes.optionCheckboxChecked,
        )}>
        <input
          ref={checkboxRef}
          className={classes.optionCheckbox}
          type="checkbox"
          onChange={(e) => {
            withPollNode((node) => {
              node.toggleVote(option, username);
            });
          }}
          checked={checked}
        />
      </div>
      <div className={classes.optionInputWrapper}>
        <div
          className={classes.optionInputVotes}
          style={{width: `${votes === 0 ? 0 : (votes / totalVotes) * 100}%`}}
        />
        <span className={classes.optionInputVotesCount}>
          {votes > 0 && (votes === 1 ? '1 vote' : `${votes} votes`)}
        </span>
        <input
          className={classes.optionInput}
          type="text"
          value={text}
          onChange={(e) => {
            const target = e.target;
            const value = target.value;
            const selectionStart = target.selectionStart;
            const selectionEnd = target.selectionEnd;
            withPollNode(
              (node) => {
                node.setOptionText(option, value);
              },
              () => {
                target.selectionStart = selectionStart;
                target.selectionEnd = selectionEnd;
              },
            );
          }}
          placeholder={`Option ${index + 1}`}
        />
      </div>
      <button
        disabled={options.length < 3}
        className={classNames(
          classes.optionDelete,
          options.length < 3 && classes.optionDeleteDisabled,
        )}
        aria-label="Remove"
        onClick={() => {
          withPollNode((node) => {
            node.deleteOption(option);
          });
        }}
      />
    </div>
  );
}

export default function PollComponent({
  question,
  options,
  nodeKey,
}: {
  nodeKey: NodeKey;
  options: Options;
  question: string;
}): JSX.Element {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const totalVotes = useMemo(() => getTotalVotes(options), [options]);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const ref = useRef(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;

          if (event.target === ref.current) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, isSelected, nodeKey, setSelected]);

  const withPollNode = (
    cb: (node: PollNode) => void,
    onUpdate?: () => void,
  ): void => {
    editor.update(
      () => {
        const node = $getNodeByKey(nodeKey);
        if ($isPollNode(node)) {
          cb(node);
        }
      },
      {onUpdate},
    );
  };

  const addOption = () => {
    withPollNode((node) => {
      node.addOption(createPollOption());
    });
  };

  const isFocused = $isNodeSelection(selection) && isSelected;

  return (
    <div
      className={classNames(classes.container, isFocused && classes.focused)}
      ref={ref}>
      <div className={classes.inner}>
        <h2 className={classes.heading}>{question}</h2>
        {options.map((option, index) => {
          const key = option.uid;
          return (
            <PollOptionComponent
              key={key}
              withPollNode={withPollNode}
              option={option}
              index={index}
              options={options}
              totalVotes={totalVotes}
              classes={classes}
            />
          );
        })}
        <div className={classes.footer}>
          <Button onClick={addOption} small={true}>
            Add Option
          </Button>
        </div>
      </div>
    </div>
  );
}
