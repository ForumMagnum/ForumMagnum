import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper';

import grey from '@material-ui/core/colors/grey';

const styles = (theme: ThemeType): JssStyles => ({
    root: {
      padding: theme.spacing.unit,
      borderBottom: "solid 1px",
      borderBottomColor: grey[200],
      '&:hover': {
        backgroundColor: grey[100],
      }
    },
    postLink: {
      float:"right",
      marginRight: theme.spacing.unit
    }
  })

const PostsListEditorSearchHit = ({hit, classes}) => {
  return (
    <div className={classes.root}>
      <div>
        <Components.PostsTitle post={hit} isLink={false}/>
      </div>
      {hit.authorDisplayName && <Components.MetaInfo>
        {hit.authorDisplayName}
      </Components.MetaInfo>}
      <Components.MetaInfo>
        {hit.baseScore} points
      </Components.MetaInfo>
      {hit.postedAt && <Components.MetaInfo>
        <Components.FormatDate date={hit.postedAt}/>
      </Components.MetaInfo>}
      <Link to={Posts.getLink(hit)} target={Posts.getLinkTarget(hit)} className={classes.postLink}>
        (Link)
      </Link>
    </div>
  )
}


const PostsListEditorSearchHitComponent = registerComponent("PostsListEditorSearchHit", PostsListEditorSearchHit, {styles});

declare global {
  interface ComponentTypes {
    PostsListEditorSearchHit: typeof PostsListEditorSearchHitComponent
  }
}

