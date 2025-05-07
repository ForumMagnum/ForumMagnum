import React from "react";
import { Components } from "../../lib/vulcan-lib/components";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('PeopleDirectoryCommentCountCell', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  link: {
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
}));

export const PeopleDirectoryCommentCountCell = ({user}: {
  user: SearchUser,
}) => {
  const classes = useStyles(styles);
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
