import React from 'react';
import dynamic from 'next/dynamic';
import { Link } from '@/lib/reactRouterWrapper';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import DeferRender from '@/components/common/DeferRender';
import QuickTakesSection from '@/components/quickTakes/QuickTakesSection';
import { newspaperStyles } from './newspaperStyles';

const RecentDiscussionFeed = dynamic(() => import("@/components/recentDiscussion/RecentDiscussionFeed"), { ssr: false });

const NewspaperBelowFold = ({classes}:{classes: ClassesType<typeof newspaperStyles>}) => {
  return <div className={classes.belowFold}>
    <div className={classes.belowFoldSection}>
      <div className={classes.belowFoldHeader}>Quick Dispatches</div>
      <div className={classes.belowFoldSubheader}>Brief observations from the community</div>
      <SuspenseWrapper name="NewspaperQuickTakes">
        <QuickTakesSection />
      </SuspenseWrapper>
    </div>

    <div className={classes.belowFoldSection}>
      <hr className={classes.sectionRuleDark} />
      <div className={classes.belowFoldHeader}>Letters &amp; Discussion</div>
      <div className={classes.belowFoldSubheader}>Recent conversations of note</div>
      <DeferRender ssr={false}>
        <RecentDiscussionFeed
          af={false}
          commentsLimit={4}
          maxAgeHours={18}
        />
      </DeferRender>
    </div>

    <div className={classes.belowFoldSection}>
      <hr className={classes.sectionRuleDark} />
      <div className={classes.belowFoldHeader}>The Classifieds</div>
      <div className={classes.belowFoldSubheader}>Community notices &amp; sundry announcements</div>
      <div className={classes.classifiedsGrid}>
        <div className={classes.classifiedItem}>
          <div className={classes.classifiedTitle}>ALL POSTS</div>
          <div className={classes.classifiedBody}>
            Browse the complete archive of posts, sorted by your preference.{' '}
            <Link to="/allPosts">Visit the archive &rarr;</Link>
          </div>
        </div>
        <div className={classes.classifiedItem}>
          <div className={classes.classifiedTitle}>COMMUNITY</div>
          <div className={classes.classifiedBody}>
            Find local meetups, reading groups, and events near you.{' '}
            <Link to="/community">Find your people &rarr;</Link>
          </div>
        </div>
        <div className={classes.classifiedItem}>
          <div className={classes.classifiedTitle}>LIBRARY</div>
          <div className={classes.classifiedBody}>
            Curated sequences and collections of LessWrong&rsquo;s best writing.{' '}
            <Link to="/library">Browse the stacks &rarr;</Link>
          </div>
        </div>
        <div className={classes.classifiedItem}>
          <div className={classes.classifiedTitle}>BEST OF</div>
          <div className={classes.classifiedBody}>
            The annual review selects the best posts. Read the winners.{' '}
            <Link to="/bestoflesswrong">See the best &rarr;</Link>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export default NewspaperBelowFold;
