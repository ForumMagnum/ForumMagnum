import React from 'react';
import SettingsSection from './SettingsSection';
import NewFeedButton from '@/components/rss/NewFeedButton';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('RSSImportSection', (_theme: ThemeType) => ({
  buttonRow: {
    padding: '12px 0',
  },
}));

const RSSImportSection = ({currentUser}: {
  currentUser: UsersCurrent;
}) => {
  const classes = useStyles(styles);

  return (
    <SettingsSection
      title="RSS Import"
      description="Import posts from your RSS feed into your account."
    >
      <div className={classes.buttonRow}>
        <NewFeedButton user={currentUser} label="Create RSS Import" />
      </div>
    </SettingsSection>
  );
};

export default RSSImportSection;
