import React from 'react';
import { registerComponent, useMulti, Components } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts/collection.js';
import { useCurrentUser } from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  root: {
    marginBottom: theme.spacing.unit*4
  },
  list: {
    marginTop: theme.spacing.unit
  }
});

const PingbacksList = ({classes, postId}) => {
  const { results, loading, loadMoreProps } = useMulti({
    terms: {
      view: "pingbackPosts",
      postId: postId,
    },
    collection: Posts,
    queryName: "pingbackPostList",
    fragmentName: "PostsList",
    limit: 5,
    enableTotal: false,
    ssr: true
  });
  const currentUser = useCurrentUser();

  const { SectionSubtitle, Pingback, Loading, LoadMore } = Components

  if (loading)
    return <Loading/>
  if (!results || !results.length)
    return null;
  
  return <div className={classes.root}>
    <SectionSubtitle>
      <Tooltip title="Posts that linked to this post" placement="right">
        <span>Pingbacks</span>
      </Tooltip>
    </SectionSubtitle>
    <div className={classes.list}>
      {results.map((post, i) =>
        <div key={post._id} >
          <Pingback post={post} currentUser={currentUser}/>
        </div>
      )}
      <LoadMore {...loadMoreProps}/>
    </div>
  </div>
}

registerComponent("PingbacksList", PingbacksList, withStyles(styles, {name: "PingbacksList"}));
