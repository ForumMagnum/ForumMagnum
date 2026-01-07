/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {LexicalEditor} from 'lexical';

import {useState} from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

import Button from '../../ui/Button';
import DropDown, {DropDownItem} from '../../ui/DropDown';
import {INSERT_LAYOUT_COMMAND} from './LayoutPlugin';
import { toolbarItem } from '../../styles/toolbarStyles';

const styles = defineStyles('LexicalInsertLayoutDialog', (theme: ThemeType) => ({
  toolbarItem: {
    ...toolbarItem(theme),
    backgroundColor: theme.palette.grey[200],
    marginBottom: 10,
    width: '100%',
  },
}));

const LAYOUTS = [
  {label: '2 columns (equal width)', value: '1fr 1fr'},
  {label: '2 columns (25% - 75%)', value: '1fr 3fr'},
  {label: '3 columns (equal width)', value: '1fr 1fr 1fr'},
  {label: '3 columns (25% - 50% - 25%)', value: '1fr 2fr 1fr'},
  {label: '4 columns (equal width)', value: '1fr 1fr 1fr 1fr'},
];

export default function InsertLayoutDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const classes = useStyles(styles);
  const [layout, setLayout] = useState(LAYOUTS[0].value);
  const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label;

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, layout);
    onClose();
  };

  return (
    <>
      <DropDown
        buttonClassName={classes.toolbarItem}
        buttonLabel={buttonLabel}>
        {LAYOUTS.map(({label, value}) => (
          <DropDownItem
            key={value}
            className="item"
            onClick={() => setLayout(value)}>
            <span className="text">{label}</span>
          </DropDownItem>
        ))}
      </DropDown>
      <Button onClick={onClick}>Insert</Button>
    </>
  );
}
