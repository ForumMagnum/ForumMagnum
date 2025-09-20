import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useItemsRead } from "../../hooks/useRecordPostView";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const MarkAsReadDropdownItem = ({post}: {post: PostsBase}) => {
  const {postsRead, setPostRead} = useItemsRead();
  const [markAsReadOrUnread] = useMutation(gql(`
    mutation markAsReadOrUnread($postId: String, $isRead: Boolean) {
      markAsReadOrUnread(postId: $postId, isRead: $isRead)
    }
  `));

  const setRead = (value: boolean) => {
    void markAsReadOrUnread({
      variables: {
        postId: post._id,
        isRead: value,
      }
    });
    setPostRead(post._id, value);
  }

  const isRead = (post._id in postsRead) ? postsRead[post._id] : post.isRead;
  const title = isRead ? "Mark as Unread" : "Mark as Read";
  return (
    <DropdownItem
      title={preferredHeadingCase(title)}
      onClick={setRead.bind(null, !isRead)}
    />
  );
}

export default registerComponent(
  "MarkAsReadDropdownItem",
  MarkAsReadDropdownItem,
);


