import React, { useCallback, ChangeEvent, RefObject } from "react";
import classNames from "classnames";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useStyles } from "@/components/hooks/useStyles";

// These styles are also used by `EAOnboardingSelect`
export const rootStyles = (theme: ThemeType) => ({
  width: "100%",
  padding: "16px",
  borderRadius: theme.borderRadius.default,
  background: theme.palette.panelBackground.loginInput,
  color: `${theme.palette.grey[1000]} !important`,
  fontSize: 14,
  fontWeight: 500,
  border: "none",
  resize: "none",
  "&::placeholder": {
    color: theme.palette.grey[600],
  },
  "&:hover, &:focus": {
    background: theme.palette.panelBackground.loginInputHovered,
  },
});

const styles = defineStyles("EAOnboardingInput", (theme: ThemeType) => ({
  root: {
    ...rootStyles(theme),
  },
}), {
  stylePriority: -1,
});

const EAOnboardingInput = ({
  value,
  setValue,
  placeholder,
  As="input",
  rows,
  inputRef,
  disabled,
  className,
}: {
  value: string,
  setValue: (value: string) => void,
  placeholder: string,
  As?: "input" | "textarea",
  rows?: number,
  inputRef?: RefObject<HTMLInputElement|null> | RefObject<HTMLTextAreaElement|null>,
  disabled?: boolean,
  className?: string,
}) => {
  const classes = useStyles(styles);
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
      disabled={disabled}
      className={classNames(classes.root, className)}
    />
  );
}

export default EAOnboardingInput;
