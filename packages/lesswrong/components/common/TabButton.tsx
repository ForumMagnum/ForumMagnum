import React from 'react';
import classNames from 'classnames';
import { registerComponent } from '../../lib/vulcan-lib/components';
import LWTooltip from './LWTooltip';
import ForumIcon from './ForumIcon';

const styles = (theme: ThemeType) => ({
  tab: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '120px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '23px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: 3,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    position: 'relative',
    transition: 'all 0.2s',
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
      padding: '3px 6px',
      minWidth: '100px',
    }
  },
  inactiveTab: {
    ...(theme.dark ? {
      backgroundColor: theme.palette.tab.inactive.bannerAdBackground,
      backdropFilter: theme.palette.filters.bannerAdBlurMedium,
      color: theme.palette.text.bannerAdOverlay,
    } : {
      backgroundColor: theme.palette.panelBackground.default,
      color: theme.palette.tab.inactive.text,
    }),
    '&:hover': {
      color: theme.palette.tab.inactive.hover.text
    },
  },
  activeTab: {
    backgroundColor: theme.palette.tab.active.background,
    color: theme.palette.text.alwaysWhite,
    backdropFilter: theme.palette.filters.bannerAdBlurMedium,
    '&:hover': {
      backgroundColor: theme.palette.tab.active.hover.background
    },
  },
  labsIcon: {
    marginLeft: 3,
    alignSelf: 'center',
    height: 14,
    width: 14,
    [theme.breakpoints.down('xs')]: {
      height: 13,
      width: 13,
    }
  },
  sparkleIcon: {
    marginLeft: 3,
    alignSelf: 'center',
    height: 18,
    width: 18,
    [theme.breakpoints.down('xs')]: {
      height: 13,
      width: 13,
    }
  },
  personIcon: {
    position: 'relative',
    top: 1,
    marginLeft: 2,
    alignSelf: 'center',
    height: 16,
    width: 16,
  },
  tagDescriptionTooltip: {
    margin: 8,
  },
});

export interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  description?: string | null;
  showLabsIcon?: boolean;
  showSparkleIcon?: boolean;
  showPersonIcon?: boolean;
  className?: string;
  showTooltip?: boolean;
}

/**
 * A reusable tab button component with pill-style background
 * Used in TabPicker and other tab interfaces
 */
const TabButton = ({
  label,
  isActive,
  onClick,
  description,
  showLabsIcon,
  showSparkleIcon,
  showPersonIcon,
  className,
  showTooltip = true,
  classes,
}: TabButtonProps & {
  classes: ClassesType<typeof styles>;
}) => {
  const buttonContent = (
    <button
      onClick={onClick}
      className={classNames(
        classes.tab,
        isActive ? classes.activeTab : classes.inactiveTab,
        className
      )}
    >
      {label}
      {showLabsIcon && <ForumIcon icon="LabBeaker" className={classes.labsIcon} />}
      {showSparkleIcon && <ForumIcon icon="Sparkle" className={classes.sparkleIcon} />}
      {showPersonIcon && <ForumIcon icon="User" className={classes.personIcon} />}
    </button>
  );

  if (showTooltip && description) {
    return (
      <LWTooltip
        title={description}
        popperClassName={classes.tagDescriptionTooltip}
        hideOnTouchScreens
      >
        {buttonContent}
      </LWTooltip>
    );
  }

  return buttonContent;
};

export default registerComponent('TabButton', TabButton, { styles });
