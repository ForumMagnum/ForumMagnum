import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Link } from "../../lib/reactRouterWrapper";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
})

const AlignmentPendingApprovalMessage = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  if (!currentUser) return null
  
  const userSubmittedPost = !!post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)
  
  if (!post.af && userSubmittedPost && forumTypeSetting.get() === 'AlignmentForum') {
    return (
      <div className={classes.root}>
        <p>
          This post is pending approval to the Alignment Forum and is currently only visible to you.
          However, it is already visible (and commentable) to everyone on LessWrong.
          {' '}
          <a href={`https://lesswrong.com/posts/${post._id}/${post.slug}`}>View your post on LessWrong</a>.
        </p>
        <p>
          For more info about Alignment Forum membership and posting policies, see <Link to={'/faq'}>the FAQ</Link>.
        </p>
      </div>
    );
  } else {
    return null
  }
}

export default registerComponent('AlignmentPendingApprovalMessage', AlignmentPendingApprovalMessage, {styles});


