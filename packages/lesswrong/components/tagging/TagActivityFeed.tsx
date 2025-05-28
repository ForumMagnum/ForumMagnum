import React from 'react';
import { taggingNameCapitalSetting, taggingNameIsSet } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection from "../common/SingleColumnSection";
import { MixedTypeFeed } from "../common/MixedTypeFeed";
import TagRevisionItem from "./TagRevisionItem";
import CommentsNodeInner from "../comments/CommentsNode";
import NewTagItem from "./NewTagItem";
import SectionTitle from "../common/SectionTitle";
import { AllTagsActivityFeedQuery } from '../common/feeds/feedQueries';

const TagActivityFeed = ({pageSize = 50}: {
  pageSize?: number
}) => {
  return <SingleColumnSection>
    <SectionTitle title={`Recent ${taggingNameIsSet.get() ? taggingNameCapitalSetting.get() : 'Tag & Wiki'} Activity`}/>
    <MixedTypeFeed
      pageSize={pageSize}
      query={AllTagsActivityFeedQuery}
      variables={{}}
      renderers={{
        tagCreated: {
          render: (tag: TagCreationHistoryFragment) =>
            <NewTagItem tag={tag} />
        },
        tagRevision: {
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
          render: (comment: CommentsListWithParentMetadata) => <div>
            <CommentsNodeInner
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

export default registerComponent("TagActivityFeed", TagActivityFeed);


