import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

const styles = defineStyles('FeedItemWrapper', (theme: ThemeType) => ({
  wrapper: {
    marginBottom: 0,
    borderBottom: '2px solid rgba(0,0,0,0.05)'

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
