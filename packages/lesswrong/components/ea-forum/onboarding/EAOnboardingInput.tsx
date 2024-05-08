import React, { useCallback, ChangeEvent, RefObject } from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import classNames from "classnames";

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
  As="input",
  rows,
  inputRef,
  className,
  classes,
}: {
  value: string,
  setValue: (value: string) => void,
  placeholder: string,
  As?: "input" | "textarea",
  rows?: number,
  inputRef?: RefObject<HTMLInputElement> | RefObject<HTMLTextAreaElement>,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const onChange = useCallback((
    ev: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setValue(ev.target.value ?? "");
  }, [setValue]);
  return (
    <As
      value={value}
      type={As === "input" ? "text" : undefined}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      ref={inputRef as AnyBecauseHard}
      className={classNames(classes.root, className)}
    />
  );
}

const EAOnboardingInputComponent = registerComponent(
  "EAOnboardingInput",
  EAOnboardingInput,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    EAOnboardingInput: typeof EAOnboardingInputComponent
  }
}
