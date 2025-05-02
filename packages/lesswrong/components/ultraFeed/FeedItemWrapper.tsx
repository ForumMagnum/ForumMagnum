import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

const styles = defineStyles('FeedItemWrapper', (theme: ThemeType) => ({
  wrapper: {
    marginBottom: 8,
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

const FeedItemWrapperComponent = registerComponent('FeedItemWrapper', FeedItemWrapper);

export default FeedItemWrapperComponent;

declare global {
  interface ComponentTypes {
    FeedItemWrapper: typeof FeedItemWrapperComponent
  }
} 
