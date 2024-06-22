import React, { ChangeEventHandler, ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { styles as friendlyInputStyles } from "../ea-forum/onboarding/EAOnboardingInput";
import TextField from "@material-ui/core/TextField";

const styles = (theme: ThemeType) => ({
  label: {
    fontSize: 12,
  },
  textField: {
    ...friendlyInputStyles(theme).root,
    "& .MuiInputBase-input": {
      padding: 0,
      fontSize: 14,
      color: theme.palette.grey[1000],
    },
  },
});

type ChangeHandler = ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

export const FormComponentFriendlyTextInput = ({
  updateCurrentValues,
  path,
  value,
  label,
  disabled,
  multiline,
  rows,
  startAdornment,
  className,
  classes,
}: {
  multiline?: boolean,
  rows?: number,
  fullWidth?: boolean,
  startAdornment?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
} & FormComponentProps<string>) => {
  const onChange: ChangeHandler = useCallback((event) => {
    void updateCurrentValues({
      [path]: event.target.value,
    });
  }, [updateCurrentValues, path]);

  const {SectionTitle} = Components;
  return (
    <div className={className}>
      {label &&
        <SectionTitle title={label} noTopMargin className={classes.label} />
      }
      <TextField
        value={value ?? ""}
        onChange={onChange}
        multiline={multiline}
        rows={rows}
        className={classes.textField}
        disabled={disabled}
        InputProps={{
          disableUnderline: true,
          startAdornment,
        }}
      />
    </div>
  );
}

const FormComponentFriendlyTextInputComponent = registerComponent(
  "FormComponentFriendlyTextInput",
  FormComponentFriendlyTextInput,
  {styles},
);

declare global {
  interface ComponentTypes {
    FormComponentFriendlyTextInput: typeof FormComponentFriendlyTextInputComponent
  }
}
