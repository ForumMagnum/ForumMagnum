import React, { MouseEvent, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useRecommendationAnalytics } from "./useRecommendationsAnalytics";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { useClickableCell } from "../common/useClickableCell";
import { Link } from "../../lib/reactRouterWrapper";
import ForumIcon from "@/components/common/ForumIcon";
import KarmaDisplay from "@/components/common/KarmaDisplay";
import PostsItemTooltipWrapper from "@/components/posts/PostsItemTooltipWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "160%",
    background: "transparent",
    borderRadius: theme.borderRadius.default,
    padding: "8px 8px 8px 0",
    marginBottom: 4,
    cursor: "pointer",
    "& a": {
      color: theme.palette.grey[1000],
      "&:hover": {
        opacity: 1,
      },
    },
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  karma: {
    width: 50,
    minWidth: 50,
    display: "flex",
    marginLeft: -6,
    flexDirection: "column",
    alignItems: "center",
    color: theme.palette.grey[600],
  },
  voteArrow: {
    color: theme.palette.grey[400],
    margin: "-6px 0 2px 0",
    height: 16,
    "& svg": {
      width: 10,
    },
  },
});

const SideRecommendation = ({post, classes}: {
  post: PostsListWithVotesAndSequence,
  classes: ClassesType<typeof styles>,
}) => {
  const href = postGetPageUrl(post);
  const {onClick: onClickCell} = useClickableCell({href});
  const {ref, onClick: onClickLink} = useRecommendationAnalytics(post._id);
  const onClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    onClickLink(e);
    onClickCell(e);
  }, [onClickCell, onClickLink]);
  return (
    <div
      className={classes.root}
      onClick={onClick}
      ref={ref}
    >
      <div className={classes.karma}>
        <div className={classes.voteArrow}>
          <ForumIcon icon="SoftUpArrow" />
        </div>
        <KarmaDisplay document={post} />
      </div>
      <PostsItemTooltipWrapper post={post}>
        <Link to={href} onClick={(e) => e.preventDefault()}>
          {post.title}
        </Link>
      </PostsItemTooltipWrapper>
    </div>
  );
}

const SideRecommendationComponent = registerComponent(
  "SideRecommendation",
  SideRecommendation,
  {styles},
);

declare global {
  interface ComponentTypes {
    SideRecommendation: typeof SideRecommendationComponent
  }
}

export default SideRecommendationComponent;
