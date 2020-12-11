import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { unflattenComments } from "../../lib/utils/unflatten";
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 400,
    padding: 6
  },
  seeAll: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    marginLeft: 6,
    color: theme.palette.primary.main
  }
})

const TagDiscussion = ({classes, tag}: {
  classes: ClassesType,
  tag: TagFragment | TagBasicInfo | TagCreationHistoryFragment
}) => {
  const { CommentsList, Loading } = Components;
  
  const { results, loading, totalCount } = useMulti({
    skip: !tag?._id,
    terms: {
      view: "commentsOnTag",
      tagId: tag?._id,
      limit: 7,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });

  if (!tag) return null
  
  const nestedComments = results && unflattenComments(results);
  
  return <div className={classes.root}>
        {!results && loading ? <Loading/> : 
        <CommentsList
          treeOptions={{
            tag: tag,
            postPage: true,
          }}
          totalComments={totalCount}
          comments={nestedComments}
        />}
        <Link to={`/tag/${tag.slug}/discussion`} className={classes.seeAll}>
          See all
        </Link>
    </div>
}

const TagDiscussionComponent = registerComponent("TagDiscussion", TagDiscussion, {styles})


declare global {
  interface ComponentTypes {
    TagDiscussion: typeof TagDiscussionComponent
  }
}
