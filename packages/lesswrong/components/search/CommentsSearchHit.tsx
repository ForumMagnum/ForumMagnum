import { Components, registerComponent} from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import React from 'react';
import { useHover } from '../common/withHover';
import { PopperPlacementType } from '@material-ui/core/Popper'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit*2
  },
  snippet: {
    marginTop: theme.spacing.unit,
    wordBreak: "break-word"
  }
})

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const CommentsSearchHit = ({hit, clickAction, classes, tooltipPlacement="left-end"}: {
  hit: any,
  clickAction?: any,
  classes: ClassesType,
  tooltipPlacement: PopperPlacementType
}) => {
  const url = "/posts/" + hit.postId + "/" + hit.postSlug + "#" + hit._id
  const { eventHandlers, hover, anchorEl } = useHover();
  const { PopperCard, PostsPreviewTooltipSingleWithComment, MetaInfo, FormatDate } = Components

  return <div className={classes.root} {...eventHandlers}>
    <PopperCard open={hover} anchorEl={anchorEl} placement={tooltipPlacement} modifiers={{offset:12}}>
      <PostsPreviewTooltipSingleWithComment postId={hit.postId} commentId={hit._id} />
    </PopperCard>
    <Link to={url} onClick={(event) => isLeftClick(event) && clickAction && clickAction()}>
      <div>
        <MetaInfo>{hit.authorDisplayName}</MetaInfo>
        <MetaInfo>{hit.baseScore} points </MetaInfo>
        <MetaInfo>
          <FormatDate date={hit.postedAt}/>
        </MetaInfo>
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="body" hit={hit} tagName="mark" />
      </div>
    </Link>
  </div>
}

const CommentsSearchHitComponent = registerComponent("CommentsSearchHit", CommentsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    CommentsSearchHit: typeof CommentsSearchHitComponent
  }
}

