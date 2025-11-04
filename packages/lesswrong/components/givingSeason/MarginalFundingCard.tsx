import React, { Fragment } from "react";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { cloudinaryCloudNameSetting } from "@/lib/publicSettings";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { Link } from "@/lib/reactRouterWrapper";
import UsersName from "../users/UsersName";
import classNames from "classnames";

const styles = defineStyles("MarginalFundingCard", (theme) => ({
  root: {
    padding: 40,
    display: "flex",
    gap: 32,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.9,
    },
  },
  read: {
    background: theme.palette.givingSeason.primary,
  },
  unread: {
    background: theme.palette.text.alwaysWhite,
  },
  details: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  image: {
    width: "100%",
    height: 216,
    objectFit: "cover",
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    "&:hover": {
      opacity: 1,
    },
  },
  preview: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: "140%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": "vertical",
  },
  authors: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "140%",
  },
  interaction: {
    display: "inline",
  },
  org: {
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    textTransform: "uppercase",
    border: `1px solid ${theme.palette.text.alwaysBlack}`,
    borderRadius: "26px",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: "140%",
    padding: "6px 2px",
  },
}));

const getImageUrl = (post: PostsListWithVotes) => {
  const url = post.socialPreviewData.imageUrl;
  if (url) {
    const base = `${cloudinaryCloudNameSetting.get()}/image/upload/`;
    return url.replace(base, `${base}c_fill,w_500,dpr_2,`);
  }
  return "https://res.cloudinary.com/cea/image/upload/v1761927213/ForumImagePlaceholder.jpg";
}

export const MarginalFundingCard = ({post}: {post: PostsListWithVotes}) => {
  const href = postGetPageUrl(post);
  const {onClick} = useClickableCell({href});
  const classes = useStyles(styles);
  return (
    <article
      onClick={onClick}
      className={classNames(
        classes.root,
        post.isRead ? classes.read : classes.unread,
      )}
    >
      <div className={classes.details}>
        <img
          src={getImageUrl(post)}
          alt={post.title}
          className={classes.image}
        />
        <InteractionWrapper>
          <Link to={href} className={classes.title}>
            {post.title}
          </Link>
        </InteractionWrapper>
        <div className={classes.preview}>
          {post.contents?.plaintextDescription}
        </div>
        <div className={classes.authors}>
          by{" "}
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
      {post.marginalFundingOrg &&
        <div>
          <div className={classes.org}>
            {post.marginalFundingOrg}
          </div>
        </div>
      }
    </article>
  );
}

export default registerComponent('MarginalFundingCard', MarginalFundingCard);
