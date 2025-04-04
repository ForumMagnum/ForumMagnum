import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("DialogContent", (theme) => ({
  /* Styles applied to the root element. */
  root: {
    flex: '1 1 auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch', // Add iOS momentum scrolling.
    padding: '0 24px 24px',
    '&:first-child': {
      paddingTop: 24,
    },
    
    ...(theme.forumType === "LessWrong" && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 15.08,
      lineHeight: "1.5em"
    }),
  },
}));

export function DialogContent(props: {
  className?: string,
  children: React.ReactNode,
}) {
  const classes = useStyles(styles);
  const { children, className } = props;

  return (
    <div className={classNames(classes.root, className)}>
      {children}
    </div>
  );
}

