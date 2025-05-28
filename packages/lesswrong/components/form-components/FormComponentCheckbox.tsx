import React from 'react';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { Typography } from "../common/Typography";

const styles = defineStyles('FormComponentCheckbox', (theme: ThemeType) => ({
  root: {
    marginRight: theme.spacing.unit * 3,
    marginLeft: 0,
    marginTop: 5,
    display: "flex",
    alignItems: "center"
  },
  size: {
    width: 36,
    height: 0,
  },
  inline: {
    display: "inline",
    cursor: "pointer",
  },
}));

export interface FormComponentCheckboxProps {
  field: TypedFieldApi<boolean> | TypedFieldApi<boolean | null | undefined>;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const FormComponentCheckbox = ({
  field,
  label,
  disabled = false,
  className,
}: FormComponentCheckboxProps) => {
  const classes = useStyles(styles);

  // For some reason the `htmlFor` attribute doesn't seem to make the label clickable,
  // so I've gone ahead and wrapped the checkbox in a FormControlLabel.
  const id = `checkbox-${field.name}`;

  const checkbox = <Checkbox
    id={id}
    className={classes.size}
    checked={!!field.state.value}
    onChange={(_, checked) => field.handleChange(checked)}
    onBlur={field.handleBlur}
    disabled={disabled}
    disableRipple
  />;

  const displayedLabel = label && <Typography htmlFor={id} className={classes.inline} variant="body2" component="label">{label}</Typography>;

  return (
    <FormControlLabel
      className={classNames(classes.root, className)}
      control={checkbox}
      label={displayedLabel}
    />
  );
}

export default registerComponent('FormComponentCheckbox', FormComponentCheckbox);


