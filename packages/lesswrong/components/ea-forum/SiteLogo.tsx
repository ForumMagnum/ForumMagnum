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

const styles = (theme: ThemeType) => ({
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

const SiteLogoInner = ({eaContrast, classes}: {
  eaContrast?: boolean,
  classes: ClassesType<typeof styles>;
}) => {
  // Use this icon when we want version of the EAF logo with an editable (usually white) color
  if (isEAForum && eaContrast) {
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

SiteLogoInner.displayName = "SiteLogo";
export const SiteLogo = registerComponent(
  'SiteLogo', SiteLogoInner, {styles}
)

declare global {
  interface ComponentTypes {
    SiteLogo: typeof SiteLogo
  }
}
