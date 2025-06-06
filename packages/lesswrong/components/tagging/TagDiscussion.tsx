import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments } from "../../lib/utils/unflatten";
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';
import CommentsList from "../comments/CommentsList";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const CommentsListMultiQuery = gql(`
  query multiCommentTagDiscussionQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

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
  const { data, loading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { tagDiscussionComments: { tagId: tag?._id } },
      limit: 7,
      enableTotal: true,
    },
    skip: !tag?._id,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.comments?.results;
  const totalCount = data?.comments?.totalCount ?? 0;

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

export default registerComponent("TagDiscussion", TagDiscussion, {styles});



