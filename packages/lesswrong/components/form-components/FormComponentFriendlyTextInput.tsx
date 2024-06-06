import React, { ChangeEventHandler, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import TextField from "@material-ui/core/TextField";

const styles = (theme: ThemeType) => ({
  label: {
    fontSize: 12,
  },
  textField: {
    background: theme.palette.panelBackground.loginInput,
    borderRadius: theme.borderRadius.default,
    padding: 14,
    width: "100%",
    fontSize: 14,
    fontWeight: 500,
    "& .MuiInputBase-input": {
      padding: 0,
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
  classes,
}: {
  multiline?: boolean,
  rows?: number,
  fullWidth?: boolean,
  classes: ClassesType<typeof styles>,
} & FormComponentProps<string>) => {
  const onChange: ChangeHandler = useCallback((event) => {
    void updateCurrentValues({
      [path]: event.target.value,
    });
  }, [updateCurrentValues, path]);

  const {SectionTitle} = Components;
  return (
    <div>
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
