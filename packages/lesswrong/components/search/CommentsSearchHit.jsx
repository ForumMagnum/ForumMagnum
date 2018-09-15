import { Components, registerComponent} from 'meteor/vulcan:core';
import moment from 'moment';
import { Link } from 'react-router';
import { Snippet } from 'react-instantsearch/dom';
import React, { PureComponent } from 'react';
import defineComponent from '../../lib/defineComponent';

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
          {moment(new Date(hit.postedAt)).fromNow()}
        </Components.MetaInfo>
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attributeName="body" hit={hit} tagName="mark" />
      </div>
    </Link>
  </div>
}

export default defineComponent({
  name: "CommentsSearchHit",
  component: CommentsSearchHit,
  styles: styles,
});
