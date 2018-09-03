import { Components, registerComponent} from 'meteor/vulcan:core';
import moment from 'moment';
import { Link } from 'react-router';
import { Snippet } from 'react-instantsearch/dom';
import { withStyles } from '@material-ui/core/styles';
import React, { PureComponent } from 'react';

const styles = theme => ({
  root: {
    margin: theme.spacing.unit
  }
})

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const CommentsSearchHit = ({hit, clickAction, classes}) => {
  return <Link to={"/posts/" + hit.postId + "/" + hit.postSlug + "#" + hit._id} onClick={(event) => isLeftClick(event) && clickAction()} className={classes.root}>
    <div>
      <Components.MetaInfo>{hit.authorDisplayName}</Components.MetaInfo>
      <Components.MetaInfo>{hit.baseScore} points </Components.MetaInfo>
      <Components.MetaInfo>
        {moment(new Date(hit.postedAt)).fromNow()}
      </Components.MetaInfo>
    </div>
    <div>
      <Snippet attributeName="body" hit={hit} tagName="mark" />
    </div>
  </Link>
}

registerComponent("CommentsSearchHit", CommentsSearchHit, withStyles(styles));
