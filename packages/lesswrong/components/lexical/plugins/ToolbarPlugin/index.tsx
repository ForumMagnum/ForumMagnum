/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {type JSX} from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

import {
  $isCodeNode,
  getCodeLanguageOptions as getCodeLanguageOptionsPrism,
  normalizeCodeLanguage as normalizeCodeLanguagePrism,
} from '@lexical/code';
import { INSERT_CODE_BLOCK_COMMAND } from '@/components/editor/lexicalPlugins/codeBlock/CodeBlockPlugin';

// Icon imports
import { ArrowCounterclockwiseIcon } from '../../icons/ArrowCounterclockwiseIcon';
import { ArrowClockwiseIcon } from '../../icons/ArrowClockwiseIcon';
import { TextParagraphIcon } from '../../icons/TextParagraphIcon';
import { TypeH1Icon } from '../../icons/TypeH1Icon';
import { TypeH2Icon } from '../../icons/TypeH2Icon';
import { TypeH3Icon } from '../../icons/TypeH3Icon';
import { ListOlIcon } from '../../icons/ListOlIcon';
import { ListUlIcon } from '../../icons/ListUlIcon';
import { SquareCheckIcon } from '../../icons/SquareCheckIcon';
import { ChatSquareQuoteIcon } from '../../icons/ChatSquareQuoteIcon';
import { CodeIcon } from '../../icons/CodeIcon';
import { TextLeftIcon } from '../../icons/TextLeftIcon';
import { TextCenterIcon } from '../../icons/TextCenterIcon';
import { TextRightIcon } from '../../icons/TextRightIcon';
import { JustifyIcon } from '../../icons/JustifyIcon';
import { IndentIcon } from '../../icons/IndentIcon';
import { OutdentIcon } from '../../icons/OutdentIcon';
import { TypeBoldIcon } from '../../icons/TypeBoldIcon';
import { TypeItalicIcon } from '../../icons/TypeItalicIcon';
import { TypeUnderlineIcon } from '../../icons/TypeUnderlineIcon';
import { LinkIcon } from '../../icons/LinkIcon';
import { FontColorIcon } from '../../icons/FontColorIcon';
import { BgColorIcon } from '../../icons/BgColorIcon';
import { DropdownMoreIcon } from '../../icons/DropdownMoreIcon';
import { TypeLowercaseIcon } from '../../icons/TypeLowercaseIcon';
import { TypeUppercaseIcon } from '../../icons/TypeUppercaseIcon';
import { TypeCapitalizeIcon } from '../../icons/TypeCapitalizeIcon';
import { TypeStrikethroughIcon } from '../../icons/TypeStrikethroughIcon';
import { TypeSubscriptIcon } from '../../icons/TypeSubscriptIcon';
import { TypeSuperscriptIcon } from '../../icons/TypeSuperscriptIcon';
import { HighlighterIcon } from '../../icons/HighlighterIcon';
import { TrashIcon } from '../../icons/TrashIcon';
import { PlusIcon } from '../../icons/PlusIcon';
import { HorizontalRuleIcon } from '../../icons/HorizontalRuleIcon';
import { ScissorsIcon } from '../../icons/ScissorsIcon';
import { FileImageIcon } from '../../icons/FileImageIcon';
import { TableIcon } from '../../icons/TableIcon';
import { CardChecklistIcon } from '../../icons/CardChecklistIcon';
import { ThreeColumnsIcon } from '../../icons/ThreeColumnsIcon';
import { PlusSlashMinusIcon } from '../../icons/PlusSlashMinusIcon';
import { StickyIcon } from '../../icons/StickyIcon';
import { CaretRightFillIcon } from '../../icons/CaretRightFillIcon';
import { CalendarIcon } from '../../icons/CalendarIcon';
import { FontFamilyIcon } from '../../icons/FontFamilyIcon';
import { PencilFillIcon } from '../../icons/PencilFillIcon';
// import {
//   getCodeLanguageOptions as getCodeLanguageOptionsShiki,
//   getCodeThemeOptions as getCodeThemeOptionsShiki,
//   normalizeCodeLanguage as normalizeCodeLanguageShiki,
// } from '@lexical/code-shiki';
import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {$isListNode, ListNode} from '@lexical/list';
import {INSERT_EMBED_COMMAND} from '@lexical/react/LexicalAutoEmbedPlugin';
import {INSERT_HORIZONTAL_RULE_COMMAND} from '@lexical/react/LexicalHorizontalRuleNode';
import {$isHeadingNode} from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from '@lexical/selection';
import {$isTableNode, $isTableSelection} from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  IS_APPLE,
  mergeRegister,
} from '@lexical/utils';
import {
  $addUpdateTag,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  CommandPayloadType,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  HISTORIC_TAG,
  INDENT_CONTENT_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SELECTION_FOCUS_TAG,
  TextFormatType,
  UNDO_COMMAND,
} from 'lexical';
import {Dispatch, useCallback, useEffect, useState} from 'react';

