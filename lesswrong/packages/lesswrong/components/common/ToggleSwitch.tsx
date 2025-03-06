import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    position: "relative",
    width: 34,
    minWidth: 34,
    height: 20,
    borderRadius: 10,
    background: theme.palette.grey[400],
    overflow: "hidden",
  },
  rootSmall: {
    width: 28,
    minWidth: 28,
    height: 16,
  },
  switch: {
    position: "absolute",
    borderRadius: 10,
    transition: "all 0.2s ease-in-out",
    padding: 2,
  },
  switchOn: {
    background: theme.palette.primary.main,
    left: 0,
  },
  switchOff: {
    background: theme.palette.grey[400],
    left: -14,
  },
  switchOffSmall: {
    left: -12,
  },
  handle: {
    background: theme.palette.text.alwaysWhite,
    borderRadius: "50%",
    width: 16,
    height: 16,
    marginLeft: 14,
  },
  handleSmall: {
    width: 12,
    height: 12,
    marginLeft: 12,
  },
});

export const ToggleSwitch = ({value, setValue, smallVersion, className, classes}: {
  value: boolean,
  setValue?: (value: boolean) => void,
  smallVersion?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const onToggle = useCallback(() => {
    setValue?.(!value);
  }, [value, setValue]);

  return (
    <div onClick={onToggle} className={classNames(classes.root, className, {
      [classes.rootSmall]: smallVersion
    })}>
      <div className={classNames(classes.switch, {
        [classes.switchOn]: value,
        [classes.switchOff]: !value,
        [classes.switchOffSmall]: !value && smallVersion,
      })}>
        <div className={classNames(classes.handle, {[classes.handleSmall]: smallVersion})} />
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

export default ToggleSwitchComponent;
