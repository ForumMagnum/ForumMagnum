/*
 * Logo used in the header by the EA Forum
 *
 * Could easily be adapted for other Forums
 */
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { forumTitleSetting } from '../../lib/instanceSettings';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';

const styles = defineStyles("SiteLogo", (theme: ThemeType) => ({
  root: {
    height: 48,
  },
  icon: {
    width: 34,
    [theme.breakpoints.down("sm")]: {
      width: 30,
    },
  }
}))

const SiteLogo = ({eaContrast}: {
  eaContrast?: boolean,
}) => {
  const classes = useStyles(styles);
  // Use this icon when we want version of the EAF logo with an editable (usually white) color
  if (!getLogoUrl()) return null

  return <img
    className={classes.root}
    src={getLogoUrl()}
    title={forumTitleSetting.get()}
    alt={`${forumTitleSetting.get()} Logo`}
  />
}

export default SiteLogo;

