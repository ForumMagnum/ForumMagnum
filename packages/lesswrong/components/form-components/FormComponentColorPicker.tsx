import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  label: {
    color: theme.palette.greyAlpha(0.54),
    marginBottom: 4,
    fontSize: 10,
  },
});

type FormComponentColorPickerProps = FormComponentProps<number> & {
  classes: ClassesType<typeof styles>,
}

export const FormComponentColorPicker = ({
  value,
  label,
  updateCurrentValues,
  path,
  disabled,
  classes,
}: FormComponentColorPickerProps) => {
  const onChange = useCallback(async (ev) => {
    await updateCurrentValues({
      [path]: ev.target.value,
    });
  }, [updateCurrentValues, path]);
  return (
    <div className={classes.root}>
      {label && <div className={classes.label}>{label}</div>}
      <input
        type="color"
        value={value ?? "#ffffff"}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

const FormComponentColorPickerComponent = registerComponent(
  "FormComponentColorPicker",
  FormComponentColorPicker,
  {styles},
);

declare global {
  interface ComponentTypes {
    FormComponentColorPicker: typeof FormComponentColorPickerComponent
  }
}
