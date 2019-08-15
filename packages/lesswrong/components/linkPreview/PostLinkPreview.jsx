import React from 'react';
import { Components, registerComponent, withDocument, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';
import { usePostBySlug } from '../posts/usePostBySlug.js';

const PostLinkPreview = ({href, targetLocation, innerHTML}) => {
  const postID = targetLocation.params._id;
  
  const { document: post, loading, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    
    documentId: postID,
  });
  
  return <Components.PostLinkPreviewWithPost post={post} error={error} href={href} innerHTML={innerHTML} />
}
registerComponent('PostLinkPreview', PostLinkPreview);

const PostLinkPreviewSequencePost = ({href, targetLocation, innerHTML}) => {
  const postID = targetLocation.params.postId;
  
  const { document: post, loading, error } = useSingle({
    collection: Posts,
    queryName: "postLinkPreview",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network',
    
    documentId: postID,
  });
  
  return <Components.PostLinkPreviewWithPost post={post} error={error} href={href} innerHTML={innerHTML} />
}
registerComponent('PostLinkPreviewSequencePost', PostLinkPreviewSequencePost);


const PostLinkPreviewSlug = ({href, targetLocation, innerHTML}) => {
  const slug = targetLocation.params.slug;
  const { post, loading, error } = usePostBySlug({ slug });
  
  return <Components.PostLinkPreviewWithPost href={href} innerHTML={innerHTML} post={post} error={error} />
}
registerComponent('PostLinkPreviewSlug', PostLinkPreviewSlug);

const PostLinkPreviewWithPost = ({href, innerHTML, post, error}) => {
  const linkElement = <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}}/>;
  if (!post) {
    return linkElement;
  }
  
  
  return (
    <Tooltip
      title={
        error
          ? error
          : <Components.PostsItemTooltip
              post={post}
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
registerComponent('PostLinkPreviewWithPost', PostLinkPreviewWithPost);