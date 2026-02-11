/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {$createCodeNode} from '@lexical/code';
import {
  // INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import {INSERT_EMBED_COMMAND} from '@lexical/react/LexicalAutoEmbedPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {INSERT_HORIZONTAL_RULE_COMMAND} from '@lexical/react/LexicalHorizontalRuleNode';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {$createHeadingNode, $createQuoteNode} from '@lexical/rich-text';
import {$setBlocksType} from '@lexical/selection';
import {INSERT_TABLE_COMMAND} from '@lexical/table';
import { OPEN_TABLE_SELECTOR_COMMAND } from '@/components/editor/lexicalPlugins/tables/TablesPlugin';
import { SET_BLOCK_TYPE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  TextNode,
} from 'lexical';
import {useCallback, useMemo, useState} from 'react';
import * as ReactDOM from 'react-dom';

import useModal from '../../hooks/useModal';
import { applyBlockTypeChange } from '../ToolbarPlugin/utils';
// import catTypingGif from '../../images/cat-typing.gif';
// import {EmbedConfigs} from '../AutoEmbedPlugin';
import { INSERT_COLLAPSIBLE_SECTION_COMMAND } from '@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionsPlugin';
import {INSERT_DATETIME_COMMAND} from '../DateTimePlugin';
import { OPEN_MATH_EDITOR_COMMAND } from '@/components/editor/lexicalPlugins/math/MathPlugin';
// import {INSERT_EXCALIDRAW_COMMAND} from '../ExcalidrawPlugin';
import {INSERT_IMAGE_COMMAND, InsertImageDialog} from '../ImagesPlugin';
// import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import {INSERT_PAGE_BREAK} from '../PageBreakPlugin';
// import {InsertPollDialog} from '../PollPlugin';

import { TableIcon } from '../../icons/TableIcon';
import { TextParagraphIcon } from '../../icons/TextParagraphIcon';
import { TypeH1Icon } from '../../icons/TypeH1Icon';
import { TypeH2Icon } from '../../icons/TypeH2Icon';
import { TypeH3Icon } from '../../icons/TypeH3Icon';
import { ListOlIcon } from '../../icons/ListOlIcon';
import { ListUlIcon } from '../../icons/ListUlIcon';
// import { SquareCheckIcon } from '../../icons/SquareCheckIcon';
import { ChatSquareQuoteIcon } from '../../icons/ChatSquareQuoteIcon';
import { CodeIcon } from '../../icons/CodeIcon';
import { HorizontalRuleIcon } from '../../icons/HorizontalRuleIcon';
import { ScissorsIcon } from '../../icons/ScissorsIcon';
import { CardChecklistIcon } from '../../icons/CardChecklistIcon';
import { CalendarIcon } from '../../icons/CalendarIcon';
import { PlusSlashMinusIcon } from '../../icons/PlusSlashMinusIcon';
import { FileImageIcon } from '../../icons/FileImageIcon';
import { CaretRightFillIcon } from '../../icons/CaretRightFillIcon';
// import { ThreeColumnsIcon } from '../../icons/ThreeColumnsIcon';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { useCurrentUser } from '@/components/common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { InsertReviewResultsDialog } from '../../embeds/ReviewResultsEmbed/InsertReviewResultsDialog';
import {
  typeaheadPopover,
  typeaheadList,
  typeaheadListItem,
  typeaheadItem,
  typeaheadItemText,
  typeaheadItemIcon,
  componentPickerMenu,
} from '../../styles/typeaheadStyles';

const styles = defineStyles('LexicalComponentPicker', (theme: ThemeType) => ({
  popover: {
    ...typeaheadPopover(theme),
    ...componentPickerMenu(),
  },
  list: typeaheadList(theme),
  listItem: typeaheadListItem(theme),
  item: typeaheadItem(theme),
  text: typeaheadItemText(),
  icon: typeaheadItemIcon(),
}));

const iconStyle = { display: 'flex', width: 20, height: 20, marginRight: 8, opacity: 0.6 };

class ComponentPickerOption extends MenuOption {
  // What shows up in the editor
  title: string;
  // Icon for display
  icon?: JSX.Element;
  // For extra searching.
  keywords: Array<string>;
  // TBD
  keyboardShortcut?: string;
  // What happens when you select this option?
  onSelect: (queryString: string) => void;

  constructor(
    title: string,
    options: {
      icon?: JSX.Element;
      keywords?: Array<string>;
      keyboardShortcut?: string;
      onSelect: (queryString: string) => void;
    },
  ) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
  }
}

function ComponentPickerMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
  classes,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: ComponentPickerOption;
  classes: Record<string, string>;
}) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={classNames(classes.item, classes.listItem, { selected: isSelected })}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      {option.icon}
      <span className={classes.text}>{option.title}</span>
    </li>
  );
}

