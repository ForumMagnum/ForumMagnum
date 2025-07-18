import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import {taggingNameSetting} from '../../lib/instanceSettings'
import EARecentDiscussionItem from "./EARecentDiscussionItem";
import TagRevisionItem from "../tagging/TagRevisionItem";
import { maybeDate } from "@/lib/utils/dateUtils";

const EARecentDiscussionTagRevision = ({
  tag,
  revision,
  collapsed,
  headingStyle,
  documentId,
}: {
  tag: TagRecentDiscussion,
  revision: RevisionHistoryEntry,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  documentId: string,
}) => {
  return (
    <EARecentDiscussionItem
      icon="TagFilled"
      iconVariant="green"
      user={revision.user}
      action={`edited ${taggingNameSetting.get()}`}
      tag={tag}
      timestamp={maybeDate(revision.editedAt)}
    >
      <TagRevisionItem
        tag={tag}
        revision={revision}
        collapsed={collapsed}
        headingStyle={headingStyle}
        documentId={documentId}
        showDiscussionLink={false}
        noContainer
      />
    </EARecentDiscussionItem>
  );
}

export default registerComponent(
  "EARecentDiscussionTagRevision",
  EARecentDiscussionTagRevision,
);


