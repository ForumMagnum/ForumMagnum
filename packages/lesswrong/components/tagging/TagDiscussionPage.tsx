import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil'
import { unflattenComments } from "../../lib/utils/unflatten";
import { useTagBySlug } from './useTag';
import { useMulti } from '../../lib/crud/withMulti';

const styles = theme => ({
});

const TagDiscussionPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagFragment");
  const {SingleColumnSection, CommentsListSection, Loading} = Components;
  
  const { loading: loadingComments, results, loadMore, loadingMore, totalCount } = useMulti({
    skip: !tag?._id,
    terms: {
      view: "commentsOnTag",
      tagId: tag?._id,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  
  const nestedComments = results && unflattenComments(results);
  
  return (
    <SingleColumnSection>
      <h1>{tag?.name}</h1>
      {(loadingTag || loadingComments) && <Loading/>}
      
      <CommentsListSection
        comments={nestedComments} tag={tag?tag:undefined}
        loadMoreComments={loadMore}
        totalComments={totalCount as number}
        commentCount={(results?.length) || 0}
        loadingMoreComments={loadingMore}
        newForm={true}
      />
    </SingleColumnSection>
  );
}

const TagDiscussionPageComponent = registerComponent("TagDiscussionPage", TagDiscussionPage, {styles});


declare global {
  interface ComponentTypes {
    TagDiscussionPage: typeof TagDiscussionPageComponent
  }
}
