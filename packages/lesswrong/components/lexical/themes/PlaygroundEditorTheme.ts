/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {EditorThemeClasses} from 'lexical';

import './PlaygroundEditorTheme.css';

const theme: EditorThemeClasses = {
  // autocomplete: 'PlaygroundEditorTheme__autocomplete',
  // blockCursor: 'PlaygroundEditorTheme__blockCursor',
  // characterLimit: 'PlaygroundEditorTheme__characterLimit',
  code: 'code-block',
  codeHighlight: {
    atrule: 'code-token-attr',
    attr: 'code-token-attr',
    boolean: 'code-token-property',
    builtin: 'code-token-selector',
    cdata: 'code-token-comment',
    char: 'code-token-selector',
    class: 'code-token-function',
    'class-name': 'code-token-function',
    comment: 'code-token-comment',
    constant: 'code-token-property',
    deleted: 'code-token-deleted',
    doctype: 'code-token-comment',
    entity: 'code-token-operator',
    function: 'code-token-function',
    important: 'code-token-variable',
    inserted: 'code-token-inserted',
    keyword: 'code-token-attr',
    namespace: 'code-token-variable',
    number: 'code-token-property',
    operator: 'code-token-operator',
    prolog: 'code-token-comment',
    property: 'code-token-property',
    punctuation: 'code-token-punctuation',
    regex: 'code-token-variable',
    selector: 'code-token-selector',
    string: 'code-token-selector',
    symbol: 'code-token-property',
    tag: 'code-token-property',
    unchanged: 'code-token-unchanged',
    url: 'code-token-operator',
    variable: 'code-token-variable',
  },
  // embedBlock: {
  //   base: 'PlaygroundEditorTheme__embedBlock',
  //   focus: 'PlaygroundEditorTheme__embedBlockFocus',
  // },
  // hashtag: 'PlaygroundEditorTheme__hashtag',
  // heading: {
  //   h1: 'PlaygroundEditorTheme__h1',
  //   h2: 'PlaygroundEditorTheme__h2',
  //   h3: 'PlaygroundEditorTheme__h3',
  //   h4: 'PlaygroundEditorTheme__h4',
  //   h5: 'PlaygroundEditorTheme__h5',
  //   h6: 'PlaygroundEditorTheme__h6',
  // },
  // hr: 'PlaygroundEditorTheme__hr',
  // hrSelected: 'PlaygroundEditorTheme__hrSelected',
  // image: 'editor-image',
  // indent: 'PlaygroundEditorTheme__indent',
  // layoutContainer: 'PlaygroundEditorTheme__layoutContainer',
  // layoutItem: 'PlaygroundEditorTheme__layoutItem',
  // link: 'PlaygroundEditorTheme__link',
  // list: {
  //   checklist: 'PlaygroundEditorTheme__checklist',
  //   listitem: 'PlaygroundEditorTheme__listItem',
  //   listitemChecked: 'PlaygroundEditorTheme__listItemChecked',
  //   listitemUnchecked: 'PlaygroundEditorTheme__listItemUnchecked',
  //   nested: {
  //     listitem: 'PlaygroundEditorTheme__nestedListItem',
  //   },
  //   olDepth: [
  //     'PlaygroundEditorTheme__ol1',
  //     'PlaygroundEditorTheme__ol2',
  //     'PlaygroundEditorTheme__ol3',
  //     'PlaygroundEditorTheme__ol4',
  //     'PlaygroundEditorTheme__ol5',
  //   ],
  //   ul: 'PlaygroundEditorTheme__ul',
  // },
  mark: 'editor-mark',
  markOverlap: 'editor-mark-overlap',
  // quote: 'PlaygroundEditorTheme__quote',
  // specialText: 'PlaygroundEditorTheme__specialText',
  // tab: 'PlaygroundEditorTheme__tabNode',
  table: 'editor-table',
  tableAddColumns: 'table-add-columns',
  tableAddRows: 'table-add-rows',
  tableAlignment: {
    center: 'table-alignment-center',
    right: 'table-alignment-right',
  },
  tableCell: 'table-cell',
  tableCellActionButton: 'table-cell-action-button',
  tableCellActionButtonContainer:
    'table-cell-action-button-container',
  tableCellHeader: 'table-cell-header',
  tableCellResizer: 'table-cell-resizer',
  tableCellSelected: 'table-cell-selected',
  tableFrozenColumn: 'table-frozen-column',
  tableFrozenRow: 'table-frozen-row',
  tableRowStriping: 'table-row-striping',
  tableScrollableWrapper: 'table-scrollable-wrapper',
  tableSelected: 'table-selected',
  tableSelection: 'table-selection',
  // text: {
  //   bold: 'PlaygroundEditorTheme__textBold',
  //   capitalize: 'PlaygroundEditorTheme__textCapitalize',
  //   code: 'PlaygroundEditorTheme__textCode',
  //   highlight: 'PlaygroundEditorTheme__textHighlight',
  //   italic: 'PlaygroundEditorTheme__textItalic',
  //   lowercase: 'PlaygroundEditorTheme__textLowercase',
  //   strikethrough: 'PlaygroundEditorTheme__textStrikethrough',
  //   subscript: 'PlaygroundEditorTheme__textSubscript',
  //   superscript: 'PlaygroundEditorTheme__textSuperscript',
  //   underline: 'PlaygroundEditorTheme__textUnderline',
  //   underlineStrikethrough: 'PlaygroundEditorTheme__textUnderlineStrikethrough',
  //   uppercase: 'PlaygroundEditorTheme__textUppercase',
  // },
};

export default theme;
