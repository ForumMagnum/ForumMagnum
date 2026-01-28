/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, {useState} from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ClipboardIcon } from '../../../../icons/ClipboardIcon';
import { SuccessIcon } from '../../../../icons/SuccessIcon';

import {useDebounce} from '../../utils';

const styles = defineStyles('LexicalCopyButton', (theme: ThemeType) => ({
  icon: {
    display: 'flex',
    width: 18,
    height: 18,
    opacity: 0.6,
  },
}));

interface Props {
  getCodeText: () => string;
  menuItemClassName?: string;
}

export function CopyButton({getCodeText, menuItemClassName}: Props) {
  const classes = useStyles(styles);
  const [isCopyCompleted, setCopyCompleted] = useState<boolean>(false);

  const removeSuccessIcon = useDebounce(() => {
    setCopyCompleted(false);
  }, 1000);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    const content = getCodeText();

    try {
      await navigator.clipboard.writeText(content);
      setCopyCompleted(true);
      removeSuccessIcon();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy: ', err);
    }
  }

  return (
    <button type="button" className={menuItemClassName} onClick={handleClick} aria-label="copy">
      {isCopyCompleted ? (
        <SuccessIcon className={classes.icon} />
      ) : (
        <ClipboardIcon className={classes.icon} />
      )}
    </button>
  );
}
