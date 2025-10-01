"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { userGetProfileUrl as _userGetProfileUrl, userGetProfileUrlFromSlug } from '@/lib/collections/users/helpers';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';

// Helper to handle our custom user types
const userGetProfileUrl = (user: { slug: string } | null): string => {
  if (!user) return "";
  return userGetProfileUrlFromSlug(user.slug);
};
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CommentsNode from '@/components/comments/CommentsNode';
import Loading from '@/components/vulcan-core/Loading';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import classNames from 'classnames';

const ModeratorCommentsMultiQuery = gql(`
  query multiModeratorCommentsQuery($commentIds: [String!]!) {
    comments(input: { terms: { view: "commentsByIds", commentIds: $commentIds } }) {
      results {
        ...ShortformComments
      }
    }
  }
`);

// Type definitions
export type ModerationUserMin = {
  __typename?: 'User';
  _id: string;
  displayName: string | null;
  slug: string;
};

export type ModerationPostMin = {
  __typename?: 'Post';
  _id: string;
  title: string;
  slug: string;
};

export type ModerationComment = {
  _id: string;
  userId: string | null;
  postId: string | null;
  deletedDate?: Date | null;
  postedAt?: Date | null;
  deletedReason?: string | null;
  rejectedReason?: string | null;
  deletedPublic?: boolean | null;
  contents?: any;
  user: ModerationUserMin | null;
  deletedByUser?: ModerationUserMin | null;
  reviewedByUser?: ModerationUserMin | null;
  post: ModerationPostMin | null;
};

export type ModerationPost = {
  _id: string;
  title: string;
  slug: string;
  userId: string | null;
  createdAt?: Date;
  postedAt?: Date | null;
  rejectedReason?: string | null;
  contents?: any;
  user: ModerationUserMin | null;
  reviewedByUser?: ModerationUserMin | null;
  bannedUsers?: ModerationUserMin[];
};

export type ModerationUser = {
  _id: string;
  displayName: string | null;
  slug: string;
  bannedFrontpageUsers: ModerationUserMin[];
  bannedPersonalUsers: ModerationUserMin[];
};

export type ModeratorComment = {
  __typename: 'Comment';
  _id: string;
  userId: string | null;
  postId: string | null;
  postedAt?: Date | null;
  contents?: any;
  user: ModerationUserMin | null;
  post: ModerationPostMin | null;
};

export type ActiveRateLimitDetails = {
  actionType: string;
  rateLimitType: string;
  rateLimitCategory: "static" | "rolling" | "timed";
  itemsPerTimeframe: number;
  timeframeLength: number;
  timeframeUnit: string;
  rateLimitMessage: string;
  activatedAt: Date;
};

export type ModerationUserFull = {
  _id: string;
  displayName: string | null;
  slug: string;
  createdAt?: Date | null;
  karma?: number | null;
  postCount?: number | null;
  commentCount?: number | null;
};

export type ActiveRateLimit = {
  userId: string;
  rateLimits: ActiveRateLimitDetails[];
  mostRecentActivation: Date;
  user: ModerationUserFull | null;
};

export type GloballyBannedUser = {
  _id: string;
  displayName: string | null;
  slug: string;
  karma: number | null;
  createdAt: Date | null;
  postCount: number | null;
  commentCount: number | null;
  banned: Date | null;
};

