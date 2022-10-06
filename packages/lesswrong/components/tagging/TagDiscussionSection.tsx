import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { unflattenComments } from "../../lib/utils/unflatten";
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
});

const TagDiscussionSection = ({classes, tag}: {
  classes: ClassesType,
  tag: TagBasicInfo
}) => {
  const {CommentsListSection } = Components;
  
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
  
  const nestedComments = !!results && unflattenComments(results);
  
  if (!nestedComments) return null
  
  return (
    <CommentsListSection
      comments={nestedComments} tag={tag ? tag : undefined}
      loadMoreComments={loadMore}
      totalComments={totalCount as number}
      commentCount={(results?.length) || 0}
      loadingMoreComments={loadingMore}
      newForm={true}
    />
  );
}

const TagDiscussionSectionComponent = registerComponent("TagDiscussionSection", TagDiscussionSection, {styles});


declare global {
  interface ComponentTypes {
    TagDiscussionSection: typeof TagDiscussionSectionComponent
  }
}
