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
import InfoButton from '../icons/InfoButton';
const UltraFeedContent = dynamic(() => import('./UltraFeedContent'), { ssr: false });

const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
  },
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
  const [internalInfoVisible, setInternalInfoVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedType>(() => (cookies[ULTRA_FEED_ACTIVE_TAB_COOKIE] === 'following' ? 'following' : 'ultraFeed'));
  const { captureEvent } = useTracking();
  const { settings, updateSettings, resetSettings, truncationMaps } = useUltraFeedSettings();

  const handleTabChange = (tab: FeedType) => {
    setActiveTab(tab);
    setCookie(ULTRA_FEED_ACTIVE_TAB_COOKIE, tab, { path: '/' });
    // Close info panel when switching to Following tab
    if (tab === 'following' && internalInfoVisible) {
      setInternalInfoVisible(false);
    }
    captureEvent("ultraFeedTabChanged", { tab });
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
      if (!internalSettingsVisible && internalInfoVisible) {
        setInternalInfoVisible(false);
      }
    }
  };

  const toggleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    captureEvent("ultraFeedInfoToggled", { open: !internalInfoVisible });
    setInternalInfoVisible(!internalInfoVisible);
    // Close settings when opening info
    if (!internalInfoVisible && internalSettingsVisible) {
      setInternalSettingsVisible(false);
    }
  };


  return (
    <>
      <SingleColumnSection>
        <UltraFeedHeader
          hideTitle={hideTitle}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          settingsButton={!isControlled ? (
            <div className={classes.headerButtons}>
              {activeTab === 'ultraFeed' && <InfoButton onClick={toggleInfo} isActive={internalInfoVisible} tooltip="What is the For You feed?" />}
              <SettingsButton showIcon={true} onClick={toggleSettings} />
            </div>
          ) : undefined}
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
            infoVisible={internalInfoVisible}
            useExternalContainer={isControlled}
            activeTab={activeTab}
          />
        </DeferRender>
      </SingleColumnSection>
    </>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
