/*
 * Logo used in the header by the EA Forum
 *
 * Could easily be adapted for other Forums
 */
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';
import { forumTitleSetting, isEAForum } from '../../lib/instanceSettings';
import { eaForumSymbolIcon } from '../icons/eaForumSymbolIcon';

const styles = (theme: ThemeType) => ({
  root: {
    height: 48,
  },
  // The EA Forum symbol is drawn next to the wordmark, which is rendered as
  // text in the header. 24px tall matches the official logo files.
  eaSymbol: {
    display: "block",
    height: 24,
    width: "auto",
  },
  eaSymbolContrast: {
    display: "block",
    height: 24,
    width: 15,
  },
})

const SiteLogo = ({eaContrast, classes}: {
  eaContrast?: boolean,
  classes: ClassesType<typeof styles>;
}) => {
  if (isEAForum) {
    // Single-colour version for headers with a coloured background
    if (eaContrast) {
      return <div className={classes.eaSymbolContrast}>{eaForumSymbolIcon}</div>
    }
    return <img
      className={classes.eaSymbol}
      src="/ea-forum/ea-forum-symbol.svg"
      alt=""
    />
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
export default registerComponent(
  'SiteLogo', SiteLogo, {styles}
);
