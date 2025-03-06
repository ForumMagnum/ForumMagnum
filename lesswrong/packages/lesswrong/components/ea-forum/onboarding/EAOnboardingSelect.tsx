import React, { ChangeEvent, useCallback } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { styles as inputStyles } from "./EAOnboardingInput";
import ForumIcon from "@/components/common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
  },
  select: {
    ...inputStyles(theme).root,
    appearance: "none",
  },
  icon: {
    position: "absolute",
    right: 12,
    height: "100%",
    color: theme.palette.grey[600],
  },
});

export const EAOnboardingSelect = ({
  value,
  setValue,
  options,
  classes,
}: {
  value?: string,
  setValue: (value: string) => void,
  options: {value: string, label: string}[],
  classes: ClassesType<typeof styles>,
}) => {
  const onChange = useCallback((ev: ChangeEvent<HTMLSelectElement>) => {
    setValue(ev.target.value ?? "");
  }, [setValue]);
  return (
    <div className={classes.root}>
      <select
        value={value}
        onChange={onChange}
        className={classes.select}
      >
        <option></option>
        {options.map(({value, label}) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
      <ForumIcon icon="ThickChevronDown" className={classes.icon} />
    </div>
  );
}

const EAOnboardingSelectComponent = registerComponent(
  "EAOnboardingSelect",
  EAOnboardingSelect,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingSelect: typeof EAOnboardingSelectComponent
  }
}

export default EAOnboardingSelectComponent;
