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

export const ColorPicker = ({ value, onChange, disabled, label }: {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      {label && <div className={classes.label}>{label}</div>}
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

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
  return <ColorPicker
    value={field.state.value}
    onChange={(value) => field.handleChange(value)}
    disabled={disabled}
    label={label}
  />
}