import {useSettings} from '../../context/SettingsContext';
import {
  blockTypeToBlockName,
  useToolbarState,
} from '../../context/ToolbarContext';
import useModal from '../../hooks/useModal';
import {$createStickyNode} from '../../nodes/StickyNode';
import DropDown, {
  DropDownItem,
  DropDownItemIconTextContainer,
  DropDownItemShortcut,
  DropDownItemText,
} from '../../ui/DropDown';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import {isKeyboardInput} from '../../utils/focusUtils';
import {getSelectedNode} from '../../utils/getSelectedNode';
import {sanitizeUrl} from '../../utils/url';
import {EmbedConfigs} from '../AutoEmbedPlugin';
import {INSERT_COLLAPSIBLE_COMMAND} from '../CollapsiblePlugin';
import {INSERT_DATETIME_COMMAND} from '../DateTimePlugin';
import { OPEN_MATH_EDITOR_COMMAND } from '@/components/editor/lexicalPlugins/math/MathPlugin';
// import {INSERT_EXCALIDRAW_COMMAND} from '../ExcalidrawPlugin';
import {
  INSERT_IMAGE_COMMAND,
  InsertImageDialog,
  InsertImagePayload,
} from '../ImagesPlugin';
import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import {INSERT_PAGE_BREAK} from '../PageBreakPlugin';
import {InsertPollDialog} from '../PollPlugin';
import {SHORTCUTS} from '../ShortcutsPlugin/shortcuts';
import {InsertTableDialog} from '../TablePlugin';
import FontSize, {parseFontSizeForToolbar} from './fontSize';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from './utils';

import {
  toolbarItem,
  formatIcon,
} from '../../styles/toolbarStyles';

