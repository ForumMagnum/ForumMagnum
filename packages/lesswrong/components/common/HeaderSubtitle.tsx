import { isFriendlyUI } from '../../themes/forumTheme';
import { blackBarTitle } from '../../lib/publicSettings';

export const styles = (theme: ThemeType) => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: isFriendlyUI ? undefined : 'uppercase',
    color: blackBarTitle.get() ? theme.palette.text.alwaysWhite : theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
});
