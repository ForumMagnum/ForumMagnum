import React from 'react';
import { taggingNameCapitalSetting, taggingNameIsSet } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import TagRevisionItem from "@/components/tagging/TagRevisionItem";
import CommentsNode from "@/components/comments/CommentsNode";
import NewTagItem from "@/components/tagging/NewTagItem";
import { SectionTitle } from "@/components/common/SectionTitle";

const TagActivityFeed = ({pageSize = 50}: {
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

const TagActivityFeedComponent = registerComponent("TagActivityFeed", TagActivityFeed);

declare global {
  interface ComponentTypes {
    TagActivityFeed: typeof TagActivityFeedComponent
  }
}

export default TagActivityFeedComponent;
