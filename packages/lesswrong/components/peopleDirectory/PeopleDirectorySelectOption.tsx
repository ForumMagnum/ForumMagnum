import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
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
  },
  check: {
    display: "inline",
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.borderRadius.small,
    width: 16,
    height: 16,
  },
  selected: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  icon: {
    width: 16,
    height: 16,
    marginLeft: -1,
  },
});

export const PeopleDirectorySelectOption = ({state, className, classes}: {
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
        {selected && <ForumIcon icon="Check" className={classes.icon} />}
      </div>
      {label}
    </div>
  );
}

const PeopleDirectorySelectOptionComponent = registerComponent(
  "PeopleDirectorySelectOption",
  PeopleDirectorySelectOption,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySelectOption: typeof PeopleDirectorySelectOptionComponent
  }
}
