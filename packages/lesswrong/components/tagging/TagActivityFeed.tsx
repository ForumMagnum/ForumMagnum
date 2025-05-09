import React from 'react';
import { taggingNameCapitalSetting, taggingNameIsSet } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { SingleColumnSection } from "../common/SingleColumnSection";
import { MixedTypeFeed } from "../common/MixedTypeFeed";
import { TagRevisionItem } from "./TagRevisionItem";
import { CommentsNode } from "../comments/CommentsNode";
import { NewTagItem } from "./NewTagItem";
import { SectionTitle } from "../common/SectionTitle";

const TagActivityFeedInner = ({pageSize = 50}: {
  pageSize?: number
}) => {
  return <SingleColumnSection>
    <SectionTitle title={`Recent ${taggingNameIsSet.get() ? taggingNameCapitalSetting.get() : 'Tag & Wiki'} Activity`}/>
    <MixedTypeFeed
      pageSize={pageSize}
      resolverName="AllTagsActivityFeed"
      sortKeyType="Date"
      renderers={{
        tagCreated: {
          fragmentName: "TagCreationHistoryFragment",
          render: (tag: TagCreationHistoryFragment) =>
            <NewTagItem tag={tag} />
        },
        tagRevision: {
          fragmentName: "RevisionTagFragment",
          render: (revision: RevisionTagFragment) => <div>
            {revision?.tag && <TagRevisionItem
              tag={revision.tag}
              revision={revision}
              headingStyle="full"
              documentId={revision.tag._id}
            />}
          </div>,
        },
        tagDiscussionComment: {
          fragmentName: "CommentsListWithParentMetadata",
          render: (comment: CommentsListWithParentMetadata) => <div>
            <CommentsNode
              treeOptions={{
                showPostTitle: true,
                tag: comment.tag || undefined,
              }}
              comment={comment}
              loadChildrenSeparately={true}
            />
          </div>
        }
      }}
    />
  </SingleColumnSection>
}

export const TagActivityFeed = registerComponent("TagActivityFeed", TagActivityFeedInner);


