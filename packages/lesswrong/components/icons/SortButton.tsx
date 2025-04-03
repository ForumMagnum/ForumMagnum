import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import SwapVert from '@/lib/vendor/@material-ui/icons/src/SwapVert';

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.grey[600],
    fontSize: 18,
  },
  iconWithLabelGroup: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  iconWithLabel: {
    marginRight: 4,
  },
  label: {
    ...theme.typography.body2,
    fontSize: 14,
    color: theme.palette.grey[600],
  },
})

const SortButton = ({classes, className, onClick, showIcon=true, label=""}: {
  classes: ClassesType<typeof styles>,
  className?: string,
  onClick?: any,
  label?: JSX.Element|string,
  showIcon?: boolean
}) => {
  if (label) {
    return <span className={classes.iconWithLabelGroup} onClick={onClick}>
      {showIcon && <SwapVert className={classNames(classes.icon, classes.iconWithLabel, className)}/>}
      <span className={classes.label}>{ label }</span>
    </span>
  }
  return <SwapVert className={classNames(classes.icon, className)} onClick={onClick}/>
}

const SortButtonComponent = registerComponent('SortButton', SortButton, {styles});

declare global {
  interface ComponentTypes {
    SortButton: typeof SortButtonComponent
  }
}
