import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";

import { useItemsRead } from "../../hooks/useRecordPostView";
import { useNamedMutation } from "../../../lib/crud/withMutation";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import DropdownItem from "@/components/dropdowns/DropdownItem";

const MarkAsReadDropdownItem = ({post}: {post: PostsBase}) => {
  const {postsRead, setPostRead} = useItemsRead();
  const {mutate: markAsReadOrUnread} = useNamedMutation<{
    postId: string, isRead: boolean,
  }>({
    name: "markAsReadOrUnread",
    graphqlArgs: {postId: "String", isRead: "Boolean"},
  });

  const setRead = (value: boolean) => {
    void markAsReadOrUnread({
      postId: post._id,
      isRead: value,
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

const MarkAsReadDropdownItemComponent = registerComponent(
  "MarkAsReadDropdownItem",
  MarkAsReadDropdownItem,
);

declare global {
  interface ComponentTypes {
    MarkAsReadDropdownItem: typeof MarkAsReadDropdownItemComponent
  }
}

export default MarkAsReadDropdownItemComponent;
