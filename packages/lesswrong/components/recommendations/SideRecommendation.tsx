import React, { MouseEvent, useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { useRecommendationAnalytics } from "./useRecommendationsAnalytics";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { useClickableCell } from "../common/useClickableCell";
import { Link } from "../../lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "160%",
    marginBottom: 20,
    background: "transparent",
    borderRadius: theme.borderRadius.default,
    padding: 8,
    cursor: "pointer",
    "& a": {
      color: theme.palette.grey[1000],
      "&:hover": {
        opacity: 1,
      },
    },
    "&:hover": {
      background: theme.palette.grey[200],
    },
  },
});

const SideRecommendation = ({post, classes}: {
  post: PostsListWithVotesAndSequence,
  classes: ClassesType,
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
      <Link to={href}>{post.title}</Link>
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
