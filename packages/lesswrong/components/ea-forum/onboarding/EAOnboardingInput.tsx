import React, { useCallback, ChangeEvent } from "react";
import { registerComponent } from "../../../lib/vulcan-lib";

// These styles are also used by `EAOnboardingSelect`
export const styles = (theme: ThemeType) => ({
  root: {
    width: "100%",
    padding: "16px",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.loginInput,
    color: theme.palette.grey[1000],
    fontSize: 14,
    border: "none",
    "&::placeholder": {
      color: theme.palette.grey[600],
    },
    "&:hover, &:focus": {
      background: theme.palette.panelBackground.loginInputHovered,
    },
  },
});

export const EAOnboardingInput = ({
  value,
  setValue,
  placeholder,
  classes,
}: {
  value: string,
  setValue: (value: string) => void,
  placeholder: string,
  classes: ClassesType<typeof styles>,
}) => {
  const onChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setValue(ev.target.value ?? "");
  }, [setValue]);
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={classes.root}
    />
  );
}

const EAOnboardingInputComponent = registerComponent(
  "EAOnboardingInput",
  EAOnboardingInput,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingInput: typeof EAOnboardingInputComponent
  }
}