function getDynamicOptions(editor: LexicalEditor, queryString: string) {
  const options: Array<ComponentPickerOption> = [];

  if (queryString == null) {
    return options;
  }

  const tableMatch = queryString.match(/^([1-9]\d?)(?:x([1-9]\d?)?)?$/);

  if (tableMatch !== null) {
    const rows = tableMatch[1];
    const colOptions = tableMatch[2]
      ? [tableMatch[2]]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String);

    options.push(
      ...colOptions.map(
        (columns) =>
          new ComponentPickerOption(`${rows}x${columns} Table`, {
            icon: <TableIcon style={iconStyle} />,
            keywords: ['table'],
            onSelect: () =>
              editor.dispatchCommand(INSERT_TABLE_COMMAND, {columns, rows}),
          }),
      ),
    );
  }

  return options;
}

type ShowModal = ReturnType<typeof useModal>[1];

const headingIcons = {
  1: TypeH1Icon,
  2: TypeH2Icon,
  3: TypeH3Icon,
} as const;


function getBaseOptions(editor: LexicalEditor, showModal: ShowModal, currentUser: UsersCurrent | null) {
  const isAdminUser = userIsAdmin(currentUser);
  return [
    new ComponentPickerOption('Paragraph', {
      icon: <TextParagraphIcon style={iconStyle} />,
      keywords: ['normal', 'paragraph', 'p', 'text'],
      onSelect: () =>
        applyBlockTypeChange(editor, 'paragraph'),
    }),
    ...([1, 2, 3] as const).map(
      (n) => {
        const HeadingIcon = headingIcons[n];
        return new ComponentPickerOption(`Heading ${n}`, {
          icon: <HeadingIcon style={iconStyle} />,
          keywords: ['heading', 'header', `h${n}`],
          onSelect: () =>
            applyBlockTypeChange(editor, `h${n}`),
        });
      }
    ),
    new ComponentPickerOption('Table', {
      icon: <TableIcon style={iconStyle} />,
      keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
      onSelect: () =>
        editor.dispatchCommand(OPEN_TABLE_SELECTOR_COMMAND, null),
    }),
    new ComponentPickerOption('Numbered List', {
      icon: <ListOlIcon style={iconStyle} />,
      keywords: ['numbered list', 'ordered list', 'ol'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption('Bulleted List', {
      icon: <ListUlIcon style={iconStyle} />,
      keywords: ['bulleted list', 'unordered list', 'ul'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    }),
    // new ComponentPickerOption('Check List', {
    //   icon: <SquareCheckIcon style={iconStyle} />,
    //   keywords: ['check list', 'todo list'],
    //   onSelect: () =>
    //     editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
    // }),
    new ComponentPickerOption('Quote', {
      icon: <ChatSquareQuoteIcon style={iconStyle} />,
      keywords: ['block quote'],
      onSelect: () =>
        applyBlockTypeChange(editor, 'quote'),
    }),
    new ComponentPickerOption('Code', {
      icon: <CodeIcon style={iconStyle} />,
      keywords: ['javascript', 'python', 'js', 'codeblock'],
      onSelect: () =>
        applyBlockTypeChange(editor, 'code'),
    }),
    new ComponentPickerOption('Divider', {
      icon: <HorizontalRuleIcon style={iconStyle} />,
      keywords: ['horizontal rule', 'divider', 'hr'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
    }),
    new ComponentPickerOption('Page Break', {
      icon: <ScissorsIcon style={iconStyle} />,
      keywords: ['page break', 'divider'],
      onSelect: () => editor.dispatchCommand(INSERT_PAGE_BREAK, undefined),
    }),
    // new ComponentPickerOption('Excalidraw', {
    //   icon: <Diagram2Icon style={iconStyle} />,
    //   keywords: ['excalidraw', 'diagram', 'drawing'],
    //   onSelect: () =>
    //     editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, undefined),
    // }),
    // new ComponentPickerOption('Poll', {
    //   icon: <CardChecklistIcon style={iconStyle} />,
    //   keywords: ['poll', 'vote'],
    //   onSelect: () =>
    //     showModal('Insert Poll', (onClose) => (
    //       <InsertPollDialog activeEditor={editor} onClose={onClose} />
    //     )),
    // }),
    // ...EmbedConfigs.map(
    //   (embedConfig) =>
    //     new ComponentPickerOption(`Embed ${embedConfig.contentName}`, {
    //       icon: embedConfig.icon,
    //       keywords: [...embedConfig.keywords, 'embed'],
    //       onSelect: () =>
    //         editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
    //     }),
    // ),
    // new ComponentPickerOption('Date', {
    //   icon: <CalendarIcon style={iconStyle} />,
    //   keywords: ['date', 'calendar', 'time'],
    //   onSelect: () => {
    //     const dateTime = new Date();
    //     dateTime.setHours(0, 0, 0, 0); // Set time to midnight
    //     editor.dispatchCommand(INSERT_DATETIME_COMMAND, {dateTime});
    //   },
    // }),
    // new ComponentPickerOption('Today', {
    //   icon: <CalendarIcon style={iconStyle} />,
    //   keywords: ['date', 'calendar', 'time', 'today'],
    //   onSelect: () => {
    //     const dateTime = new Date();
    //     dateTime.setHours(0, 0, 0, 0); // Set time to midnight
    //     editor.dispatchCommand(INSERT_DATETIME_COMMAND, {dateTime});
    //   },
    // }),
    // new ComponentPickerOption('Tomorrow', {
    //   icon: <CalendarIcon style={iconStyle} />,
    //   keywords: ['date', 'calendar', 'time', 'tomorrow'],
    //   onSelect: () => {
    //     const dateTime = new Date();
    //     dateTime.setDate(dateTime.getDate() + 1);
    //     dateTime.setHours(0, 0, 0, 0); // Set time to midnight
    //     editor.dispatchCommand(INSERT_DATETIME_COMMAND, {dateTime});
    //   },
    // }),
    // new ComponentPickerOption('Yesterday', {
    //   icon: <CalendarIcon style={iconStyle} />,
    //   keywords: ['date', 'calendar', 'time', 'yesterday'],
    //   onSelect: () => {
    //     const dateTime = new Date();
    //     dateTime.setDate(dateTime.getDate() - 1);
    //     dateTime.setHours(0, 0, 0, 0); // Set time to midnight
    //     editor.dispatchCommand(INSERT_DATETIME_COMMAND, {dateTime});
    //   },
    // }),
    new ComponentPickerOption('Equation', {
      icon: <PlusSlashMinusIcon style={iconStyle} />,
      keywords: ['equation', 'latex', 'math'],
      onSelect: () =>
        editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: true }),
    }),
    new ComponentPickerOption('Display Equation', {
      icon: <PlusSlashMinusIcon style={iconStyle} />,
      keywords: ['display', 'equation', 'latex', 'math', 'block'],
      onSelect: () =>
        editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: false }),
    }),
    // new ComponentPickerOption('GIF', {
    //   icon: <FiletypeGifIcon style={iconStyle} />,
    //   keywords: ['gif', 'animate', 'image', 'file'],
    //   onSelect: () =>
    //     editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
    //       altText: 'Cat typing on a laptop',
    //       src: catTypingGif,
    //     }),
    // }),
    new ComponentPickerOption('Image', {
      icon: <FileImageIcon style={iconStyle} />,
      keywords: ['image', 'photo', 'picture', 'file'],
      onSelect: () =>
        showModal('Insert Image', (onClose) => (
          <InsertImageDialog activeEditor={editor} onClose={onClose} />
        )),
    }),
    new ComponentPickerOption('Collapsible', {
      icon: <CaretRightFillIcon style={iconStyle} />,
      keywords: ['collapse', 'collapsible', 'toggle'],
      onSelect: () =>
        editor.dispatchCommand(INSERT_COLLAPSIBLE_SECTION_COMMAND, undefined),
    }),
    // new ComponentPickerOption('Columns Layout', {
    //   icon: <ThreeColumnsIcon style={iconStyle} />,
    //   keywords: ['columns', 'layout', 'grid'],
    //   onSelect: () =>
    //     showModal('Insert Columns Layout', (onClose) => (
    //       <InsertLayoutDialog activeEditor={editor} onClose={onClose} />
    //     )),
    // }),
    ...(isAdminUser ? [
      new ComponentPickerOption('Review Results Table', {
        icon: <CardChecklistIcon style={iconStyle} />,
        keywords: ['review', 'results', 'annual', 'voting', 'table'],
        onSelect: () =>
          showModal('Insert Review Results Table', (onClose) => (
            <InsertReviewResultsDialog activeEditor={editor} onClose={onClose} />
          )),
      }),
    ] : []),
  ];
}

export default function ComponentPickerMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useModal();
  const [queryString, setQueryString] = useState<string | null>(null);
  const currentUser = useCurrentUser();

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    allowWhitespace: true,
    minLength: 0,
  });

  const options = useMemo(() => {
    const baseOptions = getBaseOptions(editor, showModal, currentUser);

    if (!queryString) {
      return baseOptions;
    }

    const regex = new RegExp(queryString, 'i');

    return [
      ...getDynamicOptions(editor, queryString),
      ...baseOptions.filter(
        (option) =>
          regex.test(option.title) ||
          option.keywords.some((keyword) => regex.test(keyword)),
      ),
    ];
  }, [editor, queryString, showModal, currentUser]);

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor],
  );

  const classes = useStyles(styles);

  return (
    <>
      {modal}
      <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(
          anchorElementRef,
          {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex},
        ) =>
          anchorElementRef.current && options.length
            ? ReactDOM.createPortal(
                <div className={classes.popover}>
                  <ul className={classes.list}>
                    {options.map((option, i: number) => (
                      <ComponentPickerMenuItem
                        index={i}
                        isSelected={selectedIndex === i}
                        onClick={() => {
                          setHighlightedIndex(i);
                          selectOptionAndCleanUp(option);
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(i);
                        }}
                        key={option.key}
                        option={option}
                        classes={classes}
                      />
                    ))}
                  </ul>
                </div>,
                anchorElementRef.current,
              )
            : null
        }
      />
    </>
  );
}
