import React, { useState } from 'react';
import { ultraFeedEnabledSetting } from '../../lib/instanceSettings';
import { registerComponent } from "../../lib/vulcan-lib/components";
import DeferRender from '../common/DeferRender';
import SingleColumnSection from "../common/SingleColumnSection";
import { useCurrentUser } from '../common/withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SettingsButton from "../icons/SettingsButton";
import FeedSelectorDropdown from '../common/FeedSelectorCheckbox';
import { Link } from '../../lib/reactRouterWrapper';

import dynamic from 'next/dynamic';
import { useTracking } from '@/lib/analyticsEvents';
import SectionTitle from '../common/SectionTitle';
const UltraFeedContent = dynamic(() => import('./UltraFeedContent'), { ssr: false });

const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
  root: {
  },
  feedComementItem: {
    marginBottom: 16
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    display: 'flex',
    columnGap: 10,
    alignItems: 'center',
    color: theme.palette.text.bannerAdOverlay,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 8,
    },
  },
  titleText: {
  },
  titleTextDesktop: {
    display: 'inline',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  titleTextMobile: {
    display: 'none',
    marginLeft: 8,
    [theme.breakpoints.down('sm')]: {
      display: 'inline',
    },
  },
  feedCheckboxAndSettingsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // gap: 24, // Add spacing between items
  },
  settingsButtonContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  ultraFeedNewContentContainer: {
  },
  settingsContainer: {
    marginBottom: 32,
  },
  settingsContainerExternal: {
    marginTop: 16,
    marginBottom: 32,
  },
  composerButton: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      position: 'fixed',
      bottom: 18,
      right: 18,
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme.palette.boxShadow.default,
      cursor: 'pointer',
      zIndex: theme.zIndexes.intercomButton,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
      '&:active': {
        transform: 'scale(0.95)',
      },
    },
  },
  composerIcon: {
    fontSize: 24,
  },
  disabledMessage: {
    textAlign: 'center',
    padding: 40,
    ...theme.typography.body1,
    color: theme.palette.text.dim,
  },
  titleLink: {
    color: 'inherit',
    '&:hover': {
      color: 'inherit',
      opacity: 0.8,
    },
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
  const [internalSettingsVisible, setInternalSettingsVisible] = useState(false);
  const { captureEvent } = useTracking();

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

  const customTitle = <>
    <div className={classes.titleContainer}>
      <span className={classes.titleText}>
        <Link to="/feed" className={classes.titleLink}>
          Update Feed
        </Link>
      </span>
    </div>
  </>;

  return (
    <>
      <SingleColumnSection>
        {!hideTitle && (
          <SectionTitle title={customTitle} titleClassName={classes.sectionTitle}>
            <DeferRender ssr={false}>
              <div className={classes.feedCheckboxAndSettingsContainer}>
                {!alwaysShow && <FeedSelectorDropdown currentFeedType="new" />}
                {!isControlled && (
                  <div className={classes.settingsButtonContainer}>
                    <SettingsButton 
                      showIcon={true}
                      onClick={toggleSettings}
                    />
                  </div>
                )}
              </div>
            </DeferRender>
          </SectionTitle>
        )}
        <DeferRender ssr={false}>
          <UltraFeedContent 
            alwaysShow={alwaysShow}
            settingsVisible={actualSettingsVisible}
            onCloseSettings={isControlled ? onSettingsToggle : () => setInternalSettingsVisible(false)}
            useExternalContainer={isControlled}
          />
        </DeferRender>
      </SingleColumnSection>
    </>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
