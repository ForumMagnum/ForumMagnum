import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { sectionTitleStyle } from '../common/SectionTitle';
import SubscribedHideReadCheckbox from './SubscribedHideReadCheckbox';
import { UltraFeedSettingsType } from './ultraFeedSettingsTypes';
import { useTracking } from '@/lib/analyticsEvents';
import { FeedType } from './ultraFeedTypes';

const styles = defineStyles('UltraFeedHeader', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    overflow: 'visible',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  leftMobileWithTitle: {
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'space-between',
      width: '100%',
    },
  },
  title: {
    ...sectionTitleStyle(theme),
    whiteSpace: 'nowrap',
  },
  hideTitle: {
    display: 'none'
  },
  titlePlaceholder: {
    width: 120,
    flex: '0 0 auto',
    justifyContent: 'flex-start',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginLeft: 16,
  },
  rightMobileWithTitle: {
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
    },
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    gap: 12,
    width: 120,
    flex: '0 0 auto',
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      width: 'unset',
    },
  },
  tabsBar: {
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 auto',
    gap: 0,
    marginLeft: 32,
    marginRight: 32,
    paddingBottom: 0,
    marginBottom: 0,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0,
    },
  },
  tabsBarMobileNoTitle: {
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 16,
    },
  },
  tabButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 600,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 16,
    paddingBottom: 16,
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s',
    flex: 1,
    '&:hover': {
      backgroundColor: theme.palette.background.hover,
    },
  },
  tabButtonMobileShort: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: 12,
      paddingBottom: 12,
    },
  },
  tabButtonInactive: {
    color: theme.palette.grey[600],
  },
  tabButtonActive: {
    color: theme.palette.text.primary,
  },
  tabLabel: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px',
  },
  settingsButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  settingsButtonContainerHideOnMobileWithTitle: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  settingsButtonContainerInline: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      marginLeft: 8,
    },
  },
  inlineSettingsHidden: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.grey[600],
    transition: 'opacity 0.3s ease, visibility 0.3s ease',
  },
  checkboxContainerHidden: {
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  checkboxInput: {
    padding: 4,
    color: theme.palette.grey[500],
  },
  checkboxLabel: {
    cursor: 'pointer',
    fontSize: '1.15rem',
    fontFamily: theme.typography.fontFamily,
    textWrap: 'nowrap',
  },
  rootMobileWithTitle: {
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
}));

type TabButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
};

const TabButton = ({ label, active, onClick, compact }: TabButtonProps) => {
  const classes = useStyles(styles);
  return (
    <div
      className={classNames(
        classes.tabButton,
        active ? classes.tabButtonActive : classes.tabButtonInactive,
        compact && classes.tabButtonMobileShort,
      )}
      onClick={onClick}
    >
      <div className={classes.tabLabel}>
        {label}
        {active && <div className={classes.tabUnderline} />}
      </div>
    </div>
  );
};

export type UltraFeedHeaderProps = {
  title: React.ReactNode;
  hideTitle?: boolean;
  activeTab: FeedType;
  onTabChange: (tab: FeedType) => void;
  settingsButton?: React.ReactNode;
  titleHref?: string;
  feedSettings?: UltraFeedSettingsType;
  updateFeedSettings?: (settings: Partial<UltraFeedSettingsType>) => void;
};

const UltraFeedHeader = ({
  title,
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
  
  return (
    <div className={classNames(classes.root, !hideTitle && classes.rootMobileWithTitle)}>
      <div className={classNames(classes.left, !hideTitle && classes.leftMobileWithTitle)}>
        <div className={classNames(classes.titlePlaceholder, !hideTitle && classes.hideTitle)} />
        <div className={classNames(classes.title, hideTitle && classes.hideTitle)}>
          {titleHref ? <Link to={titleHref}>{title}</Link> : title}
        </div>
        {settingsButton && !hideTitle && (
          <div className={classes.settingsButtonContainerInline}>{settingsButton}</div>
        )}
      </div>
      <div className={classNames(classes.right, !hideTitle && classes.rightMobileWithTitle)}>
        <div className={classNames(classes.tabsBar, hideTitle && classes.tabsBarMobileNoTitle)}>
          <TabButton
            label="For You"
            active={activeTab === 'ultraFeed'}
            onClick={() => onTabChange('ultraFeed')}
            compact={!hideTitle}
          />
          <TabButton
            label="Following"
            active={activeTab === 'following'}
            onClick={() => onTabChange('following')}
            compact={!hideTitle}
          />
        </div>
        <div className={classes.rightControls}>
          <SubscribedHideReadCheckbox
            checked={hideRead}
            onChange={handleHideReadToggle}
            visible={hideReadCheckboxVisible}
          />
          {settingsButton && (
            <div className={classNames(classes.settingsButtonContainer, !hideTitle && classes.settingsButtonContainerHideOnMobileWithTitle)}>
              {settingsButton}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UltraFeedHeader;


