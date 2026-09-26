import React from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { getSearchIndexName } from "@/lib/search/searchUtil";
import { useCurrentUser } from "../common/withUser";
import { useMessages } from "../common/withMessages";
import { defineStyles, useStyles } from "../hooks/useStyles";
import ForumIcon from "../common/ForumIcon";
import Loading from "../vulcan-core/Loading";
import SearchAutoComplete from "../search/SearchAutoComplete";
import PostsListEditorSearchHit from "../search/PostsListEditorSearchHit";
import PostsTitle from "../posts/PostsTitle";

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
  },
  searchRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "8px 12px",
    borderBottom: theme.palette.greyBorder("1px", 0.1),
  },
  search: {
    flexGrow: 1,
    minWidth: 0,
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
    minWidth: 0,
  },
  resultMeta: {
    fontSize: 12,
    color: theme.palette.greyAlpha(0.5),
    whiteSpace: "nowrap",
  },
  empty: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.greyAlpha(0.5),
    padding: "12px",
  },
}));

/**
 * One of the author's recent posts in the add-post box. A post already in the
 * sequence (`chapterName` set) is shown disabled, with the chapter it's in
 * instead of its author.
 */
const RecentPostRow = ({ post, chapterName, onAdd }: {
  post: PostsList,
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
      <PostsTitle post={post} isLink={false} showIcons={false} />
    </span>
    <span className={classes.resultMeta}>
      {chapterName !== null
        ? `Already in ${chapterName}`
        : `${post.user?.displayName ?? ""} · ${post.baseScore ?? 0} karma`}
    </span>
  </button>;
};

function renderSearchHit(hit: SearchPost) {
  return <PostsListEditorSearchHit hit={hit} />;
}

/**
 * An inline box for adding posts to a chapter: the site's standard post
 * search (which doesn't include drafts), above the author's recent drafts
 * and posts. `getChapterNameForPost` names the chapter a post is already in,
 * or returns null for posts not in the sequence; picking one of those from
 * search says where it is instead of adding it again.
 */
const SequenceAddPostBox = ({ onAdd, onClose, getChapterNameForPost }: {
  onAdd: (postId: string) => void,
  onClose: () => void,
  getChapterNameForPost: (postId: string) => string | null,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();

  const { data: recentData, loading: recentLoading } = useQuery(SequenceAddPostRecentPostsQuery, {
    variables: {
      draftsSelector: { drafts: { userId: currentUser?._id, sortDraftsBy: "lastModified" } },
      publishedSelector: { userPosts: { userId: currentUser?._id } },
    },
    skip: !currentUser,
    ssr: false,
  });

  const recentDrafts = recentData?.drafts?.results ?? [];
  const recentPublished = recentData?.published?.results ?? [];

  const addFromSearch = (postId: string) => {
    const chapterName = getChapterNameForPost(postId);
    if (chapterName !== null) {
      flash(`That post is already in ${chapterName}.`);
      return;
    }
    onAdd(postId);
  };

  const recentRows = (posts: PostsList[]) => posts.map((post) => <RecentPostRow
    key={post._id}
    post={post}
    chapterName={getChapterNameForPost(post._id)}
    onAdd={onAdd}
  />);

  const renderRecentPosts = () => {
    if (recentLoading) {
      return <Loading />;
    }
    if (!recentDrafts.length && !recentPublished.length) {
      return <div className={classes.empty}>Search for a post to add</div>;
    }
    return <>
      {recentDrafts.length > 0 && <div className={classes.sectionLabel}>Your drafts</div>}
      {recentRows(recentDrafts)}
      {recentPublished.length > 0 && <div className={classes.sectionLabel}>Your recent posts</div>}
      {recentRows(recentPublished)}
    </>;
  };

  return <div className={classes.root}>
    <div className={classes.searchRow}>
      <div className={classes.search}>
        <SearchAutoComplete
          indexName={getSearchIndexName("Posts")}
          resultType="Posts"
          clickAction={addFromSearch}
          renderSuggestion={renderSearchHit}
          placeholder="Search for a post to add"
          noSearchPlaceholder="Post ID"
        />
      </div>
      <button className={classes.closeButton} onClick={onClose} title="Close">
        <ForumIcon icon="Close" className={classes.closeIcon} />
      </button>
    </div>
    <div className={classes.results}>
      {renderRecentPosts()}
    </div>
  </div>;
};

export default SequenceAddPostBox;
