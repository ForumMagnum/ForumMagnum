import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
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
    />
  );
}

const TagDiscussionSectionComponent = registerComponent("TagDiscussionSection", TagDiscussionSection, {styles});


declare global {
  interface ComponentTypes {
    TagDiscussionSection: typeof TagDiscussionSectionComponent
  }
}
