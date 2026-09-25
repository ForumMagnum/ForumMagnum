import React, { useEffect, useState } from "react";
import uniqBy from "lodash/uniqBy";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { getSearchClient, getSearchIndexName } from "@/lib/search/searchUtil";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import ForumIcon from "../common/ForumIcon";
import Loading from "../vulcan-core/Loading";

/**
 * The current user's five most recently edited drafts and ten most recent
 * published posts, listed before they start searching.
 */
const SequenceAddPostRecentPostsQuery = gql(`
  query SequenceAddPostRecentPosts($draftsSelector: PostSelector, $publishedSelector: PostSelector) {
    drafts: posts(selector: $draftsSelector, limit: 5, enableTotal: false) {
      results {
        ...PostsList
      }
    }
    published: posts(selector: $publishedSelector, limit: 10, enableTotal: false) {
      results {
        ...PostsList
      }
    }
  }
`);

const styles = defineStyles("SequenceAddPostBox", (theme: ThemeType) => ({
  root: {
    border: theme.palette.greyBorder("1px", 0.14),
    borderRadius: 8,
    background: theme.palette.panelBackground.default,
    margin: "8px 0",
    overflow: "hidden",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderBottom: theme.palette.greyBorder("1px", 0.1),
  },
  searchIcon: {
    width: 18,
    height: 18,
    color: theme.palette.greyAlpha(0.45),
  },
  input: {
    flexGrow: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    ...theme.typography.body2,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: theme.palette.greyAlpha(0.5),
    display: "flex",
    padding: 2,
    "&:hover": {
      color: theme.palette.greyAlpha(0.9),
    },
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  results: {
    maxHeight: 320,
    overflowY: "auto",
  },
  sectionLabel: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: theme.palette.greyAlpha(0.45),
    padding: "10px 12px 4px",
  },
  result: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    width: "100%",
    textAlign: "left",
    padding: "7px 12px",
    border: "none",
    background: "none",
    cursor: "pointer",
    ...theme.typography.body2,
    fontFamily: theme.palette.fonts.sansSerifStack,
    "&:hover:enabled": {
      background: theme.palette.greyAlpha(0.04),
    },
    "&:disabled": {
      cursor: "default",
      opacity: 0.5,
    },
  },
  resultTitle: {
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  resultMeta: {
    fontSize: 12,
    color: theme.palette.greyAlpha(0.5),
    whiteSpace: "nowrap",
  },
  draftLabel: {
    fontSize: 12,
    color: theme.palette.greyAlpha(0.5),
    marginRight: 4,
  },
  empty: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.greyAlpha(0.5),
    padding: "12px",
  },
}));

/** A post as listed in the add-post box, from either a post query or a search hit. */
interface AddablePost {
  _id: string;
  title: string;
  authorName: string | null;
  baseScore: number;
  draft: boolean;
}

function fromPostsList(post: PostsList): AddablePost {
  return {
    _id: post._id,
    title: post.title,
    authorName: post.user?.displayName ?? null,
    baseScore: post.baseScore ?? 0,
    draft: !!post.draft,
  };
}

function fromSearchHit(hit: SearchPost): AddablePost {
  return {
    _id: hit._id,
    title: hit.title ?? "Untitled",
    authorName: hit.authorDisplayName ?? null,
    baseScore: hit.baseScore,
    draft: hit.draft,
  };
}

function postSearchRequest(query: string, hitsPerPage: number, facetFilters: string[][]) {
  return {
    indexName: getSearchIndexName("Posts"),
    query,
    params: { query, hitsPerPage, facetFilters },
  };
}

/**
 * Searches for posts matching `query`: up to five of the current user's own
 * posts first (the common case), then up to ten from the whole site, without
 * duplicates.
 */
async function searchPosts(query: string, currentUserId: string | undefined): Promise<AddablePost[]> {
  const response = await getSearchClient().search<SearchPost>([
    ...(currentUserId ? [postSearchRequest(query, 5, [[`userId:${currentUserId}`]])] : []),
    postSearchRequest(query, 10, []),
  ]);
  const hits = (response?.results ?? []).flatMap((result) => result.hits);
  return uniqBy(hits.map(fromSearchHit), (post) => post._id);
}

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Runs `searchPosts` for the typed query, once typing pauses. `searchResults`
 * is null while the query is empty, and a failed search shows no results.
 * Results for a query that has since changed are ignored.
 */
