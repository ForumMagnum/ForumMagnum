import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import { Link } from "@/lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  link: {
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
});

const PeopleDirectoryCommentCountCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const url = userGetProfileUrl(user) + "#contributions";
  return (
    <div className={classes.root}>
      <Link
        to={url}
        target="_blank"
        rel="noopener noreferrer"
        className={classes.link}
      >
        {user.commentCount} {user.commentCount === 1 ? "comment" : "comments"}
      </Link>
    </div>
  );
}

const PeopleDirectoryCommentCountCellComponent = registerComponent(
  "PeopleDirectoryCommentCountCell",
  PeopleDirectoryCommentCountCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryCommentCountCell: typeof PeopleDirectoryCommentCountCellComponent
  }
}
