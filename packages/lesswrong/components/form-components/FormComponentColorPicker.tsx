import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import type { TypedFieldApi } from "@/components/tanstack-form-components/BaseAppForm";

const styles = defineStyles('FormComponentColorPicker', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  label: {
    color: theme.palette.greyAlpha(0.54),
    marginBottom: 4,
    fontSize: 10,
  },
}));

interface FormComponentColorPickerProps {
  field: TypedFieldApi<string | null>;
  label: string;
  disabled?: boolean;
}

export const FormComponentColorPicker = ({
  field,
  label,
  disabled,
}: FormComponentColorPickerProps) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      {label && <div className={classes.label}>{label}</div>}
      <input
        type="color"
        value={field.state.value || "#ffffff"}
        onChange={(e) => field.handleChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
