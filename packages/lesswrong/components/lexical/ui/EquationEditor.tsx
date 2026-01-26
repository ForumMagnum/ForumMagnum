/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX, type Ref, type RefObject } from 'react';

import {isHTMLElement} from 'lexical';
import {ChangeEvent, forwardRef} from 'react';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalEquationEditor', (theme: ThemeType) => ({
  inlineEditor: {
    padding: 0,
    margin: 0,
    border: 0,
    outline: 0,
    color: theme.palette.lexicalEditor.equationText,
    backgroundColor: 'inherit',
    resize: 'none',
  },
  blockEditor: {
    padding: 0,
    margin: 0,
    border: 0,
    outline: 0,
    color: theme.palette.lexicalEditor.equationText,
    backgroundColor: 'inherit',
    resize: 'none',
    width: '100%',
  },
  inputBackground: {
    backgroundColor: theme.palette.grey[200],
  },
  dollarSign: {
    textAlign: 'left',
    color: theme.palette.grey[410],
  },
}));

type BaseEquationEditorProps = {
  equation: string;
  inline: boolean;
  setEquation: (equation: string) => void;
};

function EquationEditor(
  {equation, setEquation, inline}: BaseEquationEditorProps,
  forwardedRef: Ref<HTMLInputElement | HTMLTextAreaElement>,
): JSX.Element {
  const classes = useStyles(styles);
  const onChange = (event: ChangeEvent) => {
    setEquation((event.target as HTMLInputElement).value);
  };

  return inline && isHTMLElement(forwardedRef) ? (
    <span className={classes.inputBackground}>
      <span className={classes.dollarSign}>$</span>
      <input
        className={classes.inlineEditor}
        value={equation}
        onChange={onChange}
        autoFocus={true}
        ref={forwardedRef as RefObject<HTMLInputElement>}
      />
      <span className={classes.dollarSign}>$</span>
    </span>
  ) : (
    <div className={classes.inputBackground}>
      <span className={classes.dollarSign}>{'$$\n'}</span>
      <textarea
        className={classes.blockEditor}
        value={equation}
        onChange={onChange}
        ref={forwardedRef as RefObject<HTMLTextAreaElement>}
      />
      <span className={classes.dollarSign}>{'\n$$'}</span>
    </div>
  );
}

export default forwardRef(EquationEditor);