const styles = defineStyles('LexicalToolbarPlugin', (theme: ThemeType) => ({
  toolbar: {
    display: 'flex',
    marginBottom: 1,
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 4,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    verticalAlign: 'middle',
    overflow: 'auto',
    height: 36,
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
    overflowY: 'hidden' as const,
  },
  toolbarItem: toolbarItem(theme),
  toolbarItemSpaced: {
    ...toolbarItem(theme),
    marginRight: 2,
  },
  toolbarItemActive: {
    backgroundColor: theme.palette.greyAlpha(0.1),
    '& i': {
      opacity: 1,
    },
  },
  toolbarItemText: {
    display: 'flex',
    lineHeight: '20px',
    verticalAlign: 'middle',
    fontSize: 14,
    color: theme.palette.grey[600],
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    height: 20,
    textAlign: 'left' as const,
    paddingRight: 10,
  },
  toolbarItemIcon: {
    display: 'flex',
    width: 20,
    height: 20,
    userSelect: 'none' as const,
    marginRight: 8,
    lineHeight: '16px',
    backgroundSize: 'contain',
  },
  formatIcon: formatIcon(),
  toolbarDivider: {
    width: 1,
    backgroundColor: theme.palette.grey[200],
    margin: '0 4px',
  },
  codeLanguage: {
    ...toolbarItem(theme),
    width: 150,
  },
  blockControls: {
    ...toolbarItem(theme),
    display: 'flex',
    alignItems: 'center',
  },
  blockControlsDropdownText: {
    width: '7em',
    textAlign: 'left' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    display: 'inline-block',
  },
  blockTypeIcon: {
    display: 'flex',
    width: 20,
    height: 20,
    marginRight: 8,
    backgroundSize: 'contain',
  },
  dropdownIcon: {
    display: 'flex',
    width: 20,
    height: 20,
    marginRight: 12,
    backgroundSize: 'contain',
  },
  activeIcon: {
    opacity: 1,
  },
  disabledIcon: {
    opacity: 0.2,
  },
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rootTypeToRootName = {
  root: 'Root',
  table: 'Table',
};

const CODE_LANGUAGE_OPTIONS_PRISM: [string, string][] =
  getCodeLanguageOptionsPrism().filter((option) =>
    [
      'c',
      'clike',
      'cpp',
      'css',
      'html',
      'java',
      'js',
      'javascript',
      'markdown',
      'objc',
      'objective-c',
      'plain',
      'powershell',
      'py',
      'python',
      'rust',
      'sql',
      'swift',
      'typescript',
      'xml',
    ].includes(option[0]),
  );

// const CODE_LANGUAGE_OPTIONS_SHIKI: [string, string][] =
//   getCodeLanguageOptionsShiki().filter((option) =>
//     [
//       'c',
//       'clike',
//       'cpp',
//       'css',
//       'html',
//       'java',
//       'js',
//       'javascript',
//       'markdown',
//       'objc',
//       'objective-c',
//       'plain',
//       'powershell',
//       'py',
//       'python',
//       'rust',
//       'sql',
//       'typescript',
//       'xml',
//     ].includes(option[0]),
//   );

// const CODE_THEME_OPTIONS_SHIKI: [string, string][] =
//   getCodeThemeOptionsShiki().filter((option) =>
//     [
//       'catppuccin-latte',
//       'everforest-light',
//       'github-light',
//       'gruvbox-light-medium',
//       'kanagawa-lotus',
//       'dark-plus',
//       'light-plus',
//       'material-theme-lighter',
//       'min-light',
//       'one-light',
//       'rose-pine-dawn',
//       'slack-ochin',
//       'snazzy-light',
//       'solarized-light',
//       'vitesse-light',
//     ].includes(option[0]),
//   );

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    iconRTL: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    iconRTL: 'center-align',
    name: 'Center Align',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'End Align',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Justify Align',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Left Align',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Right Align',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Start Align',
  },
};

function BlockFormatDropDown({
  editor,
  blockType,
  rootType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  const classes = useStyles(styles);
  
  // Map block types to their icons
  const blockTypeIcons: Record<string, JSX.Element> = {
    paragraph: <TextParagraphIcon className={classes.blockTypeIcon} />,
    h1: <TypeH1Icon className={classes.blockTypeIcon} />,
    h2: <TypeH2Icon className={classes.blockTypeIcon} />,
    h3: <TypeH3Icon className={classes.blockTypeIcon} />,
    h4: <TypeH1Icon className={classes.blockTypeIcon} />,
    h5: <TypeH1Icon className={classes.blockTypeIcon} />,
    h6: <TypeH1Icon className={classes.blockTypeIcon} />,
    number: <ListOlIcon className={classes.blockTypeIcon} />,
    bullet: <ListUlIcon className={classes.blockTypeIcon} />,
    check: <SquareCheckIcon className={classes.blockTypeIcon} />,
    quote: <ChatSquareQuoteIcon className={classes.blockTypeIcon} />,
    code: <CodeIcon className={classes.blockTypeIcon} />,
  };
  
  return (
    <DropDown
      disabled={disabled}
      buttonClassName={classes.blockControls}
      buttonIcon={blockTypeIcons[blockType]}
      buttonLabel={blockTypeToBlockName[blockType]}
      buttonAriaLabel="Formatting options for text style">
      <DropDownItem
        wide
        active={blockType === 'paragraph'}
        onClick={() => formatParagraph(editor)}>
        <DropDownItemIconTextContainer>
          <TextParagraphIcon className={classes.dropdownIcon} />
          <DropDownItemText>Normal</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.NORMAL}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'h1'}
        onClick={() => formatHeading(editor, blockType, 'h1')}>
        <DropDownItemIconTextContainer>
          <TypeH1Icon className={classes.dropdownIcon} />
          <DropDownItemText>Heading 1</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.HEADING1}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'h2'}
        onClick={() => formatHeading(editor, blockType, 'h2')}>
        <DropDownItemIconTextContainer>
          <TypeH2Icon className={classes.dropdownIcon} />
          <DropDownItemText>Heading 2</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.HEADING2}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'h3'}
        onClick={() => formatHeading(editor, blockType, 'h3')}>
        <DropDownItemIconTextContainer>
          <TypeH3Icon className={classes.dropdownIcon} />
          <DropDownItemText>Heading 3</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.HEADING3}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'number'}
        onClick={() => formatNumberedList(editor, blockType)}>
        <DropDownItemIconTextContainer>
          <ListOlIcon className={classes.dropdownIcon} />
          <DropDownItemText>Numbered List</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.NUMBERED_LIST}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'bullet'}
        onClick={() => formatBulletList(editor, blockType)}>
        <DropDownItemIconTextContainer>
          <ListUlIcon className={classes.dropdownIcon} />
          <DropDownItemText>Bullet List</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.BULLET_LIST}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'check'}
        onClick={() => formatCheckList(editor, blockType)}>
        <DropDownItemIconTextContainer>
          <SquareCheckIcon className={classes.dropdownIcon} />
          <DropDownItemText>Check List</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.CHECK_LIST}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'quote'}
        onClick={() => formatQuote(editor, blockType)}>
        <DropDownItemIconTextContainer>
          <ChatSquareQuoteIcon className={classes.dropdownIcon} />
          <DropDownItemText>Quote</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.QUOTE}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        wide
        active={blockType === 'code'}
        onClick={() => formatCode(editor, blockType)}>
        <DropDownItemIconTextContainer>
          <CodeIcon className={classes.dropdownIcon} />
          <DropDownItemText>Code Block</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.CODE_BLOCK}</DropDownItemShortcut>
      </DropDownItem>
    </DropDown>
  );
}

