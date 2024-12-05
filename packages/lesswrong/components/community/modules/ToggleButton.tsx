import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

/**
 * To be used together with ToggleButtonGroup.
 *
 * Should be replace with the official material-ui component
 * after update to material-ui v5.
 */

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {},
  radio: {
    display: 'none'
  },
  label: {
    padding: '5px 10px',
    cursor: 'pointer',
    border: `1px solid ${theme.palette.grey[315]}`,
    'white-space': 'nowrap',
    '&:first-of-type': {
      borderRadius: '4px 0 0 4px',
    },
    '&:last-of-type': {
      borderRadius: '0 4px 4px 0'
    },
    '&.selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.text.invertedBackgroundText,
      borderColor: theme.palette.primary.dark,
    },
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.text.invertedBackgroundText,
      borderColor: theme.palette.primary.dark,
    }
  },
}))

const ToggleButton = (
  { classes, children, value, onChange = () => {}, selectedValue, name }: {
    classes: ClassesType, children: any, value: string, onChange?: Function, selectedValue?: string, name?: string
  }
) => {

  // What is the established pattern for generating IDs in this repo?
  const uniqueId = `toggle-button-${Math.random()}`;

  return <React.Fragment>
    <input
      type="radio"
      className={classes.radio}
      id={uniqueId}
      value={value}
      checked={value === selectedValue}
      onChange={(e) => onChange(e, value)}
      name={name}
    />
    <label
      htmlFor={uniqueId}
      className={classNames(classes.label, {'selected': value === selectedValue})}
    >{children}</label>
  </React.Fragment>
}

export default withStyles(styles)(ToggleButton);
