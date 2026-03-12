import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { UltraFeedSettingsType, UltraFeedAlgorithm } from './ultraFeedSettingsTypes';

const styles = defineStyles('UltraFeedFollowingSettings', (theme: ThemeType) => ({
  root: {
    width: '100%',
    maxWidth: 800,
    fontFamily: theme.typography.fontFamily,
  },
}));

interface UltraFeedFollowingSettingsProps {
  settings: UltraFeedSettingsType;
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void;
  onClose: () => void;
}

const UltraFeedFollowingSettings = ({ 
  settings, 
  updateSettings, 
  onClose 
}: UltraFeedFollowingSettingsProps) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      There are no settings for the Following feed at this time.
    </div>
  );
};

export default UltraFeedFollowingSettings;
