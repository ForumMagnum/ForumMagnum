import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    display: "flex",
    alignItems: "center",
    '& svg': {
      marginRight: theme.spacing.unit
    },
  }
})

const SectionButton = ({children, classes, className}: {
  children?: React.ReactNode,
  classes: ClassesType,
  className?: string,
}) => {
  return <Typography component='span' variant='body2' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

const SectionButtonComponent = registerComponent('SectionButton', SectionButton, {styles})

declare global {
  interface ComponentTypes {
    SectionButton: typeof SectionButtonComponent
  }
}
