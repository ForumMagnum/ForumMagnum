import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Button, { ButtonProps } from '@material-ui/core/Button';
import classNames from 'classnames';
import { useTracking } from '../../lib/analyticsEvents';

const styles = (theme: ThemeType) => ({
  root: {
    minWidth: 30,
    fontSize: 14,
    lineHeight: '20px',
    textTransform: 'none',
    padding: '8px 12px',
    borderRadius: theme.borderRadius.default,
    boxShadow: 'none',
    '&:hover': {
      opacity: 1
    },
  },
  variantContained: {
    backgroundColor: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:disabled': {
      backgroundColor: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite,
      opacity: .5,
    }
  },
  greyContained: {
    backgroundColor: theme.palette.grey[250],
    color: theme.palette.grey[1000],
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    }
  },
  greyOutlined: {
    border: `1px solid ${theme.palette.border.eaButtonGreyOutline}`,
    color: theme.palette.grey[1000],
    "&:hover": {
      border: `1px solid ${theme.palette.grey[400]}`,
      backgroundColor: theme.palette.grey[200],
    },
  },
})

/**
 * Button component with the standard EA Forum styling
 * (see login and sign up site header buttons for example)
 */
const EAButton = ({style, variant="contained", eventProps, className, children, classes, ...buttonProps}: {
  style?: 'primary'|'grey',
  eventProps?: Record<string, string>,
  className?: string,
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
} & ButtonProps) => {
  const { captureEvent } = useTracking();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (buttonProps.href) {
      captureEvent('linkClicked', {to: buttonProps.href, ...eventProps})
    } else {
      captureEvent('buttonClicked', eventProps)
    }
    
    buttonProps.onClick?.(e)
  }

  return (
    <Button
      variant={variant}
      color="primary"
      className={classNames(classes.root, className, {
        [classes.variantContained]: variant === 'contained',
        [classes.greyContained]: variant === 'contained' && style === 'grey',
        [classes.greyOutlined]: variant === 'outlined' && style === 'grey',
      })}
      {...buttonProps}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

const EAButtonComponent = registerComponent(
  'EAButton', EAButton, {styles, stylePriority: -2}
)

declare global {
  interface ComponentTypes {
    EAButton: typeof EAButtonComponent
  }
}
