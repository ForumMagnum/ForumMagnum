import React from 'react';
import HeaderEventSubtitle from "./HeaderEventSubtitle";
import { defineStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';
import { useSubtitlePortal } from '@/components/layout/SubtitlePortalContext';

export const headerSubtitleStyles = defineStyles("HeaderSubtitle", (theme: ThemeType) => ({
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: theme.isFriendlyUI ? undefined : 'uppercase',
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


