import { Components, registerComponent} from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import React from 'react';

const styles = theme => ({
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

const CommentsSearchHit = ({hit, clickAction, classes}: {
  hit: any,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const url = "/posts/" + hit.postId + "/" + hit.postSlug + "#" + hit._id
  return <div className={classes.root}>
    <Link to={url} onClick={(event) => isLeftClick(event) && clickAction && clickAction()}>
      <div>
        <Components.MetaInfo>{hit.authorDisplayName}</Components.MetaInfo>
        <Components.MetaInfo>{hit.baseScore} points </Components.MetaInfo>
        <Components.MetaInfo>
          <Components.FormatDate date={hit.postedAt}/>
        </Components.MetaInfo>
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

