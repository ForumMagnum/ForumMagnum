import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import { useCurrentUser } from "../common/withUser";
import Checkbox from "@/lib/vendor/@material-ui/core/src/Checkbox";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import IconButton from "@/lib/vendor/@material-ui/core/src/IconButton";
import LinearProgress from "@/lib/vendor/@material-ui/core/src/LinearProgress";
import { CommentTreeOptions } from "../comments/commentTree";
import debounce from "lodash/debounce";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
  },
  section: {
    marginBottom: theme.spacing.unit * 4,
  },
  list: {
    listStyle: "none",
    padding: 0,
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    position: "relative",
  },
  checkbox: {
    padding: theme.spacing.unit,
    alignSelf: "center",
  },
  content: {
    marginLeft: theme.spacing.unit * 2,
    flex: 1,
    width: "400px",
  },
  button: {
    marginTop: theme.spacing.unit * 2,
  },
  progressBarSection: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    padding: theme.spacing.unit,
    backdropFilter: "blur(5px)",
    mask: `linear-gradient(${theme.palette.text.alwaysBlack} 75%, ${theme.palette.background.transparent})`,
  },
  progressBar: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit,
  },
  progressLabel: {
    marginTop: theme.spacing.unit,
    textAlign: "center",
  },
  singleLineCommentWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  selectAllButton: {
    position: "absolute",
    left: -40,
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0,
    transition: "opacity 0.2s",
    "&:hover": {
      opacity: 1,
    },
  },
  listItemWrapper: {
    "&:hover $selectAllButton": {
      opacity: 0.7,
    },
  },
  authorSection: {
    marginBottom: theme.spacing.unit * 2,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
  },
  authorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.unit,
    backgroundColor: theme.palette.grey[100],
    cursor: "pointer",
  },
  authorContent: {
    padding: theme.spacing.unit * 2,
  },
  sliderContainer: {
    marginBottom: theme.spacing.unit * 2,
  },
  sliderLabel: {
    marginBottom: theme.spacing.unit,
  },
  postItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing.unit,
  },
  tokenCount: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: theme.spacing.unit,
  },
});

const MAX_TOKENS = 180000;
const TOKENS_PER_WORD = 1.3;
const MAX_AUTHOR_TOKENS = 50000;

const featuredAuthors = [
  { name: "Eliezer Yudkowsky", userId: "nmk3nLpQE89dMRzzN" },
  { name: "Scott Alexander", userId: "XgYW5s8njaYrtyP7q" },
  { name: "Gwern", userId: "BtbwfsEyeT4P2eqXu" },
];

type Author = {
  name: string;
  userId: string;
};

type SelectableListProps<T> = {
  items: T[];
  selectedItems: Record<string, boolean>;
  onToggle: (newSelectedItems: Record<string, boolean>) => void;
  onSelectAll: (items: T[], currentIndex: number) => void;
  ItemComponent: React.ComponentType<{ item: T }>;
  classes: Record<string, string>;
};

