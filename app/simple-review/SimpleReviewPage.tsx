"use client";

import React, { useState } from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { Link } from "@/lib/reactRouterWrapper";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import FormatDate from "@/components/common/FormatDate";
import orderBy from "lodash/orderBy";
import { REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD, VOTING_PHASE_REVIEW_THRESHOLD, getReviewPhase, reviewYears } from "@/lib/reviewUtils";
import type { ReviewYear } from "@/lib/reviewUtils";
import { SimpleReviewPostsQueryDocument } from "@/lib/generated/gql-codegen/graphql";

type SimpleReviewPost = {
  _id: string,
  slug: string,
  title: string,
  postedAt?: string | null,
  baseScore?: number | null,
  reviewCount?: number | null,
  positiveReviewVoteCount?: number | null,
  reviewVoteScoreAllKarma?: number | null,
  user?: { _id: string, displayName: string } | null,
}
type SortField = "title" | "author" | "postedAt" | "baseScore" | "reviewCount" | "positiveReviewVoteCount" | "reviewVoteScoreAllKarma";
type SortDirection = "asc" | "desc";

const styles = defineStyles("SimpleReviewPage", (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    lineHeight: "18px",
    maxWidth: 800,
    margin: "0 auto",
  },
  controls: {
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  select: {
    marginLeft: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  headerRow: {
    position: "sticky",
    top: 0,
    background: theme.palette.background.default,
    zIndex: 1,
  },
  headerCell: {
    cursor: "pointer",
    userSelect: "none",
    paddingRight: 12,
    whiteSpace: "nowrap",
    fontSize: 12,
    color: theme.palette.grey[700],
  },
  titleCell: {
    whiteSpace: "normal",
  },
  row: {
    "&:nth-child(even)": {
      background: theme.palette.greyAlpha(0.04),
    },
    "&:hover": {
      background: theme.palette.greyAlpha(0.08),
    },
  },
  cell: {
    paddingRight: 12,
    whiteSpace: "nowrap",
    paddingTop: 3,
    paddingBottom: 3,
    verticalAlign: "top",
  },
  numberCell: {
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  selected: {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

const getDefaultSortDirection = (sortField: SortField): SortDirection => {
  if (sortField === "title" || sortField === "author") {
    return "asc";
  }
  return "desc";
}

const getSortValue = (post: SimpleReviewPost, sortField: SortField) => {
  if (sortField === "title") return post.title ?? "";
  if (sortField === "author") return post.user?.displayName ?? "";
  if (sortField === "postedAt") return post.postedAt ?? null;
  if (sortField === "baseScore") return post.baseScore ?? 0;
  if (sortField === "reviewCount") return post.reviewCount ?? 0;
  if (sortField === "positiveReviewVoteCount") return post.positiveReviewVoteCount ?? 0;
  if (sortField === "reviewVoteScoreAllKarma") return post.reviewVoteScoreAllKarma ?? 0;
  return 0;
}

interface SimpleReviewPageProps {
}

const SimpleReviewPage = (_props: SimpleReviewPageProps) => {
  const classes = useStyles(styles);
  const selectableReviewYears = [...reviewYears];
  const [selectedYear, setSelectedYear] = useState<ReviewYear | "all">("all");
  const reviewPhase = selectedYear === "all" ? getReviewPhase() : getReviewPhase(selectedYear);
  const [sortField, setSortField] = useState<SortField>("reviewVoteScoreAllKarma");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const selectedYearValue = selectedYear === "all" ? "all" : String(selectedYear);
  const reviewVotingSelector = selectedYear === "all" ? { reviewPhase } : { reviewPhase, after: `${selectedYear}-01-01`, before: `${selectedYear + 1}-01-01` };
  const { data, loading, error } = useQuery(SimpleReviewPostsQueryDocument, {
    variables: {
      selector: { reviewVoting: reviewVotingSelector },
      limit: 2000,
    },
    fetchPolicy: 'cache-and-network',
  });

  const posts: SimpleReviewPost[] = data?.posts?.results ?? [];
  const eligiblePosts = posts.filter((post) => {
    const reviewCount = post.reviewCount ?? 0;
    const positiveReviewVoteCount = post.positiveReviewVoteCount ?? 0;
    return reviewCount >= VOTING_PHASE_REVIEW_THRESHOLD && positiveReviewVoteCount >= REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD;
  });

  const sortedPosts = orderBy(eligiblePosts, [(post) => getSortValue(post, sortField)], [sortDirection]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "all") {
      setSelectedYear("all");
      return;
    }
    const parsedYear = parseInt(value);
    if (reviewYears.has(parsedYear)) {
      setSelectedYear(parsedYear);
    }
  }

  const handleSort = (nextSortField: SortField) => {
    if (nextSortField === sortField) {
      setSortDirection((prev) => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(nextSortField);
      setSortDirection(getDefaultSortDirection(nextSortField));
    }
  }

  const getSortIndicator = (field: SortField) => {
    if (field !== sortField) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  if (loading && posts.length === 0) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Failed to load posts.</div>;
  }

  return <div className={classes.root}>
    <div className={classes.controls}>
      <label>Year <select className={classes.select} value={selectedYearValue} onChange={handleYearChange}>
          <option value="all">All</option>
          {selectableReviewYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select></label>
      <span> ({sortedPosts.length})</span>
    </div>
    <table className={classes.table}>
      <thead>
        <tr className={classes.headerRow}>
          <td className={`${classes.headerCell} ${sortField === "title" ? classes.selected : ""}`} onClick={() => handleSort("title")}>Title{getSortIndicator("title")}</td>
          <td className={`${classes.headerCell} ${sortField === "author" ? classes.selected : ""}`} onClick={() => handleSort("author")}>Author{getSortIndicator("author")}</td>
          <td className={`${classes.headerCell} ${sortField === "postedAt" ? classes.selected : ""}`} onClick={() => handleSort("postedAt")}>Posted{getSortIndicator("postedAt")}</td>
          <td className={`${classes.headerCell} ${classes.numberCell} ${sortField === "baseScore" ? classes.selected : ""}`} onClick={() => handleSort("baseScore")}>Karma{getSortIndicator("baseScore")}</td>
          <td className={`${classes.headerCell} ${classes.numberCell} ${sortField === "reviewCount" ? classes.selected : ""}`} onClick={() => handleSort("reviewCount")}>Reviews{getSortIndicator("reviewCount")}</td>
          <td className={`${classes.headerCell} ${classes.numberCell} ${sortField === "positiveReviewVoteCount" ? classes.selected : ""}`} onClick={() => handleSort("positiveReviewVoteCount")}>Votes{getSortIndicator("positiveReviewVoteCount")}</td>
          <td className={`${classes.headerCell} ${classes.numberCell} ${sortField === "reviewVoteScoreAllKarma" ? classes.selected : ""}`} onClick={() => handleSort("reviewVoteScoreAllKarma")}>Score{getSortIndicator("reviewVoteScoreAllKarma")}</td>
        </tr>
      </thead>
      <tbody>
        {sortedPosts.map((post) => (
          <tr key={post._id} className={classes.row}>
            <td className={`${classes.cell} ${classes.titleCell}`}>
              <Link to={`/posts/${post._id}/${post.slug}`}>{post.title}</Link>
            </td>
            <td className={classes.cell}>{post.user?.displayName}</td>
            <td className={classes.cell}>{post.postedAt ? <FormatDate date={post.postedAt}/> : null}</td>
            <td className={`${classes.cell} ${classes.numberCell}`}>{post.baseScore}</td>
            <td className={`${classes.cell} ${classes.numberCell}`}>{post.reviewCount}</td>
            <td className={`${classes.cell} ${classes.numberCell}`}>{post.positiveReviewVoteCount}</td>
            <td className={`${classes.cell} ${classes.numberCell}`}>{Math.round(post.reviewVoteScoreAllKarma ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>{" "}
  </div>
};

export default SimpleReviewPage;
