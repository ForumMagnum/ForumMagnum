import React, { useCallback } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { sectionTitleStyle } from '../common/SectionTitle';
import HideReadToggleIcon from './HideReadToggleIcon';
import { UltraFeedSettingsType } from './ultraFeedSettingsTypes';
import { useTracking } from '@/lib/analyticsEvents';
import { FeedType } from './ultraFeedTypes';
import TabButton from '../common/TabButton';

const styles = defineStyles('UltraFeedHeader', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 8,
    rowGap: 8,
    overflow: 'visible',
    [theme.breakpoints.down('sm')]: {
      flexWrap: 'wrap',
    },
  },
  title: {
    ...sectionTitleStyle(theme),
    whiteSpace: 'nowrap',
    flex: '1 1 0',
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      flex: '1 1 100%',
    },
  },
  hideTitle: {
    display: 'none'
  },
  tabsAndControls: {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'contents',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      alignItems: 'center',
      flex: '1 1 100%',
    },
  },
  tabs: {
    display: 'flex',
    gap: 8,
    flexWrap: 'nowrap',
    minWidth: 0,
    flex: '1 1 auto',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      flex: '1 1 auto',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
  },
  controlsContainer: {
    flex: '1 1 0',
    display: 'flex',
    justifyContent: 'flex-end',
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      flex: '0 0 auto',
      marginLeft: 'auto',
    },
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '0 0 auto',
  },
  leftSpacer: {
    flex: '1 1 0',
    minWidth: 0,
  },
}));

export type UltraFeedHeaderProps = {
  title?: string;
  hideTitle?: boolean;
  activeTab: FeedType;
  onTabChange: (tab: FeedType) => void;
  settingsButton?: React.ReactNode;
  titleHref?: string;
  feedSettings?: UltraFeedSettingsType;
  updateFeedSettings?: (settings: Partial<UltraFeedSettingsType>) => void;
};

const UltraFeedHeader = ({
  title = 'Your Feed',
  hideTitle,
  activeTab,
  onTabChange,
  settingsButton,
  titleHref,
  feedSettings,
  updateFeedSettings,
}: UltraFeedHeaderProps) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();

  const handleHideReadToggle = useCallback((checked: boolean) => {
    if (updateFeedSettings && feedSettings) {
      updateFeedSettings({
        resolverSettings: {
          ...feedSettings.resolverSettings,
          subscriptionsFeedSettings: {
            ...feedSettings.resolverSettings.subscriptionsFeedSettings,
            hideRead: checked
          }
        }
      });
      captureEvent('ultraFeedHideReadToggled', { hideRead: checked });
    }
  }, [feedSettings, updateFeedSettings, captureEvent]);
  
  const hideReadCheckboxVisible = !!(activeTab === 'following' && feedSettings && updateFeedSettings);
  const hideRead = feedSettings?.resolverSettings?.subscriptionsFeedSettings?.hideRead ?? false;

  // When title is hidden, keep tabs centered and controls on the right
  if (hideTitle) {
    return (
      <div className={classes.root}>
        <div className={classes.leftSpacer} />
        <div className={classes.tabsAndControls}>
          <div className={classes.tabs}>
            <TabButton
              label="For You"
              isActive={activeTab === 'ultraFeed'}
              onClick={() => onTabChange('ultraFeed')}
              showTooltip={false}
            />
            <TabButton
              label="Following"
              isActive={activeTab === 'following'}
              onClick={() => onTabChange('following')}
              showTooltip={false}
            />
          </div>
          <div className={classes.controlsContainer}>
            <div className={classes.controls}>
              <HideReadToggleIcon
                checked={hideRead}
                onChange={handleHideReadToggle}
                visible={hideReadCheckboxVisible}
              />
              {settingsButton}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When title is shown
  return (
    <div className={classes.root}>
      <div className={classes.title}>
        {titleHref ? <Link to={titleHref}>{title}</Link> : title}
      </div>
      <div className={classes.tabsAndControls}>
        <div className={classes.tabs}>
          <TabButton
            label="For You"
            isActive={activeTab === 'ultraFeed'}
            onClick={() => onTabChange('ultraFeed')}
            showTooltip={false}
          />
          <TabButton
            label="Following"
            isActive={activeTab === 'following'}
            onClick={() => onTabChange('following')}
            showTooltip={false}
          />
        </div>
        <div className={classes.controlsContainer}>
          <div className={classes.controls}>
            <HideReadToggleIcon
              checked={hideRead}
              onChange={handleHideReadToggle}
              visible={hideReadCheckboxVisible}
            />
            {settingsButton}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraFeedHeader;