const styles = defineStyles("ModerationPageContent", (theme: ThemeType) => ({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px',
    fontFamily: theme.palette.fonts.sansSerifStack,
    '@media (max-width: 768px)': {
      padding: '8px'
    }
  },
  header: {
    marginBottom: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    marginBottom: '12px',
    color: theme.palette.text.primary
  },
  topSectionsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  essay: {
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.border.grey300}`,
    borderRadius: '4px',
    padding: '12px 16px',
    lineHeight: '1.5',
    fontSize: '13px',
    '& p': {
      marginBottom: '8px',
      '&:last-child': {
        marginBottom: 0
      }
    },
    '& h2': {
      marginTop: 0,
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline'
      }
    }
  },
  essayTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px',
    color: theme.palette.text.primary
  },
  moderatorFeed: {
    background: theme.palette.background.pageActiveAreaBackground,
    border: `1px solid ${theme.palette.border.grey300}`,
    borderRadius: '4px',
    overflow: 'hidden'
  },
  moderatorFeedTitle: {
    fontSize: '14px',
    fontWeight: 600,
    padding: '12px',
    background: theme.palette.panelBackground.default,
    borderBottom: `1px solid ${theme.palette.border.grey300}`,
    color: theme.palette.text.primary,
    margin: 0
  },
  moderatorFeedContent: {
    padding: '0 12px 12px 12px'
  },
  section: {
    background: theme.palette.background.pageActiveAreaBackground,
    border: `1px solid ${theme.palette.border.grey300}`,
    borderRadius: '4px',
    marginBottom: '20px',
    overflow: 'hidden'
  },
  sectionHeader: {
    padding: '8px 12px',
    background: theme.palette.panelBackground.default,
    borderBottom: `1px solid ${theme.palette.border.grey300}`,
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'auto',
    '@media (max-width: 768px)': {
      padding: '0px 8px',
      display: 'block',
      fontSize: '11px',
      '& thead': {
        display: 'none'
      },
      '& tbody': {
        display: 'block'
      },
      '& tr': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        borderBottom: `${theme.palette.border.grey300}`,
        padding: '6px 0',
        gap: '4px 8px',
        '&:last-child': {
          borderBottom: 'none'
        }
      },
      '& td': {
        display: 'inline-flex',
        alignItems: 'baseline',
        border: 'none',
        padding: '2px 4px',
        gap: '4px',
        '&:before': {
          content: 'attr(data-label) ": "',
          fontWeight: 600,
          color: theme.palette.text.dim,
          fontSize: '10px',
          whiteSpace: 'nowrap'
        }
      }
    }
  },
  th: {
    padding: '6px 10px',
    textAlign: 'left',
    borderBottom: `1px solid ${theme.palette.border.grey300}`,
    background: theme.palette.panelBackground.default,
    fontSize: '12px',
    fontWeight: 600,
    color: theme.palette.text.dim,
    whiteSpace: 'nowrap',
    '@media (max-width: 768px)': {
      padding: '4px 6px',
      fontSize: '10px'
    }
  },
  td: {
    padding: '6px 10px',
    borderBottom: `1px solid ${theme.palette.border.faint}`,
    fontSize: '13px',
    color: theme.palette.text.primary,
    lineHeight: '1.4',
    '@media (max-width: 768px)': {
      padding: '4px 6px',
      fontSize: '11px',
      whiteSpace: 'normal'
    }
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.15s',
    '&:hover': {
      background: theme.palette.panelBackground.default
    }
  },
  trNonExpandable: {
    transition: 'background 0.15s',
    '&:hover': {
      background: theme.palette.panelBackground.default
    }
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  titleLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
    maxWidth: '300px',
    '@media (max-width: 768px)': {
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'unset',
      maxWidth: 'none'
    },
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  date: {
    color: theme.palette.text.dim,
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 500,
    background: theme.palette.grey[300]
  },
  expandedContent: {
    padding: '12px',
    background: theme.palette.panelBackground.default,
    borderTop: `1px solid ${theme.palette.border.grey300}`,
    fontSize: '13px',
    lineHeight: '1.5',
    color: theme.palette.text.primary,
    maxWidth: '800px',
    '& ul, & ol': {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    '& li': {
      marginBottom: '6px',
      '&:last-child': {
        marginBottom: 0
      }
    }
  },
  userList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  userBadge: {
    display: 'inline-block',
    padding: '3px 6px',
    background: theme.palette.primary.light,
    borderRadius: '3px',
    fontSize: '12px',
    textDecoration: 'none',
    color: theme.palette.text.alwaysWhite,
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
    '&:hover': {
      background: theme.palette.primary.main,
      color: theme.palette.text.alwaysWhite
    }
  },
  pagination: {
    padding: '10px',
    textAlign: 'center',
    borderTop: `1px solid ${theme.palette.border.grey300}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px'
  },
  pageButton: {
    padding: '4px 8px',
    background: theme.palette.background.pageActiveAreaBackground,
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.border.grey300}`,
    borderRadius: '3px',
    fontSize: '12px',
    cursor: 'pointer',
    minWidth: '32px',
    '&:hover': {
      background: theme.palette.panelBackground.default
    }
  },
  pageButtonActive: {
    padding: '4px 8px',
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: '3px',
    fontSize: '12px',
    cursor: 'default',
    minWidth: '32px',
    fontWeight: 600
  },
  pageButtonDisabled: {
    padding: '4px 8px',
    background: theme.palette.grey[200],
    color: theme.palette.text.dim3,
    border: `1px solid ${theme.palette.border.grey300}`,
    borderRadius: '3px',
    fontSize: '12px',
    cursor: 'not-allowed',
    minWidth: '32px'
  },
  pageInfo: {
    color: theme.palette.text.dim,
    fontSize: '12px',
    margin: '0 6px'
  },
  empty: {
    padding: '20px',
    textAlign: 'center',
    color: theme.palette.text.dim3,
    fontSize: '13px'
  },
  reason: {
    maxWidth: '600px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '1.4',
    paddingRight: '12px',
    '@media (max-width: 768px)': {
      maxWidth: 'none',
      whiteSpace: 'normal',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    '@media (min-width: 769px)': {
      '& *': {
        display: 'inline',
        margin: 0,
        padding: 0,
      }
    },
    '& br': {
      display: 'none'
    },
    '& ul, & ol': {
      listStyle: 'none'
    },
    '& p:not(:last-child)::after, & li:not(:last-child)::after': {
      content: '" "',
      whiteSpace: 'pre'
    }
  },
  rateLimitTrigger: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    lineHeight: '1.4',
    '@media (max-width: 768px)': {
      maxWidth: 'none',
      whiteSpace: 'normal',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    },
    '& *': {
      display: 'inline',
      margin: 0,
      padding: 0
    },
    '& br': {
      display: 'none'
    },
    '& ul, & ol': {
      listStyle: 'none'
    },
    '& p:not(:last-child)::after, & li:not(:last-child)::after': {
      content: '" "',
      whiteSpace: 'pre'
    }
  },
  rateLimitsContainer: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  rateLimitCard: {
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.border.grey300}`,
    borderRadius: '4px',
    padding: '12px',
    transition: 'box-shadow 0.2s',
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  },
  rateLimitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${theme.palette.border.faint}`
  },
  rateLimitUserLink: {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  rateLimitTimestamp: {
    fontSize: '12px',
    color: theme.palette.text.dim,
    fontStyle: 'italic'
  },
  rateLimitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  rateLimitItem: {
    padding: '8px',
    background: theme.palette.background.pageActiveAreaBackground,
    borderRadius: '3px',
    borderLeft: `3px solid ${theme.palette.primary.main}`
  },
  rateLimitType: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    '& strong': {
      fontSize: '13px',
      color: theme.palette.text.primary
    }
  },
  rateLimitValue: {
    fontSize: '12px',
    color: theme.palette.text.dim,
    fontWeight: 500,
    background: theme.palette.grey[200],
    padding: '2px 6px',
    borderRadius: '3px'
  },
  rateLimitReason: {
    fontSize: '12px',
    color: theme.palette.text.dim,
    marginBottom: '4px',
    lineHeight: '1.3'
  },
  rateLimitActivated: {
    fontSize: '11px',
    color: theme.palette.text.dim3,
    fontStyle: 'italic'
  },
  commentsList: {
    '& > *': {
      marginBottom: '8px'
    }
  },
  rateLimitCategoryTag: {
    display: 'inline-block',
    padding: '1px 4px',
    borderRadius: '2px',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginLeft: '4px',
    verticalAlign: 'middle',
    transition: 'background 0.2s ease, color 0.2s ease'
  },
  rollingTag: {
    background: theme.palette.grey[300],
    color: theme.palette.grey[800]
  },
  timedTag: {
    background: theme.palette.grey[200],
    color: theme.palette.grey[700]
  },
  staticTag: {
    background: theme.palette.grey[100],
    color: theme.palette.grey[600]
  },
  filterCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    '& input': {
      cursor: 'pointer'
    }
  },
  sectionCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    fontWeight: 400,
    '& input': {
      cursor: 'pointer'
    }
  },
  expandedRejectionReason: {
    '& ul, & ol': {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    '& li': {
      marginBottom: '8px'
    }
  },
  expandedGrid: {
    '@media (max-width: 768px)': {
      display: 'block !important',
      '& > div': {
        marginBottom: '16px',
        '&:last-child': {
          marginBottom: 0
        }
      }
    }
  }
}));

interface Props {
  moderatorCommentIds: string[];
  moderatorCommentsCount: number;
  moderatorCommentsOffset: number;
  moderatorPosts: ModerationPost[];
  activeRateLimits: ActiveRateLimit[];
  activeRateLimitsCount: number;
  activeRateLimitsOffset: number;
  showExpiredRateLimits: boolean;
  showNewUserRateLimits: boolean;
  deletedComments: ModerationComment[];
  deletedCommentsCount: number;
  deletedCommentsOffset: number;
  rejectedPosts: ModerationPost[];
  rejectedPostsCount: number;
  rejectedPostsOffset: number;
  rejectedComments: ModerationComment[];
  rejectedCommentsCount: number;
  rejectedCommentsOffset: number;
  postsWithBannedUsers: ModerationPost[];
  postsWithBannedUsersCount: number;
  postsWithBannedUsersOffset: number;
  usersWithBannedUsers: ModerationUser[];
  usersWithBannedUsersCount: number;
  usersWithBannedUsersOffset: number;
  globallyBannedUsers: GloballyBannedUser[];
  globallyBannedUsersCount: number;
  globallyBannedUsersOffset: number;
  showExpiredBans: boolean;
  limit: number;
}

export default function ModerationPageContent(props: Props) {
  const {
    moderatorCommentIds,
    moderatorCommentsCount,
    moderatorCommentsOffset,
    moderatorPosts,
    activeRateLimits,
    activeRateLimitsCount,
    activeRateLimitsOffset,
    showExpiredRateLimits,
    showNewUserRateLimits,
    deletedComments,
    deletedCommentsCount,
    deletedCommentsOffset,
    rejectedPosts,
    rejectedPostsCount,
    rejectedPostsOffset,
    rejectedComments,
    rejectedCommentsCount,
    rejectedCommentsOffset,
    postsWithBannedUsers,
    postsWithBannedUsersCount,
    postsWithBannedUsersOffset,
    usersWithBannedUsers,
    usersWithBannedUsersCount,
    usersWithBannedUsersOffset,
    globallyBannedUsers,
    globallyBannedUsersCount,
    globallyBannedUsersOffset,
    showExpiredBans,
    limit,
  } = props;

  const classes = useStyles(styles);
  const searchParams = useSearchParams();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch full comment data via GraphQL
  const { data: commentsData, loading: commentsLoading } = useQuery(ModeratorCommentsMultiQuery, {
    variables: { commentIds: moderatorCommentIds },
    fetchPolicy: 'cache-first',
    skip: moderatorCommentIds.length === 0,
  });

  const moderatorComments = commentsData?.comments?.results || [];

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  const buildToggleExpiredRateLimitsUrl = () => {
    const params = new URLSearchParams(searchParams?.toString());
    if (showExpiredRateLimits) {
      params.delete('showExpiredRateLimits');
    } else {
      params.set('showExpiredRateLimits', 'true');
    }
    // Reset pagination when toggling
    params.delete('activeRateLimitsOffset');
    return `/moderation?${params.toString()}`;
  };

  const buildToggleNewUserRateLimitsUrl = () => {
    const params = new URLSearchParams(searchParams?.toString());
    if (showNewUserRateLimits) {
      params.delete('showNewUserRateLimits');
    } else {
      params.set('showNewUserRateLimits', 'true');
    }
    // Reset pagination when toggling
    params.delete('activeRateLimitsOffset');
    return `/moderation?${params.toString()}`;
  };

  const buildToggleExpiredBansUrl = () => {
    const params = new URLSearchParams(searchParams?.toString());
    if (showExpiredBans) {
      params.delete('showExpiredBans');
    } else {
      params.set('showExpiredBans', 'true');
    }
    // Reset pagination when toggling
    params.delete('globallyBannedUsersOffset');
    return `/moderation?${params.toString()}`;
  };

  const getRateLimitCategoryTag = (category: "static" | "rolling" | "timed") => {
    const tagClass = category === "rolling" ? classes.rollingTag :
                     category === "timed" ? classes.timedTag :
                     classes.staticTag;

    const tooltips = {
      rolling: "Based on last 20 posts/comments - never expires, updates as contributions change",
      timed: "Based on 30-day window - can expire as time passes",
      static: "Based on total karma - always active while karma condition is met"
    };

    return (
      <span
        className={`${classes.rateLimitCategoryTag} ${tagClass}`}
        title={tooltips[category]}
      >
        {category}
      </span>
    );
  };

  const renderContent = (contents: any) => {
    if (!contents?.html) return null;
    return <div className={classes.expandedContent} dangerouslySetInnerHTML={{ __html: contents.html }} />;
  };

  const renderReason = (reason: string | null | undefined) => {
    if (!reason) return '—';
    return (
      <div
        className={classes.reason}
        dangerouslySetInnerHTML={{ __html: reason }}
      />
    );
  };

  const buildPaginationUrl = (section: string, page: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    const newOffset = (page - 1) * limit;
    const offsetParam = `${section}Offset`;
    if (newOffset === 0) params.delete(offsetParam);
    else params.set(offsetParam, String(newOffset));
    return `/moderation?${params.toString()}`;
  };

  const renderPagination = (section: string, totalCount: number, currentOffset: number) => {
    const totalPages = Math.ceil(totalCount / limit);
    if (totalPages <= 1) return null;

    const currentPage = Math.floor(currentOffset / limit) + 1;

    return (
      <div className={classes.pagination}>
        {currentPage === 1 ? (
          <span className={classes.pageButtonDisabled}>First</span>
        ) : (
          <Link href={buildPaginationUrl(section, 1)} className={classes.pageButton} scroll={false}>
            First
          </Link>
        )}
        {currentPage === 1 ? (
          <span className={classes.pageButtonDisabled}>Previous</span>
        ) : (
          <Link href={buildPaginationUrl(section, currentPage - 1)} className={classes.pageButton} scroll={false}>
            Previous
          </Link>
        )}
        <span className={classes.pageInfo}>
          Page {currentPage} of {totalPages} ({totalCount} total)
        </span>
        {currentPage >= totalPages ? (
          <span className={classes.pageButtonDisabled}>Next</span>
        ) : (
          <Link href={buildPaginationUrl(section, currentPage + 1)} className={classes.pageButton} scroll={false}>
            Next
          </Link>
        )}
        {currentPage >= totalPages ? (
          <span className={classes.pageButtonDisabled}>Last</span>
        ) : (
          <Link href={buildPaginationUrl(section, totalPages)} className={classes.pageButton} scroll={false}>
            Last
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>Moderation Log</h1>
      </div>

      <div className={classes.topSectionsContainer}>
        <div>
          <div className={classes.essay}>
            <h2 className={classes.essayTitle}>Moderation Principles and Process</h2>
            <p>LessWrong is trying to cultivate a specific culture. The best pointers towards that culture are the <Link href="/rationality">LessWrong Sequences</Link> and the <Link href="/newUserGuide">New User Guide</Link>.</p>
            <p>LessWrong operates under benevolent dictatorship of the Lightcone Infrastructure team, under its current CEO <Link href="/users/habryka4">habryka</Link>. It is not a democracy. For some insight into our moderation philosophy see <Link href="/posts/tscc3e5eujrsEeFN4/well-kept-gardens-die-by-pacifism">"Well Kept Gardens Die By Pacifism"</Link>.</p>
            <p>Norms on the site get developed largely by case-law. I.e. the moderators notice that something is going wrong on the site, then they take some moderation actions to fix this, and in doing so establish some precedent about what will cause future moderation action. There is no comprehensive set of rules you can follow that will guarantee we will not moderate your comments or content. Most of the time we "know it when we see it".</p>
            <p>LessWrong relies heavily on rate-limits in addition to deleting content and banning users. New users start out with some relatively lax rate limits to avoid spamming. Users who get downvoted acquire stricter and stricter rate limits the more they get downvoted.</p>
            <p>Not all moderation on LessWrong is done by the moderators. Authors with enough upvoted content on the site can moderate their own posts.</p>
            <p>Below are some of the top-level posts that explain the moderation guidelines on the site. On the right, you will find recent moderation comments by moderators, showing you examples of what moderator intervention looks like.</p>
            <p>Beyond that, this page will show you all moderation actions and bans taken across the site by anyone, including any deleted content (unless the moderators explicitly deleted it in a way that would hide it from this page, which we do in cases like doxxing).</p>
          </div>

          {/* Moderator Posts */}
          {moderatorPosts.length > 0 && (
            <div className={classes.essay} style={{ marginTop: '16px' }}>
              <h2 className={classes.essayTitle}>Moderator Posts</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {moderatorPosts.map((post) => (
                  <li key={post._id} style={{ marginBottom: '8px' }}>
                    <a href={postGetPageUrl(post)} className={classes.link}>
                      {post.title}
                    </a>
                    {post.postedAt && (
                      <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                        {new Date(post.postedAt).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Moderator Comments Feed */}
        <div className={classes.moderatorFeed}>
          <h2 className={classes.moderatorFeedTitle}>Moderator Comments ({moderatorCommentsCount})</h2>
          <div className={classes.moderatorFeedContent}>
            <div className={classes.commentsList}>
              {commentsLoading ? (
                <Loading />
              ) : moderatorComments && moderatorComments.length > 0 ? (
                moderatorComments.map((comment: any) => (
                  <CommentsNode
                    key={comment._id}
                    treeOptions={{
                      post: comment.post || undefined,
                      forceSingleLine: true
                    }}
                    comment={comment}
                    loadChildrenSeparately
                  />
                ))
              ) : (
                <div className={classes.empty}>No moderator comments found</div>
              )}
            </div>
            {renderPagination('moderatorComments', moderatorCommentsCount, moderatorCommentsOffset)}
          </div>
        </div>
      </div>

      {/* Auto Rate Limits Table - Can show active or expired */}
      <div className={classes.section}>
        <div className={classes.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>{showExpiredRateLimits ? 'Expired' : 'Active'} Auto Rate Limits ({activeRateLimitsCount} users)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href={buildToggleNewUserRateLimitsUrl()} className={classes.filterCheckbox} scroll={false}>
              <input
                type="checkbox"
                checked={showNewUserRateLimits}
                readOnly
              />{' '}
              Show new user rate limits
            </Link>
            <Link
              href={buildToggleExpiredRateLimitsUrl()}
              className={classes.pageButton}
              title={showExpiredRateLimits ? "We only have up-to-date data on expired rate limits from October 1st 2025" : "Switch to view expired rate limits"}
              scroll={false}
            >
              {showExpiredRateLimits ? 'Show Active' : 'Show Expired'}
            </Link>
          </div>
        </div>
        {activeRateLimits.length > 0 ? (
          <>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th className={classes.th}>User</th>
                  <th className={classes.th}>Account Age</th>
                  <th className={classes.th}>Karma</th>
                  <th className={classes.th}>Posts</th>
                  <th className={classes.th}>Comments</th>
                  <th className={classes.th}>Rate Limits</th>
                  <th className={classes.th}>Trigger Reason</th>
                  <th className={classes.th}>Triggered</th>
                  <th className={classes.th}>Condition to Lift</th>
                </tr>
              </thead>
              <tbody>
                {activeRateLimits.map((userRateLimit) => {
                  // Get the most restrictive limit for each action type to display in main row
                  const limitsByAction = userRateLimit.rateLimits.reduce((acc, limit) => {
                    if (!acc[limit.actionType] || limit.itemsPerTimeframe < acc[limit.actionType].itemsPerTimeframe) {
                      acc[limit.actionType] = limit;
                    }
                    return acc;
                  }, {} as Record<string, ActiveRateLimitDetails>);

                  const primaryLimit = Object.values(limitsByAction)[0];

                  // Check if this is a new user (< 5 posts + comments)
                  const isNewUser = (userRateLimit.user?.postCount ?? 0) + (userRateLimit.user?.commentCount ?? 0) < 5;

                  return (
                    <React.Fragment key={userRateLimit.userId}>
                      <tr
                        className={classes.tr}
                        onClick={() => toggleRowExpanded(userRateLimit.userId)}
                        style={isNewUser && showNewUserRateLimits ? { opacity: 0.5, transition: 'opacity 0.2s' } : undefined}
                        onMouseEnter={(e) => { if (isNewUser && showNewUserRateLimits) e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { if (isNewUser && showNewUserRateLimits) e.currentTarget.style.opacity = '0.5'; }}
                      >
                        <td className={classes.td} data-label="User">
                          {userRateLimit.user ? (
                            <a
                              href={userGetProfileUrl(userRateLimit.user)}
                              className={classes.link}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {userRateLimit.user.displayName || 'Anonymous'}
                            </a>
                          ) : (
                            'Unknown'
                          )}
                        </td>
                        <td className={classes.td} data-label="Account Age">
                          <span className={classes.date}>
                            {userRateLimit.user?.createdAt ? new Date(userRateLimit.user.createdAt).toLocaleDateString() : '—'}
                          </span>
                        </td>
                        <td className={classes.td} data-label="Karma">
                          {userRateLimit.user?.karma ?? 'N/A'}
                        </td>
                        <td className={classes.td} data-label="Posts">
                          {userRateLimit.user?.postCount ?? 0}
                        </td>
                        <td className={classes.td} data-label="Comments">
                          {userRateLimit.user?.commentCount ?? 0}
                        </td>
                        <td className={classes.td} data-label="Rate Limits">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {Object.values(limitsByAction).map((limit, idx) => (
                              <span key={idx} style={{ whiteSpace: 'nowrap' }}>
                                <strong>{limit.actionType}:</strong> {limit.itemsPerTimeframe}/{limit.timeframeLength}{limit.timeframeUnit[0]}
                                {getRateLimitCategoryTag(limit.rateLimitCategory)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={classes.td} data-label="Trigger Reason">
                          <div className={classes.rateLimitTrigger} dangerouslySetInnerHTML={{ __html: primaryLimit.rateLimitMessage }} />
                        </td>
                        <td className={classes.td} data-label="Triggered">
                          <span className={classes.date}>
                            {new Date(primaryLimit.activatedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className={classes.td} data-label="Condition to Lift">
                          {showExpiredRateLimits ? (
                            <span style={{ color: '#999' }}>Deactivated</span>
                          ) : primaryLimit.rateLimitCategory === "rolling" ? (
                            <span>Until last 20 posts + comments improve</span>
                          ) : primaryLimit.rateLimitCategory === "timed" ? (
                            <span>Until 30-day window passes</span>
                          ) : (
                            <span>Until karma goes up</span>
                          )}
                        </td>
                      </tr>
                      {expandedRows.has(userRateLimit.userId) && (
                        <tr>
                          <td colSpan={9} className={classes.expandedContent}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <strong>All Rate Limits:</strong>
                              {userRateLimit.rateLimits.map((limit, idx) => (
                                <div key={idx} style={{ paddingLeft: '12px', borderLeft: '3px solid #5f9bb8' }}>
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>{limit.actionType}</strong>: {limit.itemsPerTimeframe} per {limit.timeframeLength} {limit.timeframeUnit}
                                    {getRateLimitCategoryTag(limit.rateLimitCategory)}
                                  </div>
                                  <div
                                    style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}
                                    dangerouslySetInnerHTML={{ __html: limit.rateLimitMessage }}
                                  />
                                  <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                    Triggered: {new Date(limit.activatedAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {renderPagination('activeRateLimits', activeRateLimitsCount, activeRateLimitsOffset)}
          </>
        ) : (
          <div className={classes.empty}>
            No {showExpiredRateLimits ? 'expired' : 'active'} rate limits found
          </div>
        )}
      </div>

      {/* Deleted Comments Table */}
      {deletedComments.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionHeader}>Deleted Comments ({deletedCommentsCount})</div>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Date</th>
                <th className={classes.th}>Author</th>
                <th className={classes.th}>Post</th>
                <th className={classes.th}>Reason</th>
                <th className={classes.th}>Deleted By</th>
              </tr>
            </thead>
            <tbody>
              {deletedComments.map((comment) => (
                <React.Fragment key={comment._id}>
                  <tr className={classes.tr} onClick={() => toggleRowExpanded(comment._id)}>
                    <td className={classes.td} data-label="Date">
                      <span className={classes.date}>
                        {comment.deletedDate ? new Date(comment.deletedDate).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className={classes.td} data-label="Author">
                      {comment.user ? (
                        <a href={userGetProfileUrl(comment.user)} className={classes.link}>
                          {comment.user.displayName}
                        </a>
                      ) : '—'}
                    </td>
                    <td className={classes.td} data-label="Post">
                      {comment.post ? (
                        <a href={postGetPageUrl(comment.post)} className={classes.titleLink}>
                          {comment.post.title}
                        </a>
                      ) : '—'}
                    </td>
                    <td className={classes.td} data-label="Reason">{renderReason(comment.deletedReason)}</td>
                    <td className={classes.td} data-label="Deleted By">
                      {comment.deletedByUser ? (
                        <a href={userGetProfileUrl(comment.deletedByUser)} className={classes.link}>
                          {comment.deletedByUser.displayName}
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                  {expandedRows.has(comment._id) && (
                    <tr>
                      <td colSpan={5}>{renderContent(comment.contents)}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {renderPagination('deletedComments', deletedCommentsCount, deletedCommentsOffset)}
        </div>
      )}

      {/* Rejected Posts Table */}
      {rejectedPosts.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionHeader}>Rejected Posts ({rejectedPostsCount})</div>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Date</th>
                <th className={classes.th}>Title</th>
                <th className={classes.th}>Author</th>
                <th className={classes.th}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rejectedPosts.map((post) => (
                <React.Fragment key={post._id}>
                  <tr className={classes.tr} onClick={() => toggleRowExpanded(post._id)}>
                    <td className={classes.td} data-label="Date">
                      <span className={classes.date}>
                        {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className={classes.td} data-label="Title">
                      <a href={postGetPageUrl(post)} className={classes.titleLink} onClick={(e) => e.stopPropagation()}>
                        {post.title}
                      </a>
                    </td>
                    <td className={classes.td} data-label="Author">
                      {post.user ? (
                        <a href={userGetProfileUrl(post.user)} className={classes.link} onClick={(e) => e.stopPropagation()}>
                          {post.user.displayName}
                        </a>
                      ) : '—'}
                    </td>
                    <td className={classNames(classes.td, classes.reason)} data-label="Reason">{renderReason(post.rejectedReason)}</td>
                  </tr>
                  {expandedRows.has(post._id) && post.rejectedReason && (
                    <tr>
                      <td colSpan={4}>
                        <div className={classes.expandedContent} dangerouslySetInnerHTML={{ __html: post.rejectedReason }} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {renderPagination('rejectedPosts', rejectedPostsCount, rejectedPostsOffset)}
        </div>
      )}

      {/* Rejected Comments Table */}
      {rejectedComments.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionHeader}>Rejected Comments ({rejectedCommentsCount})</div>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Date</th>
                <th className={classes.th}>User</th>
                <th className={classes.th}>Post</th>
                <th className={classes.th}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rejectedComments.map((comment) => (
                <React.Fragment key={comment._id}>
                  <tr className={classes.tr} onClick={() => toggleRowExpanded(comment._id)}>
                    <td className={classes.td} data-label="Date">
                      <span className={classes.date}>
                        {comment.postedAt ? new Date(comment.postedAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className={classes.td} data-label="User">
                      {comment.user ? (
                        <a href={userGetProfileUrl(comment.user)} className={classes.link} onClick={(e) => e.stopPropagation()}>
                          {comment.user.displayName}
                        </a>
                      ) : '—'}
                    </td>
                    <td className={classes.td} data-label="Post">
                      {comment.post ? (
                        <a href={postGetPageUrl(comment.post)} className={classes.titleLink} onClick={(e) => e.stopPropagation()}>
                          {comment.post.title}
                        </a>
                      ) : '—'}
                    </td>
                    <td className={classes.td} data-label="Reason">{renderReason(comment.rejectedReason)}</td>
                  </tr>
                  {expandedRows.has(comment._id) && (
                    <tr>
                      <td colSpan={4}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '12px' }} className={classes.expandedGrid}>
                          <div>
                            <strong style={{ display: 'block', marginBottom: '8px' }}>Comment:</strong>
                            {comment.contents?.html ? (
                              <div dangerouslySetInnerHTML={{ __html: comment.contents.html }} />
                            ) : (
                              <span style={{ color: '#999' }}>No content available</span>
                            )}
                          </div>
                          <div>
                            <strong style={{ display: 'block', marginBottom: '8px' }}>Rejection Reason:</strong>
                            {comment.rejectedReason ? (
                              <div
                                className={classes.expandedRejectionReason}
                                dangerouslySetInnerHTML={{ __html: comment.rejectedReason }}
                              />
                            ) : (
                              <span style={{ color: '#999' }}>No reason provided</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {renderPagination('rejectedComments', rejectedCommentsCount, rejectedCommentsOffset)}
        </div>
      )}

      {/* Posts with Banned Users Table */}
      {postsWithBannedUsers.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionHeader}>Posts with Banned Users ({postsWithBannedUsersCount})</div>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Date</th>
                <th className={classes.th}>Title</th>
                <th className={classes.th}>Author</th>
                <th className={classes.th}>Banned Users</th>
              </tr>
            </thead>
            <tbody>
              {postsWithBannedUsers.map((post) => (
                <tr key={post._id} className={classes.trNonExpandable}>
                  <td className={classes.td} data-label="Date">
                    <span className={classes.date}>
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className={classes.td} data-label="Title">
                    <a href={postGetPageUrl(post)} className={classes.titleLink}>
                      {post.title}
                    </a>
                  </td>
                  <td className={classes.td} data-label="Author">
                    {post.user ? (
                      <a href={userGetProfileUrl(post.user)} className={classes.link}>
                        {post.user.displayName}
                      </a>
                    ) : '—'}
                  </td>
                  <td className={classes.td} data-label="Banned Users">
                    <div className={classes.userList}>
                      {post.bannedUsers?.map((user) => (
                        <a key={user._id} href={userGetProfileUrl(user)} className={classes.userBadge}>
                          {user.displayName}
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderPagination('postsWithBannedUsers', postsWithBannedUsersCount, postsWithBannedUsersOffset)}
        </div>
      )}

      {/* Users with Banned Users Table */}
      {usersWithBannedUsers.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionHeader}>Authors with Banned Users ({usersWithBannedUsersCount})</div>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Author</th>
                <th className={classes.th}>Banned from Frontpage</th>
                <th className={classes.th}>Banned from Personal Posts</th>
              </tr>
            </thead>
            <tbody>
              {usersWithBannedUsers.map((user) => (
                <tr key={user._id} className={classes.trNonExpandable}>
                  <td className={classes.td} data-label="Author">
                    <a href={userGetProfileUrl(user)} className={classes.link}>
                      {user.displayName}
                    </a>
                  </td>
                  <td className={classes.td} data-label="Banned from Frontpage">
                    <div className={classes.userList}>
                      {user.bannedFrontpageUsers?.map((bannedUser) => (
                        <a key={bannedUser._id} href={userGetProfileUrl(bannedUser)} className={classes.userBadge}>
                          {bannedUser.displayName}
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className={classes.td} data-label="Banned from Personal Posts">
                    <div className={classes.userList}>
                      {user.bannedPersonalUsers?.map((bannedUser) => (
                        <a key={bannedUser._id} href={userGetProfileUrl(bannedUser)} className={classes.userBadge}>
                          {bannedUser.displayName}
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderPagination('usersWithBannedUsers', usersWithBannedUsersCount, usersWithBannedUsersOffset)}
        </div>
      )}

      {/* Globally Banned Users Table */}
      {globallyBannedUsers.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <span>Globally Banned Users ({globallyBannedUsersCount})</span>
            <Link href={buildToggleExpiredBansUrl()} className={classes.sectionCheckbox} scroll={false}>
              <input
                type="checkbox"
                checked={showExpiredBans}
                readOnly
              />{' '}
              Show expired bans
            </Link>
          </div>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>User</th>
                <th className={classes.th}>Karma</th>
                <th className={classes.th}>Posts</th>
                <th className={classes.th}>Comments</th>
                <th className={classes.th}>Account Creation</th>
                <th className={classes.th}>Banned Until</th>
              </tr>
            </thead>
            <tbody>
              {globallyBannedUsers.map((user) => {
                // Check if ban is expired (this only matters when showExpiredBans is true)
                const isExpired = user.banned ? new Date(user.banned) <= new Date() : false;

                return (
                  <tr
                    key={user._id}
                    className={classes.trNonExpandable}
                    style={isExpired && showExpiredBans ? { opacity: 0.5, transition: 'opacity 0.2s' } : undefined}
                    onMouseEnter={(e) => { if (isExpired && showExpiredBans) e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { if (isExpired && showExpiredBans) e.currentTarget.style.opacity = '0.5'; }}
                  >
                    <td className={classes.td} data-label="User">
                      <a href={userGetProfileUrl(user)} className={classes.link}>
                        {user.displayName}
                      </a>
                    </td>
                    <td className={classes.td} data-label="Karma">{user.karma ?? '—'}</td>
                    <td className={classes.td} data-label="Posts">{user.postCount ?? 0}</td>
                    <td className={classes.td} data-label="Comments">{user.commentCount ?? 0}</td>
                    <td className={classes.td} data-label="Account Creation">
                      <span className={classes.date}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className={classes.td} data-label="Banned Until">
                      <span className={classes.date}>
                        {user.banned ? new Date(user.banned).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {renderPagination('globallyBannedUsers', globallyBannedUsersCount, globallyBannedUsersOffset)}
        </div>
      )}
    </div>
  );
}
