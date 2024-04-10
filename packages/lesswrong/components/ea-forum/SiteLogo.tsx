/*
 * Logo used in the header by the EA Forum
 *
 * Could easily be adapted for other Forums
 */
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';
import { forumTitleSetting, isEAForum } from '../../lib/instanceSettings';
import { lightbulbIcon } from '../icons/lightbulbIcon';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    height: isEAForum ? 34 : 48,
    [theme.breakpoints.down('sm')]: {
      height: isEAForum ? 30 : 48,
    },
  },
  icon: {
    width: 34,
    [theme.breakpoints.down("sm")]: {
      width: 30,
    },
  }
})

const SiteLogo = ({eaWhite, classes}: {
  eaWhite?: boolean,
  classes: ClassesType;
}) => {
  // Use this icon when we want a pure white version of the EAF logo
  if (isEAForum && eaWhite) {
    return <div className={classes.icon}>{lightbulbIcon}</div>
  }

  if (!getLogoUrl()) return null

  return <img
    className={classes.root}
    src={getLogoUrl()}
    title={forumTitleSetting.get()}
    alt={`${forumTitleSetting.get()} Logo`}
  />
}

SiteLogo.displayName = "SiteLogo";
const SiteLogoComponent = registerComponent(
  'SiteLogo', SiteLogo, {styles}
)

declare global {
  interface ComponentTypes {
    SiteLogo: typeof SiteLogoComponent
  }
}
