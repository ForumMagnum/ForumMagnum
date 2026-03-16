import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { Typography } from "../common/Typography";
import SidebarInfo from "./SidebarInfo";
import CommentsItemDate from "../comments/CommentsItem/CommentsItemDate";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SunshineCommentsItemOverview', (theme: ThemeType) => ({
  comment: {
    fontSize: "1rem",
    lineHeight: "1.5em"
  }
}))

const SunshineCommentsItemOverview = ({comment}: {
  comment: any,
}) => {
  const classes = useStyles(styles);
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

export default SunshineCommentsItemOverview



