import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { UltraFeedSettingsType } from './ultraFeedSettingsTypes';
import { MiscSettings } from './settingsComponents/UltraFeedSettingsComponents';
import ForumIcon from '../common/ForumIcon';

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

  const handleIncognitoChange = (field: 'incognitoMode', checked: boolean) => {
    updateSettings({
      resolverSettings: {
        ...settings.resolverSettings,
        incognitoMode: checked,
      },
    });
  };

  return (
    <div className={classes.root}>
      <MiscSettings
        formValues={{
          incognitoMode: settings.resolverSettings.incognitoMode,
        }}
        onBooleanChange={handleIncognitoChange}
        defaultOpen={true}
      />
    </div>
  );
};

export default UltraFeedFollowingSettings;
