import React from 'react';
import { postGetPageUrl, postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import './EmailPostDate';
import './EmailFooterRecommendations';
import { REVIEW_NAME_TITLE } from '../../lib/reviewUtils';

const styles = (theme: ThemeType): JssStyles => ({

});

const PostNominatedEmail = ({documentId, reason}: {
  documentId: string,
  reason?: string,
  classes: any,
}) => {
  const { document: post } = useSingle({
    documentId,
    
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    extraVariables: {
      version: 'String'
    }
  });
  if (!post) return null;
  return (<React.Fragment>

    <p>Your post {post.title} has received multiple positive votes for the {REVIEW_NAME_TITLE}. At the end of the Preliminary Voting Phase, the vote results will be published, and will be used to help prioritize the Review Phase.</p>
    
    <p>You're encouraged to write a self-review, exploring how you think about the post today. Do you still endorse it? Have you learned anything new that adds more depth? How might you improve the post?</p>
    
    <p>You can write a self-review by going to <a href={postGetPageUrl(post)}>your post</a> and clicking the "Write a Review" button</p>

    <p>You can see a list of nominated posts over at <a href="lesswrong.com/reviewVoting">the Review Dashboard page</a>. Posts with at least one review are sorted to the top.</p>

    <hr/>
    
    {reason && `You are receiving this email because ${reason}.`}
  </React.Fragment>);
}

const PostNominatedEmailComponent = registerComponent("PostNominatedEmail", PostNominatedEmail);

declare global {
  interface ComponentTypes {
    PostNominatedEmail: typeof PostNominatedEmailComponent
  }
}
