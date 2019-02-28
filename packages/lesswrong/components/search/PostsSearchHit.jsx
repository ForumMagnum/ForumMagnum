import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link, withRouter } from 'react-router';
import { Snippet} from 'react-instantsearch-dom';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';

const styles = theme => ({
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

const PostsSearchHit = ({hit, clickAction, router, classes}) => {
  // If clickAction is provided, disable link and replace with Click of the action
  return <div className={classes.root}>
    <Link
      onClick={(event) => isLeftClick(event) && clickAction && clickAction()}
      to={Posts.getPageUrl(hit)}
      target={Posts.getLinkTarget(hit)}
    >
        <Components.PostsItemTitle post={hit} />
        {hit.authorDisplayName && <Components.MetaInfo>
          {hit.authorDisplayName}
        </Components.MetaInfo>}
        <Components.MetaInfo>
          {hit.baseScore} points
        </Components.MetaInfo>
        {hit.postedAt && <Components.MetaInfo>
          <Components.FormatDate date={hit.postedAt}/>
        </Components.MetaInfo>}
        <div><Snippet attribute="body" hit={hit} tagName="mark" /></div>
    </Link>
  </div>
}


registerComponent("PostsSearchHit", PostsSearchHit, withRouter, withStyles(styles, { name: "PostsSearchHit" }));
