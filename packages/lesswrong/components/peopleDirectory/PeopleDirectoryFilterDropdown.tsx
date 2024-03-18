import React, { ReactNode, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    display: "inline-block",
    color: theme.palette.grey[1000],
    border: `1px solid ${theme.palette.grey[340]}`,
    borderRadius: theme.borderRadius.small,
    padding: "4px 8px",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  active: {
    color: theme.palette.grey[0],
    background: theme.palette.primary.dark,
  },
  button: {
    userSelect: "none",
    fontSize: 14,
    fontWeight: 500,
    height: 29,
    display: "flex",
    alignItems: "center",
  },
  chevron: {
    width: 20,
    marginLeft: 4,
  },
  chevronOpen: {
    transform: "rotateX(180deg)",
  },
  popper: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    paddingTop: 4,
  },
  card: {
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[120]}`,
    boxShadow: theme.palette.boxShadow.eaCard,
    padding: 16,
  },
});

export const PeopleDirectoryFilterDropdown = ({
  title,
  active,
  children,
  className,
  classes,
}: {
  title: string,
  active?: boolean,
  children?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const {LWPopper, LWClickAwayListener, ForumIcon} = Components;
  return (
    <div
      ref={anchorRef}
      className={classNames(classes.root, {[classes.active]: active})}
    >
      <div onClick={() => setOpen(!open)} className={classes.button}>
        {title}
        <ForumIcon
          icon="ThickChevronDown"
          className={classNames(classes.chevron, {[classes.chevronOpen]: open})}
        />
      </div>
      <LWPopper
        placement="bottom-start"
        open={open}
        anchorEl={anchorRef.current}
        allowOverflow
        className={classes.popper}
      >
        <LWClickAwayListener onClickAway={() => setOpen(false)}>
          <div className={classNames(classes.card, className)}>
            {children}
          </div>
        </LWClickAwayListener>
      </LWPopper>
    </div>
  );
}

const PeopleDirectoryFilterDropdownComponent = registerComponent(
  "PeopleDirectoryFilterDropdown",
  PeopleDirectoryFilterDropdown,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryFilterDropdown: typeof PeopleDirectoryFilterDropdownComponent
  }
}
