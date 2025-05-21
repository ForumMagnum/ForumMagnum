import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { userCanDo } from "../../../lib/vulcan-users/permissions";
import { useCurrentUser } from "../../common/withUser";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsListUpdateMutation = gql(`
  mutation updatePostMoveToFrontpageDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const MoveToFrontpageDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const [updatePost] = useMutation(PostsListUpdateMutation);

  if (!userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  const handleMoveToFrontpage = () => {
    if (!currentUser) {
      throw new Error("Cannot move to frontpage anonymously")
    }
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          frontpageDate: new Date(),
          meta: false,
          draft: false,
          reviewedByUserId: currentUser._id,
        }
      }
    });
  }

  const handleMoveToPersonalBlog = () => {
    if (!currentUser) {
      throw new Error("Cannot move to personal blog anonymously")
    }
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          draft: false,
          meta: false,
          frontpageDate: null,
          reviewedByUserId: currentUser._id,
        }
      }
    });
  }
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

export default registerComponent(
  "MoveToFrontpageDropdownItem",
  MoveToFrontpageDropdownItem,
);


