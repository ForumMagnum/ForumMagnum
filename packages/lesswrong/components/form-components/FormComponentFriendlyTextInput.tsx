import React, { ChangeEventHandler, ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { styles as friendlyInputStyles } from "../ea-forum/onboarding/EAOnboardingInput";
import TextField from "@/lib/vendor/@material-ui/core/src/TextField";
import classNames from "classnames";

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
  smallBottomMargin: {
    marginBottom: "-24px !important",
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
  smallBottomMargin,
  className,
  classes,
}: {
  multiline?: boolean,
  rows?: number,
  fullWidth?: boolean,
  startAdornment?: ReactNode,
  smallBottomMargin?: boolean,
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
    <div className={classNames(
      className,
      smallBottomMargin && classes.smallBottomMargin,
    )}>
      {label &&
        <SectionTitle title={label} noTopMargin titleClassName={classes.label} />
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
