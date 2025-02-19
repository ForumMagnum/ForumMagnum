import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";

import { useUpdate } from "../../../lib/crud/withUpdate";
import { userCanDo } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { preferredHeadingCase } from "../../../themes/forumTheme";

const MoveToFrontpageDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  if (!userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  const handleMoveToFrontpage = () => {
    if (!currentUser) {
      throw new Error("Cannot move to frontpage anonymously")
    }
    void updatePost({
      selector: {_id: post._id},
      data: {
        frontpageDate: new Date(),
        meta: false,
        draft: false,
        reviewedByUserId: currentUser._id,
      },
    });
  }

  const handleMoveToPersonalBlog = () => {
    if (!currentUser) {
      throw new Error("Cannot move to personal blog anonymously")
    }
    void updatePost({
      selector: {_id: post._id},
      data: {
        draft: false,
        meta: false,
        frontpageDate: null,
        reviewedByUserId: currentUser._id,
      },
    });
  }

  const {DropdownItem} = Components;

  if (!post.frontpageDate) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Move to Frontpage")}
        afterIcon={post.submitToFrontpage ? undefined : "Warning"}
        onClick={handleMoveToFrontpage}
      />
    );
  }

  if (post.frontpageDate || post.meta || post.curatedDate) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Move to Personal Blog")}
        onClick={handleMoveToPersonalBlog}
      />
    );
  }

  return null;
}

const MoveToFrontpageDropdownItemComponent = registerComponent(
  "MoveToFrontpageDropdownItem",
  MoveToFrontpageDropdownItem,
);

declare global {
  interface ComponentTypes {
    MoveToFrontpageDropdownItem: typeof MoveToFrontpageDropdownItemComponent
  }
}
