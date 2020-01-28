import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts/collection';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';

const styles = createStyles(theme => ({
  root: {
    marginBottom: theme.spacing.unit*4
  },
  list: {
    marginTop: theme.spacing.unit
  }
}));

const PingbacksList = ({classes, postId}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "pingbackPosts",
      postId: postId,
    },
    collection: Posts,
    fragmentName: "PostsList",
    limit: 5,
    enableTotal: false,
    ssr: true
  });
  const currentUser = useCurrentUser();

  const { SectionSubtitle, Pingback, Loading } = Components

  if (loading)
    return <Loading/>
  
  if (results) {
    if (results.length > 0) {
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
        </div>
      </div>
    }
  }
  
  return null;
}

const PingbacksListComponent = registerComponent("PingbacksList", PingbacksList, {styles});

declare global {
  interface ComponentTypes {
    PingbacksList: typeof PingbacksListComponent
  }
}

