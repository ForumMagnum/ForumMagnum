import { isEAForum } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const PostsItem = isEAForum ? Components.EAPostsItem : Components.LWPostsItem;

const PostsItemComponent = registerComponent("PostsItem", PostsItem);

declare global {
  interface ComponentTypes {
    PostsItem: typeof PostsItemComponent
  }
}
