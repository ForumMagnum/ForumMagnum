import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { unflattenComments } from "../../lib/utils/unflatten";
import { useMulti } from '../../lib/crud/withMulti';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: 600,
    fontVariant: "small-caps"
  },
  description: {
    marginTop: 18,
    ...commentBodyStyles(theme),
    marginBottom: 18,
  },
});

const TagDiscussionSection = ({classes, tag}: {
  classes: ClassesType,
  tag: TagBasicInfo
}) => {
  const {CommentsListSection } = Components;
  
  const { results, loadMore, loadingMore, totalCount } = useMulti({
    skip: !tag?._id,
    terms: {
      view: "commentsOnTag",
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
