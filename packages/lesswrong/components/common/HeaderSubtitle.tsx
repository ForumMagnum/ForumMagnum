import React from 'react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';
import { useSubtitlePortal } from '@/components/layout/SubtitlePortalContext';

export const headerSubtitleStyles = defineStyles("HeaderSubtitle", (theme: ThemeType) => ({
  subtitleContainer: {
    flexShrink: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: 'uppercase',
    color: isBlackBarTitle ? theme.palette.text.alwaysWhite : theme.palette.header.text,
    borderLeft: theme.palette.border.appBarSubtitleDivider,
  },
}));

const HeaderSubtitle = () => {
  const { containerRef } = useSubtitlePortal();
  const classes = useStyles(headerSubtitleStyles);

  return <div className={classes.subtitleContainer}>
    <span ref={containerRef} />
  </div>
}

export default HeaderSubtitle;
