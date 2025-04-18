import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isFriendlyUI } from '@/themes/forumTheme';
import { Components } from '@/lib/vulcan-lib/components';
import { Paper } from './Paper';

export const styles = defineStyles("MuiSnackbarContent", theme => {
  return {
    /* Styles applied to the root element. */
    root: {
      backgroundColor: theme.palette.panelBackground.default,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      padding: '6px 24px',
      [theme.breakpoints.up('md')]: {
        minWidth: 288,
        maxWidth: 568,
        borderRadius: 4,
      },
      [theme.breakpoints.down('sm')]: {
        flexGrow: 1,
      },
    },
    /* Styles applied to the message wrapper element. */
    message: {
      padding: '8px 0',
      color: theme.palette.text.maxIntensity,
      fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
    },
    /* Styles applied to the action wrapper element if `action` is provided. */
    action: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      paddingLeft: 24,
      marginRight: -8,
    },
  };
});

// Derived from material-UI SnackbarContent

export function SnackbarContent({action, className, message}: {
  action: any
  className?: string
  message: React.ReactNode
}) {
  const classes = useStyles(styles);
  const { Typography } = Components;

  return (
    <Paper
      square
      elevation={6}
      className={classNames(classes.root, className)}
    >
      <Typography variant="body1">
        <div className={classes.message}>{message}</div>
        {action ? <div className={classes.action}>{action}</div> : null}
      </Typography>
    </Paper>
  );
}