function Divider(): JSX.Element {
  const classes = useStyles(styles);
  return <div className={classes.toolbarDivider} />;
}

function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const classes = useStyles(styles);
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const buttonAriaLabel =
    style === 'font-family'
      ? 'Formatting options for font family'
      : 'Formatting options for font size';

  return (
    <DropDown
      disabled={disabled}
      buttonClassName={classNames(classes.toolbarItem, style)}
      buttonLabel={value}
      buttonIcon={style === 'font-family' ? <FontFamilyIcon className={classes.blockTypeIcon} /> : undefined}
      buttonAriaLabel={buttonAriaLabel}>
      {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(
        ([option, text]) => (
          <DropDownItem
            active={value === option}
            onClick={() => handleClick(option)}
            key={option}>
            <DropDownItemText>{text}</DropDownItemText>
          </DropDownItem>
        ),
      )}
    </DropDown>
  );
}

function ElementFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  isRTL: boolean;
  disabled: boolean;
}) {
  const classes = useStyles(styles);
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  // Map alignment names to icons
  const alignmentIcons: Record<string, JSX.Element> = {
    'left-align': <TextLeftIcon className={classes.blockTypeIcon} />,
    'center-align': <TextCenterIcon className={classes.blockTypeIcon} />,
    'right-align': <TextRightIcon className={classes.blockTypeIcon} />,
    'justify-align': <JustifyIcon className={classes.blockTypeIcon} />,
  };

  const currentIcon = alignmentIcons[isRTL ? formatOption.iconRTL : formatOption.icon];

  return (
    <DropDown
      disabled={disabled}
      buttonLabel={formatOption.name}
      buttonIcon={currentIcon}
      buttonClassName={classNames(classes.toolbarItemSpaced, 'alignment')}
      buttonAriaLabel="Formatting options for text alignment">
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        wide>
        <DropDownItemIconTextContainer>
          <TextLeftIcon className={classes.dropdownIcon} />
          <DropDownItemText>Left Align</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.LEFT_ALIGN}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        wide>
        <DropDownItemIconTextContainer>
          <TextCenterIcon className={classes.dropdownIcon} />
          <DropDownItemText>Center Align</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.CENTER_ALIGN}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        wide>
        <DropDownItemIconTextContainer>
          <TextRightIcon className={classes.dropdownIcon} />
          <DropDownItemText>Right Align</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.RIGHT_ALIGN}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        wide>
        <DropDownItemIconTextContainer>
          <JustifyIcon className={classes.dropdownIcon} />
          <DropDownItemText>Justify Align</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.JUSTIFY_ALIGN}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start');
        }}
        wide>
        {isRTL ? (
          <TextRightIcon className={classes.dropdownIcon} />
        ) : (
          <TextLeftIcon className={classes.dropdownIcon} />
        )}
        <DropDownItemText>Start Align</DropDownItemText>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end');
        }}
        wide>
        {isRTL ? (
          <TextLeftIcon className={classes.dropdownIcon} />
        ) : (
          <TextRightIcon className={classes.dropdownIcon} />
        )}
        <DropDownItemText>End Align</DropDownItemText>
      </DropDownItem>
      <Divider />
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}
        wide>
        <DropDownItemIconTextContainer>
          {isRTL ? (
            <IndentIcon className={classes.dropdownIcon} />
          ) : (
            <OutdentIcon className={classes.dropdownIcon} />
          )}
          <DropDownItemText>Outdent</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.OUTDENT}</DropDownItemShortcut>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }}
        wide>
        <DropDownItemIconTextContainer>
          {isRTL ? (
            <OutdentIcon className={classes.dropdownIcon} />
          ) : (
            <IndentIcon className={classes.dropdownIcon} />
          )}
          <DropDownItemText>Indent</DropDownItemText>
        </DropDownItemIconTextContainer>
        <DropDownItemShortcut>{SHORTCUTS.INDENT}</DropDownItemShortcut>
      </DropDownItem>
    </DropDown>
  );
}

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}

