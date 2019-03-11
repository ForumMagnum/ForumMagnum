import { Components, registerComponent} from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { Snippet } from 'react-instantsearch-dom';
import { withStyles } from '@material-ui/core/styles';
import React from 'react';

const styles = theme => ({
  root: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit*2
  },
  snippet: {
    marginTop: theme.spacing.unit
  }
})

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const CommentsSearchHit = ({hit, clickAction, classes}) => {
  const url = "/posts/" + hit.postId + "/" + hit.postSlug + "#" + hit._id
  return <div className={classes.root}>
    <Link to={url} onClick={(event) => isLeftClick(event) && clickAction()}>
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

registerComponent("CommentsSearchHit", CommentsSearchHit, withStyles(styles, {name: "CommentsSearchHit"}));
