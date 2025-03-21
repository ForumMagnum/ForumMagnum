import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

const styles = defineStyles('FeedItemWrapper', (theme: ThemeType) => ({
  wrapper: {
    marginBottom: 0,
    borderBottom: '6px solid rgba(0,0,0,0.05)'
    // borderBottom: '3px solid rgba(0,0,0,0.10)'

  },
  sourceLabel: {
    display: 'flex',
    justifyContent: 'flex-start',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.1rem',
    // fontStyle: 'italic',
    color: theme.palette.lwTertiary.main,
    marginBottom: 4
  }
}));

// Map source codes to human-readable labels
const sourceLabels: Record<string, string> = {
  'quickTakes': 'Quick Take',
  'popularComments': 'Popular Comment',
  'subscribed': 'Subscribed Content',
  'commentThreads': 'Comment Thread'
};

const FeedItemWrapper = ({sources, children}: {
  sources: string[],
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  
  // Get human-readable labels for the sources
  const labels = sources.map(source => sourceLabels[source] || source);
  
  return (
    <div className={classes.wrapper}>
      {children}
      {/* <div className={classes.sourceLabel}>
        {labels.join(', ')}
      </div> */}
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
