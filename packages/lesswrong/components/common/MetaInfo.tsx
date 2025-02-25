import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'

export const styles = (theme: ThemeType) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: theme.spacing.unit,
    fontSize: "1rem"
  },
  button: {
    cursor: "pointer",
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[400],
    },
  }
})

const MetaInfo = ({children, classes, button, className}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
  button?: boolean,
  className?: string
  title?: string,
}) => {
  return <Components.Typography
    component='span'
    className={classNames(classes.root, button && classes.button, className)}
    variant='body2'>
      {children}
  </Components.Typography>
}

const MetaInfoComponent = registerComponent('MetaInfo', MetaInfo, {styles});

declare global {
  interface ComponentTypes {
    MetaInfo: typeof MetaInfoComponent
  }
}
