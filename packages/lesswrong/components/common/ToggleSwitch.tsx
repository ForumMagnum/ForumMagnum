import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    position: "relative",
    width: 34,
    minWidth: 34,
    height: 20,
    borderRadius: 10,
    background: theme.palette.grey[600],
    overflow: "hidden",
  },
  switch: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 10,
    transition: "all 0.2s ease-in-out",
    padding: 2,
  },
  switchOn: {
    background: theme.palette.primary.main,
    left: 0,
  },
  switchOff: {
    background: theme.palette.grey[500],
    left: -14,
  },
  handle: {
    background: theme.palette.text.alwaysWhite,
    borderRadius: "50%",
    width: 16,
    height: 16,
    marginLeft: 14,
  },
});

export const ToggleSwitch = ({value, setValue, className, classes}: {
  value: boolean,
  setValue: (value: boolean) => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const onToggle = useCallback(() => {
    setValue(!value);
  }, [value, setValue]);
  return (
    <div onClick={onToggle} className={classNames(classes.root, className)}>
      <div className={classNames(classes.switch, {
        [classes.switchOn]: value,
        [classes.switchOff]: !value,
      })}>
        <div className={classes.handle} />
      </div>
    </div>
  );
}

const ToggleSwitchComponent = registerComponent(
  "ToggleSwitch",
  ToggleSwitch,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    ToggleSwitch: typeof ToggleSwitchComponent
  }
}
