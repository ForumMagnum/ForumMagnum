import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts/collection';

const styles = theme => ({
  root: {
    marginBottom: theme.spacing.unit*4
  },
  list: {
    marginTop: theme.spacing.unit
  }
});

const PingbacksList = ({classes, postId}: {
  classes: ClassesType,
  postId: string,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "pingbackPosts",
      postId: postId,
    },
    collection: Posts,
    fragmentName: "PostsBase",
    limit: 5,
    enableTotal: false,
    ssr: true
  });

  const { SectionSubtitle, Pingback, Loading, LWTooltip } = Components

  if (loading)
    return <Loading/>
  
  if (results) {
    if (results.length > 0) {
      return <div className={classes.root}>
        <SectionSubtitle>
          <LWTooltip title="Posts that linked to this post" placement="right">
            <span>Pingbacks</span>
          </LWTooltip>
        </SectionSubtitle>
        <div className={classes.list}>
          {results.map((post, i) => 
            <div key={post._id} >
              <Pingback post={post}/>
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

