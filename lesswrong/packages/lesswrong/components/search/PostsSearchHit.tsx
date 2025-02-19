import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import type { Hit } from 'react-instantsearch-core';
import DescriptionIcon from '@material-ui/icons/Description';
import { SearchHitComponentProps } from './types';

const styles = (theme: ThemeType) => ({
  root: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'flex',
    overflowWrap: "break-word"
  },
  icon: {
    width: 20,
    color: theme.palette.grey[500],
    marginRight: 12,
    marginLeft: 4,
    marginTop: 5
  },
  snippet: {
    ...theme.typography.postStyle,
    lineHeight: "1.3rem",
    wordBreak: "break-word"
  },
  title: {
    marginBottom: 0
  }
})

const isLeftClick = (event: React.MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const PostsSearchHit = ({hit, clickAction, classes, showIcon=false}: SearchHitComponentProps) => {
  const post = (hit as SearchPost);
  const { Typography, LWTooltip } = Components;

  const showSnippet = hit._snippetResult?.body?.matchLevel !== "none"

  return <div className={classes.root}>
    {showIcon && <LWTooltip title="Post">
      <DescriptionIcon className={classes.icon} />
    </LWTooltip>}
    <Link
      onClick={(event: React.MouseEvent) => isLeftClick(event) && clickAction && clickAction()}
      to={postGetPageUrl(post)}
    >
        <Typography variant="title" className={classes.title}>
          {post.title}
        </Typography>
        <div>
          {post.authorDisplayName && <Components.MetaInfo>
            {post.authorDisplayName}
          </Components.MetaInfo>}
          <Components.MetaInfo>
            {post.baseScore} karma
          </Components.MetaInfo>
          {post.postedAt && <Components.MetaInfo>
            <Components.FormatDate date={post.postedAt}/>
          </Components.MetaInfo>}
        </div>
        {showSnippet && <div className={classes.snippet}>
          <Components.MetaInfo>
            <Snippet attribute="body" hit={post} tagName="mark" />
          </Components.MetaInfo>
        </div>}
    </Link>
  </div>
}


const PostsSearchHitComponent = registerComponent("PostsSearchHit", PostsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    PostsSearchHit: typeof PostsSearchHitComponent
  }
}

