import React, { ReactNode, useCallback, useRef, useState } from "react";
import { useEventListener } from "../hooks/useEventListener";
import ForumIcon, { ForumIconName } from "../common/ForumIcon";
import classNames from "classnames";
import LWPopper from "../common/LWPopper";
import LWClickAwayListener from "../common/LWClickAwayListener";
import { defineStyles, useStyles } from "../hooks/useStyles";

export const styles = defineStyles("PeopleDirectoryFilterDropdown", (theme: ThemeType) => ({
  root: {
    display: "inline-block",
  },
  container: {
    cursor: "pointer",
    fontFamily: theme.palette.fonts.sansSerifStack,
    borderRadius: theme.borderRadius.small,
    padding: "4px 8px",
  },
  dropdown: {
    color: theme.palette.grey[1000],
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.grey[0],
    "&:hover": {
      borderColor: theme.palette.grey[310],
      background: theme.palette.grey[25],
    },
    "&$active:hover": {
      background: theme.palette.primary.dark,
    },
  },
  button: {
    color: theme.palette.grey[600],
    "&:hover": {
      color: theme.palette.grey[800],
      background: theme.palette.grey[120],
    },
  },
  active: {
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.primary.main,
    "& $chevron": {
      color: theme.palette.text.alwaysWhite,
    },
  },
  primary: {
    color: theme.palette.primary.main,
  },
  title: {
    userSelect: "none",
    fontSize: 14,
    fontWeight: 500,
    height: 24,
    display: "flex",
    alignItems: "center",
  },
  icon: {
    width: 20,
    marginRight: 4,
  },
  smallIcon: {
    width: "18px !important",
  },
  chevron: {
    width: 16,
    marginLeft: 4,
    color: theme.palette.grey[600],
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
  },
}), {
  stylePriority: -1,
});

const PeopleDirectoryFilterDropdown = ({
  title,
  active,
  primary,
  style = "dropdown",
  icon,
  onOpen,
  onClose,
  children,
  smallIcon,
  className,
  rootClassName,
  titleClassName,
}: {
  title: ReactNode,
  active?: boolean,
  primary?: boolean,
  style?: "dropdown" | "button",
  icon?: ForumIconName,
  onOpen?: () => void,
  onClose?: () => void,
  children?: ReactNode,
  smallIcon?: boolean,
  className?: string,
  rootClassName?: string,
  titleClassName?: string,
}) => {
  const classes = useStyles(styles);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const onChangeOpen = useCallback((newOpen: boolean) => {
    setOpen((oldOpen) => {
      if (!oldOpen && newOpen) {
        onOpen?.();
      } else if (oldOpen && !newOpen) {
        onClose?.();
      }
      return newOpen;
    });
  }, [onOpen, onClose]);

  useEventListener("resize", () => setOpen(false));
  return (
    <div ref={anchorRef} className={classes.root}>
      <div
        onClick={() => onChangeOpen(!open)}
        className={classNames(classes.container, rootClassName, {
          [classes.dropdown]: style === "dropdown",
          [classes.button]: style === "button",
          [classes.active]: active,
          [classes.primary]: primary,
        })}
      >
        <div className={classNames(classes.title, titleClassName)}>
          {icon &&
            <ForumIcon
              icon={icon}
              className={classNames(classes.icon, smallIcon && classes.smallIcon)}
            />
          }
          {title}
          {style === "dropdown" &&
            <ForumIcon
              icon="ThickChevronDown"
              className={classNames(classes.chevron, {[classes.chevronOpen]: open})}
            />
          }
        </div>
      </div>
      <LWPopper
        placement="bottom-start"
        open={open}
        anchorEl={anchorRef.current}
        className={classes.popper}
      >
        <LWClickAwayListener onClickAway={() => onChangeOpen(false)}>
          <div className={classNames(classes.card, className)}>
            {children}
          </div>
        </LWClickAwayListener>
      </LWPopper>
    </div>
  );
}

export default PeopleDirectoryFilterDropdown;

