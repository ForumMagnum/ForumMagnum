import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments } from "../../lib/utils/unflatten";
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';
import { CommentsList } from "../comments/CommentsList";
import { Loading } from "../vulcan-core/Loading";

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

const TagDiscussionInner = ({classes, tag}: {
  classes: ClassesType<typeof styles>,
  tag: TagFragment | TagBasicInfo | TagCreationHistoryFragment
}) => {
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

export const TagDiscussion = registerComponent("TagDiscussion", TagDiscussionInner, {styles})


declare global {
  interface ComponentTypes {
    TagDiscussion: typeof TagDiscussion
  }
}
