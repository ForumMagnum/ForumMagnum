import React from 'react';
import { registerComponent, useMulti, Components } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts/collection.js';
import { useCurrentUser } from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
  },
});

const PingbacksList = ({postId}) => {
  const { results, loading } = useMulti({
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
  
  if (loading)
    return <Components.Loading/>
  
  if (results) {
    if (results.length > 0) {
      return <div>
        <div>Pingbacks</div>
        {results.map((post, i) =>
          <Components.PostsItem2 key={post._id} index={i} post={post} currentUser={currentUser} />
        )}
      </div>
    }
  }
  
  return null;
}

registerComponent("PingbacksList", PingbacksList, withStyles(styles, {name: "PingbacksList"}));
