import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { MultiSelectState } from "../hooks/useMultiSelect";
import { useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    userSelect: "none",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "6px 8px",
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  check: {
    display: "inline",
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.borderRadius.small,
    width: 16,
    height: 16,
  },
  selected: {
    border: "none",
    marginLeft: 1,
    marginRight: -1,
  },
  icon: {
    width: 16,
    height: 16,
    marginLeft: -1,
    color: theme.palette.primary.main,
  },
});

const PeopleDirectorySelectOptionInner = ({state, className, classes}: {
  state: MultiSelectState,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {value, label, selected, onToggle} = state;
  const {captureEvent} = useTracking({
    eventType: "selectOptionToggle",
    eventProps: {
      value,
      label,
      oldValue: selected,
      newValue: !selected,
    },
  });

  const onClick = useCallback(() => {
    onToggle();
    captureEvent();
  }, [onToggle, captureEvent]);

  const {ForumIcon} = Components;
  return (
    <div onClick={onClick} className={classNames(classes.root, className)}>
      <div className={classNames(classes.check, {[classes.selected]: selected})}>
        {selected && <ForumIcon icon="CheckSmall" className={classes.icon} />}
      </div>
      {label}
    </div>
  );
}

export const PeopleDirectorySelectOption = registerComponent(
  "PeopleDirectorySelectOption",
  PeopleDirectorySelectOptionInner,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySelectOption: typeof PeopleDirectorySelectOption
  }
}
