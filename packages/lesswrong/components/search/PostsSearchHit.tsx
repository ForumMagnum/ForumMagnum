import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import type { Hit } from 'react-instantsearch-core';
import DescriptionIcon from '@material-ui/icons/Description';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 10,
    paddingTop: 8,
    paddingBottom: 8,
    display: 'flex',
    alignItems: 'center',
    borderTop: "solid 1px rgba(0,0,0,.1)",
    overflowWrap: "break-word"
  },
  icon: {
    width: 20,
    color: theme.palette.grey[400],
    marginRight: 12,
    marginLeft: 4
  },
  metaData: {

  },
  snippet: {
    ...theme.typography.postStyle,
    lineHeight: "1.3rem",
    marginTop: 4
  },
  title: {
    marginBottom: 0
  }
})

const isLeftClick = (event: MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const PostsSearchHit = ({hit, clickAction, classes}: {
  hit: Hit<any>,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const post = (hit as AlgoliaPost);
  const { Typography, LWTooltip } = Components;
  
  return <div className={classes.root}>
    <LWTooltip title="Post">
      <DescriptionIcon className={classes.icon} />
    </LWTooltip>
    <Link
      onClick={(event: MouseEvent) => isLeftClick(event) && clickAction && clickAction()}
      to={postGetPageUrl(post)}
    >
        <Typography variant="title" className={classes.title}>
          {post.title}
        </Typography>
        <div className={classes.metaData}>
          {post.authorDisplayName && <Components.MetaInfo>
            {post.authorDisplayName}
          </Components.MetaInfo>}
          <Components.MetaInfo>
            {post.baseScore} points
          </Components.MetaInfo>
          {post.postedAt && <Components.MetaInfo>
            <Components.FormatDate date={post.postedAt}/>
          </Components.MetaInfo>}
        </div>
        <div className={classes.snippet}><Snippet attribute="body" hit={post} tagName="mark" /></div>
    </Link>
  </div>
}


const PostsSearchHitComponent = registerComponent("PostsSearchHit", PostsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    PostsSearchHit: typeof PostsSearchHitComponent
  }
}

