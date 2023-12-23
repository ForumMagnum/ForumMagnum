import React, { FC, PropsWithChildren } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { useRecommendationAnalytics } from "./useRecommendationsAnalytics";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    gap: "10px",
    alignItems: "baseline",
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    padding: "10px 0",
    cursor: "pointer",
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  karma: {
    display: "flex",
    "& *:first-child": {
      width: 24,
      textAlign: "right",
    },
  },
  voteArrow: {
    transform: "translateY(-2px)",
    color: theme.palette.grey[400],
  },
  titleContainer: {
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "baseline",
    [theme.breakpoints.down("xs")]: {
      whiteSpace: "unset",
      flexDirection: "column",
    },
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: theme.palette.grey[1000],
    flexGrow: 1,
  },
  author: {
    textAlign: "right",
    whiteSpace: "nowrap",
    [theme.breakpoints.down("xs")]: {
      marginTop: 4,
    },
  },
  coauthors: {
    marginLeft: 3,
  },
  interactionWrapper: {
    "&:hover": {
      opacity: 1,
    },
  },
});

const PostsPageRecommendationItem = ({
  post,
  disableAnalytics,
  className,
  classes,
}: {
  post: PostsListWithVotesAndSequence,
  // This prop is not used, but is required to be compatible with RecommendationsList
  translucentBackground?: boolean,
  disableAnalytics?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  const postLink = postGetPageUrl(post, false, post.canonicalSequence?._id);
  const {onClick: onClickCell} = useClickableCell({href: postLink});
  const {ref, onClick} = useRecommendationAnalytics(
    post._id,
    onClickCell,
    disableAnalytics,
  );

  const {
    PostsItemTooltipWrapper, KarmaDisplay, PostsTitle, UsersName, LWTooltip,
    PostActionsButton,
  } = Components;

  const TitleWrapper: FC<PropsWithChildren> = ({children}) => (
    <PostsItemTooltipWrapper post={post} As="span">
      <Link to={postLink}>{children}</Link>
    </PostsItemTooltipWrapper>
  );

  return (
    <div
      onClick={onClick}
      ref={ref}
      className={classNames(classes.root, className)}
    >
      <div className={classes.karma}>
        <div>
          <KarmaDisplay document={post} />
        </div>
        <div className={classes.voteArrow}>
          <SoftUpArrowIcon />
        </div>
      </div>
      <div className={classes.titleContainer}>
        <PostsTitle
          post={post}
          Wrapper={TitleWrapper}
          isLink={false}
          curatedIconLeft
          className={classes.title}
        />
        <div className={classes.author}>
          <InteractionWrapper className={classes.interactionWrapper}>
            <UsersName user={post.user} />
            {post.coauthors?.length > 0 &&
              <LWTooltip
                title={
                  <div>
                    {post.coauthors.map((coauthor, i) =>
                      <div key={i}>
                        <UsersName user={coauthor} />
                      </div>
                    )}
                  </div>
                }
              >
                <span className={classes.coauthors}>+{post.coauthors.length} more</span>
              </LWTooltip>
            }
          </InteractionWrapper>
        </div>
      </div>
      <div>
        <InteractionWrapper>
          <PostActionsButton post={post} vertical autoPlace />
        </InteractionWrapper>
      </div>
    </div>
  );
}

const PostsPageRecommendationItemComponent = registerComponent(
  "PostsPageRecommendationItem",
  PostsPageRecommendationItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsPageRecommendationItem: typeof PostsPageRecommendationItemComponent
  }
}
