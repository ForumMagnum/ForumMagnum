import React from 'react';
import classNames from 'classnames';
import { capitalize } from '../utils/helpers';
import { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useTheme } from '@/components/themes/useTheme';

export interface NotchedOutlineProps extends StandardProps<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, NotchedOutlineClassKey> {
  disabled?: boolean;
  error?: boolean;
  focused?: boolean;
  labelWidth: number;
  notched: boolean;
}

export type NotchedOutlineClassKey = 'root' | 'legend' | 'focused' | 'error' | 'disabled';

export const styles = defineStyles("MuiNotchedOutline", theme => {
  const light = theme.palette.type === 'light';
  const align = theme.direction === 'rtl' ? 'right' : 'left';

  return {
    /* Styles applied to the root element. */
    root: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      top: 0,
      left: 0,
      margin: 0,
      padding: 0,
      pointerEvents: 'none',
      borderRadius: theme.shape.borderRadius,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: light ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
      // Match the Input Label
      transition: theme.transitions.create([`padding-${align}`, 'border-color', 'border-width'], {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeOut,
      }),
    },
    /* Styles applied to the legend element. */
    legend: {
      textAlign: 'left',
      padding: 0,
      transition: theme.transitions.create('width', {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeOut,
      }),
      // Firefox workaround. Firefox will only obscure the
      // rendered height of the legend and, unlike other browsers,
      // will not push fieldset contents.
      '@supports (-moz-appearance:none)': {
        height: 2,
      },
    },
    /* Styles applied to the root element if the control is focused. */
    focused: {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    /* Styles applied to the root element if `error={true}`. */
    error: {
      borderColor: theme.palette.error.main,
    },
    /* Styles applied to the root element if `disabled={true}`. */
    disabled: {
      borderColor: theme.palette.action.disabled,
    },
  };
}, {stylePriority: -10});

/**
 * @ignore - internal component.
 */
function NotchedOutline(props: NotchedOutlineProps) {
  const {
    children,
    classes: classesOverride,
    className,
    disabled,
    error,
    focused,
    labelWidth: labelWidthProp,
    notched,
    style,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);
  const theme = useTheme();

  const align = theme.direction === 'rtl' ? 'right' : 'left';
  const labelWidth = labelWidthProp > 0 ? labelWidthProp * 0.75 + 8 : 0;

  return (
    <fieldset
      aria-hidden
      style={{
        [`padding${capitalize(align)}`]: 8 + (notched ? 0 : labelWidth / 2),
        ...style,
      }}
      className={classNames(
        classes.root,
        {
          [classes.focused]: focused,
          [classes.error]: error,
          [classes.disabled]: disabled,
        },
        className,
      )}
      {...other}
    >
      <legend
        className={classes.legend}
        style={{
          // IE 11: fieldset with legend does not render
          // a border radius. This maintains consistency
          // by always having a legend rendered
          width: notched ? labelWidth : 0.01,
        }}
      />
    </fieldset>
  );
}

export default NotchedOutline;
