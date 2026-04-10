import React, { type JSX, useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { LexicalEditor } from 'lexical';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/extension';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { OPEN_TABLE_SELECTOR_COMMAND } from '@/components/editor/lexicalPlugins/tables/TablesPlugin';
import { OPEN_MATH_EDITOR_COMMAND } from '@/components/editor/lexicalPlugins/math/MathPlugin';
import { INSERT_FOOTNOTE_COMMAND } from '@/components/editor/lexicalPlugins/footnotes/FootnotesPlugin';
import { INSERT_COLLAPSIBLE_SECTION_COMMAND } from '@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionsPlugin';
import { InsertImageDialog } from '../ImagesPlugin';
import { FileImageIcon } from '../../icons/FileImageIcon';
import { useDialog } from '@/components/common/withDialog';
import { TableIcon } from '../../icons/TableIcon';
import { HorizontalRuleIcon } from '../../icons/HorizontalRuleIcon';
import { PlusSlashMinusIcon } from '../../icons/PlusSlashMinusIcon';
import { CaretRightFillIcon } from '../../icons/CaretRightFillIcon';
import { CkFootnoteIcon } from '../../icons/CkFootnoteIcon';
import { InsertClaimIcon } from '../../icons/InsertClaimIcon';

const styles = defineStyles('LexicalBlockInsertToolbar', (theme: ThemeType) => ({
  popup: {
    display: 'flex',
    background: theme.palette.grey[0],
    padding: 4,
    verticalAlign: 'middle',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    opacity: 0,
    boxShadow: `0px 5px 10px ${theme.palette.greyAlpha(0.3)}`,
    borderRadius: 4,
    transition: 'opacity 0.15s',
    minHeight: 35,
    height: 'auto',
    width: 'max-content',
    boxSizing: 'border-box',
    willChange: 'transform',
  },
  popupItem: {
    border: 0,
    display: 'flex',
    background: 'none',
    borderRadius: 4,
    padding: 5,
    cursor: 'pointer',
    verticalAlign: 'middle',
    width: 26,
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  spaced: {
    marginRight: 2,
  },
  format: {
    backgroundSize: 'contain',
    height: 16,
    width: 16,
    display: 'flex',
    opacity: 0.6,
  },
  divider: {
    width: 1,
    backgroundColor: theme.palette.grey[200],
    margin: '0 4px',
  },
}));


function positionToolbar(
  buttonElem: HTMLElement,
  toolbarElem: HTMLElement,
  anchorElem: HTMLElement,
): void {
  const buttonRect = buttonElem.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();
  const toolbarRect = toolbarElem.getBoundingClientRect();

  let top = buttonRect.bottom + 4 - anchorRect.top;
  let left = buttonRect.left - anchorRect.left;

  // If toolbar would overflow the right edge of the anchor, shift it left
  if (left + toolbarRect.width > anchorRect.width) {
    left = anchorRect.width - toolbarRect.width;
  }

  toolbarElem.style.opacity = '1';
  toolbarElem.style.transform = `translate(${left}px, ${top}px)`;
}

interface BlockInsertToolbarProps {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  buttonElem: HTMLElement;
  onClose: () => void;
  insertClaim: (() => void) | null;
}

function BlockInsertToolbar({
  editor,
  anchorElem,
  buttonElem,
  onClose,
  insertClaim,
}: BlockInsertToolbarProps): JSX.Element {
  const classes = useStyles(styles);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const { openDialog } = useDialog();

  const updatePosition = useCallback(() => {
    const toolbarElem = toolbarRef.current;
    if (!toolbarElem) {
      return;
    }
    positionToolbar(buttonElem, toolbarElem, anchorElem);
  }, [buttonElem, anchorElem]);

  // Position on mount and on scroll/resize
  useEffect(() => {
    updatePosition();

    const scrollerElem = anchorElem.parentElement;
    window.addEventListener('resize', updatePosition);
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', updatePosition);
      }
    };
  }, [updatePosition, anchorElem]);

  // Dismiss on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const toolbarElem = toolbarRef.current;
      if (toolbarElem && !toolbarElem.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  // Dismiss on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  function handleItemClick(action: () => void) {
    action();
    onClose();
  }

  const imageButton = (
    <button
      key="image"
      type="button"
      onClick={() =>
        handleItemClick(() =>
          openDialog({
            name: 'InsertImageDialog',
            contents: ({ onClose }) => (
              <InsertImageDialog activeEditor={editor} onClose={onClose} />
            ),
          }),
        )
      }
      className={classes.popupItem}
      title="Insert image"
      aria-label="Insert image">
      <FileImageIcon className={classes.format} />
    </button>
  );

  const tableButton = (
    <button
      key="table"
      type="button"
      onClick={() =>
        handleItemClick(() =>
          editor.dispatchCommand(OPEN_TABLE_SELECTOR_COMMAND, null),
        )
      }
      className={classes.popupItem}
      title="Insert table"
      aria-label="Insert table">
      <TableIcon className={classes.format} />
    </button>
  );

  const horizontalRuleButton = (
    <button
      key="hr"
      type="button"
      onClick={() =>
        handleItemClick(() =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
        )
      }
      className={classes.popupItem}
      title="Insert horizontal rule"
      aria-label="Insert horizontal rule">
      <HorizontalRuleIcon className={classes.format} />
    </button>
  );

  const mathDisplayButton = (
    <button
      key="mathDisplay"
      type="button"
      onClick={() =>
        handleItemClick(() =>
          editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: false }),
        )
      }
      className={classes.popupItem}
      title="Insert display equation"
      aria-label="Insert display equation">
      <PlusSlashMinusIcon className={classes.format} />
    </button>
  );

  const collapsibleButton = (
    <button
      key="collapsible"
      type="button"
      onClick={() =>
        handleItemClick(() =>
          editor.dispatchCommand(INSERT_COLLAPSIBLE_SECTION_COMMAND, undefined),
        )
      }
      className={classes.popupItem}
      title="Insert collapsible section"
      aria-label="Insert collapsible section">
      <CaretRightFillIcon className={classes.format} />
    </button>
  );

  const footnoteButton = (
    <button
      key="footnote"
      type="button"
      onClick={() =>
        handleItemClick(() =>
          editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, {}),
        )
      }
      className={classes.popupItem}
      title="Insert footnote"
      aria-label="Insert footnote">
      <CkFootnoteIcon className={classes.format} />
    </button>
  );

  const claimButton = insertClaim ? (
    <button
      key="claim"
      type="button"
      onClick={() => handleItemClick(insertClaim)}
      className={classes.popupItem}
      title="Insert claim"
      aria-label="Insert claim">
      <InsertClaimIcon className={classes.format} />
    </button>
  ) : null;

  const groups: Array<JSX.Element[]> = [
    [imageButton, tableButton, horizontalRuleButton],
    [mathDisplayButton],
    [collapsibleButton],
    [footnoteButton, ...(claimButton ? [claimButton] : [])],
  ];

  const visibleGroups = groups.filter((group) => group.length > 0);

  return (
    <div ref={toolbarRef} className={classNames(classes.popup, 'block-insert-toolbar')}>
      {visibleGroups.map((group, index) => (
        <React.Fragment key={`group-${index}`}>
          {index > 0 && <span className={classes.divider} />}
          {group}
        </React.Fragment>
      ))}
    </div>
  );
}

interface BlockInsertToolbarPluginProps {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  buttonElem: HTMLElement;
  onClose: () => void;
  insertClaim: (() => void) | null;
}

export default function BlockInsertToolbarPlugin({
  editor,
  anchorElem,
  buttonElem,
  onClose,
  insertClaim,
}: BlockInsertToolbarPluginProps): JSX.Element {
  return createPortal(
    <BlockInsertToolbar
      editor={editor}
      anchorElem={anchorElem}
      buttonElem={buttonElem}
      onClose={onClose}
      insertClaim={insertClaim}
    />,
    anchorElem,
  );
}
