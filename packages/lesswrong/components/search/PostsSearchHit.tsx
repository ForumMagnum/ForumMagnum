import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet} from 'react-instantsearch-dom';
import grey from '@material-ui/core/colors/grey';
import Typography from '@material-ui/core/Typography';
import { useHover } from '../common/withHover';

const styles = (theme: ThemeType): JssStyles => ({
    root: {
      padding: theme.spacing.unit,
      borderBottom: "solid 1px",
      borderBottomColor: grey[200],
      '&:hover': {
        backgroundColor: grey[100],
      }
    },
  })

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const PostsSearchHit = ({hit, clickAction, classes}: {
  hit: any,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const { eventHandlers, hover, anchorEl } = useHover();
  const { PopperCard, PostsPreviewTooltipSingle, MetaInfo, FormatDate } = Components

  // If clickAction is provided, disable link and replace with Click of the action
  return <div className={classes.root} {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl} placement="left-start" modifiers={{offset:12}}>
      <PostsPreviewTooltipSingle postId={hit._id} postsList />
    </PopperCard>
    <Link
      onClick={(event) => isLeftClick(event) && clickAction && clickAction()}
      to={Posts.getPageUrl(hit)}
      target={Posts.getLinkTarget(hit)}
    >
        <Typography variant="title">
          {hit.title}
        </Typography>
        {hit.authorDisplayName && <MetaInfo>
          {hit.authorDisplayName}
        </MetaInfo>}
        <MetaInfo>
          {hit.baseScore} points
        </MetaInfo>
        {hit.postedAt && <MetaInfo>
          <FormatDate date={hit.postedAt}/>
        </MetaInfo>}
        <div><Snippet attribute="body" hit={hit} tagName="mark" /></div>
    </Link>
  </div>
}


const PostsSearchHitComponent = registerComponent("PostsSearchHit", PostsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    PostsSearchHit: typeof PostsSearchHitComponent
  }
}

