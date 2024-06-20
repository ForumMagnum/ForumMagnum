import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import {
  EMPTY_TEXT_PLACEHOLDER,
  emptyTextCellStyles,
  textCellStyles,
} from "./PeopleDirectoryTextCell";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    ...textCellStyles(theme),
  },
  noPosts: {
    ...emptyTextCellStyles(theme),
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
});

export const PeopleDirectoryPostsCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const posts = user.posts ?? [];

  if (!posts.length) {
    return (
      <div className={classNames(classes.root, classes.noPosts)}>
        {EMPTY_TEXT_PLACEHOLDER}
      </div>
    );
  }

  const linkProps = {
    target: "_blank",
    rel: "noopener noreferrer",
    className: classes.link,
  } as const;

  return (
    <div className={classes.root}>
      <Link to={postGetPageUrl(posts[0])} {...linkProps}>
        {posts[0].title}
      </Link>
      {posts.length > 1 &&
        <>
          {" and "}
          <Link to={userGetProfileUrl(user) + "#posts"} {...linkProps}>
            {posts.length - 1} more
          </Link>
        </>
      }
    </div>
  );
}

const PeopleDirectoryPostsCellComponent = registerComponent(
  "PeopleDirectoryPostsCell",
  PeopleDirectoryPostsCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryPostsCell: typeof PeopleDirectoryPostsCellComponent
  }
}
