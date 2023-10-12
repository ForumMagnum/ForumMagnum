import React, { useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import Menu from "@material-ui/core/Menu";
import classNames from "classnames";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline",
  },
  link: {
    color: theme.palette.lwTertiary.main,
  },
  dropdownIcon: {
    width: '0.7em',
    height: '0.7em',
    verticalAlign: 'text-top',
  }
});

export interface Option {
  value: string | number;
  label: string;
}

const InlineSelect = ({
  options,
  selected,
  handleSelect,
  classes,
  displayStyle,
  appendChevron
}: {
  options: Option[];
  selected: Option;
  handleSelect: (opt: Option) => void;
  classes: ClassesType;
  displayStyle?: React.CSSProperties | string;
  appendChevron?: boolean;
}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const { MenuItem, ForumIcon } = Components;

  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  let titleClassName;
  if (displayStyle) {
    titleClassName = classNames(classes.link, displayStyle)
  } else {
    titleClassName = classes.link
  }

  const optionalChevron = appendChevron ? <ForumIcon icon="ThickChevronDown" className={classes.dropdownIcon} /> : null

  return (
    <div className={classes.root}>
      <a className={titleClassName} onClick={handleClick}>
        {selected.label}{optionalChevron}
      </a>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {options.map((option: Option) => {
          return (
            <MenuItem
              key={option.value}
              onClick={() => {
                handleSelect(option);
                handleClose();
              }}
            >
              {option.label}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}

const InlineSelectComponent = registerComponent("InlineSelect", InlineSelect, { styles });

declare global {
  interface ComponentTypes {
    InlineSelect: typeof InlineSelectComponent;
  }
}
