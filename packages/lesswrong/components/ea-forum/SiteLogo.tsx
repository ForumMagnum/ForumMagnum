/*
 * Logo used in the header by the EA Forum
 *
 * Could easily be adapted for other Forums
 */
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';
import { forumTitleSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    height: 48
  }
})

const SiteLogo = ({classes}: {
  classes: ClassesType;
}) => {
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
