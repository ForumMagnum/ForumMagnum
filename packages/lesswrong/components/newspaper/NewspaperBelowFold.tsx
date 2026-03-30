import React from 'react';
import dynamic from 'next/dynamic';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import DeferRender from '@/components/common/DeferRender';
import QuickTakesSection from '@/components/quickTakes/QuickTakesSection';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';
import NewspaperClassifieds from './NewspaperClassifieds';

const RecentDiscussionFeed = dynamic(() => import("@/components/recentDiscussion/RecentDiscussionFeed"), { ssr: false });

const BG_LIGHT = '#FAFAF8';
const INK = '#1A1A1A';
const INK_TERTIARY = '#888888';
const RULE_DARK = '#333333';

const styles = defineStyles('NewspaperBelowFold', () => ({
  belowFold: {
    background: BG_LIGHT,
    borderTop: `2px solid ${RULE_DARK}`,
    marginTop: 32,
    paddingTop: 8,
    paddingBottom: 48,
  },
  belowFoldSection: {
    maxWidth: 765,
    margin: '0 auto',
    padding: '0 24px',
  },
  belowFoldHeader: {
    fontFamily: headerStack,
    fontSize: '24px',
    fontWeight: 400,
    textAlign: 'center',
    margin: '32px 0 4px 0',
    letterSpacing: '1px',
    color: INK,
  },
  belowFoldSubheader: {
    fontFamily: serifStack,
    fontSize: '13px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionRuleDark: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: '0',
  },
}), { allowNonThemeColors: true });

const NewspaperBelowFold = () => {
  const classes = useStyles(styles);
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

    <NewspaperClassifieds />
  </div>;
};

export default NewspaperBelowFold;
