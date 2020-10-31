import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useHover } from '../common/withHover';

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
  const { eventHandlers, hover, anchorEl } = useHover({
    pageElementContext: "postListEditorSearchHit",
  });
  const { LWPopper, PostsPreviewTooltipSingle, PostsTitle, MetaInfo, FormatDate} = Components

  return (
    <div className={classes.root} {...eventHandlers}>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="left"
        modifiers={{
          flip: {
            enabled: false,
          }
        }}
      >
        <PostsPreviewTooltipSingle postId={hit._id} postsList/>
      </LWPopper>
      <div>
        <PostsTitle post={hit} isLink={false}/>
      </div>
      {hit.authorDisplayName && <MetaInfo>
        {hit.authorDisplayName}
      </MetaInfo>}
      <MetaInfo>
        {hit.baseScore} points
      </MetaInfo>
      {hit.postedAt && <MetaInfo>
        <FormatDate date={hit.postedAt}/>
      </MetaInfo>}
      <Link to={postGetLink(hit)} target={postGetLinkTarget(hit)} className={classes.postLink}>
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

