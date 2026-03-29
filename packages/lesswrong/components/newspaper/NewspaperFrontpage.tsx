'use client';

import React from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';
import { truncateWithGrace } from '@/lib/editor/ellipsize';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import ContentStyles from '@/components/common/ContentStyles';
import moment from 'moment';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import DeferRender from '@/components/common/DeferRender';
import QuickTakesSection from '@/components/quickTakes/QuickTakesSection';

import dynamic from 'next/dynamic';
const RecentDiscussionFeed = dynamic(() => import("@/components/recentDiscussion/RecentDiscussionFeed"), { ssr: false });

// Background: slightly warm off-white, like aged newsprint
const PAPER_BG = '#FAF7F0';
const PAPER_BG_DARKER = '#F0EBE0';
const INK_COLOR = '#1A1A1A';
const INK_LIGHT = '#4A4A4A';
const INK_FAINT = '#8A8A7A';
const RULE_COLOR = '#2A2A2A';
const RULE_LIGHT = '#C8C3B8';

const newspaperPostsQuery = gql(`
  query newspaperFrontpagePosts($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const newspaperCuratedQuery = gql(`
  query newspaperCuratedPosts($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const styles = defineStyles('NewspaperFrontpage', () => ({
  pageWrapper: {
    background: PAPER_BG,
    color: INK_COLOR,
    colorScheme: 'light',
    minHeight: '100vh',
    fontFamily: serifStack,
    // Subtle paper texture effect
    backgroundImage: `
      radial-gradient(ellipse at 20% 50%, rgba(255,252,242,0.4) 0%, transparent 70%),
      radial-gradient(ellipse at 80% 50%, rgba(255,252,242,0.3) 0%, transparent 70%)
    `,
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
  },

  // === MASTHEAD ===
  masthead: {
    textAlign: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  mastheadRuleTop: {
    borderTop: `3px solid ${RULE_COLOR}`,
    borderBottom: `1px solid ${RULE_COLOR}`,
    height: 6,
    marginBottom: 16,
  },
  mastheadMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: sansSerifStack,
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: INK_LIGHT,
    marginBottom: 8,
  },
  mastheadTitle: {
    fontFamily: headerStack,
    fontSize: '72px',
    fontWeight: 400,
    letterSpacing: '4px',
    lineHeight: 1.0,
    marginBottom: 4,
    textTransform: 'uppercase',
    '@media (max-width: 768px)': {
      fontSize: '42px',
      letterSpacing: '2px',
    },
    '@media (max-width: 480px)': {
      fontSize: '32px',
      letterSpacing: '1px',
    },
  },
  mastheadSubtitle: {
    fontFamily: serifStack,
    fontSize: '14px',
    fontStyle: 'italic',
    color: INK_LIGHT,
    marginBottom: 8,
    letterSpacing: '0.5px',
  },
  mastheadRuleBottom: {
    borderTop: `1px solid ${RULE_COLOR}`,
    borderBottom: `3px solid ${RULE_COLOR}`,
    height: 6,
    marginTop: 4,
  },

  // === HERO SECTION ===
  heroSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  heroArticle: {
    textAlign: 'center',
    maxWidth: 800,
    margin: '0 auto',
    paddingBottom: 24,
  },
  heroKicker: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: INK_FAINT,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: headerStack,
    fontSize: '48px',
    fontWeight: 400,
    lineHeight: 1.15,
    marginBottom: 12,
    '& a': {
      color: INK_COLOR,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '@media (max-width: 768px)': {
      fontSize: '32px',
    },
  },
  heroByline: {
    fontFamily: sansSerifStack,
    fontSize: '13px',
    color: INK_LIGHT,
    marginBottom: 16,
    letterSpacing: '0.5px',
    '& a': {
      color: INK_LIGHT,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  heroExcerpt: {
    fontFamily: serifStack,
    fontSize: '18px',
    lineHeight: 1.7,
    color: INK_COLOR,
    maxWidth: 650,
    margin: '0 auto',
    textAlign: 'left',
    '& p': {
      marginBottom: '0.8em',
    },
    '& a': {
      color: INK_COLOR,
    },
  },
  heroContinueReading: {
    fontFamily: sansSerifStack,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: 16,
    textAlign: 'center',
    '& a': {
      color: INK_LIGHT,
      textDecoration: 'none',
      borderBottom: `1px solid ${RULE_LIGHT}`,
      paddingBottom: 2,
      '&:hover': {
        color: INK_COLOR,
        borderBottomColor: INK_COLOR,
      },
    },
  },

  // === SECTION DIVIDERS ===
  sectionRule: {
    borderTop: `1px solid ${RULE_COLOR}`,
    margin: '0',
  },
  sectionRuleLight: {
    borderTop: `1px solid ${RULE_LIGHT}`,
    margin: '0',
  },
  doubleSectionRule: {
    borderTop: `3px double ${RULE_COLOR}`,
    margin: '0',
  },
  sectionHeader: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: INK_FAINT,
    textAlign: 'center',
    margin: '16px 0 16px 0',
  },

  // === SECONDARY ARTICLES (2 or 3 columns) ===
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 0,
    marginBottom: 0,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  secondaryArticle: {
    padding: '20px 24px',
    borderRight: `1px solid ${RULE_LIGHT}`,
    '&:last-child': {
      borderRight: 'none',
    },
    '@media (max-width: 768px)': {
      borderRight: 'none',
      borderBottom: `1px solid ${RULE_LIGHT}`,
      padding: '16px 0',
      '&:last-child': {
        borderBottom: 'none',
      },
    },
  },
  secondaryTitle: {
    fontFamily: headerStack,
    fontSize: '24px',
    fontWeight: 400,
    lineHeight: 1.25,
    marginBottom: 8,
    '& a': {
      color: INK_COLOR,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  secondaryByline: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_FAINT,
    marginBottom: 10,
    letterSpacing: '0.3px',
  },
  secondaryExcerpt: {
    fontFamily: serifStack,
    fontSize: '15px',
    lineHeight: 1.6,
    color: INK_LIGHT,
    '& p': {
      marginBottom: '0.5em',
    },
    '& a': {
      color: INK_LIGHT,
    },
  },

  // === TERTIARY ARTICLES (smaller grid) ===
  tertiaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 0,
    '@media (max-width: 960px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tertiaryArticle: {
    padding: '16px 20px',
    borderRight: `1px solid ${RULE_LIGHT}`,
    borderBottom: `1px solid ${RULE_LIGHT}`,
    '&:nth-child(4n)': {
      borderRight: 'none',
    },
    '@media (max-width: 960px)': {
      '&:nth-child(4n)': {
        borderRight: `1px solid ${RULE_LIGHT}`,
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
    '& a': {
      color: INK_COLOR,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  tertiaryMeta: {
    fontFamily: sansSerifStack,
    fontSize: '10px',
    color: INK_FAINT,
    letterSpacing: '0.3px',
    marginBottom: 8,
  },
  tertiaryExcerpt: {
    fontFamily: serifStack,
    fontSize: '13.5px',
    lineHeight: 1.5,
    color: INK_LIGHT,
    '& p': {
      marginBottom: '0.4em',
    },
    '& a': {
      color: INK_LIGHT,
    },
  },

  // === CURATED SIDEBAR COLUMN ===
  aboveFoldLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 0,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  mainColumn: {
    borderRight: `1px solid ${RULE_LIGHT}`,
    paddingRight: 24,
    '@media (max-width: 768px)': {
      borderRight: 'none',
      paddingRight: 0,
    },
  },
  sideColumn: {
    paddingLeft: 24,
    '@media (max-width: 768px)': {
      paddingLeft: 0,
      borderTop: `1px solid ${RULE_LIGHT}`,
      marginTop: 16,
      paddingTop: 16,
    },
  },
  sideArticle: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: `1px solid ${RULE_LIGHT}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  sideTitle: {
    fontFamily: headerStack,
    fontSize: '20px',
    fontWeight: 400,
    lineHeight: 1.3,
    marginBottom: 6,
    '& a': {
      color: INK_COLOR,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  sideMeta: {
    fontFamily: sansSerifStack,
    fontSize: '10px',
    color: INK_FAINT,
    letterSpacing: '0.3px',
    marginBottom: 8,
  },
  sideExcerpt: {
    fontFamily: serifStack,
    fontSize: '14px',
    lineHeight: 1.55,
    color: INK_LIGHT,
    '& p': {
      marginBottom: '0.4em',
    },
    '& a': {
      color: INK_LIGHT,
    },
  },

  // === SCORE BADGE ===
  scoreBadge: {
    fontFamily: sansSerifStack,
    fontSize: '10px',
    color: INK_FAINT,
    display: 'inline-block',
    marginRight: 8,
  },

  // === BELOW THE FOLD ===
  belowFold: {
    background: PAPER_BG_DARKER,
    borderTop: `3px double ${RULE_COLOR}`,
    marginTop: 8,
    paddingTop: 8,
    paddingBottom: 40,
  },
  belowFoldSection: {
    maxWidth: 765,
    margin: '0 auto',
    padding: '0 24px',
  },
  belowFoldHeader: {
    fontFamily: headerStack,
    fontSize: '28px',
    fontWeight: 400,
    textAlign: 'center',
    margin: '24px 0 4px 0',
    letterSpacing: '1px',
  },
  belowFoldSubheader: {
    fontFamily: serifStack,
    fontSize: '13px',
    fontStyle: 'italic',
    color: INK_LIGHT,
    textAlign: 'center',
    marginBottom: 16,
  },

  // === FOOTER ===
  footer: {
    background: PAPER_BG,
    borderTop: `1px solid ${RULE_LIGHT}`,
    padding: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontFamily: sansSerifStack,
    fontSize: '12px',
    color: INK_FAINT,
    letterSpacing: '0.5px',
    '& a': {
      color: INK_LIGHT,
      textDecoration: 'underline',
      '&:hover': {
        color: INK_COLOR,
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
    color: INK_FAINT,
  },

  // === COMMENTS COUNT ===
  commentCount: {
    fontFamily: sansSerifStack,
    fontSize: '10px',
    color: INK_FAINT,
  },

  // Ornamental dingbat between sections
  ornament: {
    textAlign: 'center',
    fontSize: '18px',
    color: INK_FAINT,
    margin: '12px 0',
    letterSpacing: '8px',
  },
}), { allowNonThemeColors: true });

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

function getPostExcerptHtml(post: PostsListWithVotes, maxWords: number): string {
  const html = post.customHighlight?.html ?? post.contents?.htmlHighlight ?? '';
  if (!html) return '';
  return truncateWithGrace(html, maxWords, 15);
}

function getPlaintextExcerpt(post: PostsListWithVotes, maxLength: number): string {
  const text = post.contents?.plaintextDescription ?? '';
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

function getPostTags(post: PostsListWithVotes): string {
  const tags = post.tags;
  if (!tags || tags.length === 0) return '';
  return tags.slice(0, 2).map(t => t.name).join(' · ');
}

function formatAuthor(post: PostsListWithVotes): string {
  if (post.hideAuthor) return 'Anonymous';
  return post.user?.displayName ?? 'Unknown';
}

function formatScore(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return String(score);
}

interface NewspaperArticleProps {
  post: PostsListWithVotes;
  classes: ReturnType<typeof useStyles<typeof styles>>;
  variant: 'hero' | 'secondary' | 'tertiary' | 'side';
}

function NewspaperArticle({ post, classes, variant }: NewspaperArticleProps) {
  const url = postGetPageUrl(post);
  const author = formatAuthor(post);
  const tagLine = getPostTags(post);
  const score = post.baseScore ?? 0;
  const comments = post.commentCount ?? 0;

  if (variant === 'hero') {
    const excerptHtml = getPostExcerptHtml(post, 200);
    return (
      <article className={classes.heroArticle}>
        {tagLine && <div className={classes.heroKicker}>{tagLine}</div>}
        <h1 className={classes.heroTitle}>
          <Link to={url}>{post.title}</Link>
        </h1>
        <div className={classes.heroByline}>
          By {author} · {formatScore(score)} points · {comments} comments
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
        <div className={classes.heroContinueReading}>
          <Link to={url}>Continue Reading →</Link>
        </div>
      </article>
    );
  }

  if (variant === 'secondary') {
    const excerptHtml = getPostExcerptHtml(post, 80);
    return (
      <article className={classes.secondaryArticle}>
        <h2 className={classes.secondaryTitle}>
          <Link to={url}>{post.title}</Link>
        </h2>
        <div className={classes.secondaryByline}>
          By {author} · {formatScore(score)} pts · {comments} comments
        </div>
        {excerptHtml && (
          <ContentStyles contentType="postHighlight">
            <div className={classes.secondaryExcerpt}>
              <ContentItemBody
                dangerouslySetInnerHTML={{ __html: excerptHtml }}
                description={`(newspaper secondary) ${post.title}`}
              />
            </div>
          </ContentStyles>
        )}
      </article>
    );
  }

  if (variant === 'side') {
    const excerptHtml = getPostExcerptHtml(post, 60);
    return (
      <article className={classes.sideArticle}>
        <h3 className={classes.sideTitle}>
          <Link to={url}>{post.title}</Link>
        </h3>
        <div className={classes.sideMeta}>
          <span className={classes.scoreBadge}>{formatScore(score)} pts</span>
          By {author} · {comments} comments
        </div>
        {excerptHtml && (
          <ContentStyles contentType="postHighlight">
            <div className={classes.sideExcerpt}>
              <ContentItemBody
                dangerouslySetInnerHTML={{ __html: excerptHtml }}
                description={`(newspaper side) ${post.title}`}
              />
            </div>
          </ContentStyles>
        )}
      </article>
    );
  }

  // tertiary
  const excerpt = getPlaintextExcerpt(post, 120);
  return (
    <article className={classes.tertiaryArticle}>
      <h3 className={classes.tertiaryTitle}>
        <Link to={url}>{post.title}</Link>
      </h3>
      <div className={classes.tertiaryMeta}>
        <span className={classes.scoreBadge}>{formatScore(score)} pts</span>
        {author} · {comments} comments
      </div>
      {excerpt && <div className={classes.tertiaryExcerpt}>{excerpt}</div>}
    </article>
  );
}

const NewspaperFrontpage = () => {
  const classes = useStyles(styles);
  const now = useCurrentTime();

  const dateCutoff = moment(now).subtract(7 * 24, 'hours').startOf('hour').toISOString();

  const { data: postsData, loading: postsLoading } = useQuery(newspaperPostsQuery, {
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

  const { data: curatedData, loading: curatedLoading } = useQuery(newspaperCuratedQuery, {
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
  // Side column: remaining curated posts (editors' picks)
  // Secondary row: first 3 non-curated posts
  // Tertiary grid: remaining posts
  const heroFromCurated = curatedPosts.length > 0;
  const heroPost = heroFromCurated ? curatedPosts[0] : nonCuratedPosts[0];
  const sidePosts = curatedPosts.slice(1);
  const mainStartIdx = heroFromCurated ? 0 : 1;
  const secondaryPosts = nonCuratedPosts.slice(mainStartIdx, mainStartIdx + 3);
  const tertiaryPosts = nonCuratedPosts.slice(mainStartIdx + 3);

  const displayDate = new Date(now);

  if (postsLoading && curatedLoading) {
    return (
      <div className={classes.pageWrapper}>
        <div className={classes.loading}>
          Setting the type…
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
            <div className={classes.mastheadRuleTop} />
            <div className={classes.mastheadMeta}>
              <span>{getVolumeAndIssue(displayDate)}</span>
              <span>Founded 2009</span>
              <span>{formatNewspaperDate(displayDate)}</span>
            </div>
            <div className={classes.mastheadTitle}>
              The Less Wrong Times
            </div>
            <div className={classes.mastheadSubtitle}>
              All The Rationality That&rsquo;s Fit to Print
            </div>
            <div className={classes.mastheadRuleBottom} />
          </div>
        </div>

        {/* === ABOVE THE FOLD === */}
        <div className={classes.container}>
          {heroPost && (
            <div className={classes.aboveFoldLayout}>
              <div className={classes.mainColumn}>
                <div className={classes.heroSection}>
                  <NewspaperArticle post={heroPost} classes={classes} variant="hero" />
                </div>
              </div>
              {sidePosts.length > 0 && (
                <div className={classes.sideColumn}>
                  <div className={classes.sectionHeader}>Editors&rsquo; Picks</div>
                  {sidePosts.map(post => (
                    <NewspaperArticle key={post._id} post={post} classes={classes} variant="side" />
                  ))}
                </div>
              )}
            </div>
          )}

          <hr className={classes.sectionRule} />

          {/* === SECONDARY ARTICLES === */}
          {secondaryPosts.length > 0 && <>
            <div className={classes.sectionHeader}>Latest Dispatches</div>
            <div className={classes.secondaryGrid}>
              {secondaryPosts.map(post => (
                <NewspaperArticle key={post._id} post={post} classes={classes} variant="secondary" />
              ))}
            </div>
            <hr className={classes.sectionRule} />
          </>}

          {/* === TERTIARY GRID === */}
          {tertiaryPosts.length > 0 && <>
            <div className={classes.sectionHeader}>More Dispatches</div>
            <div className={classes.tertiaryGrid}>
              {tertiaryPosts.map(post => (
                <NewspaperArticle key={post._id} post={post} classes={classes} variant="tertiary" />
              ))}
            </div>
          </>}
        </div>

        {/* === BELOW THE FOLD === */}
        <div className={classes.belowFold}>
          <div className={classes.belowFoldSection}>
            <div className={classes.ornament}>❧</div>
            <div className={classes.belowFoldHeader}>Quick Dispatches</div>
            <div className={classes.belowFoldSubheader}>Brief observations from the community</div>
            <SuspenseWrapper name="NewspaperQuickTakes">
              <QuickTakesSection />
            </SuspenseWrapper>
          </div>

          <div className={classes.belowFoldSection}>
            <hr className={classes.doubleSectionRule} />
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
        </div>

        {/* === FOOTER === */}
        <div className={classes.footer}>
          <div className={classes.footerText}>
            <Link to="/?newspaper=false">Return to regular LessWrong</Link>
            {' · '}
            The Less Wrong Times is a special April 1st edition.
            {' · '}
            © {displayDate.getFullYear()} LessWrong
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
};

export default registerComponent('NewspaperFrontpage', NewspaperFrontpage, {
  areEqual: "auto",
});
