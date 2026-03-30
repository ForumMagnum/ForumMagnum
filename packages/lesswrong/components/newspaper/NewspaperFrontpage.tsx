'use client';

import React from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { serifStack } from '@/themes/defaultPalette';
import { postsListWithVotesDocument } from '@/lib/generated/gql-codegen/graphql';
import moment from 'moment';
import { registerComponent } from '@/lib/vulcan-lib/components';
import NewspaperBelowFold from './NewspaperBelowFold';
import NewspaperHeroSection from './NewspaperHeroSection';
import NewspaperTagSection from './NewspaperTagSection';
import { useNewspaperFullWidthMode, groupPostsByCoreTag } from './newspaperHelpers';
import NewspaperMasthead from './NewspaperMasthead';
import NewspaperMoreArticlesSection from './NewspaperMoreArticlesSection';
import NewspaperFooter from './NewspaperFooter';
import { NEWSPAPER_BODY_CLASS } from './newspaperStyles';

const BG_WHITE = '#FFFFFF';
const INK = '#1A1A1A';
const INK_TERTIARY = '#888888';

const styles = defineStyles('NewspaperFrontpage', () => ({
  '@global': {
    [`body.${NEWSPAPER_BODY_CLASS} .RouteRootClient-main`]: {
      overflowX: 'visible !important',
    },
    [`body.${NEWSPAPER_BODY_CLASS} .RouteRootClient-centralColumn`]: {
      width: '100%',
      maxWidth: 'none',
      paddingTop: '0 !important',
      paddingLeft: '0 !important',
      paddingRight: '0 !important',
    },
    [`body.${NEWSPAPER_BODY_CLASS} .LeftAndRightSidebarsWrapper-spacedGridActivated`]: {
      display: 'block !important',
    },
    [`body.${NEWSPAPER_BODY_CLASS} .Slide-wrapper`]: {
      display: 'none !important',
    },
  },
  pageWrapper: {
    width: '100%',
    background: BG_WHITE,
    color: INK,
    colorScheme: 'light',
    minHeight: '100vh',
    fontFamily: serifStack,
    position: 'relative',
    zIndex: 1,
  },
  loading: {
    textAlign: 'center',
    padding: '80px 0',
    fontFamily: serifStack,
    fontSize: '18px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
  },
}), { allowNonThemeColors: true });

const NewspaperFrontpage = () => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  useNewspaperFullWidthMode();
  const dateCutoff = moment(now).subtract(7 * 24, 'hours').startOf('hour').toISOString();
  const { data: postsData, loading: postsLoading } = useQuery(postsListWithVotesDocument, {
    variables: {
      selector: {
        magic: {
          after: dateCutoff,
          forum: true,
        },
      },
      limit: 50,
    },
  });
  const { data: curatedData, loading: curatedLoading } = useQuery(postsListWithVotesDocument, {
    variables: {
      selector: {
        curated: {},
      },
      limit: 3,
    },
  });
  const allPosts = postsData?.posts?.results ?? [];
  const curatedPosts = curatedData?.posts?.results ?? [];
  const curatedIds = new Set(curatedPosts.map(p => p._id));
  const nonCuratedPosts = allPosts.filter(p => !curatedIds.has(p._id));
  const highKarmaPosts = nonCuratedPosts.filter(p => (p.baseScore ?? 0) > 100);
  const heroEligiblePosts = [...curatedPosts, ...highKarmaPosts];
  const heroPost = heroEligiblePosts[0];
  const heroPostId = heroPost?._id;
  const cardPosts = heroEligiblePosts.filter(p => p._id !== heroPostId).slice(0, 6);
  const heroSectionPostIds = new Set([heroPostId, ...cardPosts.map(p => p._id)].filter(Boolean));
  const postsForTagGrouping = allPosts.filter(p => !heroSectionPostIds.has(p._id));
  const { tagGroups, ungroupedPosts } = groupPostsByCoreTag(postsForTagGrouping);
  const displayDate = new Date(now);
  if ((postsLoading || curatedLoading) && allPosts.length === 0 && curatedPosts.length === 0) {
    return <div className={classes.pageWrapper}>
      <div className={classes.loading}>
        Setting the type&hellip;
      </div>
    </div>;
  }
  return <AnalyticsContext pageContext="newspaperFrontpage">
    <div className={classes.pageWrapper}>
      <NewspaperMasthead displayDate={displayDate} />
      <NewspaperHeroSection heroPost={heroPost} cardPosts={cardPosts} />
      {tagGroups.map(group => <NewspaperTagSection key={group.tagId} group={group} />)}
      <NewspaperMoreArticlesSection tertiaryPosts={ungroupedPosts} />
      <NewspaperBelowFold />
      <NewspaperFooter displayDate={displayDate} />
    </div>
  </AnalyticsContext>;
};

export default registerComponent('NewspaperFrontpage', NewspaperFrontpage, {
  areEqual: "auto",
});
