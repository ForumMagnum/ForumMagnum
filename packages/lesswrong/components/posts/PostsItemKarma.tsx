import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { PopperPlacementType } from '@material-ui/core/Popper';

const PostsItemKarma = ({post, placement="left"}: {
  post: PostsBase,
  placement?: PopperPlacementType
}) => {
  return (
    <Components.KarmaDisplay document={post} placement={placement} />
  );
};

const PostsItemKarmaComponent = registerComponent('PostsItemKarma', PostsItemKarma);

declare global {
  interface ComponentTypes {
    PostsItemKarma: typeof PostsItemKarmaComponent,
  }
}
