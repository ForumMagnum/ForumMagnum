import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  wrapper: {
    marginBottom: 24,
    gap: 4,
  },
  sourceLabel: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.1rem',
    fontStyle: 'italic',
    color: theme.palette.primary.main,
    marginBottom: 4
  }
});

// Map source codes to human-readable labels
const sourceLabels: Record<string, string> = {
  'quickTakes': 'Quick Take',
  'popularComments': 'Popular Comment'
};

const FeedItemWrapper = ({classes, sources, children}: {
  classes: ClassesType<typeof styles>,
  sources: string[],
  children: React.ReactNode
}) => {
  // Get human-readable labels for the sources
  const labels = sources.map(source => sourceLabels[source] || source);
  
  return (
    <div className={classes.wrapper}>
      <div className={classes.sourceLabel}>
        {labels.join(', ')}
      </div>
      {children}
    </div>
  );
};

const FeedItemWrapperComponent = registerComponent('FeedItemWrapper', FeedItemWrapper, {styles});

declare global {
  interface ComponentTypes {
    FeedItemWrapper: typeof FeedItemWrapperComponent
  }
} 