export default function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element {
  const classes = useStyles(styles);
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isSuggestionMode, setIsSuggestionMode] = useState(false);
  const {toolbarState, updateToolbarState} = useToolbarState();

  const dispatchToolbarCommand = <T extends LexicalCommand<unknown>>(
    command: T,
    payload: CommandPayloadType<T> | undefined = undefined,
    skipRefocus: boolean = false,
  ) => {
    activeEditor.update(() => {
      if (skipRefocus) {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
      }

      // Re-assert on Type so that payload can have a default param
      activeEditor.dispatchCommand(command, payload as CommandPayloadType<T>);
    });
  };

  const dispatchFormatTextCommand = (
    payload: TextFormatType,
    skipRefocus: boolean = false,
  ) => dispatchToolbarCommand(FORMAT_TEXT_COMMAND, payload, skipRefocus);

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();

      if (type in blockTypeToBlockName) {
        updateToolbarState(
          'blockType',
          type as keyof typeof blockTypeToBlockName,
        );
      }
    },
    [updateToolbarState],
  );

  const {
    settings: {isCodeHighlighted, isCodeShiki},
  } = useSettings();

  const $handleCodeNode = useCallback(
    (element: LexicalNode) => {
      if ($isCodeNode(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          'codeLanguage',
          language
            ? (isCodeHighlighted &&
                // (isCodeShiki
                //   ? normalizeCodeLanguageShiki(language)
                //   : normalizeCodeLanguagePrism(language)
                // )
                normalizeCodeLanguagePrism(language)
              ) ||
                language
            : '',
        );
        const theme = element.getTheme();
        updateToolbarState('codeTheme', theme || '');
        return;
      }
    },
    [updateToolbarState, isCodeHighlighted],
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains(
            'image-caption-container',
          ),
        );
      } else {
        updateToolbarState('isImageCaption', false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();

          updateToolbarState('blockType', type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }

      // Handle buttons
      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState(
        'isStrikethrough',
        selection.hasFormat('strikethrough'),
      );
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(
          selectedNode,
          ListNode,
        );
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState('blockType', type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          // Update elementFormat for node selection (e.g., images)
          if ($isElementNode(selectedElement)) {
            updateToolbarState(
              'elementFormat',
              selectedElement.getFormatType(),
            );
          }
        }
      }
    }
  }, [
    activeEditor,
    editor,
    updateToolbarState,
    $handleHeadingNode,
    $handleCodeNode,
  ]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      {editor: activeEditor},
    );
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({editorState}) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          {editor: activeEditor},
        );
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  const applyStyleText = useCallback(
    (
      styles: Record<string, string>,
      skipHistoryStack?: boolean,
      skipRefocus: boolean = false,
    ) => {
      activeEditor.update(
        () => {
          if (skipRefocus) {
            $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          }
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? {tag: HISTORIC_TAG} : {},
      );
    },
    [activeEditor],
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText({color: value}, skipHistoryStack, skipRefocus);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText(
        {'background-color': value},
        skipHistoryStack,
        skipRefocus,
      );
    },
    [applyStyleText],
  );

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl('https://'),
      );
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );
  const onCodeThemeSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setTheme(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );
  const insertGifOnClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  return (
    <div className={classes.toolbar}>
      {/* <button
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(UNDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
        type="button"
        className={classes.toolbarItemSpaced}
        aria-label="Undo">
        <ArrowCounterclockwiseIcon className={classes.formatIcon} />
      </button>
      <button
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(REDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)'}
        type="button"
        className={classes.toolbarItem}
        aria-label="Redo">
        <ArrowClockwiseIcon className={classes.formatIcon} />
      </button>
      <Divider /> */}
      {toolbarState.blockType in blockTypeToBlockName &&
        activeEditor === editor && (
          <>
            <BlockFormatDropDown
              disabled={!isEditable}
              blockType={toolbarState.blockType}
              rootType={toolbarState.rootType}
              editor={activeEditor}
            />
            <Divider />
          </>
        )}
      {toolbarState.blockType === 'code' && isCodeHighlighted ? (
        <>
          {!isCodeShiki && (
            <DropDown
              disabled={!isEditable}
              buttonClassName={classes.codeLanguage}
              buttonLabel={
                (CODE_LANGUAGE_OPTIONS_PRISM.find(
                  (opt) =>
                    opt[0] ===
                    normalizeCodeLanguagePrism(toolbarState.codeLanguage),
                ) || ['', ''])[1]
              }
              buttonAriaLabel="Select language">
              {CODE_LANGUAGE_OPTIONS_PRISM.map(([value, name]) => {
                return (
                  <DropDownItem
                    active={value === toolbarState.codeLanguage}
                    onClick={() => onCodeLanguageSelect(value)}
                    key={value}>
                    <DropDownItemText>{name}</DropDownItemText>
                  </DropDownItem>
                );
              })}
            </DropDown>
          )}
          {/* {isCodeShiki && (
            <>
              <DropDown
                disabled={!isEditable}
                buttonClassName="toolbar-item code-language"
                buttonLabel={
                  (CODE_LANGUAGE_OPTIONS_SHIKI.find(
                    (opt) =>
                      opt[0] ===
                      normalizeCodeLanguageShiki(toolbarState.codeLanguage),
                  ) || ['', ''])[1]
                }
                buttonAriaLabel="Select language">
                {CODE_LANGUAGE_OPTIONS_SHIKI.map(([value, name]) => {
                  return (
                    <DropDownItem
                      className={`item ${dropDownActiveClass(
                        value === toolbarState.codeLanguage,
                      )}`}
                      onClick={() => onCodeLanguageSelect(value)}
                      key={value}>
                      <span className="text">{name}</span>
                    </DropDownItem>
                  );
                })}
              </DropDown>
              <DropDown
                disabled={!isEditable}
                buttonClassName="toolbar-item code-language"
                buttonLabel={
                  (CODE_THEME_OPTIONS_SHIKI.find(
                    (opt) => opt[0] === toolbarState.codeTheme,
                  ) || ['', ''])[1]
                }
                buttonAriaLabel="Select theme">
                {CODE_THEME_OPTIONS_SHIKI.map(([value, name]) => {
                  return (
                    <DropDownItem
                      className={`item ${dropDownActiveClass(
                        value === toolbarState.codeTheme,
                      )}`}
                      onClick={() => onCodeThemeSelect(value)}
                      key={value}>
                      <span className="text">{name}</span>
                    </DropDownItem>
                  );
                })}
              </DropDown>
            </>
          )} */}
        </>
      ) : (
        <>
          {/* <FontDropDown
            disabled={!isEditable}
            style={'font-family'}
            value={toolbarState.fontFamily}
            editor={activeEditor}
          />
          <Divider />
          <FontSize
            selectionFontSize={parseFontSizeForToolbar(
              toolbarState.fontSize,
            ).slice(0, -2)}
            editor={activeEditor}
            disabled={!isEditable}
          />
          <Divider /> */}
          <button
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('bold', isKeyboardInput(e))
            }
            className={classNames(classes.toolbarItemSpaced, { [classes.toolbarItemActive]: toolbarState.isBold })}
            title={`Bold (${SHORTCUTS.BOLD})`}
            type="button"
            aria-label={`Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`}>
            <TypeBoldIcon className={classNames(classes.formatIcon, { [classes.activeIcon]: toolbarState.isBold })} />
          </button>
          <button
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('italic', isKeyboardInput(e))
            }
            className={classNames(classes.toolbarItemSpaced, { [classes.toolbarItemActive]: toolbarState.isItalic })}
            title={`Italic (${SHORTCUTS.ITALIC})`}
            type="button"
            aria-label={`Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`}>
            <TypeItalicIcon className={classNames(classes.formatIcon, { [classes.activeIcon]: toolbarState.isItalic })} />
          </button>
          <button
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('underline', isKeyboardInput(e))
            }
            className={classNames(classes.toolbarItemSpaced, { [classes.toolbarItemActive]: toolbarState.isUnderline })}
            title={`Underline (${SHORTCUTS.UNDERLINE})`}
            type="button"
            aria-label={`Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`}>
            <TypeUnderlineIcon className={classNames(classes.formatIcon, { [classes.activeIcon]: toolbarState.isUnderline })} />
          </button>
          {canViewerSeeInsertCodeButton && (
            <button
              disabled={!isEditable}
              onClick={() =>
                activeEditor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined)
              }
              className={classNames(classes.toolbarItemSpaced, { [classes.toolbarItemActive]: toolbarState.isCode })}
              title={`Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`}
              type="button"
              aria-label="Insert code block">
              <CodeIcon className={classNames(classes.formatIcon, { [classes.activeIcon]: toolbarState.isCode })} />
            </button>
          )}
          <button
            disabled={!isEditable}
            onClick={insertLink}
            className={classNames(classes.toolbarItemSpaced, { [classes.toolbarItemActive]: toolbarState.isLink })}
            aria-label="Insert link"
            title={`Insert link (${SHORTCUTS.INSERT_LINK})`}
            type="button">
            <LinkIcon className={classNames(classes.formatIcon, { [classes.activeIcon]: toolbarState.isLink })} />
          </button>
          {/* <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName={classNames(classes.toolbarItem, 'color-picker')}
            buttonAriaLabel="Formatting text color"
            buttonIcon={<FontColorIcon className={classes.blockTypeIcon} />}
            color={toolbarState.fontColor}
            onChange={onFontColorSelect}
            title="text color"
          />
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName={classNames(classes.toolbarItem, 'color-picker')}
            buttonAriaLabel="Formatting background color"
            buttonIcon={<BgColorIcon className={classes.blockTypeIcon} />}
            color={toolbarState.bgColor}
            onChange={onBgColorSelect}
            title="bg color"
          /> */}
          <DropDown
            disabled={!isEditable}
            buttonClassName={classes.toolbarItemSpaced}
            buttonLabel=""
            buttonAriaLabel="Formatting options for additional text styles"
            buttonIcon={<DropdownMoreIcon className={classes.blockTypeIcon} />}
          >
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('lowercase', isKeyboardInput(e))
              }
              wide
              active={toolbarState.isLowercase}
              title="Lowercase"
              aria-label="Format text to lowercase">
              <DropDownItemIconTextContainer>
                <TypeLowercaseIcon className={classes.dropdownIcon} />
                <DropDownItemText>Lowercase</DropDownItemText>
              </DropDownItemIconTextContainer>
              <DropDownItemShortcut>{SHORTCUTS.LOWERCASE}</DropDownItemShortcut>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('uppercase', isKeyboardInput(e))
              }
              wide
              active={toolbarState.isUppercase}
              title="Uppercase"
              aria-label="Format text to uppercase">
              <DropDownItemIconTextContainer>
                <TypeUppercaseIcon className={classes.dropdownIcon} />
                <DropDownItemText>Uppercase</DropDownItemText>
              </DropDownItemIconTextContainer>
              <DropDownItemShortcut>{SHORTCUTS.UPPERCASE}</DropDownItemShortcut>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('capitalize', isKeyboardInput(e))
              }
              wide
              active={toolbarState.isCapitalize}
              title="Capitalize"
              aria-label="Format text to capitalize">
              <DropDownItemIconTextContainer>
                <TypeCapitalizeIcon className={classes.dropdownIcon} />
                <DropDownItemText>Capitalize</DropDownItemText>
              </DropDownItemIconTextContainer>
              <DropDownItemShortcut>{SHORTCUTS.CAPITALIZE}</DropDownItemShortcut>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('strikethrough', isKeyboardInput(e))
              }
              wide
              active={toolbarState.isStrikethrough}
              title="Strikethrough"
              aria-label="Format text with a strikethrough">
              <DropDownItemIconTextContainer>
                <TypeStrikethroughIcon className={classes.dropdownIcon} />
                <DropDownItemText>Strikethrough</DropDownItemText>
              </DropDownItemIconTextContainer>
              <DropDownItemShortcut>{SHORTCUTS.STRIKETHROUGH}</DropDownItemShortcut>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('subscript', isKeyboardInput(e))
              }
              wide
              active={toolbarState.isSubscript}
              title="Subscript"
              aria-label="Format text with a subscript">
              <DropDownItemIconTextContainer>
                <TypeSubscriptIcon className={classes.dropdownIcon} />
                <DropDownItemText>Subscript</DropDownItemText>
              </DropDownItemIconTextContainer>
              <DropDownItemShortcut>{SHORTCUTS.SUBSCRIPT}</DropDownItemShortcut>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('superscript', isKeyboardInput(e))
              }
              wide
              active={toolbarState.isSuperscript}
              title="Superscript"
              aria-label="Format text with a superscript">
              <DropDownItemIconTextContainer>
                <TypeSuperscriptIcon className={classes.dropdownIcon} />
                <DropDownItemText>Superscript</DropDownItemText>
              </DropDownItemIconTextContainer>
              <DropDownItemShortcut>{SHORTCUTS.SUPERSCRIPT}</DropDownItemShortcut>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('highlight', isKeyboardInput(e))
              }
              wide
              active={toolbarState.isHighlight}
              title="Highlight"
              aria-label="Format text with a highlight">
              <DropDownItemIconTextContainer>
                <HighlighterIcon className={classes.dropdownIcon} />
                <DropDownItemText>Highlight</DropDownItemText>
              </DropDownItemIconTextContainer>
            </DropDownItem>
            <DropDownItem
              onClick={(e) => clearFormatting(activeEditor, isKeyboardInput(e))}
              wide
              title="Clear text formatting"
              aria-label="Clear all text formatting">
              <DropDownItemIconTextContainer>
                <TrashIcon className={classes.dropdownIcon} />
                <DropDownItemText>Clear Formatting</DropDownItemText>
              </DropDownItemIconTextContainer>
              <DropDownItemShortcut>{SHORTCUTS.CLEAR_FORMATTING}</DropDownItemShortcut>
            </DropDownItem>
          </DropDown>
          {canViewerSeeInsertDropdown && (
            <>
              <Divider />
              <DropDown
                disabled={!isEditable}
                buttonClassName={classes.toolbarItemSpaced}
                buttonLabel="Insert"
                buttonAriaLabel="Insert specialized editor node"
                buttonIcon={<PlusIcon className={classes.blockTypeIcon} />}>
                <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_HORIZONTAL_RULE_COMMAND)
                  }
                  >
                  <HorizontalRuleIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Horizontal Rule</DropDownItemText>
                </DropDownItem>
                <DropDownItem
                  onClick={() => dispatchToolbarCommand(INSERT_PAGE_BREAK)}
                  >
                  <ScissorsIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Page Break</DropDownItemText>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal('Insert Image', (onClose) => (
                      <InsertImageDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  >
                  <FileImageIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Image</DropDownItemText>
                </DropDownItem>
                {/* <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_EXCALIDRAW_COMMAND)
                  }
                  className="item">
                  <Diagram2Icon className={classes.dropdownIcon} />
                  <span className="text">Excalidraw</span>
                </DropDownItem> */}
                <DropDownItem
                  onClick={() => {
                    showModal('Insert Table', (onClose) => (
                      <InsertTableDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  >
                  <TableIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Table</DropDownItemText>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal('Insert Poll', (onClose) => (
                      <InsertPollDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  >
                  <CardChecklistIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Poll</DropDownItemText>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal('Insert Columns Layout', (onClose) => (
                      <InsertLayoutDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  >
                  <ThreeColumnsIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Columns Layout</DropDownItemText>
                </DropDownItem>

                <DropDownItem
                  onClick={() => {
                    dispatchToolbarCommand(OPEN_MATH_EDITOR_COMMAND, { inline: true });
                  }}
                  >
                  <PlusSlashMinusIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Equation</DropDownItemText>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    editor.update(() => {
                      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
                      const root = $getRoot();
                      const stickyNode = $createStickyNode(0, 0);
                      root.append(stickyNode);
                    });
                  }}
                  >
                  <StickyIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Sticky Note</DropDownItemText>
                </DropDownItem>
                <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_COLLAPSIBLE_COMMAND)
                  }
                  >
                  <CaretRightFillIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Collapsible container</DropDownItemText>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    const dateTime = new Date();
                    dateTime.setHours(0, 0, 0, 0);
                    dispatchToolbarCommand(INSERT_DATETIME_COMMAND, {dateTime});
                  }}
                  >
                  <CalendarIcon className={classes.dropdownIcon} />
                  <DropDownItemText>Date</DropDownItemText>
                </DropDownItem>
                {EmbedConfigs.map((embedConfig) => (
                  <DropDownItem
                    key={embedConfig.type}
                    onClick={() =>
                      dispatchToolbarCommand(
                        INSERT_EMBED_COMMAND,
                        embedConfig.type,
                      )
                    }
                    >
                    {embedConfig.icon}
                    <DropDownItemText>{embedConfig.contentName}</DropDownItemText>
                  </DropDownItem>
                ))}
              </DropDown>
            </>
          )}
        </>
      )}
      {/* <Divider />
      <ElementFormatDropdown
        disabled={!isEditable}
        value={toolbarState.elementFormat}
        editor={activeEditor}
        isRTL={toolbarState.isRTL}
      /> */}
      {modal}
    </div>
  );
}
