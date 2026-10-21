import React from 'react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';
import { useSubtitlePortal } from '@/components/layout/SubtitlePortalContext';
import { useForumType } from '@/components/hooks/useForumType';
import { Link } from '@/lib/reactRouterWrapper';
import { useIsPetrovDayRitualActive } from '../seasonal/petrovDay/petrov-day-story/useIsPetrovDayRitualActive';

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
  const { containerRef, hasSubtitleContent } = useSubtitlePortal();
  const classes = useStyles(headerSubtitleStyles);
  const { isLW } = useForumType();
  const petrovDayRitualActive = useIsPetrovDayRitualActive();

  return <div className={classes.subtitleContainer}>
    <span ref={containerRef} />
    {isLW && petrovDayRitualActive && !hasSubtitleContent && <span className={classes.subtitle}>
      <Link to="/petrov/ceremony">Petrov Day</Link>
    </span>}
  </div>
}

export default HeaderSubtitle;
