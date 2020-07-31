import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil'
import { unflattenComments } from "../../lib/utils/unflatten";
import { useTagBySlug } from './useTag';
import { useMulti } from '../../lib/crud/withMulti';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = theme => ({
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

const TagDiscussionPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag } = useTagBySlug(slug, "TagFragment");
  const {SingleColumnSection, CommentsListSection } = Components;
  
  const { results, loadMore, loadingMore, totalCount } = useMulti({
    skip: !tag?._id,
    terms: {
      view: "commentsOnTag",
      tagId: tag?._id,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    ssr: true
  });
  
  const nestedComments = results && unflattenComments(results);
  
  return (
    <SingleColumnSection>
      <h1 className={classes.title}>{tag?.name}</h1>
      <p className={classes.description}>
        Use this page to discuss problems with the tag, ask for clarification about the tag, propose 
        merging or splitting the tag, or just discuss edits you want to make to the tag
      </p>
      
      <CommentsListSection
        comments={nestedComments} tag={tag ? tag : undefined}
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
