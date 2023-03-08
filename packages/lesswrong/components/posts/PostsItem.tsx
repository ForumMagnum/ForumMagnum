import { isEAForum } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const PostsItem = isEAForum ? Components.FriendlyPostsItem : Components.PostsItem2;

const PostsItemComponent = registerComponent("PostsItem", PostsItem);

declare global {
  interface ComponentTypes {
    PostsItem: typeof PostsItemComponent
  }
}
