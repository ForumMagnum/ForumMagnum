import { useSubtitlePortal } from '@/components/layout/SubtitlePortalContext';
import { defineStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';
import HeaderEventSubtitle from "./HeaderEventSubtitle";

export const headerSubtitleStyles = defineStyles("HeaderSubtitle", (theme: ThemeType) => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: 'uppercase',
    color: isBlackBarTitle ? theme.palette.text.alwaysWhite : theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
}));

const HeaderSubtitle = () => {
  const { containerRef, hasSubtitleContent } = useSubtitlePortal();

  return <>
    <span ref={containerRef} />
    {!hasSubtitleContent && <HeaderEventSubtitle />}
  </>
}

export default HeaderSubtitle;


