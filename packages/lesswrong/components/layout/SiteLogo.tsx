import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { forumTitleSetting } from '../../lib/instanceSettings';
import { getLogoUrl } from '../../lib/vulcan-lib/utils';

const styles = defineStyles("SiteLogo", (theme: ThemeType) => ({
  root: {
    height: 48,
  },
}))

const SiteLogo = () => {
  const classes = useStyles(styles);
  if (!getLogoUrl()) return null;

  return <img
    className={classes.root}
    src={getLogoUrl()}
    title={forumTitleSetting.get()}
    alt={`${forumTitleSetting.get()} Logo`}
  />
}

export default SiteLogo;
