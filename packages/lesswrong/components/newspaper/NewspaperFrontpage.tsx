'use client';

import React from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles } from '@/components/hooks/useStyles';
import { Link } from '@/lib/reactRouterWrapper';
import { postsListWithVotesDocument } from '@/lib/generated/gql-codegen/graphql';
import moment from 'moment';
import { registerComponent } from '@/lib/vulcan-lib/components';
import NewspaperBelowFold from './NewspaperBelowFold';
import NewspaperHeroSection from './NewspaperHeroSection';
import NewspaperTagSection from './NewspaperTagSection';
import { useNewspaperFullWidthMode, groupPostsByCoreTag } from './newspaperHelpers';
import NewspaperMasthead from './NewspaperMasthead';
import NewspaperMoreArticlesSection from './NewspaperMoreArticlesSection';
import { newspaperStyles } from './newspaperStyles';

const NewspaperFrontpage = () => {
  const classes = useStyles(newspaperStyles);
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
  const cardPosts = heroEligiblePosts.filter(p => p._id !== heroPostId).slice(0, 4);
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
      <NewspaperMasthead classes={classes} displayDate={displayDate} />
      <NewspaperHeroSection classes={classes} heroPost={heroPost} cardPosts={cardPosts} />
      {tagGroups.map(group => <NewspaperTagSection key={group.tagId} group={group} classes={classes} />)}
      <NewspaperMoreArticlesSection classes={classes} tertiaryPosts={ungroupedPosts} />
      <NewspaperBelowFold classes={classes} />
      <div className={classes.footer}>
        <div className={classes.footerText}>
          <Link to="/?newspaper=false">Return to regular LessWrong</Link>
          {' \u00B7 '}
          The Less Wrong Times is a special April 1st edition.
          {' \u00B7 '}
          &copy; {displayDate.getFullYear()} LessWrong
        </div>
      </div>
    </div>
  </AnalyticsContext>;
};

export default registerComponent('NewspaperFrontpage', NewspaperFrontpage, {
  areEqual: "auto",
});
