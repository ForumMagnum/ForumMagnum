import React, { FC } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { useMulti } from "@/lib/crud/withMulti";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import {
  InteractionWrapper,
  useClickableCell,
} from "@/components/common/useClickableCell";
import Loading from "@/components/vulcan-core/Loading";
import UsersName from "@/components/users/UsersName";
import ForumIcon from "@/components/common/ForumIcon";
import moment from "moment";

const styles = defineStyles("GivingSeasonTopPosts", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "var(--event-color)",
    fontSize: 14,
    lineHeight: "140%",
  },
  heading: {
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    marginBottom: 4,
  },
  loading: {
    textAlign: "left !important",
    margin: "2px 0 14px 0 !important",
    "& div": {
      backgroundColor: "var(--event-color) !important",
    },
  },
  viewAll: {
    background: "var(--event-color)",
    color: theme.palette.text.alwaysBlack,
    borderRadius: theme.borderRadius.default,
    padding: "8px 24px",
    fontSize: 14,
    fontWeight: 500,
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity ease 0.2s",
    "& svg": {
      width: 16,
    },
    "&:hover": {
      opacity: 0.8,
    },
  },
  post: {
    cursor: "pointer",
    position: "relative",
    padding: "6px 8px",
    borderRadius: theme.borderRadius.default,
    overflow: "hidden",
    "&:hover .GivingSeasonTopPosts-background": {
      opacity: 0.3,
    },
  },
  background: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "var(--event-color)",
    opacity: 0.2,
    transition: "opacity ease 0.2s",
  },
  title: {
    fontWeight: 600,
  },
  details: {
    fontWeight: 500,
    opacity: 0.8,
  },
  interaction: {
    display: "inline",
  },
}))

const TopPost: FC<{post: PostsListBase}> = ({post}) => {
  const href = postGetPageUrl(post);
  const {onClick} = useClickableCell({href, ignoreLinks: true});
  const classes = useStyles(styles);
  return (
    <article onClick={onClick} role="button" className={classes.post}>
      <div aria-hidden className={classes.background} />
      <div className={classes.title}>{post.title}</div>
      <div className={classes.details}>
        <InteractionWrapper className={classes.interaction}>
          <UsersName
            user={post.user}
            tooltipPlacement="bottom-start"
          />
        </InteractionWrapper>
        {", "}
        {moment(post.postedAt).format("MMM D")}
      </div>
    </article>
  );
}

export const GivingSeasonTopPosts = ({tagId, tagSlug}: {
  tagId: string,
  tagSlug: string,
}) => {
  const {results, loading} = useMulti({
    collectionName: "Posts",
    fragmentName: "PostsListBase",
    limit: 3,
    terms: {
      tagId,
      sortedBy: "top",
    },
  });
  const href = tagSlug === "marginal-funding-week-2025"
    ? "/marginal-funding"
    : tagGetUrl({slug: tagSlug});
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      <div className={classes.heading}>Top posts</div>
      {results?.map((post) => <TopPost key={post._id} post={post} />)}
      {loading && (
        <div>
          <Loading className={classes.loading} />
        </div>
      )}
      <div>
        <Link to={href} className={classes.viewAll}>
          View all posts
          <ForumIcon icon="ArrowRight" />
        </Link>
      </div>
    </div>
  );
}

export default registerComponent("GivingSeasonTopPosts", GivingSeasonTopPosts);
