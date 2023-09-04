import { isEAForum } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isFriendlyUI } from "../../themes/forumTheme";

const PostsItem = isFriendlyUI ? Components.EAPostsItem : Components.LWPostsItem;

const PostsItemComponent = registerComponent("PostsItem", PostsItem);

declare global {
  interface ComponentTypes {
    PostsItem: typeof PostsItemComponent
  }
}
