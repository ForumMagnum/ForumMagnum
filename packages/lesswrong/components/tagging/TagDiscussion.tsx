import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments } from "../../lib/utils/unflatten";
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType) => ({
  root: {
    width: 400,
    maxHeight: 600,
    overflowY: "auto",
    padding: 6
  },
  loading: {
    padding: 20,
    height: 100,
  },
  seeAll: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    marginLeft: 6,
    color: theme.palette.primary.main
  }
})

const TagDiscussion = ({classes, tag}: {
  classes: ClassesType<typeof styles>,
  tag: TagFragment | TagBasicInfo | TagCreationHistoryFragment
}) => {
  const { CommentsList, Loading } = Components;
  
  const { results, loading, totalCount } = useMulti({
    skip: !tag?._id,
    terms: {
      view: "tagDiscussionComments",
      tagId: tag?._id,
      limit: 7,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });

  if (!tag) return null
  if (loading) return <div  className={classNames(classes.root, classes.loading)} ><Loading /></div>
  if (results?.length === 0) return null
  
  const nestedComments = results && unflattenComments(results);
  
  return <div className={classes.root}>
    {results && <CommentsList
      treeOptions={{
        tag: tag,
        postPage: true,
        showCollapseButtons: true
      }}
      totalComments={totalCount}
      // Will be defined if results is defined, and we know results is truthy
      comments={nestedComments!}
    />}
    <Link
      to={tagGetDiscussionUrl(tag)}
      className={classes.seeAll}
    >
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
