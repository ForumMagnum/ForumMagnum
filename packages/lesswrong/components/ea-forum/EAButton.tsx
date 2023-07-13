import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Button, { ButtonProps } from '@material-ui/core/Button';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    fontSize: 14,
    lineHeight: '20px',
    textTransform: 'none',
    padding: '8px 12px',
    borderRadius: theme.borderRadius.default,
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      opacity: 1
    }
  },
  grey: {
    backgroundColor: theme.palette.grey[250],
    color: theme.palette.grey[1000],
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    }
  }
})

/**
 * Button component with the standard EA Forum styling
 * (see login and sign up site header buttons for example)
 */
const EAButton = ({style, className, children, classes, ...buttonProps}: {
  style?: 'primary'|'grey',
  className?: string,
  children: React.ReactNode,
  classes: ClassesType
} & ButtonProps) => {

  return (
    <Button
      variant="contained"
      color="primary"
      className={classNames(classes.root, className, {[classes.grey]: style === 'grey'})}
      {...buttonProps}
    >
      {children}
    </Button>
  )
}

const EAButtonComponent = registerComponent(
  'EAButton', EAButton, {styles, stylePriority: -1}
)

declare global {
  interface ComponentTypes {
    EAButton: typeof EAButtonComponent
  }
}
