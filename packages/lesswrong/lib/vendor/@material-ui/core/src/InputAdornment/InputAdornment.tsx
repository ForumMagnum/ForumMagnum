import React from 'react';
import classNames from 'classnames';
import Typography from '../Typography';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface InputAdornmentProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, InputAdornmentClassKey> {
  component?: React.ComponentType<InputAdornmentProps>;
  disableTypography?: boolean;
  position: 'start' | 'end';
  children?: React.ReactNode
}

export type InputAdornmentClassKey = 'root' | 'positionStart' | 'positionEnd' | 'filled';

export const styles = defineStyles("MuiInputAdornment", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    height: '0.01em', // Fix IE 11 flexbox alignment. To remove at some point.
    maxHeight: '2em',
    alignItems: 'center',
  },
  /* Styles applied to the root element if `variant="filled"` */
  filled: {
    '&$positionStart': {
      marginTop: 16,
    },
  },
  /* Styles applied to the root element if `position="start"`. */
  positionStart: {
    marginRight: 8,
  },
  /* Styles applied to the root element if `position="end"`. */
  positionEnd: {
    marginLeft: 8,
  },
}), {stylePriority: -10});

export function InputAdornment(props: InputAdornmentProps) {
  const {
    children,
    component: Component,
    className,
    disableTypography,
    position,
    variant,
    ...other
  } = props;
  const classes = useStyles(styles, props.classes);

  return (
    <Component
      className={classNames(
        classes.root,
        {
          [classes.filled]: variant === 'filled',
          [classes.positionStart]: position === 'start',
          [classes.positionEnd]: position === 'end',
        },
        className,
      )}
      {...other}
    >
      {typeof children === 'string' && !disableTypography ? (
        <Typography color="textSecondary">{children}</Typography>
      ) : (
        children
      )}
    </Component>
  );
}

InputAdornment.defaultProps = {
  component: 'div',
  disableTypography: false,
};
