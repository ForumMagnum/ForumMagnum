import React, { useState } from 'react';
import { ultraFeedEnabledSetting } from '../../lib/instanceSettings';
import { registerComponent } from "../../lib/vulcan-lib/components";
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import UltraFeedHeader from './UltraFeedHeader';
import SingleColumnSection from "../common/SingleColumnSection";
import { useCurrentUser } from '../common/withUser';
import SettingsButton from "../icons/SettingsButton";

import dynamic from 'next/dynamic';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ACTIVE_TAB_COOKIE } from '@/lib/cookies/cookies';
import { FeedType } from './ultraFeedTypes';
import { useTracking } from '@/lib/analyticsEvents';
import useUltraFeedSettings from '../hooks/useUltraFeedSettings';
const UltraFeedContent = dynamic(() => import('./UltraFeedContent'), { ssr: false });

const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
  disabledMessage: {
    textAlign: 'center',
    padding: 40,
    ...theme.typography.body1,
    color: theme.palette.text.dim,
  },
}));

const UltraFeed = ({
  alwaysShow = false,
  hideTitle = false,
  settingsVisible,
  onSettingsToggle,
}: {
  alwaysShow?: boolean
  hideTitle?: boolean
  settingsVisible?: boolean
  onSettingsToggle?: () => void
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [cookies, setCookie] = useCookiesWithConsent([ULTRA_FEED_ACTIVE_TAB_COOKIE]);
  const [internalSettingsVisible, setInternalSettingsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedType>(() => (cookies[ULTRA_FEED_ACTIVE_TAB_COOKIE] === 'following' ? 'following' : 'ultraFeed'));
  const { captureEvent } = useTracking();
  const { settings, updateSettings, resetSettings, truncationMaps } = useUltraFeedSettings();

  const handleTabChange = (tab: FeedType) => {
    setActiveTab(tab);
    setCookie(ULTRA_FEED_ACTIVE_TAB_COOKIE, tab, { path: '/' });
  };

  if (!currentUser) {
    return null;
  }

  if (!ultraFeedEnabledSetting.get()) {
    return (
      <SingleColumnSection>
        <div className={classes.disabledMessage}>
          The New Feed is currently disabled.
        </div>
      </SingleColumnSection>
    );
  }

  const isControlled = onSettingsToggle !== undefined;
  const actualSettingsVisible = isControlled ? settingsVisible : internalSettingsVisible;

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    captureEvent("ultraFeedSettingsToggled", { open: !actualSettingsVisible });
    if (isControlled) {
      onSettingsToggle?.();
    } else {
      setInternalSettingsVisible(!internalSettingsVisible);
    }
  };


  return (
    <>
      <SingleColumnSection>
        <UltraFeedHeader
          hideTitle={hideTitle}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          settingsButton={!isControlled ? <SettingsButton showIcon={true} onClick={toggleSettings} /> : undefined}
          feedSettings={settings}
          updateFeedSettings={updateSettings}
        />
        <DeferRender ssr={false}>
          <UltraFeedContent 
            settings={settings}
            updateSettings={updateSettings}
            resetSettings={resetSettings}
            truncationMaps={truncationMaps}
            alwaysShow={alwaysShow}
            settingsVisible={actualSettingsVisible}
            onCloseSettings={isControlled ? onSettingsToggle : () => setInternalSettingsVisible(false)}
            useExternalContainer={isControlled}
            activeTab={activeTab}
          />
        </DeferRender>
      </SingleColumnSection>
    </>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
