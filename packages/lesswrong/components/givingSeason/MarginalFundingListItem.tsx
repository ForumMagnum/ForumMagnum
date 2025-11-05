import React, { Fragment } from "react";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { Link } from "@/lib/reactRouterWrapper";
import UsersName from "../users/UsersName";
import classNames from "classnames";

const styles = defineStyles("MarginalFundingListItem", (theme) => ({
  root: {
    display: "contents",
  },
  read: {
    background: theme.palette.givingSeason.primary,
  },
  unread: {
    background: theme.palette.text.alwaysWhite,
  },
  cell: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "40px 60px",
  },
  org: {
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    border: `1px solid ${theme.palette.text.alwaysBlack}`,
    borderRadius: "26px",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: "140%",
    padding: "2px 6px",
  },
  title: {
    fontSize: 30,
    fontWeight: 600,
    letterSpacing: "-0.02em",
  },
  authors: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "140%",
  },
  by: {
    fontWeight: 500,
  },
  interaction: {
    display: "inline",
  },
}))

export const MarginalFundingListItem = ({post}: {post: PostsListWithVotes}) => {
  const href = postGetPageUrl(post);
  const {onClick} = useClickableCell({href});
  const classes = useStyles(styles);
  return (
    <article
      onClick={onClick}
      className={classes.root}
    >
      <div
        className={classNames(
          classes.cell,
          post.isRead ? classes.read : classes.unread
        )}
      >
        {post.marginalFundingOrg &&
          <div className={classes.org}>{post.marginalFundingOrg}</div>
        }
      </div>
      <div
        className={classNames(
          classes.cell,
          post.isRead ? classes.read : classes.unread
        )}
      >
        <InteractionWrapper>
          <Link to={href} className={classes.title}>
            {post.title}
          </Link>
        </InteractionWrapper>
        <div className={classes.authors}>
          <span className={classes.by}>by</span>{" "}
          <InteractionWrapper className={classes.interaction}>
            <UsersName user={post.user} tooltipPlacement="bottom-start" />
          </InteractionWrapper>
          {post.coauthors.map((user) => (
            <Fragment key={user._id}>
              {", "}
              <InteractionWrapper className={classes.interaction}>
                <UsersName user={user} tooltipPlacement="bottom-start" />
              </InteractionWrapper>
            </Fragment>
          ))}
        </div>
      </div>
    </article>
  );
}

export default registerComponent('MarginalFundingListItem', MarginalFundingListItem);
