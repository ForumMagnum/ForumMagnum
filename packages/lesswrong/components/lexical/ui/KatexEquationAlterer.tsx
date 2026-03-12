/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

import {useCallback, useState} from 'react';
import {ErrorBoundary} from 'react-error-boundary';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '../ui/Button';
import KatexRenderer from './KatexRenderer';

const styles = defineStyles('LexicalKatexEquationAlterer', (theme: ThemeType) => ({
  defaultRow: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  dialogActions: {
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 0,
    justifyContent: 'right',
  },
  centerRow: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textArea: {
    width: '100%',
    resize: 'none',
    padding: 7,
  },
}));

type Props = {
  initialEquation?: string;
  onConfirm: (equation: string, inline: boolean) => void;
};

export default function KatexEquationAlterer({
  onConfirm,
  initialEquation = '',
}: Props): JSX.Element {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const [equation, setEquation] = useState<string>(initialEquation);
  const [inline, setInline] = useState<boolean>(true);

  const onClick = useCallback(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);

  const onCheckboxChange = useCallback(() => {
    setInline(!inline);
  }, [setInline, inline]);

  return (
    <>
      <div className={classes.defaultRow}>
        {'Inline '}
        <input type="checkbox" checked={inline} onChange={onCheckboxChange} />
      </div>
      <div className={classes.defaultRow}>Equation </div>
      <div className={classes.centerRow}>
        {inline ? (
          <input
            onChange={(event) => {
              setEquation(event.target.value);
            }}
            value={equation}
            className={classes.textArea}
          />
        ) : (
          <textarea
            onChange={(event) => {
              setEquation(event.target.value);
            }}
            value={equation}
            className={classes.textArea}
          />
        )}
      </div>
      <div className={classes.defaultRow}>Visualization </div>
      <div className={classes.centerRow}>
        <ErrorBoundary onError={(e) => editor._onError(e as Error)} fallback={null}>
          <KatexRenderer
            equation={equation}
            inline={false}
            onDoubleClick={() => null}
          />
        </ErrorBoundary>
      </div>
      <div className={classes.dialogActions}>
        <Button onClick={onClick}>Confirm</Button>
      </div>
    </>
  );
}
