import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { Typography } from "../common/Typography";
import SidebarInfo from "./SidebarInfo";
import CommentsItemDate from "../comments/CommentsItem/CommentsItemDate";

const styles = (theme: ThemeType) => ({
  comment: {
    fontSize: "1rem",
    lineHeight: "1.5em"
  }
})

const SunshineCommentsItemOverview = ({ comment, classes }: {
  comment: any,
  classes: ClassesType<typeof styles>,
}) => {
  const { markdown = "" } = comment.contents || {}
  const commentExcerpt = markdown && markdown.substring(0,38);
  return (
    <div>
      <Typography variant="body2">
        <Link to={comment.post && postGetPageUrl(comment.post) + "#" + comment._id} className={classes.comment}>
          { comment.deleted ? <span>COMMENT DELETED</span>
            : <span>{ commentExcerpt }</span>
          }
        </Link>
      </Typography>
      <div>
        <SidebarInfo>
          { comment.baseScore }
        </SidebarInfo>
        <SidebarInfo>
          <Link to={userGetProfileUrl(comment.user)}>
              {comment.user && comment.user.displayName}
          </Link>
        </SidebarInfo>
        <SidebarInfo>
          <CommentsItemDate comment={comment} post={comment.post}/>
        </SidebarInfo>
      </div>
    </div>
  )
}

export default registerComponent('SunshineCommentsItemOverview', SunshineCommentsItemOverview, {styles});