function useDebouncedPostSearch(query: string, currentUserId: string | undefined) {
  const [searchResults, setSearchResults] = useState<AddablePost[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchPosts(trimmed, currentUserId)
        .then((results) => { if (!cancelled) setSearchResults(results); })
        .catch(() => { if (!cancelled) setSearchResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, currentUserId]);

  return { searchResults, searching };
}

/**
 * One post in the add-post box. A post already in the sequence (`chapterName`
 * set) is shown disabled, with the chapter it's in instead of its author.
 */
const AddablePostRow = ({ post, chapterName, onAdd }: {
  post: AddablePost,
  chapterName: string | null,
  onAdd: (postId: string) => void,
}) => {
  const classes = useStyles(styles);
  return <button
    className={classes.result}
    disabled={chapterName !== null}
    onClick={() => onAdd(post._id)}
  >
    <span className={classes.resultTitle}>
      {post.draft && <span className={classes.draftLabel}>[Draft]</span>}
      {post.title}
    </span>
    <span className={classes.resultMeta}>
      {chapterName !== null
        ? `Already in ${chapterName}`
        : `${post.authorName ?? ""} · ${post.baseScore} karma`}
    </span>
  </button>;
};

/**
 * An inline box for adding posts to a chapter. Before typing it lists the
 * author's recent drafts and posts; typing searches the whole site.
 * `getChapterNameForPost` names the chapter a post is already in, or returns
 * null for posts not in the sequence.
 */
const SequenceAddPostBox = ({ onAdd, onClose, getChapterNameForPost }: {
  onAdd: (postId: string) => void,
  onClose: () => void,
  getChapterNameForPost: (postId: string) => string | null,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [query, setQuery] = useState("");
  const { searchResults, searching } = useDebouncedPostSearch(query, currentUser?._id);

  const { data: recentData, loading: recentLoading } = useQuery(SequenceAddPostRecentPostsQuery, {
    variables: {
      draftsSelector: { drafts: { userId: currentUser?._id, sortDraftsBy: "lastModified" } },
      publishedSelector: { userPosts: { userId: currentUser?._id } },
    },
    skip: !currentUser,
    ssr: false,
  });

  const recentDrafts = (recentData?.drafts?.results ?? []).map(fromPostsList);
  const recentPublished = (recentData?.published?.results ?? []).map(fromPostsList);

  const postRows = (posts: AddablePost[]) => posts.map((post) => <AddablePostRow
    key={post._id}
    post={post}
    chapterName={getChapterNameForPost(post._id)}
    onAdd={onAdd}
  />);

  const renderResults = () => {
    if (searchResults !== null) {
      if (!searchResults.length) {
        return searching ? <Loading /> : <div className={classes.empty}>No posts found</div>;
      }
      return postRows(searchResults);
    }
    if (recentLoading) {
      return <Loading />;
    }
    if (!recentDrafts.length && !recentPublished.length) {
      return <div className={classes.empty}>Search for a post to add</div>;
    }
    return <>
      {recentDrafts.length > 0 && <div className={classes.sectionLabel}>Your drafts</div>}
      {postRows(recentDrafts)}
      {recentPublished.length > 0 && <div className={classes.sectionLabel}>Your recent posts</div>}
      {postRows(recentPublished)}
    </>;
  };

  return <div className={classes.root}>
    <div className={classes.searchRow}>
      <ForumIcon icon="Search" className={classes.searchIcon} />
      <input
        className={classes.input}
        autoFocus
        value={query}
        placeholder="Search for a post to add"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      />
      <button className={classes.closeButton} onClick={onClose} title="Close">
        <ForumIcon icon="Close" className={classes.closeIcon} />
      </button>
    </div>
    <div className={classes.results}>
      {renderResults()}
    </div>
  </div>;
};

export default SequenceAddPostBox;
