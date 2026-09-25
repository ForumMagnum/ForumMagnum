import React, { useRef, useState } from "react";
import classNames from "classnames";
import LWPopper from "../common/LWPopper";
import LWClickAwayListener from "../common/LWClickAwayListener";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import { Paper } from "../widgets/Paper";
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles("SequenceEditMenu", (theme: ThemeType) => ({
  button: {
    background: "none",
    border: "none",
    padding: 4,
    borderRadius: 4,
    cursor: "pointer",
    display: "flex",
    color: theme.palette.greyAlpha(0.45),
    "&:hover": {
      color: theme.palette.greyAlpha(0.85),
      background: theme.palette.greyAlpha(0.05),
    },
  },
  icon: {
    width: 18,
    height: 18,
  },
  popper: {
    zIndex: theme.zIndexes.header,
  },
}));

export interface SequenceEditMenuItem {
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

/** The "⋮" menu used on chapters and post rows in the sequence editor. */
const SequenceEditMenu = ({ items, label, className }: {
  items: SequenceEditMenuItem[],
  label: string,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return <>
    <button
      ref={anchorRef}
      className={classNames(classes.button, className)}
      onClick={() => setOpen(!open)}
      aria-label={label}
      title={label}
    >
      <ForumIcon icon="EllipsisVertical" className={classes.icon} />
    </button>
    <LWPopper open={open} anchorEl={anchorRef.current} placement="bottom-end" className={classes.popper}>
      <LWClickAwayListener onClickAway={() => setOpen(false)}>
        <Paper>
          <DropdownMenu>
            {items.map((item) => <DropdownItem
              key={item.title}
              title={item.title}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            />)}
          </DropdownMenu>
        </Paper>
      </LWClickAwayListener>
    </LWPopper>
  </>;
};

export default SequenceEditMenu;
