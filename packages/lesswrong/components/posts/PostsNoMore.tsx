import { registerComponent } from '../../lib/vulcan-lib';
import React from "react";
import { FormattedMessage } from '../../lib/vulcan-i18n';

const PostsNoMore = props => <p className="posts-no-more"><FormattedMessage id="posts.no_more"/></p>;

const PostsNoMoreComponent = registerComponent('PostsNoMore', PostsNoMore);

declare global {
  interface ComponentTypes {
    PostsNoMore: typeof PostsNoMoreComponent
  }
}

