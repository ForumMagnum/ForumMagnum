import React, { ChangeEvent, useCallback } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { rootStyles as inputStyles } from "./EAOnboardingInput";
import ForumIcon from "../../common/ForumIcon";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useStyles } from "@/components/hooks/useStyles";

const styles = defineStyles("EAOnboardingSelect", (theme: ThemeType) => ({
  root: {
    position: "relative",
  },
  select: {
    ...inputStyles(theme),
    appearance: "none",
  },
  icon: {
    position: "absolute",
    right: 12,
    height: "100%",
    color: theme.palette.grey[600],
  },
}));

export const EAOnboardingSelect = ({
  value,
  setValue,
  options,
}: {
  value?: string,
  setValue: (value: string) => void,
  options: {value: string, label: string}[],
}) => {
  const classes = useStyles(styles);
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

export default EAOnboardingSelect;
