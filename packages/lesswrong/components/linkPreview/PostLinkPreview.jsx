import React from 'react';
import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';

const PostLinkPreview = ({href, targetLocation, innerHTML}) => {
  const postID = targetLocation.params._id;
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} documentId={postID} />
}
registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewWithPost = ({href, innerHTML, loading, document, error}) => {
  const linkElement = <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>;
  if (loading || !document) {
    return linkElement;
  }
  
  
  return (
    <Tooltip
      title={
        error
          ? error
          : <Components.PostsItemTooltip
              post={document}
              showTitle={true}
              author={true}
            />
      }
      TransitionProps={{ timeout: 0 }}
      placement="bottom-start"
      enterDelay={0}
      PopperProps={{ style: { pointerEvents: 'none' } }}
    >
      {linkElement}
    </Tooltip>
  );
}
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost,
  [withDocument, {
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
  }]
);