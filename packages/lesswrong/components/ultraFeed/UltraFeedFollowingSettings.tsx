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
  closeButton: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeIcon: {
    fontSize: 20,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    padding: 8,
    borderRadius: 4,
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
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
      <div className={classes.closeButton}>
        <ForumIcon icon="Close" className={classes.closeIcon} onClick={onClose} />
      </div>
      
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
