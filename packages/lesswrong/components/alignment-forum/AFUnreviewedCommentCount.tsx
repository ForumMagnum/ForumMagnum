import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import ContentStyles from '../common/ContentStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const SuggestAlignmentCommentMultiQuery = gql(`
  query multiCommentAFUnreviewedCommentCountQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SuggestAlignmentComment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    fontWeight: 400,
    marginTop: 32,
    display: "flex",
    justifyContent: "center"
  },
  viewLink: {
    marginLeft: 4
  }
});


const AFUnreviewedCommentCount = ({ post, classes }: {
  post: PostsBase,
  classes: ClassesType<typeof styles>,
}) => {
  
  //this gets number of comments submitted by non-members or suggested by members that haven't been processed yet
  const { data, loading } = useQuery(SuggestAlignmentCommentMultiQuery, {
    variables: {
      selector: { alignmentSuggestedComments: { postId: post._id } },
      limit: 10,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  
  const count = data?.comments?.results?.length ?? 0;
  
 if (loading || !count) {
   return null
 } else {
   return (
     <ContentStyles contentType="comment" className={classes.root}>
       {`There are ${count} comments pending acceptance to the Alignment Forum.`}
       <a href={`https://www.lesswrong.com/posts/${post._id}`} className={classes.viewLink}>View them on LessWrong.</a>
     </ContentStyles>
   );
 }
}

export default registerComponent('AFUnreviewedCommentCount', AFUnreviewedCommentCount, {styles});


