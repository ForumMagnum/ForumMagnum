import React from 'react';
import classNames from 'classnames';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface FormGroupProps
  extends StandardProps<React.HtmlHTMLAttributes<HTMLDivElement>, FormGroupClassKey> {
  row?: boolean;
}

export type FormGroupClassKey = 'root' | 'row';

export const styles = defineStyles("MuiFormGroup", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  /* Styles applied to the root element if `row={true}`. */
  row: {
    flexDirection: 'row',
  },
}), {stylePriority: -10});

/**
 * `FormGroup` wraps controls such as `Checkbox` and `Switch`.
 * It provides compact row layout.
 * For the `Radio`, you should be using the `RadioGroup` component instead of this one.
 */
function FormGroup(props: FormGroupProps) {
  const { classes: classesOverride, className, children, row, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <div
      className={classNames(
        classes.root,
        {
          [classes.row]: row,
        },
        className,
      )}
      {...other}
    >
      {children}
    </div>
  );
}

FormGroup.defaultProps = {
  row: false,
};

export default FormGroup;
