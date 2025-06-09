import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { styles as friendlyInputStyles } from "../ea-forum/onboarding/EAOnboardingInput";
import TextField from "@/lib/vendor/@material-ui/core/src/TextField";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import SectionTitle from "../common/SectionTitle";

const styles = defineStyles('FormComponentFriendlyTextInput', (theme: ThemeType) => ({
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
}));

export const FormComponentFriendlyTextInput = ({
  updateCurrentValue,
  value,
  label,
  disabled,
  multiline,
  rows,
  startAdornment,
  smallBottomMargin,
  className,
}: {
  value: string | null | undefined,
  updateCurrentValue: (value: string | null | undefined) => void,
  label?: string,
  disabled?: boolean,
  multiline?: boolean,
  rows?: number,
  fullWidth?: boolean,
  startAdornment?: ReactNode,
  smallBottomMargin?: boolean,
  className?: string,
}) => {
  const classes = useStyles(styles);
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
        onChange={(event) => updateCurrentValue(event.target.value)}
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
