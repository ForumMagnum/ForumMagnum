import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';

/**
 * reimplementation of the ToggleButtonGroup from material-ui
 * with the styles of the DistanceUnitToggle.
 *
 * should be replaced with the official material-ui component
 * after update to material-ui v5.
 *
 *
 */

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    display: 'inline-block',
    ...theme.typography.commentStyle,
  },
}))

const ToggleButtonGroup = (
  {classes, className = '', children, value, onChange, name}:{classes: ClassesType, className?: string, children: any, value: string, onChange: Function, name?: string}
) => {

  if (!name) {
    name = `toggle-button-group-name-${Math.random()}`
  }
  const childrenWithProps = children.map((child: any, index: number) => {
    return React.cloneElement(child, {
      selectedValue: value,
      onChange: (e: any, value: string) => onChange(e, value),
      name,
      key: index
    })
  });

  return <div className={classes.root + ' ' + className}>{childrenWithProps}</div>
};

export default withStyles(styles)(ToggleButtonGroup);
