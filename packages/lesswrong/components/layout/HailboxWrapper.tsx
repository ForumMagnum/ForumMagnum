import React from 'react';
import { Hailbox, type HailboxProps } from 'hailbox';
import { useForumType } from '@/components/hooks/useForumType';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { forumTitleSetting, hailboxUrlSetting } from '@/lib/instanceSettings';
import { useCurrentUser } from '@/components/common/withUser';
import { getUserEmail } from '@/lib/collections/users/helpers';
import { useLocation } from '@/lib/routeUtil';
import withErrorBoundary from '@/components/common/withErrorBoundary';
import { useCookiePreferences } from '@/components/hooks/useCookiesWithConsent';
import { isStandaloneRoute } from '@/lib/routeChecks';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useAbstractThemeOptions, useThemeColor } from '@/components/themes/useTheme';
import { defaultZIndexes } from '@/themes/zIndexes';

const styles = defineStyles('HailboxWrapper', (theme: ThemeType) => ({
  root: {
    // Match the Intercom launcher this replaces, and LanguageModelLauncherButton beside it
    "& .hailbox-launcher": {
      color: theme.palette.text.alwaysBlack,
      backgroundColor: theme.palette.intercom.buttonBackground,
      boxShadow: `0 1px 6px 0 ${theme.palette.greyAlpha(0.06)}, 0 2px 32px 0 ${theme.palette.greyAlpha(0.16)}`,
      "&:hover": {
        boxShadow: `0 6px 8px ${theme.palette.greyAlpha(0.2)}`,
      },
    },
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
}));

const hailboxColorSchemes: Record<UserThemeSetting, NonNullable<HailboxProps['colorScheme']>> = {
  default: "light",
  dark: "dark",
  auto: "auto",
};

const HailboxWrapper = () => {
  const { forumType } = useForumType();
  const currentUser = useCurrentUser();
  const { pathname } = useLocation();
  const classes = useStyles(styles);
  const { cookiePreferences } = useCookiePreferences();
  const themeOptions = useAbstractThemeOptions();
  const accentColor = useThemeColor(theme => theme.palette.primary.main);

  const hailboxUrl = hailboxUrlSetting.get(forumType);
  if (!hailboxUrl) {
    throw new Error("HailboxWrapper rendered without a hailboxUrl setting");
  }

  if (isStandaloneRoute(pathname) || !cookiePreferences.includes('functional')) {
    return null;
  }
  if (!currentUser || currentUser.hideIntercom) {
    return null;
  }

  return <div id="hailbox-outer-frame" className={classes.root}>
    <Hailbox
      apiUrl={hailboxUrl}
      title={`Chat with the ${forumTitleSetting.get(forumType)} team`}
      user={{ name: currentUser.displayName, email: getUserEmail(currentUser) }}
      color={accentColor}
      colorScheme={hailboxColorSchemes[themeOptions.name]}
      zIndex={defaultZIndexes.intercomButton}
    />
  </div>
}

export default registerComponent('HailboxWrapper', HailboxWrapper, {
  hocs: [withErrorBoundary]
});
