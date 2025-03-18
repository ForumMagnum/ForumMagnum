import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../../components/hooks/useStyles';

const styles = defineStyles('FeedItemWrapper', (theme: ThemeType) => ({
  wrapper: {
    marginBottom: 32,
    gap: 4,
    paddingLeft: 8,
    borderRadius: 2,
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
      {/* <div className={classes.sourceLabel}>
        {labels.join(', ')}
      </div> */}
      {children}
    </div>
  );
};

const FeedItemWrapperComponent = registerComponent('FeedItemWrapper', FeedItemWrapper);

declare global {
  interface ComponentTypes {
    FeedItemWrapper: typeof FeedItemWrapperComponent
  }
} 
