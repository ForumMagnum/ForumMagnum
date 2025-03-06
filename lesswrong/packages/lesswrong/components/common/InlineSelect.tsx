import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { MenuItem } from "@/components/common/Menus";
import { Menu } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  root: {
    display: "inline",
  },
  link: {
    color: theme.palette.lwTertiary.main,
  },
});

export interface Option {
  value: string | number;
  label: string;
}

function InlineSelect({
  options,
  selected,
  handleSelect,
  classes,
}: {
  options: Option[];
  selected: Option;
  handleSelect: (opt: Option) => void;
  classes: ClassesType<typeof styles>;
}) {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className={classes.root}>
      <a className={classes.link} onClick={handleClick}>
        {selected.label}
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

export default InlineSelectComponent;
