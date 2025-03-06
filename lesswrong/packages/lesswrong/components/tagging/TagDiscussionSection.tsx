import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import CommentsListSection from "@/components/comments/CommentsListSection";

const styles = (theme: ThemeType) => ({
});

const TagDiscussionSection = ({classes, tag}: {
  classes: ClassesType<typeof styles>,
  tag: TagBasicInfo
}) => {
  const [highlightDate,setHighlightDate] = useState<Date|undefined>(undefined);
  
  const { results, loadMore, loadingMore, totalCount } = useMulti({
    skip: !tag?._id,
    terms: {
      view: "tagDiscussionComments",
      tagId: tag?._id,
      limit: 500,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  
  if (!results)
    return null
  
  return (
    <CommentsListSection
      comments={results} tag={tag ? tag : undefined}
      loadMoreComments={loadMore}
      totalComments={totalCount as number}
      commentCount={(results?.length) || 0}
      loadingMoreComments={loadingMore}
      newForm={true}
      newFormProps={{enableGuidelines: false}}
      highlightDate={highlightDate}
      setHighlightDate={setHighlightDate}
    />
  );
}

const TagDiscussionSectionComponent = registerComponent("TagDiscussionSection", TagDiscussionSection, {styles});


declare global {
  interface ComponentTypes {
    TagDiscussionSection: typeof TagDiscussionSectionComponent
  }
}

export default TagDiscussionSectionComponent;
