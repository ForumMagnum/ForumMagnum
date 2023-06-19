import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames'
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    display: "flex",
    alignItems: "center",
    ...(isEAForum ? {fontWeight: 600} : {}),
    '& svg': {
      marginRight: theme.spacing.unit
    },
  }
})

const SectionButton = ({children, classes, className, onClick}: {
  children?: React.ReactNode,
  classes: ClassesType,
  className?: string,
  onClick?: (event: React.MouseEvent) => void,
}) => {
  return <Components.Typography
    component='span'
    variant='body2'
    className={classNames(classes.root, className)}
    onClick={onClick}
  >
    {children}
  </Components.Typography>
}

const SectionButtonComponent = registerComponent('SectionButton', SectionButton, {styles})

declare global {
  interface ComponentTypes {
    SectionButton: typeof SectionButtonComponent
  }
}
