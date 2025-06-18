import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

const styles = defineStyles('FeedItemWrapper', (theme: ThemeType) => ({
  wrapper: {
    marginBottom: 16,
    [theme.breakpoints.down('sm')]: {
      marginBottom: 0,
      borderBottom: theme.palette.ultraFeed.cardSeparator
    }
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

export default registerComponent('FeedItemWrapper', FeedItemWrapper);



 
