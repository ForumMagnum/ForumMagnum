import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetCommentCountStr, postGetPageUrl } from '../../lib/collections/posts/helpers';
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import PostsTitle from "../posts/PostsTitle";
import SmallSideVote from "../votes/SmallSideVote";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import ContentStyles from "../common/ContentStyles";
import LinkPostMessage from "../posts/LinkPostMessage";
import RejectedContentControls from "./RejectedContentControls";
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("SunshineNewUserPostItem", (theme: ThemeType) => ({
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap"
  },
  post: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1em",
  },
  postBody: {
    marginTop: 12,
    fontSize: "1rem",
    '& li, & h1, & h2, & h3': {
      fontSize: "1rem"
    }
  },
  vote: {
    marginRight: 10
  },
  rejection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    paddingLeft: 8,
    width: "100%",
    marginBottom: 8,
    backgroundColor: theme.palette.grey[200],
  },
  expandCollapseButton: {
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 8,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
}));

const SunshineNewUserPostItem = ({post}: {
  post: SunshinePostsList,
}) => {
  const classes = useStyles(styles);
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(!!post.rejected);

  return <div className={classes?.post}>
    <div className={classes?.rejection}>
      <ForumIcon className={classes?.expandCollapseButton} icon={isCollapsed ? "ThickChevronRight" : "ThickChevronDown"} onClick={() => setIsCollapsed(!isCollapsed)} />
      <RejectedContentControls contentWrapper={{ collectionName: 'Posts', content: post }} />
    </div>
    <div className={classes?.row}>
      <div className={classes?.row}>
        <Link to={`/posts/${post._id}`}>
          <PostsTitle post={post} showIcons={false} wrap />
          {(post.status !== 2) && <MetaInfo>[Spam] {post.status}</MetaInfo>}
        </Link>
        <span className={classes?.vote}>
          <SmallSideVote document={post} collectionName="Posts" />
        </span>
        <MetaInfo>
          <FormatDate date={post.postedAt} />
        </MetaInfo>
        <MetaInfo>
          <Link to={`${postGetPageUrl(post)}#comments`}>
            {postGetCommentCountStr(post)}
          </Link>
        </MetaInfo>
        <PostActionsButton post={post} />
      </div>
    </div>
    {!post.draft && !isCollapsed && <div className={classes?.postBody}>
      <LinkPostMessage post={post} />
      <ContentStyles contentType="postHighlight">
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: (post.contents?.html || "") }} />
      </ContentStyles>
    </div>}
  </div>
}

export default registerComponent('SunshineNewUserPostItem', SunshineNewUserPostItem);
