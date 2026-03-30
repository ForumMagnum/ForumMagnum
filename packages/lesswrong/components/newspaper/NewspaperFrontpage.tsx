'use client';

import React, { use, useEffect, useRef } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';
// Line-clamp used for excerpt truncation instead of word-based truncation
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import ContentStyles from '@/components/common/ContentStyles';
import moment from 'moment';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import DeferRender from '@/components/common/DeferRender';
import QuickTakesSection from '@/components/quickTakes/QuickTakesSection';
import { HideNavigationSidebarContext } from '@/components/layout/HideNavigationSidebarContextProvider';


import dynamic from 'next/dynamic';
const RecentDiscussionFeed = dynamic(() => import("@/components/recentDiscussion/RecentDiscussionFeed"), { ssr: false });

// Color palette — clean white with warm ink tones
const BG_WHITE = '#FFFFFF';
const BG_LIGHT = '#FAFAF8';
const INK = '#1A1A1A';
const INK_SECONDARY = '#555555';
const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';
const RULE_DARK = '#333333';

// Reuse the exact query string from usePostsList.ts so it matches the codegen map
// (the gql() function uses the string as a lookup key — same string = same typed document)
const postsQuery = gql(`
  query postsListWithVotes($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const styles = defineStyles('NewspaperFrontpage', () => ({
  // Global override: when newspaper is active, remove the overflow clipping
  // that prevents the 100vw trick from working
  '@global': {
    [`body.${NEWSPAPER_BODY_CLASS} .RouteRootClient-main`]: {
      overflowX: 'visible !important',
    },
  },
  // Break out of the central column grid area to fill the full viewport
  pageWrapper: {
    width: '100vw',
    marginLeft: 'calc(-50vw + 50%)',
    // Pull up to be flush with the header (negate centralColumn's paddingTop)
    marginTop: -50,
    background: BG_WHITE,
    color: INK,
    colorScheme: 'light',
    minHeight: '100vh',
    fontFamily: serifStack,
    // Ensure we're above the background image layer
    position: 'relative',
    zIndex: 1,
    '@media (max-width: 600px)': {
      marginTop: -10,
    },
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 40px',
    '@media (max-width: 768px)': {
      padding: '0 20px',
    },
  },
  containerWide: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 40px',
    '@media (max-width: 768px)': {
      padding: '0 20px',
    },
  },

  // === MASTHEAD ===
  masthead: {
    textAlign: 'center',
    paddingTop: 48,
    paddingBottom: 12,
  },
  mastheadTitle: {
    fontFamily: headerStack,
    fontSize: '56px',
    fontWeight: 400,
    letterSpacing: '2px',
    lineHeight: 1.1,
    marginBottom: 8,
    textTransform: 'uppercase',
    color: INK,
    '@media (max-width: 768px)': {
      fontSize: '36px',
      letterSpacing: '1px',
    },
    '@media (max-width: 480px)': {
      fontSize: '28px',
    },
  },
  mastheadSubtitle: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: INK_TERTIARY,
    marginBottom: 24,
  },
  mastheadRule: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: '0',
  },
  mastheadMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: sansSerifStack,
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: INK_TERTIARY,
    padding: '8px 0',
    borderBottom: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      gap: 4,
    },
  },

  // === HERO + CARDS LAYOUT (above the fold) ===
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    marginTop: 32,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  heroMain: {
    paddingRight: 40,
    borderRight: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 900px)': {
      paddingRight: 0,
      borderRight: 'none',
      paddingBottom: 32,
      borderBottom: `1px solid ${RULE_COLOR}`,
    },
  },
  heroTitle: {
    fontFamily: headerStack,
    fontSize: '36px',
    fontWeight: 400,
    lineHeight: 1.2,
    marginBottom: 10,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '@media (max-width: 768px)': {
      fontSize: '28px',
    },
  },
  heroByline: {
    fontFamily: sansSerifStack,
    fontSize: '13px',
    color: INK_TERTIARY,
    marginBottom: 20,
    '& a': {
      color: INK_TERTIARY,
      textDecoration: 'none',
    },
  },
  heroExcerpt: {
    fontFamily: serifStack,
    fontSize: '17px',
    lineHeight: 1.75,
    color: INK,
    display: '-webkit-box',
    WebkitLineClamp: 12,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.9em',
    },
    '& a': {
      color: INK,
    },
    '& h1, & h2, & h3, & h4': {
      fontSize: '1.1em',
      marginBottom: '0.5em',
    },
  },
  heroMeta: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    color: INK_TERTIARY,
    marginTop: 16,
  },

  // === CARDS GRID (right side of hero) ===
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 0,
    paddingLeft: 0,
    '@media (max-width: 900px)': {
      paddingLeft: 0,
      marginTop: 24,
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto',
    },
  },
  card: {
    padding: '0 20px 20px 20px',
    borderBottom: `1px solid ${RULE_COLOR}`,
    borderLeft: `1px solid ${RULE_COLOR}`,
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 900px)': {
      borderLeft: 'none',
      '&:nth-child(odd)': {
        borderRight: `1px solid ${RULE_COLOR}`,
      },
    },
    '@media (max-width: 600px)': {
      '&:nth-child(odd)': {
        borderRight: 'none',
      },
    },
  },
  cardTitle: {
    fontFamily: headerStack,
    fontSize: '20px',
    fontWeight: 400,
    lineHeight: 1.3,
    marginBottom: 6,
    marginTop: 20,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  cardByline: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    color: INK_TERTIARY,
    marginBottom: 12,
  },
  cardExcerpt: {
    fontFamily: serifStack,
    fontSize: '14.5px',
    lineHeight: 1.6,
    color: INK_SECONDARY,
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 8,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.5em',
    },
    '& a': {
      color: INK_SECONDARY,
    },
    '& h1, & h2, & h3, & h4': {
      fontSize: '1em',
      marginBottom: '0.4em',
    },
  },
  cardMeta: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginTop: 12,
  },

  // === SECTION DIVIDERS ===
  sectionRule: {
    borderTop: `1px solid ${RULE_COLOR}`,
    margin: '0',
  },
  sectionRuleDark: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: '0',
  },
  sectionHeader: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: INK_TERTIARY,
    textAlign: 'center',
    margin: '32px 0 24px 0',
  },

  // === TERTIARY GRID (more articles) ===
  tertiaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 0,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tertiaryArticle: {
    padding: '20px 24px',
    borderRight: `1px solid ${RULE_COLOR}`,
    borderBottom: `1px solid ${RULE_COLOR}`,
    '&:nth-child(3n)': {
      borderRight: 'none',
    },
    '@media (max-width: 900px)': {
      '&:nth-child(3n)': {
        borderRight: `1px solid ${RULE_COLOR}`,
      },
      '&:nth-child(2n)': {
        borderRight: 'none',
      },
    },
    '@media (max-width: 600px)': {
      borderRight: 'none',
    },
  },
  tertiaryTitle: {
    fontFamily: headerStack,
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: 1.3,
    marginBottom: 6,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  tertiaryByline: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginBottom: 10,
  },
  tertiaryExcerpt: {
    fontFamily: serifStack,
    fontSize: '14px',
    lineHeight: 1.55,
    color: INK_SECONDARY,
    display: '-webkit-box',
    WebkitLineClamp: 8,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.4em',
    },
    '& a': {
      color: INK_SECONDARY,
    },
  },
  tertiaryMeta: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginTop: 10,
  },

  // === BELOW THE FOLD ===
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

  // === CLASSIFIEDS ===
  classifiedsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    border: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  classifiedItem: {
    padding: '16px 20px',
    borderRight: `1px solid ${RULE_COLOR}`,
    borderBottom: `1px solid ${RULE_COLOR}`,
    '&:nth-child(2n)': {
      borderRight: 'none',
    },
    '@media (max-width: 600px)': {
      borderRight: 'none',
    },
  },
  classifiedTitle: {
    fontFamily: sansSerifStack,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '2px',
    color: INK,
    marginBottom: 6,
  },
  classifiedBody: {
    fontFamily: serifStack,
    fontSize: '13px',
    lineHeight: 1.5,
    color: INK_SECONDARY,
    '& a': {
      color: INK,
      textDecoration: 'none',
      borderBottom: `1px solid ${RULE_COLOR}`,
      '&:hover': {
        borderBottomColor: INK,
      },
    },
  },

  // === FOOTER ===
  footer: {
    background: BG_WHITE,
    borderTop: `1px solid ${RULE_COLOR}`,
    padding: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    color: INK_TERTIARY,
    letterSpacing: '0.5px',
    '& a': {
      color: INK_SECONDARY,
      textDecoration: 'underline',
      '&:hover': {
        color: INK,
      },
    },
  },

  // === LOADING ===
  loading: {
    textAlign: 'center',
    padding: '80px 0',
    fontFamily: serifStack,
    fontSize: '18px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
  },
}), { allowNonThemeColors: true });


// === Helper functions ===

function formatNewspaperDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getVolumeAndIssue(date: Date): string {
  const yearsSinceFounding = date.getFullYear() - 2009;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return `Vol. ${toRoman(yearsSinceFounding)}, No. ${dayOfYear}`;
}

function toRoman(num: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

function getPostExcerptHtml(post: PostsListWithVotes): string {
  return post.customHighlight?.html ?? post.contents?.htmlHighlight ?? '';
}

function formatAuthor(post: PostsListWithVotes): string {
  if (post.hideAuthor) return 'Anonymous';
  return post.user?.displayName ?? 'Unknown';
}

function formatScore(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return String(score);
}


// === Sidebar hiding hook ===

// CSS class added to document.body to override the grid overflow clipping
// so the 100vw trick works for true full-width content
const NEWSPAPER_BODY_CLASS = 'newspaper-fullwidth-active';

function useNewspaperFullWidthMode() {
  const context = use(HideNavigationSidebarContext);
  const previousValueRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Hide sidebar
    if (context) {
      previousValueRef.current = context.hideNavigationSidebar;
      context.setHideNavigationSidebar(true);
    }

    // Add body class to override overflow clipping on the grid wrapper
    document.body.classList.add(NEWSPAPER_BODY_CLASS);

    return () => {
      if (context && previousValueRef.current !== null) {
        context.setHideNavigationSidebar(previousValueRef.current);
      }
      document.body.classList.remove(NEWSPAPER_BODY_CLASS);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}


// === Article components ===

function HeroArticle({ post, classes }: {
  post: PostsListWithVotes;
  classes: ReturnType<typeof useStyles<typeof styles>>;
}) {
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);

  return (
    <article className={classes.heroMain}>
      <h1 className={classes.heroTitle}>
        <Link to={url}>{post.title}</Link>
      </h1>
      <div className={classes.heroByline}>
        {formatAuthor(post)}
      </div>
      {excerptHtml && (
        <ContentStyles contentType="postHighlight">
          <div className={classes.heroExcerpt}>
            <ContentItemBody
              dangerouslySetInnerHTML={{ __html: excerptHtml }}
              description={`(newspaper hero) ${post.title}`}
            />
          </div>
        </ContentStyles>
      )}
      <div className={classes.heroMeta}>
        {formatScore(post.baseScore ?? 0)} points, {post.commentCount ?? 0} comments
      </div>
    </article>
  );
}

function CardArticle({ post, classes }: {
  post: PostsListWithVotes;
  classes: ReturnType<typeof useStyles<typeof styles>>;
}) {
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);

  return (
    <article className={classes.card}>
      <h2 className={classes.cardTitle}>
        <Link to={url}>{post.title}</Link>
      </h2>
      <div className={classes.cardByline}>
        {formatAuthor(post)}
      </div>
      {excerptHtml && (
        <ContentStyles contentType="postHighlight">
          <div className={classes.cardExcerpt}>
            <ContentItemBody
              dangerouslySetInnerHTML={{ __html: excerptHtml }}
              description={`(newspaper card) ${post.title}`}
            />
          </div>
        </ContentStyles>
      )}
      <div className={classes.cardMeta}>
        {formatScore(post.baseScore ?? 0)} points, {post.commentCount ?? 0} comments
      </div>
    </article>
  );
}

function TertiaryArticle({ post, classes }: {
  post: PostsListWithVotes;
  classes: ReturnType<typeof useStyles<typeof styles>>;
}) {
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);

  return (
    <article className={classes.tertiaryArticle}>
      <h3 className={classes.tertiaryTitle}>
        <Link to={url}>{post.title}</Link>
      </h3>
      <div className={classes.tertiaryByline}>
        {formatAuthor(post)}
      </div>
      {excerptHtml && (
        <ContentStyles contentType="postHighlight">
          <div className={classes.tertiaryExcerpt}>
            <ContentItemBody
              dangerouslySetInnerHTML={{ __html: excerptHtml }}
              description={`(newspaper tertiary) ${post.title}`}
            />
          </div>
        </ContentStyles>
      )}
      <div className={classes.tertiaryMeta}>
        {formatScore(post.baseScore ?? 0)} points, {post.commentCount ?? 0} comments
      </div>
    </article>
  );
}


// === Main component ===

const NewspaperFrontpage = () => {
  const classes = useStyles(styles);
  const now = useCurrentTime();

  // Hide the left navigation sidebar and enable full-width mode
  useNewspaperFullWidthMode();

  const dateCutoff = moment(now).subtract(7 * 24, 'hours').startOf('hour').toISOString();

  const { data: postsData, loading: postsLoading } = useQuery(postsQuery, {
    variables: {
      selector: {
        magic: {
          after: dateCutoff,
          forum: true,
        },
      },
      limit: 20,
    },
  });

  const { data: curatedData, loading: curatedLoading } = useQuery(postsQuery, {
    variables: {
      selector: {
        curated: {},
      },
      limit: 3,
    },
  });

  const allPosts = postsData?.posts?.results ?? [];
  const curatedPosts = curatedData?.posts?.results ?? [];

  // Deduplicate: remove curated posts from the main list
  const curatedIds = new Set(curatedPosts.map(p => p._id));
  const nonCuratedPosts = allPosts.filter(p => !curatedIds.has(p._id));

  // Layout distribution:
  // Hero: first curated post, or first main post if no curated
  // Cards: next 4 posts (mix of curated overflow + main posts)
  // Tertiary: remaining posts
  const heroFromCurated = curatedPosts.length > 0;
  const heroPost = heroFromCurated ? curatedPosts[0] : nonCuratedPosts[0];

  // Build the cards array: remaining curated + top main posts, up to 4
  const remainingCurated = curatedPosts.slice(1);
  const mainStartIdx = heroFromCurated ? 0 : 1;
  const mainForCards = nonCuratedPosts.slice(mainStartIdx, mainStartIdx + (4 - remainingCurated.length));
  const cardPosts = [...remainingCurated, ...mainForCards];
  const tertiaryStartIdx = mainStartIdx + mainForCards.length;
  const tertiaryPosts = nonCuratedPosts.slice(tertiaryStartIdx);

  const displayDate = new Date(now);

  if ((postsLoading || curatedLoading) && allPosts.length === 0 && curatedPosts.length === 0) {
    return (
      <div className={classes.pageWrapper}>
        <div className={classes.loading}>
          Setting the type&hellip;
        </div>
      </div>
    );
  }

  return (
    <AnalyticsContext pageContext="newspaperFrontpage">
      <div className={classes.pageWrapper}>

        {/* === MASTHEAD === */}
        <div className={classes.container}>
          <div className={classes.masthead}>
            <div className={classes.mastheadTitle}>
              The Less Wrong Times
            </div>
            <div className={classes.mastheadSubtitle}>
              Curated stories matching your interests.
            </div>
          </div>
          <hr className={classes.mastheadRule} />
          <div className={classes.mastheadMeta}>
            <span>{getVolumeAndIssue(displayDate)}</span>
            <span>Founded 2009</span>
            <span>{formatNewspaperDate(displayDate)}</span>
          </div>
        </div>

        {/* === HERO + CARDS === */}
        <div className={classes.container}>
          {heroPost && (
            <div className={classes.heroSection}>
              <HeroArticle post={heroPost} classes={classes} />
              <div className={classes.cardsGrid}>
                {cardPosts.map(post => (
                  <CardArticle key={post._id} post={post} classes={classes} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* === MORE ARTICLES === */}
        {tertiaryPosts.length > 0 && (
          <div className={classes.container}>
            <hr className={classes.sectionRule} />
            <div className={classes.sectionHeader}>More Articles</div>
            <div className={classes.tertiaryGrid}>
              {tertiaryPosts.map(post => (
                <TertiaryArticle key={post._id} post={post} classes={classes} />
              ))}
            </div>
          </div>
        )}

        {/* === BELOW THE FOLD === */}
        <div className={classes.belowFold}>
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

          {/* === CLASSIFIEDS === */}
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
        </div>

        {/* === FOOTER === */}
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
    </AnalyticsContext>
  );
};

export default registerComponent('NewspaperFrontpage', NewspaperFrontpage, {
  areEqual: "auto",
});
