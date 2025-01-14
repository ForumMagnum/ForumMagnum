import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import { useMulti } from "../../lib/crud/withMulti";

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
  const { loading, count } = useMulti({
    terms: {view: "alignmentSuggestedComments", postId: post._id},
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
    fetchPolicy: 'cache-and-network',
  });
  
 if (loading || !count) {
   return null
 } else {
   return (
     <Components.ContentStyles contentType="comment" className={classes.root}>
       {`There are ${count} comments pending acceptance to the Alignment Forum.`}
       <a href={`https://www.lesswrong.com/posts/${post._id}`} className={classes.viewLink}>View them on LessWrong.</a>
     </Components.ContentStyles>
   );
 }
}

const AFUnreviewedCommentCountComponent = registerComponent('AFUnreviewedCommentCount', AFUnreviewedCommentCount, {styles});

declare global {
  interface ComponentTypes {
    AFUnreviewedCommentCount: typeof AFUnreviewedCommentCountComponent
  }
}