const SelectableList = ({
  items,
  selectedItems,
  onToggle,
  onSelectAll,
  ItemComponent,
  classes,
}: SelectableListProps<PostsList | CommentsList>) => {
  const { ForumIcon } = Components
  return (
    <div className={classes.list}>
      {items.map((item, i) => (
        <div key={item._id} className={classes.listItemWrapper}>
          <div className={classes.listItem}>
            <IconButton className={classes.selectAllButton} onClick={() => onSelectAll(items, i)}>
              <ForumIcon icon="PlaylistAdd" /> 
            </IconButton>
            <Checkbox
              checked={!!selectedItems[item._id]}
              onChange={() =>
                onToggle({
                  ...selectedItems,
                  [item._id]: !selectedItems[item._id],
                })
              }
              className={classes.checkbox}
            />
            <div className={classes.content}>
              <ItemComponent item={item} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

type AuthorSectionProps = {
  author: Author;
  authorContent: Record<string, { posts?: any[]; comments?: any[] }>;
  selectedItems: Record<string, boolean>;
  onToggle: (newSelectedItems: Record<string, boolean>) => void;
  onSelectAll: (items: any[], currentIndex: number) => void;
  classes: Record<string, string>;
};

const calculateTokens = (
  items: { _id: string; contents: { wordCount: number | null } | null }[],
  selectedItems: Record<string, boolean>,
) => {
  return items.reduce((total: number, item) => {
    if (selectedItems[item._id]) {
      return total + ((item.contents?.wordCount ?? 0) * TOKENS_PER_WORD);
    }
    return total;
  }, 0);
};

function useGetAuthorContent(authorId: string): {posts: PostsListWithVotes[], comments: CommentsList[]} {
  const { results: posts } = useMulti({
    terms: { view: "userPosts", userId: authorId, limit: 100, sortedBy: "top" },
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    enableTotal: true,
  });

  const { results: comments } = useMulti({
    terms: { view: "profileComments", userId: authorId, limit: 200, sortBy: "top" },
    collectionName: "Comments",
    fragmentName: "CommentsList",
    enableTotal: true,
  });

  const results = useMemo(() => ({posts: posts ?? [], comments: comments ?? []}), [posts, comments]);
  return results;
}

function useGetFeaturedAuthorsContent() {
  const author1Content = useGetAuthorContent(featuredAuthors[0].userId);
  const author2Content = useGetAuthorContent(featuredAuthors[1].userId);
  const author3Content = useGetAuthorContent(featuredAuthors[2].userId);

  const results = useMemo(() => ({
    [featuredAuthors[0].userId]: author1Content,
    [featuredAuthors[1].userId]: author2Content,
    [featuredAuthors[2].userId]: author3Content,
  }), [author1Content, author2Content, author3Content]);

  return results;
}

const AuthorSection = ({
  author,
  authorContent,
  selectedItems,
  onToggle,
  onSelectAll,
  classes,
}: AuthorSectionProps) => {
  const { ForumIcon } = Components
  const [expanded, setExpanded] = useState(false);

  const postsTokens = useMemo(
    () => calculateTokens(authorContent[author.userId]?.posts ?? [], selectedItems),
    [authorContent, author.userId, selectedItems],
  );
  const commentsTokens = useMemo(
    () => calculateTokens(authorContent[author.userId]?.comments ?? [], selectedItems),
    [authorContent, author.userId, selectedItems],
  );

  const handleTokenChange = (contentType: "posts" | "comments", newValue: number) => {
    const items = authorContent[author.userId]?.[contentType] ?? [];
    let tokenCount = 0;
    const newSelectedItems = { ...selectedItems };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemTokens = (item.contents?.wordCount ?? 0) * TOKENS_PER_WORD;
      if (tokenCount + itemTokens > newValue) {
        newSelectedItems[item._id] = false;
      } else {
        newSelectedItems[item._id] = true;
        tokenCount += itemTokens;
      }
    }

    onToggle(newSelectedItems);
  };

  return (
    <div className={classes.authorSection}>
      <div className={classes.authorHeader}>
        <div onClick={() => setExpanded(!expanded)}>
          {expanded ? <ForumIcon icon="ExpandLess" /> : <ForumIcon icon="ExpandMore" />}
          <h4>{author.name}</h4>
        </div>
        <div className={classes.sliderContainer}>
          <div className={classes.tokenCount}>
            <span>Posts Tokens:</span>
            <span>{Math.round(postsTokens)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={MAX_AUTHOR_TOKENS}
            value={postsTokens}
            onChange={(e) => handleTokenChange("posts", Number(e.target.value))}
          />
        </div>
        <div className={classes.sliderContainer}>
          <div className={classes.tokenCount}>
            <span>Comments Tokens:</span>
            <span>{Math.round(commentsTokens)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={MAX_AUTHOR_TOKENS}
            value={commentsTokens}
            onChange={(e) => handleTokenChange("comments", Number(e.target.value))}
          />
        </div>
      </div>
      {expanded && (
        <div className={classes.authorContent}>
          <SelectableList
            items={authorContent[author.userId]?.posts ?? []}
            selectedItems={selectedItems}
            onToggle={onToggle}
            onSelectAll={onSelectAll}
            ItemComponent={({ item }) => <Components.PostsItem post={item as PostsListWithVotes} />}
            classes={classes}
          />
          <SelectableList
            items={authorContent[author.userId]?.comments ?? []}
            selectedItems={selectedItems}
            onToggle={onToggle}
            onSelectAll={onSelectAll}
            ItemComponent={({ item }) => (
              <Components.CommentsNode
                treeOptions={{ forceSingleLine: true } as CommentTreeOptions}
                comment={item as CommentsList}
              />
            )}
            classes={classes}
          />
        </div>
      )}
    </div>
  );
};

const debouncedSaveSelection = debounce((selectedItems: Record<string, boolean>, posts: PostsListWithVotes[], comments: CommentsList[], authorContent: {[x: string]: {posts: PostsListWithVotes[], comments: CommentsList[]}}) => {
  const selectedIds = Object.entries(selectedItems)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => id);

  const selectedPosts = selectedIds.filter(
    (id) =>
      posts?.some((post: PostsListWithVotes) => post._id === id) ||
      featuredAuthors.some((author) =>
        authorContent[author.userId]?.posts?.some((post: PostsListWithVotes) => post._id === id),
      ),
  );
  const selectedComments = selectedIds.filter(
    (id) =>
      comments?.some((comment: CommentsList) => comment._id === id) ||
      featuredAuthors.some((author) =>
        authorContent[author.userId]?.comments?.some((comment: CommentsList) => comment._id === id),
      ),
  );

  localStorage.setItem("selectedTrainingPosts", JSON.stringify(selectedPosts));
  localStorage.setItem("selectedTrainingComments", JSON.stringify(selectedComments));
}, 200);

const AutocompleteModelSettings = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { SingleColumnSection, Loading, PostsItem, LoadMore, CommentsNode } = Components;
  const currentUser = useCurrentUser();
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(() => {
    const savedPosts = JSON.parse(localStorage.getItem("selectedTrainingPosts") ?? "[]");
    const savedComments = JSON.parse(localStorage.getItem("selectedTrainingComments") ?? "[]");
    const initialSelectedItems: Record<string, boolean> = {};
    [...savedPosts, ...savedComments].forEach((id) => {
      initialSelectedItems[id] = true;
    });
    return initialSelectedItems;
  });
  const [tokenCount, setTokenCount] = useState(0);

  const {
    results: posts,
    error: postsError,
    loadMoreProps: postsLoadMoreProps,
  } = useMulti({
    terms: { view: "userPosts", userId: currentUser?._id, limit: 20, sortedBy: "top" },
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    enableTotal: true,
  });

  const {
    results: comments,
    error: commentsError,
    loadMoreProps: commentsLoadMoreProps,
  } = useMulti({ terms: { view: "profileComments", userId: currentUser?._id, limit: 30, sortBy: "top"},
    collectionName: "Comments",
    fragmentName: "CommentsList",
    enableTotal: true,
  });

  const authorContent = useGetFeaturedAuthorsContent()

  useEffect(() => {
    const allItems = [
      ...(posts ?? []),
      ...(comments ?? []),
      ...featuredAuthors.flatMap((author) => [
        ...(authorContent[author.userId]?.posts ?? []),
        ...(authorContent[author.userId]?.comments ?? []),
      ]),
    ];
    setTokenCount(calculateTokens(allItems, selectedItems));

    debouncedSaveSelection(selectedItems, posts ?? [], comments ?? [], authorContent);
  }, [selectedItems, posts, comments, authorContent]);

  const handleSelectAll = (items: Array<{ _id: string }>, currentIndex: number) => {
    const newSelectedItems = { ...selectedItems };
    items.slice(0, currentIndex + 1).forEach((item) => {
      newSelectedItems[item._id] = true;
    });
    setSelectedItems(newSelectedItems);
  };

  const handleSubmit = () => {};

  if (postsError || commentsError) return null;

  const sortedPosts = [...(posts ?? [])].sort((a, b) => (b.baseScore ?? 0) - (a.baseScore ?? 0));
  const sortedComments = [...(comments ?? [])].sort((a, b) => (b.baseScore ?? 0) - (a.baseScore ?? 0));

  return (
    <AnalyticsContext pageContext="AutocompleteModelSettingsPage">
      <SingleColumnSection>
        <div className={classes.root}>
          <h2>Select items for autocomplete model training</h2>

          <div className={classes.progressBarSection}>
            <div className={classes.progressBar}>
              <LinearProgress variant="determinate" value={(tokenCount / MAX_TOKENS) * 100} />
            </div>
            <div className={classes.progressLabel}>
              {Math.round(tokenCount)} / {MAX_TOKENS} tokens used
            </div>
          </div>

          <div className={classes.section}>
            <h3>Featured Authors</h3>
            {featuredAuthors.map((author) => (
              <AuthorSection
                key={author.userId}
                author={author}
                authorContent={authorContent}
                selectedItems={selectedItems}
                onToggle={setSelectedItems}
                onSelectAll={handleSelectAll}
                classes={classes}
              />
            ))}
          </div>

          <div className={classes.section}>
            <h3>Posts</h3>
            <SelectableList
              items={sortedPosts}
              selectedItems={selectedItems}
              onToggle={setSelectedItems}
              onSelectAll={handleSelectAll}
              ItemComponent={({ item }) => <PostsItem post={item as PostsListWithVotes} />}
              classes={classes}
            />
            <LoadMore {...postsLoadMoreProps} />
          </div>

          <div className={classes.section}>
            <h3>Comments</h3>
            <SelectableList
              items={sortedComments}
              selectedItems={selectedItems}
              onToggle={setSelectedItems}
              onSelectAll={handleSelectAll}
              ItemComponent={({ item }) => (
                <CommentsNode
                  treeOptions={{ forceSingleLine: true } as CommentTreeOptions}
                  comment={item as CommentsList}
                />
              )}
              classes={classes}
            />
            <LoadMore {...commentsLoadMoreProps} />
          </div>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            className={classes.button}
            disabled={Object.values(selectedItems).filter(Boolean).length === 0 || tokenCount > MAX_TOKENS}
          >
            Use Selected for Training
          </Button>
        </div>
      </SingleColumnSection>
    </AnalyticsContext>
  );
};

const AutocompleteModelSettingsComponent = registerComponent("AutocompleteModelSettings", AutocompleteModelSettings, {
  styles,
});

declare global {
  interface ComponentTypes {
    AutocompleteModelSettings: typeof AutocompleteModelSettingsComponent;
  }
}
