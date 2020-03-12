/*
 * Logo used in the header by the EA Forum
 *
 * Could easily be adapted for other Forums
 */
import React from 'react';
import { registerComponent, getSetting, Utils } from '../../lib/vulcan-lib';

const styles = theme => ({
  root: {
    height: 48
  }
})

const SiteLogo = ({classes}) => getSetting('logoUrl', null) && <img
  className={classes.root}
  src={Utils.getLogoUrl()}
  title={getSetting('title')}
  alt={`${getSetting('title')} Logo`}
/>

SiteLogo.displayName = "SiteLogo";

const SiteLogoComponent = registerComponent(
  'SiteLogo', SiteLogo, {styles}
)

declare global {
  interface ComponentTypes {
    SiteLogo: typeof SiteLogoComponent
  }
}
