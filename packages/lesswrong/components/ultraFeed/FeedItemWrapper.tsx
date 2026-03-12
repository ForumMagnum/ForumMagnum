import React from 'react';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

const styles = defineStyles('FeedItemWrapper', (theme: ThemeType) => ({
  wrapper: {
    '&:not(:empty)': {
      marginBottom: 16,
      [theme.breakpoints.down('sm')]: {
        marginBottom: 0,
        borderBottom: theme.palette.ultraFeed.cardSeparator,
      }
    },
  },
}));

const FeedItemWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  
  return (
    <div className={classes.wrapper}>
      {children}
    </div>
  );
};

export default FeedItemWrapper;
